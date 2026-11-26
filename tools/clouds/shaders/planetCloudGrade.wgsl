struct PlanetCloudGrade {
  highlights: vec4<f32>,  // RGB, color lift
  shadows: vec4<f32>,     // RGB, shadow darkness
  rim: vec4<f32>,         // RGB, rim strength
  response: vec4<f32>,    // shadow strength, shadow edge, midtone lift, palette weight
  display: vec4<f32>,     // exposure, saturation, sun bleed, highlight pivot
  midtones: vec4<f32>,    // transmitted-light color and highlight feather
};

fn planetGradeLuma(color: vec3<f32>) -> f32 {
  return dot(color, vec3<f32>(.2126,.7152,.0722));
}

fn gradePlanetCloud(radiance: vec3<f32>, opacity: f32, grade: PlanetCloudGrade) -> vec3<f32> {
  let light = max(radiance, vec3<f32>(0.0));
  let deepShadow = mix(1.0, sceneDeepShadowGain(light, grade.shadows.w), smoothstep(.04, .28, opacity));
  if (grade.response.w <= 0.0 || opacity <= .001) { return light * deepShadow; }

  // Use the resolved lighting, with alpha only as confidence near the
  // silhouette. The same curves follow the clouds from flight to orbit.
  let luminance = planetGradeLuma(light);
  let coverage = smoothstep(.055,.28,opacity);
  // Warm or highly saturated light can have a bright channel and a low
  // luminance. Include some of that energy in the highlight response.
  let peak = max(light.r, max(light.g, light.b));
  let highlightEnergy = luminance + min(luminance, peak - luminance) * .38;
  let highlight = smoothstep(.15,.64,highlightEnergy);
  let midtone = smoothstep(.035,.24,luminance) * (1.0 - smoothstep(.34,.80,luminance));
  let shadowDrive = grade.response.x / (grade.response.x + 1.0);
  let shadowSoft = (1.0 - highlight) * clamp(shadowDrive * 1.65, 0.0, 1.0);
  let shadowEdge = grade.response.y / 2.2;
  let shadow = mix(shadowSoft, smoothstep(.17,.80,shadowSoft), shadowEdge);
  let palette = mix(grade.highlights.rgb, grade.shadows.rgb, shadow);
  let bodyPigment = palette / max(.24, planetGradeLuma(palette));
  let throughPigment = grade.midtones.rgb / max(.24, planetGradeLuma(grade.midtones.rgb));
  var pigment = mix(bodyPigment, throughPigment, midtone * (.44 - .27 * shadow));
  let pivot = grade.display.w;
  if (pivot > 0.0) {
    // Give each stop its own span of light, so adjacent presets stay
    // distinguishable in side light as well as at their brightest edge.
    let shadowPigment = grade.shadows.rgb / max(.10, planetGradeLuma(grade.shadows.rgb));
    let midPigment = grade.midtones.rgb / max(.15, planetGradeLuma(grade.midtones.rgb));
    let highPigment = grade.highlights.rgb / max(.20, planetGradeLuma(grade.highlights.rgb));
    let openShadows = smoothstep(pivot * .08, pivot, highlightEnergy);
    let lightFace = smoothstep(pivot * .74, pivot + grade.midtones.w, highlightEnergy);
    pigment = mix(mix(shadowPigment, midPigment, openShadows), highPigment, lightFace);
  }
  let colorMix = coverage * grade.response.w;
  var color = mix(light, luminance * pigment, colorMix);

  let lift = mix(1.0, grade.highlights.w, .34 + .50 * highlight);
  let midLift = mix(1.0, grade.response.z, .70 * midtone);
  let shadowGain = 1.0 / (1.0 + shadow * shadow * (.25 + .85 * min(grade.shadows.w, 6.0)));
  color *= mix(1.0, lift * midLift * shadowGain, coverage);

  // Rim color comes from existing light energy and fades out with opacity.
  // A dark or empty ray cannot acquire a bright painted outline.
  let rim = smoothstep(.025,.20,opacity) * (1.0 - smoothstep(.26,.68,opacity)) *
    smoothstep(.12,.52,luminance) * (1.0 - .65 * shadow);
  let rimPigment = grade.rim.rgb / max(.24, planetGradeLuma(grade.rim.rgb));
  let rimColor = mix(rimPigment * luminance, light, grade.display.z);
  return mix(color, rimColor, rim * clamp(grade.rim.w * .27, 0.0, .45)) * deepShadow;
}

// Match the Planet overlay in both views. Blend the finished cloud over the
// finished sky so a bright background can't tone-map away thin cloud detail.
fn planetCloudResolvedDisplay(cloudSample: vec4<f32>, grade: PlanetCloudGrade, exposure: f32,
    saturation: f32, atmosphere: f32, elevation: f32, rolloff: f32) -> vec3<f32> {
  let straight = cloudSample.rgb / max(cloudSample.a, .001);
  let graded = gradePlanetCloud(straight, cloudSample.a, grade);
  let nativeDisplay = planetCloudDisplayWithRolloff(graded, grade, rolloff);
  let weight = atmosphere * scenePlanetCloudWeight(elevation);
  if (weight <= 0.0) { return nativeDisplay; }
  let shaded = straight * sceneCloudShadowGain(straight, grade.shadows.w);
  let sceneRadiance = select(shaded, graded, grade.display.w > 0.0);
  return mix(nativeDisplay, sceneDisplayWithRolloff(sceneRadiance, exposure, saturation, rolloff), weight);
}

fn planetCloudDisplay(linear: vec3<f32>, grade: PlanetCloudGrade) -> vec3<f32> {
  return planetCloudDisplayWithRolloff(linear, grade, 0.0);
}

fn planetCloudDisplayWithRolloff(linear: vec3<f32>, grade: PlanetCloudGrade, rolloff: f32) -> vec3<f32> {
  let exposed = max(linear * grade.display.x, vec3<f32>(0.0));
  let luminance = planetGradeLuma(exposed);
  let chroma = (exposed - vec3<f32>(luminance)) * grade.display.y;
  // If saturation crosses the RGB gamut, reduce chroma together and keep
  // hue and luminance. Then compress bright channels by a common factor.
  let gamut = min(1.0, luminance / max(luminance, -min(chroma.r, min(chroma.g, chroma.b)) + .00001));
  let graded = sceneHighlightRolloff(select(max(vec3<f32>(luminance) + chroma, vec3<f32>(0.0)),
    max(vec3<f32>(luminance) + chroma * gamut, vec3<f32>(0.0)), grade.response.w > 0.0), rolloff);
  let peak = max(graded.r, max(graded.g, graded.b));
  let shoulder = .82 + .18 * (1.0 - exp(-max(0.0, peak - .82) / .18));
  let display = graded * min(1.0, shoulder / max(peak, .001));
  return select(12.92 * display, 1.055 * pow(display, vec3<f32>(1.0 / 2.4)) - .055,
    display > vec3<f32>(.0031308));
}

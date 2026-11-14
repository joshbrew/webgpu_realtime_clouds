// The default thin layer specializes the shared entry point so the GPU
// compiler can prune the other forms from the march and lighting probes.
override CLOUD_THIN_PLANET_FORM: bool = false;

fn planetFormType() -> f32 {
 if(CLOUD_THIN_PLANET_FORM){return 1.0;}
 return TUNE.formType;
}
fn planetShape(p:vec3<f32>,lod:f32,weather:vec4<f32>,ph:f32)->vec4<f32> {
 var moved=sphericalSampleDriftedWorld(p,vec3<f32>(NTransform.shapeOffsetWorld.x,0,NTransform.shapeOffsetWorld.z))-B.center;
 if(planetFormType()>=.5 && planetFormType()<4.5){
  moved=planetWarpPosition(p-B.center,NTransform.shapeOffsetWorld.x*6.283185307,planetFormType(),NTransform.planetWarpAmount,NTransform.planetWarpPhase);
  moved=sphericalDriftedWorld(B.center+moved,vec3<f32>(0,0,NTransform.shapeOffsetWorld.z))-B.center;
 }
 let scale=max(V.worldToUV*B.uvScale,EPS)*max(NTransform.shapeScale,EPS);
 if(isLenticular(planetFormType())){moved=normalize(moved)*V.planetRadius;}
 let domain=planetWeatherShapeDomain(moved*axisOrOne3(NTransform.shapeAxisScale)*scale,weather,ph,planetFormType(),
  V.planetRadius/max(V.planetRadius+mix(V.cloudBottom,V.cloudTop,ph),EPS));
 let phase=NTransform.shapeOffsetWorld.y;
 let shape=textureSampleLevel(shape3D,sampShape,planetEvolvingDomain(domain,phase),lod);
 return evolvePlanetCloudShape(shape,phase,planetFormType());
}
fn planetPhase(p:vec3<f32>)->f32 {return (length(p-B.center)-V.planetRadius-V.cloudBottom)/max(V.cloudTop-V.cloudBottom,EPS);}
fn planetWeather(p:vec3<f32>)->vec4<f32> {
 // Rotate the unit-sphere domain, not the equirectangular UV. Gas bands and
 // coverage travel with the shell without sliding through a longitude seam.
 let wind=NTransform.weatherOffsetWorld;
 var moved=sphericalDriftedWorld(p,wind);
 if(planetFormType()>=.5){
  moved=B.center+planetWarpDirection(normalize(p-B.center),wind.x*6.283185307,planetFormType(),NTransform.planetWarpAmount,NTransform.planetWarpPhase);
  if(planetFormType()<4.5){moved=sphericalDriftedWorld(moved,vec3<f32>(0,wind.y,wind.z));}
 }
 let uv=sphereUVFromWorld(moved);
 let latitudeScale=axisOrOne3(NTransform.weatherAxisScale).z*max(NTransform.weatherScale,EPS);
 return wrap2D(weather2D,samp2D,(uv-vec2<f32>(.5))*vec2<f32>(1,latitudeScale)+vec2<f32>(.5),0,0.0);
}
fn planetCloudForm(ph: f32, weather: vec4<f32>, shape: vec4<f32>) -> vec2<f32> {
 if(isMixedPlanetWeather(planetFormType())){
  return mixedPlanetWeatherForm(ph,weather,shape,C.globalCoverage,NTransform.shapeOffsetWorld.y);
 }
 if(isAnvilCloud(planetFormType())){
  return anvilCloudForm(ph,weather,shape,C.globalCoverage);
 }
 if(isSatelliteForm(planetFormType())){
  return realisticSatelliteForm(ph,weather,shape,C.globalCoverage,planetFormType(),NTransform.shapeOffsetWorld.y);
 }
 if(planetFormType()==1.0){
  return thinCloudForm(ph,weather,shape,C.globalCoverage);
 }
 if(planetFormType()==2.0){
  return dioramaCloudForm(ph,weather,shape,C.globalCoverage);
 }
 if(isPlanetFront(planetFormType())){
  return planetFrontForm(ph,weather,shape,C.globalCoverage);
 }
 if(isLenticular(planetFormType())){
  return lenticularForm(ph,weather,shape,C.globalCoverage);
 }
 if(isCumulusBank(planetFormType())){
  return cumulusBankForm(ph,weather,shape,C.globalCoverage,planetFormType());
 }
 return styledPlanetForm(ph,weather,shape);
}
fn planetMass(p:vec3<f32>,lod:f32)->f32 {
 let ph=planetPhase(p);if(ph<=0.0||ph>=1.0){return 0.0;}
 let weather=planetWeather(p);
 if(weather.b>1.0){return 0.0;}
 return styledPlanetDensityFromForm(planetCloudForm(ph,weather,planetShape(p,lod,weather,ph)),0.0)/max(C.globalDensity*10.0,EPS);
}
// The terrain pass handles mountains and shorelines. A conservative solid
// interior also clips the far side if the downsampled depth ray misses.
fn planetOcclusionDistance(ro:vec3<f32>, rd:vec3<f32>, terrain:f32)->f32 {
 let solid=intersectSphere_robust(ro-B.center,rd,V.planetRadius*0.96);
 return select(terrain,min(terrain,solid.x),solid.x>0.0&&solid.x<solid.y);
}

fn planetPixelRandom(p:vec2<u32>)->f32 {
 var h=(p.x*0x9e3779b9u)^(p.y*0x85ebca6bu)^0x68bc21ebu;
 h=(h^(h>>16u))*0x7feb352du;h=(h^(h>>15u))*0x846ca68bu;return f32((h^(h>>16u))>>8u)*(1.0/16777216.0);
}
@compute @workgroup_size(8,8,1)
fn computeCloudPlanet(@builtin(global_invocation_id) gid:vec3<u32>,@builtin(local_invocation_id) local:vec3<u32>) {
 if(all(local==vec3<u32>(0u))){
  wg_weatherDim=vec2<f32>(textureDimensions(weather2D));wg_maxMipW=f32(textureNumLevels(weather2D))-1.0;
  wg_boxMaxXZ=1.0;wg_verticalRefHalfY=max(B.half.y,EPS);wg_verticalRefBoxH=wg_verticalRefHalfY*2.0;
 }
 workgroupBarrier();
 var pix=vec2<i32>(gid.xy)+vec2<i32>(frame.originX,frame.originY);
 if(reproj.compactInterleave!=0u && temporalCellRateNormalized()>1u && reproj.frameIndex>0u){
  let mapped=compactTemporalPixel(gid.xy,temporalCellRateNormalized());if(mapped.z==0u){return;}pix=vec2<i32>(mapped.xy);
 }
 if(any(pix<vec2<i32>(0))||any(pix>=vec2<i32>(i32(frame.fullWidth),i32(frame.fullHeight)))){return;}
 let uv=(vec2<f32>(pix)+0.5)/vec2<f32>(f32(frame.fullWidth),f32(frame.fullHeight));let ndc=uv*2.0-1.0;
 var ro=V.camPos;if(CLOUD_USE_CUSTOM_POS!=0u){ro=posBuf[u32(pix.y)*frame.fullWidth+u32(pix.x)].xyz;}
 let rd=normalize(V.fwd+V.right*(ndc.x*V.aspect*tan(V.fovY*0.5))-V.up*(ndc.y*tan(V.fovY*0.5)));
 var intervals:vec4<f32>;
 var terrainDistance=1000000.0;
 var rayEnd=1000000.0;
 var mixedTerrainCoverage=0.0;
 if(V._v3>=0.5){
  let dims=vec2<i32>(textureDimensions(cloudTerrainTexture));
  let scene=textureLoad(cloudTerrainTexture,min(vec2<i32>(uv*vec2<f32>(dims)),dims-1),0);
  if(scene.a>0.0){terrainDistance=max(0.0,scene.a-0.0005);}
  let mixed=scene.g<0.0&&scene.r>0.0&&scene.r<1.0&&scene.a>0.0;
  mixedTerrainCoverage=select(0.0,scene.r,mixed);
  rayEnd=select(terrainDistance,1000000.0,mixed);
  // A terrain hit clips integration without moving the samples in front of it.
  intervals=sceneCloudIntervals(ro,rd,planetOcclusionDistance(ro,rd,1000000.0));
 }else{
  let hit=intersectSphericalCloudShellView(ro,rd);
  intervals=vec4<f32>(hit,hit.y,hit.y);
 }
 let firstLength=max(intervals.y-intervals.x,0.0);
 let pathLength=firstLength+max(intervals.w-intervals.z,0.0);
 let historyActive=reproj.enabled==1u||temporalCellRateNormalized()>1u||reproj.temporalBlend>0.0001;
 if(pathLength<=EPS||rayEnd<=intervals.x){storeLayerSample(pix,vec4<f32>(0.0),0.0,historyActive);return;}
 let h=max(V.cloudTop-V.cloudBottom,EPS);let shapeDims=vec3<f32>(textureDimensions(shape3D));
 let scale=max(V.worldToUV*B.uvScale*NTransform.shapeScale,EPS);
 let rayPixelScale=2.0*tan(V.fovY*0.5)/f32(frame.fullHeight);
 let detailScale=max(V.worldToUV*B.uvScale*4.0*NTransform.detailScale,EPS);
 let detailTexelsPerUnit=detailScale*f32(textureDimensions(detail3D).x);
 let maxDetailLod=f32(textureNumLevels(detail3D))-1.0;
 let baseSteps=f32(clamp(TUNE.maxSteps,16,160));
 let grazing=smoothstep(3.5,12.0,pathLength/h);
 let cameraRadius=length(ro-B.center);
 let cloudTopRadius=V.planetRadius+V.cloudTop;
 var orbitLimb=0.0;
 if(abs(planetFormType()-1.35)<.004){
  let cameraClearance=(cameraRadius-cloudTopRadius)/h;
  if(cameraClearance>2.0){
   let relativeOrigin=ro-B.center;
   let closest=relativeOrigin+rd*max(0.0,-dot(relativeOrigin,rd));
   let skim=smoothstep(-1.0,0.40,(length(closest)-V.planetRadius)/h);
   // Through the limb, long rays can turn thin wisps into an opaque ring.
   orbitLimb=skim*grazing*smoothstep(2.0,12.0,cameraClearance);
  }
 }
 // Horizon rays cross much more cloud than a vertical ray. Add strata only
 // on those long paths, with a partial last stratum to avoid step-count pops.
 let extraSteps=min(min(baseSteps*0.30,24.0),160.0-baseSteps);
 let stepBudget=baseSteps+grazing*extraSteps;
 let steps=i32(ceil(stepBudget));
 let invSteps=1.0/stepBudget;
 let baseProbe=clamp(1.7/(scale*shapeDims.x),h*.018,h*.16);
 let extinction=max(C.globalDensity,0.0)*0.34/h;
 let densityScale=max(C.globalDensity*10.0,EPS);
 let maxShapeLod=f32(textureNumLevels(shape3D))-1.0;
 var path=0.0;var tr=1.0;var color=vec3<f32>(0.0);
 var hiddenAlpha=0.0;
 // Use blue noise across pixels. Cycle through an eight-frame stratification
 // only when history is blending. Camera movement uses a stable phase.
 let noiseSize=vec2<i32>(textureDimensions(blueTex));
 var pixelPhase=planetPixelRandom(vec2<u32>(pix));
 if(all(noiseSize>vec2<i32>(1))){
  pixelPhase=textureLoad(blueTex,pix%noiseSize,0,0).r;
 }
 let phaseIndex=(reverseBits(reproj.frameIndex & 7u)>>29u);
 let temporalPhase=select(0.0,f32(phaseIndex)*0.125,reproj.temporalBlend>.05);
 // Keep strata more evenly spaced on long paths. A strong foreground bias
 // would still leave widely spaced samples in the far part of those rays.
 let nearFocus=mix(.18,.54,1.0-smoothstep(h,h*13.0,intervals.x));
 let focus=mix(nearFocus,.14,grazing);
 var stratum=1;
 var sunVisibility=1.0;var normal=normalize(ro+rd*intervals.x-B.center);
 var targetSun=1.0;var targetNormal=normal;
 let sun=normalize(L.sunDir);
 let forwardScatter=pow(max(dot(rd,sun),0.0),max(8.0,C.silverExponent*6.0));
 var lastDenseSample=-100;
 let neptune=planetFormType()>=5.5&&planetFormType()<6.5;
 let continuousLight=planetFormType()>=.5&&planetFormType()<4.5;
 let anvil=isAnvilCloud(planetFormType());
 let detailed=anvil||isCumulusBank(planetFormType())||isPlanetFront(planetFormType())||isThinOrDiorama(planetFormType());
 let texturedLight=anvil||isThinOrDiorama(planetFormType())||isMixedPlanetWeather(planetFormType())||isSatelliteForm(planetFormType());
 let skinErosion=select(select(0.053,0.091,detailed),0.119,anvil||isFineCumulus(planetFormType()));
 let sunStride=max(TUNE.sunStride,1);
 let normalStride=select(sunStride,min(sunStride,2),cameraRadius<cloudTopRadius+h*0.5);
 for(var i=0;i<=steps;i++){
  if(path>=pathLength||tr<0.012){break;}
  let farSide=path>=firstLength;
  let spanEnd=select(firstLength,pathLength,farSide);
  let fraction=min(f32(stratum)*invSteps,1.0);
  let boundary=select(pathLength*fraction*(1.0-focus+focus*fraction),pathLength,stratum>=steps);
  let end=min(boundary,spanEnd);
  let segmentStart=select(intervals.x+path,intervals.z+path-firstLength,farSide);
  if(segmentStart>=rayEnd){break;}
  let intervalLength=end-path;
  let segmentLength=min(intervalLength,rayEnd-segmentStart);
  // Use two interleaved phases so adjacent strata don't repeat a marching
  // pattern on long paths through a cloud deck.
  let phase=fract(pixelPhase+temporalPhase+f32(i/2)*0.754877666);
  let jitter=fract(phase+f32(i&1)*0.5);
  let sampleOffset=mix(.10+.80*jitter,jitter,grazing);
  let t=segmentStart+segmentLength*sampleOffset;
  path=end;
  if(end>=boundary){stratum++;}
  if(segmentLength<=EPS){continue;}
  let p=ro+rd*t;
  let relative=p-B.center;
  let radius=length(relative);
  let ph=(radius-V.planetRadius-V.cloudBottom)/h;
  if(ph>0.0&&ph<1.0){
   // Match texture detail to the screen footprint and to long march steps.
   let marchFootprint=intervalLength*mix(.36,.64,smoothstep(h,8.0*h,t));
   let footprint=max(max(t*rayPixelScale,marchFootprint),0.25/(scale*shapeDims.x));
   let lod=clamp(log2(max(footprint*scale*shapeDims.x,1.0)),0.0,maxShapeLod);
   let weather=planetWeather(p);
   if(weather.b>1.0){continue;}
   let s=planetShape(p,lod,weather,ph);
   let geometry=planetCloudForm(ph,weather,s);
   var density=styledPlanetDensityFromForm(geometry,0.0)/densityScale;
   if(density>0.0001){
    // A sample represents an entire ray segment. Filter the fine erosion over
    // that interval as well as the projected pixel, especially near the horizon.
    let detailFootprint=max(t*rayPixelScale,intervalLength);
    let detailLod=log2(max(detailFootprint*detailTexelsPerUnit,1.0));
    let detailWeight=1.0-smoothstep(1.5,3.5,detailLod);
    let erosionStrength=skinErosion*planetCloudErosionStrength(weather,planetFormType())*mix(.42,1.55,clamp(TUNE.definition,0.0,1.0));
    var erosion=erosionStrength*.46;
    if(detailWeight>0.0&&!isLenticular(planetFormType())){
     var detailPos=sphericalSampleDriftedWorld(p,NTransform.detailOffsetWorld)-B.center;
     if(planetFormType()>=.5 && planetFormType()<4.5){
      detailPos=planetWarpPosition(p-B.center,NTransform.detailOffsetWorld.x*6.283185307,planetFormType(),NTransform.planetWarpAmount,NTransform.planetWarpPhase);
      detailPos=sphericalDriftedWorld(B.center+detailPos,vec3<f32>(0,NTransform.detailOffsetWorld.y,NTransform.detailOffsetWorld.z))-B.center;
     }
     let detailDomain=planetEvolvingDomain(detailPos*detailScale,NTransform.shapeOffsetWorld.y*1.75);
     let detail=textureSampleLevel(detail3D,sampDetail,detailDomain,min(detailLod,maxDetailLod)).rgb;
     let grain=dot(detail,vec3<f32>(.42,.34,.24));
     let breakup=smoothstep(.23,.79,grain*.84+detail.g*.16);
     erosion=mix(erosion,breakup*erosionStrength,detailWeight);
    }
    density=styledPlanetDensityFromForm(geometry,erosion)/densityScale;
    // Feather weak extinction in the volume, before it can darken another bank.
    density*=smoothstep(0.0,select(.035,.065,detailed),density);
    if(density<=0.0001){continue;}
    let dense=density>.065;
    let firstDense=dense&&i-lastDenseSample>2;
    let lightingPhase=i;
    let radial=relative/radius;
    let sunElevation=dot(radial,sun);
    let day=smoothstep(-.16,.28,sunElevation);
    if(!continuousLight&&!neptune&&(firstDense||lightingPhase%normalStride==0)){
     // Reuse weather and analytically shift radial phase. Only three shape
     // probes: no extra weather/detail reads or nested normal raymarch.
     let probe=max(baseProbe,min(footprint*0.72,h*0.19));
     let baseline=geometry.x;
     let gradient=vec3<f32>(
      planetCloudForm(ph+radial.x*probe/h,weather,planetShape(p+vec3<f32>(probe,0,0),lod,weather,ph)).x,
      planetCloudForm(ph+radial.y*probe/h,weather,planetShape(p+vec3<f32>(0,probe,0),lod,weather,ph)).x,
      planetCloudForm(ph+radial.z*probe/h,weather,planetShape(p+vec3<f32>(0,0,probe),lod,weather,ph)).x)-vec3<f32>(baseline);
     targetNormal=normalizeOr(-gradient,radial);
    }
    if(!continuousLight&&(firstDense||lightingPhase%sunStride==0)){
     var od=0.0;var previous=0.0;
     for(var j=0;j<clamp(TUNE.sunSteps,1,3);j++){
      let distance=h*(0.12+f32(j)*0.25+f32(j*j)*0.16);
      od+=planetMass(p+sun*distance,min(lod+0.6,3.0))*(distance-previous)*extinction;previous=distance;
     }
     targetSun=exp(-od*1.15);
    }
    // Blend cached lighting between probes so grazing rays don't reveal slices.
    let lightBlend=select(0.32,0.72,firstDense);
    normal=normalizeOr(mix(normal,targetNormal,lightBlend),targetNormal);
    sunVisibility=mix(sunVisibility,targetSun,lightBlend);
    if(dense){lastDenseSample=i;}
    let lightNormal=normalizeOr(mix(normal,radial,select(0.0,.94,neptune)),radial);
    let ndotl=dot(lightNormal,sun);
    var diffuse=max(ndotl,0.0);
    var skyExposure=clamp(.5+.5*dot(lightNormal,radial),0.0,1.0);
    var sunlight=sunVisibility;
    let skin=1.0-smoothstep(.015,.14,geometry.x);
    if(continuousLight){
     skyExposure=clamp(.32+.57*ph+(s.b-.5)*.14,.24,.93);
     sunlight=1.0;
     if(day>.001){
      // Local slope and transmission come from the same continuous field at
      // every occupied step. A foreground puff cannot change the lighting
      // phase of a bank behind it.
      let probe=max(baseProbe,min(footprint*.85,h*.17));
      let nearHeight=ph+sunElevation*probe/h;
      let nearSun=planetCloudForm(nearHeight,weather,planetShape(p+sun*probe,lod,weather,nearHeight));
      // Fine erosion already changes the ray's opacity. Only resolved detail
      // should also affect the lighting, where it would otherwise flicker twice.
      let detailLighting=1.0-smoothstep(.25,2.25,detailLod);
      let slope=geometry.x-nearSun.x-(erosion-erosionStrength*.46)*skin*select(.35,.76,texturedLight)*detailLighting;
      // A longer integration interval spans several slopes. Soften the
      // lighting response only where those slopes are undersampled.
      let lightingFootprint=smoothstep(probe,probe*4.0,intervalLength);
      diffuse=smoothstep(-.085-.045*lightingFootprint,.13+.045*lightingFootprint,slope);
      let nearMass=smoothstep(-.012,.13,nearSun.x)*nearSun.y;
      var opticalDepth=nearMass*probe*1.45;
      if(TUNE.sunSteps>1){
       let reach=max(probe*2.6,h*.19);
       let farHeight=ph+sunElevation*reach/h;
       let farSun=planetCloudForm(farHeight,weather,planetShape(p+sun*reach,min(lod+.85,3.5),weather,farHeight));
       let farMass=smoothstep(-.012,.14,farSun.x)*farSun.y;
       opticalDepth+=farMass*(reach-probe);
      }
      sunlight=exp(-opticalDepth*extinction*.92);
     }
    }
    let visibility=sqrt(sunlight);
    let direct=sunlight*(.12+.88*diffuse)*day;
    // The billow and density samples already in hand give the underside
    // soft skylight and an exposed rim without a second shadow march.
    let ao=clamp(1.0-density*.28+(s.g-.5)*.18,.55,1.0);
    let baseBounce=.07+.12*visibility;
    let billowBounce=(.04+.25*sqrt(visibility))*(.55+.45*skyExposure)*(.72+.28*skin);
    let bounce=select(baseBounce,billowBounce,detailed)*day;
    let baseAmbient=(.12+.10*max(dot(lightNormal,radial),0.0))*ao;
    let billowAmbient=(.10+.15*skyExposure+.17*skin)*clamp(.72+.32*s.g+.15*s.b-density*.14,.55,1.10);
    let ambient=select(baseAmbient,billowAmbient,detailed);
    var light=C.frontLightColor*(direct+bounce)+C.shadowLightColor*ambient;
    if(TUNE.lightingFinish==2){
      let bands=0.18+smoothstep(0.25,0.35,diffuse)*0.40+smoothstep(0.65,0.75,diffuse)*0.42;
      light=mix(C.shadowLightColor*0.28,C.frontLightColor,bands*sunlight*day)+C.shadowLightColor*0.06;
    }
    let edgeScatter=select(pow(1.0-abs(dot(lightNormal,-rd)),2.0),skin*.68,continuousLight);
    let silverWeight=select(1.0,mix(.45,1.12,skin),detailed);
    light+=C.sunColor*max(C.silverIntensity,0.0)*visibility*day*forwardScatter*(0.08+edgeScatter*1.1)*silverWeight;
    if(detailed){light=light/(vec3<f32>(1.0)+light*0.44);}
    if(planetFormType()>=4.5){light*=gasWeatherColor(weather,planetFormType());}
    let limbRetention=1.0-orbitLimb*mix(.94,.55,smoothstep(.10,.60,density));
    let absorption=density*extinction*limbRetention;
    let alpha=1.0-exp(-absorption*segmentLength);
    let weight=tr*alpha;
    var hidden=0.0;
    if(segmentStart+segmentLength>terrainDistance){
     var foregroundAlpha=0.0;
     if(terrainDistance>segmentStart){
      foregroundAlpha=1.0-exp(-absorption*(terrainDistance-segmentStart));
     }
     // The covered fraction sees only foreground cloud. The clear fraction
     // retains the rest of this ray's color and transmittance.
     hidden=tr*(alpha-foregroundAlpha)*mixedTerrainCoverage;
    }
    hiddenAlpha+=hidden;
    color+=(weight-hidden)*light;
    tr*=1.0-alpha;
   }
  }
 }
 let alpha=max(0.0,1.0-tr-hiddenAlpha);
 let feather=smoothstep(0.0,max(TUNE.minOutputAlpha,0.0001),alpha);
 var result=vec4<f32>(color*feather,alpha*feather);
 if(CLOUD_WRITE_RGB==0u){result=vec4<f32>(0,0,0,result.a);}
 storeLayerSample(pix,result,0.0,historyActive);
}

// Signed angular distance to each curtain. Keeping thickness independent of
// the ray step prevents distant aurora from turning into wide glowing bands.
fn auroraCurtainOffsets(local: vec3<f32>, radii: vec2<f32>, angle: f32, flow: f32) -> vec4<f32> {
  let longitude = atan2(local.z, local.x) + select(0.0, 1.7, local.y < 0.0);
  let phase = saturate((length(local) - radii.x) / (radii.y - radii.x));
  let polarAngle = atan2(length(local.xz), abs(local.y));
  let drift = longitude + flow;
  let arc = angle * (0.66 + 0.17 * sin(2.0 * longitude + flow) +
    0.09 * sin(3.0 * longitude - flow * 0.7));
  let folds = angle * (0.065 * sin(7.0 * longitude - flow * 1.3) +
    0.033 * sin(13.0 * longitude + flow * 1.8));
  let lean = angle * phase * (0.14 + 0.10 * sin(3.0 * drift));
  let centerline = polarAngle - arc - lean;
  let spread = angle * (0.065 + 0.035 * sin(3.0 * longitude - flow));
  // Adjacent sheets spread apart and curl back together as the folds travel.
  return vec4<f32>(
    centerline - folds,
    centerline + angle * (0.17 + 0.085 * sin(4.0 * drift)) + folds * 0.65 + lean * 0.20,
    centerline - folds - spread * (1.0 + phase * 0.75),
    centerline + folds * 0.2 + spread * (1.0 + phase * 1.10)
  );
}

fn auroraSheetIntegral(distance: f32, width: f32) -> f32 {
  let x = clamp(distance / width, -1.0, 1.0);
  return width * x * (1.0 - x * x / 3.0);
}

// Integrate a thin, parabolic sheet across the ray segment, including when
// both endpoints miss it. Return its mean density and the covered midpoint.
fn auroraSheetSample(a: f32, b: f32, width: f32) -> vec2<f32> {
  let delta = b - a;
  if (abs(delta) < 0.00001) {
    let x = (a + b) * 0.5 / width;
    return vec2<f32>(max(0.0, 1.0 - x * x), 0.5);
  }
  let coverage = (auroraSheetIntegral(b, width) - auroraSheetIntegral(a, width)) / delta;
  let bounds = clamp((vec2<f32>(-width, width) - a) / delta, vec2<f32>(0.0), vec2<f32>(1.0));
  return vec2<f32>(max(coverage, 0.0), (bounds.x + bounds.y) * 0.5);
}

// Clip the visible aurora shell to terrain before accumulating its emission.
fn marchSceneAurora(ro: vec3<f32>, rd: vec3<f32>, terrainDistance: f32, clouds:vec3<f32>) -> vec4<f32> {
  let limit = planetOcclusionDistance(ro,rd,max(0.0,terrainDistance-0.0005));
  let intervals = sceneCloudIntervals(ro,rd,limit);
  let first = max(intervals.y - intervals.x, 0.0);
  let pathLength = first + max(intervals.w - intervals.z, 0.0);
  if (pathLength <= EPS) { return vec4<f32>(0.0); }

  let radii = shellNominalRadii();
  let capAngle = auroraCapAngleRad();
  let minPolarY = radii.x * cos(min(0.5 * PI, capAngle + auroraCapFeatherRad() * 1.35));
  let localOrigin = ro - B.center;
  // Clip each hemisphere independently, including when a ray starts under it.
  let north = V._c >= 0.0;
  let south = V._c <= 0.0;
  let y = localOrigin.y + rd.y * intervals;
  let nearReachesCap = first > EPS &&
    ((north && max(y.x, y.y) >= minPolarY) || (south && min(y.x, y.y) <= -minPolarY));
  let farReachesCap = intervals.w - intervals.z > EPS &&
    ((north && max(y.z, y.w) >= minPolarY) || (south && min(y.z, y.w) <= -minPolarY));
  if (!nearReachesCap && !farReachesCap) { return vec4<f32>(0.0); }

  var cloudSegments = vec4<f32>(0.0);
  if (clouds.x > 0.001) { cloudSegments = sceneShellIntervals(ro, rd, limit, clouds.yz); }
  let cloudLengths = max(cloudSegments.yw - cloudSegments.xz, vec2<f32>(0.0));
  let cloudLength = cloudLengths.x + cloudLengths.y;
  let cloudOpticalDepth = -log(max(1.0 - clouds.x, 0.0001));
  let height = radii.y - radii.x;
  let activeLength = select(0.0, first, nearReachesCap) + select(0.0, pathLength - first, farReachesCap);
  let steps = clamp(TUNE.maxSteps, 16, 64);
  let stride = max(activeLength / f32(steps), height / 40.0);
  let sun = normalize(L.sunDir);
  let weatherScale = max(abs(NTransform.weatherScale), EPS) * axisOrOne3(NTransform.weatherAxisScale).z;
  let pixelScale = 2.0 * tan(V.fovY * 0.5) / f32(frame.fullHeight);
  let scaleBase = max(abs(NTransform.shapeScale) * 22.0, 2.75);
  let shapeTexelsPerUnit = f32(textureDimensions(shape3D).x) * scaleBase /
    max(V.planetRadius * auroraCapAngleRad(), EPS);
  let spin = NTransform.weatherOffsetWorld.x * 2.0 * PI;
  let shapeFlow = NTransform.shapeOffsetWorld.x * 35.0;
  let detailFlow = NTransform.detailOffsetWorld.x * 18.0;
  let sheetWidth = clamp(capAngle * 0.019, 0.003, 0.008);
  var path = select(first, 0.0, nearReachesCap);
  let pathEnd = select(first, pathLength, farReachesCap);
  var opticalDepth = 0.0;
  var emission = vec3<f32>(0.0);
  for (var i = 0; i <= steps; i++) {
    if (path >= pathEnd || opticalDepth > 4.0) { break; }
    let farSide = path >= first;
    let segment = min(stride, select(first, pathEnd, farSide) - path);
    let start = select(intervals.x + path, intervals.z + path - first, farSide);
    path = min(path + segment, select(first, pathEnd, farSide));
    let a = localOrigin + rd * start;
    let b = a + rd * segment;
    let inNorth = north && max(a.y, b.y) >= minPolarY;
    let inSouth = south && min(a.y, b.y) <= -minPolarY;
    if (!inNorth && !inSouth) { continue; }

    let mid = a + rd * (segment * 0.5);
    let hemispherePhase = select(0.0, 1.7, mid.y < 0.0);
    let flow = shapeFlow * select(1.0, -0.78, mid.y < 0.0) + spin;
    let longitude = atan2(mid.z, mid.x) + hemispherePhase;
    // Open arcs with long quiet gaps. The smaller arcs drift and fade separately.
    let mainArc = smoothstep(0.01, 0.56, cos(longitude + flow * 0.23 - 0.8));
    let sideArc = smoothstep(0.40, 0.85, cos(longitude - flow * 0.18 + 1.8));
    if (max(mainArc, sideArc) < 0.001) { continue; }
    let offsetsA = auroraCurtainOffsets(a, radii, capAngle, flow);
    let offsetsB = auroraCurtainOffsets(b, radii, capAngle, flow);
    let mainSheet = auroraSheetSample(offsetsA.x, offsetsB.x, sheetWidth);
    let sideSheet = auroraSheetSample(offsetsA.y, offsetsB.y, sheetWidth * 0.72);
    let outerArc = mainArc * smoothstep(-0.10, 0.72, sin(3.0 * longitude - flow * 1.2));
    let innerArc = max(mainArc, sideArc) * smoothstep(0.18, 0.84, sin(2.0 * longitude + flow * 1.4));
    let outerSheet = auroraSheetSample(offsetsA.z, offsetsB.z, sheetWidth * 0.66);
    let innerSheet = auroraSheetSample(offsetsA.w, offsetsB.w, sheetWidth * 0.54);
    let weights = vec4<f32>(mainSheet.x, sideSheet.x, outerSheet.x, innerSheet.x) *
      vec4<f32>(mainArc, sideArc * 0.60, outerArc * 0.52, innerArc * 0.42);
    let sheets = dot(weights, vec4<f32>(1.0));
    if (sheets < 0.001) { continue; }

    let centers = vec4<f32>(mainSheet.y, sideSheet.y, outerSheet.y, innerSheet.y);
    let distance = start + segment * dot(centers, weights) / sheets;
    let p = ro + rd * distance;
    let local = p - B.center;
    let cap = auroraCapMask(p);
    if (cap > 0.0001) {
      let phase = saturate((length(local) - radii.x) / height);
      let xz = rotateXZ(local.xz, spin + hemispherePhase);
      let uv = auroraUVFromWorld(B.center + vec3<f32>(xz.x, local.y, xz.y));
      let warp = vec2<f32>(
        sin(4.0 * longitude + flow + phase * 3.0) * 0.012 +
          sin(9.0 * longitude - flow * 1.6 + uv.y * 12.0) * 0.004,
        sin(5.0 * longitude - flow * 0.85 + phase * 4.0) * 0.015
      );
      let warpedUV = uv + warp;
      let weatherUV = (warpedUV - vec2<f32>(0.5)) * vec2<f32>(1.0, weatherScale) + vec2<f32>(0.5);
      let weather = wrap2D(weather2D, samp2D, weatherUV, 0i, 0.0);
      let lod = clamp(log2(max(distance * pixelScale * shapeTexelsPerUnit, 1.0)), 0.0, wg_maxMipS);
      let uvw = auroraRibbonUVWFromUV(warpedUV, phase, NTransform.shapeOffsetWorld, scaleBase);
      let shape = wrap3D_shape(shape3D, sampShape, uvw, lod);
      // Keep the weather field as breakup inside the geometric curtain. A
      // threshold here can blank an entire pole when the sampled cap is dry.
      let activity = smoothstep(0.22, 0.75, dot(weather.rg, vec2<f32>(0.62, 0.38)));
      let breakup = smoothstep(0.16, 0.78, dot(shape.rgb, vec3<f32>(0.25, 0.50, 0.25)));
      let lowerEdge = smoothstep(0.015, 0.12, phase);
      let strength = max(C.globalDensity, 0.0) / 980.0 * max(C.globalCoverage, 0.0) / 1.12;
      let density = cap * lowerEdge * mix(0.48, 1.0, activity) * mix(0.55, 1.0, breakup) * strength;
      if (density > 0.0001) {
        let night = 1.0 - smoothstep(-0.16, 0.08, dot(normalize(local), sun));
        let anglePerPixel = distance * pixelScale / max(length(local.xz), EPS);
        let strands = 0.5 + 0.5 * sin(47.0 * longitude + sin(19.0 * longitude - flow) * 2.1 + detailFlow + phase * 0.6);
        let fineRays = mix(1.0, mix(0.46, 1.26, strands), 1.0 - smoothstep(0.18, 0.85, anglePerPixel * 47.0));
        let curtainTop = 0.60 + 0.37 * (0.5 + 0.5 * sin(5.0 * longitude + sin(9.0 * longitude - flow) + flow * 0.6));
        let heightProfile = (1.0 - smoothstep(0.16, curtainTop, phase)) * (1.2 + phase * 0.5);
        let weight = density * segment / height * night * sheets * fineRays * heightProfile * 14.0;
        let foreground = clamp(vec2<f32>(distance) - cloudSegments.xz, vec2<f32>(0.0), cloudLengths);
        let fraction = (foreground.x + foreground.y) / max(cloudLength, EPS);
        let transmission = exp(-cloudOpticalDepth * fraction);
        let palette = auroraSpectralColorAtUV(warpedUV, phase);
        let palettePeak = max(palette.r, max(palette.g, palette.b));
        let spectral = mix(palette, vec3<f32>(0.18, 1.0, 0.56) * palettePeak, 0.40);
        let warmTop = spectral * vec3<f32>(2.0, 0.36, 0.72);
        let color = mix(spectral, warmTop, smoothstep(0.30, 0.76, phase) * 0.42);
        emission += color * weight * transmission;
        opticalDepth += weight;
      }
    }
  }
  // Soft additive emission rolls off before reaching flat, clipped white.
  let brightness=max(max(emission.r,emission.g),emission.b);
  let radiance=emission/(1.0+brightness);
  // This layer is additive. Alpha bounds its premultiplied emission.
  return vec4<f32>(radiance,max(max(radiance.r,radiance.g),radiance.b));
}


@compute @workgroup_size(8,8,1)
fn computeSceneAurora(@builtin(global_invocation_id) gid: vec3<u32>, @builtin(local_invocation_id) local: vec3<u32>) {
  if (all(local == vec3<u32>(0u))) {
    wg_weatherDim = vec2<f32>(textureDimensions(weather2D));
    wg_maxMipW = f32(textureNumLevels(weather2D)) - 1.0;
    wg_maxMipS = f32(textureNumLevels(shape3D)) - 1.0;
  }
  workgroupBarrier();

  let rate = temporalCellRateNormalized();
  var pixel = vec2<i32>(gid.xy) + vec2<i32>(frame.originX, frame.originY);
  if (reproj.compactInterleave != 0u && rate > 1u && reproj.frameIndex > 0u) {
    let mapped = compactTemporalPixel(gid.xy, rate);
    if (mapped.z == 0u) { return; }
    pixel = vec2<i32>(mapped.xy);
  }
  let size = vec2<i32>(i32(frame.fullWidth), i32(frame.fullHeight));
  if (any(pixel < vec2<i32>(0)) || any(pixel >= size)) { return; }

  let uv = (vec2<f32>(pixel) + 0.5) / vec2<f32>(size);
  let screen = (uv * 2.0 - 1.0) * tan(V.fovY * 0.5);
  let ray = normalize(V.fwd + V.right * screen.x * V.aspect - V.up * screen.y);
  var scene = vec4<f32>(0.0);
  if (V._v3 >= 0.5) {
    let dims = vec2<i32>(textureDimensions(cloudTerrainTexture));
    scene = textureLoad(cloudTerrainTexture, clamp(vec2<i32>(uv * vec2<f32>(dims)), vec2<i32>(0), dims - 1), 0);
  }
  let distance = select(1000000.0, scene.a, scene.a > 0.0);
  let history = reproj.enabled == 1u || rate > 1u || reproj.temporalBlend > 0.0001;
  let aurora = marchSceneAurora(V.camPos, ray, distance, scene.rgb);
  storeLayerSample(pixel, aurora, 0.0, history);
}

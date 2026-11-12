// Shared cloud coordinates for raymarch, mesh extraction and mesh color.
// Two smooth spherical twists carry the baked curls through one another.
// No noise evaluation, simulation grid, texture rebake or additional reads.
fn gasZonalAngle(latitude:f32,wind:f32)->f32 {
 return wind+sin(wind*.7)*sin(latitude*14.0)*.12;
}
fn gasFlowTwist(d:vec3<f32>,axis:vec3<f32>,angle:f32)->vec3<f32> {
 // Small bounded angles permit a second-order rotation, avoiding
 // another sin/cos pair per twist. Normalize to keep the domain on the shell.
 return normalize(d+cross(axis,d)*angle+(axis*dot(axis,d)-d)*(angle*angle*.5));
}
fn planetWarpDirection(direction:vec3<f32>,wind:f32,form:f32,amount:f32,phase:f32)->vec3<f32> {
 let ordinary=form>=.5 && form<4.5;
 // Puffy/realistic clouds use gentle eddies without the gas giants' jet belts.
 let angle=select(wind+(gasZonalAngle(direction.y,phase)-phase)*amount,wind,ordinary);
 var d=vec3<f32>(direction.x*cos(angle)-direction.z*sin(angle),direction.y,direction.x*sin(angle)+direction.z*cos(angle));
 if(amount<=0.0 || phase==0.0){return d;}
 // Neptune retains its quiet zonal streaks. Hail Mary gets stronger eddies;
 // Jupiter's smaller cross-jet displacement preserves its broad belts.
 if(ordinary || form>=6.5 || (form>=4.5 && form<5.5)){
  let streetScale=select(1.0,0.28,isTradeWindStreet(form));
  let strength=select(select(.55,1.0,form>=6.5),.38,ordinary)*amount*streetScale;
  let a=vec3<f32>(.31045048,.91132238,.27039235);
  let b=vec3<f32>(-.73157458,.28060395,.62133731);
  let phaseA=dot(d,a)*11.0;
  d=gasFlowTwist(d,a,(sin(phaseA+phase*10.0)-sin(phaseA))*.065*strength);
  let phaseB=dot(d,b)*17.0;
  return gasFlowTwist(d,b,(sin(phaseB-phase*7.7)-sin(phaseB))*.040*strength);
 }
 return d;
}

// Ordinary clouds carry their 3D billows and fine erosion with the same flow
// as coverage. Preserve radius and the existing custom/gas shape rotation.
fn planetWarpPosition(p:vec3<f32>,wind:f32,form:f32,amount:f32,phase:f32)->vec3<f32> {
 if(form>=.5 && form<4.5){
  let radius=max(length(p),.000001);
  return planetWarpDirection(p/radius,wind,form,amount,phase)*radius;
 }
 return vec3<f32>(p.x*cos(wind)-p.z*sin(wind),p.y,p.x*sin(wind)+p.z*cos(wind));
}

fn isTradeWindStreet(form: f32) -> bool {
  return abs(form - 2.54) < 0.004;
}

// Move billows locally in their cached 3D field. The slower shared weather
// motion keeps fronts and wind streets coherent as their edges evolve.
fn planetEvolvingDomain(p:vec3<f32>,phase:f32)->vec3<f32> {
 let swell=vec3<f32>(sin(p.y*5.7+phase),sin(p.z*6.3-phase*.71),sin(p.x*5.1+phase*.47));
 let eddies=vec3<f32>(sin(p.z*13.2-phase*1.8),sin(p.x*11.3+phase*1.4),sin(p.y*14.1+phase*1.9));
 return p+vec3<f32>(.014,.009,-.011)*phase+swell*.064+eddies*.023;
}

// Independently phased volume channels change which regions cross the density
// threshold. The wind can move a whole cloud while its billows grow or decay.
fn evolvePlanetCloudShape(shape:vec4<f32>,phase:f32,form:f32)->vec4<f32> {
 if(form<.5 || form>=4.5 || phase==0.0 || isLenticular(form)){return shape;}
 let wispy=abs(form-2.51)<.004 || abs(form-2.53)<.004;
 let growth=sin(phase*1.66+shape.a*8.5)-sin(shape.a*8.5);
 let breakup=sin(phase*2.31+shape.r*8.9+shape.b*2.7)-sin(shape.r*8.9+shape.b*2.7);
 let strength=select(.26,.57,wispy);
 let drift=vec4<f32>((shape.g-.5)*growth,(shape.b-.5)*breakup,
  (shape.g-.5)*breakup*.75,growth*.12)*strength;
 return clamp(shape+drift,vec4<f32>(0),vec4<f32>(1));
}

// Default wrappers preserve external callers and the GPU benchmark baseline.
fn gasWeatherDirection(d:vec3<f32>,wind:f32,form:f32)->vec3<f32> {
 return planetWarpDirection(d,wind,form,1.0,wind);
}
fn planetCloudFlowPosition(p:vec3<f32>,wind:f32,form:f32)->vec3<f32> {
 return planetWarpPosition(p,wind,form,1.0,wind);
}

fn isDetailedCumulus(form: f32) -> bool {
  return form > 2.32 && form < 2.65;
}

fn isFineCumulus(form: f32) -> bool {
  return form > 2.39 && form < 2.65;
}

fn isLenticular(form: f32) -> bool {
  return abs(form - 2.56) < 0.004;
}

fn isCumulusBank(form: f32) -> bool {
  return (form > 2.20 && form < 2.30) || isDetailedCumulus(form);
}

// The horizontal footprint stays fixed through the height of each lens.
// Its two tapered cross-sections thin continuously into the surrounding sky.
fn lenticularForm(ph: f32, weather: vec4<f32>, shape: vec4<f32>, coverage: f32) -> vec2<f32> {
  let region = smoothstep(0.39, 0.72, weather.r * 0.68 + weather.g * 0.32);
  let footprint = dot(shape.rg, vec2<f32>(0.64, 0.36)) + (region - 0.5) * 0.20;
  let threshold = mix(0.73, 0.47, clamp(coverage, 0.0, 1.0));
  let thickness = smoothstep(threshold - 0.03, threshold + 0.17, footprint);
  let center = 0.42 + (weather.b - 0.5) * 0.21 + (shape.a - 0.5) * 0.15;
  let lowerLens = thickness * 0.17 - abs(ph - center);
  let upperLens = thickness * mix(0.03, 0.10, region) - abs(ph - center - 0.25);
  let form = min((footprint - threshold) * 1.35, max(lowerLens, upperLens) * 1.50);
  return vec2<f32>(form, smoothstep(-0.02, 0.05, form));
}

// Broad weather joins the low shoulders. The strongest 3D lobes reach
// through the upper envelope as turrets, with open gaps between banks.
fn cumulusBankForm(ph: f32, weather: vec4<f32>, shape: vec4<f32>, coverage: f32, formType: f32) -> vec2<f32> {
  if(abs(formType-2.25)<.004 || abs(formType-2.38)<.004){
    let bank=abs(formType-2.25)<.004;
    return convectiveTowerForm(ph,weather,shape,coverage,bank);
  }
  let detailed = isDetailedCumulus(formType);
  let fine = isFineCumulus(formType);
  let layered = formType >= 2.48 && formType < 2.58;
  let streets = isTradeWindStreet(formType);
  let weatherSignal = weather.r * 0.72 + weather.g * 0.28;
  let weatherSupport = smoothstep(0.28, 0.72, weatherSignal);
  let baseWeights = select(vec3<f32>(0.50, 0.37, 0.13), vec3<f32>(0.46, 0.38, 0.16), detailed);
  let weights = select(baseWeights, vec3<f32>(0.43, 0.37, 0.20), fine);
  var body = dot(shape.rgb, weights);
  if (abs(formType - 2.51) < 0.004 || abs(formType - 2.53) < 0.004) {
    body = dot(shape.rgb, vec3<f32>(0.35, 0.55, 0.10));
  }
  if (abs(formType - 2.55) < 0.004) {
    let rippleHeight = 0.44 + (weather.b - 0.5) * 0.24;
    let ripple = 1.0 - smoothstep(0.08, 0.29, abs(ph - rippleHeight));
    let mesh = dot(shape.rgb, vec3<f32>(0.23, 0.60, 0.17));
    let threshold = mix(0.68, 0.45, clamp(coverage, 0.0, 1.0));
    let openings = smoothstep(0.35, 0.73, weatherSignal);
    return vec2<f32>(mesh-threshold+(openings-.5)*.33-(1.0-ripple)*.38,ripple);
  }
  let turret = smoothstep(0.39, select(0.73, 0.68, detailed), body * 0.70 + shape.a * 0.30);
  let rise = smoothstep(0.19, 0.98, ph);
  let crest = (weather.b - 0.5) * select(select(0.29, 0.64, layered), 0.19, streets);
  let rollingBase = clamp(0.075 + crest * 0.22 + (shape.a - 0.5) * 0.16 + (shape.g - 0.5) * 0.11, 0.01, 0.21);
  let baseHeight = select(0.045 + (weather.b - 0.5) * 0.06, rollingBase, fine);
  let lower = smoothstep(baseHeight, baseHeight + 0.15, ph);
  let billowTop = clamp(0.68 + crest + (body - 0.53) * 0.48 + (shape.b - 0.5) * 0.13, 0.39, 0.99);
  let upper = 1.0 - smoothstep(billowTop - 0.18, billowTop, ph);
  let threshold = mix(0.77, 0.47, clamp(coverage, 0.0, 1.0)) + select(0.0, 0.074, detailed);
  let regionalStrength = select(select(0.21, 0.38, detailed), 0.49, fine);
  // Keep larger gaps between fine cloud fields. Coverage still controls the
  // amount of cloud inside the active weather regions.
  let clearing = select(0.0, (1.0 - smoothstep(0.35, 0.58, weatherSignal)) * 0.10, fine);
  let roll = select(0.0, (weather.b - 0.5) * 0.19 * upper, layered);
  let streetGap = select(0.0, (1.0 - smoothstep(0.32, 0.65, weather.b)) * 0.15, streets);
  let naturalTower = abs(formType - 2.42) < .004;
  // A connected foot gives way to successive smaller, notched billows.
  let ruffles = (shape.b - .52) * smoothstep(.12,.58,ph) * .25;
  let form = body - threshold + (weatherSupport - 0.5) * regionalStrength
    + (1.0 - rise) * weatherSupport * 0.11 - rise * mix(0.33, 0.12, turret)
    - (1.0 - lower * upper) * 0.39 - clearing + roll - streetGap
    + select(0.0,ruffles,naturalTower);
  return vec2<f32>(form, lower * upper);
}

fn isAnvilCloud(form:f32)->bool {
  return abs(form-2.44)<.004;
}

fn convectiveTowerForm(ph:f32,weather:vec4<f32>,shape:vec4<f32>,coverage:f32,bank:bool)->vec2<f32> {
  let amount=clamp(coverage,0.0,1.0);
  let threshold=mix(.73,select(.46,.41,bank),amount);
  let rise=smoothstep(.17,.92,ph);
  let start=.035+weather.a*.13+(shape.a-.5)*.09;
  let shelf=clamp(.35+weather.g*.56+(shape.g-.5)*.30+(shape.b-.5)*.18,.24,.98);
  let updraft=smoothstep(start,start+.12,ph)*(1.0-smoothstep(shelf-.16,shelf,ph));
  let lobe=dot(shape.rgb-vec3<f32>(.5),vec3<f32>(.19,.43,.24));
  let shoulders=weather.b*select(.08,.25,bank)*(1.0-rise);
  let turret=weather.r-threshold+lobe+shoulders-rise*select(.24,.15,bank);
  return vec2<f32>(turret-(1.0-updraft)*.78,updraft);
}

fn anvilCloudForm(ph:f32,weather:vec4<f32>,shape:vec4<f32>,coverage:f32)->vec2<f32> {
  let amount=clamp(coverage,0.0,1.0);
  let threshold=mix(.80,.43,amount);
  let rise=smoothstep(.15,.89,ph);
  let base=smoothstep(.04+weather.a*.12,.19+weather.a*.12,ph);
  let roof=.69+weather.g*.21+(shape.a-.5)*.055;
  let column=base*(1.0-smoothstep(roof-.02,roof+.075,ph));
  let stemTexture=dot(shape.rgb-vec3<f32>(.5),vec3<f32>(.20,.43,.24));
  let stem=weather.r-threshold+stemTexture-rise*.17-(1.0-column)*.87;
  let outflow=smoothstep(roof-.19,roof-.10,ph)*(1.0-smoothstep(roof-.045,roof+.032,ph));
  let fringe=(shape.b-.5)*.37+(shape.g-.5)*.19+(shape.r-.5)*.11;
  let canopy=weather.b-threshold-.055+fringe-(1.0-outflow)*.94;
  return vec2<f32>(max(stem,canopy),max(column,outflow));
}

fn isMixedPlanetWeather(form:f32)->bool {
  return abs(form-2.64)<.004;
}

// Base height, thickness, cellular-to-fibrous mix and coverage offset.
// Interpolate adjacent regimes from the advected sphere field once per sample.
const weatherProfiles=array<vec4<f32>,12>(
  vec4<f32>(.02,.18,.35,-.035), // Broken stratocumulus
  vec4<f32>(.04,.29,.12,.015),  // Fair-weather cumulus
  vec4<f32>(.05,.45,.10,-.015), // Island cumulus
  vec4<f32>(.05,.73,.23,.01),   // Towering cumulus
  vec4<f32>(.09,.82,.41,.045),  // Anvil towers
  vec4<f32>(.16,.24,.44,.02),   // Trade-wind streets
  vec4<f32>(.27,.20,.65,.005),  // Altocumulus ripples
  vec4<f32>(.34,.16,.26,.055),  // Lenticular waves
  vec4<f32>(.20,.40,.53,-.03),  // Frontal bands
  vec4<f32>(.41,.22,.86,.01),   // Wind-swept wisps
  vec4<f32>(.63,.24,.98,.04),   // Ice filaments
  vec4<f32>(.48,.15,.72,.065),  // Scattered high bands
);

fn mixedPlanetWeatherForm(ph:f32,weather:vec4<f32>,shape:vec4<f32>,coverage:f32)->vec2<f32> {
  let climate=clamp(weather.a,0.0,1.0)*11.0;
  let region=u32(floor(climate));
  let profile=mix(weatherProfiles[region],weatherProfiles[min(region+1u,11u)],
    smoothstep(0.0,1.0,fract(climate)));
  let tower=smoothstep(.28,.71,profile.y);
  let clouds=dot(shape.rgb,mix(vec3<f32>(.33,.45,.22),vec3<f32>(.42,.40,.18),tower));
  let ridgedDetail=(shape.b-.5)*mix(.12,.28,tower);
  let wisps=smoothstep(8.1,9.5,climate);
  let filaments=dot(shape.rgb,vec3<f32>(.14,.49,.37))-(1.0-shape.b)*wisps*.095;
  let band=(weather.b-.5)*.19*(.30+profile.z);
  let floorHeight=clamp(profile.x+band*.27+(shape.a-.5)*.085,.015,.79);
  let localHeight=(shape.a-.5)*(.06+tower*.36)+(shape.b-.5)*.083;
  let ceiling=clamp(floorHeight+profile.y+band+localHeight,floorHeight+.075,.975);
  let edge=min(.10,(ceiling-floorHeight)*.40);
  let envelope=smoothstep(floorHeight,floorHeight+edge,ph)*(1.0-smoothstep(ceiling-edge,ceiling,ph));
  let crest=smoothstep(ceiling-.19,ceiling-.12,ph)*(1.0-smoothstep(ceiling-.045,ceiling,ph));
  let shear=1.0-smoothstep(.32,1.18,abs(climate-4.0));
  let lens=1.0-smoothstep(.33,1.20,abs(climate-7.0));
  let lensEnvelope=smoothstep(.015,.059,(ceiling-floorHeight)*.53-abs(ph-(floorHeight+ceiling)*.5));
  let vertical=mix(envelope,lensEnvelope,lens);
  let threshold=mix(.74,.48,clamp(coverage,0.0,1.0))+profile.w;
  let clearAir=(weather.r-.62)*.55;
  let field=mix(clouds+ridgedDetail,filaments,profile.z)+band*.19 + crest*shear*.12;
  let slender=smoothstep(floorHeight,ceiling,ph)*tower*.10*(1.0-crest*shear);
  let erosion=(1.0-shape.b)*mix(.032,.086,wisps)*smoothstep(.08,.55,ph);
  return vec2<f32>(field-threshold+clearAir-(1.0-vertical)*.49-slender-erosion,
    vertical*mix(1.0,.52,wisps));
}

fn planetWeatherShapeDomain(domain:vec3<f32>,weather:vec4<f32>,ph:f32,form:f32)->vec3<f32>{
  if(isMixedPlanetWeather(form)){
    let regime=weather.a*11.0;
    let filament=smoothstep(8.1,9.5,regime);
    let streets=1.0-smoothstep(.2,1.4,abs(regime-5.3));
    let along=vec3<f32>(.36,.48,.80);
    let across=vec3<f32>(-.80,.60,0);
    let stretch=max(filament,streets*.54);
    // Stretch along fixed perpendicular axes so the mapping stays continuous
    // and keeps its volume throughout the blend.
    let shift=across*dot(domain,across)*.83-along*dot(domain,along)*.47;
    let scale=mix(.69,1.78,weather.g)*mix(.83,1.25,weather.a);
    return (domain+shift*stretch)*scale;
  }
  if(form==1.0){
    let along=vec3<f32>(.36,.48,.80);
    let across=vec3<f32>(-.80,.60,0);
    let shear=smoothstep(.19,.91,ph)*mix(.18,.73,weather.g);
    return domain + (across*dot(domain,across)*.52 - along*dot(domain,along)*.31)*shear;
  }
  if(isAnvilCloud(form)){
    // Winds aloft stretch and displace the thin canopy relative to the stem.
    let outflow=smoothstep(.37,.80,ph);
    let wind=vec3<f32>(.36,.48,.80);
    return domain-wind*(.48*dot(domain,wind)+.24)*outflow;
  }
  return domain;
}

fn planetCloudErosionStrength(weather:vec4<f32>,form:f32)->f32{
  if(isMixedPlanetWeather(form)){return mix(1.11,1.78,weather.a);}
  if(isAnvilCloud(form)){return 1.47;}
  if(form==1.0 || abs(form-2.38)<.004){return 1.56;}
  if(form==2.0){return 1.31;}
  return 1.0;
}

fn isRealisticSatellite(form: f32) -> bool {
  return abs(form - 1.35) < .004;
}

fn isThinOrDiorama(form: f32) -> bool {
  return form == 1.0 || form == 2.0;
}

// A ragged low deck and occasional higher wisps occupy different heights.
// Clear pockets keep the deck open even where the billow field is strong.
fn thinCloudForm(ph: f32, weather: vec4<f32>, shape: vec4<f32>, coverage: f32) -> vec2<f32> {
  let amount = clamp(coverage, 0.0, 1.0);
  let deck = smoothstep(.22, .77, weather.r);
  let clearing = smoothstep(.18, .68, weather.a);
  let start = .095 + (weather.b - .5) * .19 + (shape.a - .5) * .18;
  let top = clamp(.43 + deck * .32 + (shape.g - .5) * .45 + (shape.b - .5) * .13, .28, .94);
  let layer = smoothstep(start, start + .18, ph) * (1.0 - smoothstep(top - .19, top, ph));
  let mass = dot(shape.rgb, vec3<f32>(.27,.40,.33));
  let threshold = mix(.73,.49,amount);
  let body = mass - threshold + (deck - .46) * .38 - (1.0 - clearing) * .14 - (1.0 - layer) * .39;
  let wisps = smoothstep(.46,.67,ph) * (1.0-smoothstep(.76,.96,ph));
  let veil = dot(shape.gb, vec2<f32>(.46,.54)) - threshold - .095
    + (deck - .5) * .28 + (weather.g - .52) * .20 - (1.0 - wisps) * .46;
  return vec2<f32>(max(body,veil), max(layer,wisps*.42));
}

// Rounded large volumes keep their sculpted silhouette. Smaller linked
// billows carve notches in the upper lobes and leave holes between banks.
fn dioramaCloudForm(ph: f32, weather: vec4<f32>, shape: vec4<f32>, coverage: f32) -> vec2<f32> {
  let amount = clamp(coverage, 0.0, 1.0);
  let groups = smoothstep(.25,.80,weather.r);
  let core = dot(shape.rgb,vec3<f32>(.40,.42,.18));
  let lower = smoothstep(.02 + weather.b*.08,.20 + weather.b*.09,ph);
  let crest = smoothstep(.30,.81,core*.59+shape.a*.41);
  let top = clamp(.31 + crest*.48 + groups*.10 + (weather.g-.5)*.17 + (shape.b-.5)*.21,.26,.95);
  let upper = 1.0 - smoothstep(top-.18,top,ph);
  let envelope = lower*upper;
  let shoulder = (shape.g-.48)*(.08 + .16*smoothstep(.27,.70,ph));
  let form = core - mix(.80,.53,amount) + (groups-.59)*.42
    + shoulder - (1.0-envelope)*.47;
  return vec2<f32>(form,envelope);
}

fn realisticSatelliteForm(ph: f32, weather: vec4<f32>, shape: vec4<f32>, coverage: f32) -> vec2<f32> {
  let front = weather.r;
  let bottom = .08 + (weather.g-.50)*.16;
  let ceiling = clamp(.44 + .25*weather.b + (shape.g-.5)*.19,.32,.86);
  let deck = smoothstep(bottom,bottom+.14,ph)*(1.0-smoothstep(ceiling-.18,ceiling,ph));
  let high = smoothstep(.46,.68,ph)*(1.0-smoothstep(.81,.99,ph));
  let threshold = mix(.70,.32,clamp(coverage,0.0,1.0));
  let textureDetail = dot(shape.rgb-vec3<f32>(.5),vec3<f32>(.05,.16,.17));
  let bank = front - threshold + textureDetail - (1.0-deck)*.64;
  let cirrus = weather.a*.57 - threshold - .045 + textureDetail*.71 - (1.0-high)*.53;
  return vec2<f32>(max(bank,cirrus),max(deck,high*.42));
}

fn isPlanetFront(form: f32) -> bool {
  return (form > 1.2 && form < 1.5) || abs(form-2.60)<.004;
}

fn planetFrontForm(ph: f32, weather: vec4<f32>, shape: vec4<f32>, coverage: f32) -> vec2<f32> {
  let core = smoothstep(0.27, 0.84, weather.r);
  let crest = (weather.b - 0.5) * 0.34;
  let base = clamp(0.06 + crest * 0.20 + (shape.a - 0.5) * 0.19 + (shape.g - 0.5) * 0.14, 0.01, 0.22);
  let top = clamp(0.36 + core * 0.51 + crest + (shape.g - 0.5) * 0.16, 0.28, 0.99);
  let envelope = smoothstep(base, base + 0.16, ph) * (1.0 - smoothstep(top - 0.24, top, ph));
  let detail = dot(shape.rgb - vec3<f32>(0.5), vec3<f32>(0.20, 0.20, 0.12));
  let mass = weather.r * 0.67 + detail;
  let threshold = mix(0.61, 0.22, clamp(coverage, 0.0, 1.0));
  return vec2<f32>(mass - threshold - (1.0 - envelope) * 0.58, envelope);
}

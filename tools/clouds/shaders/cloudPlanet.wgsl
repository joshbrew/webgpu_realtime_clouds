// The default thin layer specializes the shared entry point so the GPU
// compiler can prune the other forms from the march and lighting probes.
override CLOUD_THIN_PLANET_FORM: bool = false;
// Separate the gas lighting probes from the continuous lighting used by weather.
override CLOUD_GAS_PLANET_FORM: bool = false;
// Known weather presets keep the same equations with a compile-time form.
override CLOUD_WEATHER_PLANET_FORM: f32 = 0.0;
@group(1) @binding(18) var planetPhotoTexture: texture_2d_array<f32>;

fn planetFormType() -> f32 {
 if(CLOUD_THIN_PLANET_FORM){return 1.0;}
 if(CLOUD_WEATHER_PLANET_FORM > 0.0){return CLOUD_WEATHER_PLANET_FORM;}
 return TUNE.formType;
}
// One lane prepares the rigid rotations shared by the view and light rays.
struct PlanetRayMotion {
  shape: vec4<f32>,
  detail: vec4<f32>,
  weather: vec4<f32>,
  eddyStrength: f32,
};
var<workgroup> wg_planetMotion: PlanetRayMotion;

fn planetWindRotation(offset: vec3<f32>) -> vec4<f32> {
  let longitude = offset.x * 6.283185307;
  let meridian = offset.z * 6.283185307;
  return vec4<f32>(cos(longitude), sin(longitude), cos(meridian), sin(meridian));
}

fn preparePlanetRayMotion() {
  wg_planetMotion.shape = planetWindRotation(NTransform.shapeOffsetWorld);
  wg_planetMotion.detail = planetWindRotation(NTransform.detailOffsetWorld);
  wg_planetMotion.weather = planetWindRotation(NTransform.weatherOffsetWorld);
  let strength = .38 * NTransform.planetWarpAmount * select(1.0, .28, isTradeWindStreet(planetFormType()));
  wg_planetMotion.eddyStrength = strength;
}

fn planetRayWindDirection(direction: vec3<f32>, rotation: vec4<f32>) -> vec3<f32> {
  let rotated = vec3<f32>(direction.x * rotation.x - direction.z * rotation.y, direction.y,
    direction.x * rotation.y + direction.z * rotation.x);
  if (NTransform.planetWarpAmount <= 0.0 || NTransform.planetWarpPhase == 0.0) { return rotated; }
  return planetFlowEddies(rotated, wg_planetMotion.eddyStrength, NTransform.planetWarpPhase);
}

fn planetRayMeridian(relative: vec3<f32>, rotation: vec4<f32>, lift: f32) -> vec3<f32> {
  return vec3<f32>(relative.x, rotation.z * relative.y - rotation.w * relative.z + lift,
    rotation.w * relative.y + rotation.z * relative.z);
}

fn planetRayDrift(relative: vec3<f32>, radius: f32, rotation: vec4<f32>, lift: f32) -> vec3<f32> {
  let r = max(radius, .000001);
  let warped = B.center + planetRayWindDirection(relative / r, rotation) * r;
  return B.center + planetRayMeridian(warped - B.center, rotation, lift) - B.center;
}

fn planetMaterialRelative(relative: vec3<f32>, radius: f32) -> vec3<f32> {
 if (V.cloudHeightOffset == 0.0) { return relative; }
 return relative * (max(radius - V.cloudHeightOffset, EPS) / max(radius, EPS));
}

fn planetShapeAt(relative: vec3<f32>, radius: f32, lod: f32, weather: vec4<f32>, ph: f32) -> vec4<f32> {
 let material = planetMaterialRelative(relative, radius);
 let materialRadius = radius - V.cloudHeightOffset;
 let p = B.center + material;
 var moved: vec3<f32>;
 if (CLOUD_WEATHER_PLANET_FORM > 0.0) {
  moved = planetRayDrift(material, materialRadius, wg_planetMotion.shape, 0.0);
 } else if (!CLOUD_GAS_PLANET_FORM) {
  moved=planetWarpPosition(p-B.center,NTransform.shapeOffsetWorld.x*6.283185307,planetFormType(),NTransform.planetWarpAmount,NTransform.planetWarpPhase);
  moved=sphericalDriftedWorld(B.center+moved,vec3<f32>(0,0,NTransform.shapeOffsetWorld.z))-B.center;
 } else {
  moved=sphericalSampleDriftedWorld(p,vec3<f32>(NTransform.shapeOffsetWorld.x,0,NTransform.shapeOffsetWorld.z))-B.center;
 }
 let scale=max(V.worldToUV*B.uvScale,EPS)*max(NTransform.shapeScale,EPS);
 if(isLenticular(planetFormType())){moved=normalize(moved)*V.planetRadius;}
 let domain=planetWeatherShapeDomain(moved*axisOrOne3(NTransform.shapeAxisScale)*scale,weather,ph,planetFormType(),
  V.planetRadius/max(V.planetRadius+mix(V.cloudBottom,V.cloudTop,ph)-V.cloudHeightOffset,EPS));
 let phase=NTransform.shapeOffsetWorld.y;
 let shape=textureSampleLevel(shape3D,sampShape,planetEvolvingDomain(domain,phase),lod);
 return evolvePlanetCloudShape(shape,phase,planetFormType());
}
fn planetShape(p: vec3<f32>, lod: f32, weather: vec4<f32>, ph: f32) -> vec4<f32> {
 let relative = p - B.center;
 return planetShapeAt(relative, length(relative), lod, weather, ph);
}
fn planetPhase(p:vec3<f32>)->f32 {return (length(p-B.center)-V.planetRadius-V.cloudBottom)/max(V.cloudTop-V.cloudBottom,EPS);}
fn planetWeather(p:vec3<f32>)->vec4<f32> {
 // Rotate the unit-sphere domain, not the equirectangular UV. Gas bands and
 // coverage travel with the shell without sliding through a longitude seam.
 let wind=NTransform.weatherOffsetWorld;
 var moved=sphericalDriftedWorld(p,wind);
 if(planetFormType()>=.5){
  moved=B.center+planetWarpDirection(normalize(p-B.center),wind.x*6.283185307,planetFormType(),NTransform.planetWarpAmount,NTransform.planetWarpPhase);
  if(!CLOUD_GAS_PLANET_FORM){moved=sphericalDriftedWorld(moved,vec3<f32>(0,wind.y,wind.z));}
 }
 return planetWeatherAt(moved);
}
fn planetRayWeather(p: vec3<f32>) -> vec4<f32> {
 if (CLOUD_WEATHER_PLANET_FORM <= 0.0) { return planetWeather(p); }
 let rotation = wg_planetMotion.weather;
 let warped = B.center + planetRayWindDirection(normalize(p - B.center), rotation);
 let moved = B.center + planetRayMeridian(warped - B.center, rotation, NTransform.weatherOffsetWorld.y);
 return planetWeatherAt(moved);
}
fn planetWeatherAt(moved: vec3<f32>) -> vec4<f32> {
 let uv=sphereUVFromWorld(moved);
 let latitudeScale=axisOrOne3(NTransform.weatherAxisScale).z*max(NTransform.weatherScale,EPS);
 return wrap2D(weather2D,samp2D,(uv-vec2<f32>(.5))*vec2<f32>(1,latitudeScale)+vec2<f32>(.5),0,0.0);
}
@compute @workgroup_size(8, 8)
fn capturePlanetRegionWeather(@builtin(global_invocation_id) id: vec3<u32>,
    @builtin(local_invocation_index) local: u32) {
  if (local == 0u) {
    wg_weatherDim = vec2<f32>(textureDimensions(weather2D));
    wg_maxMipW = f32(textureNumLevels(weather2D)) - 1.0;
  }
  workgroupBarrier();
  let width = regionWeatherWidth();
  if (id.x >= width || id.y >= width) { return; }
  let direction = regionWeatherDirection(id.xy, width);
  let position = B.center + direction * V.planetRadius;
  regionWeatherPixels[id.y * width + id.x] = pack4x8unorm(planetWeather(position));
}

fn planetCloudForm(ph: f32, weather: vec4<f32>, shape: vec4<f32>) -> vec2<f32> {
 if(CLOUD_GAS_PLANET_FORM){return styledPlanetForm(ph,weather,shape);}
 return planetWeatherVolumeForm(ph,weather,shape,C.globalCoverage,planetFormType(),NTransform.shapeOffsetWorld.y);
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
 let radius = select(V.planetRadius * .96, max(V.planetRadius * .50, V._b), localPlanetShellMode());
 let solid=intersectSphere_robust(ro-B.center,rd,radius);
 return select(terrain,min(terrain,solid.x),solid.x>0.0&&solid.x<solid.y);
}

// Upper bounds use the [0,1] shape channels produced by the evolving sampler.
fn planetTowerCanContribute(ph: f32, weather: vec4<f32>, bank: bool) -> bool {
  let heights = convectiveTowerHeights(weather, vec4<f32>(0.0, 1.0, 1.0, 0.0));
  if (ph <= heights.x || ph >= heights.y) { return false; }
  let rise = smoothstep(.17, .92, ph);
  let mass = convectiveTowerMass(weather, C.globalCoverage, bank, rise, convectiveTowerUpdraft(ph, heights), .43);
  // For negative mass, the largest fringe correction is monotone.
  return mass > -.0181 || cellularCloudFringe(mass, 1.0, .33 + .30 * rise) > -.0181;
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
  if (CLOUD_WEATHER_PLANET_FORM > 0.0) { preparePlanetRayMotion(); }
 }
 workgroupBarrier();
 var pix=vec2<i32>(gid.xy)+vec2<i32>(frame.originX,frame.originY);
 if(reproj.compactInterleave!=0u && temporalCellRateNormalized()>1u && reproj.frameIndex>0u){
  let mapped=compactTemporalPixel(gid.xy,temporalCellRateNormalized());if(mapped.z==0u){return;}pix=vec2<i32>(mapped.xy);
 }
 if(any(pix<vec2<i32>(0))||any(pix>=vec2<i32>(i32(frame.fullWidth),i32(frame.fullHeight)))){return;}
 let uv=(vec2<f32>(pix)+0.5)/vec2<f32>(f32(frame.fullWidth),f32(frame.fullHeight));let ndc=uv*2.0-1.0;
 var ro=V.camPos;if(CLOUD_USE_CUSTOM_POS!=0u){ro=posBuf[u32(pix.y)*frame.fullWidth+u32(pix.x)].xyz;}
 var rd=normalize(V.fwd+V.right*(ndc.x*V.aspect*tan(V.fovY*0.5))-V.up*(ndc.y*tan(V.fovY*0.5)));
 let localShell=localPlanetShellMode();
 var aircraftDistance=1000000.0;
 if(localShell){
  // Intersect the chase hull in local world units before rotating the ray.
  aircraftDistance=sceneAircraft(ro,rd,V.aircraftPosition,V.right,V.up,V.fwd,
    V._v0,V._v1,V._v2,V.aircraftYaw,normalize(L.sunDir)).distance;
  ro=planetShellPosition(ro);
  rd=planetShellDirection(rd);
 }
 var intervals:vec4<f32>;
 var terrainDistance=1000000.0;
 var rayEnd=1000000.0;
 var mixedTerrainCoverage=0.0;
 if(localShell){
  // Terrain and aircraft both stop the march. Only cloud between the
  // camera and the nearest opaque surface reaches the shell compositor.
  let localTerrainDistance=cloudTerrainDepth(cloudTerrainTexture,uv,V._v3);
  let shellScale=NTransform.planetUp.w;
  if(localTerrainDistance<1000000.0){rayEnd=max(0.0,localTerrainDistance*shellScale-.0005);}
  if(aircraftDistance<1000000.0){rayEnd=min(rayEnd,aircraftDistance*shellScale);}
  intervals=sceneCloudIntervals(ro,rd,planetOcclusionDistance(ro,rd,rayEnd));
 }else if(V._v3>=0.5){
  let dims=vec2<i32>(textureDimensions(cloudTerrainTexture));
  let scene=textureLoad(cloudTerrainTexture,min(vec2<i32>(uv*vec2<f32>(dims)),dims-1),0);
  if(scene.a>0.0){terrainDistance=max(0.0,scene.a+select(0.0,scene.b,scene.g<0.0)-0.0005);}
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
 let roundedBanks=!CLOUD_GAS_PLANET_FORM && (planetFormType()==2.0||planetFormType()==2.125||isBigBlob(planetFormType()));
 let brokenCumulus=!CLOUD_GAS_PLANET_FORM && abs(planetFormType()-2.40)<.004;
 let emberstorm=!CLOUD_GAS_PLANET_FORM && isEmberstorm(planetFormType());
 let fissures=!CLOUD_GAS_PLANET_FORM && isGlowingFissures(planetFormType());
 let nearCloud=1.0-smoothstep(h,h*7.0,intervals.x);
 let closeBank=select(0.0,nearCloud,roundedBanks);
 // Use the same sampling for all weather volumes. Lighter wisps need
 // less correction and distant weather keeps the original sample footprint.
 let opacityWeight=mix(.46,1.0,smoothstep(7.0,24.0,C.globalDensity));
 let nearWeather=(1.0-smoothstep(h*4.0,h*13.0,intervals.x))*
  (1.0-smoothstep(h*4.5,h*9.0,cameraRadius-cloudTopRadius))*
  (1.0-smoothstep(.24,.56,cameraRadius/V.planetRadius-1.0));
 let weatherSampling=select(nearWeather*opacityWeight,0.0,CLOUD_GAS_PLANET_FORM);
 let stableSampling=max(.65*weatherSampling,
  select(closeBank,select(.70,.95,emberstorm||fissures)*nearCloud,brokenCumulus||emberstorm||fissures));
 let refinementLimit=i32(ceil(44.0*stableSampling));
 let extraSteps=min(min(baseSteps*0.30,24.0),160.0-baseSteps);
 let baseStepBudget=min(160.0,baseSteps+grazing*extraSteps+closeBank*24.0);
 // Long views through nearby banks need finer lighting integration even
 // when the ray never hits terrain. Fade the extra work out with distance.
 let bankRayRefinement=closeBank*smoothstep(3.0,8.0,pathLength/h);
 // Long rays need additional overlap between light samples. Reuse the
 // larger budget when a rounded bank already calls for more samples.
 let weatherRayRefinement=weatherSampling*smoothstep(2.25,6.5,pathLength/h);
 let stepBudget=baseStepBudget+max(64.0*bankRayRefinement,42.0*weatherRayRefinement);
 // Keep density filtering and the optical depth limit tied to the original
 // step spacing so the finer integration doesn't change the cloud shapes.
 let footprintRatio=stepBudget/baseStepBudget;
 let steps=i32(ceil(stepBudget));
 let invSteps=1.0/stepBudget;
 let baseProbe=clamp(1.7/(scale*shapeDims.x),h*.018,h*.16);
 let extinction=max(C.globalDensity,0.0)*0.34/h;
 let densityScale=max(C.globalDensity*10.0,EPS);
 let maxShapeLod=f32(textureNumLevels(shape3D))-1.0;
 var path=0.0;var tr=1.0;var color=vec3<f32>(0.0);
 var hiddenAlpha=0.0;
 // Keep most of the offset stable and dither only a small part of each step.
 // A full-step temporal rotation makes translucent edges sparkle.
 let noiseSize=vec2<i32>(textureDimensions(blueTex));
 var pixelPhase=planetPixelRandom(vec2<u32>(pix));
 if(all(noiseSize>vec2<i32>(1))){
  pixelPhase=textureLoad(blueTex,pix%noiseSize,0,0).r;
 }
 let phaseIndex=(reverseBits(reproj.frameIndex & 7u)>>29u);
 // Flat's shell interleaves pixels without reprojecting their lighting.
 // Keep the sampling phase fixed so the history cycle cannot pulse shadows
 // on a still cloud. The spatial jitter and the shadow probes stay intact.
 let temporalPhase=select((f32(phaseIndex)*0.125-.4375)*smoothstep(.05,.65,reproj.temporalBlend)*.18,
  0.0,localPlanetShellMode());
 let jitterWidth=mix(.64,.82,grazing);
 var bankPhase=0.0;
 if(stableSampling>0.0){
  // Anchor the sample phase in the cloud shell. This trades speckled,
  // unrelated offsets between nearby rays for a slowly varying phase.
  let anchor=ro+rd*(intervals.x+min(firstLength*.5,h*1.55))-B.center;
  bankPhase=textureSampleLevel(shape3D,sampShape,anchor*(scale*22.0)+vec3<f32>(.43,.71,.19),
   min(1.0,maxShapeLod)).r*2.15;
 }
 // Keep strata more evenly spaced on long paths. A strong foreground bias
 // would still leave widely spaced samples in the far part of those rays.
 let nearFocus=mix(.18,.54,1.0-smoothstep(h,h*13.0,intervals.x));
 let focus=mix(nearFocus,.14,grazing);
 // Gas pigment is concentrated near the visible cloud tops. Resolve its
 // fine weather texture at one pressure surface so long views through an
 // optically thick atmosphere cannot average the narrow streaks away.
 var gasTopColor=vec3<f32>(1.0);
 var gasTopWeight=0.0;
 let tintAtDisplay=select(0.0,clamp(V._a,0.0,1.0),CLOUD_GAS_PLANET_FORM);
 if(tintAtDisplay>0.0 && tintAtDisplay<1.0){
  let topRadius=V.planetRadius+V.cloudBottom+h*.78;
  let top=gasTintPoint(ro-B.center,rd,topRadius).xyz;
  gasTopColor=gasWeatherColor(planetWeather(B.center+top*topRadius),planetFormType());
 }
 if(CLOUD_GAS_PLANET_FORM && tintAtDisplay==0.0 &&
     planetFormType()>=5.125 && planetFormType()<6.5 && cameraRadius>cloudTopRadius){
  let topRadius=V.planetRadius+V.cloudBottom+h*.78;
  let topHit=intersectSphere_robust(ro-B.center,rd,topRadius);
  if(topHit.x>0.0 && topHit.x<topHit.y){
   let topPoint=ro+rd*topHit.x;
   let incidence=dot(normalize(topPoint-B.center),-rd);
   gasTopWeight=smoothstep(.14,.53,incidence)*smoothstep(0.0,h,cameraRadius-cloudTopRadius);
   gasTopColor=gasWeatherColor(planetWeather(topPoint),planetFormType());
  }
 }
 var stratum=1;
 var cellStart=0.0;
 var fineCellEnd=0.0;
 var fineSamplesLeft=refinementLimit;
 var prevDensity=0.0;
 var sunVisibility=1.0;var normal=normalize(ro+rd*intervals.x-B.center);
 var targetSun=1.0;var targetNormal=normal;
 let sun=normalize(select(L.sunDir,planetShellDirection(L.sunDir),localPlanetShellMode()));
 let viewSun=max(dot(rd,sun),0.0);
 let forwardScatter=pow(viewSun,max(8.0,C.silverExponent*6.0));
 let sceneLighting=V._v3>=0.5&&!CLOUD_GAS_PLANET_FORM;
 let silverPhase=forwardScatter*forwardScatter*forwardScatter;
 var lastDenseSample=-100;
 let neptune=CLOUD_GAS_PLANET_FORM&&planetFormType()>=5.5&&planetFormType()<6.5;
 let continuousLight=!CLOUD_GAS_PLANET_FORM;
 let anvil=isAnvilCloud(planetFormType());
 let detailed=emberstorm||fissures||anvil||isCumulusBank(planetFormType())||isPlanetFront(planetFormType())||isThinOrDiorama(planetFormType());
 let texturedLight=fissures||anvil||planetFormType()==1.0||isMixedPlanetWeather(planetFormType())||isSatelliteForm(planetFormType());
 let skinErosion=select(select(0.053,0.091,detailed),0.119,anvil||isFineCumulus(planetFormType()));
 let sunStride=max(TUNE.sunStride,1);
 let normalStride=select(sunStride,min(sunStride,2),cameraRadius<cloudTopRadius+h*0.5);
 // A zero phase returns the original texture directly, whose channels may
 // be supplied by the caller. Only the evolving sampler guarantees the clamp.
 let boundedShape = NTransform.shapeOffsetWorld.y != 0.0;
 let toweringBank = CLOUD_WEATHER_PLANET_FORM == 2.25;
 let boundedTower = boundedShape && (toweringBank || CLOUD_WEATHER_PLANET_FORM == 2.38);
 for(var i=0;i<=steps+refinementLimit;i++){
  if(path>=pathLength||tr<0.012){break;}
  let farSide=path>=firstLength;
  let spanEnd=select(firstLength,pathLength,farSide);
  let fraction=min(f32(stratum)*invSteps,1.0);
  let boundary=select(pathLength*fraction*(1.0-focus+focus*fraction),pathLength,stratum>=steps);
  let cellEnd=min(boundary,spanEnd);
  let cellLength=cellEnd-cellStart;
  let sampleStart=path;
  let sampleCellStart=cellStart;
  let sampleStratum=stratum;
  let canRefine=fineSamplesLeft>0 && cellLength>h*.025;
  let wasDense=prevDensity>.014;
  let fine=canRefine && (path<fineCellEnd || wasDense);
  // Spend extra samples where cloud can contribute. Long empty spans retain
  // their regular stride even when they share a ray with an opaque cloud.
  let end=select(cellEnd,min(cellEnd,path+max(cellLength*.25,h*.012)),fine);
  let segmentStart=select(intervals.x+path,intervals.z+path-firstLength,farSide);
  if(segmentStart>=rayEnd){break;}
  let intervalLength=end-path;
  let segmentLength=min(intervalLength,rayEnd-segmentStart);
  // Use two interleaved phases so adjacent strata don't repeat a marching
  // pattern on long paths through a cloud deck.
  let phase=fract(pixelPhase+f32(i/2)*0.754877666);
  let jitter=fract(phase+f32(i&1)*0.5);
  let jitteredOffset=.5+(jitter-.5)*jitterWidth+temporalPhase;
  var sampleOffset=jitteredOffset;
  if(stableSampling>0.0){
   // Mirrored offsets within each pair cover both halves of the interval.
   // The triangle wave keeps the phase continuous where it wraps.
   let wave=1.0-4.0*abs(fract(bankPhase+f32(i/2)*.754877666)-.5);
   let sign=select(1.0,-1.0,(i&1)!=0);
   let offset=.5+sign*wave*mix(.22,.29,grazing)+(jitter-.5)*mix(.18,.29,grazing);
   let nearWeight=max(stableSampling*(1.0-smoothstep(h*5.0,h*13.0,segmentStart)),.75*bankRayRefinement);
   let weatherWeight=.60*weatherSampling*(1.0-smoothstep(h*8.0,h*17.0,segmentStart));
   sampleOffset=mix(jitteredOffset,offset,max(nearWeight,weatherWeight));
  }
  let t=segmentStart+segmentLength*sampleOffset;
  path=end;
  if(end>=cellEnd){cellStart=end;}
  if(end>=boundary){stratum++;}
  if(fine && end<cellEnd){fineSamplesLeft--;}
  prevDensity=0.0;
  if(segmentLength<=EPS){continue;}
  let p=ro+rd*t;
  let relative=p-B.center;
  let radius=length(relative);
  let ph=(radius-V.planetRadius-V.cloudBottom)/h;
  if(ph>0.0&&ph<1.0){
   let weather=planetRayWeather(p);
   if (weather.b > 1.0 || (boundedTower && !planetTowerCanContribute(ph, weather, toweringBank))) { continue; }
   // Match texture detail to the screen footprint and to long march steps.
   let densityInterval=cellLength*footprintRatio;
   let marchFootprint=densityInterval*mix(.36,.64,smoothstep(h,8.0*h,t))*(1.0+.34*closeBank);
   let footprint=max(max(t*rayPixelScale,marchFootprint),0.25/(scale*shapeDims.x));
   let lod=clamp(log2(max(footprint*scale*shapeDims.x,1.0)),0.0,maxShapeLod);
   let s=planetShapeAt(relative,radius,lod,weather,ph);
   let geometry=planetCloudForm(ph,weather,s);
   var density=styledPlanetDensityFromForm(geometry,0.0)/densityScale;
   if(density>0.0001){
    // A sample represents an entire ray segment. Filter the fine erosion over
    // that interval as well as the projected pixel, especially near the horizon.
    let detailFootprint=max(t*rayPixelScale,densityInterval);
    let detailLod=log2(max(detailFootprint*detailTexelsPerUnit,1.0));
    let detailWeight=1.0-smoothstep(1.5,3.5,detailLod);
    let definition=clamp(TUNE.definition,0.0,1.0);
    let erosionScale=select(mix(.42,1.55,definition),.06+.23*definition,roundedBanks);
    let erosionStrength=skinErosion*planetCloudErosionStrength(weather,planetFormType())*erosionScale;
    var erosion=erosionStrength*.46;
    if(detailWeight>0.0&&!isLenticular(planetFormType())&&(!roundedBanks||definition>.20)){
     let material = planetMaterialRelative(relative, radius);
     let materialPoint = B.center + material;
     var detailPos: vec3<f32>;
     if (CLOUD_WEATHER_PLANET_FORM > 0.0) {
      detailPos = planetRayDrift(material, radius - V.cloudHeightOffset, wg_planetMotion.detail, NTransform.detailOffsetWorld.y);
     } else if (!CLOUD_GAS_PLANET_FORM) {
      detailPos=planetWarpPosition(material,NTransform.detailOffsetWorld.x*6.283185307,planetFormType(),NTransform.planetWarpAmount,NTransform.planetWarpPhase);
      detailPos=sphericalDriftedWorld(B.center+detailPos,vec3<f32>(0,NTransform.detailOffsetWorld.y,NTransform.detailOffsetWorld.z))-B.center;
     } else {
      detailPos=sphericalSampleDriftedWorld(materialPoint,NTransform.detailOffsetWorld)-B.center;
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
    // Revisit the entry cell at the fine spacing, then keep that spacing
    // while the cloud contributes to the ray. Retry at most once per cell.
    if(canRefine && !fine && density>.020){
     path=sampleStart;
     cellStart=sampleCellStart;
     stratum=sampleStratum;
     fineCellEnd=cellEnd;
     fineSamplesLeft--;
     continue;
    }
    prevDensity=density;
    let dense=density>.065;
    let firstDense=dense&&i-lastDenseSample>2;
    let lightingPhase=i;
    let radial=relative/radius;
    let sunElevation=dot(radial,sun);
    let day=smoothstep(-.16,.28,sunElevation);
    var sunClearance=sunElevation;
    var sunGate=day;
    if(sceneLighting){
     sunClearance=planetSunClearance(sunElevation,V.planetRadius/radius);
     sunGate=planetSunTransmission(sunClearance,L.sky.w*L.dusk.w);
    }
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
     if(sunGate>.001 && roundedBanks){
      // A wide probe filters soft self-shadowing across the nearby lobe.
      // Reuse its weather sample to keep shadowing gradual through a bank.
      let reach=max(max(baseProbe,h*.26),min(footprint,h*.51));
      let lightPoint=p+sun*reach;
      let lightRelative = lightPoint - B.center;
      let lightRadius = length(lightRelative);
      let lightHeight = (lightRadius - V.planetRadius - V.cloudBottom) / h;
      let lightShape = planetShapeAt(lightRelative, lightRadius, min(lod+.55,maxShapeLod), weather, lightHeight);
      let lightForm=planetCloudForm(lightHeight,weather,lightShape);
      let slope=geometry.x-lightForm.x;
      diffuse=smoothstep(-.24,.49,slope);
      let entryMass=smoothstep(-.035,.19,geometry.x)*geometry.y;
      let farMass=smoothstep(-.055,.24,lightForm.x)*lightForm.y;
      let occlusion=mix(entryMass,farMass,.68);
      sunlight=exp(-occlusion*reach*extinction*.75);
     }else if(sunGate>.001){
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
      // Keep near-bank shading transitions wide enough for the ray cells.
      let weatherSlopeWidth=.10*weatherSampling*smoothstep(h*.035,h*.15,densityInterval);
      let slopeWidth=.045*lightingFootprint+max(.14*closeBank,weatherSlopeWidth);
      diffuse=smoothstep(-.085-slopeWidth,.13+slopeWidth,slope);
      let nearMass=smoothstep(-.012-.03*closeBank,.13+.08*closeBank,nearSun.x)*nearSun.y;
      var opticalDepth=nearMass*probe*1.45;
      if(TUNE.sunSteps>1){
       let reach=max(probe*2.6,h*.19);
       let farHeight=ph+sunElevation*reach/h;
       // This probe only contributes optical depth. The near probe still measures the slope.
       if (!boundedTower || planetTowerCanContribute(farHeight, weather, toweringBank)) {
        let farSun=planetCloudForm(farHeight,weather,planetShape(p+sun*reach,min(lod+.85,3.5),weather,farHeight));
        let farMass=smoothstep(-.012-.03*closeBank,.14+.08*closeBank,farSun.x)*farSun.y;
        opticalDepth+=farMass*(reach-probe);
       }
      }
      sunlight=exp(-opticalDepth*extinction*mix(.92,.45,closeBank));
     }
    }
    let visibility=sqrt(sunlight);
    var sunTint=vec3<f32>(1.0);
    var skyTint=vec3<f32>(1.0);
    if(sceneLighting){
     sunTint=planetSunTint(sunElevation,sunClearance,L.sky,L.dusk);
     skyTint=planetSkylight(sunElevation,viewSun,L.sky,L.dusk);
    }

    let direct=sunlight*(.12+.88*diffuse)*sunGate;
    // The billow and density samples already in hand give the underside
    // soft skylight and an exposed rim without a second shadow march.
    let ao=clamp(1.0-density*.28+(s.g-.5)*.18,.55,1.0);
    let baseBounce=.07+.12*visibility;
    let billowBounce=(.04+.25*sqrt(visibility))*(.55+.45*skyExposure)*(.72+.28*skin);
    let bounce=select(baseBounce,billowBounce,detailed)*sunGate;
    let baseAmbient=(.12+.10*max(dot(lightNormal,radial),0.0))*ao;
    let billowAmbient=(.10+.15*skyExposure+.17*skin)*clamp(.72+.32*s.g+.15*s.b-density*.14,.55,1.10);
    let ambient=select(baseAmbient,billowAmbient,detailed);
    let sunlit=C.frontLightColor*sunTint;
    let shaded=C.shadowLightColor*skyTint;
    var light=sunlit*(direct+bounce)+shaded*ambient;
    if(sceneLighting&&!emberstorm&&!fissures){
     // As in the flat demo, exposed faces, transmitted light and skylight
     // have separate colors. Reuse the current optical depth and shape.
     let lowSun=1.0-smoothstep(.03,.55,sunElevation);
     let top=smoothstep(.34,.86,ph);
     let facing=smoothstep(.20,.83,diffuse)*smoothstep(.16,.82,sunlight);
     let exposed=facing*mix(.42,1.0,max(top,skin*.65));
     let frontTint=sunlit*mix(vec3<f32>(1.05,1.06,1.09),vec3<f32>(1.09,1.04,1.00),lowSun);
     let throughTint=C.sunColor*sunTint*
       mix(vec3<f32>(1.18,1.13,1.07),vec3<f32>(1.30,1.01,.90),lowSun);
     let fillTint=shaded*mix(vec3<f32>(.97,1.05,1.18),vec3<f32>(1.16,.96,1.26),lowSun);
     let directBlend=clamp(TUNE.directLightBlend,0.0,1.0)*exposed;
     let frontBoost=1.0+clamp(TUNE.directLightBoost,0.0,2.0)*.22*exposed;
     let bodyTint=mix(fillTint*1.75,mix(throughTint,sunlit,.38),.48+.38*visibility);
     light=mix(mix(throughTint,sunlit,.40),frontTint*frontBoost,directBlend)*direct
       +bodyTint*bounce+fillTint*ambient;
    }
    if(TUNE.lightingFinish==2&&sceneLighting&&!emberstorm){
      let relief=smoothstep(.18,.78,diffuse*visibility);
      light*=mix(.76,1.18,relief);
    }
    if(TUNE.lightingFinish==2&&(!sceneLighting||emberstorm)){
      let bands=0.18+smoothstep(0.25,0.35,diffuse)*0.40+smoothstep(0.65,0.75,diffuse)*0.42;
      light=mix(shaded*0.28,sunlit,bands*sunlight*sunGate)+shaded*0.06;
    }
    let edgeScatter=select(pow(1.0-abs(dot(lightNormal,-rd)),2.0),skin*.68,continuousLight);
    let silverWeight=select(1.0,mix(.45,1.12,skin),detailed);
    let silverLight=C.sunColor*sunTint*max(C.silverIntensity,0.0)*sunGate;
    // Keep a warm forward-scattering rim and let thick interiors self-shadow.
    let edgeTransmission=visibility*skin;
    let rimLight=forwardScatter*(.055+edgeScatter*.52)*visibility + silverPhase*edgeTransmission*.92;
    let originalRim=visibility*forwardScatter*(.08+edgeScatter*1.1)*silverWeight;
    light+=silverLight*select(originalRim,rimLight,sceneLighting);
    if(detailed || roundedBanks){
     let compression=select(.44,.34,planetFormType()==2.125);
     if(sceneLighting){light*=planetCloudHighlightGain(light,compression);}
     else{light=light/(vec3<f32>(1.0)+light*compression);}
    }
    if(L.sceneWeight > 0.0 && !CLOUD_GAS_PLANET_FORM && !emberstorm && !fissures){
     let sceneLight=sceneCloudLighting(sunElevation,max(viewSun,0.0));
     let edge=1.0-smoothstep(.10,.72,density);
     let reference=sceneCloudRadiance(sceneLight,sceneSolarColor(sunElevation)*L.sceneSun.rgb,
       sunlight*sunGate,skyExposure,edge,true,L.sceneFront.rgb,L.sceneShadow.rgb,
       L.sceneTransmission.rgb,L.sceneResponse.rgb);
     light=mix(light,reference,L.sceneWeight*scenePlanetCloudWeight(sunElevation));
    }
    if (localShell && !CLOUD_GAS_PLANET_FORM && !emberstorm && !fissures) {
     // On the local shell, high cloud tops can keep direct twilight while
     // the lower layers have already lost their sun path.
     let nightFill = sceneLocalCloudNightWeight(sunElevation) * (1.0 - sunGate);
     light = mix(light, sceneLocalCloudNightFill(skyExposure), nightFill);
    }
    if(fissures){
     let facets=.41+.59*smoothstep(.25,.73,s.r);
     let exposed=smoothstep(.14,.60,ph);
     let crustFill=vec3<f32>(.024,.012,.007)*smoothstep(.25,.73,s.g)*exposed;
     light=light*facets*(.44+.29*exposed)+crustFill
       +glowingFissureEmission(s,ph,NTransform.shapeOffsetWorld.y,C.sunColor);
    }
    if(emberstorm){
     let seam=smoothstep(.16,.64,s.b);
     let exposed=1.0-smoothstep(.20,.72,density);
     let heat=seam*(.62+.38*seam);
     light=light*.54+C.sunColor*(.019+heat*(.26+2.50*exposed))
       +emberstormEmission(s,ph,NTransform.shapeOffsetWorld.y,exposed);
    }
    if(CLOUD_GAS_PLANET_FORM && tintAtDisplay<1.0){
     let localColor=gasWeatherColor(weather,planetFormType());
     let tint=mix(localColor,gasTopColor,max(gasTopWeight,tintAtDisplay));
     // In the transition zone only the tint applied at display resolution is
     // removed. This keeps the color continuous when crossing the cloud tops.
     light*=tint/max(mix(vec3<f32>(1.0),gasTopColor,tintAtDisplay),vec3<f32>(.004));
    }
    let limbRetention=1.0-orbitLimb*mix(.94,.55,smoothstep(.10,.60,density));
    let rawAbsorption=density*extinction*limbRetention;
    // A close ray through a solid bank should collect light across several
    // segments. Limit the influence of a single stratified sample.
    let cellDistance=segmentStart-(sampleStart-sampleCellStart);
    let visibleCellLength=min(cellLength,rayEnd-cellDistance);
    let absorption=mix(rawAbsorption,min(rawAbsorption,.38/(visibleCellLength*footprintRatio)),closeBank);
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
 if(CLOUD_GAS_PLANET_FORM && localPlanetShellMode() && V._c > .5 && alpha > .001){
  let photoWeight=smoothstep(0.0,h,cameraRadius-cloudTopRadius);
  if(photoWeight>0.0){
   let tintRadius=V.planetRadius+V.cloudBottom+h*.78;
   let top=gasTintPoint(ro-B.center,rd,tintRadius);
   let direction=planetWarpDirection(top.xyz,NTransform.weatherOffsetWorld.x*6.283185307,planetFormType(),
     NTransform.planetWarpAmount,NTransform.planetWarpPhase);
   let latitudeScale=axisOrOne3(NTransform.weatherAxisScale).z*max(NTransform.weatherScale,EPS);
   let uv=planetGasTintUV(direction,latitudeScale);
   let footprint=rayPixelScale*top.w/(tintRadius*max(.18,dot(top.xyz,-rd)));
   let texelAngle=6.283185307/f32(textureDimensions(planetPhotoTexture,0).x);
   let lod=max(0.0,log2(max(footprint/texelAngle,1.0)));
   let photo=planetCloudPhotoToLinear(textureSampleLevel(planetPhotoTexture,samp2D,uv,0,lod).rgb);
   color*=mix(vec3<f32>(1.0),photo,photoWeight);
  }
 }
 let feather=smoothstep(0.0,max(TUNE.minOutputAlpha,0.0001),alpha);
 var result=vec4<f32>(color*feather,alpha*feather);
 if(CLOUD_WRITE_RGB==0u){result=vec4<f32>(0,0,0,result.a);}
 storeLayerSample(pix,result,0.0,historyActive);
}

// Signed angular distance to each curtain. Keeping thickness independent of
// the ray step prevents distant aurora from turning into wide glowing bands.
fn auroraCurtainOffsets(
  local: vec3<f32>, radii: vec2<f32>, angle: f32, flow: f32, longitudePhase: f32, extended: bool
) -> mat2x4<f32> {
  let longitude = atan2(local.z, local.x) + longitudePhase;
  let phase = saturate((length(local) - radii.x) / (radii.y - radii.x));
  let polarAngle = atan2(length(local.xz), abs(local.y));
  let drift = longitude + flow;
  let arc = angle * (0.66 + 0.17 * sin(2.0 * longitude + flow) +
    0.09 * sin(3.0 * longitude - flow * 0.7));
  let folds = angle * (0.065 * sin(7.0 * longitude - flow * 1.3) +
    0.033 * sin(13.0 * longitude + flow * 1.8));
  let lean = angle * phase * (select(0.14, 0.19, local.y < 0.0) + 0.10 * sin(3.0 * drift));
  let centerline = polarAngle - arc - lean;
  let spread = angle * (0.065 + 0.035 * sin(3.0 * longitude - flow));
  // Adjacent sheets spread apart and curl back together as the folds travel.
  let primary = vec4<f32>(
    centerline - folds,
    centerline + angle * (0.17 + 0.085 * sin(4.0 * drift)) + folds * 0.65 + lean * 0.20,
    centerline - folds - spread * (1.0 + phase * 0.75),
    centerline + folds * 0.2 + spread * (1.0 + phase * 1.10)
  );
  var secondary = vec4<f32>(0.0);
  if (extended) {
    let sweep = angle * 0.095 * sin(5.0 * longitude + flow * 0.8);
    secondary = vec4<f32>(
      centerline - angle * (0.24 + phase * 0.04) + sweep - folds * 0.55,
      centerline + angle * 0.30 + sweep * 0.78 + folds * 0.38,
      centerline - angle * (0.39 + phase * 0.05) - sweep * 0.88 + folds * 0.4,
      0.0
    );
  }
  return mat2x4<f32>(primary, secondary);
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

// Longitude masks wrap at the meridian. Only the main curtain closes in
// encircling layouts, leaving the secondary curtains free to split and fade.
fn auroraArcEnvelope(longitude: f32, coverage: f32) -> f32 {
  let edge = cos(PI * coverage);
  let crest = cos(longitude) * 0.84 + sin(3.0 * longitude + 0.75) * 0.16;
  return smoothstep(edge - 0.13, edge + 0.16, crest);
}

fn auroraSheetContribution(a: f32, b: f32, width: f32, arc: f32) -> vec2<f32> {
  if (arc < 0.001) { return vec2<f32>(0.0); }
  let sample = auroraSheetSample(a, b, width);
  let weight = sample.x * arc;
  return vec2<f32>(weight, weight * sample.y);
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
  let worldOrigin = ro - B.center;
  let localOrigin = auroraMagneticPosition(worldOrigin);
  let localRay = auroraMagneticPosition(rd);
  // Clip each hemisphere independently, including when a ray starts under it.
  let north = V._c >= 0.0;
  let south = V._c <= 0.0;
  let y = localOrigin.y + localRay.y * intervals;
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
  let pattern = V.auroraCurtainPattern;
  let curtainCount = i32(clamp(pattern.x, 1.0, 7.0));
  let coverage = clamp(pattern.y, 0.14, 1.0);
  let strandFrequency = round(clamp(pattern.z, 24.0, 80.0));
  let encircling = smoothstep(0.85, 0.93, coverage);
  let mainFloor = encircling * 0.32;
  let sheetWidth = clamp(capAngle * mix(0.019, 0.013, encircling), 0.0025, 0.0065);
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
    let a = localOrigin + localRay * start;
    let b = a + localRay * segment;
    let inNorth = north && max(a.y, b.y) >= minPolarY;
    let inSouth = south && min(a.y, b.y) <= -minPolarY;
    if (!inNorth && !inSouth) { continue; }

    let mid = a + localRay * (segment * 0.5);
    let hemispherePhase = select(0.0, 1.7, mid.y < 0.0);
    let flow = shapeFlow * select(1.0, -0.78, mid.y < 0.0) + spin;
    let longitudePhase = hemispherePhase + pattern.w;
    let longitude = atan2(mid.z, mid.x) + longitudePhase;
    let mainArc = max(mainFloor, auroraArcEnvelope(longitude + flow * 0.23 - 0.8, coverage));
    var sideArc = 0.0;
    if (curtainCount >= 2) {
      sideArc = auroraArcEnvelope(longitude - flow * 0.18 + 1.8, coverage * 0.70);
    }
    if (max(mainArc, sideArc) < 0.001) { continue; }

    let offsetsA = auroraCurtainOffsets(a, radii, capAngle, flow, longitudePhase, curtainCount > 4);
    let offsetsB = auroraCurtainOffsets(b, radii, capAngle, flow, longitudePhase, curtainCount > 4);
    let primaryA = offsetsA[0];
    let primaryB = offsetsB[0];
    var sheets = auroraSheetContribution(primaryA.x, primaryB.x, sheetWidth, mainArc);
    sheets += auroraSheetContribution(primaryA.y, primaryB.y, sheetWidth * 0.72, sideArc * 0.68);
    if (curtainCount >= 3) {
      let arc = mainArc * smoothstep(0.12, 0.78, sin(3.0 * longitude - flow * 1.2));
      sheets += auroraSheetContribution(primaryA.z, primaryB.z, sheetWidth * 0.68, arc * 0.64);
    }
    if (curtainCount >= 4) {
      let arc = max(mainArc, sideArc) * smoothstep(0.05, 0.76, sin(2.0 * longitude + flow * 1.4));
      sheets += auroraSheetContribution(primaryA.w, primaryB.w, sheetWidth * 0.60, arc * 0.59);
    }
    if (curtainCount > 4) {
      let secondaryA = offsetsA[1];
      let secondaryB = offsetsB[1];
      let arc = auroraArcEnvelope(longitude + flow * 0.37 + 2.40, coverage * 0.64);
      sheets += auroraSheetContribution(secondaryA.x, secondaryB.x, sheetWidth * 0.70, arc * 0.69);
      if (curtainCount >= 6) {
        let arc = auroraArcEnvelope(longitude - flow * 0.24 - 0.45, coverage * 0.52);
        sheets += auroraSheetContribution(secondaryA.y, secondaryB.y, sheetWidth * 0.60, arc * 0.46);
      }
      if (curtainCount >= 7) {
        let arc = auroraArcEnvelope(longitude + flow * 0.61 - 2.75, coverage * 0.46);
        sheets += auroraSheetContribution(secondaryA.z, secondaryB.z, sheetWidth * 0.58, arc * 0.54);
      }
    }
    if (sheets.x < 0.001) { continue; }

    let distance = start + segment * sheets.y / sheets.x;
    let local = localOrigin + localRay * distance;
    let cap = auroraMagneticCapMask(local);
    let night = 1.0 - smoothstep(-0.16, 0.08, dot(normalize(worldOrigin + rd * distance), sun));
    if (cap * night > 0.0001) {
      let phase = saturate((length(local) - radii.x) / height);
      let xz = rotateXZ(local.xz, spin + hemispherePhase);
      let uv = auroraUVFromMagnetic(vec3<f32>(xz.x, local.y, xz.y));
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
        let anglePerPixel = distance * pixelScale / max(length(local.xz), EPS);
        let strands = 0.5 + 0.5 * sin(strandFrequency * longitude + sin(19.0 * longitude - flow) * 2.1 + detailFlow + phase * 0.6);
        let fineRays = mix(1.0, mix(0.46, 1.26, strands), 1.0 - smoothstep(0.18, 0.85, anglePerPixel * strandFrequency));
        let curtainTop = 0.60 + 0.37 * (0.5 + 0.5 * sin(5.0 * longitude + sin(9.0 * longitude - flow) + flow * 0.6));
        let heightProfile = (1.0 - smoothstep(0.16, curtainTop, phase)) * (1.2 + phase * 0.5);
        let weight = density * segment / height * night * sheets.x * fineRays * heightProfile * 14.0;
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

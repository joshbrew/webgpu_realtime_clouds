// Compact regular planet styles. Independent of flat morphology, detailed
// legacy lighting and aurora call graphs; all seven styles share this entry.
fn planetShape(p:vec3<f32>,lod:f32,weather:vec4<f32>,ph:f32)->vec4<f32> {
 var moved=sphericalSampleDriftedWorld(p,vec3<f32>(NTransform.shapeOffsetWorld.x,0,NTransform.shapeOffsetWorld.z))-B.center;
 if(TUNE.formType>=.5 && TUNE.formType<4.5){
  moved=planetWarpPosition(p-B.center,NTransform.shapeOffsetWorld.x*6.283185307,TUNE.formType,NTransform.planetWarpAmount,NTransform.planetWarpPhase);
  moved=sphericalDriftedWorld(B.center+moved,vec3<f32>(0,0,NTransform.shapeOffsetWorld.z))-B.center;
 }
 let scale=max(V.worldToUV*B.uvScale,EPS)*max(NTransform.shapeScale,EPS);
 if(isLenticular(TUNE.formType)){moved=normalize(moved)*V.planetRadius;}
 let domain=planetWeatherShapeDomain(moved*axisOrOne3(NTransform.shapeAxisScale)*scale,weather,ph,TUNE.formType);
 let phase=NTransform.shapeOffsetWorld.y;
 let shape=textureSampleLevel(shape3D,sampShape,planetEvolvingDomain(domain,phase),lod);
 return evolvePlanetCloudShape(shape,phase,TUNE.formType);
}
fn planetPhase(p:vec3<f32>)->f32 {return (length(p-B.center)-V.planetRadius-V.cloudBottom)/max(V.cloudTop-V.cloudBottom,EPS);}
fn planetWeather(p:vec3<f32>)->vec4<f32> {
 // Rotate the unit-sphere domain, not the equirectangular UV. Gas bands and
 // coverage travel with the shell without sliding through a longitude seam.
 let wind=NTransform.weatherOffsetWorld;
 var moved=sphericalDriftedWorld(p,wind);
 if(TUNE.formType>=.5){
  moved=B.center+planetWarpDirection(normalize(p-B.center),wind.x*6.283185307,TUNE.formType,NTransform.planetWarpAmount,NTransform.planetWarpPhase);
  if(TUNE.formType<4.5){moved=sphericalDriftedWorld(moved,vec3<f32>(0,wind.y,wind.z));}
 }
 let uv=sphereUVFromWorld(moved);
 let latitudeScale=axisOrOne3(NTransform.weatherAxisScale).z*max(NTransform.weatherScale,EPS);
 return wrap2D(weather2D,samp2D,(uv-vec2<f32>(.5))*vec2<f32>(1,latitudeScale)+vec2<f32>(.5),0,0.0);
}
fn planetCloudForm(ph: f32, weather: vec4<f32>, shape: vec4<f32>) -> vec2<f32> {
 if(isMixedPlanetWeather(TUNE.formType)){
  return mixedPlanetWeatherForm(ph,weather,shape,C.globalCoverage);
 }
 if(isAnvilCloud(TUNE.formType)){
  return anvilCloudForm(ph,weather,shape,C.globalCoverage);
 }
 if(isRealisticSatellite(TUNE.formType)){
  return realisticSatelliteForm(ph,weather,shape,C.globalCoverage);
 }
 if(TUNE.formType==1.0){
  return thinCloudForm(ph,weather,shape,C.globalCoverage);
 }
 if(TUNE.formType==2.0){
  return dioramaCloudForm(ph,weather,shape,C.globalCoverage);
 }
 if(isPlanetFront(TUNE.formType)){
  return planetFrontForm(ph,weather,shape,C.globalCoverage);
 }
 if(isLenticular(TUNE.formType)){
  return lenticularForm(ph,weather,shape,C.globalCoverage);
 }
 if(isCumulusBank(TUNE.formType)){
  return cumulusBankForm(ph,weather,shape,C.globalCoverage,TUNE.formType);
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
 if(V._v3>=0.5){
  let terrain=max(0.0,cloudTerrainDepth(cloudTerrainTexture,uv,V._v3)-0.0005);
  intervals=sceneCloudIntervals(ro,rd,planetOcclusionDistance(ro,rd,terrain));
 }else{
  let hit=intersectSphericalCloudShellView(ro,rd);
  intervals=vec4<f32>(hit,hit.y,hit.y);
 }
 let firstLength=max(intervals.y-intervals.x,0.0);
 let pathLength=firstLength+max(intervals.w-intervals.z,0.0);
 let historyActive=reproj.enabled==1u||temporalCellRateNormalized()>1u||reproj.temporalBlend>0.0001;
 if(pathLength<=EPS){storeLayerSample(pix,vec4<f32>(0.0),0.0,historyActive);return;}
 let h=max(V.cloudTop-V.cloudBottom,EPS);let shapeDims=vec3<f32>(textureDimensions(shape3D));
 let scale=max(V.worldToUV*B.uvScale*NTransform.shapeScale,EPS);
 let rayPixelScale=2.0*tan(V.fovY*0.5)/f32(frame.fullHeight);
 let steps=clamp(TUNE.maxSteps,16,160);
 let invSteps=1.0/f32(steps);
 let baseProbe=clamp(1.7/(scale*shapeDims.x),h*.018,h*.16);
 let extinction=max(C.globalDensity,0.0)*0.34/h;
 var path=0.0;var tr=1.0;var color=vec3<f32>(0.0);
 // Blue noise decorrelates neighboring rays. Change the phase only while
 // history is actually blending, so panning does not expose frame flicker.
 let noiseSize=vec2<i32>(textureDimensions(blueTex));
 var pixelPhase=planetPixelRandom(vec2<u32>(pix));
 if(all(noiseSize>vec2<i32>(1))){
  pixelPhase=textureLoad(blueTex,pix%noiseSize,0,0).r;
 }
 let temporalPhase=select(0.0,fract(f32(reproj.frameIndex%64u)*0.618033989),reproj.temporalBlend>.05);
 // Give the foreground finer strata on long grazing rays. This allocates
 // the same fixed sample count across the visible shell, with no hard
 // distance switch and no shared world-space lattice.
 let focus=mix(.18,.54,1.0-smoothstep(h,h*13.0,intervals.x));
 var stratum=1;
 var sunVisibility=1.0;var normal=normalize(ro+rd*intervals.x-B.center);
 var targetSun=1.0;var targetNormal=normal;
 let sun=normalize(L.sunDir);
 var lastDenseSample=-100;
 let neptune=TUNE.formType>=5.5&&TUNE.formType<6.5;
 let continuousLight=TUNE.formType>=.5&&TUNE.formType<4.5;
 let detailed=isCumulusBank(TUNE.formType)||isPlanetFront(TUNE.formType)||isThinOrDiorama(TUNE.formType);
 let texturedLight=isThinOrDiorama(TUNE.formType)||isMixedPlanetWeather(TUNE.formType)||isRealisticSatellite(TUNE.formType);
 let skinErosion=select(select(0.053,0.091,detailed),0.119,isFineCumulus(TUNE.formType));
 let sunStride=max(TUNE.sunStride,1);
 let normalStride=select(sunStride,min(sunStride,2),length(ro-B.center)<V.planetRadius+V.cloudTop+h*0.5);
 for(var i=0;i<=steps;i++){
  if(path>=pathLength||tr<0.012){break;}
  let farSide=path>=firstLength;
  let spanEnd=select(firstLength,pathLength,farSide);
  let fraction=min(f32(stratum)*invSteps,1.0);
  let boundary=select(pathLength*fraction*(1.0-focus+focus*fraction),pathLength,stratum>=steps);
  let end=min(boundary,spanEnd);
  let segmentLength=end-path;
  let jitter=fract(pixelPhase+temporalPhase+f32(i)*0.754877666);
  let t=select(intervals.x+path,intervals.z+path-firstLength,farSide)+segmentLength*mix(.10,.90,jitter);
  path=end;
  if(end>=boundary){stratum++;}
  if(segmentLength<=EPS){continue;}
  let p=ro+rd*t;let ph=planetPhase(p);
  if(ph>0.0&&ph<1.0){
   // Match texture detail to the screen footprint and to long march steps.
   let marchFootprint=segmentLength*mix(.36,.64,smoothstep(h,8.0*h,t));
   let footprint=max(max(t*rayPixelScale,marchFootprint),0.25/(scale*shapeDims.x));
   let lod=clamp(log2(max(footprint*scale*shapeDims.x,1.0)),0.0,f32(textureNumLevels(shape3D))-1.0);
   let weather=planetWeather(p);
   let s=planetShape(p,lod,weather,ph);
   let geometry=planetCloudForm(ph,weather,s);
   let densityScale=max(C.globalDensity*10.0,EPS);
   var density=select(styledPlanetDensityFromForm(geometry,0.0)/densityScale,0.0,weather.b>1.0);
   if(density>0.0001){
    // Fine noise only erodes the skin; dense interiors remain coherent. Real
    // mip filtering limits subpixel shimmer without a camera-relative reset.
    let detailScale=max(V.worldToUV*B.uvScale*4.0*NTransform.detailScale,EPS);
    let detailLod=clamp(log2(max(footprint*detailScale*f32(textureDimensions(detail3D).x),1.0)),0.0,f32(textureNumLevels(detail3D))-1.0);
    let detailWeight=1.0-smoothstep(1.5,3.5,detailLod);
    let erosionStrength=skinErosion*planetCloudErosionStrength(weather,TUNE.formType)*mix(.42,1.55,clamp(TUNE.definition,0.0,1.0));
    var erosion=erosionStrength*.46;
    if(detailWeight>0.0&&!isLenticular(TUNE.formType)){
     var detailPos=sphericalSampleDriftedWorld(p,NTransform.detailOffsetWorld)-B.center;
     if(TUNE.formType>=.5 && TUNE.formType<4.5){
      detailPos=planetWarpPosition(p-B.center,NTransform.detailOffsetWorld.x*6.283185307,TUNE.formType,NTransform.planetWarpAmount,NTransform.planetWarpPhase);
      detailPos=sphericalDriftedWorld(B.center+detailPos,vec3<f32>(0,NTransform.detailOffsetWorld.y,NTransform.detailOffsetWorld.z))-B.center;
     }
     let detailDomain=planetEvolvingDomain(detailPos*detailScale,NTransform.shapeOffsetWorld.y*1.75);
     let detail=textureSampleLevel(detail3D,sampDetail,detailDomain,detailLod).rgb;
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
    let radial=normalize(p-B.center);
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
      let slope=geometry.x-nearSun.x-(erosion-erosionStrength*.46)*skin*select(.35,.76,texturedLight);
      diffuse=smoothstep(-.085,.13,slope);
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
    let forwardScatter=pow(max(dot(rd,sun),0.0),max(8.0,C.silverExponent*6.0));
    let edgeScatter=select(pow(1.0-abs(dot(lightNormal,-rd)),2.0),skin*.68,continuousLight);
    let silverWeight=select(1.0,mix(.45,1.12,skin),detailed);
    light+=C.sunColor*max(C.silverIntensity,0.0)*visibility*day*forwardScatter*(0.08+edgeScatter*1.1)*silverWeight;
    if(detailed){light=light/(vec3<f32>(1.0)+light*0.44);}
    if(TUNE.formType>=4.5){light*=gasWeatherColor(weather,TUNE.formType);}
    let alpha=1.0-exp(-density*extinction*segmentLength);
    color+=tr*alpha*light;tr*=1.0-alpha;
   }
  }
 }
 let alpha=1.0-tr;let feather=smoothstep(0.0,max(TUNE.minOutputAlpha,0.0001),alpha);
 var result=vec4<f32>(color*feather,alpha*feather);
 if(CLOUD_WRITE_RGB==0u){result=vec4<f32>(0,0,0,result.a);}
 storeLayerSample(pix,result,0.0,historyActive);
}

// The terrain-backed aurora uses the whole visible shell. Sample only within
// the emitting layer, with the terrain as the far endpoint when it occludes it.
fn marchSceneAurora(ro: vec3<f32>, rd: vec3<f32>, terrainDistance: f32, clouds:vec3<f32>) -> vec4<f32> {
  let limit = planetOcclusionDistance(ro,rd,max(0.0,terrainDistance-0.0005));
  let intervals = sceneCloudIntervals(ro,rd,limit);
  let first = max(intervals.y - intervals.x, 0.0);
  let pathLength = first + max(intervals.w - intervals.z, 0.0);
  if (pathLength <= EPS) { return vec4<f32>(0.0); }

  let minPolarY = shellNominalRadii().x * cos(min(0.5 * PI, auroraCapAngleRad() + auroraCapFeatherRad() * 1.35));
  let originY = ro.y - B.center.y;
  // Shell segments wholly below both polar caps cannot emit.
  let nearReachesCap = first > EPS &&
    max(abs(originY + rd.y * intervals.x), abs(originY + rd.y * intervals.y)) >= minPolarY;
  let farReachesCap = intervals.w - intervals.z > EPS &&
    max(abs(originY + rd.y * intervals.z), abs(originY + rd.y * intervals.w)) >= minPolarY;
  if (!nearReachesCap && !farReachesCap) { return vec4<f32>(0.0); }

  var cloudSegments = vec4<f32>(0.0);
  if (clouds.x > 0.001) { cloudSegments = sceneShellIntervals(ro, rd, limit, clouds.yz); }
  let cloudLengths = max(cloudSegments.yw - cloudSegments.xz, vec2<f32>(0.0));
  let cloudLength = cloudLengths.x + cloudLengths.y;
  let cloudOpticalDepth = -log(max(1.0 - clouds.x, 0.0001));
  let height = max(V.cloudTop - V.cloudBottom, EPS);
  let steps = clamp(TUNE.maxSteps, 16, 64);
  let stride = max(pathLength / f32(steps), height / 40.0);
  let sun = normalize(L.sunDir);
  let weatherScale = max(abs(NTransform.weatherScale), EPS) * axisOrOne3(NTransform.weatherAxisScale).z;
  let pixelScale = 2.0 * tan(V.fovY * 0.5) / f32(frame.fullHeight);
  let scaleBase = max(abs(NTransform.shapeScale) * 22.0, 2.75);
  let shapeTexelsPerUnit = f32(textureDimensions(shape3D).x) * scaleBase /
    max(V.planetRadius * auroraCapAngleRad(), EPS);
  let flow = NTransform.shapeOffsetWorld.x * 190.0;
  var path = 0.0;
  var opticalDepth = 0.0;
  var emission = vec3<f32>(0.0);
  for (var i = 0; i <= steps; i++) {
    if (path >= pathLength || opticalDepth > 4.0) { break; }
    let farSide = path >= first;
    let segment = min(stride, select(first, pathLength, farSide) - path);
    let distance = select(intervals.x + path, intervals.z + path - first, farSide) + segment * 0.5;
    let p = ro + rd * distance;
    let cap = auroraCapMask(p);
    if (cap > 0.0001) {
      let phase = shellPhase01FromWorld(p);
      // Rotate within each polar cap. A global tilt can flip the local
      // hemisphere basis under a visible curtain and expose a straight seam.
      let local = p-B.center;
      let spin = NTransform.weatherOffsetWorld.x*2.0*PI;
      let xz = rotateXZ(local.xz,spin);
      let uv = auroraUVFromWorld(B.center+vec3<f32>(xz.x,local.y,xz.y));
      let longitude = uv.x * 2.0 * PI;
      let polarAngle = atan2(length(local.xz), abs(local.y));
      let oval = auroraCapAngleRad() * 0.70 +
        sin(3.0 * longitude + flow) * 0.037 + sin(7.0 * longitude - 0.7 * flow) * 0.014;
      let lean = phase * (0.062 + 0.022 * sin(2.0 * longitude - flow));
      let width = max(0.023, min(0.042, stride * 0.42 / length(local)));
      let mainSheet = 1.0 - smoothstep(0.005, width, abs(polarAngle - oval - lean));
      let outerSheet = 1.0 - smoothstep(0.003, width * 0.82,
        abs(polarAngle - oval - 0.056 - lean * 0.66));
      let sheets = max(mainSheet, outerSheet * (0.46 + 0.38 * sin(3.0 * longitude - flow)));
      if (sheets < 0.001) { path += segment; continue; }
      // Shear broad curtains gently in two directions as they drift.
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
      let density = auroraCurtainDensityAtUV(phase, weather, shape, detailProxyFromShape(phase, shape), cap, warpedUV);
      if (density > 0.0001) {
        let night = 1.0-smoothstep(-0.16,0.08,dot(normalize(p-B.center),sun));
        let weight = density*segment/height*night*sheets*1.65;
        let foreground = clamp(vec2<f32>(distance) - cloudSegments.xz, vec2<f32>(0.0), cloudLengths);
        let fraction = (foreground.x + foreground.y) / max(cloudLength, EPS);
        let transmission = exp(-cloudOpticalDepth * fraction);
        emission += auroraSpectralColorAtUV(warpedUV,phase)*weight*transmission;
        opticalDepth += weight;
      }
    }
    path += segment;
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

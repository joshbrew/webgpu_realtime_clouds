import { CloudVolumeMips } from './cloudVolumeMips.js';
import { isSatelliteWeatherStyle, planetBillowNoiseMode, satelliteWeatherModes } from './planetCloudStyles.js';

// Small, independent GPU stages. Periodic value FBM has a continuous
// Cartesian domain, signed-safe integer hashing and no longitude seams.
const SOURCE=`
struct SatelliteStorm {
 axisRadius:vec4<f32>,
 // Eye radius, twist, maturity and rainband phase.
 shape:vec4<f32>,
};
struct Settings { size:vec4<u32>, seed:vec4<u32>, storms:array<SatelliteStorm,8> };
@group(0) @binding(0) var<uniform> settings:Settings;
@group(0) @binding(1) var shape:texture_storage_3d<rgba16float,write>;
@group(0) @binding(2) var weather:texture_storage_2d_array<rgba16float,write>;
fn hash(p:vec3<i32>,seed:u32)->f32 {
 var h=(bitcast<u32>(p.x)*0x9e3779b9u) ^ (bitcast<u32>(p.y)*0x85ebca6bu) ^ (bitcast<u32>(p.z)*0xc2b2ae35u) ^ seed;
 h=(h^(h>>16u))*0x7feb352du;h=(h^(h>>15u))*0x846ca68bu;h=h^(h>>16u);
 return f32(h>>8u)*(1.0/16777216.0);
}
fn value(p:vec3<f32>,period:i32,seed:u32)->f32 {
 let cell=vec3<i32>(floor(p));let f=fract(p);let t=f*f*f*(f*(f*6.0-15.0)+10.0);var sum=0.0;
 for(var z=0;z<2;z++){for(var y=0;y<2;y++){for(var x=0;x<2;x++){
  let offset=vec3<i32>(x,y,z);let q=((cell+offset)%vec3<i32>(period)+vec3<i32>(period))%vec3<i32>(period);
  let weight=select(vec3<f32>(1.0)-t,t,vec3<bool>(x==1,y==1,z==1));sum+=hash(q,seed)*weight.x*weight.y*weight.z;
 }}}return sum;
}
fn fbm(p:vec3<f32>,frequency:i32,seed:u32)->f32 {
 let domain=p+vec3<f32>(.79,.23,-.57)*bitcast<f32>(settings.size.w);
 var sum=0.0;var amp=1.0;var total=0.0;var frequencyNow=frequency;
 for(var o=0u;o<3u;o++){sum+=value(domain*f32(frequencyNow),frequencyNow,seed+o*1973u)*amp;total+=amp;amp*=0.45;frequencyNow*=2;}
 return sum/total;
}
// Analytic smooth-noise gradient: the sphere equivalent of curl-FBM's
// rotated gradient, without a flat longitude-domain discontinuity.
fn valueGradient(p:vec3<f32>,seed:u32)->vec3<f32> {
 let domain=p+vec3<f32>(.79,.23,-.57)*bitcast<f32>(settings.size.w)*3.1;
 let cell=vec3<i32>(floor(domain));let f=fract(domain);
 let t=f*f*f*(f*(f*6.0-15.0)+10.0);let dt=30.0*f*f*(f-1.0)*(f-1.0);
 var gradient=vec3<f32>(0);
 for(var z=0;z<2;z++){for(var y=0;y<2;y++){for(var x=0;x<2;x++){
  let offset=vec3<i32>(x,y,z);let positive=vec3<bool>(x==1,y==1,z==1);
  let w=select(vec3<f32>(1)-t,t,positive);let dw=select(-dt,dt,positive);
  gradient+=hash(cell+offset,seed)*vec3<f32>(dw.x*w.y*w.z,w.x*dw.y*w.z,w.x*w.y*dw.z);
 }}}return gradient;
}
fn sphereCurl(direction:vec3<f32>,seed:u32)->vec3<f32> {
 let gradient=valueGradient(direction*3.1+vec3<f32>(.31,.79,.53),seed)*3.1
  +valueGradient(direction*6.3+vec3<f32>(1.17,.43,.91),seed+1973u)*2.2;
 return cross(direction,gradient);
}
fn gasCurl(direction:vec3<f32>,seed:u32,mode:u32)->vec3<f32> {
 var curl=sphereCurl(direction,seed);
 if(mode==3u){
  // Smaller eddies fold into the broad swirls; only evaluated in the bake.
  curl+=cross(direction,valueGradient(direction*12.7+vec3<f32>(.63,.27,.91),seed+7919u))*.55;
 }
 return curl;
}
fn vortex(direction:vec3<f32>,axis:vec3<f32>,strength:f32)->vec3<f32> {
 let n=normalize(axis);let angle=strength*exp(-max(1.0-dot(direction,n),0.0)*38.0);
 return direction*cos(angle)+cross(n,direction)*sin(angle)+n*dot(n,direction)*(1.0-cos(angle));
}
// Smaller, uneven vortices fill the alien atmosphere, without adding runtime
// simulation or longitude-domain stripes. Jupiter keeps its original eddies.
fn hailMaryVortices(input:vec3<f32>,seed:u32)->vec3<f32> {
 var direction=input;
 for(var i=0u;i<18u;i++){
  let cell=vec3<i32>(i32(i),41,67);
  let axis=normalize(vec3<f32>(hash(cell,seed),hash(cell,seed+173u),hash(cell,seed+347u))*2.0-1.0+vec3<f32>(.001));
  let reach=mix(55.0,140.0,hash(cell,seed+719u));
  let angle=(hash(cell,seed+523u)-.5)*6.0*exp(-max(1.0-dot(direction,axis),0.0)*reach);
  direction=direction*cos(angle)+cross(axis,direction)*sin(angle)+axis*dot(axis,direction)*(1.0-cos(angle));
 }
 return direction;
}
// Elliptical anticyclone in a tangent frame, continuous across longitude/poles.
fn stormFrame(direction:vec3<f32>,axis:vec3<f32>)->vec2<f32> {
 let east=normalize(cross(vec3<f32>(0,1,0),axis));let north=cross(axis,east);
 return vec2<f32>(dot(direction,east),dot(direction,north));
}
fn stormMask(direction:vec3<f32>,axis:vec3<f32>)->f32 {
 let q=stormFrame(direction,axis)/vec2<f32>(.42,.18);
 return exp(-dot(q,q)*2.0)*smoothstep(.70,.90,dot(direction,axis));
}
fn stormWarp(direction:vec3<f32>,axis:vec3<f32>)->vec3<f32> {
 let east=normalize(cross(vec3<f32>(0,1,0),axis));let north=cross(axis,east);
 let q=stormFrame(direction,axis)/vec2<f32>(1.8,1);
 let angle=stormMask(direction,axis)*4.2;
 let spun=vec2<f32>(q.x*cos(angle)-q.y*sin(angle),q.x*sin(angle)+q.y*cos(angle))*vec2<f32>(1.8,1);
 return normalize(axis*dot(direction,axis)+east*spun.x+north*spun.y);
}
@compute @workgroup_size(4,4,4) fn shapeNoise(@builtin(global_invocation_id) id:vec3<u32>) {
 if(any(id>=vec3<u32>(settings.size.x))){return;}
 let p=(vec3<f32>(id)+0.5)/f32(settings.size.x);let seed=settings.seed.x;
 textureStore(shape,vec3<i32>(id),vec4<f32>(fbm(p,4,seed),fbm(p,8,seed+173u),fbm(p,16,seed+347u),fbm(p,2,seed+523u)));
}
// Periodic, jittered spheres give the towers rounded lobes. Their cost is
// paid when baking the volume, shared by the raymarch and MC33 renderers.
fn cellularDistances(p:vec3<f32>, period:i32, seed:u32)->vec2<f32> {
 let domain=p*f32(period);
 let cell=vec3<i32>(floor(domain));
 let local=fract(domain);
 let wrap=vec3<i32>(period);
 var nearest=3.0;var second=3.0;
 for(var z=-1;z<=1;z++){for(var y=-1;y<=1;y++){for(var x=-1;x<=1;x++){
  let offset=vec3<i32>(x,y,z);
  let site=((cell+offset)%wrap+wrap)%wrap;
  let jitter=vec3<f32>(hash(site,seed),hash(site,seed+173u),hash(site,seed+347u));
  let delta=vec3<f32>(offset)+mix(vec3<f32>(0.12),vec3<f32>(0.88),jitter)-local;
  let distance=dot(delta,delta);
  second=min(second,max(nearest,distance));
  nearest=min(nearest,distance);
 }}}
 return sqrt(vec2<f32>(nearest,second));
}
@compute @workgroup_size(4,4,4) fn billowShapeNoise(@builtin(global_invocation_id) id:vec3<u32>) {
 if(any(id>=vec3<u32>(settings.size.x))){return;}
 let p=(vec3<f32>(id)+0.5)/f32(settings.size.x);
 let seed=settings.seed.x;
 let warp=vec3<f32>(value(p*3.0,3,seed+881u),value(p*3.0,3,seed+997u),value(p*3.0,3,seed+1223u));
 let q=p+(warp-0.5)*0.13;
 let mode=settings.seed.z;
 let fine=mode>=2u;
 // An integer shear preserves wrap continuity while stretching the wisp lobes.
 let stretched=mode==4u || mode==5u;
 var lobeDomain=select(q,vec3<f32>(q.x+2.0*q.y,q.y+q.z,q.z-q.y),stretched);
 if(mode==12u){lobeDomain=vec3<f32>(q.x+q.y,q.y,q.z-q.x);}
 let stormTowers=mode==10u || mode==14u || mode==15u;
 let cumulus=stormTowers || mode==2u;
 let cellularFringe=cumulus || mode==11u;
 let period=select(8,select(11,13,mode==3u || mode==13u || cumulus),fine);
 let body=fbm(q,3,seed);
 let cellular=cellularDistances(lobeDomain,period,seed+173u);
 let antiWorley=1.0-smoothstep(0.04,0.80,cellular.x*cellular.x);
 let cellEdge=1.0-smoothstep(0.03,0.33,cellular.y-cellular.x);
 let smoothField=fbm(lobeDomain,period-1,seed+319u);
 var lobes=mix(smoothField,antiWorley,0.70);
 if(mode==1u||mode==2u||mode==6u){lobes=mix(smoothField,antiWorley,0.37)-cellEdge*0.12;}
 if(mode==4u){lobes=mix(smoothField,cellEdge,0.36);}
 if(mode==5u){lobes=mix(smoothField,antiWorley,0.40)-cellEdge*0.24;}
 if(mode==7u){lobes=mix(smoothField,antiWorley,0.15);}
 if(mode==8u){lobes=mix(smoothField,antiWorley,0.54);}
 if(mode==9u){lobes=mix(smoothField,antiWorley,0.20)-cellEdge*0.12;}
 if(mode==13u){lobes=mix(smoothField,antiWorley,0.58)-cellEdge*0.085;}
 if(mode==11u){lobes=mix(smoothField,antiWorley,0.40)-cellEdge*0.12;}
 if(cumulus){
  // Rounded cell centers reinforce the billows. Pack the thinner cellular
  // features independently so they can erode the silhouette at render time.
  lobes=mix(smoothField,antiWorley,select(.44,.53,stormTowers))-cellEdge*.12;
 }
 if(mode==12u){lobes=smoothField*.69+cellEdge*.29-(antiWorley-.5)*.12;}
 let detailPeriod=select(17,24,fine);
 let finePeriod=select(31,43,fine && settings.size.x>=96u);
 let coarseBillows=value(lobeDomain*f32(detailPeriod),detailPeriod,seed+347u);
 let fineBillows=value(lobeDomain*f32(finePeriod),finePeriod,seed+1619u);
 let billows=mix(coarseBillows,fineBillows,.38);
 var detail=billows+(cellular.y-cellular.x-.21)*.16;
 if(cellularFringe){
  // Reuse the same Voronoi query as the puffs. Modulate narrow cell edges
  // with fine billows so the wisps taper and break along each boundary.
  let filaments=cellEdge*smoothstep(.29,.68,billows);
  let hollows=antiWorley*smoothstep(.25,.63,1.0-billows);
  detail=.5+(billows-.5)*.78+filaments*.36-hollows*.22;
 }
 detail=clamp(detail,0.0,1.0);
 var structure=fbm(q,2,seed+523u);
 if(mode==11u){
  // Pack a finer non-cellular signal alongside the broad and cellular billows.
  structure=mix(structure,fbm(lobeDomain+vec3<f32>(.37,.12,.65),19,seed+523u),.68);
 }
 textureStore(shape,vec3<i32>(id),vec4<f32>(body,lobes,detail,structure));
}
// Project nearby seeded cells onto the local tangent plane. Each cell
// supplies a narrow updraft and the wider, displaced outflow from that updraft.
fn convectiveWeather(direction:vec3<f32>,seed:u32,mode:u32)->vec4<f32> {
 let anvil=mode==10u;
 let bank=mode==14u;
 let frequency=select(select(11.0,8.0,bank),7.0,anvil);
 let weatherDomain=direction*.36+vec3<f32>(.41,.57,.38);
 let humidity=smoothstep(.28,.70,fbm(weatherDomain,5,seed+5407u));
 let p=direction*frequency+sphereCurl(direction,seed+3191u)*.086;
 let cell=vec3<i32>(floor(p));
 let windAxis=vec3<f32>(.36,.48,.80);
 let projectedWind=windAxis-direction*dot(direction,windAxis);
 let wind=projectedWind/max(length(projectedWind),.18);
 var core=0.0;
 var outflow=0.0;
 var height=0.0;
 var base=0.0;
 var weight=0.0;
 for(var z=-1;z<=1;z++){for(var y=-1;y<=1;y++){for(var x=-1;x<=1;x++){
  let site=cell+vec3<i32>(x,y,z);
  let jitter=vec3<f32>(hash(site,seed),hash(site,seed+173u),hash(site,seed+347u));
  let delta=p-(vec3<f32>(site)+.5+(jitter-.5)*.66);
  let window=1.0-smoothstep(.76,1.12,max(max(abs(delta.x),abs(delta.y)),abs(delta.z)));
  if(window<=0.0){continue;}
  let radial=dot(delta,direction);
  let activity=hash(site,seed+3797u);
  let strength=window*(1.0-smoothstep(.22,.76,abs(radial)))*
    smoothstep(.12,.63,activity+humidity*.22)*mix(.71,1.0,humidity);
  let lateral=delta-direction*radial;
  let width=mix(.22,select(.70,.76,bank),jitter.x);
  let along=dot(lateral,wind);
  let crosswind=length(lateral-wind*along);
  let rising=strength*(1.0-smoothstep(width*.14,width,length(vec2<f32>(along*.88,crosswind*1.12))));
  let shear=mix(.43,.91,jitter.z);
  let capDistance=length(vec2<f32>((along-width*shear)*mix(.48,.83,jitter.y),crosswind*1.45));
  let spread=strength*(1.0-smoothstep(width*.22,width*1.26,capDistance));
  core=max(core,rising);
  outflow=max(outflow,spread);
  let localWeight=max(rising,spread*.65);
  height+=localWeight*clamp(jitter.y-along*.23,0.0,1.0);
  base+=localWeight*jitter.z;
  weight+=localWeight;
 }}}
 let billows=fbm(weatherDomain,37,seed+5711u);
 let scoured=(billows-.52)*.34;
 return vec4<f32>(clamp(core+scoured,0.0,1.0),height/max(weight,.001),
   clamp(outflow+scoured,0.0,1.0),base/max(weight,.001));
}
@compute @workgroup_size(8,8,1) fn weatherNoise(@builtin(global_invocation_id) id:vec3<u32>) {
 if(any(id.xy>=settings.size.yz)){return;}
 let uv=(vec2<f32>(id.xy)+0.5)/vec2<f32>(settings.size.yz);
 // Same convention as sphereUVFromWorld: atan2(z,x)/(2*pi), no half-turn.
 let longitude=uv.x*6.283185307;let latitude=uv.y*3.141592654;
 let direction=vec3<f32>(sin(latitude)*cos(longitude),cos(latitude),sin(latitude)*sin(longitude));
 let mode=settings.seed.z;
 if(mode==11u){
  textureStore(weather,vec2<i32>(id.xy),0,mixedWeatherNoise(direction,settings.seed.x));
  return;
 }
 if(mode==10u || mode==14u || mode==15u){
  textureStore(weather,vec2<i32>(id.xy),0,convectiveWeather(direction,settings.seed.x,mode));
  return;
 }
 let p=direction*0.36+vec3<f32>(0.5);let a=fbm(p,4,settings.seed.x+911u);let b=fbm(p,8,settings.seed.x+1237u);
 let hemisphere=smoothstep(-0.12,0.16,dot(direction,normalize(vec3<f32>(1.0,0.10,0.0)))+(b-0.5)*0.32);
 var crest=0.0;
 if(settings.seed.z>=2u){
  let drift=dot(direction,vec3<f32>(.37,.83,-.41))*42.0+12.0*a;
  let wave=0.5+0.5*sin(drift+3.2*b);
  crest=mix(b,wave,smoothstep(.38,.64,a)*.72);
 }
 var weatherSample=vec4<f32>(a,b,crest,hemisphere);
 if(settings.seed.z==9u || settings.seed.z==13u){
  let seed=settings.seed.x;
  let flow=normalize(direction-sphereCurl(direction,seed+3191u)*.035);
  let strips=vec3<f32>(dot(flow,vec3<f32>(.36,.48,.80))*.36,
   dot(flow,vec3<f32>(-.80,.60,0))*1.12,dot(flow,vec3<f32>(-.48,-.64,.60))*.61);
  let bands=fbm(strips+vec3<f32>(.51,.43,.69),9,seed+5849u);
  let pockets=fbm(p,24,seed+8363u);
  let system=fbm(p,6,seed+719u);
  let deck=smoothstep(.34,.67,mix(bands,a,.36)+(system-.5)*.24);
  let openings=smoothstep(.37,.66,mix(system,pockets,.27));
  weatherSample=vec4<f32>(deck,pockets,b,openings);
  if(settings.seed.z==13u){weatherSample=vec4<f32>(openings,b,pockets,system);}
 }
 if(settings.seed.z==12u){
  let ripples=.5+.5*sin(dot(direction,vec3<f32>(.27,.89,.36))*134.0+a*21.0+b*5.0);
  weatherSample=vec4<f32>(a,b,mix(b,ripples,.44),hemisphere);
 }
 textureStore(weather,vec2<i32>(id.xy),0,weatherSample);
}
// Separate synoptic and filament scales. Clear air is decided by the
// regional field, so small eddies cannot fill whole gaps between systems.
fn sparseSatelliteWeather(world:vec3<f32>, scale:f32, seed:u32, cirrus:bool)->vec4<f32> {
 let flow=world+sphereCurl(world,seed+3191u)*(.072/max(1.0,scale));
 let p=flow*.34+vec3<f32>(.57,.39,.68);
 let synoptic=fbm(p,4,seed+911u);
 let moisture=smoothstep(.43,.61,synoptic);
 let lift=fbm(p,9,seed+5711u);
 let turbulence=fbm(p,33,seed+1237u);
 let along=dot(flow,vec3<f32>(.36,.48,.80));
 let across=dot(flow,vec3<f32>(-.80,.60,0));
 let vertical=dot(flow,vec3<f32>(-.48,-.64,.60));
 let shear=vec3<f32>(along*.14,across*.68,vertical*.32)+vec3<f32>(.13,.61,.79);
 let band=fbm(shear,13,seed+2101u);
 let filaments=fbm(shear*vec3<f32>(.70,1.38,1.18)+vec3<f32>(.38,.11,.23),27,seed+809u);

 // One wide shoulder and one sharper edge give each front an asymmetric
 // cross section. Correlated small eddies feather its edge and open holes.
 let bank=band+(lift-.5)*.26+(turbulence-.5)*.19;
 let core=smoothstep(.47,.69,bank)*smoothstep(.36,.58,lift+.13*moisture);
 let threads=1.0-smoothstep(.021,.085,abs(band-.54+(filaments-.5)*.28));
 let fray=smoothstep(.36,.61,filaments+(turbulence-.5)*.33);
 let trail=threads*fray*smoothstep(.32,.56,lift);
 let clearSky=mix(.15,1.0,moisture);
 let cover=select((core*.98+trail*.25)*clearSky,(core*.40+trail*.38)*clearSky,cirrus);
 let ice=select(trail*clearSky,clamp(trail*1.67+core*.22,0.0,1.0)*clearSky,cirrus);
 return vec4<f32>(clamp(cover,0.0,1.0),turbulence,lift,ice);
}

// The alpha channel selects neighboring profiles in mixedWeatherForm. RGB
// hold the low cloud footprint, its height or turbulence, and the upper
// footprint. Build the footprints here, once, using the same sphere as the
// standalone weather maps.
fn mixedWeatherFootprint(direction:vec3<f32>, flow:vec3<f32>,
    weatherFields:vec3<f32>, seed:u32, region:u32)->vec3<f32> {
 let humidity=weatherFields.x;
 let local=weatherFields.y;
 let synoptic=weatherFields.z;
 switch region {
  case 0u: { // Broken stratocumulus
   let gaps=smoothstep(.38,.62,mix(local,synoptic,.42));
   return vec3<f32>(gaps,local,synoptic);
  }
  case 1u: { // Fair-weather puffs
   let opening=smoothstep(.47,.72,local*.72+humidity*.28);
   return vec3<f32>(opening,local,synoptic);
  }
  case 2u: { // Island cumulus
   let bank=smoothstep(.46,.67,synoptic+(local-.5)*.24);
   return vec3<f32>(bank,local,synoptic);
  }
  case 3u, 4u: { // Towering cumulus and downwind anvil outflow
   return convectiveWeather(direction,seed+2437u,select(14u,10u,region==4u)).rgb;
  }
  case 5u, 6u, 7u: { // Trade-wind streets, altocumulus ripples, lenticular waves
   let along=dot(flow,vec3<f32>(.36,.48,.80));
   let across=dot(flow,vec3<f32>(-.80,.60,0));
   let vertical=dot(flow,vec3<f32>(-.48,-.64,.60));
   let waviness=mix(.70,1.36,synoptic);
   let q=vec3<f32>(along*.14,across*.81,vertical*.32)+vec3<f32>(.51,.43,.69);
   let waves=fbm(q,select(17,10,region==7u),seed+5849u);
   let phase=across*mix(58.0,150.0,f32(region-5u)*.5)+vertical*19.0+(waves-.5)*7.0;
   let crest=.5+.5*sin(phase);
   let banks=smoothstep(.40,.63,waves+(local-.5)*.35);
   if(region==7u){return vec3<f32>(banks*smoothstep(.45,.75,crest),local,waves);}
   let bands=smoothstep(.31,.81,crest);
   return vec3<f32>(banks*bands*waviness,local,bands);
  }
  default: { // Frontal bands, wind-swept wisps, ice filaments, sparse high bands
   let front=sparseSatelliteWeather(direction,1.0,seed+719u,region==10u);
   let fiber=select(front.a,max(front.a,front.r*.52),region==9u);
   return vec3<f32>(min(1.0,front.r*1.18),front.g,min(1.0,fiber*1.12));
  }
 }
}

fn mixedWeatherNoise(direction:vec3<f32>,seed:u32)->vec4<f32> {
 let flow=normalize(direction+sphereCurl(direction,seed+3191u)*.047);
 let p=flow*.36+vec3<f32>(.47,.56,.38);
 let climate=value(p*5.0,5,seed+9131u);
 let transition=value(p*9.0,9,seed+1187u);
 let regime=smoothstep(.12,.88,mix(climate,transition,.18));
 let humidity=fbm(p,5,seed+719u);
 let local=fbm(p,24,seed+8363u);
 let synoptic=fbm(p,11,seed+5711u);
 let fields=vec3<f32>(humidity,local,synoptic);
 let key=regime*11.0;
 let region=u32(floor(key));
 let blend=smoothstep(.26,.74,fract(key));
 var footprint:vec3<f32>;
 if(blend<=0.0){
  footprint=mixedWeatherFootprint(direction,flow,fields,seed,region);
 }else if(blend>=1.0){
  footprint=mixedWeatherFootprint(direction,flow,fields,seed,region+1u);
 }else{
  footprint=mix(mixedWeatherFootprint(direction,flow,fields,seed,region),
    mixedWeatherFootprint(direction,flow,fields,seed,region+1u),blend);
 }
 // The same dry air suppresses both layers, leaving large breaks between systems.
 let moisture=mix(.24,1.0,smoothstep(.31,.54,humidity));
 footprint=vec3<f32>(clamp(footprint.r*moisture,0.0,1.0),footprint.g,footprint.b*moisture);
 return vec4<f32>(footprint,regime);
}

// Satellite cloud maps: connected fronts, curled storm shields and smaller
// maritime clouds. This runs at setup or in-place regeneration, never per ray sample.
// Evaluate only the storms close enough to affect this direction.
fn satelliteStorms(direction:vec3<f32>, breakup:f32, streak:f32)->vec3<f32> {
 var deck=0.0;
 var ice=0.0;
 var opening=1.0;
 for(var i=0u;i<8u;i++){
  let storm=settings.storms[i];
  let extent=storm.axisRadius.w;
  if(extent<=0.0){break;}
  let axis=storm.axisRadius.xyz;
  let delta=direction-axis;
  if(dot(delta,delta)>extent*extent){continue;}
  let local=stormFrame(direction,axis)/extent;
  let r=length(local);
  let angle=atan2(local.y,local.x+1e-7);
  let phase=storm.shape.w+bitcast<f32>(settings.size.w)*2.1;
  let rotation=select(-1.0,1.0,axis.y>0.0);
  let age=storm.shape.z;
  let eye=storm.shape.x*(1.0+.12*sin(3.0*angle+phase));
  let shield=1.0-smoothstep(.19,.48,r+(breakup-.5)*.23);
  let eyewall=smoothstep(eye*.75,eye*1.30,r)*(1.0-smoothstep(eye*1.50,eye*3.2,r));
  let pitch=rotation*storm.shape.y*log(max(r,eye));
  let bands=.5+.5*cos(2.0*angle+pitch+phase+2.5*(breakup-.5));
  let arm=smoothstep(.45,.89,bands)*(1.0-smoothstep(.62,.99,r));
  let outflow=arm*smoothstep(.22,.70,streak);
  let asymmetry=.76+.24*cos(angle+phase);
  deck=max(deck,age*(.64*shield*asymmetry+.47*eyewall+.67*arm));
  ice=max(ice,age*outflow);
  opening=min(opening,smoothstep(eye*.53,eye*1.05,r));
 }
 return vec3<f32>(deck,ice,opening);
}

// Evaluate the weather on the sphere so latitude/longitude is only a storage layout.
fn satelliteSystems(direction:vec3<f32>,scale:f32,seed:u32,mode:u32)->vec4<f32> {
 let cartoon=mode<7u;
 let world=direction*scale;
 let flow=world+sphereCurl(world,seed+3191u)*(.052/scale);
 let p=flow*.34+vec3<f32>(.57,.39,.68);
 // Preserve broad dry and wet regions while scaling individual systems.
 let synoptic=fbm(p/sqrt(scale),4,seed+911u);
 let banks=fbm(p,12,seed+5711u);
 let fine=fbm(p,38,seed+1237u);
 let lat=abs(direction.y+(synoptic-.5)*.24);
 let mid=smoothstep(.33,.58,lat)*(1.0-smoothstep(.78,.99,lat));
 let tropics=1.0-smoothstep(.035,.20,lat);
 let moisture=mix(.28,1.0,smoothstep(.35,.61,synoptic+.15*mid+.13*tropics));
 let shear=vec3<f32>(dot(flow,vec3<f32>(.36,.48,.80))*.17,
   dot(flow,vec3<f32>(-.80,.60,0))*.69,dot(flow,vec3<f32>(-.48,-.64,.60))*.33);
 // Change the stretch with the weather regime. Across the same planet,
 // some fronts fan out into ragged shields and others stay narrow.
 var frontDomain=shear;
 if(!cartoon){
  frontDomain=mix(shear,vec3<f32>(shear.z*.92,shear.y*.74,shear.x*1.82),
   smoothstep(.37,.67,synoptic));
  frontDomain+=vec3<f32>(banks-.5,fine-.5,synoptic-.5)*.042;
 }
 let ribbons=fbm(frontDomain+vec3<f32>(.13,.61,.79),12,seed+2101u);
 let time=bitcast<f32>(settings.size.w);
 let filamentDomain=shear*vec3<f32>(14.0,70.0,38.0)+vec3<f32>(11.3,23.7,17.1)
  + time*vec3<f32>(1.8,-.37,.65);
 let threads=value(filamentDomain,73,seed+809u);
 let edge=ribbons+(banks-.50)*.45+(fine-.5)*.21;
 let storms=satelliteStorms(direction,fine,threads);
 if(!cartoon){
  // Concentrate opaque cloud in the lifted side of the front. Filaments
  // trail into the clear side, with patchy maritime clouds elsewhere.
  let lift=smoothstep(.34,.66,banks+.10*mid);
  let frontEdge=edge+(threads-.5)*.13;
  let shield=smoothstep(.40,.59,frontEdge)*lift;
  let coldSide=smoothstep(.32,.43,frontEdge)*(1.0-smoothstep(.46,.60,frontEdge));
  let feathering=smoothstep(.29,.70,threads+(fine-.5)*.43);
  let maritime=smoothstep(.48,.72,fine+(banks-.5)*.34);
  let openSky=smoothstep(.43,.68,synoptic+.07*tropics);
  let lowCloud=maritime*smoothstep(.30,.65,banks)*mix(.33,1.05,openSky);
  let stormCover=storms.x*1.22;
  let cover=max(max(shield*mix(.55,1.85,moisture),lowCloud),stormCover);
  let wisps=max(coldSide*feathering*lift*mix(.55,1.30,moisture),storms.y);
  return vec4<f32>(clamp(cover,0.0,1.0)*storms.z,
    mix(-.45,fine,storms.z),max(banks,storms.x*.76),clamp(wisps,0.0,1.0)*storms.z);
 }
 let front=smoothstep(.46,.74,edge)*mix(.34,1.0,max(mid,tropics));
 let fringe=1.0-smoothstep(.024,.125,abs(edge-.49+(threads-.50)*.13));
 let filaments=smoothstep(.38,.70,threads+(fine-.5)*.28);
 let cirrus=fringe*filaments;
 let low=smoothstep(.46,.71,fine)*smoothstep(.39,.67,banks);
 let deck=moisture*(front*select(1.04,.65,mode==5u)+low*select(.45,.90,mode==6u));
 let cover=max(deck,storms.x*1.18);
 let wisps=max(cirrus*mix(.42,.92,moisture),storms.y);
 return vec4<f32>(clamp(cover,0.0,1.0)*storms.z,
   mix(-.45,fine,storms.z),max(banks,storms.x*.76),clamp(wisps,0.0,1.0)*storms.z);
}

@compute @workgroup_size(8,8,1) fn satelliteWeatherNoise(@builtin(global_invocation_id) id:vec3<u32>) {
 if(any(id.xy>=settings.size.yz)){return;}
 let uv=(vec2<f32>(id.xy)+.5)/vec2<f32>(settings.size.yz);
 let lon=uv.x*6.283185307;let lat=uv.y*3.141592654;
 let original=vec3<f32>(sin(lat)*cos(lon),cos(lat),sin(lat)*sin(lon));
 var d=original;let seed=settings.seed.x;let mode=settings.seed.y;
 if(mode>=8u){
  let scale=bitcast<f32>(settings.seed.w);
  textureStore(weather,vec2<i32>(id.xy),0,sparseSatelliteWeather(original*scale,scale,seed,mode==9u));
  return;
 }
 if(bitcast<f32>(settings.seed.w)>0.0){
  textureStore(weather,vec2<i32>(id.xy),0,satelliteSystems(original,bitcast<f32>(settings.seed.w),seed,mode));
  return;
 }
 var shields=0.0;
 for(var i=0u;i<6u;i++){
  let cell=vec3<i32>(i32(i),83,137);
  let longitude=hash(cell,seed+17u)*6.283185307;
  let latitude=(hash(cell,seed+347u)*2.0-1.0)*.70;
  let axis=vec3<f32>(sqrt(1.0-latitude*latitude)*cos(longitude),latitude,sqrt(1.0-latitude*latitude)*sin(longitude));
  let local=stormFrame(d,axis);
  let q=local/vec2<f32>(.34,.24);
  let reach=exp(-dot(q,q)*1.5)*smoothstep(.75,.94,dot(d,axis));
  let handed=select(-1.0,1.0,axis.y>0.0);
  d=vortex(d,axis,handed*3.0);
  // An uneven central shield connects to the spiraling front, without rings.
  shields=max(shields,reach);
 }
 for(var i=0;i<4;i++){
  let curl=sphereCurl(d,seed+3191u);
  d=normalize(d-curl*.012);
 }
 let p=d*.36+vec3<f32>(.5);
 let broad=fbm(p,8,seed+911u);let fine=fbm(p,64,seed+1237u);
 let banks=fbm(p,16,seed+5711u);
 // Stretched cloud shields with one ragged side, rather than closed contour
 // ropes. Backtracing rolls these elongated banks into comma-shaped fronts.
 let frontDomain=vec3<f32>(dot(d,vec3<f32>(.36,.48,.80))*.58,
   dot(d,vec3<f32>(-.80,.60,0))*1.45,dot(d,vec3<f32>(-.48,-.64,.60))*.42)+vec3<f32>(.5);
 let front=smoothstep(.45,.64,fbm(frontDomain,8,seed+2101u)+(fine-.5)*.12);
 let openings=smoothstep(.30,.58,fbm(p,4,seed+6029u));
 let sheets=smoothstep(.44,.64,banks)*smoothstep(.35,.55,broad);
 let cells=smoothstep(.45,.66,fine)*smoothstep(.38,.60,banks);
 let baseCover=clamp(front*openings*.86+sheets*.43+shields*.65+cells*.20,0.0,1.0);
 // Fine erosion softens ragged rims while keeping large cloud shields intact.
 let cover=clamp(baseCover+(fine-.5)*.16,0.0,1.0);
 let crest=mix(banks,0.5+0.5*sin(dot(d,vec3<f32>(.36,.48,.8))*46.0+8.0*broad),0.53);
 textureStore(weather,vec2<i32>(id.xy),0,vec4<f32>(cover,fine,crest,1.0));
}
// Bake or regenerate the weather map; keep backtracing outside ray samples.
@compute @workgroup_size(8,8,1) fn gasWeatherNoise(@builtin(global_invocation_id) id:vec3<u32>) {
 if(any(id.xy>=settings.size.yz)){return;}
 let uv=(vec2<f32>(id.xy)+.5)/vec2<f32>(settings.size.yz);
 let longitude=uv.x*6.283185307;let latitude=uv.y*3.141592654;
 var direction=vec3<f32>(sin(latitude)*cos(longitude),cos(latitude),sin(latitude)*sin(longitude));
 let originalDirection=direction;
 let seed=settings.seed.x;
 let mode=settings.seed.y;
 // A prominent oval storm and a smaller counter-eddy beneath the fine curls.
 // Seed varies the longitude slightly; these are not per-frame simulations.
 let stormLongitude=1.27+(hash(vec3<i32>(7,11,19),seed)-.5)*.65;
 let stormAxis=normalize(vec3<f32>(cos(stormLongitude),-.25,sin(stormLongitude)));
 if(mode==2u){
  // Neptune is a smooth blue atmosphere, not Jupiter recolored blue. Sparse,
  // slender ice-cloud streaks cross gentle jets around one small dark oval.
  let cloudDirection=normalize(direction+sphereCurl(direction,seed+3191u)*.007);
  let p=cloudDirection*.36+vec3<f32>(.5);
  let broad=fbm(p,4,seed+911u);let fine=fbm(p,64,seed+1237u);
  let banks=fbm(p,8,seed+5711u);
  let laneLatitude=cloudDirection.y+(broad-.5)*.045;
  let ridge=exp(-pow((laneLatitude-.59)/.006,2.0))*.6
   +exp(-pow((laneLatitude-.14)/.004,2.0))*.8+exp(-pow((laneLatitude+.37)/.008,2.0))*.4;
  let local=stormFrame(direction,stormAxis);
  let stormWisps=exp(-pow((local.y-.10-(fine-.5)*.025)/.008,2.0))*exp(-pow(local.x/.32,4.0));
  let streak=clamp((ridge+stormWisps)*smoothstep(.47,.65,banks)*(.55+fine*.45),0.0,1.0);
  let q=local/vec2<f32>(.24,.095);
  let darkSpot=exp(-dot(q,q)*2.0)*smoothstep(.70,.90,dot(direction,stormAxis));
  let pigment=clamp(.52+(broad-.5)*.22+(fine-.5)*.08+sin(direction.y*48.0)*.012,0.0,1.0);
  textureStore(weather,vec2<i32>(id.xy),0,vec4<f32>(broad,streak,darkSpot,pigment));
  return;
 }
 direction=stormWarp(direction,stormAxis);
 for(var i=0u;i<7u;i++){
  let cell=vec3<i32>(i32(i),13,29);
  let axis=normalize(vec3<f32>(hash(cell,seed),hash(cell,seed+173u),hash(cell,seed+347u))*2.0-1.0+vec3<f32>(.001));
  direction=vortex(direction,axis,(hash(cell,seed+523u)-.5)*5.8);
 }
 for(var i=0;i<10;i++){
  // Gentler alien backtracing keeps the fine strands resolvable instead of
  // folding them into sub-texel speckles. Local vortices provide the curls.
  let curlStep=select(.020,.012,mode==3u);
  let midpoint=normalize(direction-gasCurl(direction,seed+3191u,mode)*curlStep*.5);
  direction=normalize(direction-gasCurl(midpoint,seed+3191u,mode)*curlStep);
 }
 if(mode==3u){direction=hailMaryVortices(direction,seed+15401u);}
 let p=direction*.36+vec3<f32>(.5);
 let broad=fbm(p,8,seed+911u);let fine=fbm(p,32,seed+1237u);
 if(mode==3u){
  // Green dominates. Separate low-frequency weather selects scattered rusty
  // regions, rather than coloring an entire hemisphere with a direction dot.
  let regions=fbm(p,4,seed+6029u);
  let rustPatches=smoothstep(.53,.66,regions+(broad-.5)*.18);
  // Long oblique threads transported through all the vortices. Fine FBM
  // modulates them gently instead of breaking the strands into noisy dots.
  // They have no special relationship to the planet's latitude or seam.
  let threadPhase=dot(direction,vec3<f32>(.37,.83,-.41))*98.0+broad*6.0+(fine-.5)*.9;
  let thread=pow(.5+.5*cos(threadPhase),8.0);
  let smaller=pow(.5+.5*cos(threadPhase*1.93+broad*3.0),12.0)*.32;
  let filaments=clamp((thread+smaller)*(.75+fine*.25),0.0,1.0);
  textureStore(weather,vec2<i32>(id.xy),0,vec4<f32>(broad,fine,filaments,1.0-rustPatches));
  return;
 }
 let bandPhase=direction.y*46.0+(broad-.5)*9.0+(fine-.5)*3.0;
 let filaments=.5+.5*sin(bandPhase*3.7+(fine-.5)*14.0);
 // Unequal Jovian belts: two disturbed broad belts, weaker narrow banks,
 // pale equatorial zones and quieter ochre poles. No repeated sine stripes.
 let beltLatitude=originalDirection.y+(direction.y-originalDirection.y)*.16+(broad-.5)*.065;
 let northBelt=exp(-pow((beltLatitude-.27)/(.042+broad*.10),2.0));
 let southBelt=exp(-pow((beltLatitude+.24)/(.045+fine*.08),2.0));
 let smallBanks=exp(-pow((beltLatitude-.54)/.027,2.0))*.25+exp(-pow((beltLatitude+.51)/(.025+broad*.024),2.0))*.34;
 let belts=clamp(northBelt*.85+southBelt+smallBanks,0.0,1.0);
 let poles=smoothstep(.60,.91,abs(originalDirection.y));
 let edgeBreakup=(filaments-.5)*.16*(.18+belts*.82)+(fine-.5)*.09;
 let pigment=clamp(.85-belts*.61-poles*.34+edgeBreakup,0.0,1.0);
 // The turbulent wake is much larger than its colored storm core.
 let stormCore=stormFrame(originalDirection,stormAxis)/vec2<f32>(.24,.11);
 let accent=exp(-dot(stormCore,stormCore)*2.0)*smoothstep(.70,.90,dot(originalDirection,stormAxis))*(.72+fine*.28);
 textureStore(weather,vec2<i32>(id.xy),0,vec4<f32>(broad,fine,accent,pigment));
}`;

function satelliteStormUniforms(seed, mode, scale) {
  const data = new Float32Array(64);
  let state = (seed ^ 0x7599f5a1) >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const cartoon = mode < 7;
  const density = mode === 5 ? 3.2 : mode === 6 ? 0.85 : cartoon ? 2.2 : 1.4;
  const count = Math.min(8, Math.max(1, Math.round(density * Math.sqrt(scale) + random() * 1.6 - 0.45)));
  const longitude = random() * 2 * Math.PI;
  for (let index = 0; index < count; index++) {
    const phi = longitude + index * 2.399963 + (random() - 0.5) * 0.8;
    const y = (index % 2 ? -1 : 1) * (0.15 + random() * (cartoon ? 0.39 : 0.24));
    const horizontal = Math.sqrt(1 - y * y);
    const extent = (cartoon ? 0.49 : 0.28) * (0.72 + random() * 0.57) / scale;
    data.set([Math.cos(phi) * horizontal, y, Math.sin(phi) * horizontal, Math.min(0.8, extent),
      0.07 + random() * 0.073, 3.7 + random() * 3.0, 0.68 + random() * 0.31, random() * 2 * Math.PI], index * 8);
  }
  return data;
}

export class PlanetCloudNoise {
  constructor(device) {
    this.device = device;
    this.resources = new Map();
    this.pipelines = new Map();
  }

  pipeline(entryPoint) {
    const device = this.device;
    if (!this.layout) {
      this.layout = device.createBindGroupLayout({ entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba16float', viewDimension: '3d' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba16float', viewDimension: '2d-array' } },
      ] });
      this.pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [this.layout] });
      this.module = device.createShaderModule({ code: SOURCE });
    }

    if (!this.pipelines.has(entryPoint)) {
      const pending = device.createComputePipelineAsync({
        layout: this.pipelineLayout, compute: { module: this.module, entryPoint },
      }).catch(error => {
        this.pipelines.delete(entryPoint);
        throw error;
      });
      this.pipelines.set(entryPoint, pending);
    }
    return this.pipelines.get(entryPoint);
  }

  async prepare({ weatherStyle = 'legacy', gas = false } = {}) {
    const gasMode = weatherStyle === 'neptune' ? 2 : weatherStyle === 'hail_mary' ? 3 :
      weatherStyle === 'gas_giant' || gas ? 1 : 0;
    const billowMode = planetBillowNoiseMode(weatherStyle);
    const satelliteMode = isSatelliteWeatherStyle(weatherStyle) ? satelliteWeatherModes[weatherStyle] : billowMode === 6 ? 4 : 0;
    const [shapePipeline, weatherPipeline] = await Promise.all([
      this.pipeline(billowMode ? 'billowShapeNoise' : 'shapeNoise'),
      this.pipeline(satelliteMode ? 'satelliteWeatherNoise' : gasMode ? 'gasWeatherNoise' : 'weatherNoise'),
    ]);
    return { gasMode, billowMode, satelliteMode, shapePipeline, weatherPipeline };
  }

 async bake({key,seed=1,shapeSize=128,weatherWidth=1024,weatherHeight=512,gas=false,weatherStyle='legacy',weatherSystemScale=1,shapeMips=false}){
  for(const size of [shapeSize,weatherWidth,weatherHeight])if(!Number.isInteger(size)||size<1)throw new RangeError('Planet noise dimensions must be positive integers');
  const { gasMode, billowMode, satelliteMode, shapePipeline, weatherPipeline } = await this.prepare({ weatherStyle, gas });
  this.release(key);
  const d = this.device, usage = GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING;
  const mipLevelCount = shapeMips ? 1 + Math.floor(Math.log2(shapeSize)) : 1;
  if (mipLevelCount > 1) {
   this.shapeMips ??= new CloudVolumeMips(d);
   await this.shapeMips.prepare();
  }
  const shape=d.createTexture({dimension:'3d',size:[shapeSize,shapeSize,shapeSize],format:'rgba16float',mipLevelCount,usage});
  const weather=d.createTexture({size:[weatherWidth,weatherHeight,1],format:'rgba16float',usage});
  const uniform=d.createBuffer({size:288,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
  const shapeView=shape.createView(),weatherView=weather.createView({dimension:'2d-array'});
  const resource={shape,weather,shapeView,weatherView,uniform,weatherPipeline,
   weatherGroups:[Math.ceil(weatherWidth/8),Math.ceil(weatherHeight/8),1],phaseUniform:new Float32Array(1),weatherPhase:0};this.resources.set(key,resource);
  const settings=new Uint32Array([shapeSize,weatherWidth,weatherHeight,0,seed>>>0,satelliteMode||gasMode,billowMode,0]);
  if (isSatelliteWeatherStyle(weatherStyle)) {
   const scale = Number.isFinite(weatherSystemScale) ? Math.max(0.25,Math.min(weatherSystemScale,12)) : 1;
   new Float32Array(settings.buffer)[7] = scale;
   if (satelliteMode < 8) d.queue.writeBuffer(uniform,32,satelliteStormUniforms(seed,satelliteMode,scale));
  }
  d.queue.writeBuffer(uniform,0,settings);
  const group=d.createBindGroup({layout:this.layout,entries:[{binding:0,resource:{buffer:uniform}},{binding:1,resource:shape.createView({mipLevelCount:1})},{binding:2,resource:weatherView}]});
  resource.group=group;
  const encoder=d.createCommandEncoder();
  for(const [pipeline,groups] of [[shapePipeline,[Math.ceil(shapeSize/4),Math.ceil(shapeSize/4),Math.ceil(shapeSize/4)]],[weatherPipeline,[Math.ceil(weatherWidth/8),Math.ceil(weatherHeight/8),1]]]){
   const pass=encoder.beginComputePass();pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.dispatchWorkgroups(...groups);pass.end();
  }
  if (mipLevelCount > 1) this.shapeMips.encode(encoder, shape, shapeSize);
  d.queue.submit([encoder.finish()]);return resource;
 }
 // Reuse the existing map/view/bindings. Shape/detail volumes are untouched.
 regenerateWeather(key,phase){
  const r=this.resources.get(key);
  if(!r||!Number.isFinite(phase))return false;
  r.phaseUniform[0]=phase;r.weatherPhase=phase;
  this.device.queue.writeBuffer(r.uniform,12,r.phaseUniform);
  const encoder=this.device.createCommandEncoder({label:'Planet weather texture regeneration'});
  const pass=encoder.beginComputePass();pass.setPipeline(r.weatherPipeline);pass.setBindGroup(0,r.group);
  pass.dispatchWorkgroups(...r.weatherGroups);pass.end();this.device.queue.submit([encoder.finish()]);
  return true;
 }
 release(key){const r=this.resources.get(key);if(r){r.shape.destroy();r.weather.destroy();r.uniform.destroy();this.resources.delete(key);}}
 destroy(){for(const key of this.resources.keys())this.release(key);}
}

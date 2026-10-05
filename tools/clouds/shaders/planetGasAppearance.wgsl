// Shared by volumetric and mesh clouds. Pigments are baked in the same map;
// palette choice is a uniform, not another shader pipeline or texture read.
fn gasWeatherColor(weather:vec4<f32>,form:f32)->vec3<f32> {
 let pigment=clamp(weather.a,0.0,1.0);
 if(form>=6.5){
  // Moss/emerald atmosphere with warm rusty-orange storm regions and fine
  // yellow-green threads. Not neon red/green hemispheres. Opacity remains a
  // separate control so mountains can show beneath both renderers.
  let filament=smoothstep(.08,.88,weather.b);
  let red=mix(vec3<f32>(.19,.035,.006),vec3<f32>(.48,.16,.022),filament);
  let green=mix(vec3<f32>(.008,.19,.006),vec3<f32>(.11,.48,.016),filament);
  let body=mix(red,green,smoothstep(.15,.85,pigment));
  return body*(.82+weather.g*.22);
 }
 if(form>=5.5){
  let body=mix(vec3<f32>(.012,.033,.31),vec3<f32>(.027,.090,.55),pigment);
  let streak=weather.g*.24;
  // One dark anticyclone, with occasional high pale-blue ice-cloud streaks.
  return mix(body,vec3<f32>(.005,.009,.07),weather.b*.82)+vec3<f32>(.35,.55,.66)*streak;
 }
 let ochre=mix(vec3<f32>(.20,.065,.025),vec3<f32>(.73,.36,.13),smoothstep(.02,.55,pigment));
 let cream=mix(ochre,vec3<f32>(.95,.92,.82),smoothstep(.45,.91,pigment));
 let rust=mix(vec3<f32>(.35,.009,.009),vec3<f32>(.72,.038,.018),weather.g);
 return mix(cream,rust,smoothstep(.08,.62,weather.b));
}

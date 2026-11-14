// Radius-relative raymarch styles. Shared noise modes mean switching styles
// changes a one-time bake and uniforms, not shader variants or per-frame work.
export const PLANET_CLOUD_STYLES = Object.freeze([
  {id:'legacy',label:'Current / custom clouds'},
  {id:'mixed_weather',label:'Mixed weather systems'},
  {id:'realistic',label:'Thin realistic layer'},
  {id:'diorama',label:'Big diorama clouds'},
  {id:'cumulus_banks',label:'Towering cumulus banks'},
  {id:'detailed_cumulus',label:'Detailed cloud towers'},
  {id:'broken_cumulus',label:'Broken cumulus banks'},
  {id:'fair_weather_cumulus',label:'Fair-weather puffs'},
  {id:'wind_swept_clouds',label:'Wind-swept wisps'},
  {id:'cotton_towers',label:'Cotton towers'},
  {id:'island_cumulus',label:'Island cumulus'},
  {id:'anvil_thunderstorms',label:'Anvil thunderstorms'},
  {id:'trade_wind_streets',label:'Trade-wind streets'},
  {id:'altocumulus_ripples',label:'Altocumulus ripples'},
  {id:'lenticular_waves',label:'Lenticular waves'},
  {id:'frontal_wave_bands',label:'Frontal wave bands'},
  {id:'broken_stratocumulus',label:'Broken stratocumulus'},
  {id:'ice_filaments',label:'High ice filaments'},
  {id:'hemisphere',label:'Cloudy hemisphere'},
  {id:'scattered',label:'A few puffy clouds'},
  {id:'satellite_realistic',label:'Realistic satellite weather'},
  {id:'satellite_sparse_fronts',label:'Sparse satellite fronts'},
  {id:'satellite_sparse_cirrus',label:'Sparse satellite cirrus'},
  {id:'satellite',label:'Cartoon satellite / weather fronts'},
  {id:'cyclonic',label:'Cartoon satellite / spiral storms'},
  {id:'trade_winds',label:'Cartoon satellite / trade winds'},
  {id:'gas_giant',label:'Jupiter / curled storms'},
  {id:'neptune',label:'Neptune / blue storm bands'},
  {id:'hail_mary',label:'Hail Mary / green-orange swirls'},
]);

// These styles share the satellite volume profile and physical world scaling.
export const satelliteWeatherModes = Object.freeze({
  satellite: 4,
  cyclonic: 5,
  trade_winds: 6,
  satellite_realistic: 7,
  satellite_sparse_fronts: 8,
  satellite_sparse_cirrus: 9,
});

export function isSatelliteWeatherStyle(style) {
  return Object.hasOwn(satelliteWeatherModes, style);
}

const FINE_CLOUD_STYLES = new Map([
  ['mixed_weather', {
    noiseMode: 11, formType: 2.64, bottom: 0.020, top: 0.115,
    coverage: 0.84, density: 21, shapeScale: 2.55, detailScale: 2.75, meshOpacity: 0.94,
    weatherBias: 0, evolutionSpeed: 0.084,
  }],
  ['broken_cumulus', {
    noiseMode: 2, formType: 2.40, bottom: 0.022, top: 0.068,
    coverage: 0.86, density: 22, shapeScale: 2.6, detailScale: 3.25, meshOpacity: 0.99,
  }],
  ['fair_weather_cumulus', {
    noiseMode: 2, formType: 2.42, bottom: 0.021, top: 0.044,
    coverage: 0.78, density: 16, shapeScale: 2.9, detailScale: 3.7, meshOpacity: 0.92,
  }],
  ['wind_swept_clouds', {
    noiseMode: 4, formType: 2.51, bottom: 0.042, top: 0.063,
    coverage: 0.83, density: 7.5, shapeScale: 2.55, detailScale: 3.45, meshOpacity: 0.70, evolutionSpeed: 0.098,
  }],
  ['cotton_towers', {
    noiseMode: 3, formType: 2.41, bottom: 0.024, top: 0.085,
    coverage: 0.85, density: 27, shapeScale: 3.55, detailScale: 4.0, meshOpacity: 0.99,
  }],
  ['island_cumulus', {
    noiseMode: 2, formType: 2.42, bottom: 0.024, top: 0.055,
    coverage: 0.72, density: 24, shapeScale: 3.35, detailScale: 3.6, meshOpacity: 0.96,
  }],
  ['anvil_thunderstorms', {
    noiseMode: 10, formType: 2.44, bottom: 0.025, top: 0.078,
    coverage: 0.75, density: 17, shapeScale: 3.25, detailScale: 3.65, meshOpacity: 0.96,
    weatherBias: 0, evolutionSpeed: 0.083,
  }],
  ['trade_wind_streets', {
    noiseMode: 8, formType: 2.54, bottom: 0.030, top: 0.049,
    coverage: 0.82, density: 18, shapeScale: 2.5, detailScale: 3.55, meshOpacity: 0.94,
  }],
  ['altocumulus_ripples', {
    noiseMode: 12, formType: 2.55, bottom: 0.041, top: 0.067,
    coverage: 0.81, density: 16, shapeScale: 3.3, detailScale: 3.8, meshOpacity: 0.90,
    weatherBias: 0.12, evolutionSpeed: 0.089,
  }],
  ['lenticular_waves', {
    noiseMode: 7, formType: 2.56, bottom: 0.043, top: 0.072,
    coverage: 0.80, density: 23, shapeScale: 1.3, detailScale: 1.55, meshOpacity: 0.86,
  }],
  ['frontal_wave_bands', {
    noiseMode: 6, formType: 2.60, bottom: 0.024, top: 0.065,
    coverage: 0.85, density: 22, shapeScale: 2.8, detailScale: 3.7, meshOpacity: 0.98,
    weatherWidth: 2048, weatherHeight: 1024, evolutionSpeed: 0.092,
  }],
  ['broken_stratocumulus', {
    noiseMode: 5, formType: 2.50, bottom: 0.019, top: 0.040,
    coverage: 0.92, density: 19, shapeScale: 2.45, detailScale: 3.55, meshOpacity: 0.97,
  }],
  ['ice_filaments', {
    noiseMode: 4, formType: 2.53, bottom: 0.060, top: 0.079,
    coverage: 0.71, density: 5.5, shapeScale: 3.85, detailScale: 4.25, meshOpacity: 0.55, evolutionSpeed: 0.110,
  }],
]);

export function planetBillowNoiseMode(style) {
  if (isSatelliteWeatherStyle(style)) return satelliteWeatherModes[style] >= 7 ? 9 : 13;
  return FINE_CLOUD_STYLES.get(style)?.noiseMode ?? ({ detailed_cumulus: 15, cumulus_banks: 14, realistic: 9, diorama: 13 }[style] ?? 0);
}

export function planetCloudStyleOptions(style, radius = 50) {
  if (style === 'legacy') return {};
  if (!PLANET_CLOUD_STYLES.some(s=>s.id===style)) throw new RangeError(`Unknown planet cloud style: ${style}`);
  const r = Number.isFinite(radius) && radius > 0 ? radius : 50;
  if (satelliteWeatherModes[style] >= 7) {
    const sparse = style !== 'satellite_realistic';
    const cirrus = style === 'satellite_sparse_cirrus';
    const base = planetCloudStyleOptions('realistic', r);
    return {
      ...base, cloudStyle: style, weatherWidth: 1536, weatherHeight: 768,
      cloudBottom: r * (cirrus ? 0.019 : 0.012),
      cloudTop: r * (cirrus ? 0.038 : sparse ? 0.031 : 0.035),
      maxHalfHeight: r * (sparse ? 0.0095 : 0.0115),
      params: { ...base.params, globalCoverage: sparse ? 0.89 : 0.80, globalDensity: cirrus ? 10 : sparse ? 12 : 16 },
      tuning: { ...base.tuning, formType: cirrus ? 1.41 : sparse ? 1.38 : 1.35, definition: sparse ? 0.76 : 0.68 },
      transforms: { ...base.transforms, shapeScale: sparse ? 2.9 : 2.55, detailScale: sparse ? 3.5 : 2.75 },
    };
  }
  if(isSatelliteWeatherStyle(style)){
    const base=planetCloudStyleOptions('realistic',r);
    return {...base,cloudStyle:style,weatherWidth:2048,weatherHeight:1024,
      cloudBottom:r*.024,cloudTop:r*.052,maxHalfHeight:r*.014,
      params:{...base.params,globalCoverage:1.0,globalDensity:12,
        frontLightColor:[1.40,1.42,1.44],shadowLightColor:[.42,.48,.58]},
      tuning:{...base.tuning,formType:1.29},
      transforms:{...base.transforms,shapeScale:2.7,detailScale:3.1}};
  }
  const fine = FINE_CLOUD_STYLES.get(style);
  if (fine) {
    const base = planetCloudStyleOptions('detailed_cumulus', r);
    return {
      ...base,
      cloudStyle: style,
      ...(fine.weatherWidth ? { weatherWidth: fine.weatherWidth, weatherHeight: fine.weatherHeight } : {}),
      cloudBottom: r * fine.bottom,
      cloudTop: r * fine.top,
      maxHalfHeight: r * (fine.top - fine.bottom) * 0.5,
      surfaceOpacity: fine.meshOpacity,
      params: { ...base.params, globalCoverage: fine.coverage, globalDensity: fine.density },
      tuning: { ...base.tuning, formType: fine.formType },
      evolutionSpeed: fine.evolutionSpeed ?? 0.074,
      transforms: { ...base.transforms, shapeScale: fine.shapeScale, detailScale: fine.detailScale,
        weatherBias: fine.weatherBias ?? base.transforms.weatherBias },
    };
  }
  if (style === 'detailed_cumulus') {
    const base = planetCloudStyleOptions('cumulus_banks', r);
    return {
      ...base,
      cloudStyle: style,
      cloudTop: r * 0.087,
      maxHalfHeight: r * 0.0325,
      params: { ...base.params, globalCoverage: 0.86, globalDensity: 21,
        frontLightColor: [1.44, 1.49, 1.56], shadowLightColor: [0.44, 0.61, 0.88] },
      tuning: { ...base.tuning, formType: 2.38 },
      evolutionSpeed: 0.087,
      transforms: { ...base.transforms, shapeScale: 3.15, detailScale: 3.40 },
    };
  }
  if (style === 'cumulus_banks') {
    const base = planetCloudStyleOptions('diorama', r);
    return {
      ...base,
      cloudStyle: style,
      cloudBottom: r * 0.022,
      cloudTop: r * 0.080,
      maxHalfHeight: r * 0.029,
      params: { ...base.params, globalCoverage: 0.88, globalDensity: 24,
        frontLightColor: [1.32, 1.42, 1.55], shadowLightColor: [0.43, 0.65, 0.92] },
      tuning: { ...base.tuning, formType: 2.25, maxSteps: 88, sunSteps: 2 },
      evolutionSpeed: 0.078,
      transforms: { ...base.transforms, shapeScale: 2.2, detailScale: 2.15 },
    };
  }
  const cute = style !== 'realistic',gas=['gas_giant','neptune','hail_mary'].includes(style);
  const gasForm=style==='neptune'?6:style==='hail_mary'?7:5;
  const translucent = style === 'hail_mary';
  return {
    ...(gas?{weatherWidth:2048,weatherHeight:1024}:{}),
    cloudStyle:style,cloudRenderMode:'raymarch',progressiveStartup:false,bootstrapFrames:0,
    cloudBottom:r*(style==='diorama'?.034:cute?.025:.028),cloudTop:r*(gas?.055:style==='diorama'?.225:cute?.155:.041),
    worldToUV:2.4/r,stepBase:r*(cute?.0018:.00065),stepInc:.025,
    maxHalfHeight:r*(cute?.065:.01),opacity:translucent?.78:.98,surfaceOpacity:translucent?.72:.995,alphaPower:1,alphaCutoff:.003,
    spinSpeed:.00065,evolutionSpeed:gas?.03:style==='realistic'?.083:.062,nearSurfaceAdaptiveQuality:true,
    params:{globalCoverage:style==='scattered'?.60:style==='hemisphere'?.98:gas?1.12:style==='diorama'?.74:cute?.82:.84,globalDensity:translucent?8:style==='diorama'?28:cute?36:23,cloudAnvilAmount:0,cloudBeer:cute?3.8:5.0,
      frontLightColor:cute?[1.5,1.43,1.32]:[1.24,1.27,1.30],shadowLightColor:cute?[.42,.50,.66]:[.32,.40,.55]},
    tuning:{formType:style==='hemisphere'?3:style==='scattered'?4:gas?gasForm:cute?2:1,maxSteps:96,sunSteps:3,sunStride:8,
      nearDensityMult:1.15,raySmoothDens:.20,raySmoothSun:.55,
      nearFluffDist:r*.35,nearDensityRange:r*.20,nearLodBias:-.5,
      fluffFactor:cute?3.5:2.2,definition:cute?.38:.66,sparsity:cute?.40:.22,
      minOutputAlpha:.003,alphaBoostAmount:0,outputAlphaFeather:.25,
      baseJitterFrac:.008,topJitterFrac:.025},
    transforms:{shapeScale:style==='diorama'?.86:cute?.44:2.05,detailScale:style==='diorama'?1.48:cute?.65:1.85,
      shapeAxisScale:[1,1,1],detailAxisScale:[1,1,1],weatherAxisScale:[1,1,1],
      shapeBias:0,detailBias:0,weatherScale:1,weatherBias:.22},
  };
}

// Resolve each style from the saved custom configuration, never the previous
// preset. Apply the editor's explicit values before baking either renderer.
export function resolvePlanetCloudStyleOptions(base, style, radius, overrides = {}) {
  const merge = (a, b) => {
    const out = {};
    for (const [key, value] of Object.entries(a || {})) {
      out[key] = Array.isArray(value) ? value.slice() : value && typeof value === 'object' ? merge(value, {}) : value;
    }
    for (const [key, value] of Object.entries(b || {})) {
      out[key] = Array.isArray(value) ? value.slice() : value && typeof value === 'object' ? merge(out[key], value) : value;
    }
    return out;
  };
  return merge(merge(base, planetCloudStyleOptions(style, radius)), { ...overrides, cloudStyle: style });
}

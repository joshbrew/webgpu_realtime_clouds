// Independent spatial fidelity for the cached flat-cloud density + lighting.
// Both textures are rgba16float (16 bytes together per voxel). Dimensions stay
// uniforms, so changing quality reuses the same compute pipelines.
export const CLOUD_FIELD_QUALITIES = Object.freeze({
  low: Object.freeze({label:'Low / fast', dimensions:Object.freeze([96,48,96])}),
  balanced: Object.freeze({label:'Balanced / default', dimensions:Object.freeze([128,64,128])}),
  high: Object.freeze({label:'High / finer clouds', dimensions:Object.freeze([192,96,192])}),
  ultra: Object.freeze({label:'Screenshot / finest', dimensions:Object.freeze([256,128,256])}),
});

export function normalizeCloudFieldQuality(value) {
  return Object.hasOwn(CLOUD_FIELD_QUALITIES,value) ? value : 'balanced';
}

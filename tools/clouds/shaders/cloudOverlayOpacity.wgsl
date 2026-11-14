// Use a linear toe when the opacity curve boosts faint clouds. This keeps
// the gain finite as coverage approaches zero on undersampled fringes.
fn cloudOverlayOpacity(rawAlpha: f32, alphaCutoff: f32, alphaPower: f32, opacity: f32) -> f32 {
  let cutoff = clamp(alphaCutoff, 0.0, 0.94);
  let alpha = clamp(rawAlpha, 0.0, 1.0);
  let gate = select(1.0, smoothstep(cutoff, cutoff + 0.045, alpha), cutoff > 0.0001);
  let coverage = alpha * gate;
  let power = max(alphaPower, 0.001);
  let base = max(coverage, select(0.000001, 0.045, power < 1.0));
  return coverage * pow(base, power - 1.0) * clamp(opacity, 0.0, 2.0);
}

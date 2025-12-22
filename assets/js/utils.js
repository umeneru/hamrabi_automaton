export function clamp(v, lo, hi) {
  return v < lo ? lo : (v > hi ? hi : v);
}

export function idx(x, y, W) {
  return y * W + x;
}

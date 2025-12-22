import { clamp, idx } from "./utils.js";
import { MOTIF, MW, MH } from "./motif.js";

export function createSim({ W = 80, H = 80 } = {}) {
  const N = W * H;

  const desired = new Uint8Array(N);
  const cur = new Uint8Array(N);

  let inFrontier = new Uint8Array(N);
  let frontier = [];

  let gen = 0;

  let lastGrowI = -1;

  function clearAll() {
    desired.fill(0);
    cur.fill(0);
    inFrontier.fill(0);
    frontier = [];
    gen = 0;
  }

  function hasOnNeighbor(i) {
    const x = i % W;
    const y = (i / W) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
      if (cur[idx(nx, ny, W)] === 1) return true;
    }
    return false;
  }

  function tryAddFrontier(i) {
    if (desired[i] === 0) return;
    if (cur[i] === 1) return;
    if (inFrontier[i] === 1) return;
    if (!hasOnNeighbor(i)) return;
    inFrontier[i] = 1;
    frontier.push(i);
  }

  function addNeighborsToFrontier(i) {
    const x = i % W;
    const y = (i / W) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
      tryAddFrontier(idx(nx, ny, W));
    }
  }

  function pruneFrontierInPlace() {
    let w = 0;
    for (let r = 0; r < frontier.length; r++) {
      const i = frontier[r];
      if (cur[i] === 1) { inFrontier[i] = 0; continue; }
      if (desired[i] === 0) { inFrontier[i] = 0; continue; }
      if (!hasOnNeighbor(i)) { inFrontier[i] = 0; continue; }
      frontier[w++] = i;
    }
    frontier.length = w;
  }

  function findNearestDesiredCell(cx, cy, ox, oy) {
    const minX = ox, maxX = ox + MW - 1;
    const minY = oy, maxY = oy + MH - 1;

    const maxR = Math.max(MW, MH);
    for (let r = 0; r <= maxR; r++) {
      const x0 = clamp(cx - r, minX, maxX);
      const x1 = clamp(cx + r, minX, maxX);
      const y0 = clamp(cy - r, minY, maxY);
      const y1 = clamp(cy + r, minY, maxY);

      for (let x = x0; x <= x1; x++) {
        const t = idx(x, y0, W);
        if (desired[t] === 1) return t;
        const b = idx(x, y1, W);
        if (desired[b] === 1) return b;
      }
      for (let y = y0; y <= y1; y++) {
        const l = idx(x0, y, W);
        if (desired[l] === 1) return l;
        const rgt = idx(x1, y, W);
        if (desired[rgt] === 1) return rgt;
      }
    }
    return -1;
  }

  function findNearestDesiredCellGlobal(cx, cy) {
    const maxR = Math.max(W, H);
    for (let r = 0; r <= maxR; r++) {
      const x0 = clamp(cx - r, 0, W - 1);
      const x1 = clamp(cx + r, 0, W - 1);
      const y0 = clamp(cy - r, 0, H - 1);
      const y1 = clamp(cy + r, 0, H - 1);

      for (let x = x0; x <= x1; x++) {
        const t = idx(x, y0, W);
        if (desired[t] === 1) return t;
        const b = idx(x, y1, W);
        if (desired[b] === 1) return b;
      }
      for (let y = y0; y <= y1; y++) {
        const l = idx(x0, y, W);
        if (desired[l] === 1) return l;
        const rgt = idx(x1, y, W);
        if (desired[rgt] === 1) return rgt;
      }
    }
    return -1;
  }

  function findNearestRemainingDesiredCellGlobal(cx, cy) {
    const maxR = Math.max(W, H);
    for (let r = 0; r <= maxR; r++) {
      const x0 = clamp(cx - r, 0, W - 1);
      const x1 = clamp(cx + r, 0, W - 1);
      const y0 = clamp(cy - r, 0, H - 1);
      const y1 = clamp(cy + r, 0, H - 1);

      for (let x = x0; x <= x1; x++) {
        const t = idx(x, y0, W);
        if (desired[t] === 1 && cur[t] === 0) return t;
        const b = idx(x, y1, W);
        if (desired[b] === 1 && cur[b] === 0) return b;
      }
      for (let y = y0; y <= y1; y++) {
        const l = idx(x0, y, W);
        if (desired[l] === 1 && cur[l] === 0) return l;
        const rgt = idx(x1, y, W);
        if (desired[rgt] === 1 && cur[rgt] === 0) return rgt;
      }
    }
    return -1;
  }

  function stampMotifAtCell(cx, cy) {
    // center motif at (cx,cy) but safely clip to board
    const ox = cx - (MW / 2 | 0);
    const oy = cy - (MH / 2 | 0);

    for (let y = 0; y < MH; y++) {
      const by = oy + y;
      if (by < 0 || by >= H) continue;
      const row = MOTIF[y];
      for (let x = 0; x < MW; x++) {
        const bx = ox + x;
        if (bx < 0 || bx >= W) continue;
        if (row[x] === "#") desired[idx(bx, by, W)] = 1;
      }
    }

    const seed = findNearestDesiredCellGlobal(cx, cy);
    if (seed !== -1) {
      cur[seed] = 1;
      lastGrowI = seed;
      addNeighborsToFrontier(seed);
    }
  }

  function stepOnce(growthPerStep) {
    pruneFrontierInPlace();

    const K = Math.min(Number(growthPerStep), frontier.length);
    if (K === 0) {
      // If growth is stuck but there are still desired cells remaining (e.g. an "eye"
      // inside a completed frame), start a new seed so disconnected components can grow.
      const cx = lastGrowI >= 0 ? (lastGrowI % W) : ((W / 2) | 0);
      const cy = lastGrowI >= 0 ? ((lastGrowI / W) | 0) : ((H / 2) | 0);
      const seed = findNearestRemainingDesiredCellGlobal(cx, cy);
      if (seed !== -1) {
        cur[seed] = 1;
        lastGrowI = seed;
        addNeighborsToFrontier(seed);
      }
      gen++;
      return;
    }

    const chosen = new Array(K);
    for (let t = 0; t < K; t++) {
      const r = t + ((Math.random() * (frontier.length - t)) | 0);
      const tmp = frontier[t]; frontier[t] = frontier[r]; frontier[r] = tmp;
      const i = frontier[t];
      chosen[t] = i;
      cur[i] = 1;
      inFrontier[i] = 0;
    }
    frontier = frontier.slice(K);

    lastGrowI = chosen[K - 1];

    for (let t = 0; t < K; t++) addNeighborsToFrontier(chosen[t]);

    gen++;
  }

  return {
    W, H,
    desired,
    cur,
    get gen() { return gen; },
    clearAll,
    stampMotifAtCell,
    stepOnce,
  };
}

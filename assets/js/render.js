import { idx } from "./utils.js";

export function createRenderer({ cv, pad = 18 }) {
  const ctx = cv.getContext("2d", { alpha: false });

  function cellSize(W, H) {
    const usableW = Math.max(1, cv.width - pad * 2);
    const usableH = Math.max(1, cv.height - pad * 2);
    return Math.max(1, Math.floor(Math.min(usableW / W, usableH / H)));
  }

  function render({ W, H, desired, cur, showTarget }) {
    const cs = cellSize(W, H);
    const gridW = cs * W;
    const gridH = cs * H;
    const ox = (((cv.width - gridW) / 2) | 0);
    const oy = (((cv.height - gridH) / 2) | 0);

    ctx.fillStyle = "#05070a";
    ctx.fillRect(0, 0, cv.width, cv.height);

    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = idx(x, y, W);
      const px = ox + x * cs;
      const py = oy + y * cs;

      if (cur[i] === 1) {
        ctx.fillStyle = "#e6edf3";
        ctx.fillRect(px, py, cs, cs);
      } else {
        ctx.fillStyle = "#0b1220";
        ctx.fillRect(px, py, cs, cs);
      }

      if (showTarget && desired[i] === 1 && cur[i] === 0) {
        ctx.fillStyle = "rgba(230,237,243,0.10)";
        ctx.fillRect(px, py, cs, cs);
      }
    }
  }

  function getCellFromEvent(ev, W, H) {
    const rect = cv.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;

    const cs = cellSize(W, H);
    const gridW = cs * W, gridH = cs * H;
    const ox = ((cv.width - gridW) / 2);
    const oy = ((cv.height - gridH) / 2);

    const sx = cv.width / rect.width;
    const sy = cv.height / rect.height;
    const cx = x * sx;
    const cy = y * sy;

    const gx = Math.floor((cx - ox) / cs);
    const gy = Math.floor((cy - oy) / cs);
    if (gx < 0 || gx >= W || gy < 0 || gy >= H) return null;
    return { x: gx, y: gy };
  }

  return { render, getCellFromEvent };
}

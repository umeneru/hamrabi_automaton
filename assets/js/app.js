import { bindUI } from "./ui.js";
import { createSim } from "./sim.js";
import { createRenderer } from "./render.js";

(() => {
  const ui = bindUI();
  let sim = null;
  const renderer = createRenderer({ cv: ui.cv, pad: 0 });

  const FPS = 20;
  const GROWTH_PER_STEP = 60;

  let running = false;
  let rafId = null;
  let lastT = 0;

  const AUTO_SPAWN_MS = 1200;
  let lastSpawnT = 0;

  const MAX_CELLS = 120_000;
  const TARGET_CELL_PX = 10;

  function gcd(a, b) {
    a = Math.abs(a) | 0;
    b = Math.abs(b) | 0;
    while (b !== 0) {
      const t = a % b;
      a = b;
      b = t;
    }
    return a;
  }

  function pickCellSizePx(w, h, dpr) {
    const g = gcd(w, h);
    if (g <= 0) return 1;

    const target = Math.max(1, Math.round(TARGET_CELL_PX * dpr));

    let best = null;
    const root = Math.floor(Math.sqrt(g));
    for (let i = 1; i <= root; i++) {
      if (g % i !== 0) continue;
      const a = i;
      const b = (g / i) | 0;
      // consider both divisors
      for (const cs of [a, b]) {
        const W = (w / cs) | 0;
        const H = (h / cs) | 0;
        if (W <= 0 || H <= 0) continue;
        if (W * H > MAX_CELLS) continue;
        const score = Math.abs(cs - target) * 1000 + (W * H); // prefer close to target, then fewer cells
        if (!best || score < best.score) best = { cs, score };
      }
    }

    if (best) return best.cs;

    // fallback: increase cell size until cell count is acceptable
    let cs = 1;
    while (((w / cs) | 0) * ((h / cs) | 0) > MAX_CELLS) cs++;
    return cs;
  }

  function resizeCanvasToDisplaySize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = ui.cv.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (ui.cv.width !== w || ui.cv.height !== h) {
      ui.cv.width = w;
      ui.cv.height = h;
    }
  }

  function ensureSimForCanvas() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = ui.cv.width | 0;
    const h = ui.cv.height | 0;

    const cs = pickCellSizePx(w, h, dpr);
    const W = Math.max(1, (w / cs) | 0);
    const H = Math.max(1, (h / cs) | 0);

    if (!sim || sim.W !== W || sim.H !== H) {
      sim = createSim({ W, H });
      ui.updateStat(sim.gen);
    }
  }

  function renderNow() {
    resizeCanvasToDisplaySize();
    ensureSimForCanvas();
    renderer.render({
      W: sim.W,
      H: sim.H,
      desired: sim.desired,
      cur: sim.cur,
      showTarget: ui.showTarget.checked,
    });
  }

  function clearAll() {
    sim.clearAll();
    renderNow();
    ui.updateStat(sim.gen);
  }

  function stepOnce() {
    sim.stepOnce(GROWTH_PER_STEP);
    ui.updateStat(sim.gen);
    renderNow();
  }

  function spawnRandomMotif() {
    const x = (Math.random() * sim.W) | 0;
    const y = (Math.random() * sim.H) | 0;
    sim.stampMotifAtCell(x, y);
  }

  function loop(t) {
    if (!running) return;
    const interval = 1000 / FPS;

    if (ui.autoMode?.checked && (t - lastSpawnT >= AUTO_SPAWN_MS)) {
      lastSpawnT = t;
      spawnRandomMotif();
      renderNow();
    }

    if (t - lastT >= interval) {
      lastT = t;
      stepOnce();
    }
    rafId = requestAnimationFrame(loop);
  }

  ui.cv.addEventListener("click", (ev) => {
    renderNow(); // ensure sim matches current size before mapping click
    const cell = renderer.getCellFromEvent(ev, sim.W, sim.H);
    if (!cell) return;
    sim.stampMotifAtCell(cell.x, cell.y);
    renderNow();
  });

  ui.btnToggle.addEventListener("click", () => {
    running = !running;
    ui.btnToggle.textContent = running ? "Stop" : "Start";
    if (running) {
      lastT = performance.now();
      lastSpawnT = lastT;
      rafId = requestAnimationFrame(loop);
    } else if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  });

  ui.btnStep.addEventListener("click", stepOnce);

  ui.btnClear.addEventListener("click", () => {
    running = false;
    ui.btnToggle.textContent = "Start";
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    lastSpawnT = 0;
    clearAll();
  });

  ui.showTarget.addEventListener("change", renderNow);

  // init
  window.addEventListener("resize", renderNow, { passive: true });
  renderNow();
  clearAll();
})();

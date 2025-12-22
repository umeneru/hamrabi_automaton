export function bindUI() {
  const cv = document.getElementById("cv");

  const btnToggle = document.getElementById("btnToggle");
  const btnClear = document.getElementById("btnClear");

  const autoMode = document.getElementById("autoMode");

  // `app.js` reads `ui.autoMode.checked`. Historically this was a checkbox;
  // now it's a toggle button, so we keep a compatible `checked` getter.
  if (autoMode && autoMode.tagName === "BUTTON") {
    let checked = autoMode.getAttribute("aria-pressed") === "true";

    const sync = () => {
      autoMode.setAttribute("aria-pressed", checked ? "true" : "false");
      autoMode.textContent = checked ? "auto: ON" : "auto: OFF";
    };

    Object.defineProperty(autoMode, "checked", {
      configurable: true,
      enumerable: true,
      get() {
        return checked;
      },
      set(v) {
        checked = !!v;
        sync();
      },
    });

    autoMode.addEventListener("click", () => {
      checked = !checked;
      sync();
    });

    sync();
  }

  return {
    cv,
    btnToggle, btnClear,
    autoMode,
  };
}

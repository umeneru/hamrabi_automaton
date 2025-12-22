export function bindUI() {
  const cv = document.getElementById("cv");

  const btnToggle = document.getElementById("btnToggle");
  const btnClear = document.getElementById("btnClear");

  const autoMode = document.getElementById("autoMode");

  return {
    cv,
    btnToggle, btnClear,
    autoMode,
  };
}

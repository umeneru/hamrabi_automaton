export function bindUI() {
  const cv = document.getElementById("cv");

  const btnToggle = document.getElementById("btnToggle");
  const btnStep = document.getElementById("btnStep");
  const btnClear = document.getElementById("btnClear");

  const stat = document.getElementById("stat");

  const showTarget = document.getElementById("showTarget");

  function updateStat(gen) {
    stat.textContent = `gen: ${gen}`;
  }

  return {
    cv,
    btnToggle, btnStep, btnClear,
    showTarget,
    updateStat,
  };
}

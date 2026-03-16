window.UI = (function () {
  function setStatus(text, running = false) {
    const el = document.getElementById("status");
    if (!el) return;

    el.textContent = text;
    el.className = running ? "running" : "";
  }

  function setBeat(beat) {
    const counter = document.getElementById("beatCounter");
    if (!counter) return;

    counter.textContent = beat;
    counter.classList.remove("pulse", "accent-pulse");

    void counter.offsetWidth;

    counter.classList.add(beat === 1 ? "accent-pulse" : "pulse");

    setTimeout(() => {
      counter.classList.remove("pulse", "accent-pulse");
    }, 120);
  }

  function renderDots(beatsPerMeasure, currentBeat) {
    const container = document.getElementById("beatDots");
    if (!container) return;

    container.innerHTML = "";

    for (let i = 1; i <= beatsPerMeasure; i++) {
      const dot = document.createElement("div");
      dot.className =
        "beat-dot" +
        (i === 1 ? " accent" : "") +
        (i === currentBeat ? " active" : "");

      container.appendChild(dot);
    }
  }

  return {
    setStatus,
    setBeat,
    renderDots
  };
})();
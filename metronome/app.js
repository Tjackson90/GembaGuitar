(function () {
  const bpmInput = document.getElementById("bpm");
  const bpmSlider = document.getElementById("bpmSlider");
  const bpmDisplay = document.getElementById("bpmDisplay");
  const tempoLabel = document.getElementById("tempoLabel");
  const timeSig = document.getElementById("timeSignature");
  const subdivision = document.getElementById("subdivision");
  const swingEl = document.getElementById("swing");
  const swingVal = document.getElementById("swingValue");
  const soundSelect = document.getElementById("soundSelect");
  const volumeEl = document.getElementById("volume");
  const volumeVal = document.getElementById("volumeValue");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const tapBtn = document.getElementById("tapBtn");
  const resetTapBtn = document.getElementById("resetTapBtn");
  const bpmUp = document.getElementById("bpmUp");
  const bpmDown = document.getElementById("bpmDown");
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeToggleIcon");

  let tapTimes = [];

  const TEMPO_NAMES = [
    [0, 40, "Larghissimo"],
    [40, 60, "Largo"],
    [60, 66, "Larghetto"],
    [66, 76, "Adagio"],
    [76, 108, "Andante"],
    [108, 120, "Moderato"],
    [120, 156, "Allegro"],
    [156, 176, "Vivace"],
    [176, 200, "Presto"],
    [200, 999, "Prestissimo"]
  ];

  function getTempoName(bpm) {
    for (const [lo, hi, name] of TEMPO_NAMES) {
      if (bpm >= lo && bpm < hi) return name;
    }
    return "";
  }

  function clamp(value) {
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? 120 : Math.min(300, Math.max(30, n));
  }

  function getTimeSignatureInfo(value) {
    const [top, bottom] = value.split("/").map(Number);

    return {
      beatsPerMeasure: top,
      beatUnit: bottom,
      label: `${top}/${bottom}`
    };
  }

  function syncBpm(value) {
    const bpm = clamp(value);

    bpmInput.value = bpm;
    bpmSlider.value = bpm;
    bpmDisplay.textContent = bpm;
    tempoLabel.textContent = getTempoName(bpm);

    const pct = (((bpm - 30) / (300 - 30)) * 100).toFixed(1) + "%";
    bpmSlider.style.setProperty("--fill", pct);

    document.querySelectorAll(".quickBpmBtn").forEach((btn) => {
      btn.classList.toggle("active", parseInt(btn.dataset.bpm, 10) === bpm);
    });
  }

  function getSettings() {
    const timeSignatureInfo = getTimeSignatureInfo(timeSig.value);

    return {
      bpm: clamp(bpmInput.value),
      beatsPerMeasure: timeSignatureInfo.beatsPerMeasure,
      beatUnit: timeSignatureInfo.beatUnit,
      timeSignatureLabel: timeSignatureInfo.label,
      subdivision: subdivision.value,
      swing: parseInt(swingEl.value, 10),
      sound: soundSelect.value,
      volume: parseInt(volumeEl.value, 10) / 100
    };
  }

  function restart() {
    window.Metronome.restartIfRunning(getSettings());
  }

  function handleTap() {
    const now = Date.now();

    tapTimes.push(now);
    if (tapTimes.length > 8) tapTimes.shift();

    if (tapTimes.length >= 2) {
      const intervals = tapTimes.slice(1).map((t, i) => t - tapTimes[i]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = Math.round(60000 / avg);

      syncBpm(bpm);
      window.Metronome.restartIfRunning(getSettings());
    }

    tapBtn.style.transform = "scale(0.93)";
    setTimeout(() => {
      tapBtn.style.transform = "";
    }, 100);
  }

  function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("metro-theme", theme);
    themeIcon.textContent = theme === "light" ? "☀" : "☾";
  }

  function toggleTheme() {
    const current = document.body.getAttribute("data-theme") || "dark";
    applyTheme(current === "dark" ? "light" : "dark");
  }

  bpmSlider.addEventListener("input", () => {
    syncBpm(bpmSlider.value);
    restart();
  });

  bpmInput.addEventListener("input", () => {
    syncBpm(bpmInput.value);
    restart();
  });

  bpmUp.addEventListener("click", () => {
    syncBpm(clamp(bpmInput.value) + 1);
    restart();
  });

  bpmDown.addEventListener("click", () => {
    syncBpm(clamp(bpmInput.value) - 1);
    restart();
  });

  timeSig.addEventListener("change", restart);
  subdivision.addEventListener("change", restart);

  swingEl.addEventListener("input", () => {
    swingVal.textContent = swingEl.value + "%";
    restart();
  });

  volumeEl.addEventListener("input", () => {
    volumeVal.textContent = volumeEl.value + "%";
    window.Metronome.updateLiveVolume(parseInt(volumeEl.value, 10) / 100);
  });

  soundSelect.addEventListener("change", restart);

  startBtn.addEventListener("click", async () => {
    await window.AudioEngine.unlock();
    window.Metronome.start(getSettings());
  });

  stopBtn.addEventListener("click", () => {
    window.Metronome.stop();
  });

  tapBtn.addEventListener("click", async () => {
    await window.AudioEngine.unlock();
    handleTap();
  });

  resetTapBtn.addEventListener("click", () => {
    tapTimes = [];
    window.UI.setStatus("Tap reset", false);
  });

  themeToggle.addEventListener("click", toggleTheme);

  document.querySelectorAll(".quickBpmBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      syncBpm(btn.dataset.bpm);
      restart();
    });
  });

  document.addEventListener("keydown", async (e) => {
    const tag = e.target.tagName;
    if (tag === "INPUT" || tag === "SELECT") return;

    if (e.key === " ") {
      e.preventDefault();

      if (window.Metronome.getIsRunning()) {
        window.Metronome.stop();
      } else {
        await window.AudioEngine.unlock();
        window.Metronome.start(getSettings());
      }
    }

    if (e.key === "t" || e.key === "T") {
      await window.AudioEngine.unlock();
      handleTap();
    }

    if (e.key === "ArrowUp") {
      syncBpm(clamp(bpmInput.value) + 1);
      restart();
    }

    if (e.key === "ArrowDown") {
      syncBpm(clamp(bpmInput.value) - 1);
      restart();
    }
  });

  const savedTheme = localStorage.getItem("metro-theme") || "dark";
  applyTheme(savedTheme);

  syncBpm(120);
  swingVal.textContent = swingEl.value + "%";
  volumeVal.textContent = volumeEl.value + "%";
  window.UI.renderDots(getTimeSignatureInfo(timeSig.value).beatsPerMeasure, 1);
})();
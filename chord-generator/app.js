import { clamp } from "./utils.js";
import { renderChordSVG, hitTest } from "./renderer.js";
import { downloadSVG, downloadPNG } from "./exporters.js";
import { detectChordName } from "./chordDetect.js";

const DEFAULTS = {
  title: "",
  strings: 6,
  fretsVisible: 5,
  startFret: 1,

  gridH: 300,
  dotR: 11,
  fingerFontSize: 12,
  titleFontSize: 18,
  strokeWidth: 2,
  fgColor: "#111111",
  bgColor: "#ffffff",

  showFretMarkers: true,
  hidePosition: false
};

const state = {
  title: DEFAULTS.title,
  strings: DEFAULTS.strings,
  fretsVisible: DEFAULTS.fretsVisible,
  startFret: DEFAULTS.startFret,

  openMuted: Array(DEFAULTS.strings).fill("O"),
  fingers: [],

  style: {
    gridH: DEFAULTS.gridH,
    dotR: DEFAULTS.dotR,
    fingerFontSize: DEFAULTS.fingerFontSize,
    titleFontSize: DEFAULTS.titleFontSize,
    strokeWidth: DEFAULTS.strokeWidth,
    fgColor: DEFAULTS.fgColor,
    bgColor: DEFAULTS.bgColor,
    showFretMarkers: DEFAULTS.showFretMarkers,
    hidePosition: DEFAULTS.hidePosition
  }
};

const layout = {
  pad: 18,
  topText: 60,
  leftText: 30,
  gridW: 420
};

const THEME_STORAGE_KEY = "chord-diagram-theme";

const mount = document.getElementById("mount");
const dump = document.getElementById("stateDump");

const $title = document.getElementById("title");
const $fretsVisible = document.getElementById("fretsVisible");
const $startFret = document.getElementById("startFret");
const $strings = document.getElementById("strings");
const $chordName = document.getElementById("chordName");

const $height = document.getElementById("height");
const $fingerSize = document.getElementById("fingerSize");
const $fingerFontSize = document.getElementById("fingerFontSize");
const $titleFontSize = document.getElementById("titleFontSize");
const $strokeWidth = document.getElementById("strokeWidth");
const $fgColor = document.getElementById("fgColor");
const $bgColor = document.getElementById("bgColor");

const $hidePosition = document.getElementById("hidePosition");
const $showFretMarkers = document.getElementById("showFretMarkers");

const $btnClear = document.getElementById("btnClear");
const $btnSvg = document.getElementById("btnSvg");
const $btnPng = document.getElementById("btnPng");
const $btnReset = document.getElementById("btnReset");
const $themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("theme-dark", isDark);

  if ($themeToggle) {
    $themeToggle.setAttribute("aria-pressed", String(isDark));
  }
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);

  if (saved === "dark" || saved === "light") {
    applyTheme(saved);
    return;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(prefersDark ? "dark" : "light");
}

function toggleTheme() {
  const next = document.body.classList.contains("theme-dark") ? "light" : "dark";
  localStorage.setItem(THEME_STORAGE_KEY, next);
  applyTheme(next);
}

function ensureArraySizes() {
  const s = state.strings;

  const old = state.openMuted.slice();
  state.openMuted = Array(s).fill("O");

  for (let i = 0; i < Math.min(old.length, s); i++) {
    state.openMuted[i] = old[i];
  }

  state.fingers = state.fingers.filter(f => f.string >= 1 && f.string <= s);
}

function toggleFinger(string, fret) {
  const existingSameSpot = state.fingers.findIndex(f => f.string === string && f.fret === fret);

  if (existingSameSpot >= 0) {
    state.fingers.splice(existingSameSpot, 1);
    return;
  }

  state.fingers = state.fingers.filter(f => f.string !== string);
  state.fingers.push({ string, fret, label: "" });
}

function toggleOX(string) {
  const i = string - 1;
  state.openMuted[i] = state.openMuted[i] === "O" ? "X" : "O";
}

function render() {
  mount.innerHTML = "";

  const svg = renderChordSVG(state, layout);
  mount.appendChild(svg);

  svg.addEventListener("click", (e) => {
    const hit = hitTest(svg, state, layout, e.clientX, e.clientY);

    if (hit.type === "ox") {
      toggleOX(hit.string);
      render();
      return;
    }

    if (hit.type === "grid") {
      toggleFinger(hit.string, hit.fret);
      render();
    }
  });

  if (dump) {
    dump.textContent = JSON.stringify(state, null, 2);
  }

  if ($chordName) {
    $chordName.textContent = detectChordName(state);
  }

  $btnSvg.onclick = () => downloadSVG(svg);
  $btnPng.onclick = () => downloadPNG(svg);
}

function syncUIFromState() {
  $title.value = state.title;
  $fretsVisible.value = state.fretsVisible;
  $startFret.value = state.startFret;
  $strings.value = state.strings;

  $height.value = state.style.gridH;
  $fingerSize.value = state.style.dotR;
  $fingerFontSize.value = state.style.fingerFontSize;
  $titleFontSize.value = state.style.titleFontSize;
  $strokeWidth.value = state.style.strokeWidth;
  $fgColor.value = state.style.fgColor;
  $bgColor.value = state.style.bgColor;

  $hidePosition.checked = state.style.hidePosition;
  $showFretMarkers.checked = state.style.showFretMarkers;
}

function resetSettings() {
  state.title = DEFAULTS.title;
  state.strings = DEFAULTS.strings;
  state.fretsVisible = DEFAULTS.fretsVisible;
  state.startFret = DEFAULTS.startFret;

  state.style = {
    gridH: DEFAULTS.gridH,
    dotR: DEFAULTS.dotR,
    fingerFontSize: DEFAULTS.fingerFontSize,
    titleFontSize: DEFAULTS.titleFontSize,
    strokeWidth: DEFAULTS.strokeWidth,
    fgColor: DEFAULTS.fgColor,
    bgColor: DEFAULTS.bgColor,
    showFretMarkers: DEFAULTS.showFretMarkers,
    hidePosition: DEFAULTS.hidePosition
  };

  state.openMuted = Array(state.strings).fill("O");
  state.fingers = [];

  syncUIFromState();
  render();
}

$title.addEventListener("input", () => {
  state.title = $title.value;
  render();
});

$fretsVisible.addEventListener("change", () => {
  state.fretsVisible = clamp(parseInt($fretsVisible.value || "5", 10), 3, 12);
  render();
});

$startFret.addEventListener("change", () => {
  state.startFret = clamp(parseInt($startFret.value || "1", 10), 1, 20);
  render();
});

$strings.addEventListener("change", () => {
  state.strings = clamp(parseInt($strings.value || "6", 10), 4, 8);
  ensureArraySizes();
  render();
});

$height.addEventListener("input", () => {
  state.style.gridH = parseInt($height.value, 10);
  render();
});

$fingerSize.addEventListener("input", () => {
  state.style.dotR = parseInt($fingerSize.value, 10);
  render();
});

$fingerFontSize.addEventListener("input", () => {
  state.style.fingerFontSize = parseInt($fingerFontSize.value, 10);
  render();
});

$titleFontSize.addEventListener("input", () => {
  state.style.titleFontSize = parseInt($titleFontSize.value, 10);
  render();
});

$strokeWidth.addEventListener("input", () => {
  state.style.strokeWidth = parseInt($strokeWidth.value, 10);
  render();
});

$fgColor.addEventListener("input", () => {
  state.style.fgColor = $fgColor.value;
  render();
});

$bgColor.addEventListener("input", () => {
  state.style.bgColor = $bgColor.value;
  render();
});

$hidePosition.addEventListener("change", () => {
  state.style.hidePosition = $hidePosition.checked;
  render();
});

$showFretMarkers.addEventListener("change", () => {
  state.style.showFretMarkers = $showFretMarkers.checked;
  render();
});

$btnClear.addEventListener("click", () => {
  state.openMuted = Array(state.strings).fill("O");
  state.fingers = [];
  render();
});

$btnReset.addEventListener("click", resetSettings);
$themeToggle?.addEventListener("click", toggleTheme);

loadTheme();
syncUIFromState();
render();
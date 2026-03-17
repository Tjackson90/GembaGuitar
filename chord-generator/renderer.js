import { el, txt, clamp, svgNS } from "./utils.js";

// Renders the chord diagram SVG from state + layout.
// Pure render: no side effects, no event listeners.
export function renderChordSVG(state, layout) {
  const style = state.style;

  const pad = layout.pad;
  const left = pad + layout.leftText;

  // We'll keep "top" for grid, but give extra headroom above it for O/X row
  const headerH = layout.topText;           // overall top area already reserved
  const oxY = pad + 26;                     // <-- moves O/X up (floating)
  const titleY = pad + 20;                  // title baseline

  const top = pad + headerH;                // grid starts here
  const w = layout.gridW;
  const h = style.gridH;

  const svgW = pad + layout.leftText + w + pad;
  const svgH = pad + headerH + h + pad;

  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", svgW);
  svg.setAttribute("height", svgH);
  svg.setAttribute("viewBox", `0 0 ${svgW} ${svgH}`);
  svg.style.maxWidth = "100%";
  svg.style.height = "auto";
  svg.style.display = "block";
  svg.style.borderRadius = "14px";

  // Background
  svg.appendChild(el("rect", { x: 0, y: 0, width: svgW, height: svgH, fill: style.bgColor }));

  const stroke = style.fgColor;
  const strokeW = style.strokeWidth;

  // Title (centered)
  if (state.title && state.title.trim()) {
    svg.appendChild(
      txt(
        state.title.trim(),
        svgW / 2,
        titleY,
        style.titleFontSize,
        stroke,
        "middle",
        "800"
      )
    );
  }

  // Position label (start fret) unless hidden, and only if > 1
  // Make it MUCH bigger
  if (!style.hidePosition && state.startFret > 1) {
    svg.appendChild(
      txt(
        `${state.startFret}fr`,
        pad,
        top + 26,
        20,        // <-- bigger font size
        stroke,
        "start",
        "900"
      )
    );
  }

  // Strings
  const dx = w / (state.strings - 1);
  for (let i = 0; i < state.strings; i++) {
    const x = left + i * dx;
    svg.appendChild(
      el("line", {
        x1: x,
        y1: top,
        x2: x,
        y2: top + h,
        stroke,
        "stroke-width": strokeW,
        "stroke-linecap": "round"
      })
    );
  }

  // Frets
  const dy = h / state.fretsVisible;
  for (let f = 0; f <= state.fretsVisible; f++) {
    const y = top + f * dy;
    const isNut = state.startFret === 1 && f === 0;

    svg.appendChild(
      el("line", {
        x1: left,
        y1: y,
        x2: left + w,
        y2: y,
        stroke,
        "stroke-width": isNut ? Math.max(strokeW * 3, 5) : strokeW,
        "stroke-linecap": "round"
      })
    );
  }

  // OPTIONAL fret markers remain the same
  if (style.showFretMarkers) {
    drawFretMarkers(svg, state, { left, top, w, dy }, strokeW);
  }

  // ----------------------------
  // Build a fast lookup: which strings have fingers?
  // ----------------------------
  const fingerByString = new Map();
  for (const f of state.fingers) {
    fingerByString.set(f.string, f);
  }

  // ----------------------------
  // O/X markers row (bigger + floating + hidden if finger selected)
  // ----------------------------
  const oxFont = 22; // <-- bigger O/X
  for (let s = 1; s <= state.strings; s++) {
    // If a finger exists on this string, hide O/X entirely
    if (fingerByString.has(s)) continue;

    const x = stringToX(state, s, left, w);
    const mark = state.openMuted[s - 1] ?? "O";

    svg.appendChild(
      txt(
        mark,
        x,
        oxY,
        oxFont,
        stroke,
        "middle",
        "900"
      )
    );
  }

  // ----------------------------
  // Finger dots
  // ----------------------------
  for (const f of state.fingers) {
    const fretIndex = f.fret - state.startFret + 1;
    if (fretIndex < 1 || fretIndex > state.fretsVisible) continue;

    const cx = stringToX(state, f.string, left, w);
    const cy = top + (fretIndex - 0.5) * dy;

    svg.appendChild(el("circle", { cx, cy, r: style.dotR, fill: stroke }));

    if (f.label && f.label.trim()) {
      svg.appendChild(
        txt(
          f.label.trim(),
          cx,
          cy + style.fingerFontSize * 0.35,
          style.fingerFontSize,
          style.bgColor,
          "middle",
          "900"
        )
      );
    }
  }

  return svg;
}


// ----------------------------
// Hit-testing (click mapping)
// ----------------------------
export function hitTest(svgEl, state, layout, clientX, clientY) {
  const pt = svgEl.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;

  const inv = svgEl.getScreenCTM().inverse();
  const loc = pt.matrixTransform(inv);

  const x = loc.x,
    y = loc.y;

  const pad = layout.pad;
  const left = pad + layout.leftText;
  const top = pad + layout.topText;
  const w = layout.gridW;
  const h = state.style.gridH;

  // O/X strip
  if (y >= pad && y <= top && x >= left && x <= left + w) {
    const string = xToString(state, x, left, w);
    return { type: "ox", string };
  }

  // grid
  if (x >= left && x <= left + w && y >= top && y <= top + h) {
    const string = xToString(state, x, left, w);
    const fretIndex = yToFretIndex(state, y, top, h); // 1..fretsVisible
    const fret = state.startFret + fretIndex - 1;
    return { type: "grid", string, fret };
  }

  return { type: "none" };
}

// ----------------------------
// Geometry helpers
// ----------------------------
export function stringToX(state, string, left, w) {
  // Visual convention: low string on left, high string on right
  // string numbers: 1 = high string, N = low string
  const dx = w / (state.strings - 1);
  const idx = state.strings - string; // low string -> 0, high string -> last
  return left + idx * dx;
}

function xToString(state, x, left, w) {
  const dx = w / (state.strings - 1);
  const idx = clamp(Math.round((x - left) / dx), 0, state.strings - 1);
  return state.strings - idx;
}

function yToFretIndex(state, y, top, h) {
  const dy = h / state.fretsVisible;
  const idx = clamp(Math.floor((y - top) / dy), 0, state.fretsVisible - 1);
  return idx + 1;
}

// ----------------------------
// Fret markers (3/5/7/9/12)
// ----------------------------
function drawFretMarkers(svg, state, geom, strokeW) {
  const { left, top, w, dy } = geom;

  const markerFrets = new Set([3, 5, 7, 9, 12]);

  for (let i = 1; i <= state.fretsVisible; i++) {
    const absFret = state.startFret + i - 1;
    if (!markerFrets.has(absFret)) continue;

    const cy = top + (i - 0.5) * dy;

    if (absFret === 12) {
      // double dots
      svg.appendChild(
        el("circle", {
          cx: left + w / 2 - 18,
          cy,
          r: Math.max(strokeW * 1.8, 4),
          fill: "rgba(0,0,0,0.18)"
        })
      );
      svg.appendChild(
        el("circle", {
          cx: left + w / 2 + 18,
          cy,
          r: Math.max(strokeW * 1.8, 4),
          fill: "rgba(0,0,0,0.18)"
        })
      );
    } else {
      svg.appendChild(
        el("circle", {
          cx: left + w / 2,
          cy,
          r: Math.max(strokeW * 1.8, 4),
          fill: "rgba(0,0,0,0.18)"
        })
      );
    }
  }
}

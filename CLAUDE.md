# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GembaGuitar is a static website offering free guitar tools (metronome, tuner, chord diagram generator, learning resources) for self-taught musicians. Live at `https://gembaguitar.com/`.

## Development

No build step. Edit HTML/CSS/JS files directly and open in a browser, or run a local HTTP server:

```bash
# Python local server (from project root)
python -m http.server 8000
# Then visit http://localhost:8000
```

Deployment is via Netlify from the `main` branch.

## Architecture

### Structure
- Each tool lives in its own subdirectory (`/metronome/`, `/tuner/`, `/chord-generator/`, `/learn/`)
- The root `index.html` is the main landing page
- `css/gemba.css` is the **shared brand stylesheet** — imported by all tool pages for consistent nav, colors, and typography

### Brand Tokens (css/gemba.css)
```css
--navy: #0b1e3d
--gold: #c9a84c
--cream: #f5f0e8
--gemba-navbar-h: 64px
```
All new pages must import `css/gemba.css` and follow these tokens.

### JavaScript Pattern
Tools use IIFE modules exposing a public API via `window.ModuleName`:
```javascript
window.Metronome = (function () {
  // private state
  return { start, stop, updateLiveVolume }; // public API
})();
```

The metronome is the most complex tool and is split into:
- `metronome.js` — scheduling engine (tick logic, BPM, subdivisions)
- `audio.js` — Web Audio API (`AudioEngine`): sound synthesis + WAV sample playback with synthesized fallback
- `app.js` — UI event handlers, DOM wiring
- `ui.js` — UI helpers

### Lead Magnet Flow
Email capture form on `index.html` → submits → redirects to `/thank-you/` → offers PDF download (`assets/15-Essential-Guitar-Chords.pdf`). Form submission uses JS (see recent commit `12cfdea`).

### Single-file tools
`/tuner/index.html`, `/chord-generator/index.html`, and `/learn/index.html` are self-contained single-file tools with inline JS and CSS (in addition to the shared `gemba.css`).

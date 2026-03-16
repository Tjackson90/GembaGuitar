// js/chordDetect.js
// Basic chord detection for guitar-style chord diagrams.
// Assumes standard tuning when strings === 6.
// String numbering: 1 = highest string, 6 = lowest string.

const NOTE_NAMES_SHARP = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

// MIDI notes for standard tuning open strings (string 1..6):
// E4, B3, G3, D3, A2, E2
const STANDARD_TUNING_6 = [64, 59, 55, 50, 45, 40];

function pcName(pc){ return NOTE_NAMES_SHARP[(pc + 12) % 12]; }
function mod12(n){ return ((n % 12) + 12) % 12; }

function getTuningForState(state){
  if (state.strings === 6) return STANDARD_TUNING_6;
  // fallback: still use 6-string tuning truncated/extended (personal tool, keep simple)
  // If more than 6 strings, repeat low E downwards in 5ths-ish? Nah. We’ll pad with low E.
  const t = STANDARD_TUNING_6.slice();
  while (t.length < state.strings) t.push(40); // pad with E2
  return t.slice(0, state.strings);
}

function unique(arr){
  return Array.from(new Set(arr));
}

// Return list of sounding notes with midi + pc + string
function computeSoundingNotes(state){
  const tuning = getTuningForState(state); // array indexed by (string-1)
  const notes = [];

  for (let s = 1; s <= state.strings; s++){
    const idx = s - 1;

    // Find finger on this string (we assume at most one per string; app.js will enforce)
    const finger = state.fingers.find(f => f.string === s);

    if (finger){
      const midi = tuning[idx] + finger.fret; // finger.fret is absolute fret #
      notes.push({ string: s, midi, pc: mod12(midi) });
      continue;
    }

    // no finger: open/muted
    const mark = state.openMuted[idx] ?? "O";
    if (mark === "X") continue;

    const midi = tuning[idx]; // open string
    notes.push({ string: s, midi, pc: mod12(midi) });
  }

  return notes;
}

// chord patterns: intervals relative to root
const PATTERNS = [
  { name: "",      ints: [0,4,7],           score: 90 },  // major
  { name: "m",     ints: [0,3,7],           score: 90 },  // minor
  { name: "dim",   ints: [0,3,6],           score: 88 },
  { name: "aug",   ints: [0,4,8],           score: 88 },
  { name: "sus2",  ints: [0,2,7],           score: 86 },
  { name: "sus4",  ints: [0,5,7],           score: 86 },
  { name: "5",     ints: [0,7],             score: 70 },

  { name: "7",     ints: [0,4,7,10],        score: 95 },
  { name: "maj7",  ints: [0,4,7,11],        score: 95 },
  { name: "m7",    ints: [0,3,7,10],        score: 95 },
  { name: "m(maj7)", ints:[0,3,7,11],       score: 93 },
  { name: "m7b5",  ints: [0,3,6,10],        score: 93 },
  { name: "dim7",  ints: [0,3,6,9],         score: 92 },

  { name: "6",     ints: [0,4,7,9],         score: 92 },
  { name: "m6",    ints: [0,3,7,9],         score: 92 },
];

// If it’s basically a triad with extra tones, we’ll tack on add/extension labels.
function extensionSuffix(intervalsSet, qualityName){
  // intervalsSet includes 0
  const has2  = intervalsSet.has(2);
  const has9  = intervalsSet.has(9);
  const has10 = intervalsSet.has(10);
  const has11 = intervalsSet.has(11);

  // If it already matched a 7/maj7/m7 etc, don't add extra suffix here.
  if (qualityName.includes("7")) return "";

  // Simple add9 + 6 handling
  if (has2) return "add9";
  if (has9) return "6"; // if major triad + 6 note present, many people call it 6
  if (has11) return "maj7"; // very rough fallback
  if (has10) return "7";    // very rough fallback
  return "";
}

function matchScore(intervalsSet, patternIntervals){
  // Score exact matches higher; allow extra notes with penalty.
  const pat = new Set(patternIntervals);
  // must contain all pattern intervals
  for (const i of pat){
    if (!intervalsSet.has(i)) return -1;
  }
  // base score: fewer extras is better
  const extras = intervalsSet.size - pat.size;
  return 100 - extras * 6;
}

export function detectChordName(state){
  const sounding = computeSoundingNotes(state);
  if (sounding.length === 0) return "—";

  // pitch-class set
  const pcs = unique(sounding.map(n => n.pc));
  if (pcs.length === 0) return "—";

  // bass note (lowest midi)
  const bass = sounding.reduce((a,b) => (b.midi < a.midi ? b : a), sounding[0]);
  const bassName = pcName(bass.pc);

  let best = null;

  for (const rootPc of pcs){
    const intervals = pcs.map(pc => mod12(pc - rootPc));
    const intervalsSet = new Set(intervals);

    // Try known patterns first (exact-ish)
    for (const p of PATTERNS){
      const s = matchScore(intervalsSet, p.ints);
      if (s < 0) continue;

      // bump score if root is in bass (more likely intended)
      const bassBoost = (bass.pc === rootPc) ? 6 : 0;

      const ext = extensionSuffix(intervalsSet, p.name);
      const rootName = pcName(rootPc);

      // If ext duplicates quality (e.g., major triad + 9 -> add9)
      // Output like Cadd9, Cmadd9, etc.
      let quality = p.name;
      let name = rootName + quality;

      if (ext){
        // avoid "C6" when pattern is already "6"
        if (ext === "6" && (quality === "6" || quality === "m6")) {
          // do nothing
        } else if (ext === "7" && quality === "7") {
          // do nothing
        } else if (ext === "maj7" && quality === "maj7") {
          // do nothing
        } else {
          // add9 should come after quality: Cmadd9 etc
          name = rootName + quality + ext;
        }
      }

      const score = p.score + s + bassBoost;

      if (!best || score > best.score){
        best = { score, rootPc, name };
      }
    }
  }

  if (!best) {
    // fallback: just list pitch classes
    return pcs.map(pcName).join("-");
  }

  // Slash chord if bass isn't root
  const rootName = pcName(best.rootPc);
  if (bassName !== rootName) return `${best.name}/${bassName}`;

  return best.name;
}

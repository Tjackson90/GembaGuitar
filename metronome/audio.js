window.AudioEngine = (function () {
  let audioCtx = null;
  let hasTriedLoading = false;

  const sampleBuffers = {
    normal: null,
    accent: null
  };

  function getCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  async function unlock() {
    const ctx = getCtx();

    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    if (!hasTriedLoading) {
      hasTriedLoading = true;
      loadSamples();
    }
  }

  async function loadSample(url) {
    try {
      const ctx = getCtx();
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Failed to load ${url}`);
      }

      const arr = await res.arrayBuffer();
      return await ctx.decodeAudioData(arr);
    } catch (error) {
      return null;
    }
  }

  async function loadSamples() {
    sampleBuffers.normal = await loadSample("beat.wav");
    sampleBuffers.accent = await loadSample("accent.wav");
  }

  function tone(freq, type, dur, vol, when) {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);

    gain.gain.setValueAtTime(Math.max(0.0001, vol), when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(when);
    osc.stop(when + dur + 0.01);
  }

  function playBuffer(buffer, volume, when) {
    if (!buffer) return false;

    const ctx = getCtx();
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();

    source.buffer = buffer;
    gain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), when);

    source.connect(gain);
    gain.connect(ctx.destination);

    source.start(when);
    return true;
  }

  function synthFallback(soundName, isAccent, masterVol, when) {
    const v = Math.max(0, Math.min(1, masterVol));

    switch (soundName) {
      case "wood":
        if (isAccent) {
          tone(1450, "triangle", 0.018, 0.24 * v, when);
          tone(980, "triangle", 0.020, 0.10 * v, when);
        } else {
          tone(900, "triangle", 0.018, 0.13 * v, when);
        }
        break;

      case "click":
        if (isAccent) {
          tone(2400, "square", 0.008, 0.16 * v, when);
          tone(1800, "square", 0.010, 0.08 * v, when);
        } else {
          tone(1750, "square", 0.007, 0.08 * v, when);
        }
        break;

      case "beep":
        tone(
          isAccent ? 1350 : 950,
          "sine",
          isAccent ? 0.03 : 0.025,
          isAccent ? 0.13 * v : 0.08 * v,
          when
        );
        break;

      case "cowbell":
        if (isAccent) {
          tone(1750, "square", 0.014, 0.15 * v, when);
          tone(1180, "triangle", 0.018, 0.09 * v, when);
        } else {
          tone(1250, "square", 0.012, 0.08 * v, when);
        }
        break;

      default:
        tone(isAccent ? 1400 : 1000, "triangle", 0.02, isAccent ? 0.12 * v : 0.08 * v, when);
    }
  }

  function playAt(soundName, isAccent, masterVol, when) {
    const v = Math.max(0, Math.min(1, masterVol));

    const usedSample = isAccent
      ? playBuffer(sampleBuffers.accent, v, when)
      : playBuffer(sampleBuffers.normal, v, when);

    if (!usedSample) {
      synthFallback(soundName, isAccent, masterVol, when);
    }
  }

  function currentTime() {
    return getCtx().currentTime;
  }

  return {
    unlock,
    playAt,
    currentTime
  };
})();
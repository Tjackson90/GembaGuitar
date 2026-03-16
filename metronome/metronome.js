window.Metronome = (function () {
  let isRunning = false;
  let schedulerID = null;
  let nextNoteTime = 0;
  let currentBeat = 1;
  let currentPulse = 0;
  let snapshot = null;

  const LOOKAHEAD = 0.15;
  const INTERVAL_MS = 25;

  function getSubdivisionInfo(mode) {
    switch (mode) {
      case "quarter":
        return {
          pulsesPerBeat: 1,
          label: "Quarter"
        };

      case "eighth":
        return {
          pulsesPerBeat: 2,
          label: "8th"
        };

      case "triplet8":
        return {
          pulsesPerBeat: 3,
          label: "8th Triplets"
        };

      case "sixteenth":
        return {
          pulsesPerBeat: 4,
          label: "16th"
        };

      case "triplet16":
        return {
          pulsesPerBeat: 6,
          label: "16th Triplets"
        };

      default:
        return {
          pulsesPerBeat: 1,
          label: "Quarter"
        };
    }
  }

  function noteInterval(settings, pulseIndexInBeat) {
    const beatDur = 60 / settings.bpm;
    const subdivisionInfo = getSubdivisionInfo(settings.subdivision);

    if (settings.subdivision === "eighth" && settings.swing > 50) {
      const swing = settings.swing / 100;
      return pulseIndexInBeat % 2 === 0
        ? beatDur * swing
        : beatDur * (1 - swing);
    }

    return beatDur / subdivisionInfo.pulsesPerBeat;
  }

  function scheduleAhead() {
    if (!isRunning || !snapshot) return;

    const now = window.AudioEngine.currentTime();
    const subdivisionInfo = getSubdivisionInfo(snapshot.subdivision);

    while (nextNoteTime < now + LOOKAHEAD) {
      const isMainBeat = currentPulse === 0;
      const isAccent = isMainBeat && currentBeat === 1;

      window.AudioEngine.playAt(
        snapshot.sound,
        isAccent,
        snapshot.volume,
        nextNoteTime
      );

      if (isMainBeat) {
        const beat = currentBeat;
        const beatsPerMeasure = snapshot.beatsPerMeasure;
        const delay = Math.max(0, (nextNoteTime - now) * 1000);

        setTimeout(() => {
          window.UI.setBeat(beat);
          window.UI.renderDots(beatsPerMeasure, beat);
        }, delay);
      }

      nextNoteTime += noteInterval(snapshot, currentPulse);

      currentPulse++;

      if (currentPulse >= subdivisionInfo.pulsesPerBeat) {
        currentPulse = 0;
        currentBeat++;

        if (currentBeat > snapshot.beatsPerMeasure) {
          currentBeat = 1;
        }
      }
    }
  }

  function start(settings) {
    stop();

    snapshot = { ...settings };
    isRunning = true;
    currentBeat = 1;
    currentPulse = 0;
    nextNoteTime = window.AudioEngine.currentTime() + 0.05;

    const subdivisionInfo = getSubdivisionInfo(settings.subdivision);

    window.UI.renderDots(settings.beatsPerMeasure, 1);
    window.UI.setStatus(
      `Running · ${settings.bpm} BPM · ${settings.timeSignatureLabel} · ${subdivisionInfo.label}`,
      true
    );

    schedulerID = setInterval(scheduleAhead, INTERVAL_MS);
    scheduleAhead();
  }

  function stop() {
    isRunning = false;

    if (schedulerID) {
      clearInterval(schedulerID);
      schedulerID = null;
    }

    currentBeat = 1;
    currentPulse = 0;

    const beatsPerMeasure = snapshot ? snapshot.beatsPerMeasure : 4;

    window.UI.setBeat(1);
    window.UI.renderDots(beatsPerMeasure, 1);
    window.UI.setStatus("Stopped", false);
  }

  function restartIfRunning(settings) {
    if (isRunning) {
      start(settings);
    }
  }

  function updateLiveVolume(newVolume) {
    if (snapshot) {
      snapshot.volume = newVolume;
    }
  }

  function getIsRunning() {
    return isRunning;
  }

  return {
    start,
    stop,
    restartIfRunning,
    updateLiveVolume,
    getIsRunning
  };
})();
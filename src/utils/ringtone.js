/**
 * ringtone.js — a synthesized incoming-call ringtone (no audio file needed).
 *
 * Uses the Web Audio API to play a classic dual-tone (440 + 480 Hz) ring burst
 * that repeats every few seconds, mimicking a phone ring. Synthesized rather than
 * shipped as an .mp3 so there's no binary asset to manage and no network fetch.
 *
 * Usage:
 *   const rt = createRingtone();
 *   rt.unlock();   // call on a user gesture so the AudioContext can play
 *   rt.start();    // begin ringing (idempotent)
 *   rt.stop();     // stop ringing + release scheduled tones
 *
 * Autoplay note: browsers create the AudioContext "suspended" until a user
 * gesture occurs. unlock() (wired to the first click/keypress on the page)
 * resumes it so a later incoming call can ring without further interaction.
 */

export function createRingtone() {
  let ctx = null;
  let intervalId = null;
  let activeNodes = [];

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  // Play a single ~1s ring burst (two sine tones with a soft attack/release).
  function playRing() {
    const audioCtx = ensureCtx();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const dur = 1.0;

    const gain = audioCtx.createGain();
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.06);
    gain.gain.setValueAtTime(0.22, now + dur - 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    [440, 480].forEach((freq) => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + dur);
      activeNodes.push(osc);
      osc.onended = () => { activeNodes = activeNodes.filter((n) => n !== osc); };
    });
  }

  function start() {
    if (intervalId) return; // already ringing
    playRing();                          // ring immediately
    intervalId = setInterval(playRing, 3000); // ~1s ring + ~2s gap, repeating
  }

  function stop() {
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
    activeNodes.forEach((n) => { try { n.stop(); } catch { /* already stopped */ } });
    activeNodes = [];
  }

  // Resume a suspended AudioContext from a user gesture so start() can play.
  function unlock() {
    ensureCtx();
  }

  return { start, stop, unlock };
}

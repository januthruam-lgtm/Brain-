// Web Audio API game synthesizer for Brain Studio / App Acadêmico IFES

let audioCtx: AudioContext | null = null;
let audioMuted: boolean = (() => {
  try {
    return localStorage.getItem("audio_mutado") === "true";
  } catch {
    return false;
  }
})();

export function isAudioMuted(): boolean {
  return audioMuted;
}

export function toggleAudioMuted(): boolean {
  audioMuted = !audioMuted;
  try {
    localStorage.setItem("audio_mutado", String(audioMuted));
  } catch (e) {
    console.warn("Could not save audio preference", e);
  }
  return audioMuted;
}

export function getAudioContext(): AudioContext | null {
  if (audioMuted) return null;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(console.warn);
  }
  return audioCtx;
}

/**
 * Plays a bright coin chime using sine wave frequency jumping
 */
export function playCoinSound(baseFreq = 988): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.setValueAtTime(baseFreq * 1.33, now + 0.06);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {
    console.warn("Error playing coin sound", e);
  }
}

/**
 * Plays a rapid cascade of coin sounds
 */
export function playCoinCascade(count = 10): void {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      playCoinSound(1600 + Math.random() * 800);
    }, i * 50);
  }
}

/**
 * Plays a triumphant level-up or purchase fanfare
 */
export function playLevelUpSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + idx * 0.08;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.3, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.3);
    });
  } catch (e) {
    console.warn("Error playing level up sound", e);
  }
}

/**
 * Triggers a coin explosion from a source element/coordinate to the HUD coin target
 */
export function triggerCoinExplosion(
  event?: MouseEvent | { clientX: number; clientY: number },
  quantity = 10,
  targetElementId = "hud-moedas"
): void {
  playCoinCascade(quantity);

  if (typeof window === "undefined") return;

  const container = document.getElementById("coin-container") || document.body;
  const target = document.getElementById(targetElementId);

  const originX = event ? event.clientX : window.innerWidth / 2;
  const originY = event ? event.clientY : window.innerHeight / 2;

  const targetRect = target ? target.getBoundingClientRect() : { left: 100, top: 30 };
  const targetX = targetRect.left + 15;
  const targetY = targetRect.top + 15;

  if ("vibrate" in navigator) {
    try {
      navigator.vibrate([30, 50, 30]);
    } catch {
      // ignore
    }
  }

  for (let i = 0; i < quantity; i++) {
    const coin = document.createElement("div");
    coin.className = "moeda-particula";
    coin.innerText = "🪙";
    coin.style.cssText = `
      position: fixed;
      left: ${originX - 16}px;
      top: ${originY - 16}px;
      width: 32px;
      height: 32px;
      font-size: 28px;
      z-index: 99999;
      pointer-events: none;
      user-select: none;
      transition: transform 0.6s cubic-bezier(0.12, 0.8, 0.32, 1), opacity 0.4s ease;
      will-change: transform, opacity;
    `;
    container.appendChild(coin);

    const angle = Math.random() * Math.PI * 2;
    const radius = 60 + Math.random() * 80;
    const burstX = Math.cos(angle) * radius;
    const burstY = Math.sin(angle) * radius;

    requestAnimationFrame(() => {
      coin.style.transform = `translate(${burstX}px, ${burstY}px) scale(1) rotate(${Math.random() * 360}deg)`;
    });

    setTimeout(() => {
      coin.style.transition = "transform 0.5s cubic-bezier(0.55, 0.055, 0.675, 0.19), opacity 0.4s ease";
      coin.style.transform = `translate(${targetX - originX}px, ${targetY - originY}px) scale(0.4)`;

      setTimeout(() => {
        coin.style.opacity = "0";
        if (target) {
          target.classList.add("balancar-hud");
          setTimeout(() => target.classList.remove("balancar-hud"), 150);
        }
        setTimeout(() => coin.remove(), 200);
      }, 500);
    }, 200 + Math.random() * 100);
  }
}

let ambientNoiseSource: AudioBufferSourceNode | null = null;
let currentAmbientType: "chuva" | "ruido" | null = null;

/**
 * Plays a sound effect with specified base frequency
 */
export function playToneEffect(baseFreq = 800): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.warn("Error playing tone effect", e);
  }
}

/**
 * Toggles synthetic ambient sound (rain or white noise)
 */
export function toggleAmbientSound(type: "chuva" | "ruido"): boolean {
  const ctx = getAudioContext();
  if (!ctx) return false;

  if (ambientNoiseSource) {
    stopAmbientSound();
    if (currentAmbientType === type) {
      currentAmbientType = null;
      return false;
    }
  }

  try {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    ambientNoiseSource = ctx.createBufferSource();
    ambientNoiseSource.buffer = buffer;
    ambientNoiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = type === "chuva" ? "lowpass" : "bandpass";
    filter.frequency.value = type === "chuva" ? 800 : 1200;

    const gain = ctx.createGain();
    gain.gain.value = 0.05;

    ambientNoiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    ambientNoiseSource.start();
    currentAmbientType = type;
    return true;
  } catch (e) {
    console.warn("Error starting ambient sound", e);
    return false;
  }
}

export function stopAmbientSound(): void {
  if (ambientNoiseSource) {
    try {
      ambientNoiseSource.stop();
      ambientNoiseSource.disconnect();
    } catch {
      // ignore
    }
    ambientNoiseSource = null;
    currentAmbientType = null;
  }
}

export function getCurrentAmbientType(): "chuva" | "ruido" | null {
  return currentAmbientType;
}

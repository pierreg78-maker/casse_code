let ctx: AudioContext | null = null;

export function unlockAudio() {
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
}

export type SfxName = "place" | "bad" | "score" | "win" | "lose";

export function sfx(kind: SfxName, muted: boolean) {
  if (muted || !ctx || ctx.state !== "running") return;
  const t = ctx.currentTime;
  if (kind === "place") tone(520 + Math.random() * 40, t, 0.05, "triangle", 0.04);
  if (kind === "bad") tone(130, t, 0.14, "sine", 0.05);
  if (kind === "score") {
    tone(330, t, 0.07, "sine", 0.04);
    tone(494, t + 0.06, 0.09, "sine", 0.035);
  }
  if (kind === "win") {
    [523, 659, 784, 1046].forEach((freq, i) => tone(freq, t + i * 0.08, 0.16, "triangle", 0.045));
  }
  if (kind === "lose") {
    [392, 311, 247].forEach((freq, i) => tone(freq, t + i * 0.11, 0.18, "sine", 0.045));
  }
}

function tone(freq: number, when: number, dur: number, type: OscillatorType, volume: number) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  gain.gain.setValueAtTime(volume, when);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(when);
  osc.stop(when + dur + 0.02);
}

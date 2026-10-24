export const PEGS = [
  { name: "Rouge" },
  { name: "Bleu" },
  { name: "Vert" },
  { name: "Jaune" },
  { name: "Orange" },
  { name: "Blanc" },
  { name: "Gris" },
  { name: "Bordeaux" },
] as const;

export const LEVELS = {
  initiation: {
    id: "initiation",
    label: "Initiation",
    detail: "4 cases · 4 couleurs · sans doublon · 8 essais",
    rule: "Chaque couleur n’apparaît qu’une fois.",
    slots: 4,
    colors: 4,
    tries: 8,
    duplicates: false,
  },
  classique: {
    id: "classique",
    label: "Classique",
    detail: "4 cases · 6 couleurs · doublons · 10 essais",
    rule: "Une couleur peut revenir plusieurs fois.",
    slots: 4,
    colors: 6,
    tries: 10,
    duplicates: true,
  },
  expert: {
    id: "expert",
    label: "Expert",
    detail: "5 cases · 8 couleurs · doublons · 12 essais",
    rule: "Une couleur peut revenir plusieurs fois.",
    slots: 5,
    colors: 8,
    tries: 12,
    duplicates: true,
  },
} as const;

export type LevelId = keyof typeof LEVELS;
export type Level = (typeof LEVELS)[LevelId];

export type Stats = {
  version: 1;
  played: number;
  won: number;
  streak: number;
  bestStreak: number;
  best: Record<LevelId, number | null>;
};

const STATS_KEY = "casse-code-stats-v1";

export const EMPTY_STATS: Stats = {
  version: 1,
  played: 0,
  won: 0,
  streak: 0,
  bestStreak: 0,
  best: { initiation: null, classique: null, expert: null },
};

export function makeSecret(level: Level, random: () => number = Math.random): number[] {
  if (!level.duplicates && level.slots <= level.colors) {
    const pool = Array.from({ length: level.colors }, (_, i) => i);
    const secret: number[] = [];
    for (let i = 0; i < level.slots; i++) {
      const j = Math.floor(random() * pool.length);
      secret.push(pool.splice(j, 1)[0] ?? 0);
    }
    return secret;
  }
  return Array.from({ length: level.slots }, () => Math.floor(random() * level.colors));
}

/** Blacks (exact) then whites (right color, wrong place). Order of pegs is not positional. */
export function scoreGuess(
  secret: readonly number[],
  guess: readonly number[],
): { exact: number; color: number } {
  if (secret.length !== guess.length || secret.length === 0) return { exact: 0, color: 0 };
  let exact = 0;
  const secretLeft: number[] = [];
  const guessLeft: number[] = [];
  for (let i = 0; i < secret.length; i++) {
    if (secret[i] === guess[i]) exact += 1;
    else {
      secretLeft.push(secret[i] ?? -1);
      guessLeft.push(guess[i] ?? -2);
    }
  }
  const counts = new Map<number, number>();
  for (const tone of secretLeft) counts.set(tone, (counts.get(tone) ?? 0) + 1);
  let color = 0;
  for (const tone of guessLeft) {
    const left = counts.get(tone) ?? 0;
    if (left > 0) {
      color += 1;
      counts.set(tone, left - 1);
    }
  }
  return { exact, color };
}

export function feedbackPhrase(exact: number, color: number): string {
  if (exact === 0 && color === 0) return "Aucune couleur du code.";
  const bits: string[] = [];
  if (exact === 1) bits.push("1 bien placée");
  else if (exact > 1) bits.push(`${exact} bien placées`);
  if (color === 1) bits.push("1 ailleurs");
  else if (color > 1) bits.push(`${color} ailleurs`);
  return bits.join(" · ");
}

export function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return EMPTY_STATS;
    const data = JSON.parse(raw) as Partial<Stats>;
    if (data.version !== 1 || !data.best) return EMPTY_STATS;
    return {
      ...EMPTY_STATS,
      played: typeof data.played === "number" ? data.played : 0,
      won: typeof data.won === "number" ? data.won : 0,
      streak: typeof data.streak === "number" ? data.streak : 0,
      bestStreak: typeof data.bestStreak === "number" ? data.bestStreak : 0,
      best: {
        initiation: numberOrNull(data.best.initiation),
        classique: numberOrNull(data.best.classique),
        expert: numberOrNull(data.best.expert),
      },
    };
  } catch {
    return EMPTY_STATS;
  }
}

export function saveStats(stats: Stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

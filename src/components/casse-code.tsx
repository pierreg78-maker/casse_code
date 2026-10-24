import { useEffect, useRef, useState, type RefObject } from "react";
import { CircleHelp, Volume2, VolumeX } from "lucide-react";
import {
  EMPTY_STATS,
  LEVELS,
  PEGS,
  feedbackPhrase,
  loadStats,
  makeSecret,
  saveStats,
  scoreGuess,
  type LevelId,
  type Stats,
} from "@/lib/casse-code";
import { sfx, unlockAudio, type SfxName } from "@/lib/sfx";

type Turn = { guess: number[]; exact: number; color: number };
type Status = "playing" | "won" | "lost";

const MUTE_KEY = "casse-code-mute";

export function CasseCode() {
  const [levelId, setLevelId] = useState<LevelId>("classique");
  const [phase, setPhase] = useState<"menu" | "play">("menu");
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [secret, setSecret] = useState<number[]>([]);
  const [history, setHistory] = useState<Turn[]>([]);
  const [draft, setDraft] = useState<(number | null)[]>([]);
  const [focus, setFocus] = useState(0);
  const [status, setStatus] = useState<Status>("playing");
  const [note, setNote] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [muted, setMuted] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [fresh, setFresh] = useState(false);
  const [isRecord, setIsRecord] = useState(false);
  const [arm, setArm] = useState(false);

  const statsRef = useRef(stats);
  statsRef.current = stats;
  const activeRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const level = LEVELS[levelId];

  useEffect(() => {
    setStats(loadStats());
    if (localStorage.getItem(MUTE_KEY) === "1") setMuted(true);
  }, []);

  useEffect(() => {
    if (!fresh) return;
    const id = window.setTimeout(() => setFresh(false), 700);
    return () => window.clearTimeout(id);
  }, [fresh]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [history.length, phase]);

  useEffect(() => {
    if (help) closeRef.current?.focus();
  }, [help]);

  function play(kind: SfxName) {
    sfx(kind, muted);
  }

  function toggleMute() {
    unlockAudio();
    setMuted((value) => {
      const next = !value;
      localStorage.setItem(MUTE_KEY, next ? "1" : "0");
      return next;
    });
  }

  function begin(id: LevelId) {
    const nextLevel = LEVELS[id];
    unlockAudio();
    setLevelId(id);
    setSecret(makeSecret(nextLevel));
    setHistory([]);
    setDraft(emptyDraft(nextLevel.slots));
    setFocus(0);
    setStatus("playing");
    setPhase("play");
    setNote(null);
    setIsRecord(false);
    setArm(false);
    setHelp(false);
    setFresh(false);
  }

  function place(color: number) {
    if (help || status !== "playing" || phase !== "play") return;
    if (color < 0 || color >= level.colors) return;
    if (!level.duplicates && draft.includes(color) && draft[focus] !== color) {
      setNote("Cette couleur est déjà posée.");
      shake();
      play("bad");
      return;
    }
    const next = [...draft];
    next[focus] = color;
    setDraft(next);
    setArm(false);
    setNote(null);
    play("place");
    if (next.some((cell) => cell == null)) {
      for (let step = 1; step <= level.slots; step++) {
        const index = (focus + step) % level.slots;
        if (next[index] == null) {
          setFocus(index);
          break;
        }
      }
    }
  }

  function clearOne() {
    if (help || status !== "playing" || phase !== "play") return;
    const next = [...draft];
    if (next[focus] != null) {
      next[focus] = null;
      setDraft(next);
      setNote(null);
      return;
    }
    for (let step = 1; step <= level.slots; step++) {
      const index = (focus - step + level.slots) % level.slots;
      if (next[index] != null) {
        next[index] = null;
        setDraft(next);
        setFocus(index);
        setNote(null);
        return;
      }
    }
  }

  function submit() {
    if (help || phase !== "play" || status !== "playing") return;
    if (draft.some((cell) => cell == null)) {
      setNote("Complète chaque case.");
      shake();
      play("bad");
      return;
    }
    const guess = draft.map((cell) => cell ?? 0);
    if (!level.duplicates && new Set(guess).size !== guess.length) {
      setNote("Pas de couleur en double à ce niveau.");
      shake();
      play("bad");
      return;
    }
    const result = scoreGuess(secret, guess);
    const turns = history.length + 1;
    const won = result.exact === level.slots;
    const lost = !won && turns >= level.tries;
    setHistory((rows) => [...rows, { guess, exact: result.exact, color: result.color }]);
    setFresh(true);
    setNote(feedbackPhrase(result.exact, result.color));
    setArm(false);
    play(won ? "win" : lost ? "lose" : "score");
    if (won || lost) {
      setStatus(won ? "won" : "lost");
      commit(won, turns);
    }
    setDraft(emptyDraft(level.slots));
    setFocus(0);
  }

  function abandon() {
    if (status !== "playing") return;
    setStatus("lost");
    setNote(null);
    setArm(false);
    play("lose");
    commit(false, history.length);
  }

  function commit(won: boolean, turns: number) {
    const prev = statsRef.current;
    const next: Stats = {
      ...prev,
      played: prev.played + 1,
      won: prev.won + (won ? 1 : 0),
      streak: won ? prev.streak + 1 : 0,
      bestStreak: won ? Math.max(prev.bestStreak, prev.streak + 1) : prev.bestStreak,
      best: { ...prev.best },
    };
    if (won) {
      const best = prev.best[levelId];
      const beaten = best == null || turns < best;
      if (beaten) next.best[levelId] = turns;
      setIsRecord(beaten);
    } else {
      setIsRecord(false);
    }
    statsRef.current = next;
    setStats(next);
    saveStats(next);
  }

  function shake() {
    setShaking(false);
    window.setTimeout(() => setShaking(true), 0);
    window.setTimeout(() => setShaking(false), 320);
  }

  function moveFocus(delta: number) {
    if (help || phase !== "play" || status !== "playing") return;
    setFocus((index) => {
      const next = index + delta;
      if (next < 0) return 0;
      if (next >= level.slots) return level.slots - 1;
      return next;
    });
  }

  const act = useRef({ place, clearOne, submit, moveFocus, setHelp });
  act.current = { place, clearOne, submit, moveFocus, setHelp };

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        act.current.setHelp(false);
        return;
      }
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        act.current.moveFocus(-1);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        act.current.moveFocus(1);
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        act.current.clearOne();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        act.current.submit();
        return;
      }
      if (event.key >= "1" && event.key <= "8") {
        act.current.place(Number(event.key) - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const complete = draft.length > 0 && draft.every((cell) => cell != null);
  const activeIndex = status === "playing" ? history.length : -1;

  return (
    <div className={`shell ${phase === "menu" ? "overflow-y-auto" : "overflow-hidden"}`}>
      {phase === "menu" ? (
        <Menu
          levelId={levelId}
          stats={stats}
          muted={muted}
          onPick={setLevelId}
          onPlay={() => begin(levelId)}
          onMute={toggleMute}
          onHelp={() => setHelp(true)}
        />
      ) : (
        <div className="flex h-full min-h-0 flex-col">
          <header className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
            <div>
              <p className="text-xs tracking-widest text-brass uppercase">Mastermind</p>
              <h1 className="font-display text-3xl leading-none text-ivory">Casse-code</h1>
              <p className="mt-1 text-sm text-ivory-dim">
                {level.label}
                {" · "}
                {status === "playing"
                  ? `essai ${history.length + 1} / ${level.tries}`
                  : `${history.length} essai${history.length > 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="icon-btn" onClick={toggleMute} aria-label={muted ? "Activer le son" : "Couper le son"}>
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <button type="button" className="icon-btn" onClick={() => setHelp(true)} aria-label="Règles">
                <CircleHelp size={18} />
              </button>
            </div>
          </header>

          <div className={`case mx-3 flex min-h-0 flex-1 flex-col ${shaking ? "is-shaking" : ""}`}>
            <div className="rack flex-1 px-2 py-2">
              {Array.from({ length: level.tries }, (_, index) => {
                const turn = history[index];
                const active = index === activeIndex;
                return (
                  <div
                    key={index}
                    ref={active ? activeRef : undefined}
                    className={`row ${active ? "row-active" : ""} ${turn ? "" : active ? "" : "row-future"} ${
                      fresh && index === history.length - 1 ? "row-fresh" : ""
                    }`}
                    data-slots={level.slots}
                    aria-label={
                      turn
                        ? `Essai ${index + 1}, ${feedbackPhrase(turn.exact, turn.color)}`
                        : active
                          ? `Essai ${index + 1}, en cours`
                          : `Essai ${index + 1}, à venir`
                    }
                  >
                    <span className="row-idx">{String(index + 1).padStart(2, "0")}</span>
                    <div className="row-pegs">
                      {Array.from({ length: level.slots }, (_, slot) => {
                        const tone = active ? draft[slot] : turn?.guess[slot];
                        const peg = tone == null ? <span className="hole hole-lg" /> : <Peg tone={tone} size="lg" />;
                        if (!active) return <span key={slot}>{peg}</span>;
                        return (
                          <button
                            key={slot}
                            type="button"
                            className={`slot ${focus === slot ? "is-focus" : ""}`}
                            onClick={() => setFocus(slot)}
                            aria-label={
                              tone == null
                                ? `Case ${slot + 1}, vide`
                                : `Case ${slot + 1}, ${PEGS[tone]?.name ?? ""}`
                            }
                          >
                            {peg}
                          </button>
                        );
                      })}
                    </div>
                    <Pins
                      slots={level.slots}
                      exact={turn?.exact}
                      color={turn?.color}
                      revealed={Boolean(turn)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <footer className="safe-bottom shrink-0 px-4 pt-3">
            <p className="mb-2 min-h-5 text-center text-sm text-ivory-dim" aria-live="polite">
              {note ?? (status === "playing" ? level.rule : "")}
            </p>
            {status === "playing" ? (
              <>
                <div className={`grid gap-1 ${level.colors === 6 ? "grid-cols-3" : "grid-cols-4"}`}>
                  {PEGS.slice(0, level.colors).map((peg, tone) => {
                    const usedElsewhere =
                      !level.duplicates && draft.includes(tone) && draft[focus] !== tone;
                    return (
                      <button
                        key={peg.name}
                        type="button"
                        className={`swatch ${draft[focus] === tone ? "is-on" : ""}`}
                        disabled={usedElsewhere}
                        onClick={() => place(tone)}
                        aria-label={`${peg.name}, touche ${tone + 1}`}
                        aria-keyshortcuts={String(tone + 1)}
                      >
                        <Peg tone={tone} size="md" />
                        {peg.name}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" className="btn btn-ghost" onClick={clearOne}>
                    Effacer
                  </button>
                  <button type="button" className="btn btn-primary flex-1" disabled={!complete} onClick={submit}>
                    Valider
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    className="text-sm text-ivory-dim underline-offset-2 hover:underline"
                    onClick={() => (arm ? abandon() : setArm(true))}
                  >
                    {arm ? "Confirmer l’abandon" : "Abandonner"}
                  </button>
                  <p className="hidden text-xs text-ivory-dim sm:block">
                    Touches 1 à {level.colors} · Entrée
                  </p>
                </div>
              </>
            ) : (
              <Result
                status={status}
                turns={history.length}
                secret={secret}
                isRecord={isRecord}
                streak={stats.streak}
                onAgain={() => begin(levelId)}
                onMenu={() => setPhase("menu")}
              />
            )}
          </footer>
        </div>
      )}
      {help ? <Rules onClose={() => setHelp(false)} closeRef={closeRef} /> : null}
    </div>
  );
}

function Menu({
  levelId,
  stats,
  muted,
  onPick,
  onPlay,
  onMute,
  onHelp,
}: {
  levelId: LevelId;
  stats: Stats;
  muted: boolean;
  onPick: (id: LevelId) => void;
  onPlay: () => void;
  onMute: () => void;
  onHelp: () => void;
}) {
  const level = LEVELS[levelId];
  return (
    <div className="safe-bottom flex flex-col gap-5 px-4 py-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="logo mb-3" aria-hidden="true">
            <i data-tone="0" />
            <i data-tone="1" />
            <i data-tone="3" />
            <i data-tone="4" />
          </div>
          <p className="text-xs tracking-widest text-brass uppercase">Mastermind</p>
          <h1 className="font-display text-5xl leading-none text-ivory">Casse-code</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" className="icon-btn" onClick={onMute} aria-label={muted ? "Activer le son" : "Couper le son"}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button type="button" className="icon-btn" onClick={onHelp} aria-label="Règles">
            <CircleHelp size={18} />
          </button>
        </div>
      </header>

      <p className="text-base text-ivory-dim">
        Un code est caché. Chaque essai dit ce qui est juste — jamais quelle case.
      </p>

      <div className="case px-3 py-3">
        <div className="row" data-slots={4}>
          <span className="row-idx">ex</span>
          <div className="row-pegs">
            {[0, 0, 1, 3].map((tone, index) => (
              <Peg key={index} tone={tone} size="lg" />
            ))}
          </div>
          <Pins slots={4} exact={1} color={1} revealed />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 px-1 text-sm text-ivory-dim">
          <span className="inline-flex items-center gap-2">
            <span className="pin pin-exact" /> Bien placée
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="pin pin-color" /> Ailleurs
          </span>
        </div>
      </div>

      <div role="radiogroup" aria-label="Niveau" className="flex flex-col gap-2">
        {(Object.keys(LEVELS) as LevelId[]).map((id) => {
          const item = LEVELS[id];
          const best = stats.best[id];
          const on = id === levelId;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={on}
              className={`level ${on ? "is-on" : ""}`}
              onClick={() => onPick(id)}
            >
              <span className="font-display text-xl leading-none">{item.label}</span>
              <small>{item.detail}</small>
              {best != null ? <small>Record : {best} essai{best > 1 ? "s" : ""}</small> : null}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-ivory-dim">{level.rule}</p>

      <button type="button" className="btn btn-primary w-full" onClick={onPlay}>
        Jouer · {level.label}
      </button>

      <p className="text-center text-sm text-ivory-dim">
        {stats.played === 0
          ? "Aucune partie pour l’instant."
          : `${stats.won} victoire${stats.won > 1 ? "s" : ""} sur ${stats.played} · série ${stats.streak}`}
      </p>
    </div>
  );
}

function Result({
  status,
  turns,
  secret,
  isRecord,
  streak,
  onAgain,
  onMenu,
}: {
  status: Status;
  turns: number;
  secret: number[];
  isRecord: boolean;
  streak: number;
  onAgain: () => void;
  onMenu: () => void;
}) {
  const won = status === "won";
  return (
    <div className={won ? "banner-win" : "banner-lose"}>
      <h2 className="font-display text-3xl leading-none" aria-live="polite">
        {won ? "Cassé." : "Le code tient."}
      </h2>
      <p className="mt-1 text-sm text-ivory-dim">
        {won
          ? `En ${turns} essai${turns > 1 ? "s" : ""}.`
          : turns === 0
            ? "Aucun essai joué."
            : `Après ${turns} essai${turns > 1 ? "s" : ""}.`}
        {won && isRecord ? " Record du niveau." : ""}
        {won && streak > 1 ? ` Série de ${streak}.` : ""}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-sm text-ivory-dim">Code</span>
        {secret.map((tone, index) => (
          <Peg key={index} tone={tone} size="md" />
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" className="btn btn-primary flex-1" onClick={onAgain}>
          Rejouer
        </button>
        <button type="button" className="btn btn-ghost" onClick={onMenu}>
          Menu
        </button>
      </div>
    </div>
  );
}

function Rules({
  onClose,
  closeRef,
}: {
  onClose: () => void;
  closeRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <div className="sheet" role="presentation" onClick={onClose}>
      <div
        className="sheet-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="rules-title" className="font-display text-3xl leading-none">
          Comment lire le plateau
        </h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-ivory">
          <li>Un pion sombre : bonne couleur, bonne case.</li>
          <li>Un pion clair : bonne couleur, mauvaise case.</li>
          <li>L’ordre de ces pions ne dit pas quelle case. Il faut déduire.</li>
          <li>Le chiffre gravé sur chaque couleur permet de jouer sans se fier seulement à la teinte.</li>
        </ul>
        <button ref={closeRef} type="button" className="btn btn-primary mt-4 w-full" onClick={onClose}>
          Compris
        </button>
      </div>
    </div>
  );
}

function Peg({ tone, size }: { tone: number; size: "lg" | "md" }) {
  return (
    <span className={`peg peg-${size}`} data-tone={tone}>
      <span className="peg-mark">{tone + 1}</span>
    </span>
  );
}

function Pins({
  slots,
  exact = 0,
  color = 0,
  revealed,
}: {
  slots: number;
  exact?: number;
  color?: number;
  revealed: boolean;
}) {
  const kinds: Array<"exact" | "color" | "empty"> = [];
  if (revealed) {
    for (let i = 0; i < exact; i++) kinds.push("exact");
    for (let i = 0; i < color; i++) kinds.push("color");
  }
  while (kinds.length < slots) kinds.push("empty");
  return (
    <div className="pins" aria-hidden="true">
      {kinds.map((kind, index) => (
        <span key={index} className={`pin pin-${kind}`} />
      ))}
    </div>
  );
}

function emptyDraft(slots: number): (number | null)[] {
  return Array.from({ length: slots }, () => null);
}

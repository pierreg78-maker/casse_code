import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as CircleHelp, n as Volume2, t as VolumeX } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-FewDxJnO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PEGS = [
	{ name: "Rouge" },
	{ name: "Bleu" },
	{ name: "Vert" },
	{ name: "Jaune" },
	{ name: "Orange" },
	{ name: "Blanc" },
	{ name: "Gris" },
	{ name: "Bordeaux" }
];
var LEVELS = {
	initiation: {
		id: "initiation",
		label: "Initiation",
		detail: "4 cases · 4 couleurs · sans doublon · 8 essais",
		rule: "Chaque couleur n’apparaît qu’une fois.",
		slots: 4,
		colors: 4,
		tries: 8,
		duplicates: false
	},
	classique: {
		id: "classique",
		label: "Classique",
		detail: "4 cases · 6 couleurs · doublons · 10 essais",
		rule: "Une couleur peut revenir plusieurs fois.",
		slots: 4,
		colors: 6,
		tries: 10,
		duplicates: true
	},
	expert: {
		id: "expert",
		label: "Expert",
		detail: "5 cases · 8 couleurs · doublons · 12 essais",
		rule: "Une couleur peut revenir plusieurs fois.",
		slots: 5,
		colors: 8,
		tries: 12,
		duplicates: true
	}
};
var STATS_KEY = "casse-code-stats-v1";
var EMPTY_STATS = {
	version: 1,
	played: 0,
	won: 0,
	streak: 0,
	bestStreak: 0,
	best: {
		initiation: null,
		classique: null,
		expert: null
	}
};
function makeSecret(level, random = Math.random) {
	if (!level.duplicates && level.slots <= level.colors) {
		const pool = Array.from({ length: level.colors }, (_, i) => i);
		const secret = [];
		for (let i = 0; i < level.slots; i++) {
			const j = Math.floor(random() * pool.length);
			secret.push(pool.splice(j, 1)[0] ?? 0);
		}
		return secret;
	}
	return Array.from({ length: level.slots }, () => Math.floor(random() * level.colors));
}
/** Blacks (exact) then whites (right color, wrong place). Order of pegs is not positional. */
function scoreGuess(secret, guess) {
	if (secret.length !== guess.length || secret.length === 0) return {
		exact: 0,
		color: 0
	};
	let exact = 0;
	const secretLeft = [];
	const guessLeft = [];
	for (let i = 0; i < secret.length; i++) if (secret[i] === guess[i]) exact += 1;
	else {
		secretLeft.push(secret[i] ?? -1);
		guessLeft.push(guess[i] ?? -2);
	}
	const counts = /* @__PURE__ */ new Map();
	for (const tone of secretLeft) counts.set(tone, (counts.get(tone) ?? 0) + 1);
	let color = 0;
	for (const tone of guessLeft) {
		const left = counts.get(tone) ?? 0;
		if (left > 0) {
			color += 1;
			counts.set(tone, left - 1);
		}
	}
	return {
		exact,
		color
	};
}
function feedbackPhrase(exact, color) {
	if (exact === 0 && color === 0) return "Aucune couleur du code.";
	const bits = [];
	if (exact === 1) bits.push("1 bien placée");
	else if (exact > 1) bits.push(`${exact} bien placées`);
	if (color === 1) bits.push("1 ailleurs");
	else if (color > 1) bits.push(`${color} ailleurs`);
	return bits.join(" · ");
}
function loadStats() {
	try {
		const raw = localStorage.getItem(STATS_KEY);
		if (!raw) return EMPTY_STATS;
		const data = JSON.parse(raw);
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
				expert: numberOrNull(data.best.expert)
			}
		};
	} catch {
		return EMPTY_STATS;
	}
}
function saveStats(stats) {
	localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}
function numberOrNull(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}
var ctx = null;
function unlockAudio() {
	const Ctor = window.AudioContext || window.webkitAudioContext;
	if (!Ctor) return;
	if (!ctx) ctx = new Ctor();
	if (ctx.state === "suspended") ctx.resume();
}
function sfx(kind, muted) {
	if (muted || !ctx || ctx.state !== "running") return;
	const t = ctx.currentTime;
	if (kind === "place") tone(520 + Math.random() * 40, t, .05, "triangle", .04);
	if (kind === "bad") tone(130, t, .14, "sine", .05);
	if (kind === "score") {
		tone(330, t, .07, "sine", .04);
		tone(494, t + .06, .09, "sine", .035);
	}
	if (kind === "win") [
		523,
		659,
		784,
		1046
	].forEach((freq, i) => tone(freq, t + i * .08, .16, "triangle", .045));
	if (kind === "lose") [
		392,
		311,
		247
	].forEach((freq, i) => tone(freq, t + i * .11, .18, "sine", .045));
}
function tone(freq, when, dur, type, volume) {
	if (!ctx) return;
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.type = type;
	osc.frequency.setValueAtTime(freq, when);
	gain.gain.setValueAtTime(volume, when);
	gain.gain.exponentialRampToValueAtTime(1e-4, when + dur);
	osc.connect(gain);
	gain.connect(ctx.destination);
	osc.start(when);
	osc.stop(when + dur + .02);
}
var MUTE_KEY = "casse-code-mute";
function CasseCode() {
	const [levelId, setLevelId] = (0, import_react.useState)("classique");
	const [phase, setPhase] = (0, import_react.useState)("menu");
	const [stats, setStats] = (0, import_react.useState)(EMPTY_STATS);
	const [secret, setSecret] = (0, import_react.useState)([]);
	const [history, setHistory] = (0, import_react.useState)([]);
	const [draft, setDraft] = (0, import_react.useState)([]);
	const [focus, setFocus] = (0, import_react.useState)(0);
	const [status, setStatus] = (0, import_react.useState)("playing");
	const [note, setNote] = (0, import_react.useState)(null);
	const [help, setHelp] = (0, import_react.useState)(false);
	const [muted, setMuted] = (0, import_react.useState)(false);
	const [shaking, setShaking] = (0, import_react.useState)(false);
	const [fresh, setFresh] = (0, import_react.useState)(false);
	const [isRecord, setIsRecord] = (0, import_react.useState)(false);
	const [arm, setArm] = (0, import_react.useState)(false);
	const statsRef = (0, import_react.useRef)(stats);
	statsRef.current = stats;
	const activeRef = (0, import_react.useRef)(null);
	const closeRef = (0, import_react.useRef)(null);
	const level = LEVELS[levelId];
	(0, import_react.useEffect)(() => {
		setStats(loadStats());
		if (localStorage.getItem(MUTE_KEY) === "1") setMuted(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!fresh) return;
		const id = window.setTimeout(() => setFresh(false), 700);
		return () => window.clearTimeout(id);
	}, [fresh]);
	(0, import_react.useEffect)(() => {
		activeRef.current?.scrollIntoView({ block: "nearest" });
	}, [history.length, phase]);
	(0, import_react.useEffect)(() => {
		if (help) closeRef.current?.focus();
	}, [help]);
	function play(kind) {
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
	function begin(id) {
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
	function place(color) {
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
		if (next.some((cell) => cell == null)) for (let step = 1; step <= level.slots; step++) {
			const index = (focus + step) % level.slots;
			if (next[index] == null) {
				setFocus(index);
				break;
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
		setHistory((rows) => [...rows, {
			guess,
			exact: result.exact,
			color: result.color
		}]);
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
	function commit(won, turns) {
		const prev = statsRef.current;
		const next = {
			...prev,
			played: prev.played + 1,
			won: prev.won + (won ? 1 : 0),
			streak: won ? prev.streak + 1 : 0,
			bestStreak: won ? Math.max(prev.bestStreak, prev.streak + 1) : prev.bestStreak,
			best: { ...prev.best }
		};
		if (won) {
			const best = prev.best[levelId];
			const beaten = best == null || turns < best;
			if (beaten) next.best[levelId] = turns;
			setIsRecord(beaten);
		} else setIsRecord(false);
		statsRef.current = next;
		setStats(next);
		saveStats(next);
	}
	function shake() {
		setShaking(false);
		window.setTimeout(() => setShaking(true), 0);
		window.setTimeout(() => setShaking(false), 320);
	}
	function moveFocus(delta) {
		if (help || phase !== "play" || status !== "playing") return;
		setFocus((index) => {
			const next = index + delta;
			if (next < 0) return 0;
			if (next >= level.slots) return level.slots - 1;
			return next;
		});
	}
	const act = (0, import_react.useRef)({
		place,
		clearOne,
		submit,
		moveFocus,
		setHelp
	});
	act.current = {
		place,
		clearOne,
		submit,
		moveFocus,
		setHelp
	};
	(0, import_react.useEffect)(() => {
		function onKey(event) {
			if (event.key === "Escape") {
				act.current.setHelp(false);
				return;
			}
			const tag = event.target?.tagName;
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
			if (event.key >= "1" && event.key <= "8") act.current.place(Number(event.key) - 1);
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	const complete = draft.length > 0 && draft.every((cell) => cell != null);
	const activeIndex = status === "playing" ? history.length : -1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `shell ${phase === "menu" ? "overflow-y-auto" : "overflow-hidden"}`,
		children: [phase === "menu" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {
			levelId,
			stats,
			muted,
			onPick: setLevelId,
			onPlay: () => begin(levelId),
			onMute: toggleMute,
			onHelp: () => setHelp(true)
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex h-full min-h-0 flex-col",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex items-start justify-between gap-3 px-4 pt-4 pb-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs tracking-widest text-brass uppercase",
							children: "Mastermind"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-3xl leading-none text-ivory",
							children: "Casse-code"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-ivory-dim",
							children: [
								level.label,
								" · ",
								status === "playing" ? `essai ${history.length + 1} / ${level.tries}` : `${history.length} essai${history.length > 1 ? "s" : ""}`
							]
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "icon-btn",
							onClick: toggleMute,
							"aria-label": muted ? "Activer le son" : "Couper le son",
							children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { size: 18 })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "icon-btn",
							onClick: () => setHelp(true),
							"aria-label": "Règles",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleHelp, { size: 18 })
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `case mx-3 flex min-h-0 flex-1 flex-col ${shaking ? "is-shaking" : ""}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rack flex-1 px-2 py-2",
						children: Array.from({ length: level.tries }, (_, index) => {
							const turn = history[index];
							const active = index === activeIndex;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								ref: active ? activeRef : void 0,
								className: `row ${active ? "row-active" : ""} ${turn ? "" : active ? "" : "row-future"} ${fresh && index === history.length - 1 ? "row-fresh" : ""}`,
								"data-slots": level.slots,
								"aria-label": turn ? `Essai ${index + 1}, ${feedbackPhrase(turn.exact, turn.color)}` : active ? `Essai ${index + 1}, en cours` : `Essai ${index + 1}, à venir`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "row-idx",
										children: String(index + 1).padStart(2, "0")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "row-pegs",
										children: Array.from({ length: level.slots }, (_, slot) => {
											const tone = active ? draft[slot] : turn?.guess[slot];
											const peg = tone == null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "hole hole-lg" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Peg, {
												tone,
												size: "lg"
											});
											if (!active) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: peg }, slot);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: `slot ${focus === slot ? "is-focus" : ""}`,
												onClick: () => setFocus(slot),
												"aria-label": tone == null ? `Case ${slot + 1}, vide` : `Case ${slot + 1}, ${PEGS[tone]?.name ?? ""}`,
												children: peg
											}, slot);
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pins, {
										slots: level.slots,
										exact: turn?.exact,
										color: turn?.color,
										revealed: Boolean(turn)
									})
								]
							}, index);
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
					className: "safe-bottom shrink-0 px-4 pt-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 min-h-5 text-center text-sm text-ivory-dim",
						"aria-live": "polite",
						children: note ?? (status === "playing" ? level.rule : "")
					}), status === "playing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `grid gap-1 ${level.colors === 6 ? "grid-cols-3" : "grid-cols-4"}`,
							children: PEGS.slice(0, level.colors).map((peg, tone) => {
								const usedElsewhere = !level.duplicates && draft.includes(tone) && draft[focus] !== tone;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: `swatch ${draft[focus] === tone ? "is-on" : ""}`,
									disabled: usedElsewhere,
									onClick: () => place(tone),
									"aria-label": `${peg.name}, touche ${tone + 1}`,
									"aria-keyshortcuts": String(tone + 1),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Peg, {
										tone,
										size: "md"
									}), peg.name]
								}, peg.name);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-ghost",
								onClick: clearOne,
								children: "Effacer"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-primary flex-1",
								disabled: !complete,
								onClick: submit,
								children: "Valider"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "text-sm text-ivory-dim underline-offset-2 hover:underline",
								onClick: () => arm ? abandon() : setArm(true),
								children: arm ? "Confirmer l’abandon" : "Abandonner"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "hidden text-xs text-ivory-dim sm:block",
								children: [
									"Touches 1 à ",
									level.colors,
									" · Entrée"
								]
							})]
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Result, {
						status,
						turns: history.length,
						secret,
						isRecord,
						streak: stats.streak,
						onAgain: () => begin(levelId),
						onMenu: () => setPhase("menu")
					})]
				})
			]
		}), help ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rules, {
			onClose: () => setHelp(false),
			closeRef
		}) : null]
	});
}
function Menu({ levelId, stats, muted, onPick, onPlay, onMute, onHelp }) {
	const level = LEVELS[levelId];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "safe-bottom flex flex-col gap-5 px-4 py-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "logo mb-3",
						"aria-hidden": "true",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { "data-tone": "0" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { "data-tone": "1" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { "data-tone": "3" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { "data-tone": "4" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-widest text-brass uppercase",
						children: "Mastermind"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-5xl leading-none text-ivory",
						children: "Casse-code"
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "icon-btn",
						onClick: onMute,
						"aria-label": muted ? "Activer le son" : "Couper le son",
						children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { size: 18 })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "icon-btn",
						onClick: onHelp,
						"aria-label": "Règles",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleHelp, { size: 18 })
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-base text-ivory-dim",
				children: "Un code est caché. Chaque essai dit ce qui est juste — jamais quelle case."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "case px-3 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "row",
					"data-slots": 4,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "row-idx",
							children: "ex"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "row-pegs",
							children: [
								0,
								0,
								1,
								3
							].map((tone, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Peg, {
								tone,
								size: "lg"
							}, index))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pins, {
							slots: 4,
							exact: 1,
							color: 1,
							revealed: true
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex flex-wrap gap-x-4 gap-y-1 px-1 text-sm text-ivory-dim",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pin pin-exact" }), " Bien placée"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pin pin-color" }), " Ailleurs"]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				role: "radiogroup",
				"aria-label": "Niveau",
				className: "flex flex-col gap-2",
				children: Object.keys(LEVELS).map((id) => {
					const item = LEVELS[id];
					const best = stats.best[id];
					const on = id === levelId;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						role: "radio",
						"aria-checked": on,
						className: `level ${on ? "is-on" : ""}`,
						onClick: () => onPick(id),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-display text-xl leading-none",
								children: item.label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: item.detail }),
							best != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
								"Record : ",
								best,
								" essai",
								best > 1 ? "s" : ""
							] }) : null
						]
					}, id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-ivory-dim",
				children: level.rule
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "btn btn-primary w-full",
				onClick: onPlay,
				children: ["Jouer · ", level.label]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center text-sm text-ivory-dim",
				children: stats.played === 0 ? "Aucune partie pour l’instant." : `${stats.won} victoire${stats.won > 1 ? "s" : ""} sur ${stats.played} · série ${stats.streak}`
			})
		]
	});
}
function Result({ status, turns, secret, isRecord, streak, onAgain, onMenu }) {
	const won = status === "won";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: won ? "banner-win" : "banner-lose",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-3xl leading-none",
				"aria-live": "polite",
				children: won ? "Cassé." : "Le code tient."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-ivory-dim",
				children: [
					won ? `En ${turns} essai${turns > 1 ? "s" : ""}.` : turns === 0 ? "Aucun essai joué." : `Après ${turns} essai${turns > 1 ? "s" : ""}.`,
					won && isRecord ? " Record du niveau." : "",
					won && streak > 1 ? ` Série de ${streak}.` : ""
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm text-ivory-dim",
					children: "Code"
				}), secret.map((tone, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Peg, {
					tone,
					size: "md"
				}, index))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn btn-primary flex-1",
					onClick: onAgain,
					children: "Rejouer"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn btn-ghost",
					onClick: onMenu,
					children: "Menu"
				})]
			})
		]
	});
}
function Rules({ onClose, closeRef }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "sheet",
		role: "presentation",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sheet-card",
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "rules-title",
			onClick: (event) => event.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					id: "rules-title",
					className: "font-display text-3xl leading-none",
					children: "Comment lire le plateau"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-3 flex flex-col gap-2 text-sm text-ivory",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Un pion sombre : bonne couleur, bonne case." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Un pion clair : bonne couleur, mauvaise case." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "L’ordre de ces pions ne dit pas quelle case. Il faut déduire." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Le chiffre gravé sur chaque couleur permet de jouer sans se fier seulement à la teinte." })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					ref: closeRef,
					type: "button",
					className: "btn btn-primary mt-4 w-full",
					onClick: onClose,
					children: "Compris"
				})
			]
		})
	});
}
function Peg({ tone, size }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `peg peg-${size}`,
		"data-tone": tone,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "peg-mark",
			children: tone + 1
		})
	});
}
function Pins({ slots, exact = 0, color = 0, revealed }) {
	const kinds = [];
	if (revealed) {
		for (let i = 0; i < exact; i++) kinds.push("exact");
		for (let i = 0; i < color; i++) kinds.push("color");
	}
	while (kinds.length < slots) kinds.push("empty");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pins",
		"aria-hidden": "true",
		children: kinds.map((kind, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `pin pin-${kind}` }, index))
	});
}
function emptyDraft(slots) {
	return Array.from({ length: slots }, () => null);
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CasseCode, {});
}
//#endregion
export { Home as component };

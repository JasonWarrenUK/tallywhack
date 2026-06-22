/**
 * Single source of truth for a Tiles game. Lives in a .svelte.ts module so
 * runes work outside a component — import `game` anywhere and read its getters.
 *
 * Getter pattern: $state/$derived are exposed via get accessors so consumers
 * always read the live reactive value rather than a stale snapshot.
 */
import {
	turnTotal,
	reconcileWord,
	endgameDeltas,
	otherPlayer
} from '../scoring/tiles.js';
import type { Tile, Mode, Phase, Player, HistoryEntry } from '../scoring/types.js';
import type { PlayerId } from '$lib/modules/types.js';
import { loadGame, saveGame, INITIAL } from './persistence.js';

function createGame() {
	let players = $state<[Player, Player]>([...INITIAL.players.map((p) => ({ ...p })) as [Player, Player]]);
	let current = $state<PlayerId>(INITIAL.current);
	let mode = $state<Mode>(INITIAL.mode);
	let phase = $state<Phase>(INITIAL.phase);

	/** Tile array for the word currently being built in the editor (tiles mode). */
	let tiles = $state<Tile[]>([]);
	/** Words already banked in the current turn for multi-word plays. */
	let banked = $state<Tile[][]>([]);
	let bingo = $state(false);
	/** Index of the tile selected for premium-square / blank assignment, or null. */
	let selected = $state<number | null>(null);
	let history = $state<HistoryEntry[]>([]);

	// Rehydrate from localStorage on init (no-op on SSR).
	const saved = loadGame();
	if (saved) {
		players = saved.players;
		current = saved.current;
		mode = saved.mode;
		phase = saved.phase;
		tiles = saved.tiles;
		banked = saved.banked;
		bingo = saved.bingo;
		selected = saved.selected;
		history = saved.history;
	}

	/** Live turn total including the current word and banked words. */
	const liveTotal = $derived(turnTotal(banked, tiles, bingo));
	/** Highest single-turn score seen so far in history. */
	const highTurn = $derived.by(() => {
		let max = 0;
		for (const h of history) {
			if (h.type === 'word' && h.points > max) max = h.points;
		}
		return max;
	});

	function persist() {
		saveGame({ players, current, mode, phase, tiles, banked, bingo, selected, history });
	}

	/**
	 * Quick-mode commit: record a turn with a typed total rather than a tile breakdown.
	 * The `bingo` flag is recorded for detail counting even in quick mode.
	 */
	function quickCommit(points: number, hasBingo: boolean) {
		history = [
			...history,
			{ type: 'word', player: current, points, bingo: hasBingo, words: [] }
		];
		players = players.map((p, i) =>
			i === current ? { ...p, score: p.score + points } : p
		) as [Player, Player];
		nextPlayer();
		persist();
	}

	/** Advance to the other player. */
	function nextPlayer() {
		current = otherPlayer(current);
	}

	/** Commit the current turn as a word-scoring entry, add points, advance player. */
	function commitTurn() {
		const points = liveTotal;
		const words = [...banked, ...(tiles.length ? [tiles] : [])];
		history = [
			...history,
			{ type: 'word', player: current, points, bingo, words }
		];
		players = players.map((p, i) =>
			i === current ? { ...p, score: p.score + points } : p
		) as [Player, Player];
		banked = [];
		tiles = [];
		bingo = false;
		selected = null;
		nextPlayer();
		persist();
	}

	/**
	 * Bank the current in-progress word and clear the tile editor, keeping the
	 * running multi-word total accumulating. The caller is responsible for
	 * imperatively clearing the input's .value in the component.
	 */
	function bankWord() {
		if (!tiles.length) return;
		banked = [...banked, tiles];
		tiles = [];
		selected = null;
		persist();
	}

	/** Record a pass (0 points), advance player. */
	function recordPass(label: string) {
		history = [...history, { type: 'pass', player: current, points: 0, label }];
		nextPlayer();
		persist();
	}

	/** Record a swap (0 points), advance player. */
	function recordSwap(label: string) {
		history = [...history, { type: 'swap', player: current, points: 0, label }];
		nextPlayer();
		persist();
	}

	/**
	 * Apply end-game rack adjustments.
	 *
	 * @param leftover - Raw rack strings per player.
	 * @param out - Whether each player emptied their rack.
	 */
	function applyEndgame(leftover: [string, string], out: [boolean, boolean]) {
		const deltas = endgameDeltas({ leftover, out });
		const prevCurrent = current;
		players = players.map((p, i) =>
			({ ...p, score: p.score + deltas[i as PlayerId] })
		) as [Player, Player];
		history = [...history, { type: 'endgame', deltas, prevCurrent }];
		phase = 'finished';
		persist();
	}

	/** Undo the last history entry and reverse its effect on scores / state. */
	function undo() {
		if (!history.length) return;
		const last = history[history.length - 1];
		history = history.slice(0, -1);

		if (last.type === 'word') {
			players = players.map((p, i) =>
				i === last.player ? { ...p, score: p.score - last.points } : p
			) as [Player, Player];
			current = last.player;
		} else if (last.type === 'pass' || last.type === 'swap') {
			current = last.player;
		} else if (last.type === 'endgame') {
			players = players.map((p, i) =>
				({ ...p, score: p.score - last.deltas[i as PlayerId] })
			) as [Player, Player];
			current = last.prevCurrent;
			phase = 'endgame';
		}

		persist();
	}

	/**
	 * Pure-function half of the caret-preserving input pattern.
	 * Called on every `oninput` event; does NOT write back to the input element.
	 * The component imperatively clears/resets `input.value` after commit/bank/remove.
	 */
	function updateTiles(value: string) {
		tiles = reconcileWord(value, tiles);
		selected = null;
		persist();
	}

	/** Toggle a tile's blank flag. Preserves position. */
	function setBlank(index: number, isBlank: boolean) {
		tiles = tiles.map((t, i) => (i === index ? { ...t, isBlank } : t));
		persist();
	}

	/** Set the premium square for a tile. */
	function setSquare(index: number, square: Tile['square']) {
		tiles = tiles.map((t, i) => (i === index ? { ...t, square } : t));
		selected = null;
		persist();
	}

	/** Remove a tile at index. Returns remaining letters string for the caller to set input.value. */
	function removeTile(index: number): string {
		tiles = tiles.filter((_, i) => i !== index);
		selected = null;
		persist();
		return tiles.map((t) => t.letter).join('');
	}

	/** Discard the current in-progress word without scoring. */
	/** Select (or deselect) a tile index for premium-square / blank assignment. */
	function selectTile(index: number | null) {
		selected = index;
		persist();
	}

	function clearTiles() {
		tiles = [];
		banked = [];
		bingo = false;
		selected = null;
		persist();
	}

	/** Switch between 'tiles' and 'quick' mode. */
	function switchMode(m: Mode) {
		mode = m;
		tiles = [];
		banked = [];
		bingo = false;
		selected = null;
		persist();
	}

	/** Move to the end-game phase (rack adjustment). */
	function startEndgame() {
		phase = 'endgame';
		tiles = [];
		banked = [];
		bingo = false;
		selected = null;
		persist();
	}

	/** Reset to a fresh game, keeping player names. */
	function resetGame() {
		const savedNames = [players[0].name, players[1].name] as [string, string];
		players = [
			{ name: savedNames[0], score: 0 },
			{ name: savedNames[1], score: 0 }
		];
		current = 0;
		mode = 'tiles';
		phase = 'play';
		tiles = [];
		banked = [];
		bingo = false;
		selected = null;
		history = [];
		persist();
	}

	function setName(p: PlayerId, value: string) {
		players = players.map((pl, i) => (i === p ? { ...pl, name: value } : pl)) as [Player, Player];
		persist();
	}

	return {
		// reads
		get players() { return players; },
		get current() { return current; },
		get mode() { return mode; },
		get phase() { return phase; },
		get tiles() { return tiles; },
		get banked() { return banked; },
		get bingo() { return bingo; },
		get selected() { return selected; },
		get history() { return history; },
		get liveTotal() { return liveTotal; },
		get highTurn() { return highTurn; },

		// mutations
		setName,
		selectTile,
		quickCommit,
		commitTurn,
		bankWord,
		recordPass,
		recordSwap,
		applyEndgame,
		undo,
		updateTiles,
		setBlank,
		setSquare,
		removeTile,
		clearTiles,
		switchMode,
		startEndgame,
		resetGame,

		// bingo toggle (bound directly in the UI)
		set bingo(v: boolean) { bingo = v; persist(); }
	};
}

export const game = createGame();
export type Game = ReturnType<typeof createGame>;

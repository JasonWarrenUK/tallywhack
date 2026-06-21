/**
 * Tiles scoring engine — pure functions extracted from scrabble.html.
 *
 * No DOM, no global state, no Svelte. All functions can be imported by
 * bun:test directly.
 */
import type { PlayerId } from '$lib/modules/types.js';
import type { Tile } from './types.js';

// ---------------------------------------------------------------------------
// Letter values (English)
// ---------------------------------------------------------------------------

export const BASE: Readonly<Record<string, number>> = Object.freeze({
	E: 1, A: 1, I: 1, O: 1, N: 1, R: 1, T: 1, L: 1, S: 1, U: 1,
	D: 2, G: 2,
	B: 3, C: 3, M: 3, P: 3,
	F: 4, H: 4, V: 4, W: 4, Y: 4,
	K: 5,
	J: 8, X: 8,
	Q: 10, Z: 10
});

// ---------------------------------------------------------------------------
// Per-tile and per-word scoring
// ---------------------------------------------------------------------------

/**
 * Score value of a single tile, including the letter multiplier (DL / TL).
 * Blank tiles always score 0 regardless of the square they sit on.
 * Word multipliers are handled by wordMult, not here.
 */
export function letterVal(t: Tile): number {
	if (t.isBlank) return 0;
	const base = BASE[t.letter] ?? 0;
	if (t.square === 'DL') return base * 2;
	if (t.square === 'TL') return base * 3;
	return base;
}

/**
 * Product of all word multipliers in the tile row.
 * DW × 2, TW × 3; stacks when multiple word-multiplier tiles are in the word.
 */
export function wordMult(tiles: Tile[]): number {
	return tiles.reduce((m, t) => {
		if (t.square === 'DW') return m * 2;
		if (t.square === 'TW') return m * 3;
		return m;
	}, 1);
}

/**
 * Total score for a tile row: sum of letter values × word multiplier.
 * Returns 0 for an empty tile row.
 */
export function wordScore(tiles: Tile[]): number {
	if (!tiles.length) return 0;
	return tiles.reduce((s, t) => s + letterVal(t), 0) * wordMult(tiles);
}

/**
 * Total points for the current turn.
 *
 * @param banked - Words already banked in this turn (multi-word plays).
 * @param current - The in-progress word in the tile editor.
 * @param bingo - Whether the all-tiles +50 bonus applies.
 */
export function turnTotal(banked: Tile[][], current: Tile[], bingo: boolean): number {
	const words = banked.reduce((a, w) => a + wordScore(w), 0) + wordScore(current);
	return bingo ? words + 50 : words;
}

// ---------------------------------------------------------------------------
// Rack scoring (end-game adjustment)
// ---------------------------------------------------------------------------

/**
 * Sum of base tile values for all letters [A–Z] in a raw rack string.
 * Case-insensitive; non-letter characters are ignored; unknown letters score 0.
 */
export function rackSum(raw: string): number {
	return (raw.toUpperCase().match(/[A-Z]/g) ?? []).reduce(
		(a, c) => a + (BASE[c] ?? 0),
		0
	);
}

// ---------------------------------------------------------------------------
// Word input reconciliation
// ---------------------------------------------------------------------------

/**
 * Convert a typed word string into a tile array, preserving existing tile
 * metadata (square, blank flag) where the letter is unchanged at a given index.
 *
 * This is the pure transform half of the caret-preserving input pattern:
 * the tile row is derived from the input, but the input value itself is not
 * re-written during normal typing (only cleared imperatively on commit/remove).
 *
 * @param value - The raw string from the word input element.
 * @param prev - The current tiles array (to carry forward square/blank info).
 */
export function reconcileWord(value: string, prev: Tile[]): Tile[] {
	const letters = value.toUpperCase().match(/[A-Z]/g) ?? [];
	return letters.map((ch, i) => {
		const old = prev[i];
		// Reuse the old tile if the letter is unchanged at this position.
		return old && old.letter === ch ? old : { letter: ch, square: 'plain', isBlank: false };
	});
}

// ---------------------------------------------------------------------------
// End-game rack adjustment
// ---------------------------------------------------------------------------

export interface EndgameInput {
	/** Raw rack strings per player (e.g. 'QUIT'). */
	leftover: [string, string];
	/** Whether each player emptied their rack (went out). */
	out: [boolean, boolean];
}

/**
 * Compute per-player score deltas for the end-game rack adjustment.
 *
 * Standard Scrabble end-game rule (single-player-out variant):
 * - Each player subtracts their own unplayed tile values.
 * - If exactly one player emptied their rack (went out), they gain the
 *   total of the other player's unplayed tiles.
 * - If neither or both players are marked out, no transfer occurs.
 */
export function endgameDeltas(input: EndgameInput): [number, number] {
	const l0 = rackSum(input.leftover[0]);
	const l1 = rackSum(input.leftover[1]);
	let d0 = -l0;
	let d1 = -l1;

	// Only one player can be "out" at end-of-game; they collect the other's rack.
	if (input.out[0] && !input.out[1]) d0 += l1;
	if (input.out[1] && !input.out[0]) d1 += l0;

	// Normalise -0 → 0 (JS: -0 === 0 is true, but Object.is(-0, 0) is false).
	return [d0 || 0, d1 || 0];
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

export const otherPlayer = (p: PlayerId): PlayerId => (p === 0 ? 1 : 0);

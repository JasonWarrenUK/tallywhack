/**
 * Maps finished Tiles game state to the module contract's GameResult shape.
 *
 * Pure function — no Svelte, no side effects. 3BE.6 will call this at
 * "game finished" time to produce the result to persist remotely.
 *
 * Scrabble has no tiebreaker, so an equal final score → winner: null.
 */
import type { TilesDetail, TilesResult } from '../manifest.js';
import type { Player, HistoryEntry } from '../scoring/types.js';
import type { PlayerId } from '$lib/modules/types.js';

export interface TilesGameSnapshot {
	players: [Player, Player];
	history: HistoryEntry[];
}

export function toTilesResult(snap: TilesGameSnapshot): TilesResult {
	const [p0, p1] = snap.players;
	const s0 = p0.score;
	const s1 = p1.score;

	let winner: PlayerId | null;
	if (s0 > s1) winner = 0;
	else if (s1 > s0) winner = 1;
	else winner = null; // genuine draw — no Scrabble tiebreaker defined

	let words = 0;
	let bingos = 0;
	let highTurn = 0;

	for (const h of snap.history) {
		if (h.type === 'word') {
			words++;
			if (h.bingo) bingos++;
			if (h.points > highTurn) highTurn = h.points;
		}
	}

	return {
		winner,
		scores: { 0: s0, 1: s1 },
		names: { 0: p0.name, 1: p1.name },
		detail: {
			words,
			bingos,
			highTurn
		} satisfies TilesDetail
	};
}

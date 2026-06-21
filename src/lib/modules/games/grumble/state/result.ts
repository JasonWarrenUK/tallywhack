/**
 * Maps a completed Grumble GameRecord to the module contract's GameResult shape.
 *
 * Pure function — no Svelte, no side effects. 3BE.6 will call this at
 * "bank game" time to produce the result to persist.
 *
 * Gin Rummy cannot produce a draw (a running total always reaches the GAME_TARGET
 * before both players are exactly equal), so winner is always a PlayerId here.
 */
import type { GrumbleDetail, GrumbleResult } from '../manifest.js';
import type { GameRecord } from '../scoring/types.js';

export function toGrumbleResult(game: GameRecord): GrumbleResult {
	return {
		winner: game.winner,
		// `final` is the post-bonus total — the comparable figure for rivalry.
		scores: { 0: game.final[0], 1: game.final[1] },
		names: { 0: game.names[0], 1: game.names[1] },
		detail: {
			// `base` = pre-bonus running total; in detail so rivalry can show the breakdown.
			base: { 0: game.base[0], 1: game.base[1] },
			lines: { 0: game.lines[0], 1: game.lines[1] },
			handCount: game.handCount
		} satisfies GrumbleDetail
	};
}

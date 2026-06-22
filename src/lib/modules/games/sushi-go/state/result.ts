/**
 * Maps a completed Sushi Go! game to the module contract's GameResult shape.
 *
 * The engine's scoreGame() already returns the correct shape including winner
 * (with pudding tiebreaker applied) and the detail blob. This mapper adds
 * player names and ensures the output is a fully-typed SushiGoResult.
 *
 * Pure function — no Svelte, no side effects.
 */
import type { SushiGoResult } from '../scoring/types.js';
import type { RoundInput } from '../scoring/types.js';
import type { PlayerId } from '$lib/modules/types.js';
import { scoreGame } from '../scoring/engine.js';

export interface SushiGoGameSnapshot {
	rounds: [RoundInput, RoundInput, RoundInput];
	names: Record<PlayerId, string>;
}

export function toSushiGoResult(snap: SushiGoGameSnapshot): SushiGoResult {
	const engineResult = scoreGame(snap.rounds);
	return {
		winner: engineResult.winner,
		scores: engineResult.scores,
		names: { ...snap.names },
		detail: engineResult.detail
	};
}

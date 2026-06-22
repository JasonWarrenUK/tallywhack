/**
 * Sushi Go! pure scoring engine.
 *
 * All functions are pure — no DOM, no Svelte, no global state.
 * Import freely in bun:test.
 */
import type { PlayerId } from '$lib/modules/types.js';
import type { SushiGoDetail, SushiGoResult, RoundInput, RoundScore, CategoryBreakdown, NigiriInput } from './types.js';
import {
	NIGIRI_VALUE,
	TEMPURA_PAIR,
	SASHIMI_TRIPLE,
	MAKI_MOST,
	MAKI_SECOND,
	PUDDING_MOST,
	PUDDING_LEAST,
	dumplingScore
} from './cards.js';

// ---------------------------------------------------------------------------
// Per-category scorers
// ---------------------------------------------------------------------------

/**
 * Maki roll scoring for 2 players.
 *
 * - a > b → [6, 3]
 * - a === b > 0 → [3, 3]  (split the 6-point "most" prize)
 * - a > 0, b === 0 → [6, 0]
 * - 0, 0 → [0, 0]
 *
 * Returns [points for player 0, points for player 1].
 */
export function scoreMaki(a: number, b: number): [number, number] {
	if (a === 0 && b === 0) return [0, 0];
	if (a === b) return [MAKI_MOST / 2, MAKI_MOST / 2] as [number, number]; // [3, 3]
	if (a > b) return [MAKI_MOST, b > 0 ? MAKI_SECOND : 0];
	return [a > 0 ? MAKI_SECOND : 0, MAKI_MOST];
}

/** Points for a player's tempura cards. Each complete pair scores TEMPURA_PAIR. */
export function scoreTempura(count: number): number {
	return Math.floor(count / 2) * TEMPURA_PAIR;
}

/** Points for a player's sashimi cards. Each complete set of 3 scores SASHIMI_TRIPLE. */
export function scoreSashimi(count: number): number {
	return Math.floor(count / 3) * SASHIMI_TRIPLE;
}

/** Points for a player's dumpling cards (triangular table, capped at 5). */
export function scoreDumpling(count: number): number {
	return dumplingScore(count);
}

/**
 * Points for a player's nigiri cards.
 *
 * Plain nigiri scores face value. Wasabi nigiri (eating nigiri on a wasabi card)
 * scores ×3. Unused wasabi cards score 0.
 */
export function scoreNigiri(input: NigiriInput): number {
	let total = 0;
	for (const kind of ['egg', 'salmon', 'squid'] as const) {
		total += input.plain[kind] * NIGIRI_VALUE[kind];
		total += input.wasabi[kind] * NIGIRI_VALUE[kind] * 3;
	}
	return total;
}

// ---------------------------------------------------------------------------
// Round scorer
// ---------------------------------------------------------------------------

export function scoreRound(input: RoundInput): RoundScore {
	const [maki0, maki1] = scoreMaki(
		input.players[0].maki,
		input.players[1].maki
	);

	const breakdown: Record<PlayerId, CategoryBreakdown> = {
		0: {
			maki: maki0,
			tempura: scoreTempura(input.players[0].tempura),
			sashimi: scoreSashimi(input.players[0].sashimi),
			dumpling: scoreDumpling(input.players[0].dumpling),
			nigiri: scoreNigiri(input.players[0].nigiri),
			roundTotal: 0
		},
		1: {
			maki: maki1,
			tempura: scoreTempura(input.players[1].tempura),
			sashimi: scoreSashimi(input.players[1].sashimi),
			dumpling: scoreDumpling(input.players[1].dumpling),
			nigiri: scoreNigiri(input.players[1].nigiri),
			roundTotal: 0
		}
	};

	// Fill roundTotal after all per-category fields are set.
	for (const p of [0, 1] as PlayerId[]) {
		const b = breakdown[p];
		b.roundTotal = b.maki + b.tempura + b.sashimi + b.dumpling + b.nigiri;
	}

	return { breakdown };
}

// ---------------------------------------------------------------------------
// Pudding scorer (end-of-game only)
// ---------------------------------------------------------------------------

/**
 * Award pudding points at the end of three rounds.
 *
 * - Most puddings: +PUDDING_MOST
 * - Fewest puddings: −PUDDING_LEAST
 * - Tied totals (both equal) → [0, 0] (most and least cancel)
 */
export function scorePudding(total: Record<PlayerId, number>): Record<PlayerId, number> {
	const t0 = total[0];
	const t1 = total[1];

	if (t0 === t1) return { 0: 0, 1: 0 };
	if (t0 > t1) return { 0: PUDDING_MOST, 1: -PUDDING_LEAST };
	return { 0: -PUDDING_LEAST, 1: PUDDING_MOST };
}

// ---------------------------------------------------------------------------
// Full game scorer
// ---------------------------------------------------------------------------

/**
 * Score a complete 3-round Sushi Go! game.
 *
 * `scores[p]` = sum of round subtotals + pudding points.
 *
 * Tiebreaker: if scores are equal, the player with more total pudding wins.
 * If pudding is also equal → winner: null (genuine draw).
 */
export function scoreGame(
	rounds: [RoundInput, RoundInput, RoundInput]
): Omit<SushiGoResult, 'names'> & { detail: SushiGoDetail } {
	const roundScores = rounds.map(scoreRound) as [RoundScore, RoundScore, RoundScore];

	const puddingTotals: Record<PlayerId, number> = { 0: 0, 1: 0 };
	const roundSubtotals: Record<PlayerId, number>[] = [];

	for (let r = 0; r < 3; r++) {
		const sub: Record<PlayerId, number> = { 0: 0, 1: 0 };
		for (const p of [0, 1] as PlayerId[]) {
			sub[p] = roundScores[r].breakdown[p].roundTotal;
			puddingTotals[p] += rounds[r].players[p].pudding;
		}
		roundSubtotals.push(sub);
	}

	const puddingPoints = scorePudding(puddingTotals);

	const finalScores: Record<PlayerId, number> = {
		0: roundSubtotals.reduce((a, s) => a + s[0], 0) + puddingPoints[0],
		1: roundSubtotals.reduce((a, s) => a + s[1], 0) + puddingPoints[1]
	};

	let winner: PlayerId | null;
	if (finalScores[0] > finalScores[1]) {
		winner = 0;
	} else if (finalScores[1] > finalScores[0]) {
		winner = 1;
	} else {
		// Tied on final score — apply pudding tiebreaker.
		if (puddingTotals[0] > puddingTotals[1]) winner = 0;
		else if (puddingTotals[1] > puddingTotals[0]) winner = 1;
		else winner = null; // genuine draw
	}

	return {
		winner,
		scores: finalScores,
		detail: {
			rounds: roundScores,
			puddingTotals,
			puddingPoints,
			roundSubtotals
		}
	};
}

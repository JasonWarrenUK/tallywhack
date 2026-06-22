/**
 * Sushi Go! card constants.
 *
 * Two-player variant; only the cards present in the standard 55-card deck are
 * scored here. Chopsticks are not scored (out of scope — noted in HelpPanel).
 */

// ---------------------------------------------------------------------------
// Nigiri
// ---------------------------------------------------------------------------

export type NigiriKind = 'egg' | 'salmon' | 'squid';

export const NIGIRI_VALUE = {
	egg: 1,
	salmon: 2,
	squid: 3
} as const satisfies Record<NigiriKind, number>;

// ---------------------------------------------------------------------------
// Dumpling — triangular number table; index by count, capped at 5+
// ---------------------------------------------------------------------------

/** Points per dumpling count (index = count, max 5). 6+ → 15. */
export const DUMPLING_SCORE = [0, 1, 3, 6, 10, 15] as const;

export function dumplingScore(count: number): number {
	if (count <= 0) return 0;
	const idx = Math.min(count, DUMPLING_SCORE.length - 1);
	return DUMPLING_SCORE[idx];
}

// ---------------------------------------------------------------------------
// Tempura and Sashimi
// ---------------------------------------------------------------------------

/** Points for each complete pair of tempura cards. */
export const TEMPURA_PAIR = 5;

/** Points for each complete set of three sashimi cards. */
export const SASHIMI_TRIPLE = 10;

// ---------------------------------------------------------------------------
// Maki rolls (2-player)
// ---------------------------------------------------------------------------

/** Points for the player with the most maki icons. */
export const MAKI_MOST = 6;
/** Points for the player with the second-most maki icons. */
export const MAKI_SECOND = 3;

// ---------------------------------------------------------------------------
// Pudding (end-of-game)
// ---------------------------------------------------------------------------

/** Points gained by the player with the most puddings over three rounds. */
export const PUDDING_MOST = 6;
/** Points lost by the player with the fewest puddings over three rounds. */
export const PUDDING_LEAST = 6;

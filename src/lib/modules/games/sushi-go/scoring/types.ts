import type { PlayerId, GameResult } from '$lib/modules/types.js';
import type { NigiriKind } from './cards.js';

// ---------------------------------------------------------------------------
// Round input
// ---------------------------------------------------------------------------

export interface NigiriInput {
	plain: Record<NigiriKind, number>;
	/** Nigiri eaten with a wasabi card — each scores ×3. */
	wasabi: Record<NigiriKind, number>;
	/** Unused wasabi cards (0 points; tracked for completeness). */
	unusedWasabi: number;
}

export interface PlayerRoundInput {
	maki: number;
	tempura: number;
	sashimi: number;
	dumpling: number;
	nigiri: NigiriInput;
	/** Pudding cards collected this round (carry over; scored at end of game). */
	pudding: number;
}

export interface RoundInput {
	players: Record<PlayerId, PlayerRoundInput>;
}

// ---------------------------------------------------------------------------
// Score breakdown
// ---------------------------------------------------------------------------

export interface CategoryBreakdown {
	maki: number;
	tempura: number;
	sashimi: number;
	dumpling: number;
	nigiri: number;
	/** Sum of the above; does NOT include pudding (scored at game-end). */
	roundTotal: number;
}

export interface RoundScore {
	breakdown: Record<PlayerId, CategoryBreakdown>;
}

// ---------------------------------------------------------------------------
// Game-level detail (carried into GameResult<SushiGoDetail>)
// ---------------------------------------------------------------------------

export interface SushiGoDetail {
	/** Per-round breakdowns (length 3). */
	rounds: RoundScore[];
	/** Total pudding cards collected per player across all 3 rounds. */
	puddingTotals: Record<PlayerId, number>;
	/** Points awarded / deducted from pudding at game-end. */
	puddingPoints: Record<PlayerId, number>;
	/** Per-round score subtotals (excludes pudding) per player. */
	roundSubtotals: Record<PlayerId, number>[];
}

export type SushiGoResult = GameResult<SushiGoDetail>;

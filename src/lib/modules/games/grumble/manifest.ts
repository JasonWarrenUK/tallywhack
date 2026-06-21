/**
 * Grumble — Gin Rummy scorer module manifest.
 *
 * This is the first concrete consumer of the module contract (1FN.2).
 * Clone this file as the starting template when porting each new module.
 *
 * Note: GrumbleDetail is declared here locally; the full scoring logic
 * lives in source-apps/games/grumble/ and will be ported in 2MOD.1.
 */
import { defineManifest, type GameResult, type PlayerId } from '$lib/modules';

// ---------------------------------------------------------------------------
// Grumble-specific result detail
// Distilled from source-apps/games/grumble/src/lib/scoring/types.ts (GameRecord).
// ---------------------------------------------------------------------------

/**
 * Gin Rummy scoring breakdown per completed game.
 * The stable core (winner, scores, names) lives in GameResultCore;
 * these are the Grumble-specific fields that don't generalise.
 */
export interface GrumbleDetail {
	/** Base points per player (before line bonuses). */
	base: Record<PlayerId, number>;
	/** Line bonus points per player. */
	lines: Record<PlayerId, number>;
	/** Number of hands played in this game. */
	handCount: number;
}

export type GrumbleResult = GameResult<GrumbleDetail>;

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

export default defineManifest<GrumbleResult>({
	id: 'grumble',
	name: 'Grumble',
	category: 'games',
	icon: '🃏',
	routes: ['/games/grumble'],
	theme: 'emerald',
	resultsKind: 'game:gin-rummy'
});

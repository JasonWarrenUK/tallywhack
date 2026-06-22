/**
 * Tiles — Scrabble scorer module manifest.
 *
 * Ported from source-apps/games/scrabble/scrabble.html (2MOD.2).
 * Theme: green.
 */
import { defineManifest, type GameResult } from '$lib/modules';

// ---------------------------------------------------------------------------
// Tiles-specific result detail
// ---------------------------------------------------------------------------

export interface TilesDetail {
	/** Total number of word-scoring turns across both players. */
	words: number;
	/** Total number of bingos (all-tiles +50 bonus) across both players. */
	bingos: number;
	/** Highest single-turn score achieved in the game. */
	highTurn: number;
}

export type TilesResult = GameResult<TilesDetail>;

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

export default defineManifest<TilesResult>({
	id: 'tiles',
	name: 'Tiles',
	category: 'games',
	icon: '🔠',
	routes: ['/games/tiles'],
	theme: 'green',
	resultsKind: 'game:scrabble'
});

/**
 * Tiles persistence — wraps the shared createLocalStore helper.
 *
 * Saves the full game state to localStorage under key 'tiles:game'.
 * The migrate function rebuilds a TilesState skeleton so any newly-
 * added fields get sane defaults after a schema bump.
 */
import { createLocalStore } from '$lib/persistence/local.js';
import type { TilesState } from '../scoring/types.js';

const INITIAL: TilesState = {
	players: [
		{ name: 'Player 1', score: 0 },
		{ name: 'Player 2', score: 0 }
	],
	current: 0,
	mode: 'tiles',
	phase: 'play',
	tiles: [],
	banked: [],
	bingo: false,
	selected: null,
	history: []
};

const store = createLocalStore<TilesState>({
	key: 'tiles:game',
	version: 1,
	migrate(raw) {
		const r = raw as Partial<TilesState>;
		if (!r.players) return null;
		// Merge over INITIAL so any newly-added top-level keys get defaults.
		return { ...INITIAL, ...r };
	}
});

export const loadGame = () => store.load();
export const saveGame = (state: TilesState) => store.save(state);
export const clearGame = () => store.clear();
export { INITIAL };

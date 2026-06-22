/**
 * Reckoner session persistence.
 *
 * Wraps `createLocalStore` to persist the full reckoner session so that a
 * mid-rating session survives a page reload. Thin wrappers follow the
 * tiles/grumble/sushi-go pattern exactly.
 *
 * Key: 'reckoner:session'  Version: 1
 */

import { createLocalStore } from '$lib/persistence/local.js';
import type { ReckonerState } from '../ranking/types.js';

export const INITIAL: ReckonerState = {
	phase: 'setup',
	activityName: '',
	participants: [
		{ id: 'p0', name: '' },
		{ id: 'p1', name: '' }
	],
	categories: [
		{ id: 'cat-default', label: '' }
	],
	entries: [],
	ratings: {},
	currentRaterIndex: 0,
	cardOrder: [],
	cardIndex: 0
};

const store = createLocalStore<ReckonerState>({
	key: 'reckoner:session',
	version: 1,
	migrate(raw) {
		const r = raw as Partial<ReckonerState>;
		// Require the essential structural fields to be present.
		if (!r.participants || !r.categories || !r.entries) return null;
		// Spread over INITIAL so any newly-added top-level keys get defaults.
		return { ...INITIAL, ...r };
	}
});

export const loadSession  = (): ReckonerState | null => store.load();
export const saveSession  = (state: ReckonerState): void => store.save(state);
export const clearSession = (): void => store.clear();

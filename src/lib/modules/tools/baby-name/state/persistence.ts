/**
 * Baby Name Chooser session persistence.
 *
 * Persists both persons' in-progress profiles + the shared shortlist so the
 * async two-person flow survives page reloads and hand-offs between sessions.
 *
 * Key: 'baby-name:session'  Version: 1
 *
 * Note: `BabyNameState.rejectedNames` is a Set, which does not serialise via
 * JSON.stringify. The migrate function converts the raw array back to a Set.
 */

import { createLocalStore } from '$lib/persistence/local.js';
import type { BabyNameState, InProgressProfile } from '../naming/types.js';
import { PREFERENCE_DEFAULTS } from '../naming/types.js';

const EMPTY_PROFILE: InProgressProfile = {
	person: '',
	preferences: { ...PREFERENCE_DEFAULTS },
	exampleNames: [],
	ratings: {},
	currentIndex: 0
};

export const INITIAL: BabyNameState = {
	step: 'intro',
	profileA: { ...EMPTY_PROFILE },
	profileB: { ...EMPTY_PROFILE },
	combined: null,
	shortlist: [],
	finalNames: [],
	rejectedNames: new Set(),
	error: null
};

/** The stored shape — rejectedNames serialised as an array for JSON compat. */
interface StoredState extends Omit<BabyNameState, 'rejectedNames'> {
	rejectedNames: string[];
}

const store = createLocalStore<BabyNameState>({
	key: 'baby-name:session',
	version: 1,
	migrate(raw) {
		const r = raw as Partial<StoredState>;
		if (!r.step || !r.profileA || !r.profileB) return null;
		return {
			...INITIAL,
			...r,
			// Deserialise the array back to a Set.
			rejectedNames: new Set(Array.isArray(r.rejectedNames) ? r.rejectedNames : [])
		};
	}
});

/** Serialises Set to array before saving. */
function serialise(state: BabyNameState): StoredState {
	return {
		...state,
		rejectedNames: [...state.rejectedNames]
	};
}

export const loadSession  = (): BabyNameState | null => store.load();
export const saveSession  = (state: BabyNameState): void =>
	store.save(serialise(state) as unknown as BabyNameState);
export const clearSession = (): void => store.clear();

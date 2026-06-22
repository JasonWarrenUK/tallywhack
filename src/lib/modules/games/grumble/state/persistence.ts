/**
 * Grumble persistence — wraps the shared createLocalStore helper.
 *
 * The `migrate` function merges saved rules over DEFAULT_RULES so any newly-
 * added rule key gets a sane default rather than being undefined.
 */
import { createLocalStore } from '$lib/persistence/local.js';
import { DEFAULT_RULES, type PresetId, type Rules } from '../scoring/rules.js';
import type { GameRecord, Hand, PlayerId } from '../scoring/types.js';

export interface PersistedMatch {
	names: Record<PlayerId, string>;
	hands: Hand[];
	games: GameRecord[];
	rules: Rules;
	presetId: PresetId;
}

const store = createLocalStore<PersistedMatch>({
	key: 'grumble:match',
	version: 1,
	migrate(raw) {
		const r = raw as Partial<PersistedMatch>;
		if (!r.names) return null;
		return {
			names: r.names,
			hands: r.hands ?? [],
			games: r.games ?? [],
			// Defensively merge: newly-added rule keys get DEFAULT_RULES values.
			rules: { ...DEFAULT_RULES, ...(r.rules ?? {}) },
			presetId: r.presetId ?? 'standard'
		};
	}
});

export const loadMatch = () => store.load();
export const saveMatch = (state: PersistedMatch) => store.save(state);
export const clearMatch = () => store.clear();

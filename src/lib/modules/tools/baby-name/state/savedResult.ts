/**
 * Persists the locked-in Baby Name result to localStorage.
 *
 * Once the couple has chosen their shortlist and "locked in" their final
 * selection, the result is written here. It survives page reloads and is
 * read back when the flow lands on the 'done' confirmation step.
 *
 * Key: 'baby-name:result'  Version: 1
 *
 * 3BE.6 will supersede this with remote Supabase persistence. This local
 * store is the interim solution so the feature works without auth.
 */

import { createLocalStore } from '$lib/persistence/local.js';
import type { BabyNameResult } from '../manifest.js';

const store = createLocalStore<BabyNameResult>({
	key: 'baby-name:result',
	version: 1,
	migrate(raw) {
		const r = raw as Partial<BabyNameResult>;
		if (r.kind !== 'selection' || !r.payload) return null;
		return r as BabyNameResult;
	}
});

export const loadSavedResult  = (): BabyNameResult | null => store.load();
export const saveSavedResult  = (result: BabyNameResult): void => store.save(result);
export const clearSavedResult = (): void => store.clear();

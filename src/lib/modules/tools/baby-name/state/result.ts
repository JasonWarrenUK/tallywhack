/**
 * Maps a completed Baby Name session to the module contract's ToolOutput shape.
 *
 * Pure function — no Svelte, no side effects. 3BE.6 will call this at
 * "session finished" time to produce the result to persist remotely.
 */

import type { BabyNameResult } from '../manifest.js';
import type { CombinedProfile, NameSuggestion, TasteProfile } from '../naming/types.js';

export interface BabyNameSnapshot {
	shortlist: NameSuggestion[];
	profileA:  TasteProfile;
	profileB:  TasteProfile;
	combined:  CombinedProfile;
}

export function toBabyNameResult(snap: BabyNameSnapshot): BabyNameResult {
	return {
		kind: 'selection',
		payload: {
			shortlist: snap.shortlist,
			profileA:  snap.profileA,
			profileB:  snap.profileB,
			combined:  snap.combined
		}
	};
}

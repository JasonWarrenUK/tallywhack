/**
 * Baby Name Chooser — tool module manifest.
 *
 * Ported from source-apps/tools/baby-name-chooser/baby-name-chooser.jsx (2MOD.5).
 * Extended to a two-person async model with individual + combined taste profiles.
 * Theme: indigo (matches source primary accent #4F46E5).
 */

import { defineManifest, type ToolOutput } from '$lib/modules';
import type { CombinedProfile, NameSuggestion, TasteProfile } from './naming/types.js';

// ---------------------------------------------------------------------------
// Baby Name Chooser-specific result payload
// ---------------------------------------------------------------------------

export interface BabyNamePayload {
	/** Names on the final shared shortlist. */
	shortlist: NameSuggestion[];
	/** Person A's individual taste profile. */
	profileA: TasteProfile;
	/** Person B's individual taste profile. */
	profileB: TasteProfile;
	/** Combined / consensus profile derived from both. */
	combined: CombinedProfile;
}

export type BabyNameResult = ToolOutput<BabyNamePayload>;

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

export default defineManifest<BabyNameResult>({
	id: 'baby-name',
	name: 'Baby Name Chooser',
	category: 'tools',
	icon: '👶',
	routes: ['/tools/baby-name'],
	theme: 'indigo',
	resultsKind: 'tool:selection'
});

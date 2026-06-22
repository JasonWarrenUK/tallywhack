/**
 * Reckoner — group ranking/decision tool module manifest.
 *
 * Ported from source-apps/tools/reckoner/reckoner.jsx (2MOD.4).
 * Theme: violet (matches source accent #7E6B91).
 */

import { defineManifest, type ToolOutput } from '$lib/modules';
import type { RankedEntry } from './ranking/types.js';

// ---------------------------------------------------------------------------
// Reckoner-specific result payload
// ---------------------------------------------------------------------------

export interface ReckonerPayload {
	activityName: string;
	/** Display names of all participants, in participant order. */
	participants: string[];
	/** Full consensus-ranked list; see RankedEntry for field docs. */
	ranking: RankedEntry[];
}

export type ReckonerResult = ToolOutput<ReckonerPayload>;

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

export default defineManifest<ReckonerResult>({
	id: 'reckoner',
	name: 'Reckoner',
	category: 'tools',
	icon: '⚖️',
	routes: ['/tools/reckoner'],
	theme: 'violet',
	resultsKind: 'tool:ranking'
});

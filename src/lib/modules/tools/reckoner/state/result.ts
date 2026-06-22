/**
 * Maps a finished Reckoner session to the module contract's ToolOutput shape.
 *
 * Pure function — no Svelte, no side effects. 3BE.6 will call this at
 * "session finished" time to produce the result to persist remotely.
 */

import type { ReckonerResult } from '../manifest.js';
import type { ReckonerState } from '../ranking/types.js';
import { computeRanking } from '../ranking/reckon.js';

export interface ReckonerSnapshot {
	activityName: string;
	participants: ReckonerState['participants'];
	entries: ReckonerState['entries'];
	ratings: ReckonerState['ratings'];
}

export function toReckonerResult(snap: ReckonerSnapshot): ReckonerResult {
	const ranking = computeRanking(snap.participants, snap.entries, snap.ratings);

	return {
		kind: 'ranking',
		payload: {
			activityName: snap.activityName,
			participants: snap.participants.map((p) => p.name),
			ranking
		}
	};
}

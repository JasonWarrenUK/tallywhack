/**
 * Browser-side fetch wrappers for the Baby Name server route.
 *
 * All Claude API calls go through `/tools/baby-name/api` — the key never
 * reaches the browser. These wrappers validate the response shape before
 * returning so the caller gets typed data or throws with a meaningful message.
 */

import type { CombinedProfile, NameSuggestion, Preferences, TasteProfile } from './types.js';

const ROUTE = '/tools/baby-name/api';

// ---------------------------------------------------------------------------
// Request bodies (must match server route's Zod schemas)
// ---------------------------------------------------------------------------

export interface ExamplesRequest {
	intent: 'examples';
	preferences: Preferences;
}

export interface FinalNamesRequest {
	intent: 'final';
	profileA: TasteProfile;
	profileB: TasteProfile;
	combined: CombinedProfile;
	countNeeded: number;
	/** Names to exclude from the result (previously seen / rejected). */
	exclusions: string[];
	/** Names already on the shortlist (passed back in to the payload). */
	keptNames: NameSuggestion[];
}

type ApiRequest = ExamplesRequest | FinalNamesRequest;

// ---------------------------------------------------------------------------
// Shared fetch helper
// ---------------------------------------------------------------------------

async function callApi(body: ApiRequest): Promise<NameSuggestion[]> {
	const response = await fetch(ROUTE, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});

	if (!response.ok) {
		let message = `Server error ${response.status}`;
		try {
			const data = (await response.json()) as { error?: string };
			if (data.error) message = data.error;
		} catch {
			// Ignore parse error — use the status message.
		}
		throw new Error(message);
	}

	const data = (await response.json()) as { names?: unknown };
	if (!Array.isArray(data.names)) {
		throw new Error('Unexpected response shape from server');
	}

	return data.names as NameSuggestion[];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch 20 diverse example names for taste-refinement swiping.
 * These names do NOT include a `meaning` field.
 */
export async function requestExamples(preferences: Preferences): Promise<NameSuggestion[]> {
	return callApi({ intent: 'examples', preferences });
}

/**
 * Fetch final name suggestions based on both persons' full taste profiles and
 * the combined consensus profile.
 *
 * @param keptNames   Names already on the shortlist (preserved in the result).
 * @param countNeeded How many new names to generate.
 * @param profileA    Person A's complete taste profile.
 * @param profileB    Person B's complete taste profile.
 * @param combined    The aggregated combined profile.
 * @param exclusions  Names to exclude (rejected + already seen).
 */
export async function requestFinalNames(opts: {
	keptNames:   NameSuggestion[];
	countNeeded: number;
	profileA:    TasteProfile;
	profileB:    TasteProfile;
	combined:    CombinedProfile;
	exclusions:  string[];
}): Promise<NameSuggestion[]> {
	return callApi({
		intent:      'final',
		profileA:    opts.profileA,
		profileB:    opts.profileB,
		combined:    opts.combined,
		countNeeded: opts.countNeeded,
		exclusions:  opts.exclusions,
		keptNames:   opts.keptNames
	});
}

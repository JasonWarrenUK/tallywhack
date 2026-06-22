/**
 * Profile combination logic for the Baby Name Chooser.
 *
 * Pure functions — no Svelte, no side effects. Safe to unit-test under
 * `bun test` without a Vite context.
 *
 * Aggregation rules (Reckoner-style consensus):
 *   - Preferences: union of both selections; uniqueness = average of both scores.
 *   - Strong likes: liked by BOTH.
 *   - Soft likes: liked by exactly ONE.
 *   - Strong dislikes: disliked by BOTH.
 *   - Soft dislikes: disliked by exactly ONE.
 *   - Exclusions: disliked by EITHER (strong + soft dislikes).
 *   - Names liked by one and disliked by the other are placed only in
 *     softDislikes (the dislike outweighs the like — veto principle).
 */

import type { CombinedProfile, Preferences, TasteProfile } from './types.js';

// ---------------------------------------------------------------------------
// Preference union
// ---------------------------------------------------------------------------

/**
 * Merge two Preferences into a combined set.
 * Selections from both people are unioned; uniqueness is averaged.
 */
export function mergePreferences(a: Preferences, b: Preferences): Preferences {
	return {
		genders:    union(a.genders, b.genders),
		themes:     union(a.themes, b.themes),
		cultures:   union(a.cultures, b.cultures),
		uniqueness: Math.round((a.uniqueness + b.uniqueness) / 2)
	};
}

function union(a: string[], b: string[]): string[] {
	return [...new Set([...a, ...b])];
}

/**
 * True when both arrays are non-empty and share no common elements.
 * Used to detect "disjoint" preference dimensions so the API prompt can
 * switch from "MUST be X OR Y" wording to a "blend both styles" instruction.
 */
function disjoint(a: string[], b: string[]): boolean {
	if (a.length === 0 || b.length === 0) return false;
	return !a.some((x) => b.includes(x));
}

// ---------------------------------------------------------------------------
// Taste aggregation
// ---------------------------------------------------------------------------

/**
 * Combine two TasteProfiles into a CombinedProfile for the final Claude call.
 *
 * Either profile may have empty `liked`/`disliked` arrays if the person
 * gave all neutral ratings; the function handles this gracefully.
 */
export function combineProfiles(a: TasteProfile, b: TasteProfile): CombinedProfile {
	const setA = { liked: new Set(a.liked), disliked: new Set(a.disliked) };
	const setB = { liked: new Set(b.liked), disliked: new Set(b.disliked) };

	const allNames = new Set([
		...a.liked, ...a.disliked,
		...b.liked, ...b.disliked
	]);

	const strongLikes:    string[] = [];
	const softLikes:      string[] = [];
	const strongDislikes: string[] = [];
	const softDislikes:   string[] = [];

	for (const name of allNames) {
		const aLiked    = setA.liked.has(name);
		const bLiked    = setB.liked.has(name);
		const aDisliked = setA.disliked.has(name);
		const bDisliked = setB.disliked.has(name);

		if (aLiked && bLiked) {
			strongLikes.push(name);
		} else if (aDisliked && bDisliked) {
			strongDislikes.push(name);
		} else if (aDisliked || bDisliked) {
			// Disliked by one — veto principle: dislike outweighs a neutral or like.
			softDislikes.push(name);
		} else if (aLiked || bLiked) {
			// Liked by exactly one, not disliked by the other.
			softLikes.push(name);
		}
	}

	const exclusions = [...strongDislikes, ...softDislikes];

	// Detect disjoint preference dimensions to trigger blend instructions in the prompt.
	const themesDisjoint   = disjoint(a.preferences.themes,   b.preferences.themes);
	const culturesDisjoint = disjoint(a.preferences.cultures, b.preferences.cultures);

	return {
		preferences:   mergePreferences(a.preferences, b.preferences),
		strongLikes,
		softLikes,
		strongDislikes,
		softDislikes,
		exclusions,
		themesDisjoint,
		culturesDisjoint
	};
}

// ---------------------------------------------------------------------------
// Helpers (exported for testing)
// ---------------------------------------------------------------------------

/** Build a TasteProfile from an InProgressProfile once swiping is complete. */
export function buildTasteProfile(opts: {
	person: string;
	preferences: Preferences;
	ratings: Record<string, string>;
}): TasteProfile {
	const liked:    string[] = [];
	const disliked: string[] = [];

	for (const [name, rating] of Object.entries(opts.ratings)) {
		if (rating === 'like')    liked.push(name);
		if (rating === 'dislike') disliked.push(name);
	}

	return {
		person:      opts.person,
		preferences: opts.preferences,
		ratings:     opts.ratings as Record<string, import('./types.js').Rating>,
		liked,
		disliked
	};
}

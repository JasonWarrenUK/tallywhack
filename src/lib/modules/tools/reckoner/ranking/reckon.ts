/**
 * Pure ranking algorithm functions for Reckoner.
 *
 * No Svelte, no side effects, no imports from $app/*. Safe to unit-test
 * directly under `bun test` without a Vite context.
 */

import type { Category, Entry, Participant, Ratings, RankedEntry, Tier } from './types.js';

// ---------------------------------------------------------------------------
// Tier caps
// ---------------------------------------------------------------------------

/**
 * Maximum number of entries a rater can place in a given tier for a category
 * of `categorySize` entries.
 *
 * Ported verbatim from the source app's `tierCap()`:
 *   - Tier 0 ("Love it"): ≈22% of category size, min 1
 *   - Tier 1 ("Strong yes"): ≈28% of category size, min 1
 *   - Tiers 2-4: uncapped (= categorySize)
 *
 * Caps are computed per category, not globally.
 */
export function tierCap(categorySize: number, tierId: Tier): number {
	if (categorySize <= 0) return 0;
	if (tierId === 0) return Math.max(1, Math.round(categorySize * 0.22));
	if (tierId === 1) return Math.max(1, Math.round(categorySize * 0.28));
	return categorySize;
}

/**
 * Count how many entries the current rater has already placed in each tier
 * for a specific category.
 *
 * Returns a Record<Tier, number> counting tier assignments for `categoryId`
 * entries only. Uses the entry's stable `categoryId` (not an array index),
 * fixing the source app's misfiling bug.
 */
export function tierCountsForCat(
	participantRatings: Record<string, Tier>,
	entries: Entry[],
	categoryId: string | null
): Record<Tier, number> {
	const counts: Record<Tier, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };

	const sameCatIds = new Set(
		entries
			.filter((e) => e.categoryId === categoryId)
			.map((e) => e.id)
	);

	for (const [entryId, tier] of Object.entries(participantRatings)) {
		if (sameCatIds.has(entryId)) {
			counts[tier as Tier]++;
		}
	}

	return counts;
}

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

/**
 * Compute the consensus group ranking from the full ratings matrix.
 *
 * Algorithm (consensus floor):
 *   For each entry, collect all participants' scores (defaulting to 4 =
 *   "Not this one" for any participant who did not rate the entry).
 *   - `worst` = max score across all participants (implicit veto: the least
 *     favourable rating drives primary sort).
 *   - `sum` = sum of all scores (tie-break: lower total = broader appeal).
 *   Sort ascending by (worst, sum). Lower is better.
 *
 * Result grouping uses entry.categoryId (stable) — never by `activeCats`
 * array index — so blank-named or reordered categories never misfile entries.
 */
export function computeRanking(
	participants: Participant[],
	entries: Entry[],
	ratings: Ratings
): RankedEntry[] {
	return entries
		.map((entry) => {
			const scores: Record<string, Tier> = {};

			for (const p of participants) {
				const tier = ratings[p.id]?.[entry.id] ?? 4;
				scores[p.id] = tier as Tier;
			}

			const allScores = Object.values(scores) as Tier[];
			const worst = Math.max(...allScores) as Tier;
			const sum = allScores.reduce<number>((a, b) => a + b, 0);
			const min = Math.min(...allScores) as Tier;

			return {
				...entry,
				worst,
				sum,
				isTop: worst <= 1,
				disagreement: worst - min >= 3,
				scores
			} satisfies RankedEntry;
		})
		.sort((a, b) => {
			if (a.worst !== b.worst) return a.worst - b.worst;
			return a.sum - b.sum;
		});
}

// ---------------------------------------------------------------------------
// Group ranked entries by category
// ---------------------------------------------------------------------------

/**
 * Group a flat ranked list by category.
 *
 * Returns an array of { category, entries } groups, in the order the
 * categories appear in `categories`. Entries with no category (categoryId
 * null) are placed in an implicit "All" group when categories have active
 * labels. When there is only one category (or no active labels), a single
 * ungrouped list is returned as one group with category = null.
 *
 * This replaces the source app's `catsToShow` + label-keyed object pattern
 * that misfiled entries when earlier categories had blank names.
 */
export function groupRanking(
	ranking: RankedEntry[],
	categories: Category[]
): Array<{ category: Category | null; entries: RankedEntry[] }> {
	const activeCats = categories.filter((c) => c.label.trim() !== '');

	if (activeCats.length === 0) {
		// No active categories — return everything as a single flat group.
		return [{ category: null, entries: ranking }];
	}

	if (activeCats.length === 1) {
		// One active category — filter to just its entries (so entries filed under
		// a blank sibling category are excluded, not leaked into this group).
		const cat = activeCats[0];
		return [{ category: cat, entries: ranking.filter((e) => e.categoryId === cat.id) }];
	}

	return activeCats.map((cat) => ({
		category: cat,
		entries: ranking.filter((e) => e.categoryId === cat.id)
	}));
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Fisher-Yates shuffle. Returns a new array; does not mutate the input.
 * Not deterministic (uses Math.random) — not under test for output order.
 */
export function shuffle<T>(arr: T[]): T[] {
	const out = [...arr];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

/**
 * Generate a short, collision-resistant id.
 * Uses `crypto.randomUUID()` when available (browser + Node 14.17+), falls
 * back to a timestamp + random suffix for any environment that lacks it.
 */
export function generateId(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

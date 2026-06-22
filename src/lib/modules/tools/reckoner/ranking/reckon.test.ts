/**
 * Unit tests for the Reckoner pure ranking algorithm.
 *
 * Covers:
 *  - tierCap boundaries
 *  - tierCountsForCat (per-category, by stable id)
 *  - computeRanking consensus-floor ordering, tie-break, defaults, flags
 *  - groupRanking grouping by category id (bug-fix regression)
 *
 * No Svelte, no $app/*, no discover.ts — safe under `bun test`.
 */

import { describe, expect, it } from 'bun:test';
import { tierCap, tierCountsForCat, computeRanking, groupRanking } from './reckon.js';
import type { Category, Entry, Participant, Ratings, Tier } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeParticipant(id: string, name = id): Participant {
	return { id, name };
}

function makeCategory(id: string, label = id): Category {
	return { id, label };
}

function makeEntry(id: string, categoryId: string | null = null, text = id): Entry {
	return { id, text, categoryId };
}

// ---------------------------------------------------------------------------
// tierCap
// ---------------------------------------------------------------------------

describe('tierCap', () => {
	it('returns 0 when categorySize <= 0', () => {
		expect(tierCap(0, 0)).toBe(0);
		expect(tierCap(-1, 1)).toBe(0);
	});

	it('tier 0: ~22% of size, min 1', () => {
		expect(tierCap(1, 0)).toBe(1);   // min 1
		expect(tierCap(4, 0)).toBe(1);   // round(4*0.22)=1
		expect(tierCap(5, 0)).toBe(1);   // round(5*0.22)=1
		expect(tierCap(10, 0)).toBe(2);  // round(10*0.22)=2
		expect(tierCap(20, 0)).toBe(4);  // round(20*0.22)=4
	});

	it('tier 1: ~28% of size, min 1', () => {
		expect(tierCap(1, 1)).toBe(1);   // min 1
		expect(tierCap(3, 1)).toBe(1);   // round(3*0.28)=1
		expect(tierCap(4, 1)).toBe(1);   // round(4*0.28)=1
		expect(tierCap(10, 1)).toBe(3);  // round(10*0.28)=3
		expect(tierCap(20, 1)).toBe(6);  // round(20*0.28)=6
	});

	it('tiers 2, 3, 4 are uncapped (= categorySize)', () => {
		for (const tier of [2, 3, 4] as Tier[]) {
			expect(tierCap(5, tier)).toBe(5);
			expect(tierCap(1, tier)).toBe(1);
		}
	});
});

// ---------------------------------------------------------------------------
// tierCountsForCat
// ---------------------------------------------------------------------------

describe('tierCountsForCat', () => {
	const catA = makeCategory('cat-a', 'Category A');
	const catB = makeCategory('cat-b', 'Category B');
	const entries: Entry[] = [
		makeEntry('e1', catA.id),
		makeEntry('e2', catA.id),
		makeEntry('e3', catB.id),
		makeEntry('e4', null)
	];

	it('counts only entries in the given category', () => {
		const ratings: Record<string, Tier> = { e1: 0, e2: 1, e3: 0, e4: 2 };
		const counts = tierCountsForCat(ratings, entries, catA.id);
		expect(counts[0]).toBe(1); // e1
		expect(counts[1]).toBe(1); // e2
		expect(counts[2]).toBe(0); // e3 and e4 are not in catA
	});

	it('returns zeros when no entries match the category', () => {
		const ratings: Record<string, Tier> = { e3: 0 };
		const counts = tierCountsForCat(ratings, entries, catA.id);
		expect(counts[0]).toBe(0);
	});

	it('handles null categoryId (uncategorised entries)', () => {
		const ratings: Record<string, Tier> = { e1: 0, e4: 3 };
		const counts = tierCountsForCat(ratings, entries, null);
		expect(counts[3]).toBe(1); // e4
		expect(counts[0]).toBe(0); // e1 is not in the null group
	});

	it('returns all zeros when ratings is empty', () => {
		const counts = tierCountsForCat({}, entries, catA.id);
		expect(counts).toEqual({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 });
	});
});

// ---------------------------------------------------------------------------
// computeRanking
// ---------------------------------------------------------------------------

describe('computeRanking', () => {
	const alice = makeParticipant('alice');
	const bob = makeParticipant('bob');
	const participants = [alice, bob];

	it('sorts by worst score (lower is better)', () => {
		const entries: Entry[] = [makeEntry('e1'), makeEntry('e2')];
		const ratings: Ratings = {
			alice: { e1: 3, e2: 0 },
			bob:   { e1: 0, e2: 0 }
		};
		const result = computeRanking(participants, entries, ratings);
		// e2: worst=0 < e1: worst=3 → e2 first
		expect(result[0].id).toBe('e2');
		expect(result[1].id).toBe('e1');
	});

	it('breaks ties by sum when worst is equal', () => {
		const entries: Entry[] = [makeEntry('e1'), makeEntry('e2')];
		const ratings: Ratings = {
			alice: { e1: 0, e2: 0 },
			bob:   { e1: 2, e2: 1 }
		};
		// e1: worst=2, sum=2; e2: worst=1, sum=1 → e2 first
		const result = computeRanking(participants, entries, ratings);
		expect(result[0].id).toBe('e2');
	});

	it('defaults missing ratings to 4 ("Not this one")', () => {
		const entries: Entry[] = [makeEntry('e1')];
		const ratings: Ratings = { alice: { e1: 0 } }; // bob has no rating for e1
		const result = computeRanking(participants, entries, ratings);
		expect(result[0].worst).toBe(4); // bob defaulted to 4
		expect(result[0].sum).toBe(4);   // 0 + 4
	});

	it('sets isTop=true when worst <= 1', () => {
		const entries: Entry[] = [makeEntry('e1'), makeEntry('e2'), makeEntry('e3')];
		const ratings: Ratings = {
			alice: { e1: 0, e2: 1, e3: 2 },
			bob:   { e1: 1, e2: 0, e3: 0 }
		};
		const result = computeRanking(participants, entries, ratings);
		const byId = Object.fromEntries(result.map((r) => [r.id, r]));
		expect(byId['e1'].isTop).toBe(true);  // worst=1
		expect(byId['e2'].isTop).toBe(true);  // worst=1
		expect(byId['e3'].isTop).toBe(false); // worst=2
	});

	it('sets disagreement=true when max-min >= 3', () => {
		const entries: Entry[] = [makeEntry('e1'), makeEntry('e2')];
		const ratings: Ratings = {
			alice: { e1: 0, e2: 0 },
			bob:   { e1: 4, e2: 2 } // e1: 4-0=4 ≥ 3; e2: 2-0=2 < 3
		};
		const result = computeRanking(participants, entries, ratings);
		const byId = Object.fromEntries(result.map((r) => [r.id, r]));
		expect(byId['e1'].disagreement).toBe(true);
		expect(byId['e2'].disagreement).toBe(false);
	});

	it('handles a single participant', () => {
		const entries: Entry[] = [makeEntry('e1'), makeEntry('e2')];
		const ratings: Ratings = { alice: { e1: 2, e2: 0 } };
		const result = computeRanking([alice], entries, ratings);
		expect(result[0].id).toBe('e2');
		expect(result[1].id).toBe('e1');
	});

	it('returns empty array for no entries', () => {
		expect(computeRanking(participants, [], {})).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
// groupRanking — regression for the source app's misfiling bug
// ---------------------------------------------------------------------------

describe('groupRanking', () => {
	/**
	 * Regression: in the original source app, entries were grouped by
	 * `activeCats` array index, not by the entry's category id. When an earlier
	 * category had a blank name, activeCats shifted and entries ended up filed
	 * under the wrong category or silently dropped.
	 *
	 * The fix: each Category has a stable `id`. Entries carry `categoryId`
	 * referencing that stable id. `groupRanking` filters by `entry.categoryId
	 * === cat.id`, so blank/reordered categories have no effect.
	 */
	it('regression: blank earlier category does not misfile entries', () => {
		// Set up: blank first category, named second category
		const blankCat  = makeCategory('cat-blank', '');        // blank label → not in activeCats
		const namedCat  = makeCategory('cat-named', 'Movies');  // active

		// Entries filed under the NAMED category by its stable id
		const entries: Entry[] = [
			makeEntry('e1', namedCat.id, 'Inception'),
			makeEntry('e2', namedCat.id, 'Parasite'),
			makeEntry('e3', blankCat.id, 'Should not appear under named')
		];

		const alice = makeParticipant('alice');
		const ratings: Ratings = { alice: { e1: 0, e2: 1, e3: 0 } };
		const ranking = computeRanking([alice], entries, ratings);
		const groups = groupRanking(ranking, [blankCat, namedCat]);

		// Only one active category (Movies) — blankCat skipped
		expect(groups.length).toBe(1);
		expect(groups[0].category?.id).toBe(namedCat.id);

		// e1 and e2 appear; e3 (blankCat) does not
		const ids = groups[0].entries.map((e) => e.id);
		expect(ids).toContain('e1');
		expect(ids).toContain('e2');
		expect(ids).not.toContain('e3');
	});

	it('returns a single flat group when only one active category', () => {
		const cat = makeCategory('c1', 'Options');
		const entries: Entry[] = [makeEntry('e1', cat.id), makeEntry('e2', cat.id)];
		const alice = makeParticipant('alice');
		const ranking = computeRanking([alice], entries, { alice: { e1: 0, e2: 2 } });
		const groups = groupRanking(ranking, [cat]);

		expect(groups.length).toBe(1);
		expect(groups[0].category?.id).toBe(cat.id);
		expect(groups[0].entries.length).toBe(2);
	});

	it('returns multiple groups when multiple active categories', () => {
		const catA = makeCategory('c-a', 'Food');
		const catB = makeCategory('c-b', 'Drink');
		const entries: Entry[] = [
			makeEntry('e1', catA.id),
			makeEntry('e2', catB.id),
			makeEntry('e3', catA.id)
		];
		const alice = makeParticipant('alice');
		const ranking = computeRanking([alice], entries, {
			alice: { e1: 0, e2: 1, e3: 2 }
		});
		const groups = groupRanking(ranking, [catA, catB]);

		expect(groups.length).toBe(2);
		const food = groups.find((g) => g.category?.id === catA.id)!;
		const drink = groups.find((g) => g.category?.id === catB.id)!;
		expect(food.entries.map((e) => e.id)).toEqual(expect.arrayContaining(['e1', 'e3']));
		expect(drink.entries.map((e) => e.id)).toEqual(['e2']);
	});

	it('flat group when all categories have blank labels', () => {
		const c1 = makeCategory('c1', '');
		const c2 = makeCategory('c2', '  ');
		const entries: Entry[] = [makeEntry('e1', c1.id)];
		const ranking = computeRanking([], entries, {});
		const groups = groupRanking(ranking, [c1, c2]);

		// No active cats → single flat group, category = null
		expect(groups.length).toBe(1);
		expect(groups[0].category).toBeNull();
	});
});

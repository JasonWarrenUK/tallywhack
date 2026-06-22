/**
 * Unit tests for the Baby Name Chooser profile combination logic.
 *
 * No Svelte, no $app/*, no discover.ts — safe under `bun test`.
 */

import { describe, expect, it } from 'bun:test';
import { combineProfiles, mergePreferences, buildTasteProfile } from './combine.js';
import type { Preferences, TasteProfile } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_PREFS: Preferences = {
	genders: [],
	themes: [],
	cultures: [],
	uniqueness: 50
};

function makeProfile(
	liked: string[],
	disliked: string[],
	prefs: Partial<Preferences> = {}
): TasteProfile {
	const ratings: Record<string, 'like' | 'neutral' | 'dislike'> = {};
	for (const n of liked)    ratings[n] = 'like';
	for (const n of disliked) ratings[n] = 'dislike';
	return {
		person:      'Test',
		preferences: { ...DEFAULT_PREFS, ...prefs },
		ratings,
		liked,
		disliked
	};
}

// ---------------------------------------------------------------------------
// mergePreferences
// ---------------------------------------------------------------------------

describe('mergePreferences', () => {
	it('unions genders from both people', () => {
		const a: Preferences = { ...DEFAULT_PREFS, genders: ['male'] };
		const b: Preferences = { ...DEFAULT_PREFS, genders: ['female'] };
		const merged = mergePreferences(a, b);
		expect(merged.genders).toContain('male');
		expect(merged.genders).toContain('female');
	});

	it('deduplicates overlapping selections', () => {
		const a: Preferences = { ...DEFAULT_PREFS, themes: ['Nature', 'Mythology'] };
		const b: Preferences = { ...DEFAULT_PREFS, themes: ['Mythology', 'Royal'] };
		const merged = mergePreferences(a, b);
		expect(merged.themes.filter((t) => t === 'Mythology').length).toBe(1);
	});

	it('averages uniqueness scores', () => {
		const a: Preferences = { ...DEFAULT_PREFS, uniqueness: 30 };
		const b: Preferences = { ...DEFAULT_PREFS, uniqueness: 70 };
		expect(mergePreferences(a, b).uniqueness).toBe(50);
	});

	it('handles empty selections from both sides', () => {
		const merged = mergePreferences(DEFAULT_PREFS, DEFAULT_PREFS);
		expect(merged.genders).toEqual([]);
		expect(merged.themes).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
// combineProfiles
// ---------------------------------------------------------------------------

describe('combineProfiles', () => {
	it('names liked by BOTH appear in strongLikes', () => {
		const a = makeProfile(['Luna', 'Iris'], []);
		const b = makeProfile(['Luna', 'Mia'], []);
		const combined = combineProfiles(a, b);
		expect(combined.strongLikes).toContain('Luna');
		expect(combined.strongLikes).not.toContain('Iris'); // only A liked it
		expect(combined.strongLikes).not.toContain('Mia');  // only B liked it
	});

	it('names liked by ONE appear in softLikes', () => {
		const a = makeProfile(['Iris'], []);
		const b = makeProfile(['Mia'], []);
		const combined = combineProfiles(a, b);
		expect(combined.softLikes).toContain('Iris');
		expect(combined.softLikes).toContain('Mia');
	});

	it('names disliked by BOTH appear in strongDislikes', () => {
		const a = makeProfile([], ['Kevin', 'Bob']);
		const b = makeProfile([], ['Kevin', 'Chad']);
		const combined = combineProfiles(a, b);
		expect(combined.strongDislikes).toContain('Kevin');
		expect(combined.strongDislikes).not.toContain('Bob');  // only A disliked
		expect(combined.strongDislikes).not.toContain('Chad'); // only B disliked
	});

	it('names disliked by ONE appear in softDislikes', () => {
		const a = makeProfile([], ['Bob']);
		const b = makeProfile([], ['Chad']);
		const combined = combineProfiles(a, b);
		expect(combined.softDislikes).toContain('Bob');
		expect(combined.softDislikes).toContain('Chad');
	});

	it('exclusions = strongDislikes + softDislikes (disliked by EITHER)', () => {
		const a = makeProfile([], ['Foo', 'Bar']);
		const b = makeProfile([], ['Foo', 'Baz']);
		const combined = combineProfiles(a, b);
		// Foo: both dislike → strongDislikes; Bar: A only → softDislikes; Baz: B only → softDislikes
		expect(combined.exclusions).toContain('Foo');
		expect(combined.exclusions).toContain('Bar');
		expect(combined.exclusions).toContain('Baz');
	});

	it('veto principle: dislike outweighs like from the other person', () => {
		// A likes "Oliver"; B dislikes "Oliver" — veto applies
		const a = makeProfile(['Oliver'], []);
		const b = makeProfile([], ['Oliver']);
		const combined = combineProfiles(a, b);
		expect(combined.softDislikes).toContain('Oliver');
		expect(combined.softLikes).not.toContain('Oliver');
		expect(combined.strongLikes).not.toContain('Oliver');
	});

	it('handles empty profiles on both sides', () => {
		const a = makeProfile([], []);
		const b = makeProfile([], []);
		const combined = combineProfiles(a, b);
		expect(combined.strongLikes).toEqual([]);
		expect(combined.softLikes).toEqual([]);
		expect(combined.strongDislikes).toEqual([]);
		expect(combined.softDislikes).toEqual([]);
		expect(combined.exclusions).toEqual([]);
	});

	it('handles one-sided profiles (only A has ratings)', () => {
		const a = makeProfile(['Luna', 'Iris'], ['Bob']);
		const b = makeProfile([], []);
		const combined = combineProfiles(a, b);
		// Luna and Iris liked by A only → softLikes
		expect(combined.softLikes).toContain('Luna');
		expect(combined.softLikes).toContain('Iris');
		// Bob disliked by A only → softDislikes
		expect(combined.softDislikes).toContain('Bob');
		// Nothing in strongLikes (no mutual agreement)
		expect(combined.strongLikes).toEqual([]);
	});

	it('merges preferences from both profiles', () => {
		const a = makeProfile([], [], { genders: ['female'], uniqueness: 20 });
		const b = makeProfile([], [], { genders: ['male'],   uniqueness: 80 });
		const combined = combineProfiles(a, b);
		expect(combined.preferences.genders).toContain('female');
		expect(combined.preferences.genders).toContain('male');
		expect(combined.preferences.uniqueness).toBe(50);
	});

	// -----------------------------------------------------------------------
	// Disjoint-dimension flags (no-overlap detection)
	// -----------------------------------------------------------------------

	it('culturesDisjoint is true when both sides have non-overlapping cultures', () => {
		const a = makeProfile([], [], { cultures: ['Japanese', 'Indian'] });
		const b = makeProfile([], [], { cultures: ['Irish', 'Welsh'] });
		const combined = combineProfiles(a, b);
		expect(combined.culturesDisjoint).toBe(true);
	});

	it('culturesDisjoint is false when cultures overlap', () => {
		const a = makeProfile([], [], { cultures: ['Japanese', 'Irish'] });
		const b = makeProfile([], [], { cultures: ['Irish', 'Welsh'] });
		const combined = combineProfiles(a, b);
		expect(combined.culturesDisjoint).toBe(false);
	});

	it('culturesDisjoint is false when either side has no cultures (no constraint)', () => {
		const a = makeProfile([], [], { cultures: [] });
		const b = makeProfile([], [], { cultures: ['Irish'] });
		const combined = combineProfiles(a, b);
		expect(combined.culturesDisjoint).toBe(false);
	});

	it('themesDisjoint is true when both sides have non-overlapping themes', () => {
		const a = makeProfile([], [], { themes: ['Nature', 'Earthy'] });
		const b = makeProfile([], [], { themes: ['Mythology', 'Royal'] });
		const combined = combineProfiles(a, b);
		expect(combined.themesDisjoint).toBe(true);
	});

	it('themesDisjoint is false when themes overlap', () => {
		const a = makeProfile([], [], { themes: ['Nature', 'Mythology'] });
		const b = makeProfile([], [], { themes: ['Mythology', 'Royal'] });
		const combined = combineProfiles(a, b);
		expect(combined.themesDisjoint).toBe(false);
	});

	it('themesDisjoint is false when either side has no themes', () => {
		const a = makeProfile([], [], { themes: [] });
		const b = makeProfile([], [], { themes: ['Nature'] });
		const combined = combineProfiles(a, b);
		expect(combined.themesDisjoint).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// buildTasteProfile
// ---------------------------------------------------------------------------

describe('buildTasteProfile', () => {
	it('derives liked and disliked from ratings', () => {
		const profile = buildTasteProfile({
			person: 'Alice',
			preferences: DEFAULT_PREFS,
			ratings: { Luna: 'like', Bob: 'dislike', Mia: 'neutral' }
		});
		expect(profile.liked).toContain('Luna');
		expect(profile.disliked).toContain('Bob');
		expect(profile.liked).not.toContain('Mia');
		expect(profile.disliked).not.toContain('Mia');
	});

	it('handles empty ratings', () => {
		const profile = buildTasteProfile({
			person: 'Bob',
			preferences: DEFAULT_PREFS,
			ratings: {}
		});
		expect(profile.liked).toEqual([]);
		expect(profile.disliked).toEqual([]);
	});
});

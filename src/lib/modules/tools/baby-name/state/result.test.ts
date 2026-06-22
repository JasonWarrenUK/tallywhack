/**
 * Unit tests for the Baby Name result mapper.
 */

import { describe, expect, it } from 'bun:test';
import { toBabyNameResult } from './result.js';
import type { BabyNameSnapshot } from './result.js';
import type { CombinedProfile, NameSuggestion, TasteProfile } from '../naming/types.js';

const PREFS = { genders: [], themes: [], cultures: [], uniqueness: 50 };

const PROFILE_A: TasteProfile = {
	person:      'Alice',
	preferences: PREFS,
	ratings:     { Luna: 'like', Bob: 'dislike' },
	liked:       ['Luna'],
	disliked:    ['Bob']
};

const PROFILE_B: TasteProfile = {
	person:      'Bob',
	preferences: PREFS,
	ratings:     { Luna: 'like', Eve: 'neutral' },
	liked:       ['Luna'],
	disliked:    []
};

const COMBINED: CombinedProfile = {
	preferences:   PREFS,
	strongLikes:   ['Luna'],
	softLikes:     [],
	strongDislikes: [],
	softDislikes:  ['Bob'],
	exclusions:    ['Bob']
};

const SHORTLIST: NameSuggestion[] = [
	{ name: 'Luna', gender: 'female', origin: 'Latin', meaning: 'Moon' }
];

function makeSnap(overrides: Partial<BabyNameSnapshot> = {}): BabyNameSnapshot {
	return {
		shortlist: SHORTLIST,
		profileA:  PROFILE_A,
		profileB:  PROFILE_B,
		combined:  COMBINED,
		...overrides
	};
}

describe('toBabyNameResult', () => {
	it('returns kind: "selection"', () => {
		expect(toBabyNameResult(makeSnap()).kind).toBe('selection');
	});

	it('payload includes the shortlist', () => {
		const result = toBabyNameResult(makeSnap());
		expect(result.payload.shortlist).toEqual(SHORTLIST);
	});

	it('payload includes both taste profiles', () => {
		const result = toBabyNameResult(makeSnap());
		expect(result.payload.profileA.person).toBe('Alice');
		expect(result.payload.profileB.person).toBe('Bob');
	});

	it('payload includes the combined profile', () => {
		const result = toBabyNameResult(makeSnap());
		expect(result.payload.combined.strongLikes).toContain('Luna');
	});

	it('handles an empty shortlist gracefully', () => {
		const result = toBabyNameResult(makeSnap({ shortlist: [] }));
		expect(result.kind).toBe('selection');
		expect(result.payload.shortlist).toEqual([]);
	});
});

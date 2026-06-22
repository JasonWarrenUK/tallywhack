/**
 * Unit tests for the Reckoner result mapper.
 *
 * Verifies that `toReckonerResult` produces a correctly-shaped ToolOutput
 * with kind:'ranking' and the expected payload fields.
 */

import { describe, expect, it } from 'bun:test';
import { toReckonerResult } from './result.js';
import type { ReckonerSnapshot } from './result.js';

function makeSnap(overrides: Partial<ReckonerSnapshot> = {}): ReckonerSnapshot {
	return {
		activityName: 'Test Activity',
		participants: [
			{ id: 'p0', name: 'Alice' },
			{ id: 'p1', name: 'Bob' }
		],
		entries: [
			{ id: 'e1', text: 'Option A', categoryId: null },
			{ id: 'e2', text: 'Option B', categoryId: null }
		],
		ratings: {
			p0: { e1: 0, e2: 2 },
			p1: { e1: 1, e2: 0 }
		},
		...overrides
	};
}

describe('toReckonerResult', () => {
	it('returns kind: "ranking"', () => {
		const result = toReckonerResult(makeSnap());
		expect(result.kind).toBe('ranking');
	});

	it('payload includes activityName', () => {
		const result = toReckonerResult(makeSnap({ activityName: 'Movie Night' }));
		expect(result.payload.activityName).toBe('Movie Night');
	});

	it('payload.participants is an array of display names', () => {
		const result = toReckonerResult(makeSnap());
		expect(result.payload.participants).toEqual(['Alice', 'Bob']);
	});

	it('payload.ranking contains all entries ranked by consensus floor', () => {
		const result = toReckonerResult(makeSnap());
		expect(result.payload.ranking.length).toBe(2);

		// e1: worst=max(0,1)=1, sum=0+1=1
		// e2: worst=max(2,0)=2, sum=2+0=2
		// → e1 first (lower worst)
		expect(result.payload.ranking[0].id).toBe('e1');
		expect(result.payload.ranking[1].id).toBe('e2');
	});

	it('ranking entries have the required RankedEntry fields', () => {
		const result = toReckonerResult(makeSnap());
		const first = result.payload.ranking[0];
		expect(typeof first.id).toBe('string');
		expect(typeof first.text).toBe('string');
		expect(typeof first.worst).toBe('number');
		expect(typeof first.sum).toBe('number');
		expect(typeof first.isTop).toBe('boolean');
		expect(typeof first.disagreement).toBe('boolean');
		expect(typeof first.scores).toBe('object');
	});

	it('handles an empty entry list gracefully', () => {
		const result = toReckonerResult(makeSnap({ entries: [], ratings: {} }));
		expect(result.kind).toBe('ranking');
		expect(result.payload.ranking).toEqual([]);
	});
});

import { describe, expect, it } from 'bun:test';
import { toGrumbleResult } from './result.js';
import type { GameRecord } from '../scoring/types.js';

const base: GameRecord = {
	winner: 0,
	base: { 0: 105, 1: 40 },
	lines: { 0: 3, 1: 1 },
	final: { 0: 280, 1: 65 }, // 105 + 3*25 + 100 = 280; 40 + 1*25 = 65
	names: { 0: 'Alice', 1: 'Bob' },
	handCount: 7
};

describe('toGrumbleResult', () => {
	it('maps final scores as the comparable totals', () => {
		const result = toGrumbleResult(base);
		expect(result.scores[0]).toBe(280);
		expect(result.scores[1]).toBe(65);
	});

	it('carries the winner through', () => {
		const result = toGrumbleResult(base);
		expect(result.winner).toBe(0);
	});

	it('includes player names', () => {
		const result = toGrumbleResult(base);
		expect(result.names[0]).toBe('Alice');
		expect(result.names[1]).toBe('Bob');
	});

	it('puts pre-bonus base totals in detail', () => {
		const result = toGrumbleResult(base);
		expect(result.detail.base[0]).toBe(105);
		expect(result.detail.base[1]).toBe(40);
	});

	it('puts lines in detail', () => {
		const result = toGrumbleResult(base);
		expect(result.detail.lines[0]).toBe(3);
		expect(result.detail.lines[1]).toBe(1);
	});

	it('puts handCount in detail', () => {
		const result = toGrumbleResult(base);
		expect(result.detail.handCount).toBe(7);
	});

	it('works for a player-1 win', () => {
		const record: GameRecord = {
			winner: 1,
			base: { 0: 30, 1: 110 },
			lines: { 0: 1, 1: 4 },
			final: { 0: 55, 1: 310 },
			names: { 0: 'Alice', 1: 'Bob' },
			handCount: 9
		};
		const result = toGrumbleResult(record);
		expect(result.winner).toBe(1);
		expect(result.scores[1]).toBe(310);
		expect(result.detail.lines[1]).toBe(4);
	});

	it('satisfies the PlayerId constraint on winner', () => {
		const result = toGrumbleResult(base);
		// winner must be 0 or 1, never null (Gin Rummy cannot draw)
		const isValidId: boolean = result.winner === 0 || result.winner === 1;
		expect(isValidId).toBe(true);
	});
});

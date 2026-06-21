import { describe, expect, it } from 'bun:test';
import { toTilesResult } from './result.js';
import type { TilesGameSnapshot } from './result.js';
import type { Player } from '../scoring/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function snap(
	s0: number,
	s1: number,
	name0 = 'Alice',
	name1 = 'Bob',
	history: TilesGameSnapshot['history'] = []
): TilesGameSnapshot {
	const players: [Player, Player] = [
		{ name: name0, score: s0 },
		{ name: name1, score: s1 }
	];
	return { players, history };
}

// ---------------------------------------------------------------------------
// winner
// ---------------------------------------------------------------------------

describe('toTilesResult — winner', () => {
	it('player 0 wins when score 0 is higher', () => {
		expect(toTilesResult(snap(300, 200)).winner).toBe(0);
	});

	it('player 1 wins when score 1 is higher', () => {
		expect(toTilesResult(snap(150, 250)).winner).toBe(1);
	});

	it('returns null on a draw (Scrabble has no tiebreaker)', () => {
		expect(toTilesResult(snap(200, 200)).winner).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// scores and names
// ---------------------------------------------------------------------------

describe('toTilesResult — scores and names', () => {
	it('maps scores correctly', () => {
		const r = toTilesResult(snap(300, 200));
		expect(r.scores[0]).toBe(300);
		expect(r.scores[1]).toBe(200);
	});

	it('maps player names', () => {
		const r = toTilesResult(snap(0, 0, 'Charlie', 'Dana'));
		expect(r.names[0]).toBe('Charlie');
		expect(r.names[1]).toBe('Dana');
	});
});

// ---------------------------------------------------------------------------
// detail: words, bingos, highTurn
// ---------------------------------------------------------------------------

describe('toTilesResult — detail', () => {
	it('counts word-type history entries', () => {
		const history: TilesGameSnapshot['history'] = [
			{ type: 'word', player: 0, points: 20, bingo: false, words: [] },
			{ type: 'word', player: 1, points: 30, bingo: false, words: [] },
			{ type: 'pass', player: 0, points: 0, label: 'pass' }
		];
		expect(toTilesResult(snap(50, 30, 'A', 'B', history)).detail.words).toBe(2);
	});

	it('counts bingos', () => {
		const history: TilesGameSnapshot['history'] = [
			{ type: 'word', player: 0, points: 80, bingo: true, words: [] },
			{ type: 'word', player: 1, points: 20, bingo: false, words: [] }
		];
		expect(toTilesResult(snap(100, 20, 'A', 'B', history)).detail.bingos).toBe(1);
	});

	it('tracks highTurn', () => {
		const history: TilesGameSnapshot['history'] = [
			{ type: 'word', player: 0, points: 12, bingo: false, words: [] },
			{ type: 'word', player: 1, points: 84, bingo: false, words: [] },
			{ type: 'word', player: 0, points: 30, bingo: false, words: [] }
		];
		expect(toTilesResult(snap(42, 84, 'A', 'B', history)).detail.highTurn).toBe(84);
	});

	it('returns zero detail fields for an empty history', () => {
		const d = toTilesResult(snap(0, 0)).detail;
		expect(d.words).toBe(0);
		expect(d.bingos).toBe(0);
		expect(d.highTurn).toBe(0);
	});
});

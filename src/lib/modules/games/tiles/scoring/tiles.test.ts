import { describe, expect, it } from 'bun:test';
import {
	BASE,
	letterVal,
	wordMult,
	wordScore,
	turnTotal,
	rackSum,
	reconcileWord,
	endgameDeltas
} from './tiles.js';
import type { Tile } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tile(letter: string, square: Tile['square'] = 'plain', isBlank = false): Tile {
	return { letter, square, isBlank };
}

// ---------------------------------------------------------------------------
// letterVal
// ---------------------------------------------------------------------------

describe('letterVal', () => {
	it('returns the base value for a plain tile', () => {
		expect(letterVal(tile('A'))).toBe(1);
		expect(letterVal(tile('Q'))).toBe(10);
		expect(letterVal(tile('K'))).toBe(5);
	});

	it('doubles the letter value on a DL square', () => {
		expect(letterVal(tile('A', 'DL'))).toBe(2); // A=1, ×2
		expect(letterVal(tile('Q', 'DL'))).toBe(20); // Q=10, ×2
	});

	it('triples the letter value on a TL square', () => {
		expect(letterVal(tile('A', 'TL'))).toBe(3);
		expect(letterVal(tile('Q', 'TL'))).toBe(30);
	});

	it('returns 0 for a blank tile regardless of square', () => {
		expect(letterVal(tile('Z', 'plain', true))).toBe(0);
		expect(letterVal(tile('Q', 'DL', true))).toBe(0);
		expect(letterVal(tile('A', 'TW', true))).toBe(0);
	});

	it('returns 0 for an unknown letter', () => {
		expect(letterVal(tile('?'))).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// wordMult
// ---------------------------------------------------------------------------

describe('wordMult', () => {
	it('returns 1 for a word with no premium word squares', () => {
		expect(wordMult([tile('A'), tile('B'), tile('C')])).toBe(1);
	});

	it('doubles for a single DW tile', () => {
		expect(wordMult([tile('A', 'DW'), tile('B')])).toBe(2);
	});

	it('triples for a single TW tile', () => {
		expect(wordMult([tile('A', 'TW'), tile('B')])).toBe(3);
	});

	it('stacks multiple word multipliers (DW + DW = ×4)', () => {
		expect(wordMult([tile('A', 'DW'), tile('B', 'DW')])).toBe(4);
	});

	it('stacks DW + TW = ×6', () => {
		expect(wordMult([tile('A', 'DW'), tile('B', 'TW')])).toBe(6);
	});

	it('ignores letter-only premium squares (DL, TL) for word multiplier', () => {
		expect(wordMult([tile('A', 'DL'), tile('B', 'TL')])).toBe(1);
	});
});

// ---------------------------------------------------------------------------
// wordScore
// ---------------------------------------------------------------------------

describe('wordScore', () => {
	it('returns 0 for an empty tile array', () => {
		expect(wordScore([])).toBe(0);
	});

	it('scores a simple word without premium squares', () => {
		// C(3) + A(1) + T(1) = 5
		expect(wordScore([tile('C'), tile('A'), tile('T')])).toBe(5);
	});

	it('applies the letter multiplier before the word multiplier', () => {
		// A(1×DL=2) + T(1) = 3, then ×DW = 6
		expect(wordScore([tile('A', 'DL'), tile('T', 'DW')])).toBe(6);
	});

	it('a blank on a word-multiplier square does not score but still multiplies the word', () => {
		// Blank on DW = 0 pts for the blank, but word is ×2
		// A(1) + blank-on-DW(0) = 1 × 2 = 2
		expect(wordScore([tile('A'), tile('?', 'DW', true)])).toBe(2);
	});
});

// ---------------------------------------------------------------------------
// turnTotal
// ---------------------------------------------------------------------------

describe('turnTotal', () => {
	it('sums banked and current word scores', () => {
		const banked = [[tile('C'), tile('A'), tile('T')]]; // 5
		const current = [tile('D'), tile('O'), tile('G')]; // D(2)+O(1)+G(2)=5
		expect(turnTotal(banked, current, false)).toBe(10);
	});

	it('adds the +50 bingo bonus', () => {
		expect(turnTotal([], [tile('A')], true)).toBe(1 + 50);
	});

	it('bingo applies even if the current word is empty', () => {
		// 0-point scored with bingo toggle on (0 + 50)
		expect(turnTotal([], [], true)).toBe(50);
	});

	it('returns 0 for empty words without bingo', () => {
		expect(turnTotal([], [], false)).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// rackSum
// ---------------------------------------------------------------------------

describe('rackSum', () => {
	it('sums the base values of letter characters', () => {
		expect(rackSum('QUIT')).toBe(10 + 1 + 1 + 1); // Q=10, U=1, I=1, T=1
	});

	it('is case-insensitive', () => {
		expect(rackSum('quit')).toBe(rackSum('QUIT'));
	});

	it('ignores non-letter characters', () => {
		expect(rackSum('Q U I T')).toBe(rackSum('QUIT'));
		expect(rackSum('Q1U2I3T4')).toBe(rackSum('QUIT'));
	});

	it('returns 0 for an empty string', () => {
		expect(rackSum('')).toBe(0);
	});

	it('unknown letters contribute 0', () => {
		expect(rackSum('A')).toBe(1);
	});

	it('uses the real BASE table', () => {
		// E=1, Z=10 → sum 11
		expect(rackSum('EZ')).toBe(BASE['E'] + BASE['Z']);
	});
});

// ---------------------------------------------------------------------------
// reconcileWord
// ---------------------------------------------------------------------------

describe('reconcileWord', () => {
	it('creates fresh tiles from an empty previous state', () => {
		const result = reconcileWord('CAT', []);
		expect(result).toHaveLength(3);
		expect(result[0].letter).toBe('C');
		expect(result[0].square).toBe('plain');
		expect(result[0].isBlank).toBe(false);
	});

	it('preserves tile metadata when the letter is unchanged at its index', () => {
		const prev = [{ letter: 'C', square: 'DL' as const, isBlank: false }];
		const result = reconcileWord('CAT', prev);
		// 'C' at index 0 is unchanged → preserve the DL square
		expect(result[0].square).toBe('DL');
		// 'A' and 'T' are new positions → fresh plain tiles
		expect(result[1].square).toBe('plain');
		expect(result[2].square).toBe('plain');
	});

	it('resets tile metadata when the letter changes at an index', () => {
		const prev = [{ letter: 'C', square: 'TW' as const, isBlank: false }];
		// 'D' replaces 'C' → fresh tile, no TW
		const result = reconcileWord('DAT', prev);
		expect(result[0].letter).toBe('D');
		expect(result[0].square).toBe('plain');
	});

	it('strips non-letter characters', () => {
		const result = reconcileWord('C4T', []);
		expect(result).toHaveLength(2);
		expect(result[0].letter).toBe('C');
		expect(result[1].letter).toBe('T');
	});

	it('upcases letters', () => {
		const result = reconcileWord('cat', []);
		expect(result[0].letter).toBe('C');
	});

	it('returns an empty array for an empty or non-letter string', () => {
		expect(reconcileWord('', [])).toHaveLength(0);
		expect(reconcileWord('123', [])).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// endgameDeltas
// ---------------------------------------------------------------------------

describe('endgameDeltas', () => {
	it('both players lose their own rack values when neither is out', () => {
		// A leftover=5, B leftover=3 → A: -5, B: -3
		const [d0, d1] = endgameDeltas({ leftover: ['EQUIP', 'CAT'], out: [false, false] });
		expect(d0).toBe(-(10 + 1 + 1 + 1 + 3)); // E+Q+U+I+P = 1+10+1+1+3 = 16
		expect(d1).toBe(-(3 + 1 + 1)); // C+A+T = 5
	});

	it('player 0 gains player 1 leftovers when player 0 went out', () => {
		// B leftover=5 → A: -0 + 5 = +5, B: -5
		const [d0, d1] = endgameDeltas({ leftover: ['', 'EQUIP'], out: [true, false] });
		expect(d0).toBe(16); // gained B's rack
		expect(d1).toBe(-16);
	});

	it('player 1 gains player 0 leftovers when player 1 went out', () => {
		const [d0, d1] = endgameDeltas({ leftover: ['EQUIP', ''], out: [false, true] });
		expect(d0).toBe(-16);
		expect(d1).toBe(16);
	});

	it('no transfer when both players are marked out', () => {
		const [d0, d1] = endgameDeltas({ leftover: ['', ''], out: [true, true] });
		expect(d0).toBe(0);
		expect(d1).toBe(0);
	});

	it('handles empty racks (no leftover tiles)', () => {
		const [d0, d1] = endgameDeltas({ leftover: ['', ''], out: [false, false] });
		expect(d0).toBe(0);
		expect(d1).toBe(0);
	});
});

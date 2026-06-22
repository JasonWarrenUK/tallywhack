import { describe, expect, it } from 'bun:test';
import {
	scoreMaki,
	scoreTempura,
	scoreSashimi,
	scoreDumpling,
	scoreNigiri,
	scoreRound,
	scorePudding,
	scoreGame
} from './engine.js';
import { dumplingScore } from './cards.js';
import type { NigiriInput, RoundInput } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyNigiri(): NigiriInput {
	return {
		plain: { egg: 0, salmon: 0, squid: 0 },
		wasabi: { egg: 0, salmon: 0, squid: 0 },
		unusedWasabi: 0
	};
}

function emptyInput(maki0 = 0, maki1 = 0): RoundInput {
	return {
		players: {
			0: { maki: maki0, tempura: 0, sashimi: 0, dumpling: 0, nigiri: emptyNigiri(), pudding: 0 },
			1: { maki: maki1, tempura: 0, sashimi: 0, dumpling: 0, nigiri: emptyNigiri(), pudding: 0 }
		}
	};
}

/** All-zero round input with overrides per player. */
function round(p0: Partial<{ maki: number; tempura: number; sashimi: number; dumpling: number; nigiri: NigiriInput; pudding: number }>, p1 = p0): RoundInput {
	return {
		players: {
			0: { maki: 0, tempura: 0, sashimi: 0, dumpling: 0, nigiri: emptyNigiri(), pudding: 0, ...p0 },
			1: { maki: 0, tempura: 0, sashimi: 0, dumpling: 0, nigiri: emptyNigiri(), pudding: 0, ...p1 }
		}
	};
}

// ---------------------------------------------------------------------------
// scoreMaki
// ---------------------------------------------------------------------------

describe('scoreMaki', () => {
	it('0, 0 → [0, 0]', () => {
		expect(scoreMaki(0, 0)).toEqual([0, 0]);
	});

	it('a > b → [6, 3]', () => {
		expect(scoreMaki(5, 2)).toEqual([6, 3]);
	});

	it('b > a → [3, 6]', () => {
		expect(scoreMaki(2, 5)).toEqual([3, 6]);
	});

	it('a === b > 0 → [3, 3] (split the 6-point prize)', () => {
		expect(scoreMaki(3, 3)).toEqual([3, 3]);
	});

	it('a > 0, b === 0 → [6, 0]', () => {
		expect(scoreMaki(4, 0)).toEqual([6, 0]);
	});

	it('a === 0, b > 0 → [0, 6]', () => {
		expect(scoreMaki(0, 3)).toEqual([0, 6]);
	});
});

// ---------------------------------------------------------------------------
// scoreTempura
// ---------------------------------------------------------------------------

describe('scoreTempura', () => {
	it('1 tempura → 0 (incomplete pair)', () => {
		expect(scoreTempura(1)).toBe(0);
	});

	it('2 tempura → 5', () => {
		expect(scoreTempura(2)).toBe(5);
	});

	it('3 tempura → 5 (one full pair, one leftover)', () => {
		expect(scoreTempura(3)).toBe(5);
	});

	it('4 tempura → 10', () => {
		expect(scoreTempura(4)).toBe(10);
	});

	it('5 tempura → 10 (leftover ignored)', () => {
		expect(scoreTempura(5)).toBe(10);
	});
});

// ---------------------------------------------------------------------------
// scoreSashimi
// ---------------------------------------------------------------------------

describe('scoreSashimi', () => {
	it('2 sashimi → 0 (incomplete set)', () => {
		expect(scoreSashimi(2)).toBe(0);
	});

	it('3 sashimi → 10', () => {
		expect(scoreSashimi(3)).toBe(10);
	});

	it('6 sashimi → 20', () => {
		expect(scoreSashimi(6)).toBe(20);
	});

	it('7 sashimi → 20 (leftover ignored)', () => {
		expect(scoreSashimi(7)).toBe(20);
	});
});

// ---------------------------------------------------------------------------
// scoreDumpling / dumplingScore
// ---------------------------------------------------------------------------

describe('scoreDumpling', () => {
	it('0 dumplings → 0', () => {
		expect(scoreDumpling(0)).toBe(0);
	});

	it('1 → 1', () => expect(scoreDumpling(1)).toBe(1));
	it('2 → 3', () => expect(scoreDumpling(2)).toBe(3));
	it('3 → 6', () => expect(scoreDumpling(3)).toBe(6));
	it('4 → 10', () => expect(scoreDumpling(4)).toBe(10));
	it('5 → 15', () => expect(scoreDumpling(5)).toBe(15));
	it('6 → 15 (cap applies)', () => expect(scoreDumpling(6)).toBe(15));
	it('8 → 15 (cap still applies)', () => expect(scoreDumpling(8)).toBe(15));
});

describe('dumplingScore (raw table)', () => {
	it('matches the capped table', () => {
		expect(dumplingScore(0)).toBe(0);
		expect(dumplingScore(5)).toBe(15);
		expect(dumplingScore(99)).toBe(15);
	});
});

// ---------------------------------------------------------------------------
// scoreNigiri
// ---------------------------------------------------------------------------

describe('scoreNigiri', () => {
	it('plain egg → 1', () => {
		const n = emptyNigiri();
		n.plain.egg = 1;
		expect(scoreNigiri(n)).toBe(1);
	});

	it('plain salmon → 2', () => {
		const n = emptyNigiri();
		n.plain.salmon = 1;
		expect(scoreNigiri(n)).toBe(2);
	});

	it('plain squid → 3', () => {
		const n = emptyNigiri();
		n.plain.squid = 1;
		expect(scoreNigiri(n)).toBe(3);
	});

	it('squid on wasabi → 9 (3 × 3)', () => {
		const n = emptyNigiri();
		n.wasabi.squid = 1;
		expect(scoreNigiri(n)).toBe(9);
	});

	it('salmon on wasabi → 6 (2 × 3)', () => {
		const n = emptyNigiri();
		n.wasabi.salmon = 1;
		expect(scoreNigiri(n)).toBe(6);
	});

	it('unused wasabi contributes 0', () => {
		const n = emptyNigiri();
		n.unusedWasabi = 3;
		expect(scoreNigiri(n)).toBe(0);
	});

	it('mixed bag: plain egg + wasabi squid', () => {
		const n = emptyNigiri();
		n.plain.egg = 2;    // 2 × 1 = 2
		n.wasabi.squid = 1; // 1 × 3 × 3 = 9
		expect(scoreNigiri(n)).toBe(11);
	});
});

// ---------------------------------------------------------------------------
// scoreRound — cross-player maki distribution
// ---------------------------------------------------------------------------

describe('scoreRound — maki cross-player', () => {
	it('distributes maki correctly between players', () => {
		const input = emptyInput(4, 2); // p0 wins maki
		const result = scoreRound(input);
		expect(result.breakdown[0].maki).toBe(6);
		expect(result.breakdown[1].maki).toBe(3);
	});

	it('sums roundTotal correctly', () => {
		const input = round(
			{ maki: 4, tempura: 2, sashimi: 3, dumpling: 2 },
			{ maki: 2, tempura: 1, sashimi: 1, dumpling: 1 }
		);
		const r = scoreRound(input);
		// p0: maki=6, tempura=5, sashimi=10, dumpling=3
		expect(r.breakdown[0].tempura).toBe(5);
		expect(r.breakdown[0].sashimi).toBe(10);
		expect(r.breakdown[0].dumpling).toBe(3);
		expect(r.breakdown[0].roundTotal).toBe(6 + 5 + 10 + 3);
	});
});

// ---------------------------------------------------------------------------
// scorePudding
// ---------------------------------------------------------------------------

describe('scorePudding', () => {
	it('p0 has more pudding → p0 +6, p1 −6', () => {
		expect(scorePudding({ 0: 5, 1: 2 })).toEqual({ 0: 6, 1: -6 });
	});

	it('p1 has more pudding → p0 −6, p1 +6', () => {
		expect(scorePudding({ 0: 1, 1: 3 })).toEqual({ 0: -6, 1: 6 });
	});

	it('tied pudding → [0, 0]', () => {
		expect(scorePudding({ 0: 2, 1: 2 })).toEqual({ 0: 0, 1: 0 });
	});

	it('0, 0 → [0, 0] (no pudding either way)', () => {
		expect(scorePudding({ 0: 0, 1: 0 })).toEqual({ 0: 0, 1: 0 });
	});

	it('pudding summed across rounds, not per-round', () => {
		// This just confirms scorePudding works on totals already summed by scoreGame.
		// Behaviour is the same as other tied/untied cases.
		expect(scorePudding({ 0: 6, 1: 3 })).toEqual({ 0: 6, 1: -6 });
	});
});

// ---------------------------------------------------------------------------
// scoreGame — 3-round fixtures
// ---------------------------------------------------------------------------

describe('scoreGame', () => {
	function zeroRound(): RoundInput {
		return round({});
	}

	it('all-zero game → winner null, scores 0/0', () => {
		const result = scoreGame([zeroRound(), zeroRound(), zeroRound()]);
		expect(result.winner).toBeNull();
		expect(result.scores[0]).toBe(0);
		expect(result.scores[1]).toBe(0);
	});

	it('p0 scores more → winner 0', () => {
		const r1 = round({ maki: 5 }, { maki: 0 }); // p0 gets 6 from maki
		const result = scoreGame([r1, zeroRound(), zeroRound()]);
		expect(result.winner).toBe(0);
	});

	it('p1 scores more → winner 1', () => {
		const r1 = round({ maki: 0 }, { maki: 5 }); // p1 gets 6 from maki
		const result = scoreGame([r1, zeroRound(), zeroRound()]);
		expect(result.winner).toBe(1);
	});

	it('equal scores, p0 more pudding → winner 0 (pudding tiebreaker)', () => {
		// Both players same round points, p0 has more pudding.
		const r1 = round({ pudding: 3 }, { pudding: 1 });
		const r2 = round({ tempura: 2 }, { tempura: 2 }); // same tempura → same points
		const r3 = zeroRound();
		const result = scoreGame([r1, r2, r3]);
		// round points equal (both get 5 from tempura in r2, 0 elsewhere)
		// pudding: p0=3, p1=1 → p0 wins tiebreaker
		expect(result.winner).toBe(0);
		expect(result.detail.puddingTotals[0]).toBe(3);
		expect(result.detail.puddingTotals[1]).toBe(1);
	});

	it('equal scores, equal pudding → winner null (genuine draw)', () => {
		const r1 = round({ tempura: 2, pudding: 2 }, { tempura: 2, pudding: 2 });
		const result = scoreGame([r1, zeroRound(), zeroRound()]);
		expect(result.winner).toBeNull();
		expect(result.detail.puddingTotals[0]).toBe(2);
		expect(result.detail.puddingTotals[1]).toBe(2);
	});

	it('pudding points included in final scores', () => {
		// p0 gets 5 from tempura; p1 gets 5 from tempura; p0 has more pudding (+6, -6).
		const r1 = round({ tempura: 2, pudding: 4 }, { tempura: 2, pudding: 0 });
		const result = scoreGame([r1, zeroRound(), zeroRound()]);
		expect(result.scores[0]).toBe(5 + 6); // tempura + pudding bonus
		expect(result.scores[1]).toBe(5 - 6); // tempura - pudding penalty
		expect(result.winner).toBe(0);
	});

	it('detail includes roundSubtotals per round', () => {
		const r1 = round({ tempura: 2 }, { sashimi: 3 }); // p0: 5; p1: 10
		const result = scoreGame([r1, zeroRound(), zeroRound()]);
		expect(result.detail.roundSubtotals[0][0]).toBe(5);
		expect(result.detail.roundSubtotals[0][1]).toBe(10);
	});

	it('3-round fixture with exact totals', () => {
		// Round 1: p0 maki=4 vs p1 maki=2 → [6, 3]; p0 tempura=2→5; p1 sashimi=3→10
		// Round 2: both tempura=1 → 0 (incomplete); p0 dumpling=3→6; p1 dumpling=2→3
		// Round 3: p0 nigiri: plain squid=1→3; p1 nigiri: wasabi squid=1→9
		// Pudding: p0=2, p1=1 across rounds → p0 +6, p1 -6
		const nigiri0: NigiriInput = { ...emptyNigiri(), plain: { egg: 0, salmon: 0, squid: 1 } };
		const nigiri1: NigiriInput = { ...emptyNigiri(), wasabi: { egg: 0, salmon: 0, squid: 1 } };

		const r1: RoundInput = {
			players: {
				0: { maki: 4, tempura: 2, sashimi: 0, dumpling: 0, nigiri: emptyNigiri(), pudding: 1 },
				1: { maki: 2, tempura: 0, sashimi: 3, dumpling: 0, nigiri: emptyNigiri(), pudding: 1 }
			}
		};
		const r2: RoundInput = {
			players: {
				0: { maki: 0, tempura: 1, sashimi: 0, dumpling: 3, nigiri: emptyNigiri(), pudding: 1 },
				1: { maki: 0, tempura: 1, sashimi: 0, dumpling: 2, nigiri: emptyNigiri(), pudding: 0 }
			}
		};
		const r3: RoundInput = {
			players: {
				0: { maki: 0, tempura: 0, sashimi: 0, dumpling: 0, nigiri: nigiri0, pudding: 0 },
				1: { maki: 0, tempura: 0, sashimi: 0, dumpling: 0, nigiri: nigiri1, pudding: 0 }
			}
		};

		const result = scoreGame([r1, r2, r3]);

		// Round subtotals (no pudding in round sums):
		// r1: p0 = 6 + 5 + 0 + 0 + 0 = 11; p1 = 3 + 0 + 10 + 0 + 0 = 13
		// r2: p0 = 0 + 0 + 0 + 6 + 0 = 6;  p1 = 0 + 0 + 0 + 3 + 0 = 3
		// r3: p0 = 0 + 0 + 0 + 0 + 3 = 3;  p1 = 0 + 0 + 0 + 0 + 9 = 9
		expect(result.detail.roundSubtotals[0][0]).toBe(11);
		expect(result.detail.roundSubtotals[0][1]).toBe(13);
		expect(result.detail.roundSubtotals[1][0]).toBe(6);
		expect(result.detail.roundSubtotals[1][1]).toBe(3);
		expect(result.detail.roundSubtotals[2][0]).toBe(3);
		expect(result.detail.roundSubtotals[2][1]).toBe(9);

		// Pudding totals: p0=1+1=2, p1=1+0=1 → p0 +6, p1 -6
		expect(result.detail.puddingTotals[0]).toBe(2);
		expect(result.detail.puddingTotals[1]).toBe(1);
		expect(result.detail.puddingPoints[0]).toBe(6);
		expect(result.detail.puddingPoints[1]).toBe(-6);

		// Final: p0 = 11+6+3+6 = 26; p1 = 13+3+9-6 = 19
		expect(result.scores[0]).toBe(26);
		expect(result.scores[1]).toBe(19);
		expect(result.winner).toBe(0);
	});
});

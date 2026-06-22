import { describe, expect, it } from 'bun:test';
import { toSushiGoResult } from './result.js';
import type { SushiGoGameSnapshot } from './result.js';
import type { RoundInput } from '../scoring/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyNigiri() {
	return {
		plain: { egg: 0, salmon: 0, squid: 0 },
		wasabi: { egg: 0, salmon: 0, squid: 0 },
		unusedWasabi: 0
	};
}

function emptyRound(): RoundInput {
	return {
		players: {
			0: { maki: 0, tempura: 0, sashimi: 0, dumpling: 0, nigiri: emptyNigiri(), pudding: 0 },
			1: { maki: 0, tempura: 0, sashimi: 0, dumpling: 0, nigiri: emptyNigiri(), pudding: 0 }
		}
	};
}

function snap(
	overrides: Partial<SushiGoGameSnapshot> = {}
): SushiGoGameSnapshot {
	return {
		rounds: [emptyRound(), emptyRound(), emptyRound()],
		names: { 0: 'Alice', 1: 'Bob' },
		...overrides
	};
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

describe('toSushiGoResult — wiring', () => {
	it('includes player names', () => {
		const r = toSushiGoResult(snap({ names: { 0: 'Charlie', 1: 'Dana' } }));
		expect(r.names[0]).toBe('Charlie');
		expect(r.names[1]).toBe('Dana');
	});

	it('all-zero → winner null, scores 0/0', () => {
		const r = toSushiGoResult(snap());
		expect(r.winner).toBeNull();
		expect(r.scores[0]).toBe(0);
		expect(r.scores[1]).toBe(0);
	});

	it('p0 more maki in round 1 → winner 0', () => {
		const r1: RoundInput = {
			players: {
				0: { maki: 5, tempura: 0, sashimi: 0, dumpling: 0, nigiri: emptyNigiri(), pudding: 0 },
				1: { maki: 0, tempura: 0, sashimi: 0, dumpling: 0, nigiri: emptyNigiri(), pudding: 0 }
			}
		};
		const r = toSushiGoResult(snap({ rounds: [r1, emptyRound(), emptyRound()] }));
		expect(r.winner).toBe(0);
	});

	it('detail.rounds has length 3', () => {
		const r = toSushiGoResult(snap());
		expect(r.detail.rounds).toHaveLength(3);
	});

	it('pudding tiebreaker applies when scores tie', () => {
		// Both get 5 from tempura in round 1; p0 has pudding advantage.
		const r1: RoundInput = {
			players: {
				0: { maki: 0, tempura: 2, sashimi: 0, dumpling: 0, nigiri: emptyNigiri(), pudding: 3 },
				1: { maki: 0, tempura: 2, sashimi: 0, dumpling: 0, nigiri: emptyNigiri(), pudding: 1 }
			}
		};
		const r = toSushiGoResult(snap({ rounds: [r1, emptyRound(), emptyRound()] }));
		expect(r.winner).toBe(0); // pudding tiebreaker
	});
});

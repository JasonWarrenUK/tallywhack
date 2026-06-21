/**
 * Single source of truth for a Sushi Go! game. Runes singleton.
 *
 * Three rounds are played sequentially. After round 3, the full scoreGame
 * result is computed. Pudding is tallied per-round but only scored at the end.
 */
import { scoreGame, scoreRound } from '../scoring/engine.js';
import type { PlayerId } from '$lib/modules/types.js';
import type { RoundInput, PlayerRoundInput, SushiGoResult } from '../scoring/types.js';
import { loadGame, saveGame, INITIAL, type Phase } from './persistence.js';
import type { NigiriKind } from '../scoring/cards.js';

function createGame() {
	let round = $state<0 | 1 | 2>(INITIAL.round);
	let phase = $state<Phase>(INITIAL.phase);
	let rounds = $state<[RoundInput, RoundInput, RoundInput]>(
		JSON.parse(JSON.stringify(INITIAL.rounds)) // deep copy
	);
	let names = $state<Record<PlayerId, string>>({ ...INITIAL.names });

	// Rehydrate from localStorage on init (no-op on SSR).
	const saved = loadGame();
	if (saved) {
		round = saved.round;
		phase = saved.phase;
		rounds = saved.rounds;
		names = saved.names;
	}

	/** Live round preview for the current round. */
	const currentRoundPreview = $derived(scoreRound(rounds[round]));

	/** Cumulative round subtotals per player (all completed rounds so far). */
	const cumulativeSubtotals = $derived.by(() => {
		const totals: Record<PlayerId, number> = { 0: 0, 1: 0 };
		for (let r = 0; r < round; r++) {
			const rs = scoreRound(rounds[r]);
			totals[0] += rs.breakdown[0].roundTotal;
			totals[1] += rs.breakdown[1].roundTotal;
		}
		return totals;
	});

	/** Final result — only populated after the game is finished. */
	let finalResult = $state<SushiGoResult | null>(null);

	function persist() {
		saveGame({ round, phase, rounds, names });
	}

	function setName(p: PlayerId, value: string) {
		names = { ...names, [p]: value };
		persist();
	}

	/** Update a top-level numeric field for one player in the current round. */
	function setField(player: PlayerId, field: keyof Omit<PlayerRoundInput, 'nigiri'>, value: number) {
		const roundCopy = JSON.parse(JSON.stringify(rounds)) as typeof rounds;
		(roundCopy[round].players[player][field] as number) = Math.max(0, value);
		rounds = roundCopy;
		persist();
	}

	/** Update a nigiri sub-field. */
	function setNigiri(
		player: PlayerId,
		kind: NigiriKind,
		slot: 'plain' | 'wasabi',
		value: number
	) {
		const roundCopy = JSON.parse(JSON.stringify(rounds)) as typeof rounds;
		(roundCopy[round].players[player].nigiri[slot][kind]) = Math.max(0, value);
		rounds = roundCopy;
		persist();
	}

	function setUnusedWasabi(player: PlayerId, value: number) {
		const roundCopy = JSON.parse(JSON.stringify(rounds)) as typeof rounds;
		roundCopy[round].players[player].nigiri.unusedWasabi = Math.max(0, value);
		rounds = roundCopy;
		persist();
	}

	/** Advance to the next round, or finish the game if all 3 rounds are done. */
	function advanceRound() {
		if (round < 2) {
			round = (round + 1) as 1 | 2;
		} else {
			phase = 'finished';
			const result = scoreGame(rounds);
			finalResult = { ...result, names: { ...names } };
		}
		persist();
	}

	/** Reset to a fresh game, keeping player names. */
	function resetGame() {
		const savedNames = { ...names };
		round = 0;
		phase = 'round';
		rounds = JSON.parse(JSON.stringify(INITIAL.rounds));
		names = savedNames;
		finalResult = null;
		persist();
	}

	return {
		get round() { return round; },
		get phase() { return phase; },
		get rounds() { return rounds; },
		get names() { return names; },
		get currentRoundPreview() { return currentRoundPreview; },
		get cumulativeSubtotals() { return cumulativeSubtotals; },
		get finalResult() { return finalResult; },

		setName,
		setField,
		setNigiri,
		setUnusedWasabi,
		advanceRound,
		resetGame
	};
}

export const game = createGame();
export type Game = ReturnType<typeof createGame>;

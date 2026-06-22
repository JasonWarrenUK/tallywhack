/**
 * Sushi Go! persistence — wraps the shared createLocalStore helper.
 *
 * Saves the full game state under key 'sushi-go:game'.
 */
import { createLocalStore } from '$lib/persistence/local.js';
import type { RoundInput } from '../scoring/types.js';
import type { PlayerId } from '$lib/modules/types.js';

export type Phase = 'round' | 'finished';

export interface PersistedSushiGo {
	round: 0 | 1 | 2;
	phase: Phase;
	rounds: [RoundInput, RoundInput, RoundInput];
	names: Record<PlayerId, string>;
}

function emptyRound(): RoundInput {
	const emptyNigiri = () => ({
		plain: { egg: 0, salmon: 0, squid: 0 },
		wasabi: { egg: 0, salmon: 0, squid: 0 },
		unusedWasabi: 0
	});
	return {
		players: {
			0: { maki: 0, tempura: 0, sashimi: 0, dumpling: 0, nigiri: emptyNigiri(), pudding: 0 },
			1: { maki: 0, tempura: 0, sashimi: 0, dumpling: 0, nigiri: emptyNigiri(), pudding: 0 }
		}
	};
}

export const INITIAL: PersistedSushiGo = {
	round: 0,
	phase: 'round',
	rounds: [emptyRound(), emptyRound(), emptyRound()],
	names: { 0: 'Player 1', 1: 'Player 2' }
};

const store = createLocalStore<PersistedSushiGo>({
	key: 'sushi-go:game',
	version: 1,
	migrate(raw) {
		const r = raw as Partial<PersistedSushiGo>;
		if (!r.names) return null;
		return { ...INITIAL, ...r };
	}
});

export const loadGame = () => store.load();
export const saveGame = (state: PersistedSushiGo) => store.save(state);
export const clearGame = () => store.clear();

<script lang="ts">
	/**
	 * Two-column input panel for one round. Each player gets a column with
	 * CategoryCounters for maki/tempura/sashimi/dumpling/pudding and a
	 * NigiriWasabiInput sub-panel.
	 */
	import { Panel } from '$lib/components/index.js';
	import CategoryCounter from './CategoryCounter.svelte';
	import NigiriWasabiInput from './NigiriWasabiInput.svelte';
	import { game } from '../state/game.svelte.js';
	import type { PlayerId } from '$lib/modules/types.js';
	import type { PlayerRoundInput } from '../scoring/types.js';

	const players: PlayerId[] = [0, 1];

	const categories: { key: keyof Omit<PlayerRoundInput, 'nigiri' | 'pudding'>; label: string; hint?: string }[] = [
		{ key: 'maki', label: 'Maki 🍙', hint: 'icon count' },
		{ key: 'tempura', label: 'Tempura 🍤', hint: '2 → 5pt' },
		{ key: 'sashimi', label: 'Sashimi 🐟', hint: '3 → 10pt' },
		{ key: 'dumpling', label: 'Dumpling 🥟', hint: '1→1, 2→3, 3→6…' }
	];
</script>

<div class="round-input">
	<div class="round-head">Round {game.round + 1} of 3</div>
	<div class="columns">
		{#each players as p (p)}
			<div class="player-col">
				<div class="player-name">{game.names[p]}</div>
				{#each categories as { key, label, hint } (key)}
					<CategoryCounter
						{label}
						{hint}
						value={game.rounds[game.round].players[p][key]}
						onChange={(v) => game.setField(p, key, v)}
					/>
				{/each}
				<NigiriWasabiInput player={p} />
				<CategoryCounter
					label="Pudding 🍮"
					hint="scored at end"
					value={game.rounds[game.round].players[p].pudding}
					onChange={(v) => game.setField(p, 'pudding', v)}
				/>
			</div>
		{/each}
	</div>
</div>

<style>
	.round-input {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--color-surface-raised);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-3);
	}

	.round-head {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-muted);
		text-align: center;
	}

	.columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-4);
	}

	.player-col {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.player-name {
		font-weight: 700;
		font-size: 0.9375rem;
		color: var(--color-primary-text);
		margin-bottom: var(--space-2);
		padding-bottom: var(--space-2);
		border-bottom: 2px solid var(--color-primary-bg);
	}
</style>

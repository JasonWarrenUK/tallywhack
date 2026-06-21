<script lang="ts">
	/**
	 * Final pudding carry-over reveal, shown in the finished phase.
	 * Displays pudding totals across all 3 rounds and the resulting ±6 award.
	 */
	import { game } from '../state/game.svelte.js';
	import type { PlayerId } from '$lib/modules/types.js';

	const result = $derived(game.finalResult);
	const players: PlayerId[] = [0, 1];
</script>

{#if result}
	<div class="pudding-tally">
		<div class="pudding-tally__head">🍮 Pudding</div>
		<div class="pudding-tally__grid">
			{#each players as p (p)}
				<div class="pudding-tally__player">
					<span class="pudding-tally__name">{game.names[p]}</span>
					<span class="pudding-tally__count">{result.detail.puddingTotals[p]} cards</span>
					<span
						class="pudding-tally__pts"
						class:pudding-tally__pts--pos={result.detail.puddingPoints[p] > 0}
						class:pudding-tally__pts--neg={result.detail.puddingPoints[p] < 0}
					>
						{result.detail.puddingPoints[p] > 0 ? '+' : ''}{result.detail.puddingPoints[p]}
					</span>
				</div>
			{/each}
		</div>
		{#if result.detail.puddingPoints[0] === 0 && result.detail.puddingPoints[1] === 0}
			<p class="pudding-tally__note">Equal pudding totals — no award</p>
		{/if}
	</div>
{/if}

<style>
	.pudding-tally {
		padding: var(--space-3);
		background: var(--color-primary-bg);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-3);
	}

	.pudding-tally__head {
		font-weight: 700;
		font-size: 0.9375rem;
		color: var(--color-primary-text);
		margin-bottom: var(--space-2);
	}

	.pudding-tally__grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
	}

	.pudding-tally__player {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.pudding-tally__name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-muted);
	}

	.pudding-tally__count {
		font-size: 0.875rem;
		color: var(--color-on-surface);
	}

	.pudding-tally__pts {
		font-size: 1.25rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--color-muted);
	}

	.pudding-tally__pts--pos { color: var(--color-primary-text); }
	.pudding-tally__pts--neg { color: var(--color-danger-text); }

	.pudding-tally__note {
		margin: var(--space-2) 0 0;
		font-size: 0.8125rem;
		color: var(--color-muted);
		text-align: center;
	}
</style>

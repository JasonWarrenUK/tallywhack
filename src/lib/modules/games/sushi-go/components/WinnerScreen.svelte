<script lang="ts">
	import { Button } from '$lib/components/index.js';
	import PuddingTally from './PuddingTally.svelte';
	import { game } from '../state/game.svelte.js';
	import type { PlayerId } from '$lib/modules/types.js';

	const result = $derived(game.finalResult);
	const winnerName = $derived(
		result?.winner !== null && result?.winner !== undefined
			? game.names[result.winner as PlayerId]
			: null
	);
	const playerIds: PlayerId[] = [0, 1];
</script>

{#if result}
	<div class="winner-screen">
		{#if winnerName}
			<p class="trophy" aria-hidden="true">🏆</p>
			<h2 class="winner-name">{winnerName} wins!</h2>
		{:else}
			<p class="trophy" aria-hidden="true">🤝</p>
			<h2 class="winner-name">It's a draw!</h2>
		{/if}

		<div class="final-scores">
			{#each playerIds as p (p)}
				<div
					class="final-score"
					class:final-score--winner={result.winner === p}
				>
					<span class="final-score__name">{game.names[p]}</span>
					<span class="final-score__value">{result.scores[p]}</span>
				</div>
			{/each}
		</div>

		<PuddingTally />

		<Button onclick={() => game.resetGame()}>New game</Button>
	</div>
{/if}

<style>
	.winner-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-6) var(--space-4);
		text-align: center;
	}

	.trophy {
		font-size: 4rem;
		margin: 0;
		line-height: 1;
	}

	.winner-name {
		margin: 0;
		font-size: clamp(1.5rem, 6vw, 2.25rem);
		font-weight: 700;
		color: var(--color-on-surface);
	}

	.final-scores {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-4);
		width: 100%;
		max-width: 320px;
	}

	.final-score {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-3);
		background: var(--color-surface-raised);
		border-radius: var(--radius-lg);
		border: 2px solid transparent;
	}

	.final-score--winner {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 25%, transparent);
	}

	.final-score__name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-muted);
	}

	.final-score__value {
		font-size: 2.5rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--color-primary-text);
		line-height: 1;
	}
</style>

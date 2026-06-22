<script lang="ts">
	import { Button } from '$lib/components/index.js';
	import { game } from '../state/game.svelte.js';
	import type { PlayerId } from '$lib/modules/types.js';

	const s0 = $derived(game.players[0].score);
	const s1 = $derived(game.players[1].score);
	const winner = $derived<PlayerId | null>(
		s0 > s1 ? 0 : s1 > s0 ? 1 : null
	);
	const winnerName = $derived(winner !== null ? game.players[winner].name : null);
</script>

<div class="winner-screen">
	{#if winnerName}
		<p class="trophy" aria-hidden="true">🏆</p>
		<h2 class="winner-name">{winnerName} wins!</h2>
	{:else}
		<p class="trophy" aria-hidden="true">🤝</p>
		<h2 class="winner-name">It's a draw!</h2>
	{/if}

	<div class="final-scores">
		{#each [0, 1] as p (p)}
			<div class="final-score" class:final-score--winner={winner === p}>
				<span class="final-score__name">{game.players[p].name}</span>
				<span class="final-score__value">{game.players[p].score}</span>
			</div>
		{/each}
	</div>

	<div class="stats">
		<span>Words: {game.history.filter((h) => h.type === 'word').length}</span>
		<span>High turn: {game.highTurn}</span>
	</div>

	<Button onclick={() => game.resetGame()}>New game</Button>
</div>

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

	.stats {
		display: flex;
		gap: var(--space-4);
		font-size: 0.875rem;
		color: var(--color-muted);
	}
</style>

<script lang="ts">
	import { game } from '../state/game.svelte.js';

	/** Reverse history so newest is at top. */
	const reversed = $derived([...game.history].reverse());
</script>

{#if game.history.length > 0}
	<div class="history">
		<h2 class="history__title">Turn history</h2>
		<ol class="history__list">
			{#each reversed as entry, i (reversed.length - 1 - i)}
				<li class="history__entry history__entry--{entry.type}">
					<span class="history__player">
						{entry.type === 'endgame' ? '—' : game.players[entry.player].name}
					</span>
					{#if entry.type === 'word'}
						<span class="history__detail">
							{#if entry.words.length > 0}
								{entry.words.map((w) => w.map((t) => t.letter).join('')).join(', ')}
							{:else}
								scored
							{/if}
							{#if entry.bingo}
								<span class="history__bingo" title="Bingo!">★</span>
							{/if}
						</span>
						<span class="history__points">+{entry.points}</span>
					{:else if entry.type === 'endgame'}
						<span class="history__detail">end-game adjustment</span>
						<span class="history__points">
							{entry.deltas[0] >= 0 ? '+' : ''}{entry.deltas[0]} /
							{entry.deltas[1] >= 0 ? '+' : ''}{entry.deltas[1]}
						</span>
					{:else}
						<span class="history__detail">{entry.label}</span>
						<span class="history__points">—</span>
					{/if}
				</li>
			{/each}
		</ol>
	</div>
{/if}

<style>
	.history {
		margin-top: var(--space-4);
	}

	.history__title {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-muted);
		margin: 0 0 var(--space-2);
	}

	.history__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.history__entry {
		display: grid;
		grid-template-columns: 6rem 1fr auto;
		align-items: baseline;
		gap: var(--space-2);
		font-size: 0.875rem;
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		background: var(--color-surface-raised);
	}

	.history__entry--endgame {
		background: color-mix(in srgb, var(--color-primary-bg) 60%, transparent);
	}

	.history__player {
		font-weight: 600;
		color: var(--color-on-surface);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.history__detail {
		color: var(--color-muted);
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		letter-spacing: 0.04em;
	}

	.history__bingo {
		color: var(--color-primary-text);
	}

	.history__points {
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--color-primary-text);
		text-align: right;
	}
</style>

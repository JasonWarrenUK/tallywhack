<script lang="ts">
	import { match } from '../state/match.svelte.js';
	import { scoreHand } from '../scoring/score.js';
</script>

<section class="log" class:log--empty={match.hands.length === 0}>
	<h3 class="log__head">This game</h3>

	{#if match.hands.length > 0}
		{#each match.hands as hand, i (i)}
			{@const result = scoreHand(hand, match.names, match.rules)}
			{@const w = result.pts[0] > result.pts[1] ? 0 : 1}
			<div class="row">
				<span class="num">{i + 1}</span>
				<span class="detail">{result.detail}</span>
				<span class="pts">+{result.pts[w]} {match.names[w]}</span>
				<button class="del" aria-label="Delete hand {i + 1}" onclick={() => match.removeHand(i)}>
					×
				</button>
			</div>
		{/each}
	{:else if !match.gameOver}
		<p class="hint">No hands yet — record the first hand above to start scoring.</p>
	{/if}
</section>

<style>
	.log {
		background: var(--color-surface-raised);
		border-radius: var(--radius-lg);
		padding: var(--space-3) var(--space-4);
		margin-bottom: var(--space-4);
	}

	.log--empty {
		opacity: 0.55;
	}

	.log__head {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-primary-text);
		margin: 0 0 var(--space-3);
	}

	.hint {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--color-muted);
		margin: 0;
	}

	.row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) 0;
		border-top: 1px solid var(--color-surface);
		font-size: 0.8125rem;
	}

	.num {
		font-family: var(--font-mono);
		color: var(--color-primary-text);
		opacity: 0.7;
		width: 1.5rem;
		flex-shrink: 0;
	}

	.detail {
		flex: 1;
		color: var(--color-on-surface);
	}

	.pts {
		font-family: var(--font-mono);
		font-weight: 500;
		color: var(--color-primary-text);
		white-space: nowrap;
	}

	.del {
		background: transparent;
		border: none;
		color: var(--color-muted);
		font-size: 1.125rem;
		line-height: 1;
		padding: 0 var(--space-1);
		cursor: pointer;
		transition: color 0.12s;
	}
	.del:hover {
		color: var(--color-danger);
	}
</style>

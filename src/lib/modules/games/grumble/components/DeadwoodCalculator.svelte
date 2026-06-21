<script lang="ts">
	import { Button } from '$lib/components/index.js';
	import { RANKS, cardValue, deadwood, type Rank } from '../scoring/cards.js';

	// onUse fires with the computed total; parent decides what to do with it.
	let { onUse }: { onUse: (total: number) => void } = $props();

	let open = $state(false);
	let cards = $state<Rank[]>([]);
	const total = $derived(deadwood(cards));
</script>

<Button variant="ghost" onclick={() => (open = !open)}>
	{open ? 'Hide' : 'Count cards'}
</Button>

{#if open}
	<div class="calc">
		<div class="grid">
			{#each RANKS as r (r)}
				<button class="card" onclick={() => (cards = [...cards, r])}>
					{r}<span class="val">{cardValue(r)}</span>
				</button>
			{/each}
		</div>
		<div class="foot">
			<span class="chips">{cards.join(' ') || 'tap cards in the losing hand…'}</span>
			<strong class="sum">{total}</strong>
			<Button
				onclick={() => {
					onUse(total);
					open = false;
					cards = [];
				}}
			>
				Use as opp deadwood
			</Button>
			<Button variant="ghost" onclick={() => (cards = [])}>Clear</Button>
		</div>
	</div>
{/if}

<style>
	.calc {
		background: var(--color-surface-raised);
		border-radius: var(--radius-md);
		padding: var(--space-3);
		margin-top: var(--space-2);
	}

	.grid {
		display: grid;
		/* Reflows gracefully on narrow phones; stays a single row on desktop. */
		grid-template-columns: repeat(auto-fit, minmax(38px, 1fr));
		gap: var(--space-1);
	}

	.card {
		background: var(--color-surface);
		border: 1.5px solid var(--color-muted);
		border-radius: var(--radius-sm);
		padding: var(--space-2) var(--space-1);
		font-family: var(--font-sans);
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-on-surface);
		display: flex;
		flex-direction: column;
		align-items: center;
		cursor: pointer;
		transition: background 0.12s;
	}
	.card:hover {
		background: var(--color-primary-bg);
		border-color: var(--color-primary);
	}

	.val {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		color: var(--color-muted);
		font-weight: 400;
		margin-top: 1px;
	}

	.foot {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-top: var(--space-3);
		flex-wrap: wrap;
	}

	.chips {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--color-muted);
		flex: 1;
		min-width: 120px;
	}

	.sum {
		font-size: 1.5rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--color-primary-text);
	}
</style>

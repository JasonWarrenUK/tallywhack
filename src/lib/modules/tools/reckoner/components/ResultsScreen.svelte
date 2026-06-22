<script lang="ts">
	/**
	 * Results screen — shows the consensus group ranking, grouped by category.
	 *
	 * Uses the stable categoryId grouping from `groupRanking` (bug fix: entries
	 * are never misfiled due to blank-named earlier categories).
	 */
	import { reckoner } from '../state/reckoner.svelte.js';
	import { Button } from '$lib/components/index.js';

	const TIER_LABELS: Record<number, string> = {
		0: 'Love it',
		1: 'Strong yes',
		2: "It's nice",
		3: 'Lukewarm',
		4: 'Not this one'
	};

	let activeGroupIdx = $state(0);
</script>

<div class="results">
	<h2 class="results-title">
		{reckoner.activityName || 'Results'}
	</h2>

	<!-- Category tabs (only shown when multiple active categories) -->
	{#if reckoner.rankedGroups.length > 1}
		<div class="tabs" role="tablist">
			{#each reckoner.rankedGroups as group, i (group.category?.id ?? 'all')}
				<button
					type="button"
					role="tab"
					aria-selected={activeGroupIdx === i}
					class="tab"
					class:active={activeGroupIdx === i}
					onclick={() => { activeGroupIdx = i; }}
				>
					{group.category?.label ?? 'All'}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Active group entries -->
	{#if reckoner.rankedGroups[activeGroupIdx]}
		{@const group = reckoner.rankedGroups[activeGroupIdx]}
		<ol class="rank-list">
			{#each group.entries as entry, rank (entry.id)}
				<li class="rank-item" class:top={entry.isTop}>
					<span class="rank-num" aria-label="Rank {rank + 1}">{rank + 1}</span>

					<div class="rank-content">
						<div class="rank-row">
							<span class="rank-text">{entry.text}</span>
							{#if entry.isTop}
								<span class="badge top-badge" title="Top pick">⭐</span>
							{/if}
							{#if entry.disagreement}
								<span class="badge disagree-badge" title="Significant disagreement">⚡</span>
							{/if}
						</div>

						<!-- Per-participant scores -->
						<div class="scores">
							{#each reckoner.participants as p (p.id)}
								<span class="score-pill" title="{p.name}: {TIER_LABELS[entry.scores[p.id] ?? 4]}">
									{p.name || `P${reckoner.participants.indexOf(p) + 1}`}:
									{TIER_LABELS[entry.scores[p.id] ?? 4]}
								</span>
							{/each}
						</div>
					</div>
				</li>
			{/each}
		</ol>

		{#if group.entries.length === 0}
			<p class="empty">No options in this category.</p>
		{/if}
	{/if}

	<!-- Legend -->
	<div class="legend">
		<span class="badge top-badge">⭐</span> everyone rated top 2
		<span class="badge disagree-badge" style:margin-left="var(--space-3)">⚡</span> big disagreement
	</div>

	<!-- Actions -->
	<div class="actions">
		<Button variant="ghost" onclick={() => reckoner.reRank()}>Re-rank</Button>
		<Button variant="ghost" onclick={() => reckoner.startOver()}>Start over</Button>
	</div>
</div>

<style>
	.results {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.results-title {
		font-size: 1.375rem;
		font-weight: 700;
		color: var(--color-on-surface);
		margin: 0;
		text-align: center;
	}

	.tabs {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.tab {
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-md);
		border: 1.5px solid var(--color-muted);
		background: var(--color-surface-raised);
		color: var(--color-on-surface);
		cursor: pointer;
		font-size: 0.875rem;
		transition: all 0.15s;
	}

	.tab.active,
	.tab[aria-selected='true'] {
		border-color: var(--color-primary);
		background: var(--color-primary-bg);
		color: var(--color-primary-text);
		font-weight: 600;
	}

	.rank-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.rank-item {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-3);
		background: var(--color-surface-raised);
		border-radius: var(--radius-md);
		border: 1.5px solid transparent;
		transition: border-color 0.15s;
	}

	.rank-item.top {
		border-color: var(--color-primary);
		background: var(--color-primary-bg);
	}

	.rank-num {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-primary-text);
		min-width: 2ch;
		text-align: right;
		flex-shrink: 0;
		padding-top: 1px;
	}

	.rank-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.rank-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.rank-text {
		font-weight: 600;
		color: var(--color-on-surface);
		font-size: 1rem;
	}

	.badge {
		font-size: 0.875rem;
		flex-shrink: 0;
	}

	/* .top-badge and .disagree-badge use the emoji's natural colour — no override needed */

	.scores {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	.score-pill {
		font-size: 0.6875rem;
		color: var(--color-muted);
		background: var(--color-surface);
		border-radius: var(--radius-sm);
		padding: 1px var(--space-2);
		white-space: nowrap;
	}

	.legend {
		font-size: 0.8125rem;
		color: var(--color-muted);
		text-align: center;
		padding-top: var(--space-2);
	}

	.empty {
		color: var(--color-muted);
		text-align: center;
		font-size: 0.875rem;
		padding: var(--space-4) 0;
		margin: 0;
	}

	.actions {
		display: flex;
		gap: var(--space-3);
		justify-content: center;
		padding-top: var(--space-2);
		border-top: 1px solid var(--color-muted);
	}
</style>

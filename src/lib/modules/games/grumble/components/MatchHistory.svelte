<script lang="ts">
	import { match } from '../state/match.svelte.js';
	import type { PlayerId } from '../scoring/types.js';

	const players: PlayerId[] = [0, 1];
</script>

{#if match.games.length > 0}
	<section class="log">
		<h3 class="log__head">Match history</h3>

		{#each match.games as g, i (i)}
			<div class="row">
				<span class="num">G{i + 1}</span>
				<div class="detail">
					{#each players as p (p)}
						{@const isWinner = g.winner === p}
						<span class="player-row" class:player-row--winner={isWinner}>
							<span class="pname">{g.names[p]}</span>
							<span class="breakdown">
								<span class="base">{g.base[p]}</span>
								{#if g.lines[p] > 0}
									<span class="bonus">
										+ {g.lines[p]} {g.lines[p] === 1 ? 'line' : 'lines'}
									</span>
								{/if}
								{#if isWinner}
									<span class="bonus">+ game bonus</span>
								{/if}
								<strong class="total">= {g.final[p]}</strong>
							</span>
						</span>
					{/each}
				</div>
				<span class="winner-label">{g.names[g.winner]} won</span>
			</div>
		{/each}

		<div class="final">
			Match: {match.names[0]} {match.matchTotals[0]} · {match.names[1]} {match.matchTotals[1]}
		</div>
	</section>
{:else}
	<section class="log log--empty">
		<h3 class="log__head">Match history</h3>
		<p class="hint">Finished games will appear here once you bank one.</p>
	</section>
{/if}

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
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-3) 0;
		border-top: 1px solid var(--color-surface);
		font-size: 0.75rem;
		flex-wrap: wrap;
	}

	.num {
		font-family: var(--font-mono);
		color: var(--color-primary-text);
		opacity: 0.7;
		width: 1.5rem;
		padding-top: 2px;
		flex-shrink: 0;
	}

	.detail {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.player-row {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		opacity: 0.65;
	}
	.player-row--winner {
		opacity: 1;
	}

	.pname {
		font-weight: 600;
		min-width: 60px;
		color: var(--color-on-surface);
	}

	.breakdown {
		display: flex;
		align-items: baseline;
		gap: var(--space-1);
		flex-wrap: wrap;
		color: var(--color-on-surface);
	}

	.base {
		font-family: var(--font-mono);
		font-weight: 500;
	}

	.bonus {
		font-family: var(--font-mono);
		color: var(--color-primary-text);
		font-size: 0.6875rem;
	}

	.total {
		font-weight: 700;
		margin-left: var(--space-1);
	}

	.winner-label {
		font-family: var(--font-mono);
		font-weight: 500;
		color: var(--color-primary-text);
		white-space: nowrap;
		padding-top: 2px;
	}

	.final {
		margin-top: var(--space-3);
		padding-top: var(--space-3);
		border-top: 1.5px solid var(--color-primary);
		font-family: var(--font-mono);
		font-size: 0.875rem;
		color: var(--color-primary-text);
		text-align: center;
	}
</style>

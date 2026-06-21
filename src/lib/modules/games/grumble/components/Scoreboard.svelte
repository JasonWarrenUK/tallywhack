<script lang="ts">
	import { ScoreCard, Button } from '$lib/components/index.js';
	import { match } from '../state/match.svelte.js';
	import type { PlayerId } from '../scoring/types.js';

	const players: PlayerId[] = [0, 1];
</script>

<div class="board">
	{#each players as p (p)}
		<ScoreCard
			name={match.names[p]}
			onNameChange={(v) => match.setName(p, v)}
			score={match.running[p]}
			highlight={match.gameOver && match.gameWinner === p ? 'winner' : match.gameWinner === p ? 'leader' : 'none'}
			subline="{match.lines[p]} {match.lines[p] === 1 ? 'line' : 'lines'}"
			footnote={match.games.length > 0 ? `match: ${match.matchTotals[p]}` : undefined}
			ariaLabelPrefix="Player {p + 1}"
		/>
	{/each}
</div>

{#if match.gameOver}
	<div class="game-over">
		<span class="game-over__text">
			{match.names[match.gameWinner]} crosses {match.rules.GAME_TARGET}. With bonuses:
			{match.names[0]} {match.preview[0]} · {match.names[1]} {match.preview[1]}
		</span>
		<Button onclick={() => match.bankGame()}>Bank game →</Button>
	</div>
{/if}

<style>
	.board {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	.game-over {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
		background: var(--color-primary-bg);
		border: 1.5px solid var(--color-primary);
		border-radius: var(--radius-md);
		padding: var(--space-3) var(--space-4);
		margin-bottom: var(--space-4);
	}

	.game-over__text {
		flex: 1;
		min-width: 0;
		font-size: 0.875rem;
		color: var(--color-primary-text);
	}
</style>

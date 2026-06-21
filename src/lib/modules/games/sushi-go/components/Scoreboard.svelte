<script lang="ts">
	import { ScoreCard } from '$lib/components/index.js';
	import { game } from '../state/game.svelte.js';
	import type { PlayerId } from '$lib/modules/types.js';

	const players: PlayerId[] = [0, 1];

	const highlight = $derived.by(() => {
		if (game.phase === 'finished' && game.finalResult) {
			const winner = game.finalResult.winner;
			return (p: PlayerId): 'winner' | 'none' => (p === winner ? 'winner' : 'none');
		}
		const s0 = game.cumulativeSubtotals[0];
		const s1 = game.cumulativeSubtotals[1];
		const leading = s0 > s1 ? 0 : s1 > s0 ? 1 : -1;
		return (p: PlayerId): 'leader' | 'none' => (p === leading ? 'leader' : 'none');
	});

	const scores = $derived.by(() => {
		if (game.phase === 'finished' && game.finalResult) {
			return (p: PlayerId) => game.finalResult!.scores[p];
		}
		return (p: PlayerId) => game.cumulativeSubtotals[p];
	});

	const roundPreviewPoints = $derived.by(() => {
		const preview = game.currentRoundPreview;
		return (p: PlayerId) => preview.breakdown[p].roundTotal;
	});
</script>

<div class="scoreboard">
	{#each players as p (p)}
		<ScoreCard
			name={game.names[p]}
			onNameChange={(v) => game.setName(p, v)}
			score={scores(p)}
			highlight={highlight(p)}
			subline="round {game.round + 1} preview: +{roundPreviewPoints(p)}"
		/>
	{/each}
</div>

<style>
	.scoreboard {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}
</style>

<script lang="ts">
	import { ScoreCard } from '$lib/components/index.js';
	import { game } from '../state/game.svelte.js';
	import type { PlayerId } from '$lib/modules/types.js';

	const players: PlayerId[] = [0, 1];

	/** Find the score of the last word-type turn for a given player (for delta badge). */
	function lastDelta(p: PlayerId): number | null {
		for (let i = game.history.length - 1; i >= 0; i--) {
			const h = game.history[i];
			if (h.type === 'word' && h.player === p) return h.points;
		}
		return null;
	}

	const scores = $derived(game.players.map((p) => p.score));
	const highlight = $derived.by(() => {
		if (game.phase === 'finished') {
			const winner = scores[0] > scores[1] ? 0 : scores[1] > scores[0] ? 1 : -1;
			return (i: number): 'winner' | 'none' => (i === winner ? 'winner' : 'none');
		}
		const leading = scores[0] > scores[1] ? 0 : scores[1] > scores[0] ? 1 : -1;
		return (i: number): 'leader' | 'none' => (i === leading ? 'leader' : 'none');
	});
</script>

<div class="scoreboard">
	{#each players as p (p)}
		<ScoreCard
			name={game.players[p].name}
			onNameChange={(v) => game.setName(p, v)}
			score={game.players[p].score}
			highlight={highlight(p)}
			active={game.phase === 'play' && game.current === p}
			delta={lastDelta(p)}
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

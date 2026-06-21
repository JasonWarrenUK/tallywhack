<script lang="ts">
	import { Button } from '$lib/components/index.js';
	import { game } from '../state/game.svelte.js';
	import type { PlayerId } from '$lib/modules/types.js';

	const preview = $derived(game.currentRoundPreview);

	/** Per-player round preview points for the current round. */
	function roundPoints(p: PlayerId): number {
		return preview.breakdown[p].roundTotal;
	}

	const buttonLabel = $derived(
		game.round < 2 ? `Score round ${game.round + 1} → Round ${game.round + 2}` : 'Score round 3 → Finish'
	);
</script>

<div class="round-flow">
	<div class="preview">
		<div class="preview__item">
			<span class="preview__name">{game.names[0]}</span>
			<span class="preview__pts">+{roundPoints(0)}</span>
		</div>
		<span class="preview__sep" aria-hidden="true">vs</span>
		<div class="preview__item preview__item--right">
			<span class="preview__name">{game.names[1]}</span>
			<span class="preview__pts">+{roundPoints(1)}</span>
		</div>
	</div>

	<Button onclick={() => game.advanceRound()} fullWidth>
		{buttonLabel}
	</Button>
</div>

<style>
	.round-flow {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}

	.preview {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3);
		background: var(--color-primary-bg);
		border-radius: var(--radius-md);
	}

	.preview__item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.preview__item--right {
		align-items: flex-end;
	}

	.preview__name {
		font-size: 0.8125rem;
		color: var(--color-muted);
		font-weight: 600;
	}

	.preview__pts {
		font-size: 1.5rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--color-primary-text);
	}

	.preview__sep {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-muted);
	}
</style>

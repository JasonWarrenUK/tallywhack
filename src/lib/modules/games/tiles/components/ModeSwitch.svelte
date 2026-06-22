<script lang="ts">
	import { SegmentedControl } from '$lib/components/index.js';
	import { game } from '../state/game.svelte.js';
	import type { Mode } from '../scoring/types.js';

	const options: { value: Mode; label: string }[] = [
		{ value: 'tiles', label: 'Tiles' },
		{ value: 'quick', label: 'Quick' }
	];
</script>

<div class="mode-switch">
	<SegmentedControl
		{options}
		value={game.mode}
		onChange={(m) => game.switchMode(m)}
		ariaLabel="Scoring mode"
	/>
	{#if game.mode === 'quick'}
		<p class="hint">Quick: enter final turn total directly — no tile breakdown.</p>
	{/if}
</div>

<style>
	.mode-switch {
		margin-bottom: var(--space-3);
	}

	.hint {
		margin: var(--space-2) 0 0;
		font-size: 0.75rem;
		color: var(--color-muted);
		text-align: center;
	}
</style>

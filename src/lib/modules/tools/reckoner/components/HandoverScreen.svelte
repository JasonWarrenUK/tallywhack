<script lang="ts">
	import { reckoner } from '../state/reckoner.svelte.js';
	import { Button } from '$lib/components/index.js';
</script>

<div class="handover">
	<div class="icon" aria-hidden="true">🤝</div>
	<h2>Hand over the device</h2>
	<p class="instruction">
		Pass to <strong>{reckoner.nextRater?.name || 'the next person'}</strong>.
	</p>
	<p class="sub">
		Make sure the previous rater steps away — ratings are private until the results screen.
	</p>
	<Button
		onclick={() => reckoner.confirmHandover()}
		fullWidth
	>
		I'm {reckoner.nextRater?.name || 'ready'} — start →
	</Button>
</div>

<style>
	.handover {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-8) var(--space-4);
	}

	.icon {
		font-size: 3rem;
		line-height: 1;
	}

	h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-on-surface);
		margin: 0;
	}

	.instruction {
		font-size: 1.125rem;
		color: var(--color-on-surface);
		margin: 0;
	}

	.sub {
		font-size: 0.875rem;
		color: var(--color-muted);
		margin: 0;
		max-width: 30ch;
	}
</style>

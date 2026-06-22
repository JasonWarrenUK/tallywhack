<script lang="ts">
	/**
	 * Combined screen — shown after both people have swiped.
	 * Displays a brief summary of the combined taste profile and lets them
	 * kick off the final Claude generation.
	 */
	import { babyName } from '../state/babyName.svelte.js';
	import { Button } from '$lib/components/index.js';

	const aName = $derived(babyName.profileA.person || 'Person A');
	const bName = $derived(babyName.profileB.person || 'Person B');
</script>

<div class="combined">
	<div class="icon" aria-hidden="true">✨</div>
	<h2>Both done!</h2>

	<div class="summary">
		<p class="summary-line">
			<strong>{aName}</strong> liked {babyName.profileA.ratings
				? Object.values(babyName.profileA.ratings).filter((r) => r === 'like').length
				: 0} names
		</p>
		<p class="summary-line">
			<strong>{bName}</strong> liked {babyName.profileB.ratings
				? Object.values(babyName.profileB.ratings).filter((r) => r === 'like').length
				: 0} names
		</p>
	</div>

	<p class="ready">
		Ready to generate names you'd both love?
	</p>

	{#if babyName.error}
		<p class="error-msg" role="alert">{babyName.error}</p>
	{/if}

	<Button
		fullWidth
		onclick={() => babyName.buildAndGenerateFinal()}
		disabled={babyName.loading}
	>
		{babyName.loading ? 'Generating names…' : 'Generate our names →'}
	</Button>
</div>

<style>
	.combined {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-6) var(--space-4);
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

	.summary {
		background: var(--color-surface-raised);
		border-radius: var(--radius-md);
		padding: var(--space-4) var(--space-5);
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.summary-line {
		font-size: 0.9375rem;
		color: var(--color-on-surface);
		margin: 0;
	}

	.ready {
		font-size: 1rem;
		color: var(--color-on-surface);
		margin: 0;
	}

	.error-msg {
		color: var(--color-danger);
		font-size: 0.875rem;
		margin: 0;
		padding: var(--space-2) var(--space-3);
		background: color-mix(in srgb, var(--color-danger) 10%, transparent);
		border-radius: var(--radius-md);
		width: 100%;
	}
</style>

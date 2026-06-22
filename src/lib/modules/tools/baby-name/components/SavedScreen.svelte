<script lang="ts">
	/**
	 * Saved/locked-in confirmation screen — the terminal 'done' step.
	 *
	 * Shows the shortlisted names read-only. "Start over" returns to the
	 * beginning for a fresh session.
	 */
	import { babyName } from '../state/babyName.svelte.js';
	import { Button } from '$lib/components/index.js';
</script>

<div class="saved">
	<div class="icon" aria-hidden="true">✅</div>
	<h2 class="title">Names locked in!</h2>
	<p class="hint">
		{babyName.profileA.person || 'Person A'} &amp; {babyName.profileB.person || 'Person B'}'s shortlist.
	</p>

	<ul class="name-list">
		{#each babyName.shortlist as suggestion}
			<li class="name-card">
				<div class="name-row">
					<span class="name">{suggestion.name}</span>
					<span class="heart" aria-hidden="true">♥</span>
				</div>
				<p class="meta">{suggestion.gender} · {suggestion.origin}</p>
				{#if suggestion.meaning}
					<p class="meaning">{suggestion.meaning}</p>
				{/if}
			</li>
		{/each}
	</ul>

	<div class="actions">
		<Button variant="ghost" fullWidth onclick={() => babyName.startOver()}>
			Start a new search
		</Button>
	</div>
</div>

<style>
	.saved {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		align-items: center;
		text-align: center;
	}

	.icon {
		font-size: 2.5rem;
		line-height: 1;
	}

	.title {
		font-size: 1.375rem;
		font-weight: 700;
		color: var(--color-on-surface);
		margin: 0;
	}

	.hint {
		font-size: 0.875rem;
		color: var(--color-muted);
		margin: calc(-1 * var(--space-2)) 0 0;
	}

	.name-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		width: 100%;
		text-align: left;
	}

	.name-card {
		padding: var(--space-3) var(--space-4);
		background: var(--color-primary-bg);
		border: 1.5px solid var(--color-primary);
		border-radius: var(--radius-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.name-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.name {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-on-surface);
	}

	.heart {
		font-size: 1rem;
		color: var(--color-primary-text);
	}

	.meta {
		font-size: 0.75rem;
		color: var(--color-muted);
		font-family: var(--font-mono);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin: 0;
	}

	.meaning {
		font-size: 0.875rem;
		color: var(--color-on-surface);
		margin: 0;
		opacity: 0.8;
		line-height: 1.4;
	}

	.actions {
		width: 100%;
		padding-top: var(--space-2);
		border-top: 1px solid var(--color-muted);
	}
</style>

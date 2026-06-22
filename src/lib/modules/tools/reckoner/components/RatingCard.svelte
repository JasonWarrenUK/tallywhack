<script lang="ts">
	/**
	 * RatingCard — shows the current entry for the current rater to assign
	 * to a tier. Enforces tier caps. Includes back navigation.
	 *
	 * Uses a CSS fade transition to animate between cards (ported from
	 * FadeCard in the React source).
	 */
	import { reckoner } from '../state/reckoner.svelte.js';
	import { Button } from '$lib/components/index.js';
	import type { Tier } from '../ranking/types.js';

	const TIERS: { id: Tier; label: string; icon: string }[] = [
		{ id: 0, label: 'Love it',     icon: '✦' },
		{ id: 1, label: 'Strong yes',  icon: '↑' },
		{ id: 2, label: "It's nice",   icon: '·' },
		{ id: 3, label: 'Lukewarm',    icon: '↓' },
		{ id: 4, label: 'Not this one', icon: '—' }
	];

	let visible = $state(true);

	/**
	 * Animate out, assign the tier, then fade back in on the next card.
	 */
	async function handleAssign(tier: Tier) {
		visible = false;
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					reckoner.assignTier(tier);
					visible = true;
					resolve();
				});
			});
		});
	}

	function handleBack() {
		visible = false;
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				reckoner.goBack();
				visible = true;
			});
		});
	}
</script>

<div class="rating-wrap">
	<!-- Progress indicator -->
	<div class="progress-bar" aria-label="Progress">
		<div
			class="progress-fill"
			style:width="{((reckoner.cardIndex) / reckoner.totalCards) * 100}%"
		></div>
	</div>

	<p class="progress-label">
		{reckoner.cardIndex + 1} / {reckoner.totalCards}
		— {reckoner.currentRater?.name || 'Unknown'} is rating
	</p>

	<!-- The card -->
	<div class="card" class:visible>
		{#if reckoner.currentEntry}
			{@const entry = reckoner.currentEntry}
			{@const cat = reckoner.categories.find((c) => c.id === entry.categoryId)}

			{#if cat && cat.label}
				<span class="card-cat">{cat.label}</span>
			{/if}

			<p class="card-text">{entry.text}</p>

			{#if entry.suggestedBy}
				<p class="card-by">suggested by {entry.suggestedBy}</p>
			{/if}
		{/if}
	</div>

	<!-- Tier buttons -->
	<div class="tier-grid">
		{#each TIERS as tier}
			{@const count = reckoner.currentCatTierCounts[tier.id]}
			{@const cap   = reckoner.tierCap(reckoner.currentCatSize, tier.id)}
			{@const isCapped = count >= cap}
			<button
				type="button"
				class="tier-btn"
				class:capped={isCapped}
				disabled={isCapped}
				onclick={() => handleAssign(tier.id)}
				aria-label="{tier.label} ({count}/{cap})"
			>
				<span class="tier-icon">{tier.icon}</span>
				<span class="tier-label">{tier.label}</span>
				<span class="tier-count">{count}/{cap}</span>
			</button>
		{/each}
	</div>

	<!-- Back / navigation -->
	<div class="nav">
		{#if reckoner.cardIndex > 0}
			<Button variant="ghost" onclick={handleBack}>← Back</Button>
		{:else}
			<span></span>
		{/if}
	</div>
</div>

<style>
	.rating-wrap {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.progress-bar {
		height: 4px;
		background: var(--color-muted);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--color-primary);
		border-radius: 2px;
		transition: width 0.25s ease;
	}

	.progress-label {
		font-size: 0.8125rem;
		color: var(--color-muted);
		text-align: center;
		margin: 0;
		font-family: var(--font-mono);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	/* Fade card animation */
	.card {
		background: var(--color-surface-raised);
		border-radius: var(--radius-lg);
		padding: var(--space-6) var(--space-5);
		text-align: center;
		min-height: 10rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		opacity: 0;
		transition: opacity 0.18s ease;
	}

	.card.visible {
		opacity: 1;
	}

	.card-cat {
		font-size: 0.75rem;
		font-family: var(--font-mono);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-primary-text);
		background: var(--color-primary-bg);
		padding: 2px var(--space-2);
		border-radius: var(--radius-sm);
	}

	.card-text {
		font-size: clamp(1.25rem, 5vw, 1.75rem);
		font-weight: 700;
		color: var(--color-on-surface);
		margin: 0;
	}

	.card-by {
		font-size: 0.8125rem;
		color: var(--color-muted);
		margin: 0;
		font-style: italic;
	}

	/* Tier grid — 2 × 3 layout (or 5 in a column on narrower) */
	.tier-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-2);
	}

	.tier-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: var(--space-3) var(--space-2);
		border: 1.5px solid var(--color-muted);
		border-radius: var(--radius-md);
		background: var(--color-surface-raised);
		cursor: pointer;
		transition: all 0.15s;
	}

	.tier-btn:not(:disabled):hover {
		border-color: var(--color-primary);
		background: var(--color-primary-bg);
	}

	.tier-btn.capped,
	.tier-btn:disabled {
		opacity: 0.38;
		cursor: not-allowed;
	}

	.tier-icon {
		font-size: 1.25rem;
		line-height: 1;
	}

	.tier-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-on-surface);
	}

	.tier-count {
		font-size: 0.6875rem;
		color: var(--color-muted);
		font-family: var(--font-mono);
	}

	.nav {
		display: flex;
		justify-content: flex-start;
	}
</style>

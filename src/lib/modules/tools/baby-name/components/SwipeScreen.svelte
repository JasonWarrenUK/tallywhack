<script lang="ts">
	/**
	 * Swipe screen — shows one name at a time for taste-refinement rating.
	 * Three ratings: like, neutral, dislike. Advances through 20 examples.
	 */
	import { babyName } from '../state/babyName.svelte.js';
	import { Button } from '$lib/components/index.js';
	import type { Rating } from '../naming/types.js';

	interface Props {
		person: 'A' | 'B';
	}
	let { person }: Props = $props();

	const label    = $derived(person === 'A' ? (babyName.profileA.person || 'Person A') : (babyName.profileB.person || 'Person B'));
	const progress = $derived(`${babyName.activeProfile.currentIndex + 1} / ${babyName.totalExamples}`);

	let visible = $state(true);

	async function rate(rating: Rating) {
		visible = false;
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					babyName.rateExample(person, rating);
					visible = true;
					resolve();
				});
			});
		});
	}
</script>

<div class="swipe">
	<div class="progress-bar" aria-label="Progress">
		<div
			class="progress-fill"
			style:width="{((babyName.activeProfile.currentIndex) / babyName.totalExamples) * 100}%"
		></div>
	</div>

	<p class="progress-label">{label}: {progress}</p>

	{#if babyName.currentExample}
		{@const example = babyName.currentExample}
		<div class="card" class:visible>
			<p class="name">{example.name}</p>
			<p class="meta">{example.gender} · {example.origin}</p>
		</div>
	{/if}

	<div class="actions">
		<Button variant="danger" onclick={() => rate('dislike')} aria-label="Dislike">✕ No</Button>
		<Button variant="ghost"  onclick={() => rate('neutral')} aria-label="Neutral">· Meh</Button>
		<Button            onclick={() => rate('like')}    aria-label="Like">♥ Yes</Button>
	</div>
</div>

<style>
	.swipe {
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

	.card {
		background: var(--color-surface-raised);
		border-radius: var(--radius-lg);
		padding: var(--space-8) var(--space-5);
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

	.name {
		font-size: clamp(2rem, 10vw, 3rem);
		font-weight: 700;
		color: var(--color-on-surface);
		margin: 0;
		letter-spacing: -0.02em;
	}

	.meta {
		font-size: 0.875rem;
		color: var(--color-muted);
		font-family: var(--font-mono);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin: 0;
	}

	.actions {
		display: flex;
		gap: var(--space-3);
		justify-content: center;
	}
</style>

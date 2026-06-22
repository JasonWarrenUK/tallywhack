<script lang="ts">
	import PlayerNameInput from './PlayerNameInput.svelte';

	interface Props {
		name: string;
		/** Provide to make the name editable; omit for read-only display. */
		onNameChange?: (value: string) => void;
		score: number;
		/** 'leader' = crown/subtle accent; 'winner' = strong border + glow. */
		highlight?: 'none' | 'leader' | 'winner';
		/** Tiles uses this to mark the player whose turn it is. */
		active?: boolean;
		/** Secondary line below the score (e.g. '2 lines'). */
		subline?: string;
		/** Tertiary line for running totals (e.g. 'match: 47'). */
		footnote?: string;
		/**
		 * Point delta badge from the last turn (e.g. +12 in Tiles).
		 * Pass `null` or omit to hide.
		 */
		delta?: number | null;
		ariaLabelPrefix?: string;
	}

	let {
		name,
		onNameChange,
		score,
		highlight = 'none',
		active = false,
		subline,
		footnote,
		delta = null,
		ariaLabelPrefix = 'Player'
	}: Props = $props();

	const showDelta = $derived(delta !== null && delta !== undefined);
	const deltaPositive = $derived((delta ?? 0) >= 0);
</script>

<div
	class="score-card"
	class:score-card--leader={highlight === 'leader'}
	class:score-card--winner={highlight === 'winner'}
	class:score-card--active={active}
>
	<div class="score-card__header">
		{#if highlight === 'leader' || highlight === 'winner'}
			<span class="score-card__crown" aria-hidden="true">♛</span>
		{/if}
		{#if active}
			<span class="score-card__turn-flag">to play</span>
		{/if}
	</div>

	<div class="score-card__name">
		{#if onNameChange}
			<PlayerNameInput
				value={name}
				onInput={onNameChange}
				ariaLabel="{ariaLabelPrefix} name"
				align="center"
				variant="inline"
			/>
		{:else}
			<span class="score-card__name-text">{name}</span>
		{/if}
	</div>

	<div class="score-card__score-row">
		<span class="score-card__score" aria-label="{name}: {score} points">
			{score}
		</span>
		{#if showDelta}
			<span
				class="score-card__delta"
				class:score-card__delta--positive={deltaPositive}
				class:score-card__delta--negative={!deltaPositive}
			>
				{(delta ?? 0) >= 0 ? '+' : ''}{delta}
			</span>
		{/if}
	</div>

	{#if subline}
		<p class="score-card__subline">{subline}</p>
	{/if}

	{#if footnote}
		<p class="score-card__footnote">{footnote}</p>
	{/if}
</div>

<style>
	.score-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-4) var(--space-3);
		background: var(--color-surface-raised);
		border-radius: var(--radius-lg);
		border: 2px solid transparent;
		text-align: center;
		transition: border-color 0.2s, box-shadow 0.2s;
		min-width: 0;
	}

	.score-card--active {
		border-color: var(--color-primary);
	}

	.score-card--leader {
		border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
	}

	.score-card--winner {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 25%, transparent);
	}

	.score-card__header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 1.25rem;
	}

	.score-card__crown {
		font-size: 0.875rem;
		color: var(--color-primary-text);
	}

	.score-card__turn-flag {
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-primary-text);
		background: var(--color-primary-bg);
		padding: 1px var(--space-2);
		border-radius: var(--radius-sm);
	}

	.score-card__name {
		width: 100%;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-on-surface);
	}

	.score-card__name-text {
		display: block;
		text-align: center;
	}

	.score-card__score-row {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
	}

	.score-card__score {
		font-size: clamp(2.5rem, 12vw, 3.5rem);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--color-primary-text);
		line-height: 1;
		letter-spacing: -0.02em;
	}

	.score-card__delta {
		font-size: 0.875rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.score-card__delta--positive {
		color: var(--color-primary-text);
	}
	.score-card__delta--negative {
		color: var(--color-danger-text);
	}

	.score-card__subline {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-muted);
	}

	.score-card__footnote {
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-muted);
	}
</style>

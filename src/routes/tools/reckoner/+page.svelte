<script lang="ts">
	import { reckoner } from '$lib/modules/tools/reckoner/state/reckoner.svelte.js';
	import SetupScreen   from '$lib/modules/tools/reckoner/components/SetupScreen.svelte';
	import RatingCard    from '$lib/modules/tools/reckoner/components/RatingCard.svelte';
	import HandoverScreen from '$lib/modules/tools/reckoner/components/HandoverScreen.svelte';
	import ResultsScreen from '$lib/modules/tools/reckoner/components/ResultsScreen.svelte';
</script>

<svelte:head>
	<title>Reckoner — Tallywhack</title>
</svelte:head>

<main>
	<header>
		<div class="icon" aria-hidden="true">⚖️</div>
		<h1>Reckoner</h1>
		<p class="subtitle">Group ranking tool</p>
	</header>

	{#if reckoner.phase === 'setup'}
		<SetupScreen />
	{:else if reckoner.phase === 'rating'}
		<RatingCard />
	{:else if reckoner.phase === 'handover'}
		<HandoverScreen />
	{:else if reckoner.phase === 'results'}
		<ResultsScreen />
	{/if}
</main>

<style>
	main {
		min-height: 100dvh;
		background: var(--color-surface);
		font-family: var(--font-sans);
		color: var(--color-on-surface);
		padding: var(--space-6) var(--space-4) 4rem;
		max-width: 640px;
		margin-inline: auto;
	}

	header {
		text-align: center;
		margin-bottom: var(--space-6);
	}

	.icon {
		font-size: 2rem;
		line-height: 1;
		margin-bottom: var(--space-1);
	}

	h1 {
		font-size: clamp(1.75rem, 7vw, 2.5rem);
		font-weight: 700;
		margin: 0;
		color: var(--color-on-surface);
		letter-spacing: -0.02em;
	}

	.subtitle {
		margin: var(--space-1) 0 0;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--color-primary-text);
	}
</style>

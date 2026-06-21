<script lang="ts">
	import { game } from '$lib/modules/games/sushi-go/state/game.svelte.js';
	import Scoreboard from '$lib/modules/games/sushi-go/components/Scoreboard.svelte';
	import RoundInputPanel from '$lib/modules/games/sushi-go/components/RoundInput.svelte';
	import RoundFlow from '$lib/modules/games/sushi-go/components/RoundFlow.svelte';
	import WinnerScreen from '$lib/modules/games/sushi-go/components/WinnerScreen.svelte';
	import HelpPanel from '$lib/modules/games/sushi-go/components/HelpPanel.svelte';
</script>

<svelte:head>
	<title>Sushi Go! — Tallywhack</title>
</svelte:head>

<main>
	<header>
		<div class="icon" aria-hidden="true">🍣</div>
		<h1>Sushi Go!</h1>
		<p class="subtitle">Card game scorer</p>
	</header>

	<Scoreboard />

	{#if game.phase === 'finished'}
		<WinnerScreen />
	{:else}
		<RoundInputPanel />
		<RoundFlow />
	{/if}

	<HelpPanel />
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

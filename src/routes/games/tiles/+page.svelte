<script lang="ts">
	import { game } from '$lib/modules/games/tiles/state/game.svelte.js';
	import Scoreboard from '$lib/modules/games/tiles/components/Scoreboard.svelte';
	import ModeSwitch from '$lib/modules/games/tiles/components/ModeSwitch.svelte';
	import WordEditor from '$lib/modules/games/tiles/components/WordEditor.svelte';
	import QuickEntry from '$lib/modules/games/tiles/components/QuickEntry.svelte';
	import TurnActions from '$lib/modules/games/tiles/components/TurnActions.svelte';
	import EndgamePanel from '$lib/modules/games/tiles/components/EndgamePanel.svelte';
	import WinnerScreen from '$lib/modules/games/tiles/components/WinnerScreen.svelte';
	import HistoryList from '$lib/modules/games/tiles/components/HistoryList.svelte';
	import HelpPanel from '$lib/modules/games/tiles/components/HelpPanel.svelte';
</script>

<svelte:head>
	<title>Tiles — Tallywhack</title>
</svelte:head>

<main>
	<header>
		<div class="icon" aria-hidden="true">🔠</div>
		<h1>Tiles</h1>
		<p class="subtitle">Scrabble scorer</p>
	</header>

	<Scoreboard />

	{#if game.phase === 'finished'}
		<WinnerScreen />
	{:else if game.phase === 'endgame'}
		<EndgamePanel />
	{:else}
		<ModeSwitch />
		{#if game.mode === 'tiles'}
			<WordEditor />
		{:else}
			<QuickEntry />
		{/if}
		<TurnActions />
	{/if}

	<HelpPanel />
	<HistoryList />
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

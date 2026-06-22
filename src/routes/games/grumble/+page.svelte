<script lang="ts">
	import { match } from '$lib/modules/games/grumble/state/match.svelte.js';
	import Scoreboard from '$lib/modules/games/grumble/components/Scoreboard.svelte';
	import HandEntry from '$lib/modules/games/grumble/components/HandEntry.svelte';
	import HandLog from '$lib/modules/games/grumble/components/HandLog.svelte';
	import MatchHistory from '$lib/modules/games/grumble/components/MatchHistory.svelte';
	import HelpPanel from '$lib/modules/games/grumble/components/HelpPanel.svelte';
	import SetupPanel from '$lib/modules/games/grumble/components/SetupPanel.svelte';
</script>

<svelte:head>
	<title>Grumble — Tallywhack</title>
</svelte:head>

<main>
	<header>
		<div class="suit" aria-hidden="true">♠ ♥ ♦ ♣</div>
		<h1>Gin Rummy</h1>
		<div class="target">game to {match.rules.GAME_TARGET}</div>
	</header>

	<SetupPanel />
	<Scoreboard />
	<HelpPanel />
	<HandEntry />
	<HandLog />
	<MatchHistory />
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

	.suit {
		letter-spacing: 0.5em;
		color: var(--color-primary-text);
		font-size: 0.875rem;
		opacity: 0.7;
		margin-bottom: var(--space-1);
	}

	h1 {
		font-size: clamp(1.75rem, 7vw, 2.5rem);
		font-weight: 700;
		margin: var(--space-1) 0 0;
		color: var(--color-on-surface);
		letter-spacing: -0.02em;
	}

	.target {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-primary-text);
		text-transform: uppercase;
		letter-spacing: 0.12em;
		margin-top: var(--space-1);
	}
</style>

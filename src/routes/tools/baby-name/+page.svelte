<script lang="ts">
	import { babyName } from '$lib/modules/tools/baby-name/state/babyName.svelte.js';
	import IntroScreen      from '$lib/modules/tools/baby-name/components/IntroScreen.svelte';
	import PreferencesScreen from '$lib/modules/tools/baby-name/components/PreferencesScreen.svelte';
	import SwipeScreen      from '$lib/modules/tools/baby-name/components/SwipeScreen.svelte';
	import CombinedScreen   from '$lib/modules/tools/baby-name/components/CombinedScreen.svelte';
	import FinalNamesScreen from '$lib/modules/tools/baby-name/components/FinalNamesScreen.svelte';
</script>

<svelte:head>
	<title>Baby Name Chooser — Tallywhack</title>
</svelte:head>

<main>
	<header>
		<div class="icon" aria-hidden="true">👶</div>
		<h1>Baby Name Chooser</h1>
		<p class="subtitle">Find a name you both love</p>
	</header>

	{#if babyName.step === 'intro'}
		<IntroScreen />

	{:else if babyName.step === 'personA:prefs'}
		<PreferencesScreen person="A" />

	{:else if babyName.step === 'personA:swipes'}
		<SwipeScreen person="A" />

	{:else if babyName.step === 'personB:prefs'}
		<!-- Shows a brief note that it's now person B's turn at the top -->
		<div class="handover-note">
			<p>
				{babyName.profileA.person || 'Person A'} is done. Hand to
				<strong>{babyName.profileB.person || 'Person B'}</strong>.
			</p>
		</div>
		<PreferencesScreen person="B" />

	{:else if babyName.step === 'personB:swipes'}
		<SwipeScreen person="B" />

	{:else if babyName.step === 'combined'}
		<CombinedScreen />

	{:else if babyName.step === 'final:loading'}
		<div class="loading-screen">
			<div class="spinner" aria-label="Generating names…"></div>
			<p>Finding names you'd both love…</p>
		</div>

	{:else if babyName.step === 'final:names'}
		<FinalNamesScreen />

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

	.handover-note {
		background: var(--color-primary-bg);
		border-radius: var(--radius-md);
		padding: var(--space-3) var(--space-4);
		margin-bottom: var(--space-5);
		text-align: center;
		font-size: 0.9375rem;
		color: var(--color-on-surface);
	}

	.loading-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-10) 0;
	}

	.loading-screen p {
		color: var(--color-muted);
		font-size: 0.9375rem;
		margin: 0;
	}

	/* Simple CSS spinner */
	.spinner {
		width: 2.5rem;
		height: 2.5rem;
		border: 3px solid var(--color-muted);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>

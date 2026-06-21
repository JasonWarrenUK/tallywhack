<svelte:head>
	<title>Tallywhack</title>
</svelte:head>

<main>
	<h1>Tallywhack</h1>
	<p>Keep score. Keep score of who's winning at keeping score.</p>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100dvh;
		padding: var(--space-6);
		max-width: 480px;
		margin-inline: auto;
		text-align: center;
	}

	h1 {
		font-size: clamp(2rem, 8vw, 3rem);
		font-weight: 700;
		color: var(--color-primary-text);
		margin: 0 0 var(--space-4);
		letter-spacing: -0.02em;
	}

	p {
		font-size: 1.125rem;
		color: var(--color-muted);
		margin: 0;
	}
</style>

<script lang="ts">
	import { registry } from '$lib/modules/discover';

	/** Non-empty category groups in registry-stable order (games → tools). */
	const groups = registry.categories().filter((g) => g.modules.length > 0);
</script>

<svelte:head>
	<title>Tallywhack</title>
</svelte:head>

<main>
	<header>
		<h1>Tallywhack</h1>
		<p class="tagline">Keep score. Keep score of who's winning at keeping score.</p>
	</header>

	{#each groups as group (group.category)}
		<section class="category">
			<h2 class="category__title">{group.category}</h2>
			<ul class="card-grid">
				{#each group.modules as m (m.id)}
					<li>
						<a class="card" href={m.routes[0]} data-palette={m.theme}>
							<span class="card__icon" aria-hidden="true">{m.icon}</span>
							<span class="card__name">{m.name}</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
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
		margin-bottom: var(--space-8);
	}

	h1 {
		font-size: clamp(2rem, 8vw, 3rem);
		font-weight: 700;
		color: var(--color-primary-text);
		margin: 0 0 var(--space-2);
		letter-spacing: -0.02em;
	}

	.tagline {
		font-size: 1rem;
		color: var(--color-muted);
		margin: 0;
	}

	/* Category section */

	.category {
		margin-bottom: var(--space-6);
	}

	.category__title {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-muted);
		margin: 0 0 var(--space-3);
	}

	/* Card grid */

	.card-grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
		gap: var(--space-3);
	}

	/* Individual card — each sets its own data-palette so the semantic vars
	   resolve to the module's own colour token. */

	.card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		min-height: 7rem;
		padding: var(--space-4) var(--space-3);
		background: var(--color-primary-bg);
		border: 2px solid var(--color-primary);
		border-radius: var(--radius-lg);
		color: var(--color-primary-text);
		text-decoration: none;
		transition: box-shadow 0.15s ease, border-color 0.15s ease;
	}

	.card:hover {
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 25%, transparent);
	}

	.card:focus-visible {
		outline: none;
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 40%, transparent);
	}

	@media (prefers-reduced-motion: reduce) {
		.card {
			transition: none;
		}
	}

	.card__icon {
		font-size: 2rem;
		line-height: 1;
	}

	.card__name {
		font-size: 0.9375rem;
		font-weight: 600;
		text-align: center;
	}
</style>

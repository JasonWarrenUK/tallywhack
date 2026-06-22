<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { registry } from '$lib/modules/discover';
	import { resolvePalette, resolveModuleByPath } from '$lib/modules/palette';
	import { theme } from '$lib/state/theme.svelte.js';
	import { SegmentedControl } from '$lib/components/index.js';
	import type { ThemeChoice } from '$lib/state/theme.js';

	let { children } = $props();

	const palette      = $derived(resolvePalette(registry, page.url.pathname));
	const activeModule = $derived(resolveModuleByPath(registry, page.url.pathname));

	// Typed options so SegmentedControl infers V = ThemeChoice rather than string.
	const themeOptions: { value: ThemeChoice; label: string }[] = [
		{ value: 'light',  label: 'Light' },
		{ value: 'dark',   label: 'Dark' },
		{ value: 'system', label: 'System' }
	];

	onMount(() => {
		// Wire up the matchMedia listener so the app follows live OS changes
		// while in 'system' mode. SSR-guarded inside init().
		theme.init();
	});
</script>

<div data-palette={palette} style="display: contents">
	{#if activeModule}
		<a class="back-to-hub" href="/" aria-label="Back to hub">
			<span aria-hidden="true">←</span>
			<span aria-hidden="true">{activeModule.icon}</span>
			<span>Hub</span>
		</a>
	{/if}

	<div class="theme-switch">
		<SegmentedControl
			ariaLabel="Colour theme"
			options={themeOptions}
			value={theme.choice}
			onChange={(v) => theme.set(v)}
		/>
	</div>

	{@render children()}
</div>

<style>
	.back-to-hub {
		position: fixed;
		top: var(--space-3);
		left: var(--space-3);
		z-index: 10;
		display: flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1) var(--space-3);
		background: var(--color-surface-raised);
		border: 1.5px solid var(--color-muted);
		border-radius: var(--radius-md);
		color: var(--color-on-surface);
		text-decoration: none;
		font-size: 0.875rem;
		font-family: var(--font-sans);
		transition: border-color 0.15s, background 0.15s;
	}

	.back-to-hub:hover {
		border-color: var(--color-primary);
		background: var(--color-primary-bg);
		color: var(--color-primary-text);
	}

	.back-to-hub:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.theme-switch {
		position: fixed;
		top: var(--space-3);
		right: var(--space-3);
		z-index: 10;
	}
</style>

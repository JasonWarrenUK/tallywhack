<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Header text. Required when collapsible; optional for static panels. */
		title?: string;
		/** When true, render a toggle button to show/hide the body. */
		collapsible?: boolean;
		/** Controls open/closed state when collapsible. Bindable. */
		open?: boolean;
		children: Snippet;
	}

	let {
		title,
		collapsible = false,
		open = $bindable(false),
		children
	}: Props = $props();
</script>

<section class="panel" class:panel--collapsible={collapsible}>
	{#if collapsible}
		<button
			type="button"
			class="panel__toggle"
			aria-expanded={open}
			onclick={() => (open = !open)}
		>
			<span class="panel__toggle-title">{title}</span>
			<span class="panel__toggle-icon" aria-hidden="true">{open ? '▲' : '▼'}</span>
		</button>
		{#if open}
			<div class="panel__body">
				{@render children()}
			</div>
		{/if}
	{:else}
		{#if title}
			<h2 class="panel__title">{title}</h2>
		{/if}
		<div class="panel__body">
			{@render children()}
		</div>
	{/if}
</section>

<style>
	.panel {
		background: var(--color-surface-raised);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.panel__toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: var(--space-3) var(--space-4);
		background: none;
		border: none;
		cursor: pointer;
		font-family: var(--font-sans);
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-on-surface);
		text-align: left;
		transition: background 0.15s;
	}

	.panel__toggle:hover {
		background: color-mix(in srgb, var(--color-primary) 8%, transparent);
	}

	.panel__toggle-title {
		flex: 1;
	}

	.panel__toggle-icon {
		font-size: 0.7rem;
		color: var(--color-muted);
		margin-left: var(--space-2);
	}

	.panel__title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-on-surface);
		margin: 0;
		padding: var(--space-3) var(--space-4);
	}

	.panel__body {
		padding: var(--space-3) var(--space-4) var(--space-4);
	}
</style>

<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Visual style of the button. Defaults to 'primary'. */
		variant?: 'primary' | 'ghost' | 'danger';
		type?: 'button' | 'submit';
		disabled?: boolean;
		/** Stretch to full container width. */
		fullWidth?: boolean;
		onclick?: (e: MouseEvent) => void;
		'aria-label'?: string;
		/** For toggle buttons — drives the aria-pressed attribute and pressed styling. */
		'aria-pressed'?: boolean;
		children: Snippet;
	}

	let {
		variant = 'primary',
		type = 'button',
		disabled = false,
		fullWidth = false,
		onclick,
		'aria-label': ariaLabel,
		'aria-pressed': ariaPressed,
		children
	}: Props = $props();
</script>

<button
	{type}
	{disabled}
	class="btn btn--{variant}"
	class:btn--full={fullWidth}
	class:btn--pressed={ariaPressed}
	aria-label={ariaLabel}
	aria-pressed={ariaPressed}
	{onclick}
>
	{@render children()}
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		border: 2px solid transparent;
		border-radius: var(--radius-md);
		font-family: var(--font-sans);
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.25;
		cursor: pointer;
		transition: background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s;
		white-space: nowrap;
		text-decoration: none;
		user-select: none;
	}

	.btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.btn--full {
		width: 100%;
	}

	/* Primary — palette-driven accent */
	.btn--primary {
		background: var(--color-primary);
		color: #fff;
		border-color: var(--color-primary);
	}
	.btn--primary:not(:disabled):hover {
		filter: brightness(1.1);
	}
	.btn--primary:not(:disabled):active {
		filter: brightness(0.95);
	}

	/* Ghost — transparent with muted border */
	.btn--ghost {
		background: transparent;
		color: var(--color-on-surface);
		border-color: var(--color-muted);
	}
	.btn--ghost:not(:disabled):hover {
		background: var(--color-surface-raised);
		border-color: var(--color-on-surface);
	}
	.btn--ghost.btn--pressed {
		background: var(--color-primary-bg);
		color: var(--color-primary-text);
		border-color: var(--color-primary);
	}

	/* Danger — destructive actions */
	.btn--danger {
		background: transparent;
		color: var(--color-danger);
		border-color: var(--color-danger);
	}
	.btn--danger:not(:disabled):hover {
		background: var(--color-danger);
		color: #fff;
	}
</style>

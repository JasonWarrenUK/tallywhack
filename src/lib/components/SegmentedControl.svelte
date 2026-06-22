<script lang="ts" generics="V extends string | number">
	interface Option {
		value: V;
		label: string;
	}

	interface Props {
		options: Option[];
		value: V;
		onChange?: (value: V) => void;
		/** Visible label above the control. */
		label?: string;
		/** aria-label for the radiogroup when no visible label is provided. */
		ariaLabel?: string;
		disabled?: boolean;
	}

	let {
		options,
		value = $bindable(),
		onChange,
		label,
		ariaLabel,
		disabled = false
	}: Props = $props();

	function select(v: V) {
		if (disabled) return;
		value = v;
		onChange?.(v);
	}
</script>

<div class="seg" role="group" aria-label={ariaLabel ?? label}>
	{#if label}
		<span class="seg__label">{label}</span>
	{/if}
	<div class="seg__options" role="radiogroup">
		{#each options as opt (opt.value)}
			<button
				type="button"
				role="radio"
				class="seg__option"
				class:seg__option--selected={value === opt.value}
				aria-checked={value === opt.value}
				{disabled}
				onclick={() => select(opt.value)}
			>
				{opt.label}
			</button>
		{/each}
	</div>
</div>

<style>
	.seg {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.seg__label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.seg__options {
		display: flex;
		gap: 2px;
		background: var(--color-surface-raised);
		border-radius: var(--radius-md);
		padding: 3px;
	}

	.seg__option {
		flex: 1;
		padding: var(--space-2) var(--space-3);
		border: none;
		border-radius: calc(var(--radius-md) - 3px);
		background: transparent;
		font-family: var(--font-sans);
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--color-muted);
		cursor: pointer;
		transition: background 0.12s, color 0.12s;
		white-space: nowrap;
	}

	.seg__option:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.seg__option--selected {
		background: var(--color-primary);
		color: #fff;
		font-weight: 600;
	}

	.seg__option:not(:disabled):not(.seg__option--selected):hover {
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
		color: var(--color-primary-text);
	}
</style>

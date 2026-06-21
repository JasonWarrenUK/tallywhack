<script lang="ts">
	interface Props {
		value: number;
		onChange?: (value: number) => void;
		min?: number;
		max?: number;
		step?: number;
		label?: string;
		ariaLabel?: string;
		/** Show the − / + buttons. Set to false for a bare numeric field. */
		showButtons?: boolean;
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
	}

	let {
		value = $bindable(0),
		onChange,
		min = 0,
		max = Infinity,
		step = 1,
		label,
		ariaLabel,
		showButtons = true,
		size = 'md',
		disabled = false
	}: Props = $props();

	function clamp(n: number): number {
		return Math.max(min, Math.min(max, n));
	}

	function decrement() {
		const next = clamp(value - step);
		value = next;
		onChange?.(next);
	}

	function increment() {
		const next = clamp(value + step);
		value = next;
		onChange?.(next);
	}

	function onInputChange(e: Event) {
		const raw = parseInt((e.currentTarget as HTMLInputElement).value, 10);
		const next = isNaN(raw) ? min : clamp(raw);
		value = next;
		onChange?.(next);
	}
</script>

<div class="stepper stepper--{size}" class:stepper--no-buttons={!showButtons}>
	{#if label}
		<label class="stepper__label" for={ariaLabel}>
			{label}
		</label>
	{/if}
	<div class="stepper__controls">
		{#if showButtons}
			<button
				type="button"
				class="stepper__btn"
				aria-label="Decrease"
				onclick={decrement}
				{disabled}
				tabindex="-1"
			>
				−
			</button>
		{/if}
		<input
			id={ariaLabel}
			type="number"
			class="stepper__input"
			{value}
			{min}
			{max}
			{step}
			{disabled}
			inputmode="numeric"
			aria-label={ariaLabel ?? label}
			onchange={onInputChange}
			onblur={onInputChange}
		/>
		{#if showButtons}
			<button
				type="button"
				class="stepper__btn"
				aria-label="Increase"
				onclick={increment}
				{disabled}
				tabindex="-1"
			>
				+
			</button>
		{/if}
	</div>
</div>

<style>
	.stepper {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.stepper__label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.stepper__controls {
		display: flex;
		align-items: stretch;
		gap: 2px;
		background: var(--color-surface-raised);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.stepper--no-buttons .stepper__controls {
		background: transparent;
	}

	.stepper__btn {
		flex: 0 0 auto;
		width: 2.5rem;
		border: none;
		background: transparent;
		font-size: 1.25rem;
		font-weight: 400;
		color: var(--color-primary-text);
		cursor: pointer;
		transition: background 0.12s;
	}
	.stepper__btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.stepper__btn:not(:disabled):hover {
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
	}

	.stepper__input {
		flex: 1;
		min-width: 0;
		text-align: center;
		border: none;
		background: transparent;
		font-family: var(--font-sans);
		font-variant-numeric: tabular-nums;
		color: var(--color-on-surface);
		/* Hide spin buttons — we have our own */
		appearance: textfield;
	}
	.stepper__input::-webkit-outer-spin-button,
	.stepper__input::-webkit-inner-spin-button {
		appearance: none;
		margin: 0;
	}
	.stepper__input:disabled {
		opacity: 0.4;
	}

	/* Size variants */
	.stepper--sm .stepper__input { font-size: 0.875rem; padding: var(--space-1) 0; }
	.stepper--md .stepper__input { font-size: 1rem; padding: var(--space-2) 0; }
	.stepper--lg .stepper__input { font-size: 1.5rem; font-weight: 700; padding: var(--space-3) 0; }
	.stepper--lg .stepper__btn { width: 3rem; font-size: 1.5rem; }
</style>

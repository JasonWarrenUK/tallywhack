<script lang="ts">
	interface Props {
		value: string;
		onInput: (value: string) => void;
		placeholder?: string;
		ariaLabel: string;
		align?: 'left' | 'center';
		/** 'inline' = transparent underline (inside a ScoreCard); 'field' = bordered box (setup forms). */
		variant?: 'inline' | 'field';
		maxlength?: number;
	}

	let {
		value,
		onInput,
		placeholder = 'Player',
		ariaLabel,
		align = 'left',
		variant = 'inline',
		maxlength = 20
	}: Props = $props();
</script>

<input
	type="text"
	class="name-input name-input--{variant} name-input--{align}"
	{value}
	{placeholder}
	{maxlength}
	aria-label={ariaLabel}
	oninput={(e) => onInput((e.currentTarget as HTMLInputElement).value)}
/>

<style>
	.name-input {
		font-family: var(--font-sans);
		font-size: 1rem;
		color: var(--color-on-surface);
		background: transparent;
		border: none;
		outline: none;
		width: 100%;
		min-width: 0;
	}

	.name-input::placeholder {
		color: var(--color-muted);
	}

	.name-input:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}

	/* Inline — transparent with a subtle underline, used inside ScoreCard */
	.name-input--inline {
		border-bottom: 1.5px solid var(--color-muted);
		padding: var(--space-1) 0;
		font-weight: 600;
	}
	.name-input--inline:focus-visible {
		outline: none;
		border-bottom-color: var(--color-primary);
	}

	/* Field — bordered box, used in setup forms */
	.name-input--field {
		background: var(--color-surface);
		border: 1.5px solid var(--color-muted);
		border-radius: var(--radius-sm);
		padding: var(--space-2) var(--space-3);
	}
	.name-input--field:focus-visible {
		border-color: var(--color-primary);
		outline: 2px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
		outline-offset: 0;
	}

	.name-input--center {
		text-align: center;
	}
	.name-input--left {
		text-align: left;
	}
</style>

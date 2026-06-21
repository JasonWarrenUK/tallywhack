<script lang="ts">
	import { NumberStepper } from '$lib/components/index.js';

	interface Props {
		label: string;
		value: number;
		onChange: (value: number) => void;
		hint?: string;
	}

	let { label, value, onChange, hint }: Props = $props();
</script>

<div class="category-counter">
	<div class="category-counter__label">
		<span class="category-counter__name">{label}</span>
		{#if hint}
			<span class="category-counter__hint">{hint}</span>
		{/if}
	</div>
	<NumberStepper
		{value}
		{onChange}
		min={0}
		size="sm"
		ariaLabel={label}
	/>
</div>

<style>
	.category-counter {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		padding: var(--space-2) 0;
		border-bottom: 1px solid var(--color-surface);
	}
	.category-counter:last-child {
		border-bottom: none;
	}

	.category-counter__label {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.category-counter__name {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-on-surface);
	}

	.category-counter__hint {
		font-size: 0.6875rem;
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
</style>

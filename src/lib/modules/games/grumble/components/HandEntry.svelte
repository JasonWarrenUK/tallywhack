<script lang="ts">
	import { Button, SegmentedControl } from '$lib/components/index.js';
	import { match } from '../state/match.svelte.js';
	import DeadwoodCalculator from './DeadwoodCalculator.svelte';
	import type { HandType, PlayerId } from '../scoring/types.js';

	let entryType = $state<HandType>('knock');
	let winner = $state<PlayerId>(0);
	let knockerDeadwood = $state(0);
	let oppDeadwood = $state(0);

	const resultOptions = [
		{ value: 'knock' as HandType, label: 'Knock' },
		{ value: 'gin' as HandType, label: 'Gin' },
		{ value: 'bigGin' as HandType, label: 'Big Gin' }
	];

	const playerOptions = $derived([
		{ value: 0 as PlayerId, label: match.names[0] },
		{ value: 1 as PlayerId, label: match.names[1] }
	]);

	function record() {
		match.addHand({
			type: entryType,
			winner,
			knockerDeadwood,
			oppDeadwood
		});
		knockerDeadwood = 0;
		oppDeadwood = 0;
	}
</script>

<section class="entry">
	<div class="row">
		<div class="field">
			<SegmentedControl
				options={resultOptions}
				bind:value={entryType}
				label="Result"
			/>
		</div>
		<div class="field">
			<SegmentedControl
				options={playerOptions}
				bind:value={winner}
				label={entryType === 'knock' ? 'Knocker / winner' : 'Went out'}
			/>
		</div>
	</div>

	<div class="row">
		{#if entryType === 'knock'}
			<div class="field">
				<label class="lbl" for="knocker-deadwood">Knocker deadwood</label>
				<input
					id="knocker-deadwood"
					class="num"
					type="number"
					inputmode="numeric"
					min="0"
					placeholder="0"
					value={knockerDeadwood}
					onchange={(e) => (knockerDeadwood = parseInt(e.currentTarget.value || '0', 10))}
				/>
			</div>
		{/if}
		<div class="field">
			<label class="lbl" for="opp-deadwood">Opponent deadwood</label>
			<input
				id="opp-deadwood"
				class="num"
				type="number"
				inputmode="numeric"
				min="0"
				placeholder="0"
				value={oppDeadwood}
				onchange={(e) => (oppDeadwood = parseInt(e.currentTarget.value || '0', 10))}
			/>
		</div>
		<DeadwoodCalculator onUse={(t) => (oppDeadwood = t)} />
	</div>

	<Button fullWidth onclick={record} disabled={match.gameOver}>Record hand</Button>
</section>

<style>
	.entry {
		background: var(--color-surface-raised);
		border-radius: var(--radius-lg);
		padding: var(--space-4);
		margin-bottom: var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.row {
		display: flex;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.field {
		flex: 1;
		min-width: 140px;
	}

	.lbl {
		display: block;
		font-family: var(--font-sans);
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: var(--space-1);
	}

	.num {
		width: 100%;
		background: var(--color-surface);
		border: 1.5px solid var(--color-muted);
		border-radius: var(--radius-md);
		color: var(--color-on-surface);
		font-size: 1.375rem;
		font-variant-numeric: tabular-nums;
		padding: var(--space-2) var(--space-3);
		text-align: center;
		appearance: textfield;
	}
	.num::-webkit-outer-spin-button,
	.num::-webkit-inner-spin-button {
		appearance: none;
	}
	.num:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 1px;
		border-color: var(--color-primary);
	}
</style>

<script lang="ts">
	import { Button, NumberStepper } from '$lib/components/index.js';
	import { game } from '../state/game.svelte.js';

	let quickScore = $state(0);
	let isBingo = $state(false);

	function handleCommit() {
		// Build a pseudo word-entry with the typed total (no tile breakdown in quick mode).
		const total = quickScore + (isBingo ? 50 : 0);
		// Commit via the game singleton using an empty banked array + a zero-tile word
		// representing the typed total. We use commitTurn after setting up state.
		// In quick mode we bypass the tile editor: directly add to score via history.
		// We replicate the commitTurn logic here for simplicity rather than hacking the editor.
		game.history; // reactive read for the derived
		const player = game.current;
		// Since commitTurn clears tiles & banked, call it after noting the player.
		// We'll use a direct approach: record a word entry with points = total.
		// This avoids exposing an escape-hatch mutation on the singleton.
		// The cleanest path: add a quickCommit method to the game.
		game.quickCommit(total, isBingo);
		quickScore = 0;
		isBingo = false;
	}
</script>

<div class="quick-entry">
	<div class="entry-row">
		<NumberStepper
			bind:value={quickScore}
			min={0}
			step={1}
			ariaLabel="Turn score"
			size="lg"
		/>
		<label class="bingo-toggle">
			<input type="checkbox" bind:checked={isBingo} aria-label="Bingo (+50)" />
			Bingo +50
		</label>
	</div>

	<div class="preview">
		Turn total: <strong>{quickScore + (isBingo ? 50 : 0)}</strong>
	</div>

	<Button
		onclick={handleCommit}
		disabled={quickScore === 0 && !isBingo}
	>
		Score {quickScore + (isBingo ? 50 : 0)}
	</Button>
</div>

<style>
	.quick-entry {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--color-surface-raised);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-3);
	}

	.entry-row {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.bingo-toggle {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-on-surface);
		cursor: pointer;
	}
	.bingo-toggle input[type='checkbox'] {
		accent-color: var(--color-primary);
		width: 1.125rem;
		height: 1.125rem;
	}

	.preview {
		font-size: 0.9375rem;
		color: var(--color-muted);
	}
	.preview strong {
		color: var(--color-primary-text);
		font-size: 1.25rem;
		font-variant-numeric: tabular-nums;
	}
</style>

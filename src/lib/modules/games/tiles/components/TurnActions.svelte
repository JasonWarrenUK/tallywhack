<script lang="ts">
	import { Button } from '$lib/components/index.js';
	import { game } from '../state/game.svelte.js';

	let confirmingPass = $state(false);

	function handlePass() {
		game.recordPass('Pass');
		confirmingPass = false;
	}

	function handleSwap() {
		game.recordSwap('Swap tiles');
	}

	function handleUndo() {
		game.undo();
		confirmingPass = false;
	}

	function handleEndgame() {
		game.startEndgame();
	}
</script>

<div class="turn-actions">
	<div class="secondary-actions">
		<Button variant="ghost" onclick={handlePass}>Pass</Button>
		<Button variant="ghost" onclick={handleSwap}>Swap</Button>
		<Button variant="ghost" onclick={handleUndo} disabled={game.history.length === 0}>
			Undo
		</Button>
	</div>
	<Button variant="ghost" onclick={handleEndgame}>End game →</Button>
</div>

<style>
	.turn-actions {
		display: flex;
		justify-content: space-between;
		gap: var(--space-2);
		flex-wrap: wrap;
		margin-bottom: var(--space-3);
	}

	.secondary-actions {
		display: flex;
		gap: var(--space-2);
	}
</style>

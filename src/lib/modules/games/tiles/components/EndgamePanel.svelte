<script lang="ts">
	import { Button, Panel } from '$lib/components/index.js';
	import { game } from '../state/game.svelte.js';

	let rack0 = $state('');
	let rack1 = $state('');
	let out0 = $state(false);
	let out1 = $state(false);

	function handleApply() {
		game.applyEndgame([rack0, rack1], [out0, out1]);
	}
</script>

<Panel title="End-game rack adjustment">
	<div class="endgame">
		<p class="hint">
			Each player enters their unplayed tiles. If one player went out (emptied their rack),
			they gain the value of the other's leftover tiles.
		</p>

		<div class="player-row">
			<span class="player-name">{game.players[0].name}</span>
			<input
				class="rack-input"
				type="text"
				autocorrect="off"
				autocapitalize="characters"
				spellcheck={false}
				placeholder="LEFTOVER"
				aria-label="{game.players[0].name} leftover tiles"
				bind:value={rack0}
			/>
			<label class="out-toggle">
				<input type="checkbox" bind:checked={out0} aria-label="{game.players[0].name} went out" />
				Went out
			</label>
		</div>
		<div class="player-row">
			<span class="player-name">{game.players[1].name}</span>
			<input
				class="rack-input"
				type="text"
				autocorrect="off"
				autocapitalize="characters"
				spellcheck={false}
				placeholder="LEFTOVER"
				aria-label="{game.players[1].name} leftover tiles"
				bind:value={rack1}
			/>
			<label class="out-toggle">
				<input type="checkbox" bind:checked={out1} aria-label="{game.players[1].name} went out" />
				Went out
			</label>
		</div>

		<Button onclick={handleApply}>Apply and finish</Button>
		<Button variant="ghost" onclick={() => game.undo()} disabled={game.history.length === 0}>
			Undo last turn
		</Button>
	</div>
</Panel>

<style>
	.endgame {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.hint {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-muted);
	}

	.player-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.player-name {
		font-weight: 600;
		min-width: 6rem;
		color: var(--color-on-surface);
	}

	.rack-input {
		background: var(--color-surface);
		border: 2px solid var(--color-muted);
		border-radius: var(--radius-md);
		color: var(--color-on-surface);
		font-family: var(--font-mono);
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: var(--space-2) var(--space-3);
		width: 9rem;
		outline: none;
	}
	.rack-input:focus-visible {
		border-color: var(--color-primary);
	}

	.out-toggle {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: 0.875rem;
		cursor: pointer;
		color: var(--color-on-surface);
	}
	.out-toggle input[type='checkbox'] {
		accent-color: var(--color-primary);
		width: 1rem;
		height: 1rem;
	}
</style>

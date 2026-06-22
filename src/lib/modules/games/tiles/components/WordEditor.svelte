<script lang="ts">
	/**
	 * Caret-preserving word editor.
	 *
	 * The <input> is intentionally uncontrolled: on each `oninput` event we
	 * derive the tile array from the typed value (game.updateTiles), but we
	 * never write back to input.value during normal typing. This preserves the
	 * browser's native caret position.
	 *
	 * We DO imperatively set input.value in exactly three cases (mimicking the
	 * source scrabble.html):
	 *   1. After commit — clear to ''.
	 *   2. After bankWord — clear to ''.
	 *   3. After removeTile — set to the remaining letters string.
	 */
	import { Button } from '$lib/components/index.js';
	import { game } from '../state/game.svelte.js';
	import type { Tile } from '../scoring/types.js';

	let inputEl = $state<HTMLInputElement | null>(null);

	const squareOptions: { value: Tile['square']; label: string; abbr: string }[] = [
		{ value: 'plain', label: 'Plain', abbr: '—' },
		{ value: 'DL', label: 'Double Letter', abbr: 'DL' },
		{ value: 'TL', label: 'Triple Letter', abbr: 'TL' },
		{ value: 'DW', label: 'Double Word', abbr: 'DW' },
		{ value: 'TW', label: 'Triple Word', abbr: 'TW' }
	];

	function handleInput(e: Event) {
		game.updateTiles((e.currentTarget as HTMLInputElement).value);
	}

	function handleCommit() {
		game.commitTurn();
		if (inputEl) { inputEl.value = ''; inputEl.focus(); }
	}

	function handleBankWord() {
		game.bankWord();
		if (inputEl) { inputEl.value = ''; inputEl.focus(); }
	}

	function handleRemoveTile(index: number) {
		const remaining = game.removeTile(index);
		if (inputEl) { inputEl.value = remaining; }
	}

	function handleSquarePick(sq: Tile['square']) {
		if (game.selected !== null) game.setSquare(game.selected, sq);
	}
</script>

<div class="word-editor">
	<!-- Word input -->
	<div class="input-row">
		<input
			bind:this={inputEl}
			class="word-input"
			type="text"
			autocomplete="off"
			autocorrect="off"
			autocapitalize="characters"
			spellcheck={false}
			placeholder="Type a word…"
			aria-label="Word"
			oninput={handleInput}
		/>
		<label class="bingo-toggle">
			<input
				type="checkbox"
				bind:checked={game.bingo}
				aria-label="Bingo (+50)"
			/>
			Bingo +50
		</label>
	</div>

	<!-- Tile row -->
	{#if game.tiles.length > 0}
		<div class="tile-row" role="group" aria-label="Current word tiles">
			{#each game.tiles as tile, i (i)}
				<button
					class="tile"
					class:tile--selected={game.selected === i}
					class:tile--DL={tile.square === 'DL'}
					class:tile--TL={tile.square === 'TL'}
					class:tile--DW={tile.square === 'DW'}
					class:tile--TW={tile.square === 'TW'}
					class:tile--blank={tile.isBlank}
					aria-label="{tile.letter}{tile.isBlank ? ' blank' : ''}, {tile.square}, tap to select"
					aria-pressed={game.selected === i}
					onclick={() => game.selectTile(game.selected === i ? null : i)}
				>
					<span class="tile__letter">{tile.letter}</span>
					<span class="tile__sq">{tile.square !== 'plain' ? tile.square : ''}</span>
				</button>
			{/each}
		</div>
	{/if}

	<!-- Premium-square picker (appears when a tile is selected) -->
	{#if game.selected !== null}
		<div class="sq-picker" role="group" aria-label="Choose premium square for selected tile">
			{#each squareOptions as { value, label, abbr } (value)}
				<button
					class="sq-btn"
					class:sq-btn--active={game.tiles[game.selected]?.square === value}
					aria-label={label}
					onclick={() => handleSquarePick(value)}
				>{abbr}</button>
			{/each}
			<button
				class="sq-btn sq-btn--blank"
				class:sq-btn--active={game.selected !== null && game.tiles[game.selected]?.isBlank}
				aria-label="Toggle blank"
				onclick={() => {
					if (game.selected !== null) {
						game.setBlank(game.selected, !game.tiles[game.selected].isBlank);
					}
				}}
			>BLK</button>
			<button
				class="sq-btn sq-btn--remove"
				aria-label="Remove tile"
				onclick={() => {
					if (game.selected !== null) handleRemoveTile(game.selected);
				}}
			>✕</button>
		</div>
	{/if}

	<!-- Banked words in multi-word play -->
	{#if game.banked.length > 0}
		<div class="banked-words" aria-label="Banked words this turn">
			{#each game.banked as word, wi (wi)}
				<span class="banked-word">{word.map((t) => t.letter).join('')}</span>
			{/each}
			<span class="banked-plus" aria-hidden="true">+</span>
		</div>
	{/if}

	<!-- Turn total preview -->
	<div class="turn-total" aria-live="polite" aria-atomic="true">
		<span class="turn-total__label">Turn total</span>
		<span class="turn-total__value">{game.liveTotal}</span>
		{#if game.bingo}
			<span class="turn-total__bingo" aria-label="includes bingo bonus">+50 🎉</span>
		{/if}
	</div>

	<!-- Actions -->
	<div class="actions">
		{#if game.tiles.length > 0}
			<Button variant="ghost" onclick={handleBankWord}>+ Bank word</Button>
		{/if}
		<Button
			onclick={handleCommit}
			disabled={game.liveTotal === 0 && game.banked.length === 0}
		>
			Score {game.liveTotal > 0 ? game.liveTotal : ''}
		</Button>
	</div>
</div>

<style>
	.word-editor {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--color-surface-raised);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-3);
	}

	.input-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.word-input {
		flex: 1;
		background: var(--color-surface);
		border: 2px solid var(--color-muted);
		border-radius: var(--radius-md);
		color: var(--color-on-surface);
		font-family: var(--font-mono);
		font-size: 1.5rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: var(--space-2) var(--space-3);
		outline: none;
	}
	.word-input:focus-visible {
		border-color: var(--color-primary);
	}

	.bingo-toggle {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-on-surface);
		cursor: pointer;
		white-space: nowrap;
	}
	.bingo-toggle input[type='checkbox'] {
		accent-color: var(--color-primary);
		width: 1.125rem;
		height: 1.125rem;
	}

	.tile-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	.tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 2.5rem;
		height: 2.75rem;
		padding: 0.25rem 0.125rem 0.125rem;
		border: 2px solid var(--color-muted);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		cursor: pointer;
		transition: background 0.1s, border-color 0.1s;
	}

	.tile:hover { border-color: var(--color-on-surface); }
	.tile--selected { border-color: var(--color-primary); background: var(--color-primary-bg); }
	.tile--blank { opacity: 0.6; }

	/* Premium square colours — module-scoped, not global tokens.
	   These are intentionally light pastels that evoke a physical Scrabble board.
	   The tile letter colour inherits --color-on-surface, which goes near-white in
	   dark mode — so we pin an explicit dark text colour here to keep the squares
	   legible regardless of the active theme. */
	.tile--DL { background: #c6dff7; border-color: #4f87c0; color: #1a2a3a; }
	.tile--TL { background: #9bcfb8; border-color: #2e7f5a; color: #0d2118; }
	.tile--DW { background: #f9d9c3; border-color: #c25b1a; color: #3a1800; }
	.tile--TW { background: #f4b0b0; border-color: #b91c1c; color: #3a0000; }

	.tile__letter {
		font-size: 1.125rem;
		font-weight: 700;
		font-family: var(--font-mono);
		line-height: 1;
		color: var(--color-on-surface);
	}
	.tile__sq {
		font-size: 0.5rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-muted);
		line-height: 1;
	}

	.sq-picker {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	.sq-btn {
		padding: var(--space-1) var(--space-2);
		border: 2px solid var(--color-muted);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		font-size: 0.75rem;
		font-weight: 700;
		font-family: var(--font-mono);
		color: var(--color-on-surface);
		cursor: pointer;
		transition: background 0.1s, border-color 0.1s;
	}
	.sq-btn:hover { border-color: var(--color-on-surface); }
	.sq-btn--active { border-color: var(--color-primary); background: var(--color-primary-bg); color: var(--color-primary-text); }
	.sq-btn--remove { color: var(--color-danger); border-color: var(--color-danger); }
	.sq-btn--remove:hover { background: var(--color-danger); color: #fff; }

	.banked-words {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		align-items: center;
		font-family: var(--font-mono);
		font-size: 0.9375rem;
		color: var(--color-muted);
		font-weight: 600;
	}
	.banked-word {
		background: var(--color-surface);
		padding: 0 var(--space-2);
		border-radius: var(--radius-sm);
		letter-spacing: 0.06em;
	}
	.banked-plus { font-size: 0.75rem; color: var(--color-muted); }

	.turn-total {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
	}
	.turn-total__label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-muted);
	}
	.turn-total__value {
		font-size: 2rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--color-primary-text);
	}
	.turn-total__bingo {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-primary-text);
	}

	.actions {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}
</style>

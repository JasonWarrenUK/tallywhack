<script lang="ts">
	import { Panel } from '$lib/components/index.js';

	let open = $state(false);
</script>

<Panel collapsible title="How to play" bind:open>
	<div class="help">
		<dl>
			<dt>Tiles mode</dt>
			<dd>Type a word letter by letter. Tap any tile to assign a premium square (DL, TL, DW, TW) or mark it as a blank (worth 0 points). For multi-word plays, bank each word with "+ Bank word" before scoring.</dd>

			<dt>Quick mode</dt>
			<dd>Enter the final turn total directly — no tile breakdown. Useful for fast games or when you trust the physical board's arithmetic.</dd>

			<dt>Bingo (+50)</dt>
			<dd>Tick "Bingo" when a player uses all 7 tiles in one turn for a +50 point bonus.</dd>

			<dt>Premium squares</dt>
			<dd>
				<span class="sq sq--DL">DL</span> doubles one letter &nbsp;
				<span class="sq sq--TL">TL</span> triples one letter &nbsp;
				<span class="sq sq--DW">DW</span> doubles the word &nbsp;
				<span class="sq sq--TW">TW</span> triples the word
			</dd>

			<dt>End game</dt>
			<dd>Tap "End game →" when a player's bag is empty and one player goes out. Each player subtracts their leftover tile values; the player who went out gains the other's total.</dd>

			<dt>Draws</dt>
			<dd>Scrabble has no official tiebreaker — equal final scores are recorded as a draw.</dd>

			<dt>Chopsticks</dt>
			<dd>Not supported in this scorer (uncommon house rule).</dd>
		</dl>
	</div>
</Panel>

<style>
	.help {
		font-size: 0.875rem;
		color: var(--color-on-surface);
	}

	dl {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	dt {
		font-weight: 700;
		color: var(--color-primary-text);
		margin-bottom: var(--space-1);
	}

	dd {
		margin: 0;
		color: var(--color-muted);
		line-height: 1.5;
	}

	.sq {
		display: inline-block;
		padding: 1px 4px;
		border-radius: 3px;
		font-size: 0.75rem;
		font-weight: 700;
		font-family: var(--font-mono);
	}
	.sq--DL { background: #c6dff7; color: #1a4a7a; }
	.sq--TL { background: #9bcfb8; color: #1a4a30; }
	.sq--DW { background: #f9d9c3; color: #7a2a00; }
	.sq--TW { background: #f4b0b0; color: #7a0000; }
</style>

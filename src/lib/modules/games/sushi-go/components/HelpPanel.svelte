<script lang="ts">
	import { Panel } from '$lib/components/index.js';

	let open = $state(false);
</script>

<Panel collapsible title="How to play" bind:open>
	<div class="help">
		<dl>
			<dt>Maki rolls 🍙</dt>
			<dd>Count the total maki icons on all your maki cards each round. Most maki icons: +6 pts. Second most: +3 pts. Tied: split the top prize (each gets +3). Zero maki: no points.</dd>

			<dt>Tempura 🍤</dt>
			<dd>Collect pairs. Each complete pair of tempura cards scores 5 pts. Leftover singles score 0.</dd>

			<dt>Sashimi 🐟</dt>
			<dd>Collect sets of three. Each complete set of 3 sashimi cards scores 10 pts. Incomplete sets score 0.</dd>

			<dt>Dumplings 🥟</dt>
			<dd>1 dumpling = 1pt, 2 = 3pt, 3 = 6pt, 4 = 10pt, 5+ = 15pt. Points are per player, not shared.</dd>

			<dt>Nigiri & Wasabi</dt>
			<dd>Egg = 1pt, Salmon = 2pt, Squid = 3pt. Playing a nigiri on a wasabi card triples its value (×3). Enter wasabi-nigiri pairs in the wasabi column; plain nigiri in the plain column.</dd>

			<dt>Pudding 🍮</dt>
			<dd>Pudding scores only at the very end (after 3 rounds). Player with the most pudding: +6 pts. Player with the fewest: −6 pts. Equal totals: no award.</dd>

			<dt>Pudding tiebreaker</dt>
			<dd>If two players have equal final scores, the player with more total pudding wins. If pudding is also equal, the game is a draw.</dd>

			<dt>Chopsticks</dt>
			<dd>Not scored in this app (uncommon in 2-player games; no effect on point totals).</dd>
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
</style>

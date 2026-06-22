<script lang="ts">
	import { Panel } from '$lib/components/index.js';
	import { match } from '../state/match.svelte.js';

	let open = $state(false);
</script>

<div class="wrap">
	<Panel collapsible title="How scoring works" bind:open>
		<dl class="glossary">
			<dt>Deadwood</dt>
			<dd>
				Unmatched cards left in your hand after laying off. Face cards = 10, Aces = 1, all
				others face value.
			</dd>

			<dt>Knock</dt>
			<dd>
				End the hand when your deadwood is 10 or under. You score the difference between your
				deadwood and your opponent's. If theirs is equal or lower, they undercut you.
			</dd>

			<dt>Gin</dt>
			<dd>
				Go out with 0 deadwood. Score opponent's deadwood + {match.rules.GIN_BONUS} bonus.
				Opponent can't lay off.
			</dd>

			<dt>Big gin</dt>
			<dd>
				Go out using all 11 cards (including the draw). Score opponent's deadwood + {match.rules.BIG_GIN_BONUS}
				bonus.
			</dd>

			<dt>Undercut</dt>
			<dd>
				If the knocker's deadwood is &ge; the opponent's, the opponent wins the box and scores
				the difference + {match.rules.UNDERCUT_BONUS} bonus.
			</dd>

			<dt>Lines (boxes)</dt>
			<dd>
				Each hand you win earns you a line. At game end, each line is worth {match.rules.LINE_BONUS}
				points.
			</dd>

			<dt>Game</dt>
			<dd>
				The first player to reach {match.rules.GAME_TARGET} points wins the game and earns a {match.rules.GAME_BONUS}
				bonus on top of line bonuses.
			</dd>

			<dt>Bank</dt>
			<dd>Lock in the finished game's final scores and start a new game in the same match.</dd>
		</dl>
	</Panel>
</div>

<style>
	.wrap {
		margin-bottom: var(--space-4);
	}

	.glossary {
		margin: 0;
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: var(--space-1) var(--space-4);
		font-size: 0.8125rem;
	}

	dt {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-primary-text);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding-top: 1px;
	}

	dd {
		margin: 0;
		color: var(--color-on-surface);
		line-height: 1.5;
		opacity: 0.9;
	}
</style>

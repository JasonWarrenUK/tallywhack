<script lang="ts">
	import { NumberStepper } from '$lib/components/index.js';
	import { game } from '../state/game.svelte.js';
	import type { PlayerId } from '$lib/modules/types.js';
	import type { NigiriKind } from '../scoring/cards.js';

	const KINDS: { kind: NigiriKind; label: string; value: number }[] = [
		{ kind: 'egg', label: 'Egg (1pt)', value: 1 },
		{ kind: 'salmon', label: 'Salmon (2pt)', value: 2 },
		{ kind: 'squid', label: 'Squid (3pt)', value: 3 }
	];

	interface Props { player: PlayerId; }
	let { player }: Props = $props();

	const nigiri = $derived(game.rounds[game.round].players[player].nigiri);
</script>

<div class="nigiri-wasabi">
	<div class="section-head">Nigiri</div>
	<table class="nigiri-table" aria-label="Nigiri entry for {game.names[player]}">
		<thead>
			<tr>
				<th class="col-kind">Type</th>
				<th class="col-count">Plain</th>
				<th class="col-count">+ Wasabi (×3)</th>
			</tr>
		</thead>
		<tbody>
			{#each KINDS as { kind, label } (kind)}
				<tr>
					<td class="col-kind">{label}</td>
					<td class="col-count">
						<NumberStepper
							value={nigiri.plain[kind]}
							onChange={(v) => game.setNigiri(player, kind, 'plain', v)}
							min={0}
							size="sm"
							ariaLabel="{label} plain"
						/>
					</td>
					<td class="col-count">
						<NumberStepper
							value={nigiri.wasabi[kind]}
							onChange={(v) => game.setNigiri(player, kind, 'wasabi', v)}
							min={0}
							size="sm"
							ariaLabel="{label} with wasabi"
						/>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
	<div class="unused-wasabi">
		<span class="unused-label">Unused wasabi</span>
		<NumberStepper
			value={nigiri.unusedWasabi}
			onChange={(v) => game.setUnusedWasabi(player, v)}
			min={0}
			size="sm"
			ariaLabel="Unused wasabi for {game.names[player]}"
		/>
	</div>
</div>

<style>
	.nigiri-wasabi {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.section-head {
		font-weight: 700;
		font-size: 0.875rem;
		color: var(--color-primary-text);
	}

	.nigiri-table {
		border-collapse: collapse;
		width: 100%;
		font-size: 0.875rem;
	}

	th, td {
		text-align: left;
		padding: var(--space-1) var(--space-1);
	}

	th {
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-muted);
		border-bottom: 1px solid var(--color-surface);
	}

	.col-kind {
		color: var(--color-on-surface);
		font-weight: 500;
	}

	.col-count {
		text-align: center;
	}

	.unused-wasabi {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: var(--space-2);
		border-top: 1px solid var(--color-surface);
	}

	.unused-label {
		font-size: 0.8125rem;
		color: var(--color-muted);
	}
</style>

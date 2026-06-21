<script lang="ts">
	import { Panel, PlayerNameInput, SegmentedControl, Button } from '$lib/components/index.js';
	import { match } from '../state/match.svelte.js';
	import { PRESETS, type PresetId, type Rules } from '../scoring/rules.js';
	import type { PlayerId } from '../scoring/types.js';

	let open = $state(false);

	// Two-tap "New match" confirm: first tap arms, second tap fires.
	let confirmingReset = $state(false);

	function handleReset() {
		if (!confirmingReset) {
			confirmingReset = true;
			// Auto-disarm after 3 s if the user doesn't confirm.
			setTimeout(() => (confirmingReset = false), 3000);
			return;
		}
		match.resetMatch();
		confirmingReset = false;
	}

	const players: PlayerId[] = [0, 1];
	const presets = Object.values(PRESETS) as (typeof PRESETS)[PresetId][];

	const presetOptions = $derived(
		presets.map((p) => ({ value: p.id as PresetId, label: p.label }))
	);

	// Rule field labels for the Custom section.
	const ruleFields: { key: keyof Rules; label: string }[] = [
		{ key: 'GAME_TARGET', label: 'Game target' },
		{ key: 'GIN_BONUS', label: 'Gin bonus' },
		{ key: 'BIG_GIN_BONUS', label: 'Big gin bonus' },
		{ key: 'UNDERCUT_BONUS', label: 'Undercut bonus' },
		{ key: 'LINE_BONUS', label: 'Line bonus' },
		{ key: 'GAME_BONUS', label: 'Game bonus' }
	];
</script>

<div class="wrap">
	<Panel collapsible title="Match setup" bind:open>
		<div class="sections">
			<section class="section">
				<div class="section-head">Players</div>
				<div class="fields">
					{#each players as p (p)}
						<div class="field">
							<label class="lbl" for="player-{p}">Player {p + 1}</label>
							<PlayerNameInput
								value={match.names[p]}
								onInput={(v) => match.setName(p, v)}
								ariaLabel="Player {p + 1} name"
								variant="field"
							/>
						</div>
					{/each}
				</div>
			</section>

			<section class="section">
				<div class="section-head">Rules</div>
				<SegmentedControl
					options={presetOptions}
					value={match.presetId}
					onChange={(id) => match.applyPreset(id)}
					ariaLabel="Rule preset"
				/>

				{#if match.presetId === 'custom'}
					<div class="custom-fields">
						{#each ruleFields as { key, label } (key)}
							<div class="field">
								<label class="lbl" for="rule-{key}">{label}</label>
								<input
									id="rule-{key}"
									class="num-input"
									type="number"
									inputmode="numeric"
									min="0"
									value={match.rules[key]}
									onchange={(e) =>
										match.setRule(key, parseInt(e.currentTarget.value || '0', 10))}
								/>
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<section class="section reset-section">
				<Button
					variant={confirmingReset ? 'danger' : 'ghost'}
					onclick={handleReset}
					disabled={match.hands.length === 0 && match.games.length === 0}
				>
					{confirmingReset
						? 'Tap again to confirm — this clears all hands and games'
						: 'New match'}
				</Button>
			</section>
		</div>
	</Panel>
</div>

<style>
	.wrap {
		margin-bottom: var(--space-4);
	}

	.sections {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.section-head {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-muted);
	}

	.fields {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.lbl {
		font-size: 0.75rem;
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.custom-fields {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
		padding-top: var(--space-2);
	}

	.num-input {
		background: var(--color-surface);
		border: 1.5px solid var(--color-muted);
		border-radius: var(--radius-sm);
		color: var(--color-on-surface);
		font-family: var(--font-sans);
		font-size: 1.125rem;
		font-variant-numeric: tabular-nums;
		padding: var(--space-2) var(--space-2);
		text-align: center;
		width: 100%;
		appearance: textfield;
	}
	.num-input::-webkit-outer-spin-button,
	.num-input::-webkit-inner-spin-button {
		appearance: none;
	}
	.num-input:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 1px;
		border-color: var(--color-primary);
	}

	.reset-section {
		border-top: 1px solid var(--color-surface);
		padding-top: var(--space-3);
	}
</style>

<script lang="ts">
	import { babyName } from '../state/babyName.svelte.js';
	import { Button } from '$lib/components/index.js';

	const GENDERS   = ['Male', 'Female', 'Gender neutral'];
	const THEMES    = ['Nature', 'Mythology', 'Royal', 'Vintage', 'Modern', 'Literary', 'Biblical', 'Musical', 'Celestial', 'Earthy'];
	const CULTURES  = ['English', 'Irish', 'Scottish', 'Welsh', 'French', 'Italian', 'Spanish', 'Portuguese', 'Nordic', 'German', 'Greek', 'Latin', 'Hebrew', 'Arabic', 'Japanese', 'Indian'];

	interface Props {
		person: 'A' | 'B';
	}
	let { person }: Props = $props();

	const prefs   = $derived(person === 'A' ? babyName.profileA.preferences : babyName.profileB.preferences);
	const label   = $derived(person === 'A' ? (babyName.profileA.person || 'Person A') : (babyName.profileB.person || 'Person B'));

	function toggle(field: 'genders' | 'themes' | 'cultures', value: string) {
		babyName.togglePreference(person, field, value);
	}
</script>

<div class="prefs">
	<h2 class="person-label">{label}'s preferences</h2>
	<p class="hint">All filters are optional — leave blank for any.</p>

	<!-- Gender -->
	<fieldset>
		<legend>Gender</legend>
		<div class="chip-group">
			{#each GENDERS as g}
				<button
					type="button"
					class="chip"
					class:active={prefs.genders.includes(g)}
					onclick={() => toggle('genders', g)}
					aria-pressed={prefs.genders.includes(g)}
				>{g}</button>
			{/each}
		</div>
	</fieldset>

	<!-- Themes -->
	<fieldset>
		<legend>Theme</legend>
		<div class="chip-group">
			{#each THEMES as t}
				<button
					type="button"
					class="chip"
					class:active={prefs.themes.includes(t)}
					onclick={() => toggle('themes', t)}
					aria-pressed={prefs.themes.includes(t)}
				>{t}</button>
			{/each}
		</div>
	</fieldset>

	<!-- Cultures -->
	<fieldset>
		<legend>Origin / Culture</legend>
		<div class="chip-group">
			{#each CULTURES as c}
				<button
					type="button"
					class="chip"
					class:active={prefs.cultures.includes(c)}
					onclick={() => toggle('cultures', c)}
					aria-pressed={prefs.cultures.includes(c)}
				>{c}</button>
			{/each}
		</div>
	</fieldset>

	<!-- Uniqueness -->
	<fieldset>
		<legend>
			Uniqueness: {prefs.uniqueness < 35 ? 'Traditional' : prefs.uniqueness > 65 ? 'Unique' : 'Balanced'}
			<span class="uniqueness-val">{prefs.uniqueness}</span>
		</legend>
		<input
			type="range"
			min="0"
			max="100"
			value={prefs.uniqueness}
			oninput={(e) => babyName.updatePreferences(person, { uniqueness: Number(e.currentTarget.value) })}
			aria-label="Uniqueness: {prefs.uniqueness}"
		/>
		<div class="range-labels">
			<span>Traditional</span>
			<span>Balanced</span>
			<span>Unique</span>
		</div>
	</fieldset>

	<Button
		fullWidth
		onclick={() => babyName.submitPreferences(person)}
		disabled={babyName.loading}
	>
		{babyName.loading ? 'Fetching examples…' : 'Next: taste test →'}
	</Button>

	{#if babyName.error}
		<p class="error-msg" role="alert">{babyName.error}</p>
		<Button variant="ghost" onclick={() => babyName.dismissError()}>Dismiss</Button>
	{/if}
</div>

<style>
	.prefs {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.person-label {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-on-surface);
		margin: 0;
	}

	.hint {
		font-size: 0.8125rem;
		color: var(--color-muted);
		margin: calc(-1 * var(--space-3)) 0 0;
	}

	fieldset {
		border: 1.5px solid var(--color-muted);
		border-radius: var(--radius-md);
		padding: var(--space-3) var(--space-3) var(--space-4);
	}

	legend {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-on-surface);
		padding: 0 var(--space-1);
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.uniqueness-val {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--color-muted);
	}

	.chip-group {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-top: var(--space-2);
	}

	.chip {
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-md);
		border: 1.5px solid var(--color-muted);
		background: var(--color-surface-raised);
		color: var(--color-on-surface);
		cursor: pointer;
		font-size: 0.875rem;
		transition: all 0.15s;
	}

	.chip.active,
	.chip[aria-pressed='true'] {
		border-color: var(--color-primary);
		background: var(--color-primary-bg);
		color: var(--color-primary-text);
		font-weight: 600;
	}

	input[type='range'] {
		width: 100%;
		margin-top: var(--space-2);
		accent-color: var(--color-primary);
	}

	.range-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		color: var(--color-muted);
		margin-top: var(--space-1);
	}

	.error-msg {
		color: var(--color-danger);
		font-size: 0.875rem;
		margin: 0;
		padding: var(--space-2) var(--space-3);
		background: color-mix(in srgb, var(--color-danger) 10%, transparent);
		border-radius: var(--radius-md);
	}
</style>

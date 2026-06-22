<script lang="ts">
	import { reckoner } from '../state/reckoner.svelte.js';
	import { Button, Panel } from '$lib/components/index.js';

	// ---------------------------------------------------------------------------
	// Entry form state (local only — not persisted until addEntry is called)
	// ---------------------------------------------------------------------------
	let newEntryText = $state('');
	let newEntryCategoryId = $state<string | null>(null);
	let addingAsIndex = $state(0); // participant index for "suggested by"

	function handleAddEntry() {
		const cat = reckoner.hasCats ? newEntryCategoryId : null;
		const suggestedBy = reckoner.participants[addingAsIndex]?.name || undefined;
		reckoner.addEntry(newEntryText, cat, suggestedBy);
		newEntryText = '';
	}

	function handleStart() {
		reckoner.startRating(0);
	}
</script>

<section class="setup">
	<!-- Activity name -->
	<div class="field">
		<label for="activity-name">What are you deciding?</label>
		<input
			id="activity-name"
			type="text"
			placeholder="e.g. Restaurant, Movie Night, Holiday…"
			value={reckoner.activityName}
			oninput={(e) => reckoner.setActivityName(e.currentTarget.value)}
		/>
	</div>

	<!-- Participants -->
	<Panel title="Participants">
		<div class="list">
			{#each reckoner.participants as participant, i (participant.id)}
				<div class="list-row">
					<input
						type="text"
						placeholder="Name"
						value={participant.name}
						oninput={(e) => reckoner.setParticipantName(i, e.currentTarget.value)}
						aria-label="Participant {i + 1} name"
					/>
					{#if reckoner.participants.length > 2}
						<button
							class="remove-btn"
							type="button"
							onclick={() => reckoner.removeParticipant(i)}
							aria-label="Remove participant {i + 1}"
						>✕</button>
					{/if}
				</div>
			{/each}
		</div>
		{#if reckoner.participants.length < 8}
			<Button variant="ghost" onclick={() => reckoner.addParticipant()}>+ Add participant</Button>
		{/if}
	</Panel>

	<!-- Optional categories -->
	<Panel title="Categories (optional)" collapsible open={reckoner.categories.length > 1}>
		<p class="hint">Group your options into up to 3 categories (e.g. "Italian", "Asian", "Other").</p>
		<div class="list">
			{#each reckoner.categories as cat, i (cat.id)}
				<div class="list-row">
					<input
						type="text"
						placeholder="Category name"
						value={cat.label}
						oninput={(e) => reckoner.setCategoryLabel(i, e.currentTarget.value)}
						aria-label="Category {i + 1} name"
					/>
					{#if reckoner.categories.length > 1}
						<button
							class="remove-btn"
							type="button"
							onclick={() => reckoner.removeCategory(i)}
							aria-label="Remove category {i + 1}"
						>✕</button>
					{/if}
				</div>
			{/each}
		</div>
		{#if reckoner.categories.length < 3}
			<Button variant="ghost" onclick={() => reckoner.addCategory()}>+ Add category</Button>
		{/if}
	</Panel>

	<!-- Entries -->
	<Panel title="Options to rank">
		{#if reckoner.hasCats}
			<div class="cat-tabs">
				{#each reckoner.activeCats as cat (cat.id)}
					<button
						type="button"
						class="cat-tab"
						class:active={newEntryCategoryId === cat.id}
						onclick={() => { newEntryCategoryId = cat.id; }}
					>{cat.label}</button>
				{/each}
			</div>
		{/if}

		{#if reckoner.participants.length > 1}
			<div class="adder-as">
				<span class="adder-label">Adding as:</span>
				{#each reckoner.participants as p, i (p.id)}
					<button
						type="button"
						class="adder-pill"
						class:active={addingAsIndex === i}
						onclick={() => { addingAsIndex = i; }}
					>{p.name || `P${i + 1}`}</button>
				{/each}
			</div>
		{/if}

		<form
			class="entry-form"
			onsubmit={(e) => { e.preventDefault(); handleAddEntry(); }}
		>
			<input
				type="text"
				placeholder="Add an option…"
				bind:value={newEntryText}
				aria-label="New option text"
			/>
			<Button type="submit" disabled={!newEntryText.trim()}>Add</Button>
		</form>

		{#if reckoner.entries.length > 0}
			<ul class="entry-list">
				{#each reckoner.entries as entry (entry.id)}
					{@const cat = reckoner.categories.find((c) => c.id === entry.categoryId)}
					<li class="entry-item">
						<span class="entry-text">{entry.text}</span>
						{#if cat && cat.label}<span class="entry-cat">{cat.label}</span>{/if}
						{#if entry.suggestedBy}<span class="entry-by">by {entry.suggestedBy}</span>{/if}
						<button
							type="button"
							class="remove-btn"
							onclick={() => reckoner.removeEntry(entry.id)}
							aria-label="Remove {entry.text}"
						>✕</button>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="empty">No options yet. Add at least two to start.</p>
		{/if}
	</Panel>

	<div class="actions">
		<Button
			onclick={handleStart}
			disabled={!reckoner.canStart}
			fullWidth
		>
			Start rating →
		</Button>
	</div>
</section>

<style>
	.setup {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-on-surface);
	}

	input[type='text'] {
		width: 100%;
		padding: var(--space-2) var(--space-3);
		border: 1.5px solid var(--color-muted);
		border-radius: var(--radius-md);
		background: var(--color-surface-raised);
		color: var(--color-on-surface);
		font-size: 1rem;
		font-family: var(--font-sans);
		box-sizing: border-box;
		transition: border-color 0.15s;
	}

	input[type='text']:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-3);
	}

	.list-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.list-row input {
		flex: 1;
	}

	.remove-btn {
		flex-shrink: 0;
		background: none;
		border: none;
		color: var(--color-muted);
		cursor: pointer;
		font-size: 1rem;
		padding: var(--space-1);
		border-radius: var(--radius-sm);
		line-height: 1;
		transition: color 0.15s;
	}

	.remove-btn:hover {
		color: var(--color-danger);
	}

	.hint {
		font-size: 0.8125rem;
		color: var(--color-muted);
		margin: 0 0 var(--space-3);
	}

	.cat-tabs {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
		margin-bottom: var(--space-3);
	}

	.cat-tab {
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-md);
		border: 1.5px solid var(--color-muted);
		background: var(--color-surface-raised);
		color: var(--color-on-surface);
		cursor: pointer;
		font-size: 0.875rem;
		transition: all 0.15s;
	}

	.cat-tab.active {
		border-color: var(--color-primary);
		background: var(--color-primary-bg);
		color: var(--color-primary-text);
		font-weight: 600;
	}

	.adder-as {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
		margin-bottom: var(--space-3);
	}

	.adder-label {
		font-size: 0.8125rem;
		color: var(--color-muted);
	}

	.adder-pill {
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-md);
		border: 1.5px solid var(--color-muted);
		background: var(--color-surface-raised);
		color: var(--color-on-surface);
		cursor: pointer;
		font-size: 0.8125rem;
		transition: all 0.15s;
	}

	.adder-pill.active {
		border-color: var(--color-primary);
		background: var(--color-primary-bg);
		color: var(--color-primary-text);
		font-weight: 600;
	}

	.entry-form {
		display: flex;
		gap: var(--space-2);
		margin-bottom: var(--space-3);
	}

	.entry-form input {
		flex: 1;
	}

	.entry-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.entry-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: var(--color-surface-raised);
		border-radius: var(--radius-md);
		font-size: 0.9375rem;
	}

	.entry-text {
		flex: 1;
	}

	.entry-cat,
	.entry-by {
		font-size: 0.75rem;
		color: var(--color-muted);
		white-space: nowrap;
	}

	.empty {
		font-size: 0.875rem;
		color: var(--color-muted);
		text-align: center;
		padding: var(--space-4) 0;
		margin: 0;
	}

	.actions {
		padding-top: var(--space-2);
	}
</style>

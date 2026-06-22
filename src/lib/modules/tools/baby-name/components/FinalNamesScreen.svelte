<script lang="ts">
	/**
	 * Final names screen — shows the 10 Claude-generated names.
	 * Either person can toggle names onto the shared shortlist.
	 * Regenerate keeps the shortlist and replaces the rest.
	 */
	import { babyName } from '../state/babyName.svelte.js';
	import { Button } from '$lib/components/index.js';
</script>

<div class="final">
	<h2 class="title">Your names</h2>
	<p class="hint">Tap a name to shortlist it. Regenerate replaces the rest.</p>

	{#if babyName.error}
		<p class="error-msg" role="alert">{babyName.error}</p>
		<Button variant="ghost" onclick={() => babyName.dismissError()}>Dismiss</Button>
	{/if}

	<ul class="name-list">
		{#each babyName.finalNames as suggestion}
			{@const isShortlisted = babyName.shortlistSet.has(suggestion.name)}
			<li>
				<button
					type="button"
					class="name-card"
					class:shortlisted={isShortlisted}
					onclick={() => babyName.toggleShortlist(suggestion)}
					aria-pressed={isShortlisted}
				>
					<div class="name-row">
						<span class="name">{suggestion.name}</span>
						{#if isShortlisted}
							<span class="check" aria-hidden="true">♥</span>
						{/if}
					</div>
					<p class="meta">{suggestion.gender} · {suggestion.origin}</p>
					{#if suggestion.meaning}
						<p class="meaning">{suggestion.meaning}</p>
					{/if}
				</button>
			</li>
		{/each}
	</ul>

	{#if babyName.shortlist.length > 0}
		<div class="shortlist-count">
			{babyName.shortlist.length} shortlisted
		</div>
	{/if}

	<div class="actions">
		<Button
			onclick={() => babyName.saveResult()}
			disabled={babyName.shortlist.length === 0}
			fullWidth
		>
			{babyName.shortlist.length === 0 ? 'Shortlist names to lock in →' : `Lock in ${babyName.shortlist.length} name${babyName.shortlist.length === 1 ? '' : 's'} →`}
		</Button>
	</div>

	<div class="secondary-actions">
		<Button
			variant="ghost"
			onclick={() => babyName.regenerate()}
			disabled={babyName.loading}
		>
			{babyName.loading ? 'Generating…' : '↺ Regenerate'}
		</Button>
		<Button variant="ghost" onclick={() => babyName.startOver()}>
			Start over
		</Button>
	</div>
</div>

<style>
	.final {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.title {
		font-size: 1.375rem;
		font-weight: 700;
		color: var(--color-on-surface);
		margin: 0;
		text-align: center;
	}

	.hint {
		font-size: 0.8125rem;
		color: var(--color-muted);
		text-align: center;
		margin: calc(-1 * var(--space-2)) 0 0;
	}

	.name-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.name-card {
		width: 100%;
		text-align: left;
		padding: var(--space-3) var(--space-4);
		background: var(--color-surface-raised);
		border: 1.5px solid var(--color-muted);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.15s;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.name-card.shortlisted,
	.name-card[aria-pressed='true'] {
		border-color: var(--color-primary);
		background: var(--color-primary-bg);
	}

	.name-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.name {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-on-surface);
	}

	.check {
		font-size: 1rem;
		color: var(--color-primary-text);
	}

	.meta {
		font-size: 0.75rem;
		color: var(--color-muted);
		font-family: var(--font-mono);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin: 0;
	}

	.meaning {
		font-size: 0.875rem;
		color: var(--color-on-surface);
		margin: 0;
		opacity: 0.8;
		line-height: 1.4;
	}

	.shortlist-count {
		text-align: center;
		font-size: 0.875rem;
		color: var(--color-primary-text);
		font-weight: 600;
	}

	.error-msg {
		color: var(--color-danger);
		font-size: 0.875rem;
		margin: 0;
		padding: var(--space-2) var(--space-3);
		background: color-mix(in srgb, var(--color-danger) 10%, transparent);
		border-radius: var(--radius-md);
	}

	.actions {
		padding-top: var(--space-2);
	}

	.secondary-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: center;
		padding-top: var(--space-2);
		border-top: 1px solid var(--color-muted);
	}
</style>

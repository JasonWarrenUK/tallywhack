<script lang="ts">
	import { babyName } from '../state/babyName.svelte.js';
	import { Button } from '$lib/components/index.js';
</script>

<div class="intro">
	<p class="blurb">
		Two people. Two taste profiles. One set of names you might actually agree on.
	</p>

	<ol class="how">
		<li>Person A sets their preferences and swipes 20 example names</li>
		<li>Hand over the device — Person B does the same</li>
		<li>We combine your tastes and generate names you'd both like</li>
	</ol>

	<div class="names">
		<div class="name-field">
			<label for="name-a">Person A's name</label>
			<input
				id="name-a"
				type="text"
				placeholder="e.g. Jason"
				value={babyName.profileA.person}
				oninput={(e) => babyName.setPersonName('A', e.currentTarget.value)}
			/>
		</div>
		<div class="name-field">
			<label for="name-b">Person B's name</label>
			<input
				id="name-b"
				type="text"
				placeholder="e.g. Harriet"
				value={babyName.profileB.person}
				oninput={(e) => babyName.setPersonName('B', e.currentTarget.value)}
			/>
		</div>
	</div>

	<Button fullWidth onclick={() => babyName.start()}>
		Start — {babyName.profileA.person || 'Person A'} goes first →
	</Button>
</div>

<style>
	.intro {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.blurb {
		font-size: 1.0625rem;
		color: var(--color-on-surface);
		text-align: center;
		margin: 0;
	}

	.how {
		background: var(--color-surface-raised);
		border-radius: var(--radius-lg);
		padding: var(--space-4) var(--space-4) var(--space-4) var(--space-7);
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.how li {
		font-size: 0.9375rem;
		color: var(--color-on-surface);
		line-height: 1.5;
	}

	.names {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.name-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
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
</style>

<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { registry } from '$lib/modules/discover';
	import { resolvePalette } from '$lib/modules/palette';

	let { children } = $props();

	const palette = $derived(resolvePalette(registry, page.url.pathname));
</script>

<div data-palette={palette} style="display: contents">
	{@render children()}
</div>

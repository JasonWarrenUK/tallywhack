/**
 * Global theme store — runes singleton.
 *
 * Holds the user's Light / Dark / System preference, persists it to
 * localStorage as a raw string (see theme.ts for why not createLocalStore),
 * and keeps <html data-theme> in sync so the CSS cascade picks up the
 * correct colour scheme instantly on every change.
 *
 * Usage:
 *   import { theme } from '$lib/state/theme.svelte.js';
 *   theme.init();          // call once in +layout.svelte onMount
 *   theme.choice           // reactive getter
 *   theme.set('dark');     // persist + apply
 */

import { browser } from '$app/environment';
import {
	parseThemeChoice,
	resolveTheme,
	THEME_STORAGE_KEY,
	type ThemeChoice,
	type ResolvedTheme
} from './theme.js';

export interface ThemeStore {
	readonly choice: ThemeChoice;
	readonly resolved: ResolvedTheme;
	set(next: ThemeChoice): void;
	/** Wire up the matchMedia listener so the app follows live OS changes
	 * while in 'system' mode. Call once from the layout's onMount. */
	init(): void;
}

function createThemeStore(): ThemeStore {
	// Initialise from localStorage in the browser; default to 'system' on SSR.
	let choice = $state<ThemeChoice>(
		browser ? parseThemeChoice(localStorage.getItem(THEME_STORAGE_KEY)) : 'system'
	);

	// Track the live OS colour-scheme preference.
	let systemPrefersDark = $state(
		browser ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
	);

	const resolved = $derived<ResolvedTheme>(resolveTheme(choice, systemPrefersDark));

	/** Write the resolved theme to <html data-theme> so the CSS applies. */
	function apply(): void {
		if (!browser) return;
		// Always write a concrete 'light' | 'dark' — never 'system' — so
		// the attribute selector in app.css is the live source of truth.
		document.documentElement.dataset.theme = resolved;
	}

	function set(next: ThemeChoice): void {
		choice = next;
		if (browser) {
			try {
				localStorage.setItem(THEME_STORAGE_KEY, next);
			} catch {
				// Swallow write errors (private browsing, storage quota).
			}
		}
		apply();
	}

	function init(): void {
		if (!browser) return;
		// Apply the stored preference immediately (the FOUC script did this
		// before hydration; this keeps the store in sync).
		apply();

		// Listen for live OS colour-scheme changes while the app is open.
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		mq.addEventListener('change', (event) => {
			systemPrefersDark = event.matches;
			apply();
		});
	}

	return {
		get choice() { return choice; },
		get resolved() { return resolved; },
		set,
		init
	};
}

export const theme = createThemeStore();
export type Theme = ReturnType<typeof createThemeStore>;

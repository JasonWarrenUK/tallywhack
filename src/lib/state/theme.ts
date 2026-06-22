/**
 * Pure theme-resolution helpers.
 *
 * No DOM, no runes, no browser APIs — trivially testable.
 *
 * Both the runes store (theme.svelte.ts) and the FOUC inline script in
 * app.html embody this logic. Keeping it here as a pure function means the
 * precedence rule ("explicit choice always beats the OS preference") is
 * verified by tests rather than assumed.
 */

/** The user's stored theme preference. 'system' follows the OS colour scheme. */
export type ThemeChoice = 'light' | 'dark' | 'system';

/** A concrete, resolved theme — what gets written to <html data-theme>. */
export type ResolvedTheme = 'light' | 'dark';

/**
 * localStorage key for the raw theme preference string.
 *
 * Deliberately NOT stored via createLocalStore's {version,data} envelope so
 * the FOUC inline script in app.html can read it without parsing JSON or
 * knowing the envelope format. Only the theme preference uses this pattern;
 * all module state still uses createLocalStore.
 */
export const THEME_STORAGE_KEY = 'app:theme';

const VALID_CHOICES: readonly ThemeChoice[] = ['light', 'dark', 'system'];

/**
 * Narrow an unknown stored value to a ThemeChoice, defaulting to 'system'.
 * Handles null (no stored choice), empty string, and unrecognised values.
 */
export function parseThemeChoice(raw: string | null): ThemeChoice {
	return VALID_CHOICES.includes(raw as ThemeChoice) ? (raw as ThemeChoice) : 'system';
}

/**
 * Resolve a ThemeChoice to a concrete ResolvedTheme given the current OS
 * colour-scheme preference. Explicit choices ('light' | 'dark') always win
 * over the system setting.
 */
export function resolveTheme(choice: ThemeChoice, systemPrefersDark: boolean): ResolvedTheme {
	if (choice === 'system') return systemPrefersDark ? 'dark' : 'light';
	return choice;
}

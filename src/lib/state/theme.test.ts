import { describe, expect, it } from 'bun:test';
import { parseThemeChoice, resolveTheme } from './theme.js';

// ---------------------------------------------------------------------------
// resolveTheme — explicit choice always beats the OS preference
// ---------------------------------------------------------------------------

describe('resolveTheme', () => {
	it("returns 'light' for explicit 'light' regardless of system preference", () => {
		expect(resolveTheme('light', false)).toBe('light');
		expect(resolveTheme('light', true)).toBe('light');
	});

	it("returns 'dark' for explicit 'dark' regardless of system preference", () => {
		expect(resolveTheme('dark', false)).toBe('dark');
		expect(resolveTheme('dark', true)).toBe('dark');
	});

	it("returns 'dark' for 'system' when the OS prefers dark", () => {
		expect(resolveTheme('system', true)).toBe('dark');
	});

	it("returns 'light' for 'system' when the OS prefers light", () => {
		expect(resolveTheme('system', false)).toBe('light');
	});
});

// ---------------------------------------------------------------------------
// parseThemeChoice — unknown/missing values default to 'system'
// ---------------------------------------------------------------------------

describe('parseThemeChoice', () => {
	it("returns 'light' for the stored string 'light'", () => {
		expect(parseThemeChoice('light')).toBe('light');
	});

	it("returns 'dark' for the stored string 'dark'", () => {
		expect(parseThemeChoice('dark')).toBe('dark');
	});

	it("returns 'system' for the stored string 'system'", () => {
		expect(parseThemeChoice('system')).toBe('system');
	});

	it("returns 'system' for null (no stored preference)", () => {
		expect(parseThemeChoice(null)).toBe('system');
	});

	it("returns 'system' for an empty string", () => {
		expect(parseThemeChoice('')).toBe('system');
	});

	it("returns 'system' for an unrecognised stored value", () => {
		expect(parseThemeChoice('auto')).toBe('system');
		expect(parseThemeChoice('Day')).toBe('system');
		expect(parseThemeChoice('DARK')).toBe('system');
	});
});

import { describe, expect, it } from 'bun:test';
import { buildRegistry } from './registry.js';
import { defineManifest, type GameResult, type ToolOutput } from './types.js';
import { DEFAULT_PALETTE, resolveModuleByPath, resolvePalette } from './palette.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const grumble = defineManifest<GameResult>({
	id: 'grumble',
	name: 'Grumble',
	category: 'games',
	icon: '🃏',
	routes: ['/games/grumble'],
	theme: 'emerald',
	resultsKind: 'game:gin-rummy'
});

const reckoner = defineManifest<ToolOutput>({
	id: 'reckoner',
	name: 'Reckoner',
	category: 'tools',
	icon: '⚖️',
	routes: ['/tools/reckoner'],
	theme: 'sky',
	resultsKind: 'tool:ranking'
});

// A module with multiple routes, to test multi-route coverage.
const multiRoute = defineManifest<GameResult>({
	id: 'multi',
	name: 'Multi',
	category: 'games',
	icon: '🎮',
	routes: ['/games/multi', '/play/multi'],
	theme: 'rose',
	resultsKind: 'game:multi'
});

const registry = buildRegistry([grumble, reckoner, multiRoute]);

// ---------------------------------------------------------------------------
// resolveModuleByPath
// ---------------------------------------------------------------------------

describe('resolveModuleByPath', () => {
	it('returns the manifest for an exact route match', () => {
		const result = resolveModuleByPath(registry, '/games/grumble');
		expect(result?.id).toBe('grumble');
	});

	it('returns the manifest when pathname is a sub-route of a module route', () => {
		const result = resolveModuleByPath(registry, '/games/grumble/round/3');
		expect(result?.id).toBe('grumble');
	});

	it('returns undefined when no route is a prefix of the pathname', () => {
		const result = resolveModuleByPath(registry, '/');
		expect(result).toBeUndefined();
	});

	it('returns undefined for an unrelated path', () => {
		const result = resolveModuleByPath(registry, '/settings/profile');
		expect(result).toBeUndefined();
	});

	it('does not match a route that is only a partial segment (no false prefix)', () => {
		// /games/grumble-extended does NOT match /games/grumble (would need a slash after)
		const result = resolveModuleByPath(registry, '/games/grumble-extended');
		expect(result).toBeUndefined();
	});

	it('resolves a module reachable by its second route', () => {
		const result = resolveModuleByPath(registry, '/play/multi/setup');
		expect(result?.id).toBe('multi');
	});

	it('resolves a tool module by its route', () => {
		const result = resolveModuleByPath(registry, '/tools/reckoner');
		expect(result?.id).toBe('reckoner');
	});

	it('resolves a tool sub-route', () => {
		const result = resolveModuleByPath(registry, '/tools/reckoner/results');
		expect(result?.id).toBe('reckoner');
	});
});

// ---------------------------------------------------------------------------
// resolvePalette
// ---------------------------------------------------------------------------

describe('resolvePalette', () => {
	it('returns the module theme for a matched route', () => {
		expect(resolvePalette(registry, '/games/grumble')).toBe('emerald');
	});

	it('returns the module theme for a matched sub-route', () => {
		expect(resolvePalette(registry, '/games/grumble/round/2')).toBe('emerald');
	});

	it('returns DEFAULT_PALETTE when no module matches', () => {
		expect(resolvePalette(registry, '/')).toBe(DEFAULT_PALETTE);
	});

	it('DEFAULT_PALETTE is azure', () => {
		expect(DEFAULT_PALETTE).toBe('azure');
	});

	it('returns the tool module palette for a tool route', () => {
		expect(resolvePalette(registry, '/tools/reckoner')).toBe('sky');
	});
});

import { describe, expect, it } from 'bun:test';
import grumbleManifest from './games/grumble/manifest.js';
import { buildRegistry, ModuleRegistryError, type DiscoveredManifest } from './registry.js';
import type { AnyModuleManifest } from './types.js';

// NOTE: discover.ts is intentionally NOT imported here. That file calls
// `import.meta.glob`, which is a Vite compile-time transform with no runtime
// under Bun — importing it would throw TypeError. Smoke coverage for the
// discovery wiring belongs to the route/integration layer (3BE.5).

// ---------------------------------------------------------------------------
// Helpers — inline test manifests
// ---------------------------------------------------------------------------

function makeGame(overrides?: Partial<AnyModuleManifest>): AnyModuleManifest {
	return {
		id: 'test-game',
		name: 'Test Game',
		category: 'games',
		icon: '🎲',
		routes: ['/games/test-game'],
		theme: 'azure',
		resultsKind: 'game:test',
		...overrides
	};
}

function makeTool(overrides?: Partial<AnyModuleManifest>): AnyModuleManifest {
	return {
		id: 'test-tool',
		name: 'Test Tool',
		category: 'tools',
		icon: '🔧',
		routes: ['/tools/test-tool'],
		theme: 'sky',
		resultsKind: 'tool:test',
		...overrides
	};
}

// ---------------------------------------------------------------------------
// Happy path — single manifest
// ---------------------------------------------------------------------------

describe('buildRegistry — single manifest', () => {
	it('registers a single manifest and resolves it by id', () => {
		const registry = buildRegistry([makeGame()]);
		expect(registry.byId('test-game')?.name).toBe('Test Game');
	});

	it('resolves by exact route', () => {
		const registry = buildRegistry([makeGame()]);
		expect(registry.byRoute('/games/test-game')?.id).toBe('test-game');
	});

	it('all() contains the single manifest', () => {
		const registry = buildRegistry([makeGame()]);
		expect(registry.all()).toHaveLength(1);
		expect(registry.all()[0].id).toBe('test-game');
	});
});

// ---------------------------------------------------------------------------
// Real grumble manifest
// ---------------------------------------------------------------------------

describe('buildRegistry — real grumble manifest', () => {
	it('registers grumble without error', () => {
		const registry = buildRegistry([grumbleManifest]);
		expect(registry.byId('grumble')).toBe(grumbleManifest);
	});

	it('resolves grumble by its declared route', () => {
		const registry = buildRegistry([grumbleManifest]);
		expect(registry.byRoute('/games/grumble')?.id).toBe('grumble');
	});
});

// ---------------------------------------------------------------------------
// byCategory
// ---------------------------------------------------------------------------

describe('byCategory', () => {
	it('returns only game manifests for "games"', () => {
		const registry = buildRegistry([makeGame(), makeTool()]);
		const games = registry.byCategory('games');
		expect(games).toHaveLength(1);
		expect(games[0].category).toBe('games');
	});

	it('returns empty array for "tools" when no tools are registered', () => {
		const registry = buildRegistry([makeGame()]);
		expect(registry.byCategory('tools')).toHaveLength(0);
	});

	it('returns only tool manifests for "tools"', () => {
		const registry = buildRegistry([makeGame(), makeTool()]);
		const tools = registry.byCategory('tools');
		expect(tools).toHaveLength(1);
		expect(tools[0].category).toBe('tools');
	});
});

// ---------------------------------------------------------------------------
// categories() — stable order and name sorting
// ---------------------------------------------------------------------------

describe('categories()', () => {
	it('returns groups in ["games", "tools"] order regardless of input order', () => {
		// Input order: tool first, game second.
		const registry = buildRegistry([makeTool(), makeGame()]);
		const groups = registry.categories();
		expect(groups[0].category).toBe('games');
		expect(groups[1].category).toBe('tools');
	});

	it('sorts modules by display name within each category', () => {
		const zebra = makeGame({ id: 'zebra', name: 'Zebra', routes: ['/games/zebra'] });
		const apple = makeGame({ id: 'apple', name: 'Apple', routes: ['/games/apple'] });
		const registry = buildRegistry([zebra, apple]);
		const games = registry.byCategory('games');
		expect(games[0].name).toBe('Apple');
		expect(games[1].name).toBe('Zebra');
	});

	it('returns all() as the flattened, category-ordered list', () => {
		const game = makeGame();
		const tool = makeTool();
		const registry = buildRegistry([tool, game]);
		const all = registry.all();
		// games group comes first, then tools.
		expect(all[0].category).toBe('games');
		expect(all[1].category).toBe('tools');
	});
});

// ---------------------------------------------------------------------------
// Mixed input — bare manifests and DiscoveredManifest wrappers
// ---------------------------------------------------------------------------

describe('buildRegistry — mixed input types', () => {
	it('accepts bare manifests and DiscoveredManifest wrappers in the same call', () => {
		const wrapped: DiscoveredManifest = {
			manifest: makeTool(),
			dirCategory: 'tools'
		};
		const registry = buildRegistry([makeGame(), wrapped]);
		expect(registry.all()).toHaveLength(2);
		expect(registry.byId('test-tool')).toBeDefined();
	});
});

// ---------------------------------------------------------------------------
// Lookups — undefined for unknown keys
// ---------------------------------------------------------------------------

describe('lookups — unknown keys', () => {
	it('byId returns undefined for an unknown id', () => {
		const registry = buildRegistry([makeGame()]);
		expect(registry.byId('no-such-module')).toBeUndefined();
	});

	it('byRoute returns undefined for an unknown route', () => {
		const registry = buildRegistry([makeGame()]);
		expect(registry.byRoute('/no/such/route')).toBeUndefined();
	});

	it('byRoute is exact — does not match sub-paths', () => {
		const registry = buildRegistry([makeGame()]);
		expect(registry.byRoute('/games/test-game/round/3')).toBeUndefined();
	});

	it('a module with multiple routes is reachable by each route', () => {
		const multi = makeGame({ routes: ['/games/test-game', '/legacy/test-game'] });
		const registry = buildRegistry([multi]);
		expect(registry.byRoute('/games/test-game')?.id).toBe('test-game');
		expect(registry.byRoute('/legacy/test-game')?.id).toBe('test-game');
	});
});

// ---------------------------------------------------------------------------
// Invariant violations — throw ModuleRegistryError
// ---------------------------------------------------------------------------

describe('buildRegistry — invariant violations', () => {
	it('throws on duplicate module id', () => {
		const a = makeGame({ id: 'clash', routes: ['/games/clash-a'] });
		const b = makeGame({ id: 'clash', routes: ['/games/clash-b'] });
		expect(() => buildRegistry([a, b])).toThrow(ModuleRegistryError);
	});

	it('throws on duplicate route string', () => {
		const a = makeGame({ id: 'alpha', routes: ['/shared/route'] });
		const b = makeGame({ id: 'beta', routes: ['/shared/route', '/games/beta'] });
		expect(() => buildRegistry([a, b])).toThrow(ModuleRegistryError);
	});

	it('throws when a module declares empty routes', () => {
		const noRoutes = makeGame({ routes: [] });
		expect(() => buildRegistry([noRoutes])).toThrow(ModuleRegistryError);
	});

	it('throws on category/directory mismatch', () => {
		const wrapped: DiscoveredManifest = {
			manifest: makeGame(), // declares category: 'games'
			dirCategory: 'tools' // but lives under tools/
		};
		expect(() => buildRegistry([wrapped])).toThrow(ModuleRegistryError);
	});

	it('error messages are descriptive', () => {
		const a = makeGame({ id: 'clash', routes: ['/games/clash-a'] });
		const b = makeGame({ id: 'clash', routes: ['/games/clash-b'] });
		expect(() => buildRegistry([a, b])).toThrow("Duplicate module id 'clash'");
	});
});

// ---------------------------------------------------------------------------
// Immutability
// ---------------------------------------------------------------------------

describe('registry immutability', () => {
	it('registry.all() is frozen', () => {
		const registry = buildRegistry([makeGame()]);
		expect(Object.isFrozen(registry.all())).toBe(true);
	});

	it('the registry object itself is frozen', () => {
		const registry = buildRegistry([makeGame()]);
		expect(Object.isFrozen(registry)).toBe(true);
	});
});

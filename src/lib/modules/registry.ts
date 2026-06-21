/**
 * Module registry (1FN.3) — the pure, filesystem-agnostic core of auto-discovery.
 *
 * This file deliberately contains NO `import.meta.glob`: that Vite-only transform
 * lives in discover.ts. Keeping discovery separate from registry-building means
 * buildRegistry() is a plain function that runs identically under `vite dev`,
 * `vite build`, and `bun test` — the glob has no runtime under Bun, so any code
 * that touches it cannot be unit-tested directly.
 *
 * Field-level validation (kebab-case ids, known theme tokens, etc.) is deferred
 * to 3BE.6, which adds the Zod schema promised by defineManifest(). 1FN.3 owns
 * only the collection-level invariants that auto-discovery itself can break:
 * duplicate ids, duplicate routes, empty routes, and category/directory mismatch.
 *
 * The registry is consumed by the app shell and route resolver (3BE.5).
 */
import type { AnyModuleManifest, ModuleCategory } from './types.js';

/** Stable order in which categories are presented to the UI. */
const CATEGORY_ORDER: readonly ModuleCategory[] = ['games', 'tools'];

/**
 * A manifest paired with the filesystem category it was discovered under.
 *
 * discover.ts derives `dirCategory` from the file path
 * (src/lib/modules/<dirCategory>/<id>/manifest.ts) so buildRegistry() can verify
 * the manifest's declared `category` matches where it actually lives. In pure
 * unit tests, `dirCategory` may be omitted to supply manifests directly.
 */
export interface DiscoveredManifest {
	/** The module manifest, as exported via `export default defineManifest(...)`. */
	manifest: AnyModuleManifest;
	/** Category inferred from the filesystem directory, if known. */
	dirCategory?: ModuleCategory;
}

/** One category and its modules, pre-grouped and name-sorted for the shell. */
export interface CategoryGroup {
	/** The category these modules belong to. */
	category: ModuleCategory;
	/** Modules in this category, sorted by display name. */
	modules: readonly AnyModuleManifest[];
}

/**
 * The queryable module registry. Returned by buildRegistry() and consumed by the
 * app shell (3BE.5). All return values are readonly snapshots.
 */
export interface ModuleRegistry {
	/** Every registered module, in category order then sorted by display name. */
	all(): readonly AnyModuleManifest[];
	/** Modules in one category, sorted by display name. */
	byCategory(category: ModuleCategory): readonly AnyModuleManifest[];
	/** Look up a module by its unique id, or undefined if none matches. */
	byId(id: string): AnyModuleManifest | undefined;
	/**
	 * Look up the module that owns an exact route string, or undefined.
	 *
	 * Match is exact: `/games/grumble` resolves to grumble but
	 * `/games/grumble/round/3` does not. Prefix-based resolution is a
	 * concern for the route resolver (3BE.5), not the registry.
	 */
	byRoute(route: string): AnyModuleManifest | undefined;
	/** Modules grouped by category in stable category order. */
	categories(): readonly CategoryGroup[];
}

/**
 * Thrown when discovered manifests violate a collection-level invariant
 * (duplicate id, duplicate route, empty routes, or category/directory mismatch).
 *
 * These are author errors caught at build/registry-construction time, not
 * runtime user errors, so failing loudly is correct.
 */
export class ModuleRegistryError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ModuleRegistryError';
	}
}

/**
 * Build an immutable registry from a flat list of discovered manifests.
 *
 * Pure and deterministic: given the same manifests it always returns the same
 * registry, independent of input order. Throws ModuleRegistryError on any
 * collection-level invariant violation.
 *
 * Accepts either bare manifests or DiscoveredManifest wrappers in the same
 * call, so it is convenient both from discover.ts and from unit tests.
 *
 * @param input - Discovered manifests, optionally wrapped with their directory category.
 * @returns A frozen ModuleRegistry exposing all/byCategory/byId/byRoute/categories.
 */
export function buildRegistry(
	input: readonly (AnyModuleManifest | DiscoveredManifest)[]
): ModuleRegistry {
	const entries: DiscoveredManifest[] = input.map((item) =>
		'manifest' in item ? item : { manifest: item }
	);

	const byIdMap = new Map<string, AnyModuleManifest>();
	const byRouteMap = new Map<string, AnyModuleManifest>();

	for (const { manifest, dirCategory } of entries) {
		// Empty routes: every module must be reachable by URL.
		if (manifest.routes.length === 0) {
			throw new ModuleRegistryError(
				`Module '${manifest.id}' declares no routes; every module must own at least one route.`
			);
		}

		// Category/directory mismatch: declared category must match filesystem location.
		if (dirCategory !== undefined && manifest.category !== dirCategory) {
			throw new ModuleRegistryError(
				`Module '${manifest.id}' declares category '${manifest.category}' but lives under '${dirCategory}/'.`
			);
		}

		// Duplicate id.
		if (byIdMap.has(manifest.id)) {
			throw new ModuleRegistryError(`Duplicate module id '${manifest.id}'.`);
		}
		byIdMap.set(manifest.id, manifest);

		// Duplicate routes.
		for (const route of manifest.routes) {
			const owner = byRouteMap.get(route);
			if (owner !== undefined) {
				throw new ModuleRegistryError(
					`Route '${route}' is claimed by both '${owner.id}' and '${manifest.id}'.`
				);
			}
			byRouteMap.set(route, manifest);
		}
	}

	// Pre-compute category groups in stable order, name-sorted within each group.
	const groups: readonly CategoryGroup[] = Object.freeze(
		CATEGORY_ORDER.map((category) => {
			const modules = [...byIdMap.values()]
				.filter((m) => m.category === category)
				.sort((a, b) => a.name.localeCompare(b.name));
			return Object.freeze({ category, modules: Object.freeze(modules) });
		})
	);

	const all: readonly AnyModuleManifest[] = Object.freeze(
		groups.flatMap((g) => [...g.modules])
	);

	const registry: ModuleRegistry = Object.freeze({
		all: () => all,
		byCategory: (category: ModuleCategory): readonly AnyModuleManifest[] =>
			groups.find((g) => g.category === category)?.modules ?? Object.freeze([]),
		byId: (id: string): AnyModuleManifest | undefined => byIdMap.get(id),
		byRoute: (route: string): AnyModuleManifest | undefined => byRouteMap.get(route),
		categories: () => groups
	});

	return registry;
}

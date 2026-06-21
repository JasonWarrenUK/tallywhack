/**
 * Module auto-discovery (1FN.3) -- the Vite-only bridge between the filesystem
 * and the pure registry builder.
 *
 * `import.meta.glob` is a Vite compile-time transform with NO runtime under Bun.
 * This file is therefore NEVER imported by any test. Tests exercise buildRegistry()
 * directly (see registry.test.ts). Importing this file under `bun test` would
 * throw TypeError because `import.meta.glob` is undefined at runtime outside Vite.
 *
 * Convention (1FN.2): every module lives at
 *   src/lib/modules/{category}/{id}/manifest.ts
 * and does `export default defineManifest({...})`. The glob below uses two wildcard
 * levels (category, then id) to collect those default exports, infers each module's
 * directory category from its path, and hands the pairs to buildRegistry() so it
 * can verify declared category matches directory.
 *
 * Consumers that need the live registry (app shell, route resolver 3BE.5) import
 * from this file directly:
 *   import { registry } from '$lib/modules/discover';
 *
 * The barrel ($lib/modules) deliberately does NOT re-export `registry` so that
 * importing the barrel under `bun test` never evaluates this glob.
 */
import { buildRegistry, type DiscoveredManifest, type ModuleRegistry } from './registry.js';
import type { AnyModuleManifest, ModuleCategory } from './types.js';

interface ManifestModule {
	default: AnyModuleManifest;
}

// Eagerly import every module manifest. Vite resolves this to a static map of
// { '<path>/manifest.ts': { default: <manifest> } } at build time.
const modules = import.meta.glob<ManifestModule>('./*/*/manifest.ts', { eager: true });

const discovered: DiscoveredManifest[] = Object.entries(modules).map(([path, mod]) => ({
	manifest: mod.default,
	dirCategory: categoryFromPath(path)
}));

/**
 * Infer the filesystem category from a discovered manifest path.
 *
 * Path shape emitted by the glob: `./<category>/<id>/manifest.ts`.
 * Segment at index 1 (after the leading `.`) is the category directory.
 */
function categoryFromPath(path: string): ModuleCategory | undefined {
	const segment = path.split('/')[1];
	return segment === 'games' || segment === 'tools' ? segment : undefined;
}

/**
 * The application-wide module registry, built from every manifest discovered
 * on the filesystem at build time.
 *
 * Import from '$lib/modules/discover' in Vite contexts (Svelte components, route
 * loaders). See registry.ts for the full query API surface.
 */
export const registry: ModuleRegistry = buildRegistry(discovered);

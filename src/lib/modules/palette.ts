/**
 * Palette resolution helpers — 1FN.4.
 *
 * Pure functions; no Vite-only APIs. Safe to import in bun test and in server
 * contexts. The live registry from `$lib/modules/discover` is injected by the
 * caller rather than imported here.
 */

import type { ModuleRegistry } from './registry.js';
import type { AnyModuleManifest, PaletteToken } from './types.js';

/** The palette applied when no module matches the current route. */
export const DEFAULT_PALETTE: PaletteToken = 'azure';

/**
 * Find the module whose declared route is the longest prefix of `pathname`.
 *
 * `registry.byRoute()` is exact-match only, so this function iterates all
 * manifests and picks the best prefix candidate. Longest match wins (more
 * specific routes take precedence over shorter ones).
 *
 * Returns `undefined` when no manifest route is a prefix of `pathname`
 * (e.g. the landing page `/`).
 *
 * @example
 * resolveModuleByPath(registry, '/games/grumble/round/3')
 * // → grumble manifest (route '/games/grumble' is the longest match)
 */
export function resolveModuleByPath(
	registry: ModuleRegistry,
	pathname: string
): AnyModuleManifest | undefined {
	let best: AnyModuleManifest | undefined;
	let bestLength = 0;

	for (const manifest of registry.all()) {
		for (const route of manifest.routes) {
			if (
				pathname === route ||
				pathname.startsWith(route === '/' ? route : route + '/')
			) {
				if (route.length > bestLength) {
					best = manifest;
					bestLength = route.length;
				}
			}
		}
	}

	return best;
}

/**
 * Derive the active `PaletteToken` from the current pathname.
 *
 * Convenience wrapper around `resolveModuleByPath` that falls back to
 * `DEFAULT_PALETTE` when no module matches.
 */
export function resolvePalette(
	registry: ModuleRegistry,
	pathname: string
): PaletteToken {
	return resolveModuleByPath(registry, pathname)?.theme ?? DEFAULT_PALETTE;
}

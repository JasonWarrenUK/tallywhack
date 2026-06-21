/**
 * Public contract surface for the Tallywhack module system.
 *
 * Import from '$lib/modules' to access the manifest interface, result types,
 * category helpers, the defineManifest() constructor, and the registry builder.
 *
 * Note: the live `registry` instance lives in './discover.ts' (Vite-only) and
 * is intentionally absent from this barrel so importing '$lib/modules' under
 * `bun test` never evaluates `import.meta.glob`.
 */
export {
	defineManifest,
	type AnyGameManifest,
	type AnyModuleManifest,
	type AnyToolManifest,
	type GameResult,
	type GameResultCore,
	type ModuleCategory,
	type ModuleManifest,
	type ModuleResult,
	type PlayerId,
	type ToolOutput
} from './types.js';

export {
	buildRegistry,
	ModuleRegistryError,
	type CategoryGroup,
	type DiscoveredManifest,
	type ModuleRegistry
} from './registry.js';

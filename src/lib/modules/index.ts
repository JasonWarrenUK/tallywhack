/**
 * Public contract surface for the Tallywhack module system.
 *
 * Import from '$lib/modules' to access the manifest interface, result types,
 * category helpers, and the defineManifest() constructor.
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

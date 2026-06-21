/**
 * Module contract — the stable public interface every Tallywhack module must satisfy.
 *
 * This file is load-bearing: 1FN.3 (auto-discovery), 3BE.6 (persistence),
 * and 4RIV.* (rivalry/meta-score) all depend on these shapes. Future changes
 * to ModuleManifest or GameResultCore are breaking changes.
 */

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

/** All games are strictly two-player hot-seat. */
export type PlayerId = 0 | 1;

// ---------------------------------------------------------------------------
// Result types — stable core + generic detail
// ---------------------------------------------------------------------------

/**
 * The minimal game result that rivalry and meta-score code (4RIV.1/4RIV.2)
 * can consume regardless of the game's specific ruleset.
 *
 * Every game guarantees this shape; individual game detail lives in the
 * generic `Detail` parameter of `GameResult`.
 */
export interface GameResultCore {
	/** The player who won this game. */
	winner: PlayerId;
	/** Final comparable totals per player. Keyed by PlayerId, not an array. */
	scores: Record<PlayerId, number>;
	/** Display names per player. */
	names: Record<PlayerId, string>;
}

/**
 * A complete game result: the stable core plus a module-specific detail blob.
 *
 * Each game module parametrises its own `Detail` type (e.g. GrumbleDetail
 * includes base/lines/handCount). Rivalry code only ever touches GameResultCore.
 *
 * @example
 * type SushiGoResult = GameResult<{ categories: CategoryBreakdown }>;
 */
export interface GameResult<Detail = unknown> extends GameResultCore {
	/** Module-specific scoring breakdown — typed by the module, opaque to the registry. */
	detail: Detail;
}

/**
 * The output produced by a tool module (not a competitive game).
 *
 * Tools have no winner or comparable scores. The payload shape is module-specific;
 * `kind` acts as a discriminator for the registry and persistence layer.
 *
 * Note: tools are NOT restricted to 2 players — Reckoner supports N participants.
 *
 * @example
 * type ReckonderOutput = ToolOutput<{ ranking: RankedEntry[] }>;
 */
export interface ToolOutput<Payload = unknown> {
	/** Discriminator for the persistence layer (e.g. 'ranking', 'selection'). */
	kind: string;
	/** Module-specific output — typed by the module, opaque to the registry. */
	payload: Payload;
}

/**
 * Discriminated union over all possible module results.
 * Narrow on `category` to access game-specific or tool-specific fields.
 */
export type ModuleResult =
	| { category: 'games'; result: GameResult }
	| { category: 'tools'; result: ToolOutput };

// ---------------------------------------------------------------------------
// Module categories
// ---------------------------------------------------------------------------

/**
 * The two top-level categories. These map to the filesystem layout under
 * src/lib/modules/<category>/<module>/ and to the `category` field in the URL.
 */
export type ModuleCategory = 'games' | 'tools';

// ---------------------------------------------------------------------------
// Module manifest
// ---------------------------------------------------------------------------

/**
 * The manifest every module exports as its default.
 *
 * Generic over the result type `R` so the module and its consumers share
 * full type information, while the registry can hold heterogeneous manifests
 * via the `AnyModuleManifest` alias below.
 *
 * Use `defineManifest()` to construct a manifest — it provides type inference
 * and a single evolution point for future validation.
 */
export interface ModuleManifest<R = unknown> {
	/** Unique kebab-case identifier (e.g. 'grumble', 'sushi-go'). */
	id: string;

	/** Human-readable display name (e.g. 'Grumble', 'Sushi Go!'). */
	name: string;

	/** Top-level category; must match the filesystem directory. */
	category: ModuleCategory;

	/**
	 * Icon identifier — emoji or named icon key.
	 * Loosely typed until 1FN.4 (themeable design system) formalises the icon set.
	 */
	icon: string;

	/**
	 * SvelteKit route prefixes this module owns (e.g. ['/games/grumble']).
	 * 1FN.3 (auto-discovery) uses these to build the module registry.
	 */
	routes: string[];

	/**
	 * Palette token key for the module's colour theme (e.g. 'azure', 'emerald').
	 * Loosely typed until 1FN.4 formalises the token/palette system.
	 */
	theme: string;

	/**
	 * Opaque discriminator the registry and persistence layer (3BE.6) can read
	 * without unwrapping the full generic `R`. Examples: 'game:gin-rummy',
	 * 'tool:ranking'. Complements the `category` field for finer-grained routing.
	 */
	resultsKind: string;

	/**
	 * Unused at runtime in 1FN.2; typed placeholder so TypeScript retains
	 * the result-type parameter `R` and provides inference at call-sites.
	 * The persistence layer (3BE.6) will populate this with actual result data.
	 */
	_resultType?: R;
}

// ---------------------------------------------------------------------------
// Registry-facing aliases — erase the generic for heterogeneous collections
// ---------------------------------------------------------------------------

/** A game module manifest with type information erased for registry storage. */
export type AnyGameManifest = ModuleManifest<GameResult>;

/** A tool module manifest with type information erased for registry storage. */
export type AnyToolManifest = ModuleManifest<ToolOutput>;

/** Any module manifest — use this in the registry and any code that handles both categories. */
export type AnyModuleManifest = AnyGameManifest | AnyToolManifest;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Identity helper that returns the manifest unchanged.
 *
 * Using this instead of a plain object literal gives TypeScript better
 * inference for the `R` parameter, and provides a single call-site to
 * add runtime validation (e.g. Zod) when 3BE.6 (persistence) lands.
 *
 * @example
 * export default defineManifest<GrumbleResult>({ id: 'grumble', ... });
 */
export function defineManifest<R>(manifest: ModuleManifest<R>): ModuleManifest<R> {
	return manifest;
}

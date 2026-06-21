import { describe, expect, it } from 'bun:test';
import {
	defineManifest,
	type AnyModuleManifest,
	type GameResult,
	type ModuleResult,
	type PlayerId,
	type ToolOutput
} from './index.js';
import grumbleManifest, { type GrumbleResult } from './games/grumble/manifest.js';

// ---------------------------------------------------------------------------
// defineManifest — round-trip
// ---------------------------------------------------------------------------

describe('defineManifest', () => {
	it('returns the manifest unchanged', () => {
		const manifest = defineManifest<GameResult>({
			id: 'test-game',
			name: 'Test Game',
			category: 'games',
			icon: '🎲',
			routes: ['/games/test-game'],
			theme: 'azure',
			resultsKind: 'game:test'
		});

		expect(manifest.id).toBe('test-game');
		expect(manifest.name).toBe('Test Game');
		expect(manifest.category).toBe('games');
		expect(manifest.icon).toBe('🎲');
		expect(manifest.routes).toEqual(['/games/test-game']);
		expect(manifest.theme).toBe('azure');
		expect(manifest.resultsKind).toBe('game:test');
	});

	it('works for tool manifests', () => {
		const manifest = defineManifest<ToolOutput<{ ranking: string[] }>>({
			id: 'test-tool',
			name: 'Test Tool',
			category: 'tools',
			icon: '🔧',
			routes: ['/tools/test-tool'],
			theme: 'sky',
			resultsKind: 'tool:ranking'
		});

		expect(manifest.category).toBe('tools');
		expect(manifest.resultsKind).toBe('tool:ranking');
	});
});

// ---------------------------------------------------------------------------
// ModuleResult discriminated union — narrowing
// ---------------------------------------------------------------------------

/**
 * Helper that narrows a ModuleResult and extracts the relevant value.
 * If the union doesn't narrow correctly, TypeScript will error here.
 */
function extractWinner(result: ModuleResult): PlayerId | null {
	if (result.category === 'games') {
		// TypeScript must know result.result is GameResult here
		return result.result.winner;
	}
	return null;
}

function extractToolKind(result: ModuleResult): string | null {
	if (result.category === 'tools') {
		// TypeScript must know result.result is ToolOutput here
		return result.result.kind;
	}
	return null;
}

describe('ModuleResult discriminated union', () => {
	it('narrows to GameResult on category games and exposes winner', () => {
		const result: ModuleResult = {
			category: 'games',
			result: {
				winner: 0,
				scores: { 0: 150, 1: 80 },
				names: { 0: 'Jason', 1: 'Harriet' },
				detail: {}
			}
		};

		expect(extractWinner(result)).toBe(0);
		expect(extractToolKind(result)).toBeNull();
	});

	it('narrows to ToolOutput on category tools and exposes kind', () => {
		const result: ModuleResult = {
			category: 'tools',
			result: {
				kind: 'ranking',
				payload: { ranking: ['Marigold', 'Wren'] }
			}
		};

		expect(extractWinner(result)).toBeNull();
		expect(extractToolKind(result)).toBe('ranking');
	});
});

// ---------------------------------------------------------------------------
// Grumble manifest — concrete consumer
// ---------------------------------------------------------------------------

describe('grumble manifest', () => {
	it('satisfies the module contract fields', () => {
		expect(grumbleManifest.id).toBe('grumble');
		expect(grumbleManifest.name).toBe('Grumble');
		expect(grumbleManifest.category).toBe('games');
		expect(grumbleManifest.routes).toContain('/games/grumble');
		expect(grumbleManifest.resultsKind).toBe('game:gin-rummy');
	});

	it('is assignable to AnyModuleManifest', () => {
		// Type-level assertion: if this compiles, the manifest satisfies AnyModuleManifest.
		const typed: AnyModuleManifest = grumbleManifest as AnyModuleManifest;
		expect(typed.id).toBe('grumble');
	});

	// Type-only compile check: GrumbleResult carries the expected detail shape.
	it('GrumbleResult generic parameter includes base, lines, handCount (compile check)', () => {
		const sampleResult: GrumbleResult = {
			winner: 1,
			scores: { 0: 80, 1: 150 },
			names: { 0: 'Jason', 1: 'Harriet' },
			detail: {
				base: { 0: 60, 1: 100 },
				lines: { 0: 20, 1: 50 },
				handCount: 7
			}
		};
		expect(sampleResult.detail.handCount).toBe(7);
		expect(sampleResult.winner).toBe(1);
	});
});

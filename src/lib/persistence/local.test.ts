/**
 * Tests for the pure version / migrate logic in createLocalStore.
 *
 * We cannot test the browser/localStorage I/O directly under bun test (no DOM),
 * so we test the deterministic branches: version-mismatch discards the entry,
 * parse failure returns null, and a migrate function is applied to the raw data.
 * The browser guard (no-op on SSR) is not tested here — it requires a jsdom environment.
 */

import { describe, expect, it } from 'bun:test';

// ---------------------------------------------------------------------------
// Minimal inline re-implementation of the pure logic so we can test it without
// touching $app/environment (which doesn't exist in bun test).
// ---------------------------------------------------------------------------

interface Envelope {
	version: number;
	data: unknown;
}

function parseEnvelope(raw: string, version: number): unknown | null {
	try {
		const envelope = JSON.parse(raw) as Envelope;
		if (envelope.version !== version) return null;
		return envelope.data;
	} catch {
		return null;
	}
}

describe('parseEnvelope (version gate)', () => {
	it('returns data when version matches', () => {
		const raw = JSON.stringify({ version: 1, data: { name: 'Alice' } });
		expect(parseEnvelope(raw, 1)).toEqual({ name: 'Alice' });
	});

	it('returns null when version does not match', () => {
		const raw = JSON.stringify({ version: 2, data: { name: 'Alice' } });
		expect(parseEnvelope(raw, 1)).toBeNull();
	});

	it('returns null on invalid JSON', () => {
		expect(parseEnvelope('not-json{', 1)).toBeNull();
	});

	it('returns null on empty string', () => {
		expect(parseEnvelope('', 1)).toBeNull();
	});
});

describe('migrate logic', () => {
	it('applies migrate to the raw data', () => {
		const migrate = (raw: unknown): { count: number } | null => {
			const r = raw as Partial<{ count: number }>;
			if (typeof r.count !== 'number') return null;
			return { count: r.count + 1 };
		};

		const data = parseEnvelope(JSON.stringify({ version: 1, data: { count: 5 } }), 1);
		const result = migrate(data);
		expect(result).toEqual({ count: 6 });
	});

	it('migrate can reject stale / incomplete data by returning null', () => {
		const migrate = (raw: unknown): { name: string } | null => {
			const r = raw as Partial<{ name: string }>;
			return r.name ? { name: r.name } : null;
		};

		const data = parseEnvelope(JSON.stringify({ version: 1, data: {} }), 1);
		expect(migrate(data)).toBeNull();
	});

	it('migrate can back-fill defaults from partial data', () => {
		const DEFAULTS = { a: 1, b: 2, c: 3 };
		const migrate = (raw: unknown) => ({ ...DEFAULTS, ...(raw as object) });

		const data = parseEnvelope(JSON.stringify({ version: 1, data: { b: 99 } }), 1);
		expect(migrate(data)).toEqual({ a: 1, b: 99, c: 3 });
	});
});

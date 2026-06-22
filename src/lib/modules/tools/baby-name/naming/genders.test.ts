/**
 * Unit tests for allowedGendersForPartner — the cross-person gender overlap rule.
 *
 * Run with: bun test
 */

import { describe, test, expect } from 'bun:test';
import { allowedGendersForPartner } from './genders.js';

describe('allowedGendersForPartner', () => {
	// -----------------------------------------------------------------------
	// Empty selection
	// -----------------------------------------------------------------------

	test('empty A → all three genders allowed for B', () => {
		expect(allowedGendersForPartner([])).toEqual(['male', 'female', 'neutral']);
	});

	// -----------------------------------------------------------------------
	// Single selections
	// -----------------------------------------------------------------------

	test('{male} → B may pick male or neutral', () => {
		expect(allowedGendersForPartner(['male'])).toEqual(['male', 'neutral']);
	});

	test('{female} → B may pick female or neutral', () => {
		expect(allowedGendersForPartner(['female'])).toEqual(['female', 'neutral']);
	});

	test('{neutral} → B may pick any (neutral unlocks all)', () => {
		expect(allowedGendersForPartner(['neutral'])).toEqual(['male', 'female', 'neutral']);
	});

	// -----------------------------------------------------------------------
	// Two-item selections
	// -----------------------------------------------------------------------

	test('{male, female} → B may pick any', () => {
		expect(allowedGendersForPartner(['male', 'female'])).toEqual(['male', 'female', 'neutral']);
	});

	test('{male, neutral} → B may pick any (neutral bridges)', () => {
		expect(allowedGendersForPartner(['male', 'neutral'])).toEqual(['male', 'female', 'neutral']);
	});

	test('{female, neutral} → B may pick any (neutral bridges)', () => {
		expect(allowedGendersForPartner(['female', 'neutral'])).toEqual(['male', 'female', 'neutral']);
	});

	// -----------------------------------------------------------------------
	// Full selection
	// -----------------------------------------------------------------------

	test('{male, female, neutral} → B may pick any', () => {
		expect(allowedGendersForPartner(['male', 'female', 'neutral'])).toEqual(['male', 'female', 'neutral']);
	});

	// -----------------------------------------------------------------------
	// Order and deduplication
	// -----------------------------------------------------------------------

	test('returns genders in canonical order (male, female, neutral)', () => {
		const result = allowedGendersForPartner(['neutral']);
		expect(result).toEqual(['male', 'female', 'neutral']);
	});

	test('no duplicates in result', () => {
		const result = allowedGendersForPartner(['male', 'neutral']);
		const unique = [...new Set(result)];
		expect(result).toEqual(unique);
	});
});

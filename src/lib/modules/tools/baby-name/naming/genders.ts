/**
 * Gender constants and overlap logic for the Baby Name Chooser.
 *
 * When two users each select genders, their choices must overlap — names
 * must satisfy both. The overlap rule is asymmetric: 'neutral' acts as a
 * bridge. Selecting neutral unlocks all genders for the partner; selecting
 * male or female only restricts the partner to that concrete gender plus
 * neutral.
 *
 * See: allowedGendersForPartner truth table below.
 */

export type Gender = 'male' | 'female' | 'neutral';

export interface GenderOption {
	value: Gender;
	label: string;
}

/** All gender options in canonical display order. */
export const GENDER_OPTIONS: GenderOption[] = [
	{ value: 'male',    label: 'Male' },
	{ value: 'female',  label: 'Female' },
	{ value: 'neutral', label: 'Gender neutral' }
];

/**
 * Given Person A's gender selection, return the set of genders Person B is
 * allowed to pick. The constraint ensures the two people's selections will
 * have at least one gender in common when combined.
 *
 * Rules:
 *   - Empty A (no selection = "any") → B may pick anything.
 *   - A includes 'neutral' → B may pick all three (neutral bridges everything).
 *   - A includes 'male'    → B may pick 'male' and 'neutral'.
 *   - A includes 'female'  → B may pick 'female' and 'neutral'.
 *   - Multiple concrete selections from A: union of each selection's contribution.
 *
 * Truth table:
 *   {}                         → {male, female, neutral}
 *   {female}                   → {female, neutral}
 *   {male}                     → {male, neutral}
 *   {neutral}                  → {male, female, neutral}
 *   {male, female}             → {male, female, neutral}
 *   {male, neutral}            → {male, female, neutral}
 *   {female, neutral}          → {male, female, neutral}
 *   {male, female, neutral}    → {male, female, neutral}
 */
export function allowedGendersForPartner(personA: string[]): Gender[] {
	if (personA.length === 0) {
		return ['male', 'female', 'neutral'];
	}

	const allowed = new Set<Gender>(['neutral']); // neutral is always reachable

	if (personA.includes('male') || personA.includes('neutral')) {
		allowed.add('male');
	}
	if (personA.includes('female') || personA.includes('neutral')) {
		allowed.add('female');
	}

	// Return in canonical order
	return GENDER_OPTIONS.map((o) => o.value).filter((g) => allowed.has(g));
}

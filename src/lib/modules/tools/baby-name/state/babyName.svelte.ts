/**
 * Single source of truth for a Baby Name Chooser session.
 *
 * Two-person, async model:
 *   - Person A and B each go through their own Preferences + taste-refinement
 *     swipes independently. Either can complete their part in one sitting;
 *     the other can come back later — state is persisted to localStorage.
 *   - Once both profiles are complete, a CombinedProfile is derived and the
 *     final Claude call generates shared name suggestions.
 *   - Either person can toggle names on/off the shared shortlist.
 *   - Regenerate keeps the shortlist and replaces the rest.
 *
 * Runes singleton — import `babyName` anywhere and read its getters.
 */

import { buildTasteProfile, combineProfiles } from '../naming/combine.js';
import { requestExamples, requestFinalNames } from '../naming/client.js';
import type {
	BabyNameStep,
	InProgressProfile,
	NameSuggestion,
	Preferences,
	Rating,
	TasteProfile
} from '../naming/types.js';
import { PREFERENCE_DEFAULTS } from '../naming/types.js';
import { loadSession, saveSession, INITIAL } from './persistence.js';

const TARGET_FINAL_NAMES = 10;

function createBabyName() {
	// -----------------------------------------------------------------------
	// State
	// -----------------------------------------------------------------------

	let step       = $state<BabyNameStep>(INITIAL.step);
	let profileA   = $state<InProgressProfile>({ ...INITIAL.profileA });
	let profileB   = $state<InProgressProfile>({ ...INITIAL.profileB });
	let combined   = $state(INITIAL.combined);
	let shortlist  = $state<NameSuggestion[]>([]);
	let finalNames = $state<NameSuggestion[]>([]);
	let rejected   = $state<Set<string>>(new Set());
	let error      = $state<string | null>(null);
	let loading    = $state(false);

	// Rehydrate from localStorage on init (no-op on SSR).
	const saved = loadSession();
	if (saved) {
		step       = saved.step;
		profileA   = { ...saved.profileA };
		profileB   = { ...saved.profileB };
		combined   = saved.combined;
		shortlist  = [...saved.shortlist];
		finalNames = [...saved.finalNames];
		rejected   = new Set(saved.rejectedNames);
		error      = saved.error;
	}

	// -----------------------------------------------------------------------
	// Derived
	// -----------------------------------------------------------------------

	const currentPersonLabel = $derived(
		step.startsWith('personA') ? (profileA.person || 'Person A') : (profileB.person || 'Person B')
	);

	const activeProfile = $derived<InProgressProfile>(
		step.startsWith('personA') ? profileA : profileB
	);

	const currentExample = $derived<NameSuggestion | null>(
		activeProfile.exampleNames[activeProfile.currentIndex] ?? null
	);

	const totalExamples = $derived(activeProfile.exampleNames.length);

	const shortlistSet = $derived(new Set(shortlist.map((n) => n.name)));

	// -----------------------------------------------------------------------
	// Persistence
	// -----------------------------------------------------------------------

	function persist(): void {
		saveSession({
			step,
			profileA,
			profileB,
			combined,
			shortlist,
			finalNames,
			rejectedNames: rejected,
			error
		});
	}

	// -----------------------------------------------------------------------
	// Mutations — setup / preferences
	// -----------------------------------------------------------------------

	function setPersonName(person: 'A' | 'B', name: string): void {
		if (person === 'A') profileA = { ...profileA, person: name };
		else                profileB = { ...profileB, person: name };
		persist();
	}

	function updatePreferences(person: 'A' | 'B', prefs: Partial<Preferences>): void {
		if (person === 'A') {
			profileA = { ...profileA, preferences: { ...profileA.preferences, ...prefs } };
		} else {
			profileB = { ...profileB, preferences: { ...profileB.preferences, ...prefs } };
		}
		persist();
	}

	function togglePreference(
		person: 'A' | 'B',
		field: keyof Pick<Preferences, 'genders' | 'themes' | 'cultures'>,
		value: string
	): void {
		const current = person === 'A' ? profileA.preferences : profileB.preferences;
		const arr = current[field];
		const updated = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
		updatePreferences(person, { [field]: updated });
	}

	/**
	 * Submit preferences for a person and fetch their 20 taste-refinement examples.
	 * Advances the flow to the swipes step on success.
	 */
	async function submitPreferences(person: 'A' | 'B'): Promise<void> {
		const profile = person === 'A' ? profileA : profileB;
		error   = null;
		loading = true;

		try {
			const names = await requestExamples(profile.preferences);
			if (person === 'A') {
				profileA = { ...profileA, exampleNames: names, currentIndex: 0, ratings: {} };
				step = 'personA:swipes';
			} else {
				profileB = { ...profileB, exampleNames: names, currentIndex: 0, ratings: {} };
				step = 'personB:swipes';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch example names. Please try again.';
		} finally {
			loading = false;
		}

		persist();
	}

	// -----------------------------------------------------------------------
	// Mutations — taste swiping
	// -----------------------------------------------------------------------

	/**
	 * Rate the current example and advance. When the last example is rated:
	 *   - If this was person A → show handover, then person B prefs.
	 *   - If this was person B → move to combined step.
	 */
	function rateExample(person: 'A' | 'B', rating: Rating): void {
		const profile = person === 'A' ? profileA : profileB;
		const name    = profile.exampleNames[profile.currentIndex]?.name;
		if (!name) return;

		const updatedRatings = { ...profile.ratings, [name]: rating };
		const nextIndex      = profile.currentIndex + 1;
		const isDone         = nextIndex >= profile.exampleNames.length;

		if (person === 'A') {
			profileA = { ...profileA, ratings: updatedRatings, currentIndex: nextIndex };
			if (isDone) step = 'personB:prefs'; // handover to person B
		} else {
			profileB = { ...profileB, ratings: updatedRatings, currentIndex: nextIndex };
			if (isDone) step = 'combined';
		}

		persist();
	}

	// -----------------------------------------------------------------------
	// Mutations — combined profile & final names
	// -----------------------------------------------------------------------

	/**
	 * Build the CombinedProfile from both completed profiles and advance to
	 * the final-names generation step. Automatically triggers the Claude call.
	 */
	async function buildAndGenerateFinal(): Promise<void> {
		// Build TasteProfiles from the in-progress snapshots.
		const tasteA: TasteProfile = buildTasteProfile({
			person:      profileA.person || 'Person A',
			preferences: profileA.preferences,
			ratings:     profileA.ratings
		});
		const tasteB: TasteProfile = buildTasteProfile({
			person:      profileB.person || 'Person B',
			preferences: profileB.preferences,
			ratings:     profileB.ratings
		});

		combined = combineProfiles(tasteA, tasteB);
		step     = 'final:loading';
		error    = null;
		loading  = true;
		persist();

		try {
			const names = await requestFinalNames({
				keptNames:   [],
				countNeeded: TARGET_FINAL_NAMES,
				profileA:    tasteA,
				profileB:    tasteB,
				combined,
				exclusions:  combined.exclusions
			});
			finalNames = names;
			shortlist  = [];
			step       = 'final:names';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to generate names. Please try again.';
			step  = 'combined'; // allow retry
		} finally {
			loading = false;
		}

		persist();
	}

	// -----------------------------------------------------------------------
	// Mutations — shortlist & regenerate
	// -----------------------------------------------------------------------

	function toggleShortlist(name: NameSuggestion): void {
		const isOn = shortlistSet.has(name.name);
		shortlist  = isOn
			? shortlist.filter((n) => n.name !== name.name)
			: [...shortlist, name];
		persist();
	}

	/**
	 * Keep the shortlist, add unselected names to rejections, and regenerate
	 * the non-shortlisted slots.
	 */
	async function regenerate(): Promise<void> {
		// Everything not shortlisted goes into rejected.
		const newRejected = new Set(rejected);
		for (const n of finalNames) {
			if (!shortlistSet.has(n.name)) newRejected.add(n.name);
		}
		rejected = newRejected;

		const countNeeded = TARGET_FINAL_NAMES - shortlist.length;
		if (countNeeded <= 0) return;

		if (!combined) return;

		const tasteA: TasteProfile = buildTasteProfile({
			person:      profileA.person || 'Person A',
			preferences: profileA.preferences,
			ratings:     profileA.ratings
		});
		const tasteB: TasteProfile = buildTasteProfile({
			person:      profileB.person || 'Person B',
			preferences: profileB.preferences,
			ratings:     profileB.ratings
		});

		error   = null;
		loading = true;
		step    = 'final:loading';
		persist();

		try {
			const allExclusions = [...combined.exclusions, ...[...newRejected]];
			const newNames = await requestFinalNames({
				keptNames:   shortlist,
				countNeeded,
				profileA:    tasteA,
				profileB:    tasteB,
				combined,
				exclusions:  allExclusions
			});
			finalNames = [...shortlist, ...newNames];
			step       = 'final:names';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to regenerate. Please try again.';
			step  = 'final:names';
		} finally {
			loading = false;
		}

		persist();
	}

	// -----------------------------------------------------------------------
	// Reset
	// -----------------------------------------------------------------------

	function startOver(): void {
		step       = INITIAL.step;
		profileA   = { ...INITIAL.profileA, preferences: { ...PREFERENCE_DEFAULTS } };
		profileB   = { ...INITIAL.profileB, preferences: { ...PREFERENCE_DEFAULTS } };
		combined   = null;
		shortlist  = [];
		finalNames = [];
		rejected   = new Set();
		error      = null;
		loading    = false;
		persist();
	}

	function dismissError(): void {
		error = null;
		persist();
	}

	/** Advance from the intro screen to Person A's preferences. */
	function start(): void {
		step = 'personA:prefs';
		persist();
	}

	// -----------------------------------------------------------------------
	// Public interface
	// -----------------------------------------------------------------------

	return {
		// state reads
		get step()       { return step; },
		get profileA()   { return profileA; },
		get profileB()   { return profileB; },
		get combined()   { return combined; },
		get shortlist()  { return shortlist; },
		get finalNames() { return finalNames; },
		get error()      { return error; },
		get loading()    { return loading; },

		// derived
		get currentPersonLabel() { return currentPersonLabel; },
		get activeProfile()      { return activeProfile; },
		get currentExample()     { return currentExample; },
		get totalExamples()      { return totalExamples; },
		get shortlistSet()       { return shortlistSet; },

		// mutations
		setPersonName,
		updatePreferences,
		togglePreference,
		submitPreferences,
		rateExample,
		buildAndGenerateFinal,
		toggleShortlist,
		regenerate,
		startOver,
		dismissError,
		start
	};
}

export const babyName = createBabyName();
export type BabyName = ReturnType<typeof createBabyName>;

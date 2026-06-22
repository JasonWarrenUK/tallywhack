/**
 * Domain types for the Baby Name Chooser tool.
 *
 * Designed for a two-person, async model:
 *   - Each person (A and B) captures their own Preferences and TasteProfile
 *     independently. One person can complete their part in one sitting; the
 *     other can come back later — state is persisted across sessions.
 *   - A CombinedProfile is derived from both TasteProfiles and used to drive
 *     the final Claude call.
 *   - A reserved `seedProfile` slot allows a future update to start a session
 *     seeded from a previously stored solo or combined profile (out of scope
 *     now, but the types must not preclude it).
 */

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

/**
 * One person's raw name-search preferences, as entered on the Preferences
 * screen. Each person fills this in independently.
 */
export interface Preferences {
	/** Selected gender filters; empty means "any". */
	genders: string[];
	/** Selected theme filters; empty means "any". */
	themes: string[];
	/** Selected culture/origin filters; empty means "any". */
	cultures: string[];
	/**
	 * Uniqueness slider (0–100).
	 *   < 35 → prefer common/traditional
	 *   > 65 → prefer unique/unusual
	 *   middle → balanced mix
	 */
	uniqueness: number;
}

export const PREFERENCE_DEFAULTS: Preferences = {
	genders: [],
	themes: [],
	cultures: [],
	uniqueness: 50
};

// ---------------------------------------------------------------------------
// Taste data
// ---------------------------------------------------------------------------

/** Swipe rating for a taste-refinement example name. */
export type Rating = 'like' | 'neutral' | 'dislike';

/**
 * One person's complete taste profile: their preferences, plus the ratings
 * they assigned to the 20 example names during the taste-refinement phase.
 */
export interface TasteProfile {
	/** Display label for the person (e.g. "Jason" / "Harriet"). */
	person: string;
	preferences: Preferences;
	/** Maps example name string → rating assigned. */
	ratings: Record<string, Rating>;
	/** Names the person explicitly liked (rating === 'like'). Derived, cached. */
	liked: string[];
	/** Names the person explicitly disliked (rating === 'dislike'). Derived, cached. */
	disliked: string[];
}

// ---------------------------------------------------------------------------
// Combined profile (Reckoner-style consensus aggregation)
// ---------------------------------------------------------------------------

/**
 * Merged preferences and taste signals from both people's TasteProfiles.
 *
 * Aggregation rules (see combine.ts for implementation):
 *   - Preferences: union of each person's selections. Where they conflict
 *     (e.g. one wants unique, one wants traditional), the combined value is
 *     the average of the two uniqueness scores.
 *   - Liked: names liked by BOTH are "strong likes"; liked by one are "soft likes".
 *   - Disliked: names disliked by EITHER are "soft dislikes"; by BOTH are "strong dislikes".
 *   - Neutral: treated as neither liked nor disliked.
 */
export interface CombinedProfile {
	/** Union of both people's preference selections. */
	preferences: Preferences;
	/** Names liked by both people — boost these in the final Claude call. */
	strongLikes: string[];
	/** Names liked by exactly one person — soft signal. */
	softLikes: string[];
	/** Names disliked by both people — exclude from the final call. */
	strongDislikes: string[];
	/** Names disliked by exactly one person — down-weight. */
	softDislikes: string[];
	/** All names that should be excluded from future generation (disliked by either). */
	exclusions: string[];
	/**
	 * True when both people selected themes, but with no overlap.
	 * Used by the API prompt to switch to a "blend both styles" instruction
	 * rather than the default "MUST be X OR Y" wording.
	 */
	themesDisjoint?: boolean;
	/**
	 * True when both people selected cultures/origins, but with no overlap.
	 * Same prompt-switch trigger as themesDisjoint.
	 */
	culturesDisjoint?: boolean;
}

// ---------------------------------------------------------------------------
// Name suggestions
// ---------------------------------------------------------------------------

/** A single name suggestion returned by the Claude API. */
export interface NameSuggestion {
	name: string;
	gender: string;
	origin: string;
	/** Only present in the final-names call, not the taste-refinement examples. */
	meaning?: string;
}

// ---------------------------------------------------------------------------
// Flow state
// ---------------------------------------------------------------------------

/**
 * Workflow steps for the Baby Name Chooser.
 *
 * Flow:
 *   intro → personA:prefs → personA:swipes → personB:prefs → personB:swipes
 *        → combined → final:loading → final:names → done
 */
export type BabyNameStep =
	| 'intro'
	| 'personA:prefs'
	| 'personA:swipes'
	| 'personB:prefs'
	| 'personB:swipes'
	| 'combined'
	| 'final:loading'
	| 'final:names'
	| 'done';

/** Partial profile being built while a person is still swiping examples. */
export interface InProgressProfile {
	person: string;
	preferences: Preferences;
	/** Example names fetched for this person's taste refinement. */
	exampleNames: NameSuggestion[];
	/** Ratings collected so far (may be incomplete). */
	ratings: Record<string, Rating>;
	/** Which example the person is currently looking at (0-based index). */
	currentIndex: number;
}

/**
 * Full Baby Name session state.
 *
 * The `step` field is the discriminator for the current workflow position.
 * Both persons' data is always present (possibly partially filled) so that
 * async hand-off between sessions works: person A can finish, persist, and
 * person B picks up later.
 *
 * `seedProfile` is reserved for the future "solo session seeded from a prior
 * profile" feature — it is declared here so the type is forward-compatible,
 * but is never written by the current implementation.
 */
export interface BabyNameState {
	step: BabyNameStep;

	profileA: InProgressProfile;
	profileB: InProgressProfile;

	/** Derived once both profiles are complete. */
	combined: CombinedProfile | null;

	/** Names on the shared shortlist (selected by either person). */
	shortlist: NameSuggestion[];

	/** Full list from the last final-names generation. */
	finalNames: NameSuggestion[];

	/** Names explicitly rejected (removed from shortlist / Regenerate'd away). */
	rejectedNames: Set<string>;

	/** Any API error message to surface to the user. */
	error: string | null;

	/**
	 * Reserved for a future update: seeding a new session from a prior
	 * solo or combined profile. Not written by the current implementation.
	 */
	seedProfile?: CombinedProfile | TasteProfile;
}

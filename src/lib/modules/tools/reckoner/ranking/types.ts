/**
 * Core domain types for the Reckoner group-ranking tool.
 *
 * Reckoner lets N participants (2-8) rate a shared list of entries across
 * five preference tiers. The output is a consensus group ranking using a
 * "consensus floor" algorithm: an entry's rank is driven first by the worst
 * single rating it received (implicit veto), then by the sum of all ratings.
 *
 * Tier values are ordinal, lower = better:
 *   0 "Love it" / 1 "Strong yes" / 2 "It's nice" / 3 "Lukewarm" / 4 "Not this one"
 */

// ---------------------------------------------------------------------------
// Enumeration types
// ---------------------------------------------------------------------------

/** Tier index — lower is a stronger endorsement. */
export type Tier = 0 | 1 | 2 | 3 | 4;

/** Workflow phase. */
export type Phase = 'setup' | 'rating' | 'handover' | 'results';

// ---------------------------------------------------------------------------
// Domain entities
// ---------------------------------------------------------------------------

export interface Participant {
	id: string;
	name: string;
}

/**
 * A grouping category for entries.
 *
 * The `id` is a stable, opaque identifier (generated at creation time) so
 * that results can be grouped by category id rather than by label string or
 * array index. This prevents the source app's latent bug where entries were
 * silently misfiled when an earlier category had a blank name (causing
 * `activeCats` indices to drift from `categories` indices).
 */
export interface Category {
	/** Stable opaque id — generated once, never changes. */
	id: string;
	/** User-visible label — may be blank. */
	label: string;
}

export interface Entry {
	id: string;
	text: string;
	/** Stable category id — matches `Category.id`, or null if uncategorised. */
	categoryId: string | null;
	/** Name of the participant who suggested this entry (display only). */
	suggestedBy?: string;
}

/**
 * One participant's ratings for all entries they have seen so far.
 *
 * Keyed by `Entry.id`, value is the `Tier` the participant assigned.
 * An absent key means the entry has not yet been rated by that participant.
 */
export type ParticipantRatings = Record<string, Tier>;

/** Full ratings matrix — keyed by `Participant.id`. */
export type Ratings = Record<string, ParticipantRatings>;

// ---------------------------------------------------------------------------
// Derived / output types
// ---------------------------------------------------------------------------

/**
 * A single entry in the final ranked list, enriched with computed ranking data.
 */
export interface RankedEntry extends Entry {
	/** Worst (highest numerically) tier assigned by any participant. Drives primary sort. */
	worst: Tier;
	/** Sum of all tier scores. Used as tie-break when `worst` is equal. */
	sum: number;
	/** True when `worst <= 1` — at least one of the top two tiers from all raters. */
	isTop: boolean;
	/** True when max score minus min score >= 3 — significant disagreement. */
	disagreement: boolean;
	/** All raw scores per participant id, for display. */
	scores: Record<string, Tier>;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface ReckonerState {
	phase: Phase;
	activityName: string;
	participants: Participant[];
	categories: Category[];
	entries: Entry[];
	/** Full ratings matrix (participantId → entryId → tier). */
	ratings: Ratings;
	/** Index into `participants` for the current rater. */
	currentRaterIndex: number;
	/** Shuffled entry id order for the current rater's card stack. */
	cardOrder: string[];
	/** Position in `cardOrder` the current rater is at. */
	cardIndex: number;
}

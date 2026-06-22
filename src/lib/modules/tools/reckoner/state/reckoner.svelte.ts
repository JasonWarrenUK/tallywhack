/**
 * Single source of truth for a Reckoner session.
 *
 * Runes singleton — lives in a .svelte.ts module so Svelte 5 runes work
 * outside a component. Import `reckoner` anywhere and read its getters.
 *
 * State is persisted to localStorage after every mutation so that a
 * mid-rating session survives a page reload.
 */

import {
	tierCap,
	tierCountsForCat,
	computeRanking,
	groupRanking,
	shuffle,
	generateId
} from '../ranking/reckon.js';
import type {

	Entry,
	Phase,
	Ratings,

	Tier
} from '../ranking/types.js';
import { loadSession, saveSession, INITIAL } from './persistence.js';

const MAX_PARTICIPANTS = 8;
const MIN_PARTICIPANTS = 2;
const MAX_CATEGORIES   = 3;
const MIN_CATEGORIES   = 1;

function createReckoner() {
	// -----------------------------------------------------------------------
	// State
	// -----------------------------------------------------------------------

	let phase          = $state<Phase>(INITIAL.phase);
	let activityName   = $state(INITIAL.activityName);
	let participants   = $state([...INITIAL.participants.map((p) => ({ ...p }))]);
	let categories     = $state([...INITIAL.categories.map((c) => ({ ...c }))]);
	let entries        = $state<Entry[]>([]);
	let ratings        = $state<Ratings>({});
	let currentRaterIndex = $state(INITIAL.currentRaterIndex);
	let cardOrder      = $state<string[]>([]);
	let cardIndex      = $state(INITIAL.cardIndex);

	// Rehydrate from localStorage on init (no-op on SSR).
	const saved = loadSession();
	if (saved) {
		phase             = saved.phase;
		activityName      = saved.activityName;
		participants      = saved.participants.map((p) => ({ ...p }));
		categories        = saved.categories.map((c) => ({ ...c }));
		entries           = saved.entries.map((e) => ({ ...e }));
		ratings           = structuredClone(saved.ratings);
		currentRaterIndex = saved.currentRaterIndex;
		cardOrder         = [...saved.cardOrder];
		cardIndex         = saved.cardIndex;
	}

	// -----------------------------------------------------------------------
	// Derived
	// -----------------------------------------------------------------------

	const activeCats = $derived(
		categories.filter((c) => c.label.trim() !== '')
	);

	const hasCats = $derived(activeCats.length > 1);

	/** Category size map — keyed by category id. */
	const catSizes = $derived.by(() => {
		const map: Record<string, number> = {};
		for (const e of entries) {
			if (e.categoryId !== null) {
				map[e.categoryId] = (map[e.categoryId] ?? 0) + 1;
			}
		}
		return map;
	});

	/** The entry id the current rater is looking at right now. */
	const currentEntryId = $derived(cardOrder[cardIndex] ?? null);

	/** The full Entry object for the current card. */
	const currentEntry = $derived(
		currentEntryId !== null
			? (entries.find((e) => e.id === currentEntryId) ?? null)
			: null
	);

	/** Current rater's ratings for same-category entries (for cap checking). */
	const currentRaterRatings = $derived<Record<string, Tier>>(
		(ratings[participants[currentRaterIndex]?.id ?? ''] ?? {}) as Record<string, Tier>
	);

	/**
	 * Per-tier counts for the current entry's category, from the current rater's
	 * perspective. Used to enforce tier caps in the UI.
	 */
	const currentCatTierCounts = $derived.by(() => {
		const entry = currentEntry;
		if (!entry) return { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 } as Record<Tier, number>;
		return tierCountsForCat(currentRaterRatings, entries, entry.categoryId);
	});

	/** Category size for the current entry's category — for cap computation. */
	const currentCatSize = $derived.by(() => {
		const entry = currentEntry;
		if (!entry || entry.categoryId === null) return entries.length;
		return catSizes[entry.categoryId] ?? 0;
	});

	/** The full ranked list (consensus floor). Recalculated reactively. */
	const ranking = $derived(computeRanking(participants, entries, ratings));

	/** Ranked entries grouped by category id (bug-fix: uses stable id, not index). */
	const rankedGroups = $derived(groupRanking(ranking, categories));

	// -----------------------------------------------------------------------
	// Persistence
	// -----------------------------------------------------------------------

	function persist(): void {
		saveSession({
			phase,
			activityName,
			participants,
			categories,
			entries,
			ratings,
			currentRaterIndex,
			cardOrder,
			cardIndex
		});
	}

	// -----------------------------------------------------------------------
	// Setup mutations
	// -----------------------------------------------------------------------

	function setActivityName(value: string): void {
		activityName = value;
		persist();
	}

	function setParticipantName(index: number, name: string): void {
		participants = participants.map((p, i) => (i === index ? { ...p, name } : p));
		persist();
	}

	function addParticipant(): void {
		if (participants.length >= MAX_PARTICIPANTS) return;
		participants = [...participants, { id: generateId(), name: '' }];
		persist();
	}

	function removeParticipant(index: number): void {
		if (participants.length <= MIN_PARTICIPANTS) return;
		participants = participants.filter((_, i) => i !== index);
		persist();
	}

	function setCategoryLabel(index: number, label: string): void {
		categories = categories.map((c, i) => (i === index ? { ...c, label } : c));
		persist();
	}

	function addCategory(): void {
		if (categories.length >= MAX_CATEGORIES) return;
		categories = [...categories, { id: generateId(), label: '' }];
		persist();
	}

	function removeCategory(index: number): void {
		if (categories.length <= MIN_CATEGORIES) return;
		const removed = categories[index];
		categories = categories.filter((_, i) => i !== index);
		// Orphan entries that belonged to the removed category.
		if (removed) {
			entries = entries.map((e) =>
				e.categoryId === removed.id ? { ...e, categoryId: null } : e
			);
		}
		persist();
	}

	function addEntry(text: string, categoryId: string | null, suggestedBy?: string): void {
		if (!text.trim()) return;
		const entry: Entry = {
			id: generateId(),
			text: text.trim(),
			categoryId,
			suggestedBy
		};
		entries = [...entries, entry];
		persist();
	}

	function removeEntry(id: string): void {
		entries = entries.filter((e) => e.id !== id);
		// Remove any ratings for this entry.
		ratings = Object.fromEntries(
			Object.entries(ratings).map(([pid, pRatings]) => [
				pid,
				Object.fromEntries(Object.entries(pRatings).filter(([eid]) => eid !== id))
			])
		);
		persist();
	}

	// -----------------------------------------------------------------------
	// Rating phase mutations
	// -----------------------------------------------------------------------

	/**
	 * Begin the rating phase for a given rater (by participants index).
	 * Shuffles the entry order fresh for each rater.
	 */
	function startRating(raterIndex: number): void {
		currentRaterIndex = raterIndex;
		cardOrder = shuffle(entries.map((e) => e.id));
		cardIndex = 0;
		phase = 'rating';
		persist();
	}

	/**
	 * Assign a tier to the current card and advance.
	 *
	 * If a cap has been reached for this tier in this category, the assignment
	 * is silently rejected (caller should have disabled the button; this is a
	 * safety guard).
	 *
	 * After the last card:
	 *   - If more raters remain → advance to 'handover'.
	 *   - Otherwise → 'results'.
	 */
	function assignTier(tier: Tier): void {
		const entry = currentEntry;
		if (!entry) return;

		const rater = participants[currentRaterIndex];
		if (!rater) return;

		// Cap guard.
		const catSize = currentCatSize;
		const cap = tierCap(catSize, tier);
		if (currentCatTierCounts[tier] >= cap) return;

		// Record the rating.
		const existing = ratings[rater.id] ?? {};
		ratings = {
			...ratings,
			[rater.id]: { ...existing, [entry.id]: tier }
		};

		// Advance card.
		const nextIndex = cardIndex + 1;
		if (nextIndex >= cardOrder.length) {
			// This rater is done.
			const nextRaterIndex = currentRaterIndex + 1;
			if (nextRaterIndex < participants.length) {
				phase = 'handover';
				// Store the next rater index so the handover screen can reference it.
				currentRaterIndex = nextRaterIndex;
			} else {
				phase = 'results';
			}
		} else {
			cardIndex = nextIndex;
		}

		persist();
	}

	/**
	 * Go back to the previous card for the current rater.
	 *
	 * Removes the rating for the card we're backing out of (the card that was
	 * at `cardIndex - 1` before the decrement, i.e. the card we will now show).
	 * Cannot cross a handover boundary.
	 */
	function goBack(): void {
		if (cardIndex <= 0) return;

		const prevIndex = cardIndex - 1;
		const prevEntryId = cardOrder[prevIndex];
		const rater = participants[currentRaterIndex];
		if (!prevEntryId || !rater) return;

		// Remove the rating for the card we are revisiting.
		const existing = { ...(ratings[rater.id] ?? {}) };
		delete existing[prevEntryId];
		ratings = { ...ratings, [rater.id]: existing };

		cardIndex = prevIndex;
		persist();
	}

	/**
	 * Confirm the handover and start rating for the next rater.
	 * `currentRaterIndex` was already advanced in `assignTier`.
	 */
	function confirmHandover(): void {
		startRating(currentRaterIndex);
	}

	// -----------------------------------------------------------------------
	// Results phase
	// -----------------------------------------------------------------------

	function reRank(): void {
		ratings = {};
		startRating(0);
	}

	function startOver(): void {
		phase             = INITIAL.phase;
		activityName      = INITIAL.activityName;
		participants      = INITIAL.participants.map((p) => ({ ...p }));
		categories        = INITIAL.categories.map((c) => ({ ...c }));
		entries           = [];
		ratings           = {};
		currentRaterIndex = 0;
		cardOrder         = [];
		cardIndex         = 0;
		persist();
	}

	// -----------------------------------------------------------------------
	// Public interface
	// -----------------------------------------------------------------------

	return {
		// reads
		get phase()             { return phase; },
		get activityName()      { return activityName; },
		get participants()      { return participants; },
		get categories()        { return categories; },
		get entries()           { return entries; },
		get ratings()           { return ratings; },
		get currentRaterIndex() { return currentRaterIndex; },
		get cardOrder()         { return cardOrder; },
		get cardIndex()         { return cardIndex; },

		// derived
		get activeCats()           { return activeCats; },
		get hasCats()              { return hasCats; },
		get catSizes()             { return catSizes; },
		get currentEntry()         { return currentEntry; },
		get currentCatTierCounts() { return currentCatTierCounts; },
		get currentCatSize()       { return currentCatSize; },
		get ranking()              { return ranking; },
		get rankedGroups()         { return rankedGroups; },

		// convenience derived
		get canStart() { return entries.length >= 2; },
		get currentRater() { return participants[currentRaterIndex] ?? null; },
		get nextRater()    {
			const idx = currentRaterIndex;
			return participants[idx] ?? null;
		},
		get totalCards() { return cardOrder.length; },

		// setup mutations
		setActivityName,
		setParticipantName,
		addParticipant,
		removeParticipant,
		setCategoryLabel,
		addCategory,
		removeCategory,
		addEntry,
		removeEntry,

		// rating mutations
		startRating,
		assignTier,
		goBack,
		confirmHandover,

		// results mutations
		reRank,
		startOver,

		// helpers (exposed for cap checks in UI)
		tierCap
	};
}

export const reckoner = createReckoner();
export type Reckoner = ReturnType<typeof createReckoner>;

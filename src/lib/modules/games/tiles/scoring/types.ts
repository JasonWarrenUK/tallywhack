import type { PlayerId } from '$lib/modules/types.js';

export type Square = 'plain' | 'DL' | 'TL' | 'DW' | 'TW';

export interface Tile {
	letter: string;
	square: Square;
	isBlank: boolean;
}

export type Mode = 'tiles' | 'quick';
export type Phase = 'play' | 'endgame' | 'finished';

export interface Player {
	name: string;
	score: number;
}

/** A word-turn entry or a simple move entry (pass / swap). */
export type HistoryEntry =
	| {
			type: 'word';
			player: PlayerId;
			points: number;
			bingo: boolean;
			/** Snapshot of the tiles played; empty for quick-mode entries. */
			words: Tile[][];
	  }
	| {
			type: 'pass' | 'swap';
			player: PlayerId;
			points: 0;
			label: string;
	  }
	| {
			type: 'endgame';
			/** Per-player score delta (negative for leftover racks, positive if the player went out). */
			deltas: [number, number];
			/** The current player at the time the endgame was applied (for undo). */
			prevCurrent: PlayerId;
	  };

export interface TilesState {
	players: [Player, Player];
	current: PlayerId;
	mode: Mode;
	phase: Phase;
	/** The word currently being built in the tile editor. */
	tiles: Tile[];
	/** Words already banked in the current turn (for multi-word plays). */
	banked: Tile[][];
	bingo: boolean;
	/** Index of the selected tile in the editor, or null. */
	selected: number | null;
	history: HistoryEntry[];
}

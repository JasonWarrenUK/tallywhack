/**
 * Shared localStorage persistence helper (1FN.4).
 *
 * Provides a thin, type-safe wrapper around localStorage that handles the
 * SSR guard, JSON parse errors, schema-version mismatches, and write failures
 * in one place. Every game module wraps `createLocalStore` in its own
 * `state/persistence.ts`; 3BE.6 will swap the implementation to Supabase
 * without touching any module's state or UI code.
 *
 * Key convention: `'<moduleId>:<slot>'` (e.g. `'grumble:match'`, `'tiles:game'`).
 */

import { browser } from '$app/environment';

/** The versioned envelope stored in localStorage. */
interface Envelope {
	version: number;
	data: unknown;
}

/** The public interface returned by createLocalStore. */
export interface LocalStore<T> {
	/**
	 * Load the persisted value, or `null` on SSR / missing key / parse
	 * failure / version mismatch. On version mismatch, the stale entry is
	 * removed so the caller starts fresh.
	 */
	load(): T | null;
	/**
	 * Persist a value. No-op on SSR. Swallows quota and permission errors
	 * rather than crashing a scoring session.
	 */
	save(value: T): void;
	/** Remove the entry from localStorage. No-op on SSR. */
	clear(): void;
}

export interface LocalStoreOptions<T> {
	/** localStorage key — use `'<moduleId>:<slot>'` convention. */
	key: string;
	/** Schema version. A persisted entry with a different version is discarded. */
	version: number;
	/**
	 * Optional migration / validation of the raw parsed data before it is
	 * returned. Return `null` to discard and start fresh. If omitted, the
	 * parsed data is cast directly to `T` (caller's responsibility).
	 */
	migrate?: (raw: unknown) => T | null;
}

/**
 * Create a typed localStorage store with version gating and SSR safety.
 *
 * @example
 * // state/persistence.ts
 * const store = createLocalStore<PersistedMatch>({
 *   key: 'grumble:match',
 *   version: 1,
 *   migrate: (raw) => {
 *     const r = raw as Partial<PersistedMatch>;
 *     if (!r.names) return null;
 *     return { ...r, rules: { ...DEFAULT_RULES, ...r.rules } } as PersistedMatch;
 *   }
 * });
 * export const loadMatch = () => store.load();
 * export const saveMatch = (m: PersistedMatch) => store.save(m);
 */
export function createLocalStore<T>(opts: LocalStoreOptions<T>): LocalStore<T> {
	const { key, version, migrate } = opts;

	return {
		load(): T | null {
			if (!browser) return null;
			try {
				const raw = localStorage.getItem(key);
				if (raw === null) return null;
				const envelope = JSON.parse(raw) as Envelope;
				if (envelope.version !== version) {
					localStorage.removeItem(key);
					return null;
				}
				if (migrate) {
					return migrate(envelope.data);
				}
				return envelope.data as T;
			} catch {
				return null;
			}
		},

		save(value: T): void {
			if (!browser) return;
			try {
				const envelope: Envelope = { version, data: value };
				localStorage.setItem(key, JSON.stringify(envelope));
			} catch {
				// Swallow quota / private-browsing write errors — a failed
				// persist is annoying but must not crash an in-progress game.
			}
		},

		clear(): void {
			if (!browser) return;
			try {
				localStorage.removeItem(key);
			} catch {
				// Ignore
			}
		}
	};
}

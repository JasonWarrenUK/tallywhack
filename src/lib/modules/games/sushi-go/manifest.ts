/**
 * Sushi Go! scorer module manifest.
 *
 * Greenfield implementation (2MOD.3). Theme: raspberry.
 */
import { defineManifest } from '$lib/modules';
import type { SushiGoResult } from './scoring/types.js';

export type { SushiGoResult };

export default defineManifest<SushiGoResult>({
	id: 'sushi-go',
	name: 'Sushi Go!',
	category: 'games',
	icon: '🍣',
	routes: ['/games/sushi-go'],
	theme: 'raspberry',
	resultsKind: 'game:sushi-go'
});

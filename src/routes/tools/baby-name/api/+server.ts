/**
 * Baby Name Chooser — server-side Claude API proxy (2MOD.5).
 *
 * This is the ONLY place the Anthropic key is used. It is read via
 * $env/static/private and never sent to the browser. The client calls
 * POST /tools/baby-name/api with a JSON body; this handler builds the
 * Claude prompt, calls the API, and returns { names: NameSuggestion[] }.
 *
 * Two intents are supported:
 *   - 'examples': 20 diverse taste-refinement examples (no `meaning` field)
 *   - 'final':    N personalised final names (includes `meaning` field)
 *
 * Body validation uses Zod at the boundary (§9 of CLAUDE.md).
 * Errors return JSON { error: string } with the appropriate HTTP status.
 * The key is never included in any error response.
 *
 * 3BE.4 will harden this further (auth, rate-limiting, household scoping).
 */

import { json, error } from '@sveltejs/kit';
import { ANTHROPIC_API_KEY } from '$env/static/private';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import type { RequestHandler } from './$types';

// ---------------------------------------------------------------------------
// Zod schemas — validate the request body at the boundary
// ---------------------------------------------------------------------------

const PreferencesSchema = z.object({
	genders:    z.array(z.string()),
	themes:     z.array(z.string()),
	cultures:   z.array(z.string()),
	uniqueness: z.number().min(0).max(100)
});

const TasteProfileSchema = z.object({
	person:      z.string(),
	preferences: PreferencesSchema,
	ratings:     z.record(z.string(), z.enum(['like', 'neutral', 'dislike'])),
	liked:       z.array(z.string()),
	disliked:    z.array(z.string())
});

const CombinedProfileSchema = z.object({
	preferences:     PreferencesSchema,
	strongLikes:     z.array(z.string()),
	softLikes:       z.array(z.string()),
	strongDislikes:  z.array(z.string()),
	softDislikes:    z.array(z.string()),
	exclusions:      z.array(z.string()),
	themesDisjoint:   z.boolean().optional(),
	culturesDisjoint: z.boolean().optional()
});

const NameSuggestionSchema = z.object({
	name:    z.string(),
	gender:  z.string(),
	origin:  z.string(),
	meaning: z.string().optional()
});

const ExamplesRequestSchema = z.object({
	intent:      z.literal('examples'),
	preferences: PreferencesSchema
});

const FinalNamesRequestSchema = z.object({
	intent:      z.literal('final'),
	profileA:    TasteProfileSchema,
	profileB:    TasteProfileSchema,
	combined:    CombinedProfileSchema,
	countNeeded: z.number().int().min(1).max(20),
	exclusions:  z.array(z.string()),
	keptNames:   z.array(NameSuggestionSchema)
});

const RequestBodySchema = z.discriminatedUnion('intent', [
	ExamplesRequestSchema,
	FinalNamesRequestSchema
]);

// ---------------------------------------------------------------------------
// Response schema (structured output from Claude)
// ---------------------------------------------------------------------------

const NameArraySchema = z.object({
	names: z.array(NameSuggestionSchema)
});

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

function buildExamplesPrompt(
	genders:    string[],
	themes:     string[],
	cultures:   string[],
	uniqueness: number
): string {
	const uniquenessNote =
		uniqueness < 35
			? '(prefer common/traditional names)'
			: uniqueness > 65
				? '(prefer unique/unusual names)'
				: '(balanced mix of common and unique)';

	return `Generate 20 diverse baby names for taste refinement based on these preferences:

FILTERS (all filters must apply to each name):
- Genders: ${genders.length ? genders.join(' OR ') : 'any gender'}
- Themes: ${themes.length ? `MUST be ${themes.join(' OR ')} themed` : 'any theme'}
- Cultures: ${cultures.length ? `MUST be from ${cultures.join(' OR ')} origin` : 'any culture'}
- Uniqueness (0–100): ${uniqueness} ${uniquenessNote}

Ensure names span the full range of the preferences to test taste. Every name must satisfy ALL the filters above.

Return a JSON object with a "names" array of 20 objects, each with fields: name (string), gender (male/female/neutral), origin (culture string). No meaning field needed.`;
}

function buildFinalNamesPrompt(body: z.infer<typeof FinalNamesRequestSchema>): string {
	const { profileA, profileB, combined, countNeeded, exclusions } = body;

	const prefs = combined.preferences;
	const uniquenessNote =
		prefs.uniqueness < 35
			? '(prefer common/traditional names)'
			: prefs.uniqueness > 65
				? '(prefer unique/unusual names)'
				: '(balanced mix)';

	const exclusionLine = exclusions.length
		? `- DO NOT suggest any of these names: ${exclusions.join(', ')}`
		: '';

	// When both people chose themes or cultures that don't overlap at all,
	// switch from "MUST be X OR Y" to a blend instruction that asks Claude to
	// bridge the two different tastes rather than merely listing everything.
	const themesLine = (() => {
		if (!prefs.themes.length) return '- Themes: any theme';
		if (combined.themesDisjoint) {
			const aThemes = profileA.preferences.themes.join(', ') || 'any';
			const bThemes = profileB.preferences.themes.join(', ') || 'any';
			return `- Themes: blend these differing tastes — suggest names that bridge or draw from either ${profileA.person}'s (${aThemes}) and ${profileB.person}'s (${bThemes}) preferences`;
		}
		return `- Themes: MUST be ${prefs.themes.join(' OR ')} themed`;
	})();

	const culturesLine = (() => {
		if (!prefs.cultures.length) return '- Cultures: any culture';
		if (combined.culturesDisjoint) {
			const aCultures = profileA.preferences.cultures.join(', ') || 'any';
			const bCultures = profileB.preferences.cultures.join(', ') || 'any';
			return `- Cultures: blend these differing tastes — suggest names that bridge or draw from either ${profileA.person}'s (${aCultures}) and ${profileB.person}'s (${bCultures}) origins`;
		}
		return `- Cultures: MUST be from ${prefs.cultures.join(' OR ')} origin`;
	})();

	return `Generate ${countNeeded} baby names for a couple based on their combined taste profile.

COMBINED PREFERENCES (union of both people's choices):
- Genders: ${prefs.genders.length ? prefs.genders.join(' OR ') : 'any gender'}
${themesLine}
${culturesLine}
- Uniqueness (0–100): ${prefs.uniqueness} ${uniquenessNote}

${profileA.person}'s TASTE:
- Liked: ${profileA.liked.join(', ') || '(none)'}
- Disliked: ${profileA.disliked.join(', ') || '(none)'}

${profileB.person}'s TASTE:
- Liked: ${profileB.liked.join(', ') || '(none)'}
- Disliked: ${profileB.disliked.join(', ') || '(none)'}

CONSENSUS SIGNALS:
- Both loved: ${combined.strongLikes.join(', ') || '(none)'}
- One liked: ${combined.softLikes.join(', ') || '(none)'}
- Both disliked: ${combined.strongDislikes.join(', ') || '(none)'}
- One disliked (veto): ${combined.softDislikes.join(', ') || '(none)'}
${exclusionLine}

Analyse the pattern of names they both liked vs disliked to understand their shared taste. Prioritise names that match the "both loved" signal. Every name must satisfy ALL the combined filters above. Do not suggest any excluded or vetoed names.

Return a JSON object with a "names" array of ${countNeeded} objects, each with: name (string), gender (male/female/neutral), origin (culture string), meaning (brief 1-sentence meaning/origin note).`;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const POST: RequestHandler = async ({ request }) => {
	// Guard: fail fast if key is missing rather than leaking a confusing error.
	if (!ANTHROPIC_API_KEY) {
		console.error('[baby-name/api] ANTHROPIC_API_KEY is not set');
		throw error(500, 'Server configuration error');
	}

	// Parse and validate the request body.
	let rawBody: unknown;
	try {
		rawBody = await request.json();
	} catch {
		throw error(400, 'Invalid JSON body');
	}

	const parsed = RequestBodySchema.safeParse(rawBody);
	if (!parsed.success) {
		throw error(400, 'Invalid request: ' + parsed.error.message);
	}

	const body = parsed.data;

	// Build the prompt.
	let prompt: string;
	let maxTokens: number;

	if (body.intent === 'examples') {
		const p = body.preferences;
		prompt    = buildExamplesPrompt(p.genders, p.themes, p.cultures, p.uniqueness);
		maxTokens = 1500;
	} else {
		prompt    = buildFinalNamesPrompt(body);
		maxTokens = 2000;
	}

	// Call Claude via the SDK with structured output.
	// Adaptive thinking is only enabled for the final call — it adds latency
	// and is unnecessary for the 20-example taste-refinement pass.
	const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

	let message: Awaited<ReturnType<typeof client.messages.parse>>;
	try {
		message = await client.messages.parse({
			model:      'claude-opus-4-8',
			max_tokens: maxTokens,
			...(body.intent === 'final' ? { thinking: { type: 'adaptive' } } : {}),
			messages:   [{ role: 'user', content: prompt }],
			output_config: {
				format: zodOutputFormat(NameArraySchema)
			}
		});
	} catch (e) {
		const err = e instanceof Error ? e.message : 'Unknown error';
		console.error('[baby-name/api] Claude API error:', err);
		throw error(502, 'Name generation failed. Please try again.');
	}

	const result = message.parsed_output;
	if (!result || !Array.isArray(result.names)) {
		console.error('[baby-name/api] Unexpected parsed_output:', result);
		throw error(502, 'Name generation failed. Please try again.');
	}

	return json({ names: result.names });
};

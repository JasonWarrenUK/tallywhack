/**
 * Shared UI component library (1FN.4).
 *
 * All components are theme-driven — they consume only the semantic CSS custom
 * properties defined in src/app.css (`--color-primary`, `--color-surface`, etc.)
 * and never reference raw Reasonable Colors variables directly.
 *
 * Module-specific, domain-decorative components (e.g. DeadwoodCalculator,
 * Tiles' WordEditor, Sushi Go!'s NigiriWasabiInput) live inside their respective
 * module directories and are not exported here.
 */

export { default as Button } from './Button.svelte';
export { default as NumberStepper } from './NumberStepper.svelte';
export { default as Panel } from './Panel.svelte';
export { default as PlayerNameInput } from './PlayerNameInput.svelte';
export { default as ScoreCard } from './ScoreCard.svelte';
export { default as SegmentedControl } from './SegmentedControl.svelte';

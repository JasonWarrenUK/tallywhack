# Tallywhack Roadmap

A two-person shared app (Jason + Harriet) for game scoring and shared tools. Supabase-backed with real auth + RLS. SvelteKit/Svelte 5/Bun on Vercel. Mobile-first, single-device hot-seat play.

---

## Progress Map

<a name="map"></a>

```mermaid
flowchart TD
  classDef open fill:#d4edda,stroke:#28a745,color:#000
  classDef blocked fill:#f8d7da,stroke:#dc3545,color:#000
  classDef mile fill:#fff3cd,stroke:#ffc107,color:#000

  M1(["`**Milestone 1**<br/>Foundation`"]):::mile
  M2(["`**Milestone 2**<br/>Modules`"]):::mile
  M3(["`**Milestone 3**<br/>Backend`"]):::mile
  M4(["`**Milestone 4**<br/>Rivalry`"]):::mile
  M5(["`**Milestone 5**<br/>Polish`"]):::mile

  1FN4["`*1FN.4*<br/>**FN**<br/>Themeable design system`"]
  1FN5["`*1FN.5*<br/>**FN**<br/>PWA + mobile-first baseline`"]:::open

  2MOD1["`*2MOD.1*<br/>**MOD**<br/>Port Grumble`"]
  2MOD2["`*2MOD.2*<br/>**MOD**<br/>Port Tiles`"]
  2MOD3["`*2MOD.3*<br/>**MOD**<br/>Build Sushi Go!`"]
  2MOD4["`*2MOD.4*<br/>**MOD**<br/>Port Reckoner`"]
  2MOD5["`*2MOD.5*<br/>**MOD**<br/>Port Baby Name Chooser`"]

  3BE1["`*3BE.1*<br/>**BE**<br/>Provision Supabase`"]:::open
  3BE2["`*3BE.2*<br/>**BE**<br/>Design schema`"]
  3BE3["`*3BE.3*<br/>**BE**<br/>Auth + profiles + RLS`"]
  3BE4["`*3BE.4*<br/>**BE**<br/>Claude proxy`"]
  3BE5["`*3BE.5*<br/>**BE**<br/>Wire app shell`"]
  3BE6["`*3BE.6*<br/>**BE**<br/>Persist module outputs`"]

  4RIV1["`*4RIV.1*<br/>**RIV**<br/>H2H records + history`"]
  4RIV2["`*4RIV.2*<br/>**RIV**<br/>Cross-game meta-score`"]
  4RIV3["`*4RIV.3*<br/>**RIV**<br/>Achievements engine`"]
  4RIV4["`*4RIV.4*<br/>**RIV**<br/>Narrative + banter`"]

  5PL1["`*5PL.1*<br/>**PL**<br/>Modularity acceptance test`"]
  5PL2["`*5PL.2*<br/>**PL**<br/>PWA hardening`"]
  5PL3["`*5PL.3*<br/>**PL**<br/>Design polish pass`"]

  M1 --> 1FN4
  M1 --> 1FN5
  1FN4 --> 2MOD1
  1FN4 --> 2MOD2
  1FN4 --> 2MOD3
  1FN4 --> 2MOD4
  1FN4 --> 2MOD5
  1FN4 --> 5PL3
  1FN5 --> 5PL2

  M2 --> 2MOD1
  2MOD1 --> 3BE2
  2MOD2 --> 3BE2
  2MOD3 --> 3BE2
  2MOD4 --> 3BE2
  2MOD5 --> 3BE2
  2MOD5 --> 3BE4

  M3 --> 3BE1
  3BE1 --> 3BE2
  3BE1 --> 3BE3
  3BE1 --> 3BE4
  3BE2 --> 3BE3
  3BE2 --> 3BE5
  3BE2 --> 4RIV1
  3BE3 --> 3BE5
  3BE3 --> 3BE6
  3BE5 --> 3BE6
  3BE5 --> 5PL3
  3BE6 --> 4RIV1
  3BE6 --> 5PL2

  M4 --> 4RIV1
  4RIV1 --> 4RIV2
  4RIV1 --> 4RIV3
  4RIV1 --> 5PL1
  4RIV2 --> 4RIV4
  4RIV3 --> 4RIV4

  M5 --> 5PL1
```

---

## Milestone 1 — Foundation

> Skeleton and the module contract. No features yet, but the rules every module obeys.

### To Do

- [ ] 1FN.5. PWA + mobile-first baseline (manifest, installable, responsive shell, big touch targets) — **depends on 1FN.1**

### Completed

- [x] 1FN.4. Establish themeable design system (Reasonable Colors base, swappable tokens, shared components, module-selectable palettes) — contract widened (`winner: PlayerId | null`), shared `createLocalStore`, 6 shared components, `emerald`/`green`/`raspberry` themes shipped
- [x] 1FN.3. Build module auto-discovery + registry (filesystem-derived, category-aware) — **depends on 1FN.2**
- [x] 1FN.2. Define the module contract (manifest: id, name, category, icon, routes, theme, results-shape) — **depends on 1FN.1**
- [x] 1FN.1. Scaffold SvelteKit + Svelte 5 + Bun app (adapter-vercel) — single flat app at repo root, Reasonable Colors base, module directory skeleton

---

## Milestone 2 — Modules

> All five modules ported to the stack and working locally (no DB yet). Each conforms to the module contract.

### Blocked

- [ ] 2MOD.4. Port Reckoner (group ranking/decision tool) into the module system — **depends on 1FN.2, 1FN.3, 1FN.4**
- [ ] 2MOD.5. Port Baby Name Chooser — UI to Svelte, Claude calls moved to SvelteKit server route — **depends on 1FN.2, 1FN.3, 1FN.4**

### Completed

- [x] 2MOD.3. Build Sushi Go! scorer — full auto-scoring engine, maki ties, set bonuses, wasabi/nigiri, pudding carry-over + tiebreaker, draw detection (`winner: null`)
- [x] 2MOD.2. Port Tiles (Scrabble scorer) from single-file HTML to Svelte module — tile/quick mode, caret-preserving input, end-game rack adjustment, draw support
- [x] 2MOD.1. Port Grumble (Gin Rummy scorer) into the module system — full scoring pipeline, persistence, multi-game match tracking

---

## Milestone 3 — Backend

> Supabase schema (derived from built modules), real auth + RLS, app shell wired up, persistence live.

### To Do

- [ ] 3BE.1. Provision Supabase cloud project + local dev workflow + env/secrets wiring — **depends on 1FN.1**

### Blocked

- [ ] 3BE.2. Design schema from modules (profiles, matches, results, tool_outputs, JOIN tables for aggregation) — **depends on 2MOD.1, 2MOD.2, 2MOD.3, 2MOD.4, 2MOD.5, 3BE.1**
- [ ] 3BE.3. Implement Supabase auth (real login) + profiles + RLS policies (household scoping, 2 users) — **depends on 3BE.1, 3BE.2**
- [ ] 3BE.4. Secure Baby Name Claude proxy (server route holds key, env-managed) — **depends on 2MOD.5, 3BE.1**
- [ ] 3BE.5. Wire app shell — module launcher, navigation, category browsing, profile/identity — **depends on 3BE.3** (1FN.3 ✓)
- [ ] 3BE.6. Persist module outputs (game match history + tool outputs) to Supabase with hot-seat 2-player capture — **depends on 3BE.3, 3BE.5**

---

## Milestone 4 — Rivalry

> The emotional payoff. Cross-game meta-score, achievements, and narrative/banter.

### Blocked

- [ ] 4RIV.1. Per-game head-to-head records + match history views — **depends on 3BE.2, 3BE.6**
- [ ] 4RIV.2. Cross-game meta-score / unified Tallywhack standing (ELO or championship points across all games) — **depends on 4RIV.1**
- [ ] 4RIV.3. Achievements & milestones engine (streaks, comebacks, game-specific badges) — **depends on 4RIV.1**
- [ ] 4RIV.4. Narrative & banter layer (auto-commentary, streak alerts, "on this day", taunts) — **depends on 4RIV.2, 4RIV.3**

---

## Milestone 5 — Polish

> Prove the modularity, harden the experience, feel finished.

### Blocked

- [ ] 5PL.1. Add one new module end-to-end to validate the module contract (modularity acceptance test) — **depends on 4RIV.1**
- [ ] 5PL.2. PWA hardening — offline-tolerant scoring, install prompts, table-use ergonomics — **depends on 1FN.5, 3BE.6**
- [ ] 5PL.3. Design polish pass — per-module identity within the family, motion, empty states — **depends on 1FN.4, 3BE.5**

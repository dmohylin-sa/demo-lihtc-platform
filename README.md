# Everstead Release 1 - clickable demo

A client-facing demo of what Geniusee's Release 1 ballpark (`../everstead-release-1-ballpark-estimate.xlsx`,
sheet `Release 1 - Scope`, rows 1-21) builds: Phase 1 9% LIHTC intake through underwriting readiness for NY HCR.
There is no backend. Data is mocked in the browser, and demo state persists in `localStorage`. Use
"Reset demo data" in the persona menu to start over.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static build in dist/ (HashRouter, relative base - serve from any static path)
npm run preview    # serve the build locally; browsers block module scripts on file://, so don't double-click
```

## What is real and what is mocked

- **From Everstead's review pack, verbatim:**
  - the 224 Phase 1 nodes of process tree v3.6.1 (`src/data/tree-phase1.ts`, generated from pack pp.250-258);
  - the 90-rule NY HCR 9% rule pack (`src/data/rules-hcr9.ts`, pp.397-404);
  - the 8 Phase 1 decisions, the G1 gate conditions, the agent index, the gate checklists and the governing documents (`src/data/registry.ts`).
- **Fictional:** the deals (Harlow Commons, Linden Court, Pier Street Lofts), the people, the deal documents and every figure on the model-operations and acceptance screens.
- **Real code paths:**
  - The underwriting numbers come from a deterministic engine (`src/calc/underwriting.ts`).
  - The audit log is a real SHA-256 hash chain (`src/calc/sha256.ts`).
  - The JSON export and the Word export are real downloads.

## Demo paths

- **Guided tour** (header, or "Start the guided tour" at sign-in): 18 steps through one deal.
- **Walkthrough scenarios** (header): the four cases from RFP response section 06.
- **Persona switcher** (header): Deal Lead, Underwriting Analyst, Closing Coordinator, Principal and Everstead platform admin. Buttons, masked fields and the admin console change with the role.
- **Release 1 target / Today switch** (header): Today shows the client's current Tier 1 platform as described to us.
  What exists stays live; what it lacks is dimmed and inert, with a chip that says what exists today. Roles are not
  enforced in Today, matching the current platform. The guided tour always runs in Release 1 target.
- **Current platform** (`/current-state`, sidebar): the capability matrix - every capability with its status today
  (built, partial, to be replaced, not built, not confirmed), the client's direction for it and what Release 1 adds -
  plus Tier 1 delivery, known issues and the current stack.

## Release 1 target and Today

- One registry drives both the matrix and the Today view: `src/data/currentState.ts` (66 capability ids). The gating
  components are in `src/components/today.tsx` (`TodayGate`, `TodayPage`, `CapChip`, `GatedButton`, `todayCol`); in
  Release 1 target they render their children untouched.
- Added for today's platform, visible in both modes: **Agent runs** (`/deals/:id/runs`, the 002 → 009 → 010 → 015
  chain with one audit row per agent run, retries and the dead-letter queue), Accept / Override / Flag on findings,
  the risk register view on Findings, and the six-gate workbook audit tab on Underwriting. Today only: the close-out
  run replay, the 12-stage / 3-gate lifecycle rail, per-agent eval status and the known issues.
- The current-state text is written in our own words, without vendor or product names, and its figures are
  approximate. Illustrative: the run history, the per-agent split, prompt names, repeat-upload counts, the
  finding-to-gate mapping and risk ratings. The six audit gates and the 12 stages were not named to us, so they stay
  numbered. Every status is to be confirmed at code review.

Stack: Vite, React 18, TypeScript, Ant Design 5 recoloured to Everstead's identity (plum `#521B3A`, gold
`#F2E286`, Archivo and Instrument Sans), zustand and recharts. The style base is the `antd-modern-style-demo` skill.

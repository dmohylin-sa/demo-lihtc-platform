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

Stack: Vite, React 18, TypeScript, Ant Design 5 recoloured to Everstead's identity (plum `#521B3A`, gold
`#F2E286`, Archivo and Instrument Sans), zustand and recharts. The style base is the `antd-modern-style-demo` skill.

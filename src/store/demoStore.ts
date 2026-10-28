// Single demo store. Every mutating action appends a hash-chained audit event (requirement 07).
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AuditEvent, Deal, DecisionState, ExtractField, Finding, FindingReview, GateConditionState, NodeState, PersonaId, ProjectType,
  ReviewAction,
} from '../data/types';
import { PERMISSIONS, personaById, type Capability } from '../data/people';
import { SEED_DEALS } from '../data/deals';
import { SEED_FIELDS, SEED_FINDINGS, buildNodeStatus } from '../data/analysis';
import { DECISIONS, G1_CONDITIONS } from '../data/registry';
import { UW_INPUTS } from '../data/underwriting';
import { underwrite, usd } from '../calc/underwriting';
import { sha256 } from '../calc/sha256';
import { RULE_PACK_2026_2 } from '../data/ops';

export type ScenarioId = 's1' | 's2' | 's3' | 's4';
// 'target' shows Release 1; 'today' is a lens over the same data showing the platform as it exists now.
export type ViewMode = 'target' | 'today';

export interface ChangeRow {
  label: string;
  before: string;
  after: string;
  kind: 'resolved' | 'recomputed' | 'new' | 'invalidated' | 'superseded' | 'routed';
}

export interface WhatChanged {
  title: string;
  trigger: string;
  rows: ChangeRow[];
  notes: string[];
  link?: { label: string; to: string };
}

export interface ReportState {
  status: 'draft' | 'signed';
  edits: Record<string, string>;
  acknowledged: string[];
  signedBy?: string;
  signedAt?: string;
  version: number;
  hash?: string;
}

export interface UploadState {
  status: 'none' | 'uploading' | 'paused' | 'scanning' | 'processing' | 'done';
  progress: number;
}

interface GateState {
  conditions: Record<string, GateConditionState>;
  authorized?: { by: string; at: string; note?: string };
}

interface DemoData {
  loggedIn: boolean;
  persona: PersonaId;
  deals: Deal[];
  nodeStatus: Record<string, Record<string, NodeState>>;
  upload: Record<string, UploadState>;
  extraDocs: string[];
  superseded: Record<string, string>;
  fields: ExtractField[];
  findings: Finding[];
  decisions: Record<string, Record<string, DecisionState>>;
  gate: Record<string, GateState>;
  report: Record<string, ReportState>;
  audit: AuditEvent[];
  uwVersion: Record<string, 'v2' | 'v3'>;
  rulePackPublished: '2026.1' | '2026.2';
  rulePackTested: boolean;
  scenarios: Record<ScenarioId, boolean>;
  tamperSeq: number | null;
  whatChanged: WhatChanged | null;
  tourOpen: boolean;
  tourStep: number;
  mode: ViewMode;
  findingReviews: Record<string, FindingReview[]>;
}

interface DemoActions {
  login: (p: PersonaId) => void;
  logout: () => void;
  setPersona: (p: PersonaId) => void;
  addDeal: (d: { name: string; borough: string; units: number; projectType: ProjectType; overlays: string[] }) => string;
  setUpload: (dealId: string, u: UploadState) => void;
  completeUpload: (dealId: string) => void;
  reviewField: (fieldId: string, status: ExtractField['status'], value?: string, note?: string) => void;
  recordDecision: (dealId: string, decisionId: string, option: string, basis: string) => void;
  verifyCondition: (dealId: string, condId: string, note?: string) => void;
  authorizeGate: (dealId: string, note?: string) => void;
  editReport: (dealId: string, key: string, text: string) => void;
  acknowledgeFlag: (dealId: string, key: string) => void;
  signReport: (dealId: string) => void;
  testRulePack: () => void;
  publishRulePack: () => void;
  rerunRules: (dealId: string) => void;
  runScenario: (id: ScenarioId) => void;
  setTamper: (seq: number | null) => void;
  closeWhatChanged: () => void;
  setTour: (open: boolean, step?: number) => void;
  setMode: (m: ViewMode) => void;
  reviewFinding: (findingId: string, action: ReviewAction, note?: string) => void;
  logEvent: (e: { action: string; object: string; basis?: string; dealId?: string }) => void;
  resetDemo: () => void;
}

export type DemoState = DemoData & DemoActions;

// ------------------------------------------------------------------------------------------------
// Audit chain helpers
// ------------------------------------------------------------------------------------------------
const GENESIS = '0'.repeat(64);

export function eventPayload(e: Omit<AuditEvent, 'hash'>) {
  return [e.seq, e.at, e.actor, e.role, e.tenant, e.dealId ?? '', e.action, e.object, e.basis ?? '', e.prevHash].join('|');
}

function chain(events: Omit<AuditEvent, 'hash' | 'prevHash' | 'seq'>[], start: AuditEvent[] = []): AuditEvent[] {
  const out = [...start];
  for (const e of events) {
    const prev = out[out.length - 1];
    const base = { ...e, seq: (prev?.seq ?? 0) + 1, prevHash: prev?.hash ?? GENESIS };
    out.push({ ...base, hash: sha256(eventPayload(base)) });
  }
  return out;
}

export const nowIso = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const SYSTEM = { actor: 'Everstead platform', role: 'System', tenant: 'Northbank Housing Partners' };
const ev = (at: string, who: { actor: string; role: string; tenant: string }, action: string, object: string, basis?: string, dealId = 'harlow') =>
  ({ at, ...who, action, object, basis, dealId });
const MAYA = { actor: 'Maya Ortiz', role: 'Deal Lead (PM)', tenant: 'Northbank Housing Partners' };
const SAM = { actor: 'Sam Whitaker', role: 'Underwriting Analyst', tenant: 'Northbank Housing Partners' };
const DANIEL = { actor: 'Daniel Brooks', role: 'Principal', tenant: 'Northbank Housing Partners' };
const JORDAN = { actor: 'Jordan Ellis', role: 'Everstead staff', tenant: 'Everstead Advisory' };

function seedAudit(): AuditEvent[] {
  return chain([
    ev('2026-08-04 09:02:11', MAYA, 'Deal created', 'Harlow Commons · 9% LIHTC (competitive) · NYS HCR', 'Pinned to process tree v3.4 and rule pack 2025.3'),
    ev('2026-08-28 16:40:05', DANIEL, 'Decision recorded', 'D1-01 New construction vs rehabilitation vs adaptive reuse → New construction', 'Zoning analysis (R7A + MIH, 145 units as of right); vacant site; napkin pro-forma'),
    ev('2026-10-08 18:20:44', JORDAN, 'Process tree version published', 'v3.6.1 (3,403 nodes · 149 decisions · 4 gates)', 'Loaded as configuration - no redeployment', ''),
    ev('2026-10-08 18:31:02', JORDAN, 'Rule pack version published', 'NY HCR 9% LIHTC 2026.1 (90 rules)', 'SME pilot workbook v21.1; source-verified', ''),
    ev('2026-10-09 08:15:30', MAYA, 'Deal re-pinned', 'Harlow Commons → tree v3.6.1, rule pack 2026.1', 'Deal had no gate passed; re-pin approved by Deal Lead'),
    ev('2026-10-14 10:24:14', MAYA, 'Package upload started', '412 files · 2.8 GB', 'Resumable upload; malware scan on arrival'),
    ev('2026-10-14 10:31:05', SYSTEM, 'Package upload completed', '412 files received (resumed once)'),
    ev('2026-10-14 10:32:31', SYSTEM, 'Malware scan completed', '412 files clean'),
    ev('2026-10-14 10:36:12', SYSTEM, 'Documents classified', '412 files · 10 Phase 1 document types · 1,132 scanned pages OCR-processed'),
    ev('2026-10-14 10:41:40', SYSTEM, 'Fields extracted', '33 fields across 10 document types; 1 silent slot flagged; 1 conflict', 'Prompts: extract.* pinned versions'),
    ev('2026-10-14 10:42:16', SYSTEM, 'Rule checks run', 'NY HCR 9% 2026.1 against deal facts · 13 findings', 'Rules cited with section and program year'),
    ev('2026-10-14 10:42:18', SYSTEM, 'Calculations run', `Underwriting input set v2 · DSCR 1.17x · sources - uses ${usd(-250575)}`, 'calc-engine 1.4.2 · deterministic'),
    ev('2026-10-15 09:05:51', SAM, 'Field accepted', 'Lender term sheet · Minimum DSCR = 1.20x', 'Lender term sheet p.2 §4.2'),
    ev('2026-10-15 09:07:12', SAM, 'Field accepted', 'Construction cost estimate · fees 6.0% / 2.0% / 6.4%', 'Cost estimate p.3'),
    ev('2026-10-16 14:22:09', MAYA, 'Field accepted', 'Phase I ESA · report date April 14, 2026', 'Phase I ESA p.1'),
    ev('2026-10-20 11:48:30', SYSTEM, 'Summary generated', 'Practitioner summary · Harlow Commons', 'Prompt summary.practitioner v1.2'),
  ]);
}

// ------------------------------------------------------------------------------------------------
// Initial state
// ------------------------------------------------------------------------------------------------
function initialDecisions(projectType: ProjectType, dealId: string): Record<string, DecisionState> {
  const out: Record<string, DecisionState> = {};
  for (const d of DECISIONS) out[d.id] = { status: d.appliesTo.includes(projectType) ? 'not_reached' : 'na' };
  if (dealId === 'harlow') {
    out['D1-01'] = { status: 'decided', option: 'New construction', basis: 'Zoning analysis (R7A + MIH, 145 units as of right); vacant site; napkin pro-forma', actor: 'Daniel Brooks', role: 'Principal', at: '2026-08-28 16:40:05' };
    out['D1-04'] = { status: 'awaiting' };
    out['D1-08'] = { status: 'awaiting' };
  }
  if (dealId === 'linden') {
    out['D1-01'] = { status: 'decided', option: 'Rehabilitation', basis: 'Existing 120-unit building; IPNA; occupied', actor: 'Daniel Brooks', role: 'Principal', at: '2026-09-18 10:12:40' };
    out['D1-02'] = { status: 'awaiting' };
    out['D1-03'] = { status: 'awaiting' };
    out['D1-06'] = { status: 'awaiting' };
  }
  if (dealId === 'pier') out['D1-01'] = { status: 'decided', option: 'Adaptive reuse', basis: 'Existing warehouse; 467-m eligible', actor: 'Daniel Brooks', role: 'Principal', at: '2026-10-12 15:01:00' };
  return out;
}

function initialData(): DemoData {
  const deals = SEED_DEALS.map((d) => ({ ...d }));
  return {
    loggedIn: false,
    persona: 'dealLead',
    deals,
    nodeStatus: Object.fromEntries(deals.map((d) => [d.id, buildNodeStatus(d.id, d.projectType)])),
    upload: { harlow: { status: 'done', progress: 100 }, linden: { status: 'done', progress: 100 }, pier: { status: 'none', progress: 0 } },
    extraDocs: [],
    superseded: {},
    fields: SEED_FIELDS.map((f) => ({ ...f })),
    findings: SEED_FINDINGS.map((f) => ({ ...f })),
    decisions: Object.fromEntries(deals.map((d) => [d.id, initialDecisions(d.projectType, d.id)])),
    gate: Object.fromEntries(deals.map((d) => [d.id, { conditions: Object.fromEntries(G1_CONDITIONS.map((c) => [c.id, { verified: false }])) }])),
    report: Object.fromEntries(deals.map((d) => [d.id, { status: 'draft', edits: {}, acknowledged: [], version: 1 } as ReportState])),
    audit: seedAudit(),
    uwVersion: { harlow: 'v2' },
    rulePackPublished: '2026.1',
    rulePackTested: false,
    scenarios: { s1: false, s2: false, s3: false, s4: false },
    tamperSeq: null,
    whatChanged: null,
    tourOpen: false,
    tourStep: 0,
    mode: 'target',
    findingReviews: {},
  };
}

const REVIEW_LABEL: Record<ReviewAction, string> = { accepted: 'Finding accepted', overridden: 'Finding overridden', flagged: 'Finding flagged' };

// ------------------------------------------------------------------------------------------------
// "What changed" views of the four walkthrough scenarios. They are built from constants, so a scenario
// that already ran (scenarios are persisted) can open its view again - the guided tour relies on it.
// ------------------------------------------------------------------------------------------------
const SCENARIO_CHANGES: Record<ScenarioId, () => WhatChanged> = {
  s1: () => {
    const r2 = underwrite(UW_INPUTS.v2);
    const r3 = underwrite(UW_INPUTS.v3);
    return {
      title: 'Revised underwriting model',
      trigger: 'Sponsor Pro Forma v3 superseded v2. Four findings depended on v2 inputs; they were invalidated and recomputed with the same deterministic engine.',
      rows: [
        { label: 'Sponsor pro forma', before: 'v2 (current)', after: 'v3 (current) · v2 kept as superseded', kind: 'superseded' },
        { label: 'F-03 · DSCR vs lender 1.20x', before: `${r2.dscr.toFixed(2)}x · blocking`, after: `${r3.dscr.toFixed(2)}x · resolved`, kind: 'resolved' },
        { label: 'F-07 · Regulatory term (HCR-T-16)', before: '30 years · advisory', after: '50 years · resolved', kind: 'resolved' },
        { label: 'F-01 · Sources - uses', before: usd(r2.balance), after: `${usd(r3.balance)} · still blocking`, kind: 'recomputed' },
        { label: 'F-01 · Gap-method credit (HCR-C-08)', before: usd(r2.gapCredit), after: usd(r3.gapCredit), kind: 'recomputed' },
        { label: 'F-02 · Developer fee % (HCR-C-02)', before: `${r2.devFeePctOfBase}% of ${usd(r2.devFeeBaseCap / 0.1)}`, after: `${r3.devFeePctOfBase}% of ${usd(r3.devFeeBaseCap / 0.1)} · still blocking`, kind: 'recomputed' },
        { label: 'Total development cost', before: usd(r2.tdc), after: usd(r3.tdc), kind: 'recomputed' },
      ],
      notes: ['Operating expenses fell from $9,885 to $9,560 per unit (485-x exemption, D1-08); soft costs rose by $150,000.', 'Superseded findings stay in the audit trail with their original values.'],
      link: { label: 'Open underwriting', to: '/deals/harlow/underwriting' },
    };
  },
  s2: () => ({
    title: 'Lender email conflicts with a cited source',
    trigger: 'An email from Hudson Mutual says a 12-month Phase I is acceptable. The executed term sheet says 6 months.',
    rows: [
      { label: 'Field · Phase I ESA currency', before: '≤ 6 months (term sheet p.5) · accepted', after: 'Conflict: 6 months (term sheet) vs 12 months (email)', kind: 'routed' },
      { label: 'F-14 · Email vs executed term sheet', before: '-', after: 'New · in review with Deal Lead', kind: 'new' },
      { label: 'F-04 · ESA lender window', before: 'Open · advisory', after: 'In review · not relaxed', kind: 'routed' },
      { label: 'G1 condition X0222', before: 'Not verified', after: 'Not verified - evidence in conflict', kind: 'routed' },
    ],
    notes: ['The platform presents both values with their sources and does not resolve the conflict silently.', 'If the lender signs an amendment, uploading it as an executed document closes the conflict.'],
    link: { label: 'Open extraction', to: '/deals/harlow/extraction' },
  }),
  s3: () => ({
    title: 'New HCR term sheet mid-deal',
    trigger: 'Everstead staff published rule pack 2026.2 after testing it against the sample deal. No code changed and nothing was redeployed.',
    rows: [
      { label: 'HCR-T-08e · per-unit cap, NYC metro', before: '35,000 / 37,000', after: '36,000 / 38,000 (effective 2026-11-15)', kind: 'recomputed' },
      { label: 'HCR-T-08f · per-unit cap, rest of state', before: '30,500 / 32,500', after: '31,500 / 33,500 (effective 2026-11-15)', kind: 'recomputed' },
      { label: 'HCR-T-26 · all-electric new construction', before: '-', after: 'Added · status Delayed (2027-07-01)', kind: 'new' },
      { label: 'Harlow Commons pin', before: '2026.1', after: '2026.1 - practitioner decides when to re-run', kind: 'routed' },
    ],
    notes: ['Deals in flight stay pinned to the version they were checked against. A banner on each affected deal offers a re-run with a before/after diff.'],
    link: { label: 'Open findings (re-run banner)', to: '/deals/harlow/findings' },
  }),
  s4: () => ({
    title: 'Executed document silent on an extraction slot',
    trigger: 'Linden Court\'s executed HAP contract was processed against X0139, the only project-document extraction slot in Phase 1.',
    rows: [
      { label: 'Contract units', before: '-', after: '120 of 120 · cited p.1', kind: 'new' },
      { label: 'Current term', before: '-', after: 'Expires Feb 28, 2028 · cited p.1', kind: 'new' },
      { label: 'Rent adjustment method', before: '-', after: 'Silent - flagged, not defaulted', kind: 'routed' },
      { label: 'X0139 In-place HAP contract review', before: 'In progress', after: 'Blocked until the rider is supplied', kind: 'routed' },
      { label: 'L-01 · HAP contract silent', before: '-', after: 'New · blocking', kind: 'new' },
    ],
    notes: ['Where executed documents are silent, the platform flags the gap and never fills it with a typical value (requirement 05).'],
    link: { label: 'Open Linden Court extraction', to: '/deals/linden/extraction' },
  }),
};

// ------------------------------------------------------------------------------------------------
// Store
// ------------------------------------------------------------------------------------------------
export const useDemo = create<DemoState>()(
  persist(
    (set, get) => {
      const who = () => {
        const p = personaById(get().persona);
        return { actor: p.name, role: p.role, tenant: p.tenantId === 'everstead' ? 'Everstead Advisory' : 'Northbank Housing Partners' };
      };
      const log = (action: string, object: string, basis?: string, dealId?: string, actor = who()) =>
        set((s) => ({ audit: chain([{ at: nowIso(), ...actor, action, object, basis, dealId }], s.audit) }));
      const sysLog = (action: string, object: string, basis?: string, dealId?: string) => log(action, object, basis, dealId, SYSTEM);
      const patchNode = (dealId: string, nodeId: string, st: Partial<NodeState>) =>
        set((s) => ({ nodeStatus: { ...s.nodeStatus, [dealId]: { ...s.nodeStatus[dealId], [nodeId]: { ...s.nodeStatus[dealId][nodeId], ...st, at: nowIso().slice(0, 10) } } } }));
      const patchFinding = (id: string, p: Partial<Finding>) => set((s) => ({ findings: s.findings.map((f) => (f.id === id ? { ...f, ...p } : f)) }));

      return {
        ...initialData(),

        login: (p) => {
          set({ loggedIn: true, persona: p });
          log('Signed in', 'Web app · MFA verified', 'Managed identity service · TOTP');
        },
        logout: () => set({ loggedIn: false, tourOpen: false }),
        setPersona: (p) => {
          set({ persona: p });
          log('Persona switched (demo)', `${personaById(p).name} · ${personaById(p).title}`);
        },

        addDeal: ({ name, borough, units, projectType, overlays }) => {
          const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `deal-${Date.now()}`;
          const deal: Deal = {
            id, name, location: `${borough}, NY (fictional site)`, borough, units, projectType,
            program: '9% LIHTC (competitive)', agency: 'NYS HCR', overlays: ['9% LIHTC', 'HCR', ...overlays], tenantId: 'northbank',
            treeVersion: 'v3.6.1', ruleVersion: get().rulePackPublished, createdAt: nowIso().slice(0, 10), targetClosing: '2027-06-30',
            tdc: null, creditRequest: null, stage: 'X0002', depth: 'intake', dealLead: 'dealLead',
          };
          set((s) => ({
            deals: [...s.deals, deal],
            nodeStatus: { ...s.nodeStatus, [id]: buildNodeStatus(id, projectType) },
            upload: { ...s.upload, [id]: { status: 'none', progress: 0 } },
            decisions: { ...s.decisions, [id]: initialDecisions(projectType, id) },
            gate: { ...s.gate, [id]: { conditions: Object.fromEntries(G1_CONDITIONS.map((c) => [c.id, { verified: false }])) } },
            report: { ...s.report, [id]: { status: 'draft', edits: {}, acknowledged: [], version: 1 } },
          }));
          log('Deal created', `${name} · 9% LIHTC (competitive) · NYS HCR`, `Pinned to process tree v3.6.1 and rule pack ${deal.ruleVersion}`, id);
          return id;
        },

        setUpload: (dealId, u) => set((s) => ({ upload: { ...s.upload, [dealId]: u } })),
        completeUpload: (dealId) => {
          set((s) => ({ upload: { ...s.upload, [dealId]: { status: 'done', progress: 100 } } }));
          sysLog('Package processed', 'Upload, malware scan, OCR and classification complete', 'Job queue with retries', dealId);
        },

        reviewField: (fieldId, status, value, note) => {
          const f0 = get().fields.find((f) => f.id === fieldId);
          set((s) => ({ fields: s.fields.map((f) => (f.id === fieldId ? { ...f, status, value: value ?? f.value, note: note ?? f.note } : f)) }));
          if (f0) log(status === 'corrected' ? 'Field corrected' : 'Field accepted', `${f0.docType} · ${f0.field} = ${value ?? f0.value}`, note ?? 'Practitioner review', f0.dealId);
        },

        recordDecision: (dealId, decisionId, option, basis) => {
          const def = DECISIONS.find((d) => d.id === decisionId)!;
          const actor = who();
          set((s) => ({
            decisions: { ...s.decisions, [dealId]: { ...s.decisions[dealId], [decisionId]: { status: 'decided', option, basis, actor: actor.actor, role: actor.role, at: nowIso() } } },
          }));
          log('Decision recorded', `${decisionId} ${def.title} → ${option}`, basis, dealId);
          patchNode(dealId, def.nodeId, { status: 'done', source: 'manual', cause: undefined });
          if (dealId === 'harlow' && decisionId === 'D1-04') {
            const yes = option.startsWith('Yes');
            patchNode(dealId, 'X0125', yes ? { status: 'in_progress', cause: undefined } : { status: 'na', cause: 'Phase II not commissioned (D1-04)' });
            set((s) => ({ decisions: { ...s.decisions, harlow: { ...s.decisions.harlow, 'D1-05': { status: yes ? 'not_reached' : 'na' } } } }));
            patchFinding('F-05', { status: 'resolved', detail: `${get().findings.find((f) => f.id === 'F-05')!.detail} Decision D1-04 recorded: ${option}.` });
            patchNode(dealId, 'X0122', { status: 'in_progress' });
          }
          if (dealId === 'harlow' && decisionId === 'D1-08') {
            patchNode(dealId, 'X0162', { status: 'in_progress' });
            patchNode(dealId, 'X0163', { status: 'in_progress' });
          }
        },

        verifyCondition: (dealId, condId, note) => {
          set((s) => ({
            gate: { ...s.gate, [dealId]: { ...s.gate[dealId], conditions: { ...s.gate[dealId].conditions, [condId]: { verified: true, by: who().actor, at: nowIso(), note } } } },
          }));
          const c = G1_CONDITIONS.find((x) => x.id === condId)!;
          log('Gate condition verified (first pass)', `G1 · ${c.nodeId ?? 'NEW'} ${c.text.slice(0, 70)}…`, note || 'Evidence reviewed', dealId);
          if (c.nodeId) patchNode(dealId, c.nodeId, { status: 'done', source: 'manual' });
        },

        authorizeGate: (dealId, note) => {
          set((s) => ({ gate: { ...s.gate, [dealId]: { ...s.gate[dealId], authorized: { by: who().actor, at: nowIso(), note } } } }));
          log('Gate authorized', 'G1 Acquisition closing - funds may be released at title', note || 'All conditions verified', dealId);
          patchNode(dealId, 'X0220', { status: 'done', source: 'manual' });
        },

        editReport: (dealId, key, text) =>
          set((s) => ({ report: { ...s.report, [dealId]: { ...s.report[dealId], edits: { ...s.report[dealId].edits, [key]: text } } } })),
        acknowledgeFlag: (dealId, key) => {
          set((s) => ({ report: { ...s.report, [dealId]: { ...s.report[dealId], acknowledged: [...new Set([...s.report[dealId].acknowledged, key])] } } }));
          log('Quality-gate flag cleared', key, 'Practitioner acknowledged in report', dealId);
        },
        signReport: (dealId) => {
          const r = get().report[dealId];
          const hash = sha256(`${dealId}|${r.version}|${JSON.stringify(r.edits)}|${nowIso()}`);
          set((s) => ({ report: { ...s.report, [dealId]: { ...r, status: 'signed', signedBy: who().actor, signedAt: nowIso(), hash } } }));
          log('Readiness report signed off', `Underwriting readiness report v${r.version} · ${Object.keys(r.edits).length} practitioner edits`, `Version locked · sha256 ${hash.slice(0, 12)}…`, dealId);
        },

        testRulePack: () => {
          set({ rulePackTested: true });
          log('Rule pack tested against sample deal', `NY HCR 9% ${RULE_PACK_2026_2.version} draft → Harlow Commons (QA copy)`, '3 findings affected · 0 errors');
        },
        publishRulePack: () => {
          set({ rulePackPublished: '2026.2' });
          log('Rule pack version published', `NY HCR 9% LIHTC ${RULE_PACK_2026_2.version} - ${RULE_PACK_2026_2.title}`, 'Configuration only - no rebuild or redeployment', undefined);
        },

        rerunRules: (dealId) => {
          if (dealId !== 'harlow') {
            // Deals without underwriting yet: re-pin and re-check thresholds; nothing to recompute.
            set((s) => ({ deals: s.deals.map((d) => (d.id === dealId ? { ...d, ruleVersion: '2026.2' } : d)) }));
            sysLog('Rule checks re-run', 'NY HCR 9% 2026.2 against deal facts', 'Deal re-pinned from 2026.1 to 2026.2 by practitioner', dealId);
            set({
              whatChanged: {
                title: 'Re-run against rule pack 2026.2',
                trigger: 'The deal was re-checked against the revised HCR 9% term sheet.',
                rows: [{ label: 'Rule pack pin', before: '2026.1', after: '2026.2', kind: 'superseded' }],
                notes: ['No finding on this deal depends on the changed rules yet; they apply once underwriting inputs exist.'],
              },
            });
            return;
          }
          const before = get().findings.filter((f) => f.dealId === dealId);
          const gap = usd(underwrite(UW_INPUTS[get().uwVersion[dealId] ?? 'v2']).gapCredit);
          set((s) => ({ deals: s.deals.map((d) => (d.id === dealId ? { ...d, ruleVersion: '2026.2' } : d)) }));
          patchFinding('F-10', {
            detail: 'Annual request of $2,750,000 is within the $2,800,000 per-project cap and, at $32,738 per unit, within the revised $36,000 per-unit cap (rule pack 2026.2).',
            citation: '9 NYCRR 2040.3(e)(8) + 2026 HCR 9% Term Sheet (rev. Nov 2026) · program year 2026',
          });
          const f01 = before.find((f) => f.id === 'F-01');
          if (f01) patchFinding('F-01', { detail: `${f01.detail.split(' Under HCR-C-08')[0]} Under HCR-C-08 the gap method still binds before either cap; the revised per-unit cap ($36,000 × 84 = $3,024,000) does not change the recommendation.` });
          set((s) => ({
            findings: [...s.findings, {
              id: 'F-15', dealId, title: 'All-electric requirement (HCR-T-26) is delayed - not applied', severity: 'informational', category: 'Threshold',
              detail: 'Rule pack 2026.2 adds an all-electric requirement for new construction with status Delayed, effective July 1, 2027. It is recorded against the deal but not applied; it will switch on automatically if the deal is still pre-allocation on that date.',
              ruleIds: ['HCR-T-26'], citation: '2026 HCR 9% Term Sheet (rev. Nov 2026) · effective 2027-07-01 (Delayed)', basis: ['rule'], method: 'rule-based',
              sources: [], action: 'Monitor; design team to confirm electrification scope.', owner: 'Deal Lead (PM)', status: 'open', nodeId: 'X0018',
            }],
          }));
          sysLog('Rule checks re-run', 'NY HCR 9% 2026.2 against deal facts', 'Deal re-pinned from 2026.1 to 2026.2 by practitioner', dealId);
          set({
            whatChanged: {
              title: 'Re-run against rule pack 2026.2',
              trigger: 'Everstead published a revised HCR 9% term sheet while the deal was in flight. The deal stayed pinned to 2026.1 until the practitioner chose to re-run.',
              rows: [
                { label: 'F-10 · Per-unit credit cap (HCR-T-08e)', before: '$35,000 per unit · pass', after: '$36,000 per unit · pass', kind: 'recomputed' },
                { label: 'F-01 · Sources and uses (HCR-C-08)', before: `Gap credit ${gap} binds`, after: `Gap credit ${gap} still binds`, kind: 'recomputed' },
                { label: 'F-15 · All-electric (HCR-T-26)', before: '-', after: 'Recorded, not applied (Delayed until 2027-07-01)', kind: 'new' },
                { label: 'Rule pack pin', before: '2026.1', after: '2026.2', kind: 'superseded' },
              ],
              notes: ['No blocking finding changed.', 'Both versions stay available: the 2026.1 results remain in the audit trail.'],
              link: { label: 'Open findings', to: `/deals/${dealId}/findings` },
            },
          });
        },

        runScenario: (id) => {
          const s0 = get();
          // Already ran: the state change is not replayed, but its "What changed" view opens again.
          if (s0.scenarios[id]) { set({ whatChanged: SCENARIO_CHANGES[id]() }); return; }
          set((s) => ({ scenarios: { ...s.scenarios, [id]: true } }));

          if (id === 's1') {
            // Revised underwriting model supersedes v2, invalidates dependent findings and recomputes.
            const r3 = underwrite(UW_INPUTS.v3);
            log('Document uploaded', 'Sponsor Pro Forma v3.xlsx (supersedes v2)', 'Version 3 of sponsor pro forma', 'harlow');
            set((s) => ({ extraDocs: [...s.extraDocs, 'd-proforma-v3'], superseded: { ...s.superseded, 'd-proforma-v2': 'd-proforma-v3' }, uwVersion: { ...s.uwVersion, harlow: 'v3' } }));
            sysLog('Findings invalidated', 'F-01, F-02, F-03, F-07 depended on pro forma v2', 'Dependency map: finding → calculation → input cell', 'harlow');
            patchFinding('F-03', { status: 'resolved', detail: `Recomputed on pro forma v3: NOI ${usd(r3.noi)} over debt service ${usd(r3.annualDebtService)} gives ${r3.dscr.toFixed(2)}x, above the lender minimum of 1.20x.`, sources: [{ docId: 'd-lender-ts', page: 2, passageId: 'lts-dscr' }, { docId: 'd-proforma-v3', cell: 'Operating Budget!C24' }] });
            patchFinding('F-01', { detail: `Recomputed on pro forma v3: sources ${usd(r3.totalSources)} against uses ${usd(r3.tdc)} - short by ${usd(-r3.balance)}. Under HCR-C-08 the gap method supports ${usd(r3.gapCredit)} a year, within the $2.8M NYC-metro cap and $35,000 per unit.`, action: `Raise the annual credit request to ${usd(r3.gapCredit)} or add a source of ${usd(-r3.balance)}.` });
            patchFinding('F-02', { detail: `Recomputed on pro forma v3: developer fee of ${usd(UW_INPUTS.v3.developerFee)} is ${r3.devFeePctOfBase}% of acquisition + improvement cost; base cap ${usd(r3.devFeeBaseCap)} (10%). The 15% ceiling needs both a completion and an operating deficit guarantee; the executed guaranty is silent on operating deficits.`, action: `Obtain an operating deficit guarantee of at least ${usd(UW_INPUTS.v3.developerFee * 0.2)} for 36 months, or reduce the fee to ${usd(r3.devFeeBaseCap)}.` });
            patchFinding('F-07', { status: 'resolved', detail: 'Pro forma v3 models a 50-year regulatory term, meeting the 2026 HCR 9% term sheet minimum.', sources: [{ docId: 'd-proforma-v3', cell: 'Assumptions!C31' }] });
            patchNode('harlow', 'X0173', { status: 'done', cause: undefined, source: 'system' });
            patchNode('harlow', 'X0171', { status: 'blocked', cause: `Sources short of uses by ${usd(-r3.balance)} (F-01, recomputed)` });
            sysLog('Calculations re-run', `Underwriting input set v3 · DSCR ${r3.dscr.toFixed(2)}x · sources - uses ${usd(r3.balance)}`, 'calc-engine 1.4.2 · deterministic', 'harlow');
          }

          if (id === 's2') {
            // A lender email conflicts with the executed term sheet.
            log('Document uploaded', 'RE Harlow Commons - Phase I timing.eml', 'Forwarded from mailbox by Deal Lead', 'harlow');
            set((s) => ({
              extraDocs: [...s.extraDocs, 'd-email'],
              fields: s.fields.map((f) => (f.id === 'x-lts-4' ? {
                ...f, status: 'conflict', conflict: {
                  value: '≤ 12 months of closing', citation: { docId: 'd-email', page: 1, passageId: 'email-esa' }, source: 'Lender email, Oct 20, 2026',
                  precedence: 'Source ranking (requirement 01): governing document > executed project document > user-entered data > external sources. The executed term sheet outranks an email; a finding that would rest on the email alone goes to human review.',
                } } : f)),
              findings: [...s.findings, {
                id: 'F-14', dealId: 'harlow', title: 'Lender email conflicts with the executed term sheet on ESA currency', severity: 'advisory', category: 'Conflict',
                detail: 'The executed term sheet (§9(c)) requires a Phase I dated ≤ 6 months before closing. An email from the lender says a Phase I dated within 12 months is acceptable. The platform keeps the executed term sheet as controlling and does not relax F-04 on the strength of an email.',
                ruleIds: [], citation: 'Requirement 01 source ranking; lender term sheet §9(c)', basis: ['deal'], method: 'model-assisted',
                sources: [{ docId: 'd-lender-ts', page: 5, passageId: 'lts-esa' }, { docId: 'd-email', page: 1, passageId: 'email-esa' }],
                action: 'Ask the lender to confirm the waiver in a signed amendment, or order the ESA update.', owner: 'Deal Lead (PM)', status: 'in review', nodeId: 'X0222',
              }],
            }));
            patchFinding('F-04', { status: 'in review' });
            sysLog('Conflict detected', 'Lender term sheet §9(c) vs lender email (Oct 20, 2026)', 'Executed document outranks correspondence - routed to human review', 'harlow');
          }

          if (id === 's3') {
            // A new HCR term sheet arrives mid-deal: Everstead publishes rule pack 2026.2.
            set({ rulePackTested: true, rulePackPublished: '2026.2' });
            log('Rule pack version published', `NY HCR 9% LIHTC ${RULE_PACK_2026_2.version} - ${RULE_PACK_2026_2.title}`, 'Tested against sample deal · configuration only, no redeployment', undefined, JORDAN);
          }

          if (id === 's4') {
            // An executed document is silent on an extraction slot (X0139, Linden Court).
            log('Document uploaded', 'HAP Contract (1998) - executed - scanned.pdf', 'Linden Court · 31 scanned pages', 'linden');
            set((s) => ({
              extraDocs: [...s.extraDocs, 'd-hap'],
              fields: [
                ...s.fields,
                { id: 'x-hap-1', dealId: 'linden', docType: 'HAP contract', docId: 'd-hap', field: 'Contract units', value: '120 of 120', confidence: 0.95, citation: { docId: 'd-hap', page: 1, passageId: 'hap-units' }, status: 'accepted', nodeId: 'X0139' },
                { id: 'x-hap-2', dealId: 'linden', docType: 'HAP contract', docId: 'd-hap', field: 'Current term expires', value: 'February 28, 2028 (MAHRA renewal)', confidence: 0.92, citation: { docId: 'd-hap', page: 1, passageId: 'hap-term' }, status: 'accepted', nodeId: 'X0139' },
                { id: 'x-hap-3', dealId: 'linden', docType: 'HAP contract', docId: 'd-hap', field: 'Contract rent adjustment method', value: 'Not stated in the executed document', confidence: 0, citation: { docId: 'd-hap', page: 9, passageId: 'hap-rents' }, status: 'silent', nodeId: 'X0139', note: 'Section 2.7 refers to an adjustment rider and Exhibit A that are not attached to the executed copy. The slot is flagged and not defaulted to AAF or budget-based - that choice changes the rent schedule underwriting rests on.' },
              ],
              findings: [...s.findings, {
                id: 'L-01', dealId: 'linden', title: 'HAP contract silent on the rent adjustment method', severity: 'blocking', category: 'Extraction',
                detail: 'X0139 is a project-document extraction slot: negotiated per deal and filled from the executed document. The executed HAP contract refers to an adjustment rider that is not attached. The platform flags the gap and does not default to a typical method.',
                ruleIds: [], citation: 'Process tree v3.6.1 · X0139 rule type Extract (Principal review, Oct 8, 2026)', basis: ['deal'], method: 'model-assisted',
                sources: [{ docId: 'd-hap', page: 9, passageId: 'hap-rents' }], action: 'Obtain the executed adjustment rider and Exhibit A from the owner or HUD contract administrator.',
                owner: 'Deal Lead (PM)', status: 'open', nodeId: 'X0139',
              }],
            }));
            patchNode('linden', 'X0139', { status: 'blocked', cause: 'Executed HAP contract is silent on the rent adjustment method - slot flagged, not defaulted (L-01)' });
            sysLog('Extraction slot flagged', 'X0139 In-place HAP contract review · rent adjustment method', 'Executed document silent - never defaulted', 'linden');
          }

          set({ whatChanged: SCENARIO_CHANGES[id]() });
        },

        setTamper: (seq) => set({ tamperSeq: seq }),
        closeWhatChanged: () => set({ whatChanged: null }),
        // The guided tour walks Release 1, so opening it leaves the Today lens.
        setTour: (open, step) => set((s) => ({ tourOpen: open, tourStep: step ?? s.tourStep, ...(open ? { mode: 'target' as const } : {}) })),
        // A viewing lens, not a platform action: not written to the audit chain.
        setMode: (m) => set((s) => ({ mode: m, ...(m === 'today' && s.tourOpen ? { tourOpen: false } : {}) })),
        reviewFinding: (findingId, action, note) => {
          const f = get().findings.find((x) => x.id === findingId);
          if (!f) return;
          const a = who();
          set((s) => ({ findingReviews: { ...s.findingReviews, [findingId]: [...(s.findingReviews[findingId] ?? []), { action, note, actor: a.actor, role: a.role, at: nowIso() }] } }));
          log(REVIEW_LABEL[action], `${f.id} · ${f.title}`, note || 'Accepted as stated', f.dealId);
        },
        logEvent: ({ action, object, basis, dealId }) => log(action, object, basis, dealId),
        resetDemo: () => set({ ...initialData(), loggedIn: true, persona: get().persona, mode: get().mode }),
      };
    },
    {
      name: 'everstead-demo-v1',
      version: 1,
      // Transient UI state is not persisted: a reload never re-opens the tour or a modal.
      partialize: (s) => {
        const { tourOpen: _t, tourStep: _s, whatChanged: _w, tamperSeq: _x, ...rest } = s;
        return rest;
      },
    },
  ),
);

// ------------------------------------------------------------------------------------------------
// Selectors and helpers
// ------------------------------------------------------------------------------------------------
// In the Today lens roles are not enforced: on today's platform any allowlisted user can reach everything.
export const can = (persona: PersonaId, cap: Capability, mode: ViewMode = 'target') => mode === 'today' || PERMISSIONS[persona].includes(cap);
export const useCan = (cap: Capability) => useDemo((s) => can(s.persona, cap, s.mode));

export function verifyChain(events: AuditEvent[], tamperSeq: number | null): { ok: boolean; brokenAt: number | null } {
  let prev = GENESIS;
  for (const e of events) {
    const object = tamperSeq === e.seq ? `${e.object} (edited)` : e.object;
    const recomputed = sha256(eventPayload({ ...e, object, prevHash: prev }));
    if (e.prevHash !== prev || recomputed !== e.hash) return { ok: false, brokenAt: e.seq };
    prev = e.hash;
  }
  return { ok: true, brokenAt: null };
}

// Dev-only handle for scripted browser checks; stripped from production builds.
if (import.meta.env.DEV) (window as unknown as { __demo: typeof useDemo }).__demo = useDemo;

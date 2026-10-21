// Guided tour: one deal from package intake to a signed, source-cited readiness report, plus the four
// RFP walkthrough cases. Each step names its route, its target and (optionally) the persona and an action.
import type { ReactNode } from 'react';
import type { PersonaId } from '../data/types';
import { useDemo } from '../store/demoStore';
import { useIntakeSim } from '../pages/deal/intakeSim';

export interface TourStepDef {
  chapter: string;
  route: string;
  target: string;
  title: string;
  body: ReactNode;
  persona?: PersonaId;
  onEnter?: () => void;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const close = () => useDemo.getState().closeWhatChanged();

export const TOUR_STEPS: TourStepDef[] = [
  {
    chapter: 'Portfolio', route: '/deals', target: '[data-tour="portfolio-table"]', persona: 'dealLead', onEnter: close,
    title: 'Every deal, where it stands',
    body: 'Maya Ortiz, a Deal Lead at a sponsor, sees her deals with a health signal, readiness and blocking items. Harlow Commons is a fictional 84-unit 9% LIHTC new-construction deal in the Bronx.',
  },
  {
    chapter: 'Where the deal stands', route: '/deals/harlow/overview', target: '[data-tour="deal-rail"]',
    title: 'Phase 1, from site sourcing to gate G1',
    body: 'The deal is placed on the Phase 1 Pre-Acquisition path of process tree v3.6.1: 224 nodes, 8 decision points and the acquisition-closing gate. Red marks a workstream with a blocked step.',
  },
  {
    chapter: 'Where the deal stands', route: '/deals/harlow/overview', target: '[data-tour="next-actions"]', placement: 'right',
    title: 'Next required actions, all of them',
    body: 'Where several actions can run in parallel, the platform shows all of them, each with an owner and its basis: a decision-register entry or a rule with section and program year.',
  },
  {
    chapter: 'Intake', route: '/deals/harlow/documents', target: '[data-tour="intake-panel"]',
    onEnter: () => useIntakeSim.getState().replay(),
    title: 'A real deal package, not a sample',
    body: '412 files and 2.8 GB: resumable upload, malware scan, OCR on 1,132 scanned pages and classification into Phase 1 document types, on a job queue with retries.',
  },
  {
    chapter: 'Intake', route: '/deals/harlow/documents', target: '[data-tour="doc-table"]',
    title: 'Classified, versioned, never overwritten',
    body: 'Every document keeps its versions. When a revised document arrives it supersedes the old one, and everything that depended on it is recomputed. Click any row to open the page viewer.',
  },
  {
    chapter: 'Cited extraction', route: '/deals/harlow/extraction', target: '[data-tour="field-silent"]',
    title: 'Silent documents are flagged, never defaulted',
    body: 'The executed guaranty covers completion but says nothing about operating deficits. The slot is flagged; the platform does not fill in a typical value. That matters: HCR-C-03 needs that guarantee for a developer fee above 10%.',
  },
  {
    chapter: 'Cited extraction', route: '/deals/harlow/extraction', target: '[data-tour="field-conflict"]',
    title: 'Conflicts show both values and both sources',
    body: 'The appraisal says 7 units a month of lease-up; the market study says 10. Both are shown with document, page and passage. With no documented precedence rule, the practitioner decides.',
  },
  {
    chapter: 'Process', route: '/deals/harlow/process?node=X0173', target: '[data-tour="process-tree"]', placement: 'right',
    title: 'The tree is configuration, not code',
    body: 'All 224 Phase 1 nodes with rule type, step class and agents, exactly as Everstead specified them. Branches for other project types are marked "not on this path". Blocked steps carry their cause.',
  },
  {
    chapter: 'Underwriting', route: '/deals/harlow/underwriting', target: '[data-tour="uw-kpis"]', persona: 'analyst',
    title: 'Deterministic math is code, not a model',
    body: 'Sources and uses, DSCR, eligible basis, the HCR-C-08 credit test and fee caps come from a tested calculation engine, with a tolerance report against the reference model.',
  },
  {
    chapter: 'Underwriting', route: '/deals/harlow/underwriting?tab=sens', target: '[data-tour="sensitivity"]',
    title: 'Ask "what if" without touching the record',
    body: 'Move rents, expenses, rate or credit price and watch DSCR, the gap-method credit and the balance recompute, without changing the deal record.',
  },
  {
    chapter: 'Findings', route: '/deals/harlow/findings', target: '[data-tour="findings-table"]',
    title: 'Every finding cites rule, section and program year',
    body: 'HCR threshold checks and risk detection, with severity, the action required and a label for its basis: deal evidence, an approved Everstead rule, or general information.',
  },
  {
    chapter: 'Change handling', route: '/deals/harlow/findings', target: '.wc-modal .ant-modal-content', persona: 'analyst',
    onEnter: () => useDemo.getState().runScenario('s1'),
    title: 'A revised underwriting model arrives',
    body: 'Pro forma v3 supersedes v2. The four findings that depended on v2 are invalidated and recomputed: DSCR now passes, the regulatory term is fixed, and the sources gap is recalculated.',
  },
  {
    chapter: 'Decisions', route: '/deals/harlow/decisions', target: '[data-tour="decision-D1-04"]', persona: 'dealLead', onEnter: close,
    title: 'The platform presents; the practitioner decides',
    body: 'D1-04 "RECs found → Phase II?" halts the process. The platform assembles the evidence and drafts a recommendation; only the Deal Lead can record the decision, with actor, time and basis.',
  },
  {
    chapter: 'Gate G1', route: '/deals/harlow/decisions', target: '[data-tour="gate-panel"]', persona: 'closing',
    title: 'Gate G1: verified, then authorized',
    body: 'The Closing Coordinator verifies each acquisition-closing condition on a first pass. Only the Principal can authorize the gate, or any waiver or economic cure. Try switching persona in the header.',
  },
  {
    chapter: 'Readiness report', route: '/deals/harlow/report', target: '[data-tour="report-doc"]', persona: 'principal', placement: 'left',
    title: 'Source-cited readiness report',
    body: 'Complete, outstanding, conflicts and recommended next actions, each traced to document, page and passage. A quality gate clears open flags before the practitioner signs; exports go to PDF and Word.',
  },
  {
    chapter: 'Audit', route: '/deals/harlow/audit', target: '[data-tour="audit-verify"]', persona: 'dealLead',
    title: 'Tamper-evident audit trail',
    body: 'Every action, finding, calculation and decision is logged in a hash chain. Verify the chain, then simulate an edit to see exactly where it breaks.',
  },
  {
    chapter: 'Rule packs', route: '/admin/rules', target: '[data-tour="rule-draft"]', persona: 'admin',
    title: 'A new term sheet without a rebuild',
    body: 'Everstead staff test rule pack 2026.2 against a sample deal and publish it. Deals in flight stay pinned and are offered a re-run with a before/after diff.',
  },
  {
    chapter: 'Acceptance', route: '/acceptance', target: '[data-tour="acceptance-grid"]', persona: 'dealLead',
    title: 'Validated, not demonstrated',
    body: 'Release 1 is accepted on the seven tests in the RFP, run on Everstead\'s real deal packages. Use "Walkthrough scenarios" in the header for the other three RFP cases.',
  },
];

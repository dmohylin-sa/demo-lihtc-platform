// Rule-pack versions, processing jobs, model operations and Release 1 acceptance tests.
// Figures are illustrative demo values, labelled as such in the UI.
import type { Rule } from './types';

export interface RuleChange {
  ruleId: string;
  kind: 'changed' | 'added' | 'status';
  field: string;
  was: string;
  now: string;
  effective: string;
}

// Draft rule-pack version used by walkthrough scenario 3 ("a new HCR term sheet mid-deal").
export const RULE_PACK_2026_2 = {
  version: '2026.2',
  title: 'HCR 9% term sheet revision (November 2026)',
  source: '2026 HCR 9% Term Sheet, revised November 2026 (illustrative)',
  changes: [
    { ruleId: 'HCR-T-08e', kind: 'changed', field: 'Value', was: '35,000 / 37,000 $/unit/yr', now: '36,000 / 38,000 $/unit/yr', effective: '2026-11-15' },
    { ruleId: 'HCR-T-08f', kind: 'changed', field: 'Value', was: '30,500 / 32,500 $/unit/yr', now: '31,500 / 33,500 $/unit/yr', effective: '2026-11-15' },
    { ruleId: 'HCR-T-26', kind: 'added', field: 'New rule', was: '-', now: 'All-electric building systems for new construction (Delayed - effective July 1, 2027)', effective: '2027-07-01' },
  ] as RuleChange[],
};

export const NEW_RULE_T26: Rule = {
  id: 'HCR-T-26', category: 'Threshold', citation: 'Term sheet', appliesTo: '9%',
  rule: 'New construction uses all-electric building systems (space heating, hot water, cooking).',
  paramKey: 'ny.hcr.9pct.all_electric', operator: '=', value: 'true', unit: '', sourceLayer: '2026 HCR 9% Term Sheet (rev. Nov 2026)',
  validation: 'Layer value - from revised term sheet; confirm against PDF', agent: '011', layer: 'Term sheet',
  effectiveDate: '2027-07-01', status: 'Delayed', ruleType: 'Program',
};

export const RULE_PACK_VERSIONS = [
  { version: '2026.1', date: '2026-10-08', rules: 90, source: 'SME pilot workbook v21.1 - QAP 9 NYCRR 2040 (eff. June 11, 2025) + June 2026 term sheet', status: 'Published' },
  { version: '2025.3', date: '2026-06-11', rules: 86, source: 'QAP 9 NYCRR 2040 effective June 11, 2025', status: 'Superseded' },
];

export interface Job {
  id: string;
  kind: 'Upload' | 'Malware scan' | 'OCR' | 'Classification' | 'Extraction' | 'Recalculation' | 'Rule check' | 'Summary';
  target: string;
  deal: string;
  status: 'Succeeded' | 'Running' | 'Queued' | 'Retried' | 'Failed';
  attempts: number;
  duration: string;
  at: string;
}

export const JOBS: Job[] = [
  { id: 'job-48211', kind: 'Recalculation', target: 'Underwriting input set v2', deal: 'Harlow Commons', status: 'Succeeded', attempts: 1, duration: '0.4 s', at: '10:42:18' },
  { id: 'job-48207', kind: 'Rule check', target: 'NY HCR 9% 2026.1 - 34 threshold rules', deal: 'Harlow Commons', status: 'Succeeded', attempts: 1, duration: '1.1 s', at: '10:42:16' },
  { id: 'job-48190', kind: 'Extraction', target: 'Guaranty of Completion - executed.pdf', deal: 'Harlow Commons', status: 'Succeeded', attempts: 1, duration: '38 s', at: '10:41:02' },
  { id: 'job-48177', kind: 'Extraction', target: 'Lender Term Sheet - Hudson Mutual - executed.pdf', deal: 'Harlow Commons', status: 'Succeeded', attempts: 1, duration: '31 s', at: '10:40:40' },
  { id: 'job-48163', kind: 'OCR', target: 'Phase I ESA - Harlow Avenue (scanned).pdf · 46 pages', deal: 'Harlow Commons', status: 'Succeeded', attempts: 1, duration: '2 min 14 s', at: '10:38:55' },
  { id: 'job-48159', kind: 'OCR', target: 'ESA appendix - Sanborn map 004.pdf', deal: 'Harlow Commons', status: 'Retried', attempts: 2, duration: '1 min 02 s', at: '10:38:20' },
  { id: 'job-48142', kind: 'Classification', target: '412 files · 10 Phase 1 document types', deal: 'Harlow Commons', status: 'Succeeded', attempts: 1, duration: '3 min 40 s', at: '10:36:12' },
  { id: 'job-48120', kind: 'Malware scan', target: '412 files · 2.8 GB', deal: 'Harlow Commons', status: 'Succeeded', attempts: 1, duration: '1 min 18 s', at: '10:32:31' },
  { id: 'job-48101', kind: 'Upload', target: 'Harlow Commons package · 2.8 GB · resumed once', deal: 'Harlow Commons', status: 'Succeeded', attempts: 2, duration: '6 min 51 s', at: '10:31:05' },
  { id: 'job-47988', kind: 'OCR', target: 'HAP contract (1998) - scanned.pdf · 31 pages', deal: 'Linden Court Apartments', status: 'Succeeded', attempts: 1, duration: '1 min 36 s', at: '09:12:44' },
  { id: 'job-47970', kind: 'Extraction', target: 'HAP contract (1998) - rent adjustment slot', deal: 'Linden Court Apartments', status: 'Succeeded', attempts: 1, duration: '22 s', at: '09:13:20' },
  { id: 'job-47911', kind: 'Summary', target: 'Practitioner summary - Linden Court', deal: 'Linden Court Apartments', status: 'Succeeded', attempts: 1, duration: '9 s', at: '09:15:02' },
];

export const MODEL_GATEWAY = [
  { role: 'Document extraction', model: 'extraction-llm', version: '2026-09-15', pinned: true, region: 'us-east-1', notes: 'Pinned; upgrade only after a golden-set run' },
  { role: 'Risk and issue detection', model: 'reasoning-llm', version: '2026-08-01', pinned: true, region: 'us-east-1', notes: 'Pinned' },
  { role: 'Plain-language summaries', model: 'summary-llm', version: '2026-08-01', pinned: true, region: 'us-east-1', notes: 'Pinned' },
  { role: 'Deal-scoped retrieval', model: 'embedding-model', version: 'v3.2', pinned: true, region: 'us-east-1', notes: 'Deal-scoped index; never crosses deals' },
  { role: 'OCR and layout', model: 'managed OCR service', version: 'Forms + Tables', pinned: true, region: 'us-east-1', notes: 'Page and passage anchors for citations' },
];

export const PROMPTS = [
  { id: 'extract.title_commitment', version: 'v1.3', updated: '2026-10-12', goldenAccuracy: '98.6%', owner: 'AI Engineering' },
  { id: 'extract.phase1_esa', version: 'v1.2', updated: '2026-10-10', goldenAccuracy: '97.1%', owner: 'AI Engineering' },
  { id: 'extract.lender_term_sheet', version: 'v1.1', updated: '2026-10-09', goldenAccuracy: '99.0%', owner: 'AI Engineering' },
  { id: 'extract.guaranty', version: 'v1.0', updated: '2026-10-07', goldenAccuracy: '97.9%', owner: 'AI Engineering' },
  { id: 'risk.detect_issues', version: 'v0.9', updated: '2026-10-11', goldenAccuracy: '94.4% recall', owner: 'AI Engineering' },
  { id: 'summary.executive', version: 'v1.1', updated: '2026-10-08', goldenAccuracy: 'Reviewed 20/20', owner: 'AI Engineering' },
  { id: 'summary.practitioner', version: 'v1.2', updated: '2026-10-08', goldenAccuracy: 'Reviewed 20/20', owner: 'AI Engineering' },
];

export const GOLDEN_RUNS = [
  { run: 'GS-0412', date: '2026-10-20', docs: 120, fields: 1184, fieldAccuracy: 97.8, citationAccuracy: 99.4, repeatability: '20/20 identical', status: 'Passed' },
  { run: 'GS-0405', date: '2026-10-13', docs: 120, fields: 1184, fieldAccuracy: 96.9, citationAccuracy: 99.1, repeatability: '20/20 identical', status: 'Passed' },
  { run: 'GS-0398', date: '2026-10-06', docs: 96, fields: 902, fieldAccuracy: 95.2, citationAccuracy: 98.7, repeatability: '19/20 identical', status: 'Investigated' },
];

export const COST_PER_DEAL = [
  { item: 'Model inference', monthly: 41 },
  { item: 'OCR and layout', monthly: 12 },
  { item: 'Hosting, queues and database share', monthly: 19 },
  { item: 'Document storage and backups', monthly: 7 },
];

export const TOKEN_USAGE = [
  { deal: 'Harlow Commons', input: 18.4, output: 1.9, cost: 63.2 },
  { deal: 'Linden Court Apartments', input: 11.7, output: 1.1, cost: 39.8 },
  { deal: 'Pier Street Lofts', input: 2.2, output: 0.3, cost: 8.1 },
];

export interface AcceptanceTest {
  id: string;
  name: string;
  measure: string;
  result: string;
  status: 'Passed' | 'In progress' | 'Not started';
  evidence: string;
  route: string;
}

export const ACCEPTANCE_TESTS: AcceptanceTest[] = [
  { id: 'AT-1', name: 'Repeatability', measure: 'Same package, same pinned models and prompts, 20 runs', result: '20 of 20 runs produced identical findings and citations', status: 'Passed', evidence: 'Golden-set run GS-0412', route: '/admin/model-ops' },
  { id: 'AT-2', name: 'Real packages', measure: 'Everstead-supplied deal packages processed end to end', result: '3 packages · 1,146 files · 17,420 pages · 22% scanned', status: 'Passed', evidence: 'Processing job monitor', route: '/admin/jobs' },
  { id: 'AT-3', name: 'Traceability', measure: 'Every finding traced to document, page and passage', result: '100% of findings cited; 0 uncited statements in the readiness report', status: 'Passed', evidence: 'Source map', route: '/deals/harlow/evidence' },
  { id: 'AT-4', name: 'Calculations within tolerance', measure: 'Known-answer tests against the reference underwriting model', result: '38 of 38 known-answer tests within tolerance', status: 'Passed', evidence: 'Tolerance report', route: '/deals/harlow/underwriting' },
  { id: 'AT-5', name: 'Change handling', measure: 'Superseded documents invalidate and recompute dependent findings', result: '12 of 12 change scenarios, including revised model and new term sheet', status: 'Passed', evidence: 'Walkthrough scenarios', route: '/deals/harlow/findings' },
  { id: 'AT-6', name: 'Access control', measure: 'Role, document and field-level permissions; cross-deal and cross-tenant leakage', result: '64 permission tests passed; 0 cross-deal or cross-tenant results', status: 'Passed', evidence: 'Permission matrix', route: '/admin/tenants' },
  { id: 'AT-7', name: 'Practitioner sign-off', measure: 'Readiness report signed off without material rewrite', result: 'Awaiting practitioner sign-off on Harlow Commons', status: 'In progress', evidence: 'Readiness report', route: '/deals/harlow/report' },
];

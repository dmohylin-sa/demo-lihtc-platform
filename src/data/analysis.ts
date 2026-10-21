// Extracted fields, findings and node status for the sample deals. Findings cite the NY HCR 9% rule pack
// (rule, section and program year) and the deal documents (document, page and passage).
import type { ExtractField, Finding, NodeState, NodeStatus } from './types';
import { TREE_PHASE1 } from './tree-phase1';

// The agreed Release 1 extraction list: 10 Phase 1 document types.
export const EXTRACTION_DOC_TYPES = [
  'Site-control agreement (PSA)',
  'Title commitment',
  'ALTA / NSPS survey',
  'Phase I ESA',
  'Appraisal (MAI)',
  'Market study',
  'Zoning report',
  'Lender term sheet',
  'Guaranty',
  'Construction cost estimate',
];

const f = (
  id: string, docType: string, docId: string, field: string, value: string, confidence: number,
  page: number, passageId: string, status: ExtractField['status'] = 'accepted', nodeId?: string, extra: Partial<ExtractField> = {},
): ExtractField => ({ id, dealId: 'harlow', docType, docId, field, value, confidence, citation: { docId, page, passageId }, status, nodeId, ...extra });

export const SEED_FIELDS: ExtractField[] = [
  f('x-psa-1', 'Site-control agreement (PSA)', 'd-psa', 'Purchaser', 'Harlow Commons Housing LLC', 0.99, 1, 'psa-parties', 'accepted', 'X0087'),
  f('x-psa-2', 'Site-control agreement (PSA)', 'd-psa', 'Purchase price', '$4,000,000', 0.99, 4, 'psa-price', 'accepted', 'X0094'),
  f('x-psa-3', 'Site-control agreement (PSA)', 'd-psa', 'Deposit', '$200,000', 0.99, 4, 'psa-deposit', 'accepted', 'X0095'),
  f('x-psa-4', 'Site-control agreement (PSA)', 'd-psa', 'Due diligence period', '60 days from July 28, 2026', 0.98, 7, 'psa-dd', 'accepted', 'X0096'),
  f('x-psa-5', 'Site-control agreement (PSA)', 'd-psa', 'Outside closing date', 'December 15, 2026', 0.99, 12, 'psa-closing', 'accepted', 'X0087'),
  f('x-psa-6', 'Site-control agreement (PSA)', 'd-psa', 'Assignment to SPE', 'Permitted without seller consent', 0.96, 12, 'psa-assign', 'accepted', 'X0087'),
  f('x-ttl-1', 'Title commitment', 'd-title', 'Vested owner', 'Harlow Avenue Realty LLC (CRFN 2009000214577)', 0.98, 2, 'title-vesting', 'accepted', 'X0104'),
  f('x-ttl-2', 'Title commitment', 'd-title', 'Legal description', 'Block 2871, Lot 14, Bronx', 0.99, 2, 'title-legal', 'accepted', 'X0104'),
  f('x-ttl-3', 'Title commitment', 'd-title', 'Open requirement B-I #7', 'Unsatisfied 1998 mortgage, $650,000 - no satisfaction of record', 0.95, 4, 'title-bi7', 'review', 'X0105'),
  f('x-ttl-4', 'Title commitment', 'd-title', 'Exception B-II #2', 'Declaration of Restrictions (1987) - curb cuts, street trees', 0.93, 6, 'title-bii', 'accepted', 'X0106'),
  f('x-svy-1', 'ALTA / NSPS survey', 'd-survey', 'Lot area', '21,450 sq ft', 0.98, 1, 'survey-area', 'accepted', 'X0108'),
  f('x-svy-2', 'ALTA / NSPS survey', 'd-survey', 'Flood zone', 'Zone X (minimal hazard)', 0.97, 1, 'survey-flood', 'accepted', 'X0117'),
  f('x-svy-3', 'ALTA / NSPS survey', 'd-survey', 'Certified to', 'Purchaser, title insurer, Hudson Mutual Bank', 0.95, 1, 'survey-cert', 'accepted', 'X0110'),
  f('x-esa-1', 'Phase I ESA', 'd-esa', 'Report date', 'April 14, 2026', 0.94, 1, 'esa-date', 'accepted', 'X0123'),
  f('x-esa-2', 'Phase I ESA', 'd-esa', 'Standard', 'ASTM E1527-21', 0.96, 1, 'esa-astm', 'accepted', 'X0123'),
  f('x-esa-3', 'Phase I ESA', 'd-esa', 'Recognized environmental conditions', '1 REC - adjoining former gasoline station, two USTs (1962-1994)', 0.91, 14, 'esa-rec', 'review', 'X0124'),
  f('x-esa-4', 'Phase I ESA', 'd-esa', 'Consultant recommendation', 'Limited Phase II (soil vapor, groundwater)', 0.93, 15, 'esa-recommend', 'accepted', 'X0125'),
  f('x-apr-1', 'Appraisal (MAI)', 'd-appraisal', 'As-is market value (land)', '$4,150,000 as of Aug 20, 2026', 0.98, 3, 'appr-asis', 'accepted', 'X0167'),
  f('x-apr-2', 'Appraisal (MAI)', 'd-appraisal', 'Lease-up absorption', '7 units / month', 0.92, 64, 'appr-absorb', 'conflict', 'X0167', {
    conflict: {
      value: '10 units / month',
      citation: { docId: 'd-market', page: 41, passageId: 'mkt-absorb' },
      source: 'Market study p.41',
      precedence: 'No documented precedence rule between two third-party reports - routed to the practitioner. The platform does not pick one.',
    },
  }),
  f('x-mkt-1', 'Market study', 'd-market', 'Capture rate', '2.1%', 0.97, 41, 'mkt-absorb', 'accepted', 'X0166'),
  f('x-mkt-2', 'Market study', 'd-market', 'Public-housing waiting lists considered', 'Yes - NYCHA lists, ~41,900 Bronx households', 0.95, 36, 'mkt-waitlist', 'accepted', 'X0166'),
  f('x-zon-1', 'Zoning report', 'd-zoning', 'Zoning district', 'R7A with MIH designated area', 0.98, 2, 'zon-district', 'accepted', 'X0064'),
  f('x-zon-2', 'Zoning report', 'd-zoning', 'Permitted residential FAR', '4.60 (with MIH)', 0.97, 2, 'zon-far', 'accepted', 'X0064'),
  f('x-zon-3', 'Zoning report', 'd-zoning', 'Maximum dwelling units', '145 (proposed 84 complies as of right)', 0.96, 2, 'zon-units', 'accepted', 'X0121'),
  f('x-lts-1', 'Lender term sheet', 'd-lender-ts', 'Permanent loan amount', '$7,600,000', 0.99, 2, 'lts-loan', 'accepted', 'X0182'),
  f('x-lts-2', 'Lender term sheet', 'd-lender-ts', 'Rate and amortization', '6.40% fixed, 35-year amortization', 0.99, 2, 'lts-loan', 'accepted', 'X0182'),
  f('x-lts-3', 'Lender term sheet', 'd-lender-ts', 'Minimum DSCR', '1.20x', 0.99, 2, 'lts-dscr', 'accepted', 'X0173'),
  f('x-lts-4', 'Lender term sheet', 'd-lender-ts', 'Phase I ESA currency', '≤ 6 months before closing', 0.98, 5, 'lts-esa', 'accepted', 'X0222'),
  f('x-lts-5', 'Lender term sheet', 'd-lender-ts', 'Required guaranties', 'Lien-free completion; environmental indemnity', 0.97, 6, 'lts-guaranty', 'accepted', 'X0212'),
  f('x-gty-1', 'Guaranty', 'd-guaranty', 'Completion guarantee', 'Yes - lien-free completion, Northbank Housing Partners LLC', 0.98, 1, 'guar-scope', 'accepted', 'X0212'),
  f('x-gty-2', 'Guaranty', 'd-guaranty', 'Operating deficit guarantee (amount, term)', '-', 0, 4, 'guar-limit', 'silent', 'X0175', {
    value: 'Not stated in the executed document',
    note: 'The executed guaranty is limited to completion (Section 3, p.4) and says nothing on operating deficits. The slot is flagged, never defaulted: HCR-C-03 needs it for a developer fee above 10%, and HCR-C-05 sets it at ≥ 0.20 × developer fee for 36 months.',
  }),
  f('x-cst-1', 'Construction cost estimate', 'd-cost', 'GC contract sum', '$30,400,000', 0.99, 3, 'cost-fees', 'accepted', 'X0170'),
  f('x-cst-2', 'Construction cost estimate', 'd-cost', "Builder's profit / overhead / general conditions", '6.0% / 2.0% / 6.4%', 0.98, 3, 'cost-fees', 'accepted', 'X0170'),
];

const c = (docId: string, page: number, passageId: string) => ({ docId, page, passageId });

export const SEED_FINDINGS: Finding[] = [
  {
    id: 'F-01', dealId: 'harlow', title: 'Sources and uses out of balance', severity: 'blocking', category: 'Calculation',
    detail: 'Sources total $47,949,425 against uses of $48,200,000 - short by $250,575. Under HCR-C-08 the gap method supports a credit of $2,776,971 a year, within the $2.8M NYC-metro cap and $35,000 per unit, so the shortfall can be closed by resizing the request.',
    ruleIds: ['HCR-C-08', 'HCR-T-08a', 'HCR-T-08e'], citation: '9 NYCRR 2040.3(g)(4); 2040.3(e)(8) + 2026 HCR 9% Term Sheet · program year 2026',
    basis: ['deal', 'rule'], method: 'calculation', sources: [{ docId: 'd-form-a1', cell: 'Sources!C16' }, { docId: 'd-form-a1', cell: 'Uses!C26' }],
    action: 'Raise the annual credit request to $2,776,971 or add a source of $250,575.', owner: 'Underwriting Analyst', status: 'open', nodeId: 'X0171', calcKey: 'balance',
  },
  {
    id: 'F-02', dealId: 'harlow', title: 'Developer fee above the 10% base with no operating deficit guarantee', severity: 'blocking', category: 'Threshold',
    detail: 'Developer fee of $4,900,000 is 11.53% of acquisition + improvement cost; the base cap is $4,250,000 (10%). The 15% ceiling applies only with both a completion guarantee and an operating deficit guarantee. The completion guarantee is in place; the executed guaranty is silent on operating deficits.',
    ruleIds: ['HCR-C-02', 'HCR-C-03', 'HCR-C-05'], citation: '9 NYCRR 2040.3(g)(2)(ii); 2040.2(r) · program year 2026',
    basis: ['deal', 'rule'], method: 'rule-based', sources: [c('d-guaranty', 4, 'guar-limit'), { docId: 'd-form-a1', cell: 'Uses!C21' }],
    action: 'Obtain an operating deficit guarantee of at least $980,000 for 36 months, or reduce the fee to $4,250,000.', owner: 'Deal Lead (PM)', status: 'open', nodeId: 'X0175', calcKey: 'devFee',
  },
  {
    id: 'F-03', dealId: 'harlow', title: 'DSCR 1.17x below the lender minimum of 1.20x', severity: 'blocking', category: 'Calculation',
    detail: 'Year-1 NOI of $637,344 over debt service of $544,738 gives 1.17x. The executed lender term sheet requires 1.20x on underwritten NOI. The rule pack carries no 9% DSCR threshold; the covenant comes from the deal\'s own executed document.',
    ruleIds: [], citation: 'Hudson Mutual term sheet §4.2 (executed project document)',
    basis: ['deal'], method: 'calculation', sources: [c('d-lender-ts', 2, 'lts-dscr'), { docId: 'd-proforma-v2', cell: 'Operating Budget!C24' }],
    action: 'Revise the operating budget or resize the permanent loan to about $7.43M.', owner: 'Underwriting Analyst', status: 'open', nodeId: 'X0173', calcKey: 'dscr',
  },
  {
    id: 'F-04', dealId: 'harlow', title: 'Phase I ESA meets the HCR window but not the lender window', severity: 'advisory', category: 'Threshold',
    detail: 'The Phase I is dated April 14, 2026. HCR requires ≤ 12 months before the application deadline (HCR-T-09a) - met. The lender requires ≤ 6 months before closing; at the December 15 outside closing date it will be 8 months old.',
    ruleIds: ['HCR-T-09a'], citation: '9 NYCRR 2040.3(e)(9) · program year 2026; lender term sheet §9(c)',
    basis: ['deal', 'rule'], method: 'rule-based', sources: [c('d-esa', 1, 'esa-date'), c('d-lender-ts', 5, 'lts-esa'), c('d-psa', 12, 'psa-closing')],
    action: 'Order a Phase I update dated after June 15, 2026 before closing; G1 condition X0222.', owner: 'Deal Lead (PM)', status: 'open', nodeId: 'X0222',
  },
  {
    id: 'F-05', dealId: 'harlow', title: 'Recognized environmental condition on the adjoining parcel', severity: 'advisory', category: 'Risk',
    detail: 'The Phase I identifies a former gasoline station up-gradient with two USTs and no closure documentation, and recommends a limited Phase II. Decision D1-04 (RECs found → Phase II?) is required before the deposit goes hard.',
    ruleIds: [], citation: 'ASTM E1527-21; decision register D1-04',
    basis: ['deal'], method: 'model-assisted', sources: [c('d-esa', 14, 'esa-rec'), c('d-esa', 15, 'esa-recommend')],
    action: 'Deal Lead records D1-04.', owner: 'Deal Lead (PM)', status: 'open', nodeId: 'X0124',
  },
  {
    id: 'F-06', dealId: 'harlow', title: "Builder's fees exceed the 14% combined cap", severity: 'advisory', category: 'Threshold',
    detail: "Builder's profit 6.0% and overhead 2.0% are within limits, but general conditions of 6.4% exceed the 6% limit and the combined 14.4% exceeds 14% of the construction contract ($121,600 over).",
    ruleIds: ['HCR-C-01'], citation: '9 NYCRR 2040.3(g)(2)(i) · program year 2026',
    basis: ['deal', 'rule'], method: 'rule-based', sources: [c('d-cost', 3, 'cost-fees')],
    action: 'Ask the GC to restate general conditions at 6.0% or move the excess to direct trade costs with backup.', owner: 'Underwriting Analyst', status: 'open', nodeId: 'X0170',
  },
  {
    id: 'F-07', dealId: 'harlow', title: 'Pro forma models a 30-year regulatory term; the 2026 term sheet requires 50', severity: 'advisory', category: 'Threshold',
    detail: 'The QAP floor is 30 years; the June 2026 HCR 9% term sheet raises it to 50. Rule layering applies: the agency regulation sets the floor and the term sheet can raise it.',
    ruleIds: ['HCR-T-16'], citation: '9 NYCRR 2040.3(e)(16) + 2026 HCR 9% Term Sheet · program year 2026',
    basis: ['deal', 'rule'], method: 'rule-based', sources: [{ docId: 'd-proforma-v2', cell: 'Assumptions!C31' }],
    action: 'Model a 50-year regulatory term in the operating projection.', owner: 'Underwriting Analyst', status: 'open', nodeId: 'X0174',
  },
  {
    id: 'F-08', dealId: 'harlow', title: 'Lease-up absorption differs between appraisal and market study', severity: 'advisory', category: 'Conflict',
    detail: 'The appraisal projects 7 units per month; the market study projects 10. Both values and sources are shown; there is no documented precedence rule, so the platform does not choose.',
    ruleIds: [], citation: 'Cross-document conflict (requirement 01 source ranking: both executed third-party reports)',
    basis: ['deal'], method: 'model-assisted', sources: [c('d-appraisal', 64, 'appr-absorb'), c('d-market', 41, 'mkt-absorb')],
    action: 'Choose the lease-up assumption and record the basis.', owner: 'Underwriting Analyst', status: 'open', nodeId: 'X0174',
  },
  {
    id: 'F-09', dealId: 'harlow', title: 'Unsatisfied 1998 mortgage on title (Schedule B-I #7)', severity: 'advisory', category: 'Risk',
    detail: 'A $650,000 mortgage recorded in 1998 has no satisfaction of record. It must be satisfied or insured over before marketable title can be confirmed (G1 condition X0221).',
    ruleIds: [], citation: 'Title commitment NY-26-48817, Schedule B-I',
    basis: ['deal'], method: 'model-assisted', sources: [c('d-title', 4, 'title-bi7')],
    action: 'Request a satisfaction or payoff letter from the seller.', owner: 'Closing Coordinator', status: 'open', nodeId: 'X0105',
  },
  {
    id: 'F-10', dealId: 'harlow', title: 'Credit request within the NYC-metro caps', severity: 'informational', category: 'Threshold',
    detail: 'Annual request of $2,750,000 is within the $2,800,000 per-project cap and, at $32,738 per unit, within the $35,000 per-unit cap.',
    ruleIds: ['HCR-T-08a', 'HCR-T-08e'], citation: '9 NYCRR 2040.3(e)(8) + 2026 HCR 9% Term Sheet · program year 2026',
    basis: ['deal', 'rule'], method: 'rule-based', sources: [{ docId: 'd-form-a1', cell: 'Sources!C8' }],
    action: 'None.', owner: 'Underwriting Analyst', status: 'passed', nodeId: 'X0083',
  },
  {
    id: 'F-11', dealId: 'harlow', title: 'Site control through an executed purchase contract', severity: 'informational', category: 'Threshold',
    detail: 'An executed PSA dated July 28, 2026 is one of the instruments HCR accepts (lease, option, purchase contract or deed).',
    ruleIds: ['HCR-T-02'], citation: '9 NYCRR 2040.3(e)(2) · program year 2026',
    basis: ['deal', 'rule'], method: 'rule-based', sources: [c('d-psa', 1, 'psa-parties')],
    action: 'None.', owner: 'Deal Lead (PM)', status: 'passed', nodeId: 'X0086',
  },
  {
    id: 'F-12', dealId: 'harlow', title: 'Market study considered public-housing waiting lists', severity: 'informational', category: 'Threshold',
    detail: 'HCR requires the market study to show that public-housing waiting lists were considered and that the units can be absorbed. The study reviews the NYCHA lists (p.36).',
    ruleIds: ['HCR-T-09b'], citation: '9 NYCRR 2040.3(e)(9) · program year 2026',
    basis: ['deal', 'rule'], method: 'rule-based', sources: [c('d-market', 36, 'mkt-waitlist')],
    action: 'None.', owner: 'Deal Lead (PM)', status: 'passed', nodeId: 'X0166',
  },
  {
    id: 'F-13', dealId: 'harlow', title: 'Income averaging set-aside satisfied', severity: 'informational', category: 'Threshold',
    detail: '83 restricted units average 58.3% AMI in 10% bands with no unit above 80% AMI - meets the income-averaging set-aside.',
    ruleIds: ['HCR-D-09'], citation: '2026 HCR 9% Term Sheet (set-aside) · program year 2026',
    basis: ['deal', 'rule'], method: 'rule-based', sources: [{ docId: 'd-form-a1', cell: 'Unit Mix!D10' }],
    action: 'None.', owner: 'Underwriting Analyst', status: 'passed', nodeId: 'X0072',
  },
];

// ---------------------------------------------------------------------------------------------
// Node status per deal. Containers roll up from their children; leaves are seeded here.
// ---------------------------------------------------------------------------------------------
const childrenOf = (id: string) => TREE_PHASE1.filter((n) => n.parent === id).map((n) => n.id);
const subtree = (id: string): string[] => [id, ...childrenOf(id).flatMap(subtree)];

const BRANCHES: Record<string, string[]> = {
  new: ['X0026', 'X0039', 'X0044', 'X0137'],
  rehab: ['X0015', 'X0039', 'X0044'],
  reuse: ['X0015', 'X0026', 'X0044', 'X0137'],
  preservation: ['X0015', 'X0026', 'X0039'],
};

type Seed = Record<string, NodeState>;
const S = (status: NodeStatus, extra: Partial<NodeState> = {}): NodeState => ({ status, source: 'system', at: '2026-10-21', ...extra });

function seedHarlow(): Seed {
  const s: Seed = {};
  const done = (ids: string[]) => ids.forEach((id) => subtree(id).forEach((x) => (s[x] = S('done'))));
  done(['X0002', 'X0062', 'X0085', 'X0165', 'X0015', 'X0048']);
  // Due diligence
  done(['X0102', 'X0132', 'X0159']);
  s.X0105 = S('in_progress', { findingIds: ['F-09'], cause: 'Schedule B-I #7: unsatisfied 1998 mortgage' });
  s.X0111 = S('in_progress'); s.X0112 = S('in_progress'); s.X0113 = S('in_progress'); s.X0114 = S('not_started');
  s.X0133 = S('na'); s.X0134 = S('na');
  s.X0161 = S('awaiting_decision', { cause: 'Decision D1-08 (applicable exemption) is with the Underwriting Analyst' });
  s.X0162 = S('not_started'); s.X0163 = S('not_started');
  done(['X0122']);
  s.X0124 = S('awaiting_decision', { cause: 'Decision D1-04 (RECs found → Phase II?) is with the Deal Lead', findingIds: ['F-05'] });
  s.X0125 = S('blocked', { cause: 'Waiting on decision D1-04' });
  s.X0126 = S('not_started'); s.X0128 = S('not_started', { cause: 'Not reached - follows Phase II results' }); s.X0129 = S('not_started'); s.X0131 = S('not_started');
  // Refined feasibility & underwriting
  s.X0170 = S('in_progress', { findingIds: ['F-06'] });
  s.X0171 = S('blocked', { cause: 'Sources short of uses by $250,575 (F-01)', findingIds: ['F-01'] });
  s.X0172 = S('done');
  s.X0173 = S('blocked', { cause: 'DSCR 1.17x below lender minimum 1.20x (F-03)', findingIds: ['F-03'] });
  s.X0174 = S('in_progress', { findingIds: ['F-07', 'F-08'] });
  s.X0175 = S('blocked', { cause: 'Fee above 10% needs an operating deficit guarantee - executed guaranty is silent (F-02)', findingIds: ['F-02'] });
  // IC
  ['X0177', 'X0178', 'X0179', 'X0180'].forEach((id) => (s[id] = S('not_started')));
  s.X0177 = S('blocked', { cause: 'Refined underwriting has 3 blocking findings' });
  // Financing
  s.X0182 = S('done'); s.X0183 = S('in_progress'); s.X0184 = S('in_progress'); s.X0185 = S('not_started');
  // Entity formation
  s.X0187 = S('done'); s.X0188 = S('done'); s.X0189 = S('done'); s.X0190 = S('in_progress'); s.X0191 = S('done'); s.X0192 = S('not_started');
  // Closing prep and gate
  subtree('X0193').forEach((x) => (s[x] = S('not_started')));
  s.X0201 = S('in_progress');
  subtree('X0220').forEach((x) => (s[x] = S('not_started')));
  return s;
}

function seedLinden(): Seed {
  const s: Seed = {};
  const done = (ids: string[]) => ids.forEach((id) => subtree(id).forEach((x) => (s[x] = S('done'))));
  done(['X0002', 'X0062', 'X0085', 'X0048']);
  subtree('X0026').forEach((x) => (s[x] = S('in_progress')));
  s.X0027 = S('awaiting_decision', { cause: 'Decision D1-02 (substantial-gut vs moderate) is with the Deal Lead' });
  s.X0028 = S('awaiting_decision', { cause: 'Decision D1-03 (occupied vs vacant) is with the Principal' });
  subtree('X0101').forEach((x) => (s[x] = S('in_progress')));
  s.X0139 = S('in_progress', { cause: 'Executed HAP contract received; extraction pending' });
  s.X0145 = S('awaiting_decision', { cause: 'Decision D1-06 is with the Architect' });
  return s;
}

function seedPier(): Seed {
  const s: Seed = {};
  subtree('X0002').forEach((x) => (s[x] = S('done')));
  subtree('X0062').forEach((x) => (s[x] = S('in_progress')));
  return s;
}

export function buildNodeStatus(dealId: string, projectType: keyof typeof BRANCHES): Record<string, NodeState> {
  const seed = dealId === 'harlow' ? seedHarlow() : dealId === 'linden' ? seedLinden() : dealId === 'pier' ? seedPier() : {};
  const na = new Set(BRANCHES[projectType].flatMap(subtree));
  const out: Record<string, NodeState> = {};
  for (const n of TREE_PHASE1) {
    if (na.has(n.id)) out[n.id] = S('na', { cause: 'Not on this deal\'s project-type path' });
    else out[n.id] = seed[n.id] ?? S('not_started');
  }
  // Roll containers up from their applicable children.
  const roll = (id: string): NodeStatus => {
    const kids = childrenOf(id);
    if (!kids.length) return out[id].status;
    const st = kids.map(roll).filter((x) => x !== 'na');
    let r: NodeStatus;
    if (!st.length) r = 'na';
    else if (st.every((x) => x === 'done')) r = 'done';
    else if (st.some((x) => x === 'blocked')) r = 'blocked';
    else if (st.some((x) => x === 'awaiting_decision')) r = 'awaiting_decision';
    else if (st.some((x) => x === 'in_progress' || x === 'done')) r = 'in_progress';
    else r = 'not_started';
    if (!na.has(id) && (seed[id] === undefined || TREE_PHASE1.find((n) => n.id === id)!.stepClass === 'Container')) {
      out[id] = { ...out[id], status: r, cause: r === 'blocked' ? 'One or more steps below are blocked' : out[id].cause };
    }
    return out[id].status;
  };
  roll('X0001');
  return out;
}

export const WORKSTREAMS = TREE_PHASE1.filter((n) => n.level === 1);

// Everstead's specification assets, transcribed from the bidder review pack:
// agent index v4.5 (pp.415-418), decision register (pp.92-93), gate definitions (p.87),
// gate checklists v3.5 (pp.423-439), governing-document register (pp.453-475), tree change log (pp.81-84, 148-248).
import type { DecisionDef, GateCondition } from './types';

export interface Agent {
  id: string;
  name: string;
  status: 'Spec Complete' | 'In Progress' | 'Active' | 'Proposed';
  module: string;
  panel: string;
  r1: boolean; // carries Phase 1 / Release 1 nodes or rules
  purpose: string;
}

export const AGENTS: Agent[] = [
  { id: '001', name: 'Workflow Orchestration', status: 'Spec Complete', module: 'Core', panel: 'All', r1: true, purpose: 'Sequencing and routing controller across agents.' },
  { id: '002', name: 'Document Intake & Classification', status: 'In Progress', module: 'Core', panel: 'Repository', r1: true, purpose: 'All uploaded documents pass through before reaching downstream agents.' },
  { id: '003', name: 'Appraisal & Valuation Review', status: 'Spec Complete', module: 'Core', panel: 'Proforma', r1: true, purpose: 'Appraisal review: as-is, as-complete and as-stabilized values.' },
  { id: '004', name: 'Capital Needs / IPNA', status: 'Spec Complete', module: 'Core', panel: 'Proforma', r1: true, purpose: '20-year replacement reserve analysis.' },
  { id: '005', name: 'Feasibility Analysis', status: 'Spec Complete', module: 'Core', panel: 'Phase Workspace', r1: true, purpose: 'Pre-development viability; site and program feasibility.' },
  { id: '006', name: 'Rent Roll & Occupancy', status: 'Spec Complete', module: 'Core', panel: 'AM Workspace', r1: false, purpose: 'Rent roll and occupancy analysis.' },
  { id: '007', name: 'HFA Application Support', status: 'Spec Complete', module: 'Core', panel: 'Phase Workspace', r1: true, purpose: 'HCR / HFA application completeness and submission support.' },
  { id: '008', name: '4% Bond Underwriting', status: 'Spec Complete', module: 'Core', panel: 'Proforma', r1: false, purpose: '4% bond model audit and review.' },
  { id: '009', name: '9% LIHTC Underwriting', status: 'Spec Complete', module: 'Core', panel: 'Proforma', r1: true, purpose: '9% LIHTC financial model audit and review.' },
  { id: '010', name: 'Risk & Issue Detection', status: 'Spec Complete', module: 'Core', panel: 'Risks', r1: true, purpose: 'Detects risks and issues; feeds the risk register.' },
  { id: '011', name: 'Design Plan Review', status: 'Spec Complete', module: 'Core', panel: 'Phase Workspace', r1: true, purpose: 'Design review against HCR Design Guidelines 2025 §5.' },
  { id: '012', name: 'Post-Closing Compliance', status: 'Spec Complete', module: 'Core', panel: 'Compliance', r1: false, purpose: 'Regulatory agreement and compliance monitoring.' },
  { id: '013', name: 'Portfolio Oversight', status: 'Spec Complete', module: 'Core', panel: 'Portfolio Dashboard', r1: false, purpose: 'Portfolio-level oversight.' },
  { id: '014', name: 'Learning & Continuous Update', status: 'Active', module: 'Core', panel: 'Platform Intelligence', r1: true, purpose: 'Monitors HUD/HCR/DHCR publications; updates regulatory thresholds.' },
  { id: '015', name: 'AI Summarization & Explanation', status: 'Spec Complete', module: 'Core', panel: 'User Experience', r1: true, purpose: 'Plain-language summaries in Executive, Practitioner and Analyst modes.' },
  { id: '016', name: 'Construction Draw', status: 'Spec Complete', module: 'Closing Module', panel: 'Closing', r1: false, purpose: 'Construction draw review.' },
  { id: '017', name: 'Legal Document Review', status: 'Spec Complete', module: 'Closing Module', panel: 'Repository', r1: true, purpose: 'Review of agreements, guaranties and closing documents.' },
  { id: '018', name: 'Title & Survey Review', status: 'Spec Complete', module: 'Closing Module', panel: 'Repository', r1: true, purpose: 'Title commitment schedules, survey and endorsements.' },
  { id: '019', name: 'Closing Timeline & Deadline', status: 'Spec Complete', module: 'Closing Module', panel: 'Tasks', r1: true, purpose: 'Closing timeline, deadlines and date-currency tests.' },
  { id: '020', name: 'Tenancy & Permissions', status: 'Spec Complete', module: 'Closing Module', panel: 'AM Workspace', r1: true, purpose: 'Existing tenancies, HAP contracts and access tiers.' },
  { id: '021', name: 'Term Sheet Analysis', status: 'Spec Complete', module: 'Expansion', panel: 'Proforma', r1: true, purpose: 'Term sheet review; LOI and commitment letter analysis.' },
  { id: '022', name: 'Site Control & Acquisition', status: 'Spec Complete', module: 'Expansion', panel: 'Phase Workspace', r1: true, purpose: 'Site-control instruments, deal terms and acquisition diligence.' },
  { id: '023', name: 'Year 15 / Preservation Structuring', status: 'Spec Complete', module: 'Expansion', panel: 'Phase Workspace', r1: false, purpose: 'Year 15 exit and preservation structuring.' },
  { id: '024', name: 'Lease-Up & Tenant File Compliance', status: 'Spec Complete', module: 'Closing Module', panel: 'Compliance', r1: false, purpose: 'Lease-up and tenant file compliance.' },
  { id: '025', name: 'Transition Briefing', status: 'Spec Complete', module: 'Core', panel: 'User Experience', r1: false, purpose: 'Handoff synthesis at 5 trigger points.' },
  { id: '026', name: 'Spec Documentation Meta-Agent', status: 'Spec Complete', module: 'Core', panel: 'Internal', r1: false, purpose: 'Keeps agent specifications current.' },
  { id: '027', name: 'AM Collections & Arrears', status: 'Spec Complete', module: 'HELM AM Module', panel: 'AM Workspace', r1: false, purpose: 'Collections and arrears.' },
  { id: '028', name: 'Violations Monitoring', status: 'Spec Complete', module: 'HELM AM Module', panel: 'AM Workspace', r1: false, purpose: 'Building violations monitoring.' },
  { id: '029', name: 'PM Software Integration', status: 'Spec Complete', module: 'HELM AM Module', panel: 'AM Workspace', r1: false, purpose: 'Yardi / MRI / RealPage / AppFolio integration.' },
  { id: '030', name: 'NYC/NYS Regulatory Compliance Calendar', status: 'Spec Complete', module: 'HELM AM Module', panel: 'AM Workspace', r1: false, purpose: 'Regulatory filing calendar.' },
  { id: '031', name: 'Green Certification', status: 'Spec Complete', module: 'Core-Expansion', panel: 'Phase Workspace', r1: false, purpose: 'EGC / LEED / Passive House / ENERGY STAR certification tracking.' },
  { id: '032', name: 'Audit Readiness', status: 'Proposed', module: 'TBD', panel: 'TBD', r1: false, purpose: 'Audit readiness.' },
  { id: '033', name: 'Construction Inspections & Sign-off', status: 'Proposed', module: 'Closing Module', panel: 'Closing', r1: false, purpose: 'Construction inspections.' },
  { id: '034', name: 'Closing Checklist & Conditions', status: 'Proposed', module: 'Closing Module', panel: 'Closing', r1: true, purpose: 'Owns the G1 gate nodes: closing checklist and conditions precedent.' },
  { id: '035', name: 'Pre-Closing Regulatory Compliance', status: 'Spec Complete', module: 'Core', panel: 'Compliance', r1: true, purpose: 'Section 42, rent/income limits, utility allowances, LURA, HCR rules.' },
  { id: '036', name: 'Data Integrity & Version Control', status: 'Spec Complete', module: 'Core', panel: 'Repository', r1: true, purpose: 'Superseded-version detection, cross-document figure conflicts, audit trail.' },
];

export const agentName = (id: string) => AGENTS.find((a) => a.id === id)?.name ?? `Agent ${id}`;

// Decision register, Phase 1 (pp.92-93). Platform role for all eight: "Human-only. Platform assembles the evidence,
// runs the tests, drafts a recommendation and logs the decision; the accountable person decides."
export const DECISIONS: DecisionDef[] = [
  {
    id: 'D1-01', nodeId: 'X0014', title: 'New construction vs rehabilitation vs adaptive reuse',
    owner: 'Principal', ownerPersona: 'principal', advisors: 'Acquisitions; Architect; Finance',
    criteria: 'Existing structure condition and legal use; zoning capacity vs as-built FAR; cost per unit new vs rehab; occupancy; program fit (9% / 4% / preservation term sheets)',
    options: [
      { label: 'New construction', next: 'Full design / entitlement path' },
      { label: 'Rehabilitation', next: 'Existing-conditions, IPNA and relocation branches' },
      { label: 'Adaptive reuse', next: 'Change-of-use, CO and 467-m / conversion branches' },
    ],
    evidence: 'Zoning analysis; IPNA or PCA; site survey; napkin pro-forma for each path',
    authority: 'HPD / HCR term sheets; ZR; NYC BC', reviewStatus: 'Approved (Oct 4 review)',
    appliesTo: ['new', 'rehab', 'reuse', 'preservation'],
  },
  {
    id: 'D1-02', nodeId: 'X0027', title: 'Substantial-gut vs moderate rehab',
    owner: 'Deal Lead (PM)', ownerPersona: 'dealLead', advisors: 'Architect; Engineer; HPD BLDS',
    criteria: 'Scope of work vs HPD thresholds (systems replaced, layouts changed, % of building affected); occupancy during work; cost per unit',
    options: [
      { label: 'Substantial / gut', next: 'New-construction-style design review and vacancy' },
      { label: 'Moderate', next: 'BLDS moderate-rehab track, occupied possible' },
    ],
    evidence: 'IPNA; scope narrative; hard-cost estimate per unit', authority: 'HPD BLDS Design Guidelines; HPD term sheet',
    reviewStatus: 'Approved', appliesTo: ['rehab'],
  },
  {
    id: 'D1-03', nodeId: 'X0028', title: 'Occupied vs vacant during construction',
    owner: 'Principal', ownerPersona: 'principal', advisors: 'Construction; Relocation consultant; Counsel',
    criteria: 'Scope intrusiveness; tenant safety (lead, asbestos, essential services); relocation cost and URA exposure; schedule impact',
    options: [
      { label: 'Occupied', next: 'Tenant Protection Plan, phasing, temporary relocation' },
      { label: 'Vacant', next: 'Relocation plan + permanent / temporary displacement analysis' },
    ],
    evidence: 'Tenant census; scope phasing plan; relocation budget', authority: 'NYC BC §28-120 (TPP); URA 49 CFR 24',
    reviewStatus: 'Approved', appliesTo: ['rehab'],
  },
  {
    id: 'D1-04', nodeId: 'X0124', title: 'RECs found → Phase II?',
    owner: 'Deal Lead (PM)', ownerPersona: 'dealLead', advisors: 'Environmental consultant (recommends)',
    criteria: 'Phase I identifies RECs / CRECs; lender and agency requirements; vapor-encroachment screen',
    options: [
      { label: 'Yes - commission Phase II', next: 'Commission Phase II before the deposit goes hard' },
      { label: 'No - proceed', next: 'Proceed; document HRECs / de minimis conditions' },
    ],
    evidence: 'Phase I ESA (ASTM E1527-21), dated within the agency / lender window',
    authority: 'ASTM E1527-21; HCR QAP (ESA ≤12 months before application); lender', reviewStatus: 'Approved',
    appliesTo: ['new', 'rehab', 'reuse', 'preservation'],
  },
  {
    id: 'D1-05', nodeId: 'X0128', title: 'Contaminated / (E)-designated → cleanup pathway',
    owner: 'Principal', ownerPersona: 'principal', advisors: 'Environmental consultant; Counsel (recommend)',
    criteria: 'Phase II results vs SCOs; E-designation on the lot; cost / time of each pathway; BCP tax-credit value',
    options: [
      { label: 'DEC BCP', next: 'Carry to WS-A cleanup pathway' },
      { label: 'NYC OER VCP', next: 'Carry to WS-A cleanup pathway' },
      { label: 'E-designation remediation', next: 'Carry to WS-A cleanup pathway' },
      { label: 'No action', next: 'Proceed' },
    ],
    evidence: 'Phase II; E-designation search; remediation cost estimate', authority: '6 NYCRR 375; ZR §11-15 (E); NYC OER',
    reviewStatus: 'Approved', appliesTo: ['new', 'rehab', 'reuse', 'preservation'],
  },
  {
    id: 'D1-06', nodeId: 'X0145', title: 'Legal unit count differs from actual? → legalization required',
    owner: 'Architect', ownerPersona: null, advisors: 'Expediter; Counsel',
    criteria: 'Unit count on CO / I-card vs actual; DOB / HPD registration; illegal units occupied?',
    options: [
      { label: 'Mismatch', next: 'Legalization or unit-count correction before closing' },
      { label: 'Match', next: 'Proceed' },
    ],
    evidence: 'CO / I-card; HPD registration; site walk; rent roll', authority: 'NYC MDL; NYC BC; HPD',
    reviewStatus: 'Owner changed (Oct 4 review)', appliesTo: ['rehab'],
  },
  {
    id: 'D1-07', nodeId: 'X0156', title: 'URA / §104(d) applicability (federal funds?)',
    owner: 'Counsel', ownerPersona: null, advisors: 'Relocation consultant; Deal Lead; agency (facts)',
    criteria: 'Any federal funds (HOME, CDBG, project-based HUD) in acquisition or rehab; occupancy at ION',
    options: [
      { label: 'Yes', next: 'URA + §104(d) one-for-one replacement and notices' },
      { label: 'No', next: 'State / local relocation rules only' },
    ],
    evidence: 'Sources list; tenant census; funding commitments', authority: '49 CFR 24; HCDA §104(d)',
    reviewStatus: 'Owner changed', appliesTo: ['rehab'],
  },
  {
    id: 'D1-08', nodeId: 'X0161', title: 'Applicable exemption (485-x / 420-c / Art XI / J-51 / ICAP)',
    owner: 'Underwriting Analyst', ownerPersona: 'analyst', advisors: 'Counsel (confirms legal eligibility where ambiguous)',
    criteria: 'Project type, location and affordability vs program rules; construction start date; nonprofit control',
    options: [
      { label: '485-x', next: 'Selected benefit drives operating expenses and regulatory terms' },
      { label: '420-c', next: 'Selected benefit drives operating expenses and regulatory terms' },
      { label: 'Article XI', next: 'Selected benefit drives operating expenses and regulatory terms' },
      { label: 'J-51', next: 'Selected benefit drives operating expenses and regulatory terms' },
      { label: 'ICAP', next: 'Selected benefit drives operating expenses and regulatory terms' },
    ],
    evidence: 'Zoning lot data; unit mix and AMI bands; ownership structure',
    authority: 'RPTL §§485-x, 420-c, 489, 489-aaaa; PHFL Art. XI', reviewStatus: 'Approved',
    appliesTo: ['new', 'rehab', 'reuse', 'preservation'],
  },
];

export const DECISION_PLATFORM_ROLE =
  'Human-only. Platform assembles the evidence, runs the tests, drafts a recommendation and logs the decision; the accountable person decides.';

// Gate G1 - X0220 GATE: ACQUISITION CLOSING (gate definitions p.87, outline p.258).
export const GATE_G1 = {
  nodeId: 'X0220',
  name: 'Acquisition closing',
  verifier: 'Closing Coordinator',
  authorizer: 'Principal',
  rule: 'The named role verifies the conditions on a first pass; the Principal authorizes passing the gate and any waiver or economic cure. Each condition has its own evidence source and verifier. Completing the checklist does not by itself authorize the gate.',
  outcome: 'X0225 Funds wired & released at title - the acquisition closing event (gate outcome, not a condition)',
};

export const G1_CONDITIONS: GateCondition[] = [
  { id: 'G1-1', nodeId: 'X0221', text: 'Marketable title; exceptions acceptable; policy issued', verifier: 'Title / Counsel', evidenceHint: 'Title commitment, marked-up commitment, pro forma policy' },
  { id: 'G1-2', nodeId: 'X0222', text: 'Phase I clean (or Phase II + remediation + lender consent); ESA current for lender and agency windows (lender ≤6 months before closing; HCR ≤12 months before application deadline)', verifier: 'Environmental consultant', evidenceHint: 'Phase I ESA, reliance letter, lender consent' },
  { id: 'G1-3', nodeId: 'X0223', text: 'Loan-commitment CPs satisfied - lender confirms in writing (clear-to-close)', verifier: 'Lender', evidenceHint: 'Commitment letter, written clear-to-close' },
  { id: 'G1-4', nodeId: 'X0224', text: 'SPE formed & capitalized; authority docs executed; current good-standing (NY DOS + state of formation) and incumbency certificates', verifier: 'Counsel', evidenceHint: 'Formation documents, resolutions, good-standing, incumbency' },
  { id: 'G1-5', nodeId: null, text: 'Final settlement statement approved and all funds in escrow at title', verifier: 'Closing Coordinator / Title', evidenceHint: 'Settlement statement, escrow confirmation (NEW - no tree node yet)' },
];

// Gate checklists v3.5 - Acquisition closing (56 items, 5 categories, pp.423-425).
export const ACQ_CHECKLIST: { cat: string; items: string[] }[] = [
  { cat: 'A. Purchase agreement and seller deliverables', items: ['Executed PSA', 'Seller closing certificate', 'Deed', 'Bill of sale', 'FIRPTA / W-9', 'Tenant estoppels', 'Operating leases assignment', 'Seller resolutions', 'Seller OFAC certification'] },
  { cat: 'B. Title, survey and environmental', items: ['Title commitment', 'Title policies', 'Endorsements (ALTA 9 etc.)', 'ALTA/NSPS survey', 'Phase I ESA (lender ≤6 months; HCR ≤12 months)', 'Phase II / remediation plan', 'Phase I reliance letter', 'Environmental insurance', 'C of O search', 'Taxes & Vault search', 'Housing & Building search', 'Violations search', 'Fire search', 'Landmark search', 'Flood search'] },
  { cat: 'C. Loan and lender deliverables', items: ['Acquisition loan commitment', 'Promissory note', 'Mortgage', 'Section 255 affidavit', 'Loan agreement', 'Guaranty', 'UCC-1', 'Assignment of leases and rents', 'Appraisal (MAI within 90 days typical)', 'Insurance certificates', 'Legal opinion', 'Beneficial Ownership form', 'Patriot Act / OFAC', 'IRS Form 4506-T/C'] },
  { cat: 'D. Buyer entity and authority', items: ['SPE formation documents', 'Operating agreement', 'EIN', 'Good standing certificate (< 30 days)', 'Resolutions', 'JV agreement', 'Org chart', 'W-9', 'Photo ID'] },
  { cat: 'E. Tax, financial and closing logistics', items: ['Closing statement', 'Buyer funding wired', 'Loan proceeds wire-ready', 'Tax pro-rations', 'Transfer tax forms (RPTT, RP-5217, TP-584)', 'Tax exemption application (Article XI / J-51 / 421-a)', 'Recording instructions', 'Post-closing checklist', 'Certified financial statements'] },
];

export interface GovDoc {
  id: number;
  title: string;
  issuer: string;
  edition: string;
  programYear: string;
  status: string;
  flag?: string;
}

// Governing-document register v2, verified October 5, 2026 (pp.453-475) - entries relevant to the 9% HCR path.
export const GOV_DOCS: GovDoc[] = [
  { id: 1, title: '9% LIHTC QAP (9 NYCRR Part 2040)', issuer: 'NYS HCR', edition: 'Effective June 11, 2025', programYear: '2026 round', status: 'Verified current (Oct 5, 2026)' },
  { id: 2, title: 'SLIHC regulation (9 NYCRR 2040.14)', issuer: 'NYS HCR', edition: 'Effective June 11, 2025', programYear: '2026 round', status: 'Verified current (Oct 5, 2026)' },
  { id: 3, title: '2026 Multifamily Finance 9% LIHTC RFP (and Q&A #1-3)', issuer: 'NYS HCR', edition: 'Applications due Aug 11, 2026', programYear: '2026', status: 'Verified current (Oct 5, 2026)', flag: 'Round closed - use for rules, not timing of next round' },
  { id: 4, title: '2026 HCR 9% LIHTC Term Sheet', issuer: 'NYS HCR', edition: 'June 2026', programYear: '2026', status: 'Verified current (Oct 5, 2026)', flag: '50-yr regulatory term; caps $2.8M NYC/downstate ($3.0M WRA), $35k/unit' },
  { id: 7, title: '2026 NOFA-NOCA; Median Income by Bedroom Count', issuer: 'NYS HCR', edition: '2026', programYear: '2026', status: 'Verified current (Oct 5, 2026)', flag: 'Income and rent limits change yearly' },
  { id: 8, title: 'HCR Capital Programs Manual - 2026', issuer: 'NYS HCR', edition: '2026', programYear: '2026', status: 'Verified current (Oct 5, 2026)' },
  { id: 11, title: 'Internal Revenue Code §42 (incl. P.L. 119-21 §70422, 25% bond test)', issuer: 'US Congress / IRS', edition: 'As amended July 2025', programYear: 'Federal', status: 'Verified current (Oct 5, 2026)' },
  { id: 12, title: 'HCR Design Guidelines 2025, §5 (submissions, Enumeration of Documents, Accessibility Affidavit)', issuer: 'NYS HCR', edition: 'June 2025', programYear: '2026', status: 'Verified current (Oct 5, 2026)' },
  { id: 18, title: 'HCR Sustainability Guidelines', issuer: 'NYS HCR', edition: 'Linked from 2026 RFP', programYear: '2026', status: 'Verified online' },
  { id: 21, title: 'Enterprise Green Communities Criteria 2026', issuer: 'Enterprise', edition: 'Released Feb 19, 2026', programYear: '2026', status: 'Verified current (Oct 5, 2026)', flag: 'NEW EDITION: tree cites EGC 2020' },
  { id: 23, title: 'SEQRA (6 NYCRR Part 617)', issuer: 'NYS DEC', edition: '2026 amendments effective June 12, 2026', programYear: '2026', status: 'Verified current (Oct 5, 2026)' },
  { id: 26, title: 'SHPO guidance and walkthrough', issuer: 'NYS HCR / SHPO', edition: '2026', programYear: '2026', status: 'Verified online' },
  { id: 37, title: 'Uniform Relocation Act (49 CFR Part 24)', issuer: 'US DOT', edition: '2024 rule', programYear: 'Federal', status: 'Verified current (Oct 5, 2026)', flag: 'RHP cap $9,570' },
  { id: 120, title: 'IRC §42(g)(1) income averaging, §42(g)(2)(B) gross rent, §42(i)(3)(D) student rules', issuer: 'U.S. Code', edition: '2026', programYear: 'Federal', status: 'Verified current (Oct 5, 2026)' },
  { id: 124, title: '2026 LIHTC Income & Rent Limits (with HPD LIHTC Utility Allowances)', issuer: 'NYC HPD', edition: 'Effective 1/1/2026 and 5/1/2026', programYear: '2026', status: 'Verified current (Oct 5, 2026)' },
  { id: 138, title: 'Treas. Reg. §1.42-6 (carryover; 10% basis test)', issuer: 'Treasury / IRS', edition: 'Current', programYear: 'Federal', status: 'Verified current (Oct 5, 2026)' },
  { id: 171, title: 'Rev. Proc. 2025-32', issuer: 'IRS', edition: 'Calendar year 2026', programYear: '2026', status: 'Verified current (Oct 5, 2026)' },
  { id: 173, title: 'Treas. Reg. §1.42-16 (eligible basis reduced by federal grants)', issuer: 'Treasury / IRS', edition: 'Current', programYear: 'Federal', status: 'Verified current (Oct 5, 2026)' },
  { id: 176, title: 'HCR Capital Programs Manual §6 (6.03.03 developer fee; 6.09.01 builder fees; 6.12 cost certification)', issuer: 'NYS HCR', edition: 'Oct 2026', programYear: '2026', status: 'Verified current (Oct 5, 2026)' },
  { id: 178, title: 'HFA LIHTC QAP (21 NYCRR Part 2188)', issuer: 'NYS HFA', edition: 'Effective 6/11/2025', programYear: '2025-2026', status: 'Verified current (Oct 5, 2026)' },
  { id: 220, title: 'HCR LIHTC / SLIHC 9% Regulatory Agreement boilerplate', issuer: 'NYS HCR', edition: 'Fall 2022 round forward', programYear: '2023 posting', status: 'Read online - secondary source', flag: 'UPDATE' },
];

// Process-tree version history (pp.81-84) and the v3.6.1 change-log row (p.248).
export const TREE_VERSIONS = [
  { version: 'v3.6.1', date: '2026-10-08', nodes: 3403, leaves: 2822, decisions: 149, gates: 4, note: 'Point release - X0782 (regulatory agreement term: federal 30-yr minimum; 2026 HCR 9% term sheet 50-yr) moved from HDC reserves & requirements (X0778) to HCR requirements & standards (X0734). No other changes; counts unchanged.', status: 'Version of record' },
  { version: 'v3.6', date: '2026-10-08', nodes: 3403, leaves: 2822, decisions: 149, gates: 4, note: 'Principal rule-type review of 1,080 nodes (Everstead_P1-P3_RuleType_Reviewed_2026-10-08.xlsx).', status: 'Superseded' },
  { version: 'v3.5', date: '2026-10-07', nodes: 3403, leaves: 2822, decisions: 149, gates: 4, note: 'Introduced Rule type and Rule basis on every node.', status: 'Superseded' },
  { version: 'v3.4', date: '2026-10-06', nodes: 3399, leaves: 2818, decisions: 148, gates: 4, note: 'Final Phase 1-5 tree. X0046 pointer removed (typed link to X3151 kept).', status: 'Superseded' },
];

export const TREE_DIFF_V361 = [
  { version: 'v3.6.1', node: 'X0782', phase: 'P2 Pre-Development', field: 'Parent', was: 'X0778 HDC reserves & requirements', now: 'X0734 HCR requirements & standards', why: 'Principal decision (Oct 8, 2026): HCR 9% regulatory-agreement term belongs under HCR requirements, not HDC reserves', source: 'Principal decision / batch review' },
];

export const PHASE1_CHANGES = [
  { version: 'v2.2', node: 'X0222', was: 'Phase I clean (or Phase II + remediation + lender consent)', now: '+ ESA current for lender and agency windows', why: 'Date-currency test added (gate review)', source: 'Gate review (Oct 4, 2026); 9 NYCRR 2040; lender requirements' },
  { version: 'v2.2', node: 'X0223', was: 'Loan-commitment CPs satisfied', now: '+ lender confirms in writing (clear-to-close)', why: 'Written lender confirmation required', source: 'Gate review (Oct 4, 2026)' },
  { version: 'v2.2', node: 'X0225', was: 'Funds wired & confirmed at title', now: 'Acquisition closing event (gate outcome, not a condition)', why: "Reclassified as the closing event; condition replaced by 'final settlement statement approved and all funds in escrow at title'", source: 'Gate review (Oct 4, 2026)' },
  { version: 'v2.1', node: 'X0082', was: 'HDC program (ELLA / M2 / Mixed Middle / PACT)', now: 'HDC / HPD programs (HPD NCF incl. ELLA & Mixed Income options; HDC New Construction incl. Mix & Match; HDC Preservation; PACT)', why: 'ELLA no longer a standalone term sheet; M2 / Mixed Middle not on current lists', source: 'HPD term sheets page; HDC /develop (accessed 10/2026)' },
  { version: 'v2', node: 'X0183', was: 'Commitment letter (sample / [bank])', now: 'Commitment letter (reference sample - not NY-specific)', why: 'Tag non-NY sample', source: 'Batch review' },
];

export const HARD_RULE_NODES = ['X0017', 'X0019', 'X0031', 'X0051', 'X0064', 'X0121', 'X0127', 'X0149'];

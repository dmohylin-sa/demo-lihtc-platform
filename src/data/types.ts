// Shared data contracts for the demo. Everything is mocked in the browser.

export type RuleType = 'Hard' | 'Program' | 'Extract' | 'Process';
export type StepClass = 'Executable' | 'Assisted' | 'Human-only' | 'Container';

export interface TreeNode {
  id: string;
  name: string;
  level: number;
  nodeType: string;
  ruleType: RuleType | string;
  stepClass: StepClass | string;
  primary: string;
  secondary: string;
  gate: string;
  release: string;
  ruleBasis: string | null;
  parent: string | null;
  isDecision: boolean;
}

export type RuleStatus = 'In force' | 'Proposed' | 'Delayed' | 'Revoked';

export interface Rule {
  id: string;
  category: string;
  citation: string;
  appliesTo: string;
  rule: string;
  paramKey: string;
  operator: string;
  value: string;
  unit: string;
  sourceLayer: string;
  validation: string;
  agent: string;
  layer: 'Regulation' | 'Term sheet';
  effectiveDate: string;
  status: RuleStatus;
  ruleType: 'Program' | 'Hard';
}

export type PersonaId = 'dealLead' | 'analyst' | 'closing' | 'principal' | 'admin';

export interface Persona {
  id: PersonaId;
  name: string;
  initials: string;
  title: string;
  role: string; // role name as the tree uses it (decision register owner names)
  access: 'Editor' | 'Owner' | 'Everstead staff';
  tenantId: string;
  summaryMode: SummaryMode;
  blurb: string;
  quote: string;
  home: string; // route the persona lands on
}

export type SummaryMode = 'Executive' | 'Practitioner' | 'Analyst';

export type ProjectType = 'new' | 'rehab' | 'reuse' | 'preservation';
export type Health = 'on track' | 'at risk' | 'needs escalation';

export interface Deal {
  id: string;
  name: string;
  location: string;
  borough: string;
  units: number;
  projectType: ProjectType;
  program: string;
  agency: string;
  overlays: string[];
  tenantId: string;
  treeVersion: string;
  ruleVersion: string;
  createdAt: string;
  targetClosing: string;
  tdc: number | null;
  creditRequest: number | null;
  stage: string; // current workstream node id
  depth: 'full' | 'partial' | 'intake';
  dealLead: PersonaId;
}

export type NodeStatus = 'done' | 'in_progress' | 'blocked' | 'awaiting_decision' | 'not_started' | 'na';

export interface NodeState {
  status: NodeStatus;
  source: 'system' | 'manual';
  at?: string;
  cause?: string; // blocking cause
  evidence?: Citation[];
  findingIds?: string[];
}

export interface Citation {
  docId: string;
  page?: number;
  passageId?: string;
  cell?: string; // spreadsheet cell, e.g. "Sources!C14"
  quote?: string;
}

export type BlockType = 'h' | 'p' | 'kv' | 'table' | 'sig' | 'note';

export interface DocBlock {
  type: BlockType;
  text?: string;
  passageId?: string;
  rows?: string[][];
}

export interface DocPage {
  n: number;
  blocks: DocBlock[];
}

export interface SheetData {
  sheets: { name: string; rows: (string | number)[][] }[];
}

export type DocFormat = 'pdf' | 'xlsx' | 'docx' | 'eml' | 'jpg' | 'dwg';

export interface Doc {
  id: string;
  dealId: string;
  name: string;
  folder: string;
  docType: string;
  format: DocFormat;
  pages: number;
  scannedPct: number;
  sizeMb: number;
  version: number;
  supersedes?: string;
  confidence: number;
  uploadedAt: string;
  executed?: boolean;
  key?: boolean; // has rendered content
  header?: string; // running header shown on rendered pages
  content?: DocPage[];
  sheet?: SheetData;
  scan?: boolean;
}

export type FieldStatus = 'accepted' | 'review' | 'silent' | 'conflict' | 'corrected';

export interface ExtractField {
  id: string;
  dealId: string;
  docType: string;
  docId: string;
  field: string;
  value: string;
  confidence: number;
  citation?: Citation;
  status: FieldStatus;
  nodeId?: string;
  conflict?: { value: string; citation: Citation; source: string; precedence: string };
  note?: string;
}

export type Severity = 'blocking' | 'advisory' | 'informational';
export type Basis = 'deal' | 'rule' | 'general';
export type FindingStatus = 'open' | 'resolved' | 'invalidated' | 'in review' | 'passed';

export interface Finding {
  id: string;
  dealId: string;
  title: string;
  detail: string;
  severity: Severity;
  category: 'Threshold' | 'Calculation' | 'Risk' | 'Conflict' | 'Extraction' | 'Decision';
  ruleIds: string[];
  citation: string; // rule, section and program year as printed
  basis: Basis[];
  method: 'rule-based' | 'model-assisted' | 'calculation';
  sources: Citation[];
  action: string;
  owner: string;
  status: FindingStatus;
  nodeId?: string;
  since?: string;
  calcKey?: string;
}

export interface DecisionDef {
  id: string; // D1-01
  nodeId: string;
  title: string;
  owner: string; // role
  ownerPersona: PersonaId | null;
  advisors: string;
  criteria: string;
  options: { label: string; next: string }[];
  evidence: string;
  authority: string;
  reviewStatus: string;
  appliesTo: ProjectType[];
}

export interface DecisionState {
  status: 'decided' | 'awaiting' | 'na' | 'not_reached';
  option?: string;
  basis?: string;
  actor?: string;
  role?: string;
  at?: string;
}

export interface GateCondition {
  id: string;
  nodeId: string | null;
  text: string;
  verifier: string;
  evidenceHint: string;
}

export interface GateConditionState {
  verified: boolean;
  by?: string;
  at?: string;
  note?: string;
  waived?: boolean;
}

export interface AuditEvent {
  seq: number;
  at: string;
  actor: string;
  role: string;
  tenant: string;
  dealId?: string;
  action: string;
  object: string;
  basis?: string;
  prevHash: string;
  hash: string;
}

export interface UwInputs {
  version: 'v2' | 'v3';
  label: string;
  units: number;
  gprMonthlyByBand: { band: string; units: number; rent: number }[];
  otherIncome: number;
  vacancyPct: number;
  opexPerUnit: number;
  replacementReservePerUnit: number;
  acquisition: number;
  hardCosts: number;
  gcContract: number;
  builderProfitPct: number;
  builderOverheadPct: number;
  generalConditionsPct: number;
  softCosts: number;
  financingCosts: number;
  developerFee: number;
  reserves: number;
  permLoan: number;
  rate: number;
  amortYears: number;
  lenderMinDscr: number;
  creditRequest: number;
  creditPrice: number;
  applicablePct: number;
  basisBoost: number;
  applicableFraction: number;
  otherSources: { name: string; amount: number; cell: string }[];
  regTermYears: number;
  cells: Record<string, string>; // input key -> workbook cell reference
}

// The platform as it exists today (Tier 1), from the client's description of its current state, written in our own
// words and without vendor or product names. Drives the "Today" mode: every capability id carries what exists today,
// the client's direction for it where known, and what Release 1 adds. Statuses are to be confirmed at code review.
// Names that were not given (the six audit gates, the 12 stages, the 3 gates) stay numbered.

export type CapStatus = 'built' | 'partial' | 'replace' | 'notBuilt' | 'notDescribed';
export type ExceptionId = 'E1' | 'E2' | 'E3';

export const CAP_STATUS: Record<CapStatus, { label: string; short: string; dims: boolean; order: number }> = {
  built: { label: 'Built today', short: 'Built', dims: false, order: 0 },
  partial: { label: 'Partly built', short: 'Partial', dims: false, order: 1 },
  replace: { label: 'Exists · to be replaced', short: 'Replace', dims: false, order: 2 },
  notBuilt: { label: 'Not built yet', short: 'Not built', dims: true, order: 3 },
  notDescribed: { label: 'Not confirmed', short: 'Unconfirmed', dims: true, order: 4 },
};

export const SUMMARY =
  'A working Tier 1 prototype exists. It is best treated as an early foundation: its plumbing is worth reviewing for reuse, while the deal model, roles, tenancy and rule engine still have to be built. The domain content is ready and maintained by the client.';
export const SOURCE_NOTE =
  "Based on the client's description of the current platform, without access to it. Every status is to be confirmed at code review.";

export const AREAS = [
  'Intake and documents',
  'Extraction',
  'Agents and reliability',
  'Underwriting',
  'Findings and review',
  'Summary and report',
  'Lifecycle and decisions',
  'Rules',
  'Access and tenancy',
  'Evidence and audit',
  'AI and model operations',
  'Testing',
  'Platform, hosting and compliance',
] as const;
export type CapArea = (typeof AREAS)[number];

export interface CapDef {
  label: string;
  area: CapArea;
  status: CapStatus;
  today: string; // what exists today, in one or two sentences
  position?: string; // the client's direction for this component, where known
  exception?: ExceptionId; // a known issue carried into the next phase
  delta?: string; // what Release 1 (this demo) adds
  where: string[]; // demo routes that show it
}

export const CAPS = {
  // ---- Intake and documents ----
  'intake.upload': {
    label: 'Document upload', area: 'Intake and documents', status: 'partial',
    today: 'Single documents upload and enter the agent chain; larger files fail.',
    delta: 'Resumable upload of whole deal packages (hundreds of files, several GB).',
    where: ['/deals/harlow/documents'],
  },
  'intake.resumable': {
    label: 'Resumable package upload', area: 'Intake and documents', status: 'notBuilt',
    today: 'No chunked or resumable upload; large files fail.',
    delta: 'Chunked upload with pause, resume and retry.',
    where: ['/deals/harlow/documents'],
  },
  'intake.malwareScan': {
    label: 'Malware scan on arrival', area: 'Intake and documents', status: 'notDescribed',
    today: 'No information on scanning uploads.',
    delta: 'Every file scanned before processing.',
    where: ['/deals/harlow/documents'],
  },
  'intake.ocr': {
    label: 'OCR and layout', area: 'Intake and documents', status: 'notBuilt',
    today: 'Scanned pages are not read; OCR is an open gap.',
    delta: 'OCR with page and passage anchors for citations.',
    where: ['/deals/harlow/documents', '/admin/jobs'],
  },
  'intake.classification': {
    label: 'Document classification (agent 002)', area: 'Intake and documents', status: 'built',
    today: 'The intake agent classifies each upload, first in the chain.',
    position: 'Evaluate, then move onto a shared harness',
    where: ['/deals/harlow/documents', '/deals/harlow/runs'],
  },
  'intake.docStore': {
    label: 'Document versions and supersession', area: 'Intake and documents', status: 'notDescribed',
    today: 'Document storage is still an open design question; versioning and supersession are unconfirmed.',
    position: 'Open',
    delta: 'Versioned documents; a new version supersedes the old and both stay citable.',
    where: ['/deals/harlow/documents'],
  },

  // ---- Extraction ----
  'extraction.fields': {
    label: 'Cited field extraction per document type', area: 'Extraction', status: 'notDescribed',
    today: 'Cited findings exist; a reviewed field list per document type is unconfirmed, and the extraction engine is still to be chosen.',
    delta: 'An agreed field list for 10 document types, each value cited and reviewed.',
    where: ['/deals/harlow/extraction'],
  },
  'extraction.confidence': {
    label: 'Confidence scoring', area: 'Extraction', status: 'notBuilt',
    today: 'Extracted values carry no confidence score.',
    delta: 'Confidence per value; low confidence routes to review.',
    where: ['/deals/harlow/extraction'],
  },
  'extraction.silentConflict': {
    label: 'Silent slots and source conflicts', area: 'Extraction', status: 'notDescribed',
    today: 'No information on flagging silent extraction slots or conflicting sources.',
    delta: 'Silent slots flagged, never defaulted; conflicts shown side by side under the source ranking.',
    where: ['/deals/harlow/extraction'],
  },
  'review.bulk': {
    label: 'Bulk review', area: 'Extraction', status: 'notBuilt',
    today: 'Items are reviewed one at a time.',
    where: ['/deals/harlow/extraction'],
  },

  // ---- Agents and reliability ----
  'agents.chain': {
    label: 'Four agents chained end to end', area: 'Agents and reliability', status: 'built',
    today: 'Four agents run in sequence on a live stack: intake (002), 9% underwriting audit (009), risk register (010) and executive summary (015).',
    position: 'Evaluate, then move onto a shared harness',
    where: ['/deals/harlow/runs'],
  },
  'agents.runAudit': {
    label: 'Audit row per agent run', area: 'Agents and reliability', status: 'built',
    today: 'Each agent run is logged with its model, prompt version, timing, token counts and payloads.',
    where: ['/deals/harlow/runs'],
  },
  'agents.repeatability': {
    label: 'Repeatable results on the same document', area: 'Agents and reliability', status: 'partial', exception: 'E2',
    today: 'Uploading the same document again can return a different set of findings.',
    delta: 'Same package, same pinned models and prompts, identical findings (acceptance test AT-1).',
    where: ['/deals/harlow/runs', '/admin/model-ops'],
  },
  'agents.harness': {
    label: 'Shared agent harness', area: 'Agents and reliability', status: 'notBuilt',
    today: 'Agreed in principle; the 36-agent index is treated as a map of capabilities, not a build list.',
    position: 'Keep as requirements',
    where: [],
  },
  'reliability.retries': {
    label: 'Retries, dead-letter queue, partial results', area: 'Agents and reliability', status: 'built',
    today: 'Failed runs retry with backoff, then move to a dead-letter queue; partial results are kept.',
    where: ['/deals/harlow/runs', '/admin/jobs'],
  },
  'reliability.stuckSweep': {
    label: 'Sweep for stuck runs', area: 'Agents and reliability', status: 'notBuilt',
    today: 'Runs that hang are not detected automatically.',
    where: ['/admin/jobs'],
  },
  'reliability.traces': {
    label: 'Run tracing', area: 'Agents and reliability', status: 'partial',
    today: 'Runs are traced through an external tracing service; traces are lost when it is unavailable.',
    position: 'Reuse',
    where: ['/admin/model-ops'],
  },

  // ---- Underwriting ----
  'uw.workbookAudit': {
    label: '9% workbook audit, six gates (agent 009)', area: 'Underwriting', status: 'built',
    today: "The underwriting agent audits the sponsor's 9% workbook in six gates and points each finding to its cell. In acceptance testing it caught a deliberately planted DSCR error.",
    position: 'Evaluate, then move onto a shared harness',
    where: ['/deals/harlow/underwriting?tab=audit'],
  },
  'uw.cellCitations': {
    label: 'References to workbook sheet and cell', area: 'Underwriting', status: 'built',
    today: 'Findings point to the document, sheet and cell behind them.',
    where: ['/deals/harlow/underwriting'],
  },
  'uw.calcEngine': {
    label: 'Deterministic calculation engine', area: 'Underwriting', status: 'partial',
    today: "The agent checks the workbook's own figures; an independent calculation engine is unconfirmed.",
    delta: 'Sources and uses, operating budget, gap-method credit and fees recomputed in code and checked against a reference model.',
    where: ['/deals/harlow/underwriting'],
  },
  'uw.sensitivity': {
    label: 'Sensitivity and break-even', area: 'Underwriting', status: 'notDescribed',
    today: 'No information on sensitivity analysis.',
    delta: 'Live sliders and a DSCR break-even solver on the same engine.',
    where: ['/deals/harlow/underwriting?tab=sens'],
  },

  // ---- Findings and review ----
  'findings.list': {
    label: 'Findings with source references', area: 'Findings and review', status: 'built',
    today: 'The underwriting and risk agents produce findings, each pointing to its source.',
    where: ['/deals/harlow/findings'],
  },
  'findings.review': {
    label: 'Accept, override or flag each finding', area: 'Findings and review', status: 'built',
    today: 'A reviewer can accept, override or flag each finding, one at a time.',
    where: ['/deals/harlow/findings'],
  },
  'findings.pdfPages': {
    label: 'PDF page numbers on findings', area: 'Findings and review', status: 'notBuilt',
    today: 'References into PDFs carry no page number.',
    delta: 'Every citation opens the document at the page with the passage highlighted.',
    where: ['/deals/harlow/findings', '/deals/harlow/evidence'],
  },
  'findings.ruleCitations': {
    label: 'Rule citations with type, effective date and status', area: 'Findings and review', status: 'replace',
    today: 'Rules live in a single table of program-specific rules, without rule types, effective dates or status.',
    position: 'Replace',
    where: ['/deals/harlow/findings', '/admin/rules'],
  },
  'findings.knowledgeLayers': {
    label: 'Knowledge-layer labels', area: 'Findings and review', status: 'notDescribed',
    today: 'No information on keeping deal evidence, client rules and general information apart.',
    where: ['/deals/harlow/findings'],
  },
  'risk.register': {
    label: 'Risk register (agent 010)', area: 'Findings and review', status: 'built',
    today: 'The risk agent runs third in the chain and maintains the risk register.',
    where: ['/deals/harlow/findings?view=risks'],
  },
  'review.beforeFinal': {
    label: 'Review before output goes final', area: 'Findings and review', status: 'notBuilt',
    today: 'Output can go final without a required human review step.',
    delta: 'Quality gate: no uncited statement, no unchecked calculation, no open flag before sign-off.',
    where: ['/deals/harlow/report'],
  },
  'change.supersede': {
    label: 'Supersede and recompute', area: 'Findings and review', status: 'notDescribed',
    today: 'No information on invalidating and recomputing findings when a document is replaced.',
    delta: 'A new model version invalidates dependent findings and recomputes them with a before / after diff.',
    where: ['/deals/harlow/underwriting'],
  },

  // ---- Summary and report ----
  'summary.executive': {
    label: 'Executive summary (agent 015)', area: 'Summary and report', status: 'built', exception: 'E1',
    today: 'The summary agent runs last in the chain; its plain-language score is still below target.',
    where: ['/deals/harlow/overview', '/deals/harlow/report'],
  },
  'summary.modes': {
    label: 'Practitioner and Analyst summaries', area: 'Summary and report', status: 'notDescribed',
    today: 'Only an executive summary is known to exist.',
    delta: 'Three summary modes for three audiences on the same cited facts.',
    where: ['/deals/harlow/overview'],
  },
  'report.readiness': {
    label: 'Underwriting readiness report', area: 'Summary and report', status: 'notDescribed',
    today: 'No information on a cited readiness report with sign-off.',
    delta: 'A practitioner-editable report, every line cited, signed off and version-locked.',
    where: ['/deals/harlow/report'],
  },
  'report.export': {
    label: 'Report export (PDF, Word)', area: 'Summary and report', status: 'notDescribed',
    today: 'No information on exports.',
    where: ['/deals/harlow/report'],
  },

  // ---- Lifecycle and decisions ----
  'lifecycle.12stage': {
    label: '12-stage, 3-gate deal lifecycle', area: 'Lifecycle and decisions', status: 'replace',
    today: 'Deals follow an earlier 12-stage model with 3 gates. The process tree is to replace it; the 12 stages may stay as a view.',
    position: 'Replace',
    where: ['/deals/harlow/overview'],
  },
  'lifecycle.processTree': {
    label: 'Deal model on the process tree', area: 'Lifecycle and decisions', status: 'notBuilt',
    today: 'Not started: the process tree exists as client content, not yet as the deal model.',
    delta: 'All 224 Phase 1 nodes navigable per deal, with status, cause, evidence and owner.',
    where: ['/deals/harlow/process', '/deals/harlow/overview'],
  },
  'lifecycle.decisions': {
    label: 'Decisions and gate authorization', area: 'Lifecycle and decisions', status: 'notBuilt',
    today: 'Recording decisions and authorizing gates on a deal belongs to the deal model, which is not started.',
    delta: 'Owner-only decisions, first-pass gate verification and Principal authorization of G1.',
    where: ['/deals/harlow/decisions'],
  },
  'lifecycle.treeVersions': {
    label: 'Tree loaded as versioned configuration', area: 'Lifecycle and decisions', status: 'notBuilt',
    today: 'Agreed as the approach; not built.',
    delta: 'Import, validate and publish tree versions without a rebuild; deals stay pinned.',
    where: ['/admin/tree'],
  },
  'lifecycle.health': {
    label: 'Health signal, next actions and readiness', area: 'Lifecycle and decisions', status: 'notDescribed',
    today: 'No information on a deal health signal or next-action list.',
    delta: 'Health derived from findings, step status and deadlines, with the rule behind it shown.',
    where: ['/deals/harlow/overview', '/deals'],
  },

  // ---- Rules ----
  'rules.table': {
    label: 'Rule table', area: 'Rules', status: 'replace',
    today: 'A single table of program-specific rules.',
    position: 'Replace',
    delta: 'Hard, program-specific and extraction rules, each with citation, effective date and status.',
    where: ['/admin/rules'],
  },
  'rules.engine': {
    label: 'Rule-pack engine', area: 'Rules', status: 'notBuilt',
    today: 'Not started.',
    delta: 'Versioned rule packs tested against a sample deal and published without a rebuild; deals stay pinned and re-run with a diff.',
    where: ['/admin/rules'],
  },

  // ---- Access and tenancy ----
  'access.rbac': {
    label: 'Role-based access', area: 'Access and tenancy', status: 'notBuilt',
    today: 'There are no roles yet: any user on the allowlist can reach everything, admin screens included.',
    delta: 'Role, document and field-level permissions; owner-only decisions; staff-only admin console.',
    where: ['/admin/tenants'],
  },
  'access.mfa': {
    label: 'Multi-factor sign-in', area: 'Access and tenancy', status: 'notDescribed',
    today: 'Sign-in is by allowlist; no information on MFA.',
    where: ['/admin/tenants'],
  },
  'tenancy.isolation': {
    label: 'Tenant isolation', area: 'Access and tenancy', status: 'notBuilt',
    today: 'Not started; required before any external user is onboarded.',
    delta: 'Each sponsor sees only its own deals; Everstead staff work across tenants with audit.',
    where: ['/admin/tenants', '/admin/audit'],
  },

  // ---- Evidence and audit ----
  'evidence.map': {
    label: 'Finding-to-source trace', area: 'Evidence and audit', status: 'partial',
    today: 'Each finding references its sources; no cross-finding evidence map is known.',
    where: ['/deals/harlow/evidence'],
  },
  'evidence.search': {
    label: 'Evidence search (retrieval)', area: 'Evidence and audit', status: 'notBuilt',
    today: 'No retrieval layer; whether to add one is still open.',
    position: 'Open',
    where: ['/deals/harlow/evidence'],
  },
  'evidence.graph': {
    label: 'Per-deal knowledge graph', area: 'Evidence and audit', status: 'notBuilt',
    today: 'Not started.',
    where: ['/deals/harlow/evidence'],
  },
  'audit.trail': {
    label: 'Audit trail', area: 'Evidence and audit', status: 'partial',
    today: 'Agent runs are logged; a full trail of user actions is unconfirmed.',
    delta: 'Every user and system action, with actor, time and basis, in one append-only trail.',
    where: ['/deals/harlow/audit'],
  },
  'audit.hashChain': {
    label: 'Tamper-evident hash chain', area: 'Evidence and audit', status: 'notDescribed',
    today: 'No information on tamper evidence.',
    delta: 'SHA-256 chained events with verification.',
    where: ['/deals/harlow/audit'],
  },
  'audit.export': {
    label: 'Audit export', area: 'Evidence and audit', status: 'notDescribed',
    today: 'No information on audit exports.',
    where: ['/deals/harlow/audit'],
  },
  'data.export': {
    label: 'Deal data export', area: 'Evidence and audit', status: 'notDescribed',
    today: 'No information on a documented deal export.',
    delta: 'A full deal bundle in a documented schema; the data stays the client\'s.',
    where: ['/admin/export'],
  },

  // ---- AI and model operations ----
  'ai.model': {
    label: 'Hosted LLM, called directly', area: 'AI and model operations', status: 'built',
    today: 'One hosted LLM is called directly, with schema-constrained output that the code re-validates. Document references are added by the platform, not the model.',
    position: 'Reuse',
    where: ['/admin/model-ops'],
  },
  'ai.adapter': {
    label: 'Provider-neutral model layer', area: 'AI and model operations', status: 'partial',
    today: 'A provider-neutral model layer is partly built.',
    delta: 'A model gateway with a pinned model and version per role.',
    where: ['/admin/model-ops'],
  },
  'ai.promptVersions': {
    label: 'Versioned prompts', area: 'AI and model operations', status: 'built',
    today: 'Every run records its prompt version.',
    where: ['/admin/model-ops'],
  },
  'ai.tokens': {
    label: 'Token tracking', area: 'AI and model operations', status: 'built',
    today: 'Token use and cost are recorded per run.',
    where: ['/deals/harlow/runs', '/admin/model-ops'],
  },
  'ai.spend': {
    label: 'Spend dashboard', area: 'AI and model operations', status: 'partial',
    today: 'Spend reporting is a placeholder.',
    delta: 'Cost per active deal, by line.',
    where: ['/admin/model-ops'],
  },

  // ---- Testing ----
  'testing.ci': {
    label: 'Automated tests in CI', area: 'Testing', status: 'built',
    today: 'An automated suite of roughly 400 tests runs in CI.',
    where: [],
  },
  'testing.evals': {
    label: 'Known-answer evals per agent', area: 'Testing', status: 'partial',
    today: "Each agent has a known-answer eval set; only the intake agent's evals block CI, the others are run by hand.",
    position: 'Reuse and extend',
    delta: 'Client-authored cases and a release gate that blocks failing changes.',
    where: ['/admin/model-ops', '/deals/harlow/underwriting?tab=tol'],
  },
  'testing.goldenSet': {
    label: 'Accuracy tracking across runs', area: 'Testing', status: 'notDescribed',
    today: 'No information on tracking field and citation accuracy run over run.',
    delta: 'Golden-set runs with field accuracy, citation accuracy and repeatability.',
    where: ['/admin/model-ops'],
  },
  'testing.harness': {
    label: 'Client test harness', area: 'Testing', status: 'notBuilt',
    today: 'Not started; the client holds a handful of test cases today.',
    delta: 'Every approved case runs on each change; a failing case blocks release.',
    where: ['/acceptance'],
  },

  // ---- Platform, hosting and compliance ----
  'platform.backend': {
    label: 'Back end (TypeScript, queue worker, database)', area: 'Platform, hosting and compliance', status: 'built',
    today: 'A TypeScript monorepo with a queue-based background worker and a relational database; retry, dead-letter and audit paths exist.',
    position: 'Reuse, subject to code review',
    where: [],
  },
  'platform.frontend': {
    label: 'Front end (React)', area: 'Platform, hosting and compliance', status: 'built',
    today: 'A React web app; the product surface is expected to change a lot and has not been tested with sponsors.',
    position: 'Evaluate',
    where: [],
  },
  'hosting.stack': {
    label: 'Hosting and monitoring', area: 'Platform, hosting and compliance', status: 'built',
    today: 'Runs on managed cloud services, with an external tracing service.',
    position: 'Keep through the build, then move to AWS',
    where: [],
  },
  'hosting.envs': {
    label: 'Separate staging and preview environments', area: 'Platform, hosting and compliance', status: 'notBuilt', exception: 'E3',
    today: 'Production is the only environment; there is no staging or preview.',
    delta: 'Staging separate from production; demo sessions run on staging.',
    where: [],
  },
  'hosting.aws': {
    label: 'AWS hosting', area: 'Platform, hosting and compliance', status: 'notBuilt',
    today: 'A move to AWS, with runbooks and tested rollback, is planned before general release.',
    where: [],
  },
  'compliance.soc2': {
    label: 'SOC 2 readiness', area: 'Platform, hosting and compliance', status: 'notBuilt',
    today: 'Not started; can follow launch.',
    where: [],
  },
  'integrations.mail': {
    label: 'Document-store, mail and calendar integrations', area: 'Platform, hosting and compliance', status: 'notBuilt',
    today: 'Deferred to a later phase.',
    where: [],
  },
} as const satisfies Record<string, CapDef>;

export type CapId = keyof typeof CAPS;
export const capDef = (id: CapId): CapDef => CAPS[id];
export const CAP_IDS = Object.keys(CAPS) as CapId[];

// Known issues carried into the next phase.
export const EXCEPTIONS: Record<ExceptionId, { title: string; text: string; where: string }> = {
  E1: { title: 'Summary readability', text: "The summary agent's plain-language score is below its target.", where: '/deals/harlow/overview' },
  E2: { title: 'Repeat-upload variance', text: 'Uploading the same document several times returned different numbers of findings.', where: '/deals/harlow/runs' },
  E3: { title: 'No preview environment', text: 'Integration tests run on throwaway containers because there is no preview environment.', where: '/current-state' },
};

// The client's direction per component, in our words.
export const POSITIONS: { component: string; position: string; why: string }[] = [
  { component: 'Back end (TypeScript, queue worker, database)', position: 'Reuse, subject to code review', why: 'Tests, retries, the dead-letter queue and audit logging exist; roles, tenant isolation and a rule engine have to be added.' },
  { component: 'Front end (React)', position: 'Evaluate', why: 'The product surface is expected to change substantially and has not been tested with sponsors.' },
  { component: 'LLM access and tracing', position: 'Reuse', why: 'In place; the model-neutral layer is partly built and the choice of extraction engine is still open.' },
  { component: 'Four agents', position: 'Evaluate, then move onto a shared harness', why: 'Underwriting review is central to the first release; repeat-upload variance is to be fixed first.' },
  { component: 'Known-answer evals', position: 'Reuse and extend', why: 'Per-agent datasets and thresholds exist; they need client-authored cases and a release gate.' },
  { component: 'Deal lifecycle (12 stages, 3 gates)', position: 'Replace', why: 'The process tree becomes the model, loaded as versioned configuration; the 12 stages may stay as a view.' },
  { component: 'Rule table (program-specific rules only)', position: 'Replace', why: 'Needs rule types, effective dates and a status per rule.' },
  { component: 'Agent specs and 36-agent index', position: 'Keep as requirements', why: 'A map of capabilities, not a list of separate builds.' },
  { component: 'Document storage and retrieval', position: 'Open', why: 'Large uploads and OCR are unsolved; a retrieval layer is undecided.' },
  { component: 'Hosting and security', position: 'Keep through the build, then move to AWS', why: 'Cutover with runbooks before general release; tenant isolation before external users; SOC 2 after launch.' },
];

export const DECIDED = {
  decided: 'Domain and lifecycle content stay with the client, and the tree is loaded as configuration.',
  open: 'The retrieval layer, the extraction engine and the exact scope of the first release.',
};

export const MILESTONES: { id: string; status: 'Complete' | 'Awaiting acceptance'; note: string }[] = [
  { id: 'Earlier Tier 1 milestones', status: 'Complete', note: 'Delivered and accepted.' },
  { id: 'Final Tier 1 milestone', status: 'Awaiting acceptance', note: 'End-to-end testing, traceability, audit, token monitoring, documentation and deployment support. Three known issues carried forward.' },
];

export const STACK: { layer: string; today: string }[] = [
  { layer: 'Code base', today: 'TypeScript monorepo: web app, background worker, shared schemas, eval package' },
  { layer: 'Queue', today: 'Job queue with live updates to the app' },
  { layer: 'Database', today: 'Managed relational database' },
  { layer: 'Hosting', today: 'Managed cloud services; production is the only environment' },
  { layer: 'Monitoring', today: 'External LLM tracing service' },
  { layer: 'Model', today: 'One hosted LLM, called directly' },
];

export const CLOSE_OUT = {
  seconds: 240,
  duration: 'about 4 min',
  tokens: 'about 58k',
  cost: 'under $0.30',
  what: 'In acceptance testing, one upload ran all four agents on a test 9% workbook with a deliberately planted DSCR error; the audit caught it and pointed to the cell.',
  smoke: "A separate production check used the client's own documents.",
};

export const NOT_STARTED = [
  'Tenant isolation', 'Rule-pack engine', 'Client test harness', 'Deal model on the process tree', 'Per-deal knowledge graph', 'SOC 2 readiness',
];

export const EVALS: { agent: string; name: string; dataset: string; ci: boolean; note?: string }[] = [
  { agent: '002', name: 'Intake and classification', dataset: 'Known-answer fixtures', ci: true },
  { agent: '009', name: '9% underwriting, six-gate audit', dataset: 'Known-answer workbooks', ci: false },
  { agent: '010', name: 'Risk register', dataset: 'Known-answer set', ci: false },
  { agent: '015', name: 'Executive summary', dataset: 'Known-answer set', ci: false, note: 'Readability below target (known issue)' },
];

export const NAMES_NOTE = 'Names to confirm at code review';
export const LIFECYCLE_STAGES = Array.from({ length: 12 }, (_, i) => `Stage ${i + 1}`);
export const LIFECYCLE_GATES = ['Gate A', 'Gate B', 'Gate C'];

// Agent runs of today's platform: the four-agent chain. The close-out run matches the approximate totals described to
// us (about 4 minutes, about 58k tokens, under $0.30); the per-agent split, run history, prompt names, gate-to-finding
// mapping, repeat-upload counts and risk ratings are illustrative and labelled so on screen.

export type AgentKey = '002' | '009' | '010' | '015';

export const CHAIN: { id: AgentKey; name: string; does: string; model: string }[] = [
  { id: '002', name: 'Intake and classification', does: 'Classifies each upload and routes it to the next agent.', model: 'extraction-llm' },
  { id: '009', name: '9% underwriting · six-gate audit', does: 'Audits the sponsor workbook gate by gate and cites tab and cell.', model: 'reasoning-llm' },
  { id: '010', name: 'Risk register', does: 'Turns audit results and documents into register entries.', model: 'reasoning-llm' },
  { id: '015', name: 'Executive summary', does: 'Writes the plain-language summary of the outputs.', model: 'summary-llm' },
];
export const agentName = (id: AgentKey) => CHAIN.find((a) => a.id === id)!.name;
// Today the platform calls one hosted model directly; Release 1 pins a model per role in a gateway.
export const modelFor = (id: AgentKey, today: boolean) => (today ? 'hosted-llm' : CHAIN.find((a) => a.id === id)!.model);

export type StepStatus = 'succeeded' | 'retried' | 'dead-letter' | 'skipped';

export interface AgentStep {
  agent: AgentKey;
  status: StepStatus;
  attempts: number;
  start: string;
  end: string;
  seconds: number;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  prompt: string;
  output: string;
}

export interface AgentRun {
  id: string;
  dealId: string;
  trigger: string;
  started: string;
  status: 'Succeeded' | 'Succeeded after retry' | 'Dead-lettered · partial results saved' | 'Re-driven from dead-letter queue';
  steps: AgentStep[];
}

const PROMPT: Record<AgentKey, string> = { '002': 'intake.classify v1.4', '009': 'uw9.audit v2.1', '010': 'risk.register v1.2', '015': 'summary.executive v1.1' };

// Builds the chain's steps from per-agent (seconds, tokens in, tokens out); cost at $3 / $15 per million tokens.
function steps(start: string, spec: [AgentKey, number, number, number, StepStatus?, number?, string?][]): AgentStep[] {
  const [h, m, s] = start.split(':').map(Number);
  let t = h * 3600 + m * 60 + s;
  const fmt = (x: number) => [Math.floor(x / 3600), Math.floor((x % 3600) / 60), x % 60].map((n) => String(n).padStart(2, '0')).join(':');
  return spec.map(([agent, seconds, tokensIn, tokensOut, status = 'succeeded', attempts = 1, output = '']) => {
    const st = { agent, status, attempts, start: fmt(t), end: fmt(t + seconds), seconds, tokensIn, tokensOut, cost: (tokensIn * 3 + tokensOut * 15) / 1e6, prompt: PROMPT[agent], output };
    t += seconds;
    return st;
  });
}

export const HARLOW_RUNS: AgentRun[] = [
  {
    id: 'RUN-0412', dealId: 'harlow', trigger: 'Sponsor Pro Forma v2.xlsx uploaded', started: '2026-10-14 10:36:20', status: 'Succeeded',
    steps: steps('10:36:20', [
      ['002', 29, 5480, 790, 'succeeded', 1, 'Classified: sponsor pro forma (9% LIHTC workbook)'],
      ['009', 138, 28940, 5610, 'succeeded', 1, '6 gates run · 3 flagged · DSCR 1.17x cited to Operating Budget!C24'],
      ['010', 44, 9020, 1960, 'succeeded', 1, '7 register entries'],
      ['015', 23, 4690, 1240, 'succeeded', 1, 'Executive summary · 182 words'],
    ]),
  },
  {
    id: 'RUN-0418', dealId: 'harlow', trigger: 'Lender term sheet (executed).pdf uploaded', started: '2026-10-15 09:02:11', status: 'Succeeded after retry',
    steps: steps('09:02:11', [
      ['002', 26, 5120, 640, 'succeeded', 1, 'Classified: lender term sheet (executed)'],
      ['009', 171, 30110, 5820, 'retried', 2, 'Attempt 1 timed out; retried after backoff and succeeded'],
      ['010', 41, 8760, 1890, 'succeeded', 1, 'Register updated · DSCR covenant 1.20x'],
      ['015', 22, 4610, 1190, 'succeeded', 1, 'Executive summary · 176 words'],
    ]),
  },
  {
    id: 'RUN-0423', dealId: 'harlow', trigger: 'Phase I ESA.pdf uploaded', started: '2026-10-16 14:10:02', status: 'Dead-lettered · partial results saved',
    steps: steps('14:10:02', [
      ['002', 33, 6010, 820, 'succeeded', 1, 'Classified: Phase I environmental site assessment'],
      ['009', 129, 27450, 5390, 'succeeded', 1, 'Workbook unchanged · 6 gates re-run'],
      ['010', 96, 18210, 0, 'dead-letter', 3, 'Output failed schema re-validation 3 times; moved to the dead-letter queue. Results of 002 and 009 saved.'],
      ['015', 0, 0, 0, 'skipped', 0, 'Not run: upstream agent in the dead-letter queue'],
    ]),
  },
  {
    id: 'RUN-0424', dealId: 'harlow', trigger: 'RUN-0423 re-driven from the dead-letter queue', started: '2026-10-16 14:31:40', status: 'Re-driven from dead-letter queue',
    steps: steps('14:31:40', [
      ['010', 47, 9310, 2050, 'succeeded', 1, 'Register updated · REC on adjoining parcel (Phase I p.14)'],
      ['015', 24, 4780, 1260, 'succeeded', 1, 'Executive summary · 189 words'],
    ]),
  },
];

// The close-out run, split across the four agents (illustrative) to match the approximate totals.
export const CLOSE_OUT_STEPS: { agent: AgentKey; seconds: number; tokensIn: number; tokensOut: number; cost: number; line: string }[] = [
  { agent: '002', seconds: 30, tokensIn: 5600, tokensOut: 800, cost: 0.03, line: 'Test 9% workbook classified and routed' },
  { agent: '009', seconds: 140, tokensIn: 28400, tokensOut: 5700, cost: 0.17, line: 'Six gates run · planted DSCR error caught and pointed to its cell' },
  { agent: '010', seconds: 45, tokensIn: 9200, tokensOut: 2000, cost: 0.06, line: 'Risk register written' },
  { agent: '015', seconds: 25, tokensIn: 4800, tokensOut: 1300, cost: 0.03, line: 'Executive summary written' },
];

// Illustrative counts: the point is that the same document gives a different number of findings each time.
export const REPEAT_UPLOADS = [
  { attempt: 'Upload 1', findings: 3 },
  { attempt: 'Upload 2', findings: 6 },
  { attempt: 'Upload 3', findings: 4 },
];

// Six-gate workbook audit. Gate names were not given to us; which findings sit under which gate is illustrative.
export const WORKBOOK_AUDIT: { gate: number; findingIds: string[] }[] = [
  { gate: 1, findingIds: ['F-13'] },
  { gate: 2, findingIds: ['F-01'] },
  { gate: 3, findingIds: ['F-03'] },
  { gate: 4, findingIds: ['F-02', 'F-06'] },
  { gate: 5, findingIds: ['F-07'] },
  { gate: 6, findingIds: ['F-10'] },
];

// Risk register entries derive from the deal's open findings; likelihood and impact are illustrative.
export type Level = 'Low' | 'Medium' | 'High';
export const RISK_META: Record<string, { likelihood: Level; impact: Level }> = {
  'F-01': { likelihood: 'High', impact: 'High' },
  'F-02': { likelihood: 'Medium', impact: 'High' },
  'F-03': { likelihood: 'High', impact: 'High' },
  'F-04': { likelihood: 'Medium', impact: 'Medium' },
  'F-05': { likelihood: 'Medium', impact: 'High' },
  'F-06': { likelihood: 'Medium', impact: 'Low' },
  'F-07': { likelihood: 'High', impact: 'Medium' },
  'F-08': { likelihood: 'Medium', impact: 'Medium' },
  'F-09': { likelihood: 'Low', impact: 'High' },
  'F-14': { likelihood: 'Medium', impact: 'Medium' },
  'L-01': { likelihood: 'High', impact: 'High' },
};
const SCORE: Record<Level, number> = { Low: 1, Medium: 2, High: 3 };
export const riskRating = (l: Level, i: Level): Level => {
  const s = SCORE[l] * SCORE[i];
  return s >= 6 ? 'High' : s >= 3 ? 'Medium' : 'Low';
};

// Derived views over the demo store: documents, metrics, health signal and next required actions.
import type { Doc, Finding, Health } from '../data/types';
import { KEY_DOCS, SCENARIO_DOCS, HAP_DOC, fillerDocs } from '../data/documents';
import { TREE_PHASE1 } from '../data/tree-phase1';
import { DECISIONS } from '../data/registry';
import type { DemoState } from './demoStore';

const ALL_SPECIAL: Record<string, Doc> = { ...Object.fromEntries(KEY_DOCS.map((d) => [d.id, d])), ...SCENARIO_DOCS, [HAP_DOC.id]: HAP_DOC };
const fillerCache: Record<string, Doc[]> = {};
const fillers = (dealId: string) => (fillerCache[dealId] ??= fillerDocs(dealId));

export function getDoc(id: string): Doc | undefined {
  if (ALL_SPECIAL[id]) return ALL_SPECIAL[id];
  const m = id.match(/^f-(.+)-\d+$/);
  return m ? fillers(m[1]).find((d) => d.id === id) : undefined;
}

export function dealDocs(s: Pick<DemoState, 'upload' | 'extraDocs'>, dealId: string): Doc[] {
  if (s.upload[dealId]?.status !== 'done') return [];
  const key = dealId === 'harlow' ? KEY_DOCS : [];
  const extra = s.extraDocs.map((id) => ALL_SPECIAL[id]).filter((d) => d && d.dealId === dealId);
  return [...key, ...extra, ...fillers(dealId)];
}

export const dealFindings = (s: Pick<DemoState, 'findings'>, dealId: string): Finding[] => s.findings.filter((f) => f.dealId === dealId);

export const docLabel = (docId: string) => {
  const d = getDoc(docId);
  if (!d) return docId;
  return d.name.replace(/\.(pdf|xlsx|docx|eml)$/, '').replace(/ - executed| \(scanned\)| - scanned/g, '');
};

export interface DealMetrics {
  readiness: number;
  done: number;
  applicable: number;
  inProgress: number;
  blockedNodes: number;
  awaitingDecisions: number;
  blocking: number;
  advisory: number;
  informational: number;
  passed: number;
  health: Health;
  drivers: string[];
}

const LEAVES = TREE_PHASE1.filter((n) => n.stepClass !== 'Container');

export function dealMetrics(s: Pick<DemoState, 'nodeStatus' | 'findings' | 'decisions'>, dealId: string): DealMetrics {
  const ns = s.nodeStatus[dealId] ?? {};
  const leaves = LEAVES.filter((n) => ns[n.id] && ns[n.id].status !== 'na');
  const done = leaves.filter((n) => ns[n.id].status === 'done').length;
  const inProgress = leaves.filter((n) => ns[n.id].status === 'in_progress').length;
  const blockedNodes = leaves.filter((n) => ns[n.id].status === 'blocked').length;
  const decisions = s.decisions[dealId] ?? {};
  const awaitingDecisions = Object.values(decisions).filter((d) => d.status === 'awaiting').length;
  const f = dealFindings(s, dealId);
  const open = f.filter((x) => x.status === 'open' || x.status === 'in review');
  const blocking = open.filter((x) => x.severity === 'blocking').length;
  const advisory = open.filter((x) => x.severity === 'advisory').length;
  const informational = open.filter((x) => x.severity === 'informational').length;
  const passed = f.filter((x) => x.status === 'passed' || x.status === 'resolved').length;
  const drivers: string[] = [];
  if (blocking) drivers.push(`${blocking} blocking finding${blocking > 1 ? 's' : ''}`);
  if (blockedNodes) drivers.push(`${blockedNodes} blocked step${blockedNodes > 1 ? 's' : ''}`);
  if (awaitingDecisions) drivers.push(`${awaitingDecisions} decision${awaitingDecisions > 1 ? 's' : ''} awaiting an owner`);
  if (advisory) drivers.push(`${advisory} advisory finding${advisory > 1 ? 's' : ''}`);
  const health: Health = blocking >= 3 || blockedNodes >= 5 ? 'needs escalation' : blocking > 0 || blockedNodes > 0 || awaitingDecisions >= 2 ? 'at risk' : 'on track';
  return {
    readiness: leaves.length ? Math.round((done / leaves.length) * 100) : 0,
    done, applicable: leaves.length, inProgress, blockedNodes, awaitingDecisions, blocking, advisory, informational, passed, health, drivers,
  };
}

export interface NextAction {
  key: string;
  title: string;
  owner: string;
  basis: string;
  priority: 'blocking' | 'advisory' | 'informational';
  to: string;
  nodeId?: string;
}

export function nextActions(s: Pick<DemoState, 'findings' | 'decisions'>, dealId: string): NextAction[] {
  const out: NextAction[] = [];
  const dec = s.decisions[dealId] ?? {};
  for (const d of DECISIONS) {
    if (dec[d.id]?.status === 'awaiting') {
      out.push({ key: d.id, title: `Record decision ${d.id}: ${d.title}`, owner: d.owner, basis: `Decision register ${d.id} · node ${d.nodeId} · ${d.authority}`, priority: 'blocking', to: `/deals/${dealId}/decisions`, nodeId: d.nodeId });
    }
  }
  for (const f of dealFindings(s, dealId)) {
    if ((f.status === 'open' || f.status === 'in review') && f.severity !== 'informational') {
      out.push({ key: f.id, title: f.action, owner: f.owner, basis: `${f.id} · ${f.citation}`, priority: f.severity, to: `/deals/${dealId}/findings?f=${f.id}`, nodeId: f.nodeId });
    }
  }
  const rank = { blocking: 0, advisory: 1, informational: 2 };
  return out.sort((a, b) => rank[a.priority] - rank[b.priority]);
}

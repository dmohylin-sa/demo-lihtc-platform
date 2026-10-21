// Process navigator over the 224 Phase 1 nodes of process tree v3.6.1, loaded as configuration.
// Per-deal status on every node, project-type branches, blocked steps with causes, and a node detail panel.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Breadcrumb, Card, Col, Descriptions, Empty, Input, Row, Select, Space, Switch, Tag, Tooltip, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { BranchesOutlined, LinkOutlined, PushpinOutlined, SearchOutlined } from '@ant-design/icons';
import { useDemo } from '../../store/demoStore';
import { useDeal, useDealFields, useDealFindings } from '../../store/hooks';
import { TREE_PHASE1 } from '../../data/tree-phase1';
import { DECISIONS, agentName } from '../../data/registry';
import { RULES_HCR9 } from '../../data/rules-hcr9';
import { PROJECT_TYPES } from '../../data/deals';
import type { NodeStatus, TreeNode } from '../../data/types';
import {
  MetricCard, NODE_STATUS, NodeStatusTag, PageHeader, RuleTypeBadge, SeverityTag, StatusDot, StepClassBadge, FindingStatusTag,
} from '../../components/ui';
import { CitationChip } from '../../components/viewer';

const BY_ID = Object.fromEntries(TREE_PHASE1.map((n) => [n.id, n]));
const CHILDREN: Record<string, TreeNode[]> = {};
for (const n of TREE_PHASE1) if (n.parent) (CHILDREN[n.parent] ??= []).push(n);

const ancestors = (id: string): string[] => {
  const out: string[] = [];
  let p = BY_ID[id]?.parent;
  while (p) { out.unshift(p); p = BY_ID[p].parent; }
  return out;
};

// Rules the review pack links to Phase 1 underwriting-readiness nodes (rule pack "Linked node ID" column).
const NODE_RULES: Record<string, string[]> = {
  X0086: ['HCR-T-02'], X0087: ['HCR-T-02'], X0072: ['HCR-D-09'], X0080: ['HCR-T-08a', 'HCR-T-08e'], X0083: ['HCR-T-08a', 'HCR-T-08e', 'HCR-T-01'],
  X0123: ['HCR-T-09a'], X0124: ['HCR-T-09a'], X0166: ['HCR-T-09b', 'HCR-T-10'], X0167: ['HCR-T-09c'], X0170: ['HCR-C-01', 'HCR-T-21'],
  X0171: ['HCR-C-08', 'HCR-C-07'], X0173: [], X0174: ['HCR-T-16'], X0175: ['HCR-C-02', 'HCR-C-03', 'HCR-C-05'], X0222: ['HCR-T-09a'],
  X0035: ['HCR-T-14'], X0154: ['HCR-T-11'], X0136: ['HCR-T-13', 'HCR-T-18'],
};

const TYPED_LINKS: Record<string, { rel: string; target: string; name: string; phase: string }[]> = {
  X0044: [{ rel: 'related_process', target: 'X3112', name: 'Asset strategy / disposition (Year-15 & exit)', phase: 'Phase 5' }],
  X0154: [{ rel: 'depends_on (inbound)', target: 'X1363', name: 'Tenant relocation execution', phase: 'Phase 3' }, { rel: 'governed_by (inbound)', target: 'X2636', name: 'Relocation compliance', phase: 'Phase 4' }],
  X0127: [{ rel: 'merged from', target: 'X0352', name: '(E)-designation check, Phase 2 duplicate', phase: 'Phase 2' }],
  X0213: [{ rel: 'merged from', target: 'X1081', name: 'Assignment of leases & rents, Phase 2 duplicate', phase: 'Phase 2' }],
  X0189: [{ rel: 'merged from', target: 'X1173', name: 'Organizational chart, Phase 2 duplicate', phase: 'Phase 2' }],
  X0171: [{ rel: 'kept both', target: 'X2397', name: 'Sources & uses (Phase 2 finalization)', phase: 'Phase 2' }],
  X0157: [{ rel: 'kept both', target: 'X1250', name: 'Finalized relocation methodology', phase: 'Phase 2' }],
};

const STEP_CLASS_HELP: Record<string, string> = {
  Executable: 'Platform-executable: the platform performs the step and records trigger, source and evidence.',
  Assisted: 'Platform-assisted: the platform prepares and checks; a practitioner completes the step.',
  'Human-only': 'Human decision or action: the platform presents the basis; the accountable person decides.',
  Container: 'Grouping node: status rolls up from the steps below.',
};

export default function Process() {
  const deal = useDeal();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const nodeStatus = useDemo((s) => s.nodeStatus[deal.id]);
  const decisions = useDemo((s) => s.decisions[deal.id]);
  const fields = useDealFields(deal.id);
  const findings = useDealFindings(deal.id);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<NodeStatus | 'all'>('all');
  const [stepClass, setStepClass] = useState<string>('all');
  const [ruleType, setRuleType] = useState<string>('all');
  const [hideNa, setHideNa] = useState(false);
  const selected = params.get('node') ?? 'X0173';
  const [expanded, setExpanded] = useState<string[]>(() => [...TREE_PHASE1.filter((n) => n.level <= 1).map((n) => n.id), ...ancestors(selected)]);

  useEffect(() => {
    setExpanded((e) => [...new Set([...e, ...ancestors(selected)])]);
    const t = setTimeout(() => document.querySelector(`[data-node="${selected}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 200);
    return () => clearTimeout(t);
  }, [selected]);

  const filtering = q.trim() !== '' || status !== 'all' || stepClass !== 'all' || ruleType !== 'all';
  const visible = useMemo(() => {
    const match = (n: TreeNode) => {
      const st = nodeStatus[n.id]?.status;
      if (hideNa && st === 'na') return false;
      if (!filtering) return true;
      if (q && !(`${n.id} ${n.name}`.toLowerCase().includes(q.toLowerCase()))) return false;
      if (status !== 'all' && st !== status) return false;
      if (stepClass !== 'all' && n.stepClass !== stepClass) return false;
      if (ruleType !== 'all' && n.ruleType !== ruleType) return false;
      return true;
    };
    const keep = new Set<string>();
    for (const n of TREE_PHASE1) if (match(n)) { keep.add(n.id); ancestors(n.id).forEach((a) => keep.add(a)); }
    return keep;
  }, [nodeStatus, q, status, stepClass, ruleType, hideNa, filtering]);

  const treeData = useMemo(() => {
    const build = (n: TreeNode): DataNode => {
      const st = nodeStatus[n.id]?.status ?? 'not_started';
      const kids = (CHILDREN[n.id] ?? []).filter((c) => visible.has(c.id));
      return {
        key: n.id,
        title: (
          <span data-node={n.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, opacity: st === 'na' ? 0.45 : 1, padding: '1px 0' }}>
            <StatusDot value={st} />
            <span className="mono muted">{n.id}</span>
            {n.isDecision ? <Tooltip title="Decision point"><span style={{ color: 'var(--plum)', fontWeight: 800 }}>◇</span></Tooltip> : null}
            {n.nodeType === 'Gate' ? <Tooltip title="Gate"><span style={{ color: '#B8860B', fontWeight: 800 }}>◆</span></Tooltip> : null}
            <span style={{ fontWeight: n.level <= 1 ? 700 : n.level === 2 ? 600 : 400 }}>{n.name}</span>
            {n.ruleType !== 'Process' ? <RuleTypeBadge value={n.ruleType} /> : null}
            {st === 'blocked' || st === 'awaiting_decision' ? <NodeStatusTag value={st} /> : null}
          </span>
        ),
        children: kids.map(build),
      };
    };
    return [build(BY_ID.X0001)];
  }, [nodeStatus, visible]);

  const counts = useMemo(() => {
    const c: Record<NodeStatus, number> = { done: 0, in_progress: 0, blocked: 0, awaiting_decision: 0, not_started: 0, na: 0 };
    // Steps only (grouping nodes roll up), so the counts match the overview.
    for (const n of TREE_PHASE1) if (n.stepClass !== 'Container') c[nodeStatus[n.id]?.status ?? 'not_started'] += 1;
    return c;
  }, [nodeStatus]);

  const node = BY_ID[selected];
  const ns = nodeStatus[selected];
  const decision = DECISIONS.find((d) => d.nodeId === selected);
  const nodeFindings = findings.filter((f) => f.nodeId === selected || ns?.findingIds?.includes(f.id));
  const ruleIds = [...new Set([...(NODE_RULES[selected] ?? []), ...nodeFindings.flatMap((f) => f.ruleIds)])];
  const nodeFields = fields.filter((f) => f.nodeId === selected);
  const kids = CHILDREN[selected] ?? [];
  const branch = PROJECT_TYPES[deal.projectType];

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Process tree v3.6.1 · version of record · loaded as configuration"
        title="Process navigator"
        desc={`All 224 Phase 1 nodes, typed by rule type and step class. Project type ${branch.label.toLowerCase()} puts branch ${branch.branch} on the path; other project-type branches are shown as not on this path.`}
        extra={<Tag icon={<PushpinOutlined />}>Pinned to tree {deal.treeVersion} · new releases load without a rebuild</Tag>}
      />
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={4}><MetricCard label="Phase 1 nodes" value="224" sub="179 steps · 45 groups · 8 decisions" /></Col>
        <Col xs={12} lg={5}><MetricCard label="Complete" value={counts.done} sub="system or manual source" tone="primary" /></Col>
        <Col xs={12} lg={5}><MetricCard label="In progress" value={counts.in_progress} /></Col>
        <Col xs={12} lg={5}><MetricCard label="Blocked / awaiting" value={`${counts.blocked} / ${counts.awaiting_decision}`} sub="each with a stated cause" tone={counts.blocked ? 'danger' : 'neutral'} /></Col>
        <Col xs={24} lg={5}><MetricCard label="Steps not on this path" value={counts.na} sub="other project-type branches" /></Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} xl={14}>
          <Card styles={{ body: { padding: 14 } }} data-tour="process-tree">
            <Space wrap style={{ marginBottom: 12 }}>
              <Input allowClear prefix={<SearchOutlined />} placeholder="Search node id or name" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 220 }} />
              <Select value={status} onChange={setStatus} style={{ width: 170 }} options={[{ value: 'all', label: 'Any status' }, ...(Object.keys(NODE_STATUS) as NodeStatus[]).map((k) => ({ value: k, label: NODE_STATUS[k].label }))]} />
              <Select value={stepClass} onChange={setStepClass} style={{ width: 150 }} options={[{ value: 'all', label: 'Any step class' }, ...['Executable', 'Assisted', 'Human-only', 'Container'].map((v) => ({ value: v }))]} />
              <Select value={ruleType} onChange={setRuleType} style={{ width: 140 }} options={[{ value: 'all', label: 'Any rule type' }, ...['Hard', 'Program', 'Extract', 'Process'].map((v) => ({ value: v }))]} />
              <Space size={6}><Switch size="small" checked={hideNa} onChange={setHideNa} /><span style={{ fontSize: 12.5 }}>Hide branches not on this path</span></Space>
            </Space>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11.5, marginBottom: 10, color: 'var(--secondary)' }}>
              {(Object.keys(NODE_STATUS) as NodeStatus[]).map((k) => <span key={k} style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><StatusDot value={k} />{NODE_STATUS[k].label}</span>)}
              <span>◇ decision · ◆ gate</span>
            </div>
            <Tree
              treeData={treeData}
              height={640}
              blockNode
              showLine={{ showLeafIcon: false }}
              expandedKeys={filtering ? [...visible] : expanded}
              onExpand={(k) => setExpanded(k as string[])}
              selectedKeys={[selected]}
              onSelect={(k) => k[0] && setParams({ node: String(k[0]) }, { replace: true })}
            />
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          {node ? (
            <Card
              style={{ position: 'sticky', top: 80 }}
              title={<span><span className="mono muted" style={{ fontSize: 12 }}>{node.id} · {node.nodeType}</span><br />{node.name}</span>}
              extra={ns ? <NodeStatusTag value={ns.status} /> : null}
              data-tour="node-detail"
            >
              <Breadcrumb style={{ marginBottom: 12, fontSize: 12 }} items={ancestors(node.id).map((a) => ({ title: <a onClick={() => setParams({ node: a }, { replace: true })}>{BY_ID[a].name}</a> }))} />
              {ns?.cause && ns.status !== 'done' ? (
                <div className={ns.status === 'blocked' ? 'stripe-blocked' : 'callout-gold'} style={{ padding: '9px 12px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
                  <strong>{ns.status === 'blocked' ? 'Blocked: ' : ns.status === 'na' ? 'Not on this path: ' : 'Why: '}</strong>{ns.cause}
                </div>
              ) : null}
              <Descriptions size="small" column={1} colon={false} styles={{ label: { width: 130, color: 'var(--muted)', fontWeight: 600, fontSize: 12 } }}>
                <Descriptions.Item label="Rule type"><Space><RuleTypeBadge value={node.ruleType} />{node.ruleBasis ? <span className="muted" style={{ fontSize: 12 }}>Basis: {node.ruleBasis}</span> : null}</Space></Descriptions.Item>
                <Descriptions.Item label="Step class"><Space direction="vertical" size={2}><StepClassBadge value={node.stepClass} /><span className="muted" style={{ fontSize: 12 }}>{STEP_CLASS_HELP[node.stepClass]}</span></Space></Descriptions.Item>
                <Descriptions.Item label="Agents"><span>{agentName(node.primary)} <span className="muted">({node.primary})</span> · {agentName(node.secondary)} <span className="muted">({node.secondary})</span></span></Descriptions.Item>
                <Descriptions.Item label="Gate · release"><Tag>G1 acquisition closing</Tag><Tag color="purple">R1</Tag></Descriptions.Item>
                <Descriptions.Item label="Status source">{ns ? `${ns.source === 'system' ? 'System' : 'Manual (logged as override with reason)'} · ${ns.at ?? ''}` : '-'}</Descriptions.Item>
              </Descriptions>

              {decision ? (
                <div className="panel" style={{ marginTop: 12 }}>
                  <Space style={{ marginBottom: 6 }}><BranchesOutlined /><strong>Decision register {decision.id}</strong><Tag>{decisions[decision.id]?.status.replace('_', ' ')}</Tag></Space>
                  <div style={{ fontSize: 12.5 }}><strong>Owner:</strong> {decision.owner} · <strong>Verifier:</strong> {decision.advisors}</div>
                  <div style={{ fontSize: 12.5, marginTop: 4 }}><strong>Criteria:</strong> {decision.criteria}</div>
                  <a style={{ fontSize: 12.5 }} onClick={() => navigate(`/deals/${deal.id}/decisions`)}>Open decision <LinkOutlined /></a>
                </div>
              ) : null}

              {nodeFindings.length ? (
                <div style={{ marginTop: 14 }}>
                  <div className="metric-label" style={{ marginBottom: 6 }}>Findings on this node</div>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {nodeFindings.map((f) => (
                      <div key={f.id} style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', fontSize: 13 }} onClick={() => navigate(`/deals/${deal.id}/findings?f=${f.id}`)}>
                        <SeverityTag value={f.severity} /><span style={{ flex: 1 }}>{f.id} · {f.title}</span><FindingStatusTag value={f.status} />
                      </div>
                    ))}
                  </Space>
                </div>
              ) : null}

              {ruleIds.length ? (
                <div style={{ marginTop: 14 }}>
                  <div className="metric-label" style={{ marginBottom: 6 }}>NY HCR 9% rules on this node</div>
                  {ruleIds.map((id) => {
                    const r = RULES_HCR9.find((x) => x.id === id);
                    return r ? (
                      <div key={id} style={{ fontSize: 12.5, marginBottom: 6 }}>
                        <Tag color="purple" style={{ marginRight: 6 }}>{r.id}</Tag>{r.rule} <span className="muted">({r.citation} · {r.layer})</span>
                      </div>
                    ) : null;
                  })}
                </div>
              ) : null}

              {nodeFields.length ? (
                <div style={{ marginTop: 14 }}>
                  <div className="metric-label" style={{ marginBottom: 6 }}>Evidence</div>
                  <Space direction="vertical" size={6} style={{ width: '100%' }}>
                    {nodeFields.map((f) => (
                      <div key={f.id} style={{ fontSize: 12.5 }}>
                        <strong>{f.field}:</strong> {f.value} {f.citation ? <CitationChip c={f.citation} /> : null}
                      </div>
                    ))}
                  </Space>
                </div>
              ) : null}

              {TYPED_LINKS[selected] ? (
                <div style={{ marginTop: 14 }}>
                  <div className="metric-label" style={{ marginBottom: 6 }}>Typed links</div>
                  {TYPED_LINKS[selected].map((l) => (
                    <div key={l.target} style={{ fontSize: 12.5 }}><Tag>{l.rel}</Tag><span className="mono">{l.target}</span> {l.name} <span className="muted">({l.phase})</span></div>
                  ))}
                </div>
              ) : null}

              {kids.length ? (
                <div style={{ marginTop: 14 }}>
                  <div className="metric-label" style={{ marginBottom: 6 }}>Steps below ({kids.length})</div>
                  {kids.map((k) => (
                    <div key={k.id} style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 12.5, cursor: 'pointer', padding: '2px 0' }} onClick={() => setParams({ node: k.id }, { replace: true })}>
                      <StatusDot value={nodeStatus[k.id]?.status ?? 'not_started'} /><span className="mono muted">{k.id}</span>{k.name}
                    </div>
                  ))}
                </div>
              ) : null}
            </Card>
          ) : <Empty />}
        </Col>
      </Row>
    </div>
  );
}

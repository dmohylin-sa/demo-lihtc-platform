// Findings & risks (row 11): HCR threshold checks and risk detection, each cited to rule, section and program
// year and to document, page and passage; labelled by knowledge layer; full trace in a drawer.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Card, Col, Divider, Drawer, Empty, Row, Select, Space, Table, Tag, Typography } from 'antd';
import { AlertOutlined, CheckCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined, NodeIndexOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { useDeal, useDealFindings } from '../../store/hooks';
import { RULES_HCR9 } from '../../data/rules-hcr9';
import { NEW_RULE_T26 } from '../../data/ops';
import { TREE_PHASE1 } from '../../data/tree-phase1';
import { BasisLabel, FindingStatusTag, MetricCard, PageHeader, SeverityTag } from '../../components/ui';
import { CitationChip, findPassage, citeText } from '../../components/viewer';
import { getDoc, docLabel } from '../../store/selectors';
import type { Basis, Finding, FindingStatus, Rule, Severity } from '../../data/types';

const ALL_RULES: Rule[] = [...RULES_HCR9, NEW_RULE_T26];
const METHOD: Record<Finding['method'], { label: string; color: string }> = {
  'rule-based': { label: 'Rule-based', color: 'purple' },
  'model-assisted': { label: 'Model-assisted', color: 'gold' },
  calculation: { label: 'Calculation', color: 'blue' },
};

function FindingDrawer({ f, onClose }: { f: Finding | null; onClose: () => void }) {
  const navigate = useNavigate();
  const deal = useDeal();
  if (!f) return <Drawer open={false} onClose={onClose} />;
  const rules = f.ruleIds.map((id) => ALL_RULES.find((r) => r.id === id)).filter(Boolean) as Rule[];
  const node = f.nodeId ? TREE_PHASE1.find((n) => n.id === f.nodeId) : undefined;
  const reliesOnWeakSources = !f.basis.includes('deal') && !f.basis.includes('rule');
  return (
    <Drawer
      open
      onClose={onClose}
      width={760}
      title={
        <Space direction="vertical" size={4}>
          <span className="eyebrow">{f.id} · {f.category}</span>
          <span>{f.title}</span>
          <Space size={6} wrap>
            <SeverityTag value={f.severity} />
            <FindingStatusTag value={f.status} />
            <Tag color={METHOD[f.method].color}>{METHOD[f.method].label}</Tag>
            {f.basis.map((b) => <BasisLabel key={b} value={b} />)}
          </Space>
        </Space>
      }
    >
      <p style={{ fontSize: 14.5, lineHeight: 1.6 }}>{f.detail}</p>
      {f.method === 'model-assisted' ? (
        <Alert type="warning" showIcon icon={<RobotOutlined />} style={{ marginBottom: 12 }} message="Model-assisted - practitioner reviews before it leaves the platform" />
      ) : null}
      {reliesOnWeakSources ? (
        <Alert type="error" showIcon style={{ marginBottom: 12 }} message="Rests only on user-entered or external sources → routed to human review" description="Source ranking: governing document > executed project document > user-entered data > external sources." />
      ) : null}

      <Divider orientation="left" plain><strong>Rule basis</strong></Divider>
      {rules.length ? (
        <Table
          size="small"
          pagination={false}
          rowKey="id"
          dataSource={rules}
          columns={[
            { title: 'Rule', dataIndex: 'id', width: 100, render: (v) => <Tag color="purple">{v}</Tag> },
            { title: 'Text', dataIndex: 'rule', render: (v, r) => <span>{v}<br /><span className="muted" style={{ fontSize: 11.5 }}>{r.citation} · {r.sourceLayer}</span></span> },
            { title: 'Value', render: (_, r) => <span className="mono">{r.operator} {r.value} {r.unit}</span>, width: 140 },
            { title: 'Effective', dataIndex: 'effectiveDate', width: 96 },
            { title: 'Status', dataIndex: 'status', width: 86, render: (v) => <Tag color={v === 'In force' ? 'success' : v === 'Delayed' ? 'gold' : 'default'}>{v}</Tag> },
          ]}
        />
      ) : (
        <p className="muted" style={{ margin: 0 }}>{f.citation}</p>
      )}
      <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>Cited as: {f.citation}</p>

      <Divider orientation="left" plain><strong>Evidence</strong></Divider>
      {f.sources.length ? (
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          {f.sources.map((c, i) => {
            const quote = findPassage(getDoc(c.docId), c.passageId);
            return (
              <div key={i} className="panel" style={{ padding: '10px 12px' }}>
                <Space size={8} wrap>
                  <CitationChip c={c} />
                  <span className="muted" style={{ fontSize: 12 }}>{docLabel(c.docId)} · {citeText(c)}</span>
                </Space>
                {quote ? <div style={{ marginTop: 6, fontSize: 13, fontStyle: 'italic', color: 'var(--body)' }}>“{quote}”</div> : null}
                {c.cell ? <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--body)' }}>Workbook cell {c.cell} - opens with the cell highlighted.</div> : null}
              </div>
            );
          })}
        </Space>
      ) : (
        <p className="muted">Cited to the rule itself - no deal document is involved.</p>
      )}

      <Divider orientation="left" plain><strong>Process tree</strong></Divider>
      {node ? (
        <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <span><span className="mono muted">{node.id}</span> <strong>{node.name}</strong><br /><span className="muted" style={{ fontSize: 12 }}>{node.nodeType} · rule type {node.ruleType} · step class {node.stepClass} · gate {node.gate}</span></span>
          <a onClick={() => { onClose(); navigate(`/deals/${deal.id}/process?node=${node.id}`); }}><NodeIndexOutlined /> Open node</a>
        </div>
      ) : <p className="muted">Not linked to a node.</p>}

      <Divider orientation="left" plain><strong>Recommended action</strong></Divider>
      <div className="callout-gold">
        <div style={{ fontWeight: 600 }}>{f.action}</div>
        <div style={{ fontSize: 12.5, marginTop: 4 }}><UserOutlined /> {f.owner} · basis: {f.citation}</div>
      </div>
      <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 14 }}>
        The platform presents; the practitioner decides. Status changes on this finding are recorded in the audit trail with actor, time and basis.
      </Typography.Paragraph>
    </Drawer>
  );
}

export default function Findings() {
  const deal = useDeal();
  const findings = useDealFindings(deal.id);
  const [params, setParams] = useSearchParams();
  const [sev, setSev] = useState<Severity | 'all'>('all');
  const [status, setStatus] = useState<FindingStatus | 'all'>('all');
  const [method, setMethod] = useState<Finding['method'] | 'all'>('all');
  const [basis, setBasis] = useState<Basis | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(params.get('f'));

  useEffect(() => { const f = params.get('f'); if (f) setOpenId(f); }, [params]);

  const open = (s: string) => ['open', 'in review'].includes(s);
  const counts = useMemo(() => ({
    blocking: findings.filter((f) => open(f.status) && f.severity === 'blocking').length,
    advisory: findings.filter((f) => open(f.status) && f.severity === 'advisory').length,
    informational: findings.filter((f) => open(f.status) && f.severity === 'informational').length,
    passed: findings.filter((f) => f.status === 'passed' || f.status === 'resolved').length,
  }), [findings]);

  const rows = useMemo(() => findings.filter((f) =>
    (sev === 'all' || f.severity === sev) && (status === 'all' || f.status === status) && (method === 'all' || f.method === method) && (basis === 'all' || f.basis.includes(basis)),
  ), [findings, sev, status, method, basis]);

  const selected = findings.find((f) => f.id === openId) ?? null;
  const close = () => { setOpenId(null); if (params.get('f')) { params.delete('f'); setParams(params, { replace: true }); } };

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Row 11 · HCR threshold checks and risk detection"
        title="Findings & risks"
        desc="Every finding cites the rule, section and program year it rests on, and the document, page and passage that triggered it."
      />
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}><MetricCard label="Blocking" value={counts.blocking} sub="must clear before readiness" icon={<AlertOutlined />} tone={counts.blocking ? 'danger' : 'success'} /></Col>
        <Col xs={12} lg={6}><MetricCard label="Advisory" value={counts.advisory} sub="practitioner judgment" icon={<ExclamationCircleOutlined />} /></Col>
        <Col xs={12} lg={6}><MetricCard label="Informational" value={counts.informational} sub="recorded, no action" icon={<InfoCircleOutlined />} /></Col>
        <Col xs={12} lg={6}><MetricCard label="Passed or resolved" value={counts.passed} sub="threshold checks met" icon={<CheckCircleOutlined />} tone="success" /></Col>
      </Row>

      <Card
        data-tour="findings-table"
        title="Findings"
        styles={{ body: { padding: 0 } }}
        extra={
          <Space wrap size={8}>
            <Select size="small" style={{ width: 140 }} value={sev} onChange={setSev} options={[{ value: 'all', label: 'All severities' }, { value: 'blocking', label: 'Blocking' }, { value: 'advisory', label: 'Advisory' }, { value: 'informational', label: 'Informational' }]} />
            <Select size="small" style={{ width: 150 }} value={status} onChange={setStatus} options={[{ value: 'all', label: 'All statuses' }, { value: 'open', label: 'Open' }, { value: 'in review', label: 'In human review' }, { value: 'resolved', label: 'Resolved' }, { value: 'passed', label: 'Pass' }]} />
            <Select size="small" style={{ width: 150 }} value={method} onChange={setMethod} options={[{ value: 'all', label: 'All methods' }, { value: 'rule-based', label: 'Rule-based' }, { value: 'model-assisted', label: 'Model-assisted' }, { value: 'calculation', label: 'Calculation' }]} />
            <Select size="small" style={{ width: 190 }} value={basis} onChange={setBasis} options={[{ value: 'all', label: 'All knowledge layers' }, { value: 'deal', label: 'Deal evidence' }, { value: 'rule', label: 'Approved Everstead rule' }, { value: 'general', label: 'General information' }]} />
          </Space>
        }
      >
        {findings.length ? (
          <Table<Finding>
            className="clickable-rows"
            rowKey="id"
            dataSource={rows}
            pagination={false}
            onRow={(f) => ({ onClick: () => setOpenId(f.id), style: { opacity: f.status === 'resolved' ? 0.62 : 1 } })}
            columns={[
              { title: 'ID', dataIndex: 'id', width: 72, render: (v) => <span className="mono" style={{ whiteSpace: 'nowrap' }}>{v}</span> },
              {
                title: 'Finding', dataIndex: 'title', render: (v, f) => (
                  <span>
                    <strong style={{ textDecoration: f.status === 'resolved' ? 'line-through' : undefined }}>{v}</strong>
                    <br />
                    <Space size={4} wrap style={{ marginTop: 4 }}>{f.basis.map((b) => <BasisLabel key={b} value={b} />)}</Space>
                  </span>
                ),
              },
              { title: 'Severity', dataIndex: 'severity', width: 130, render: (v: Severity) => <SeverityTag value={v} /> },
              {
                title: 'Rule · section · program year', width: 260, render: (_, f) => (
                  <span>
                    {f.ruleIds.length ? <Space size={4} wrap>{f.ruleIds.map((r) => <Tag key={r} color="purple" style={{ margin: 0 }}>{r}</Tag>)}</Space> : null}
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 3 }}>{f.citation}</div>
                  </span>
                ),
              },
              { title: 'Method', dataIndex: 'method', width: 120, render: (v: Finding['method']) => <Tag color={METHOD[v].color}>{METHOD[v].label}</Tag> },
              { title: 'Sources', width: 150, render: (_, f) => <Space size={4} wrap>{f.sources.slice(0, 3).map((c, i) => <CitationChip key={i} c={c} short />)}</Space> },
              { title: 'Owner', dataIndex: 'owner', width: 140, render: (v) => <span style={{ fontSize: 12.5 }}>{v}</span> },
              { title: 'Status', dataIndex: 'status', width: 130, render: (v: FindingStatus) => <FindingStatusTag value={v} /> },
            ]}
          />
        ) : (
          <Empty style={{ padding: 40 }} description="No findings yet - rule checks run once the deal package is processed." />
        )}
      </Card>
      <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
        Knowledge layers stay apart: deal evidence, Everstead's encoded rules and general information are labelled on every finding. General information never feeds a decision until a person accepts the source.
      </p>
      <FindingDrawer f={selected} onClose={close} />
    </div>
  );
}

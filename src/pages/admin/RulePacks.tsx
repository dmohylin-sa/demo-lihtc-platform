// Rule packs without a rebuild (requirement 06): the NY HCR 9% rule table with type, citation, effective date,
// layer and status; a draft version tested against the sample deal and published as configuration.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as AntdApp, Button, Card, Col, Input, Row, Segmented, Select, Space, Steps, Table, Tabs, Tag, Tooltip, Typography } from 'antd';
import { ArrowRightOutlined, CheckCircleFilled, ExperimentOutlined, RocketOutlined, SearchOutlined, WarningFilled } from '@ant-design/icons';
import { useDemo } from '../../store/demoStore';
import { RULES_HCR9 } from '../../data/rules-hcr9';
import { NEW_RULE_T26, RULE_PACK_2026_2, RULE_PACK_VERSIONS } from '../../data/ops';
import { agentName, HARD_RULE_NODES } from '../../data/registry';
import { TREE_PHASE1 } from '../../data/tree-phase1';
import { PageHeader, RuleTypeBadge } from '../../components/ui';
import { PermButton } from '../../components/perm';
import type { Rule, RuleStatus } from '../../data/types';

const NEW_VALUES: Record<string, string> = { 'HCR-T-08e': '36,000 / 38,000', 'HCR-T-08f': '31,500 / 33,500' };

// Rules as they stand in a given version. Draft view marks changed rules "Proposed"; published marks them "In force".
function rulesFor(version: '2026.1' | '2026.2', published: boolean): Rule[] {
  if (version === '2026.1') return RULES_HCR9;
  const changed = RULES_HCR9.map((r) =>
    NEW_VALUES[r.id]
      ? { ...r, value: NEW_VALUES[r.id], effectiveDate: '2026-11-15', sourceLayer: '2026 HCR 9% Term Sheet (rev. Nov 2026)', status: (published ? 'In force' : 'Proposed') as RuleStatus }
      : r,
  );
  return [...changed, NEW_RULE_T26];
}

export function RuleStatusTag({ value }: { value: RuleStatus }) {
  if (value === 'Proposed') return <Tag style={{ background: 'var(--plum-tint)', color: 'var(--plum)', borderColor: 'var(--plum-tint-3)', marginInlineEnd: 0 }}>Proposed</Tag>;
  const color = value === 'In force' ? 'success' : value === 'Delayed' ? 'gold' : 'error';
  return <Tag color={color} style={{ marginInlineEnd: 0 }}>{value}</Tag>;
}

const TEST_RESULTS = [
  { id: 'F-10', title: 'Credit request within the NYC-metro caps', rule: 'HCR-T-08e', effect: 'Recomputed', detail: 'Per-unit cap $35,000 → $36,000; still a pass at $32,738 per unit' },
  { id: 'F-01', title: 'Sources and uses out of balance', rule: 'HCR-C-08 / T-08e', effect: 'Recomputed', detail: 'Gap-method credit still binds before either cap; recommendation unchanged' },
  { id: 'F-15', title: 'All-electric requirement (HCR-T-26)', rule: 'HCR-T-26', effect: 'New', detail: 'Recorded but not applied - status Delayed until 2027-07-01' },
];

export default function RulePacks() {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const published = useDemo((s) => s.rulePackPublished);
  const tested = useDemo((s) => s.rulePackTested);
  const testRulePack = useDemo((s) => s.testRulePack);
  const publishRulePack = useDemo((s) => s.publishRulePack);
  const isPublished = published === '2026.2';

  const [view, setView] = useState<'2026.1' | '2026.2'>(isPublished ? '2026.2' : '2026.1');
  const [category, setCategory] = useState<string>('all');
  const [layer, setLayer] = useState<string>('All layers');
  const [q, setQ] = useState('');
  const [testing, setTesting] = useState(false);

  const rules = useMemo(() => rulesFor(view, isPublished), [view, isPublished]);
  const categories = useMemo(() => Array.from(new Set(rules.map((r) => r.category))), [rules]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rules.filter((r) =>
      (category === 'all' || r.category === category) &&
      (layer === 'All layers' || r.layer === layer) &&
      (!term || [r.id, r.rule, r.citation, r.paramKey].some((x) => x.toLowerCase().includes(term))));
  }, [rules, category, layer, q]);

  const runTest = () => {
    setTesting(true);
    setTimeout(() => {
      testRulePack();
      setTesting(false);
      message.success('Draft 2026.2 tested against Harlow Commons (QA copy): 3 findings affected, 0 errors');
    }, 1300);
  };
  const publish = () => {
    publishRulePack();
    setView('2026.2');
    message.success('Rule pack 2026.2 published - no rebuild, no redeployment');
  };

  const hardRules = TREE_PHASE1.filter((n) => HARD_RULE_NODES.includes(n.id));
  const step = isPublished ? 3 : tested ? 1 : 0;

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Admin console · Everstead staff"
        title="Rule packs"
        desc="Everstead staff create and update rules and test them against a sample deal without a code change or redeployment. Hard rules are encoded once; program rules switch on per deal. Conflicts between rules are flagged, never resolved silently."
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} xl={14}>
          <Card title="NY HCR 9% LIHTC · versions" style={{ height: '100%' }}>
            <Table
              rowKey="version"
              size="small"
              pagination={false}
              dataSource={[
                { version: '2026.2', date: isPublished ? 'Today' : 'Draft', rules: 91, source: RULE_PACK_2026_2.source, status: isPublished ? 'Published' : 'Draft' },
                ...RULE_PACK_VERSIONS.map((v) => ({ ...v, status: v.version === '2026.1' && isPublished ? 'Superseded' : v.status })),
              ]}
              columns={[
                { title: 'Version', dataIndex: 'version', render: (v: string) => <strong className="mono">{v}</strong> },
                { title: 'Date', dataIndex: 'date', render: (v: string) => <span style={{ whiteSpace: 'nowrap' }}>{v}</span> },
                { title: 'Rules', dataIndex: 'rules', align: 'right' },
                { title: 'Source', dataIndex: 'source', render: (v: string) => <span style={{ fontSize: 12.5 }}>{v}</span> },
                { title: 'Status', dataIndex: 'status', render: (v: string) => <Tag color={v === 'Published' ? 'success' : v === 'Draft' ? 'gold' : 'default'}>{v}</Tag> },
              ]}
            />
            <div style={{ marginTop: 14 }}>
              <div className="metric-label" style={{ marginBottom: 6 }}>Rule types across the full tree</div>
              <Space size={[12, 8]} wrap>
                <span><RuleTypeBadge value="Hard" /> <strong>179</strong> hard rules</span>
                <span><RuleTypeBadge value="Program" /> <strong>740</strong> program-specific</span>
                <span><RuleTypeBadge value="Extract" /> <strong>105</strong> extraction slots</span>
                <span><RuleTypeBadge value="Process" /> <strong>2,379</strong> process steps</span>
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title={<span><span className="eyebrow" style={{ display: 'block' }}>Draft version</span>{RULE_PACK_2026_2.version} · {RULE_PACK_2026_2.title}</span>} data-tour="rule-draft" style={{ height: '100%' }}>
            <Steps
              size="small"
              direction="vertical"
              current={step}
              items={[
                { title: 'Test against the sample deal', description: 'Run the draft on a QA copy of Harlow Commons and diff the findings.' },
                { title: 'Publish', description: 'Configuration only - no code change, no redeployment.' },
                { title: 'Deals in flight', description: 'Stay pinned to their version and get a re-run banner.' },
              ]}
            />
            <Space direction="vertical" size={6} style={{ width: '100%', margin: '4px 0 12px' }}>
              {RULE_PACK_2026_2.changes.map((c) => (
                <div key={c.ruleId} style={{ fontSize: 12.5 }}>
                  <Tag color={c.kind === 'added' ? 'purple' : 'gold'} style={{ marginRight: 6 }}>{c.kind === 'added' ? 'Added' : 'Changed'}</Tag>
                  <span className="mono">{c.ruleId}</span> · {c.kind === 'added' ? c.now : <span><span className="muted">{c.was}</span> → {c.now}</span>}
                </div>
              ))}
            </Space>
            {tested || isPublished ? (
              <Table
                className="fade-in"
                rowKey="id"
                size="small"
                pagination={false}
                style={{ marginBottom: 12 }}
                dataSource={TEST_RESULTS}
                title={() => <span style={{ fontSize: 12.5 }}><CheckCircleFilled style={{ color: '#389E0D' }} /> Harlow Commons (QA copy) · 3 findings affected · 0 errors</span>}
                columns={[
                  { title: 'Finding', dataIndex: 'id', width: 64, render: (v: string) => <span className="mono">{v}</span> },
                  { title: 'Effect', dataIndex: 'effect', width: 100, render: (v: string) => <Tag color={v === 'New' ? 'purple' : 'processing'}>{v}</Tag> },
                  { title: 'Detail', dataIndex: 'detail', render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span> },
                ]}
              />
            ) : null}
            {isPublished ? (
              <div className="callout-gold fade-in">
                <CheckCircleFilled style={{ color: '#389E0D', marginRight: 6 }} />
                Published - deals in flight stay pinned and get a re-run banner.
                <Button type="link" size="small" onClick={() => navigate('/deals/harlow/findings')}>Open Harlow Commons findings <ArrowRightOutlined /></Button>
              </div>
            ) : (
              <Space>
                <PermButton cap="admin" denied="Everstead staff only" icon={<ExperimentOutlined />} loading={testing} onClick={runTest} type={tested ? 'default' : 'primary'}>
                  {tested ? 'Re-run test' : 'Test against sample deal'}
                </PermButton>
                <Tooltip title={tested ? '' : 'Test the draft against the sample deal first'}>
                  <span>
                    <PermButton cap="admin" denied="Everstead staff only" type="primary" icon={<RocketOutlined />} disabled={!tested} onClick={publish}>Publish 2026.2</PermButton>
                  </span>
                </Tooltip>
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }} title={<span><WarningFilled style={{ color: '#D48806', marginRight: 8 }} />Conflicts flagged, never resolved silently</span>}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} lg={8}>
            <div className="panel">
              <div className="metric-label">HCR-T-16 · QAP 9 NYCRR 2040.3(e)(16)</div>
              <div style={{ fontWeight: 600, marginTop: 4 }}>Regulatory agreement term ≥ 30 years</div>
            </div>
          </Col>
          <Col xs={24} lg={8}>
            <div className="panel">
              <div className="metric-label">2026 HCR 9% Term Sheet (June 2026)</div>
              <div style={{ fontWeight: 600, marginTop: 4 }}>Minimum raised to 50 years</div>
            </div>
          </Col>
          <Col xs={24} lg={8}>
            <div style={{ fontSize: 13 }}>
              <Tag color="success" style={{ marginBottom: 6 }}>Resolved by documented rule</Tag>
              <div>Layering rule: the agency regulation sets the floor; the annual term sheet can raise it. Rule value: <strong>50 years</strong>.</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Acknowledged by Everstead staff (Jordan Ellis) · Oct 8, 2026</div>
            </div>
          </Col>
        </Row>
      </Card>

      <Card data-tour="rule-table" styles={{ body: { paddingTop: 8 } }}>
        <Tabs
          items={[
            {
              key: 'table',
              label: `Rule table (${rules.length})`,
              children: (
                <>
                  <Space wrap style={{ marginBottom: 12 }}>
                    <Segmented
                      value={view}
                      onChange={(v) => setView(v as '2026.1' | '2026.2')}
                      options={isPublished
                        ? [{ value: '2026.2', label: '2026.2 (published)' }, { value: '2026.1', label: '2026.1 (superseded)' }]
                        : [{ value: '2026.1', label: '2026.1 (published)' }, { value: '2026.2', label: '2026.2 (draft)' }]}
                    />
                    <Select value={category} onChange={setCategory} style={{ width: 180 }} options={[{ value: 'all', label: 'All categories' }, ...categories.map((c) => ({ value: c, label: c }))]} />
                    <Segmented value={layer} onChange={(v) => setLayer(v as string)} options={['All layers', 'Regulation', 'Term sheet']} />
                    <Input allowClear prefix={<SearchOutlined />} placeholder="Search rule, citation or key" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 260 }} />
                  </Space>
                  <Table<Rule>
                    rowKey="id"
                    size="small"
                    dataSource={filtered}
                    pagination={{ pageSize: 15, showSizeChanger: false }}
                    scroll={{ x: 1500 }}
                    rowClassName={(r) => (NEW_VALUES[r.id] && view === '2026.2') || r.id === 'HCR-T-26' ? 'fade-in' : ''}
                    columns={[
                      { title: 'Rule ID', dataIndex: 'id', width: 100, fixed: 'left', render: (v: string) => <strong className="mono">{v}</strong> },
                      { title: 'Category', dataIndex: 'category', width: 110 },
                      { title: 'Citation', dataIndex: 'citation', width: 190, render: (v: string) => <span style={{ fontSize: 12.5 }}>{v}</span> },
                      {
                        title: 'Rule', dataIndex: 'rule', width: 280, ellipsis: { showTitle: false },
                        render: (v: string) => <Tooltip title={v} placement="topLeft" styles={{ root: { maxWidth: 420 } }}><span>{v}</span></Tooltip>,
                      },
                      { title: 'Parameter key', dataIndex: 'paramKey', width: 230, render: (v: string) => (v ? <span className="mono">{v}</span> : <span className="muted">-</span>) },
                      { title: 'Op.', dataIndex: 'operator', width: 80, render: (v: string) => <span className="mono">{v}</span> },
                      {
                        title: 'Value', dataIndex: 'value', width: 150,
                        render: (v: string, r) => (NEW_VALUES[r.id] && view === '2026.2' ? <span style={{ background: 'var(--gold-fill)', padding: '1px 4px', borderRadius: 4, fontWeight: 600 }}>{v}</span> : v),
                      },
                      { title: 'Unit', dataIndex: 'unit', width: 120, render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span> },
                      { title: 'Layer', dataIndex: 'layer', width: 110, render: (v: string) => <Tag color={v === 'Regulation' ? 'purple' : 'gold'}>{v}</Tag> },
                      { title: 'Effective', dataIndex: 'effectiveDate', width: 105, render: (v: string) => <span className="mono">{v}</span> },
                      { title: 'Status', dataIndex: 'status', width: 100, render: (v: RuleStatus) => <RuleStatusTag value={v} /> },
                      {
                        title: 'Validation', dataIndex: 'validation', width: 140,
                        render: (v: string) => (
                          <Tooltip title={v}>
                            {v.startsWith('Source-verified') ? <Tag color="success">Source-verified</Tag> : <Tag color="warning">Layer value - confirm</Tag>}
                          </Tooltip>
                        ),
                      },
                      { title: 'Owning agent', dataIndex: 'agent', width: 200, render: (v: string) => <span style={{ fontSize: 12.5 }}><span className="mono muted">{v}</span> {agentName(v)}</span> },
                    ]}
                  />
                </>
              ),
            },
            {
              key: 'hard',
              label: `Hard rules (encoded once) · ${hardRules.length} in Phase 1`,
              children: (
                <>
                  <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
                    Hard rules are binding by statute, code or regulation regardless of funding. They are encoded once, with citation and effective date, and watched for change. These are the Phase 1 hard-rule nodes in tree v3.6.1.
                  </Typography.Paragraph>
                  <Table
                    rowKey="id"
                    size="small"
                    pagination={false}
                    dataSource={hardRules}
                    columns={[
                      { title: 'Node', dataIndex: 'id', width: 90, render: (v: string) => <strong className="mono">{v}</strong> },
                      { title: 'Process step', dataIndex: 'name' },
                      { title: 'Rule type', dataIndex: 'ruleType', width: 110, render: (v: string) => <RuleTypeBadge value={v} /> },
                      { title: 'Rule basis', dataIndex: 'ruleBasis', width: 240, render: (v: string | null) => <span style={{ fontSize: 12.5 }}>{v ?? '-'}</span> },
                      { title: 'Owning agent', dataIndex: 'primary', width: 220, render: (v: string) => <span style={{ fontSize: 12.5 }}><span className="mono muted">{v}</span> {agentName(v)}</span> },
                    ]}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}

// Model operations: pinned model versions behind a gateway, versioned prompts, golden-set accuracy and
// repeatability runs, and the running cost per active deal (requirement 10). In the Today lens: the one model called
// directly today, known-answer evals per agent (only intake gates CI), and the stub spend dashboard.
import { Card, Col, Row, Space, Table, Tag } from 'antd';
import { CheckCircleFilled, CloseCircleOutlined, DollarOutlined, ExperimentOutlined, PushpinOutlined, RobotOutlined } from '@ant-design/icons';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import { COST_PER_DEAL, GOLDEN_RUNS, MODEL_GATEWAY, PROMPTS, TOKEN_USAGE } from '../../data/ops';
import { MetricCard, PageHeader } from '../../components/ui';
import { CapChip, TodayGate, useToday } from '../../components/today';
import { CAPS, EVALS } from '../../data/currentState';

const TODAY_GATEWAY = [
  { role: 'All four agents', model: 'One hosted LLM', via: "The provider's API, called directly", notes: 'Schema-constrained output, re-validated in code; the platform adds document references' },
];

export default function ModelOps() {
  const today = useToday();
  const monthly = COST_PER_DEAL.reduce((a, c) => a + c.monthly, 0);
  const latest = GOLDEN_RUNS[0];
  const chart = [...GOLDEN_RUNS].reverse().map((r) => ({ run: r.run, field: r.fieldAccuracy, citation: r.citationAccuracy }));
  const maxCost = Math.max(...COST_PER_DEAL.map((c) => c.monthly));

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Admin console · Everstead staff"
        title="Model operations"
        cap="ai.model"
        desc="Model upgrades only after a golden-set run; repeatability is acceptance test AT-1. Prompts and retrieval logic are versioned and auditable, and every call is metered per deal."
      />
      {today ? (
        <Card title={<span><ExperimentOutlined /> Known-answer evals per agent <CapChip cap="testing.evals" style={{ marginLeft: 6 }} /></span>} extra={<span className="muted" style={{ fontSize: 12 }}>Direction: {CAPS['testing.evals'].position}</span>} styles={{ body: { padding: 0 } }} style={{ marginBottom: 16 }}>
          <Table
            rowKey="agent"
            pagination={false}
            dataSource={EVALS}
            columns={[
              { title: 'Agent', render: (_, e) => <span><span className="mono muted">{e.agent}</span> <strong>{e.name}</strong></span> },
              { title: 'Known-answer set', dataIndex: 'dataset' },
              { title: 'Gates CI', dataIndex: 'ci', align: 'center', render: (v: boolean) => (v ? <Tag color="success" icon={<CheckCircleFilled />}>Yes</Tag> : <Tag icon={<CloseCircleOutlined />}>Run by hand</Tag>) },
              { title: 'Note', dataIndex: 'note', render: (v?: string) => <span style={{ fontSize: 12.5 }}>{v ?? '-'}</span> },
            ]}
          />
          <div className="muted" style={{ fontSize: 12, padding: '10px 16px' }}>{CAPS['testing.ci'].today} Release 1 adds client-authored cases and a release gate that blocks failing changes.</div>
        </Card>
      ) : null}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}><TodayGate cap="testing.goldenSet" chip="none"><MetricCard label="Field accuracy" value={`${latest.fieldAccuracy}%`} sub={`golden set ${latest.run} · ${latest.fields.toLocaleString('en-US')} fields`} icon={<ExperimentOutlined />} tone="primary" /></TodayGate></Col>
        <Col xs={12} lg={6}><TodayGate cap="testing.goldenSet" chip="none"><MetricCard label="Citation accuracy" value={`${latest.citationAccuracy}%`} sub="document, page and passage correct" icon={<CheckCircleFilled />} tone="success" /></TodayGate></Col>
        <Col xs={12} lg={6}>
          {today
            ? <TodayGate cap="agents.repeatability"><MetricCard label="Repeatability" value="Varies" sub="findings differ across repeat uploads" icon={<PushpinOutlined />} tone="danger" /></TodayGate>
            : <MetricCard label="Repeatability" value={latest.repeatability.split(' ')[0]} sub="identical runs, pinned models" icon={<PushpinOutlined />} />}
        </Col>
        <Col xs={12} lg={6}><TodayGate cap="ai.spend"><MetricCard label="Cost per active deal" value={`$${monthly}`} sub="per month · illustrative" icon={<DollarOutlined />} /></TodayGate></Col>
      </Row>

      {today ? (
        <Card title={<span><RobotOutlined /> Model today <CapChip cap="ai.adapter" style={{ marginLeft: 6 }} /></span>} extra={<span className="muted" style={{ fontSize: 12 }}>Direction: {CAPS['ai.model'].position}</span>} styles={{ body: { padding: 0 } }} style={{ marginBottom: 16 }}>
          <Table
            rowKey="role"
            pagination={false}
            dataSource={TODAY_GATEWAY}
            columns={[
              { title: 'Role', dataIndex: 'role', render: (v: string) => <strong>{v}</strong> },
              { title: 'Model', dataIndex: 'model', render: (v: string) => <span className="mono">{v}</span> },
              { title: 'Called via', dataIndex: 'via' },
              { title: 'Notes', dataIndex: 'notes', render: (v: string) => <span style={{ fontSize: 12.5 }}>{v}</span> },
            ]}
          />
          <div className="muted" style={{ fontSize: 12, padding: '10px 16px' }}>{CAPS['ai.adapter'].today} Release 1 adds a gateway that pins a model and version per role - shown in the Release 1 target view.</div>
        </Card>
      ) : (
      <Card title={<span><RobotOutlined /> Model gateway</span>} styles={{ body: { padding: 0 } }} style={{ marginBottom: 16 }}>
        <Table
          rowKey="role"
          pagination={false}
          dataSource={MODEL_GATEWAY}
          columns={[
            { title: 'Role', dataIndex: 'role', render: (v: string) => <strong>{v}</strong> },
            { title: 'Model', dataIndex: 'model', render: (v: string) => <span className="mono">{v}</span> },
            { title: 'Version', dataIndex: 'version', render: (v: string) => <span className="mono">{v}</span> },
            { title: 'Pinned', dataIndex: 'pinned', align: 'center', render: (v: boolean) => (v ? <Tag color="purple" icon={<PushpinOutlined />}>Pinned</Tag> : <Tag>Floating</Tag>) },
            { title: 'Region', dataIndex: 'region', render: (v: string) => <span className="mono">{v}</span> },
            { title: 'Notes', dataIndex: 'notes', render: (v: string) => <span style={{ fontSize: 12.5 }}>{v}</span> },
          ]}
        />
      </Card>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} xl={13}>
          <Card title={<span>Versioned prompts <CapChip cap="ai.promptVersions" style={{ marginLeft: 6 }} /></span>} styles={{ body: { padding: 0 } }} style={{ height: '100%' }}>
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={PROMPTS}
              columns={[
                { title: 'Prompt', dataIndex: 'id', render: (v: string) => <span className="mono">{v}</span> },
                { title: 'Version', dataIndex: 'version', render: (v: string) => <Tag>{v}</Tag> },
                { title: 'Updated', dataIndex: 'updated', render: (v: string) => <span className="mono">{v}</span> },
                { title: 'Golden set', dataIndex: 'goldenAccuracy' },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={11}>
          <TodayGate cap="testing.goldenSet" fill>
          <Card title="Golden-set accuracy by run" style={{ height: '100%' }}>
            <div style={{ height: 230 }}>
              <ResponsiveContainer>
                <LineChart data={chart} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke="#ECE3DF" strokeDasharray="3 3" />
                  <XAxis dataKey="run" tick={{ fontSize: 12, fill: '#6F6368' }} />
                  <YAxis domain={[94, 100]} tick={{ fontSize: 12, fill: '#6F6368' }} unit="%" />
                  <RTooltip formatter={(v: number) => `${v}%`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="field" name="Field accuracy" stroke="#521B3A" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="citation" name="Citation accuracy" stroke="#C9A227" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          </TodayGate>
        </Col>
      </Row>

      <TodayGate cap="testing.goldenSet" chip="none">
      <Card title="Golden-set runs" styles={{ body: { padding: 0 } }} style={{ marginBottom: 16 }}>
        <Table
          rowKey="run"
          pagination={false}
          dataSource={GOLDEN_RUNS}
          columns={[
            { title: 'Run', dataIndex: 'run', render: (v: string) => <strong className="mono">{v}</strong> },
            { title: 'Date', dataIndex: 'date', render: (v: string) => <span className="mono" style={{ whiteSpace: 'nowrap' }}>{v}</span> },
            { title: 'Documents', dataIndex: 'docs', align: 'right' },
            { title: 'Fields', dataIndex: 'fields', align: 'right', render: (v: number) => v.toLocaleString('en-US') },
            { title: 'Field accuracy', dataIndex: 'fieldAccuracy', align: 'right', render: (v: number) => `${v}%` },
            { title: 'Citation accuracy', dataIndex: 'citationAccuracy', align: 'right', render: (v: number) => `${v}%` },
            { title: 'Repeatability', dataIndex: 'repeatability' },
            { title: 'Status', dataIndex: 'status', render: (v: string) => <Tag color={v === 'Passed' ? 'success' : 'gold'}>{v}</Tag> },
          ]}
        />
      </Card>
      </TodayGate>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={11}>
          <TodayGate cap="ai.spend" fill>
          <Card title="Cost per active deal · per month" extra={<Tag>Illustrative</Tag>} style={{ height: '100%' }}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              {COST_PER_DEAL.map((c) => (
                <div key={c.item}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>{c.item}</span><strong>${c.monthly}</strong></div>
                  <div style={{ height: 8, background: 'var(--panel)', borderRadius: 6, marginTop: 4 }}>
                    <div style={{ width: `${(c.monthly / maxCost) * 100}%`, height: '100%', background: 'var(--plum)', borderRadius: 6 }} />
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8, fontWeight: 700 }}>
                <span>Total per active deal</span><span>${monthly} / month</span>
              </div>
            </Space>
          </Card>
          </TodayGate>
        </Col>
        <Col xs={24} xl={13}>
          <Card title={<span>Token usage this month <CapChip cap="ai.tokens" style={{ marginLeft: 6 }} /></span>} extra={<Tag>Illustrative</Tag>} styles={{ body: { padding: 0 } }} style={{ height: '100%' }}>
            <Table
              rowKey="deal"
              pagination={false}
              dataSource={TOKEN_USAGE}
              columns={[
                { title: 'Deal', dataIndex: 'deal', render: (v: string) => <strong>{v}</strong> },
                { title: 'Input tokens', dataIndex: 'input', align: 'right', render: (v: number) => `${v}M` },
                { title: 'Output tokens', dataIndex: 'output', align: 'right', render: (v: number) => `${v}M` },
                { title: 'Model cost', dataIndex: 'cost', align: 'right', render: (v: number) => `$${v.toFixed(2)}` },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

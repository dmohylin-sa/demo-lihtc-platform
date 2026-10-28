// Agent runs: the four-agent chain of today's platform (intake 002 → underwriting audit 009 → risk register 010 →
// executive summary 015), one audit row per agent run, retries and the dead-letter queue. In the Today lens it also
// replays the close-out run and shows the repeat-upload known issue.
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Col, Empty, Progress, Row, Space, Table, Tag } from 'antd';
import {
  CheckCircleFilled, ClockCircleOutlined, DollarOutlined, InboxOutlined, LoadingOutlined, NodeExpandOutlined, PlayCircleOutlined,
  ReloadOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { useDeal } from '../../store/hooks';
import { MetricCard, PageHeader, StageRail, type RailStage } from '../../components/ui';
import { CapChip, ExceptionTag, useToday } from '../../components/today';
import { CLOSE_OUT } from '../../data/currentState';
import { CHAIN, CLOSE_OUT_STEPS, HARLOW_RUNS, REPEAT_UPLOADS, agentName, modelFor, type AgentRun, type AgentStep, type StepStatus } from '../../data/agentRuns';

const STEP_STATUS: Record<StepStatus, { label: string; color: string }> = {
  succeeded: { label: 'Succeeded', color: 'success' },
  retried: { label: 'Retried · succeeded', color: 'gold' },
  'dead-letter': { label: 'Dead-letter queue', color: 'error' },
  skipped: { label: 'Skipped', color: 'default' },
};
const RUN_COLOR: Record<AgentRun['status'], string> = {
  Succeeded: 'success',
  'Succeeded after retry': 'gold',
  'Dead-lettered · partial results saved': 'error',
  'Re-driven from dead-letter queue': 'processing',
};

const mmss = (s: number) => `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, '0')} s`;
const runTotals = (r: AgentRun) => r.steps.reduce((a, s) => ({ seconds: a.seconds + s.seconds, tokens: a.tokens + s.tokensIn + s.tokensOut, cost: a.cost + s.cost }), { seconds: 0, tokens: 0, cost: 0 });
const CLOSE_TOTAL = CLOSE_OUT_STEPS.reduce((a, s) => a + s.seconds, 0);

// Replays the close-out run: about 4 minutes compressed to about 12 s. Visual only.
function CloseOutReplay() {
  const [t, setT] = useState(CLOSE_TOTAL);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  const start = () => {
    setT(0);
    setRunning(true);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setT((v) => {
      if (v + 1 >= CLOSE_TOTAL) { if (timer.current) clearInterval(timer.current); setRunning(false); return CLOSE_TOTAL; }
      return v + 1;
    }), 50);
  };

  let before = 0;
  const rows = CLOSE_OUT_STEPS.map((s) => {
    const done = Math.max(0, Math.min(s.seconds, t - before));
    before += s.seconds;
    return { ...s, pct: Math.round((done / s.seconds) * 100) };
  });
  const frac = (s: typeof rows[number]) => s.pct / 100;
  const tokens = Math.round(rows.reduce((a, s) => a + (s.tokensIn + s.tokensOut) * frac(s), 0));
  const cost = rows.reduce((a, s) => a + s.cost * frac(s), 0);
  const finished = t >= CLOSE_TOTAL;

  return (
    <Card
      title={<Space><span>Close-out run</span><Tag>Tier 1 acceptance test</Tag></Space>}
      extra={<Button icon={finished ? <ReloadOutlined /> : <PlayCircleOutlined />} onClick={start} disabled={running}>{finished ? 'Replay the run' : 'Replaying…'}</Button>}
      style={{ marginBottom: 16 }}
    >
      <p style={{ marginTop: 0, color: 'var(--body)' }}>{CLOSE_OUT.what} {CLOSE_OUT.smoke}</p>
      <Row gutter={[16, 12]} style={{ marginBottom: 12 }}>
        <Col xs={8}><div className="metric-label">Elapsed</div><div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22 }}>{mmss(t)}</div></Col>
        <Col xs={8}><div className="metric-label">Tokens</div><div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22 }}>{tokens.toLocaleString('en-US')}</div></Col>
        <Col xs={8}><div className="metric-label">Model cost</div><div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22 }}>${cost.toFixed(2)}</div></Col>
      </Row>
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        {rows.map((s) => {
          const active = running && s.pct > 0 && s.pct < 100;
          return (
            <div key={s.agent} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span className="metric-chip" style={{ width: 34, height: 34, fontSize: 12, fontWeight: 700, background: s.pct >= 100 ? '#F0F8F2' : 'var(--plum-tint)', color: s.pct >= 100 ? '#389E0D' : 'var(--plum)' }}>
                {s.pct >= 100 ? <CheckCircleFilled /> : active ? <LoadingOutlined /> : s.agent}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong style={{ fontSize: 13.5 }}>{s.agent} · {agentName(s.agent)}</strong>
                  <span className="muted" style={{ fontSize: 12 }}>{s.pct >= 100 ? s.line : `${s.seconds} s · ${(s.tokensIn + s.tokensOut).toLocaleString('en-US')} tokens`}</span>
                </div>
                <Progress percent={s.pct} size="small" strokeColor="#521B3A" showInfo={false} style={{ margin: 0 }} />
              </div>
            </div>
          );
        })}
      </Space>
      {finished ? (
        <Alert
          style={{ marginTop: 14 }}
          type="success"
          showIcon
          message={`All four agents in ${CLOSE_OUT.duration} · ${CLOSE_OUT.tokens} tokens · ${CLOSE_OUT.cost}`}
          description="The planted DSCR error was caught by the audit and pointed to its cell."
        />
      ) : null}
      <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>Totals approximate; the split across the four agents is illustrative.</div>
    </Card>
  );
}

function StepTable({ steps, today }: { steps: AgentStep[]; today: boolean }) {
  return (
    <Table<AgentStep>
      size="small"
      rowKey="agent"
      pagination={false}
      dataSource={steps}
      columns={[
        { title: 'Agent', dataIndex: 'agent', render: (v: AgentStep['agent']) => <span><span className="mono muted">{v}</span> <strong>{agentName(v)}</strong></span> },
        { title: 'Model', render: (_, s) => <span className="mono" style={{ whiteSpace: 'nowrap' }}>{modelFor(s.agent, today)}</span> },
        { title: 'Prompt version', dataIndex: 'prompt', render: (v: string) => <span className="mono">{v}</span> },
        { title: 'Start → end', render: (_, s) => <span className="mono" style={{ whiteSpace: 'nowrap' }}>{s.start} → {s.end}</span> },
        { title: 'Tokens in / out', align: 'right', render: (_, s) => <span className="mono">{s.tokensIn.toLocaleString('en-US')} / {s.tokensOut.toLocaleString('en-US')}</span> },
        { title: 'Cost', dataIndex: 'cost', align: 'right', render: (v: number) => <span className="mono">${v.toFixed(3)}</span> },
        { title: 'Attempts', dataIndex: 'attempts', align: 'center' },
        { title: 'Status', dataIndex: 'status', render: (v: StepStatus) => <Tag color={STEP_STATUS[v].color}>{STEP_STATUS[v].label}</Tag> },
        { title: 'Output · payload stored', dataIndex: 'output', render: (v: string) => <span style={{ fontSize: 12.5 }}>{v}</span> },
      ]}
    />
  );
}

export default function AgentRuns() {
  const deal = useDeal();
  const today = useToday();
  const runs = HARLOW_RUNS.filter((r) => r.dealId === deal.id);
  const latest = runs[runs.length - 1];
  const totals = runs.map(runTotals);
  const tokens = totals.reduce((a, r) => a + r.tokens, 0);
  const cost = totals.reduce((a, r) => a + r.cost, 0);
  const deadLettered = runs.filter((r) => r.steps.some((s) => s.status === 'dead-letter')).length;

  const rail: RailStage[] = CHAIN.map((a) => ({ key: a.id, label: `${a.id} · ${a.name}`, state: 'done', mark: a.id, hint: a.does }));

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Agent chain"
        title="Agent runs"
        cap="agents.chain"
        desc="One upload runs four agents in sequence. Every agent run writes an audit row: model, prompt version, timestamps, tokens and payloads. Failed runs retry with backoff, then go to a dead-letter queue with partial results saved."
      />

      <Card
        title={<span><NodeExpandOutlined /> The chain</span>}
        extra={today ? <Space size={6}><span className="muted" style={{ fontSize: 12 }}>Everstead's position: evaluate, then move onto a shared harness</span><CapChip cap="agents.harness" /></Space> : null}
        style={{ marginBottom: 16 }}
      >
        <StageRail stages={rail} />
      </Card>

      {runs.length ? (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={12} lg={6}><MetricCard label="Runs on this deal" value={runs.length} sub={`latest ${latest.started.slice(0, 10)}`} icon={<ThunderboltOutlined />} tone="primary" /></Col>
            <Col xs={12} lg={6}><MetricCard label="Tokens" value={tokens.toLocaleString('en-US')} sub="all runs, in + out" icon={<ClockCircleOutlined />} /></Col>
            <Col xs={12} lg={6}><MetricCard label="Model cost" value={`$${cost.toFixed(2)}`} sub="all runs" icon={<DollarOutlined />} /></Col>
            <Col xs={12} lg={6}><MetricCard label="Dead-lettered" value={deadLettered} sub="re-driven after review" icon={<InboxOutlined />} tone={deadLettered ? 'danger' : 'success'} /></Col>
          </Row>

          {today ? <CloseOutReplay /> : null}

          <Card title="Run history · one audit row per agent run" extra={<Tag>Illustrative</Tag>} styles={{ body: { padding: 0 } }} style={{ marginBottom: 16 }}>
            <Table<AgentRun>
              rowKey="id"
              pagination={false}
              dataSource={[...runs].reverse()}
              expandable={{ expandedRowRender: (r) => <div style={{ padding: '4px 0' }}><StepTable steps={r.steps} today={today} /></div>, defaultExpandedRowKeys: ['RUN-0423'] }}
              columns={[
                { title: 'Run', dataIndex: 'id', render: (v: string) => <strong className="mono" style={{ whiteSpace: 'nowrap' }}>{v}</strong> },
                { title: 'Trigger', dataIndex: 'trigger' },
                { title: 'Started', dataIndex: 'started', render: (v: string) => <span className="mono" style={{ whiteSpace: 'nowrap' }}>{v}</span> },
                { title: 'Duration', render: (_, r) => <span className="mono">{mmss(runTotals(r).seconds)}</span> },
                { title: 'Tokens', align: 'right', render: (_, r) => <span className="mono">{runTotals(r).tokens.toLocaleString('en-US')}</span> },
                { title: 'Cost', align: 'right', render: (_, r) => <span className="mono">${runTotals(r).cost.toFixed(2)}</span> },
                { title: 'Status', dataIndex: 'status', render: (v: AgentRun['status']) => <Tag color={RUN_COLOR[v]}>{v}</Tag> },
              ]}
            />
          </Card>

          {today ? (
            <Card title={<Space><span>Repeat uploads of one real document</span><ExceptionTag id="E2" /></Space>} style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} md={10}>
                  <div style={{ height: 180 }}>
                    <ResponsiveContainer>
                      <BarChart data={REPEAT_UPLOADS} margin={{ top: 18, right: 8, left: -18, bottom: 0 }}>
                        <CartesianGrid stroke="#ECE3DF" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="attempt" tick={{ fontSize: 12, fill: '#6F6368' }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6F6368' }} />
                        <Bar dataKey="findings" fill="#521B3A" radius={[6, 6, 0, 0]} barSize={42}>
                          <LabelList dataKey="findings" position="top" style={{ fontSize: 12, fontWeight: 700, fill: '#2B2026' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Col>
                <Col xs={24} md={14}>
                  <p style={{ marginTop: 0 }}>The same real document, uploaded several times, returned a different number of findings each time (counts here are illustrative). Fixing this comes before building on the agents.</p>
                  <p className="muted" style={{ marginBottom: 0 }}>Release 1 acceptance test AT-1 asks for identical findings and citations across 20 runs of the same package with pinned models and prompts.</p>
                </Col>
              </Row>
            </Card>
          ) : null}
        </>
      ) : (
        <Card><Empty description="No agent runs on this deal yet - the chain runs when a document is uploaded." /></Card>
      )}
    </div>
  );
}

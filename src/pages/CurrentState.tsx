// Current platform: what the client's Tier 1 platform does today, as described to us, set against what Release 1
// adds. The capability matrix is the same registry that drives the Today lens across the app.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card, Col, Row, Segmented, Space, Steps, Table, Tag } from 'antd';
import {
  ArrowRightOutlined, CheckCircleFilled, ClockCircleOutlined, CodeOutlined, DeploymentUnitOutlined, ExclamationCircleOutlined,
  EyeOutlined, FlagOutlined,
} from '@ant-design/icons';
import { useDemo } from '../store/demoStore';
import { MetricCard } from '../components/ui';
import {
  AREAS, CAPS, CAP_IDS, CAP_STATUS, CLOSE_OUT, DECIDED, EXCEPTIONS, MILESTONES, NOT_STARTED, POSITIONS, SOURCE_NOTE, STACK, SUMMARY,
  type CapDef, type CapId, type CapStatus, type ExceptionId,
} from '../data/currentState';

type CapRow = CapDef & { id: CapId };
const ROWS: CapRow[] = CAP_IDS.map((id) => ({ id, ...CAPS[id] }));
const STATUSES = Object.keys(CAP_STATUS) as CapStatus[];

const StatusPill = ({ status }: { status: CapStatus }) => <span className={`today-chip today-chip--${status}`} style={{ cursor: 'default' }}>{CAP_STATUS[status].label}</span>;

export default function CurrentState() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const focus = params.get('cap') as CapId | null;
  const mode = useDemo((s) => s.mode);
  const setMode = useDemo((s) => s.setMode);
  const [filter, setFilter] = useState<CapStatus | 'all'>('all');

  // A chip elsewhere in the app links here with ?cap=<id>: show every status and scroll to that row.
  useEffect(() => {
    if (!focus) return;
    setFilter('all');
    const t = setTimeout(() => document.querySelector(`[data-row-key="${focus}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
    return () => clearTimeout(t);
  }, [focus]);

  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, ROWS.filter((r) => r.status === s).length])) as Record<CapStatus, number>, []);
  const rows = filter === 'all' ? ROWS : ROWS.filter((r) => r.status === filter);
  const seeInDemo = (to: string) => { setMode('today'); navigate(to); };

  return (
    <div className="fade-in">
      <div className="hero" style={{ marginBottom: 18 }}>
        <span className="eyebrow">Current platform · Tier 1</span>
        <h1>What the platform does today, and what Release 1 adds</h1>
        <div className="sub">{SUMMARY}</div>
        <Space style={{ marginTop: 16, position: 'relative', zIndex: 1 }} wrap>
          <Button type="primary" style={{ background: 'var(--gold)', color: 'var(--ink)', borderColor: 'var(--gold)' }} icon={<EyeOutlined />} onClick={() => seeInDemo('/deals/harlow/overview')}>
            {mode === 'today' ? 'Open Harlow Commons as it works today' : 'View the app as it works today'}
          </Button>
          {mode === 'today' ? <Button ghost onClick={() => setMode('target')}>Back to the Release 1 target</Button> : null}
        </Space>
        <div className="rule" />
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}><MetricCard label="Agents chained" value="4" sub="002 → 009 → 010 → 015" icon={<DeploymentUnitOutlined />} tone="primary" /></Col>
        <Col xs={12} lg={6}><MetricCard label="Close-out run" value={CLOSE_OUT.duration} sub={`${CLOSE_OUT.tokens} tokens · ${CLOSE_OUT.cost}`} icon={<ClockCircleOutlined />} /></Col>
        <Col xs={12} lg={6}><MetricCard label="Tests in CI" value="~400" sub="known-answer evals gate CI for intake only" icon={<CodeOutlined />} /></Col>
        <Col xs={12} lg={6}><MetricCard label="Tier 1" value="Delivered" sub="final milestone awaiting acceptance" icon={<FlagOutlined />} tone="success" /></Col>
      </Row>

      <Card
        title="Capability matrix"
        style={{ marginBottom: 16 }}
        extra={
          <Segmented
            size="small"
            value={filter}
            onChange={(v) => setFilter(v as CapStatus | 'all')}
            options={[{ value: 'all', label: `All ${ROWS.length}` }, ...STATUSES.map((s) => ({ value: s, label: `${CAP_STATUS[s].short} ${counts[s]}` }))]}
          />
        }
      >
        <p style={{ marginTop: 0, color: 'var(--body)' }}>
          Each row is one capability of the Release 1 platform: whether it exists today, the client's direction for it where known, and what Release 1 adds. "Not confirmed" means we have no information on it yet - to check at code review. The same rows drive the Today view across this demo.
        </p>
        <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 6 }}>
          {STATUSES.map((s) => <div key={s} className={`today-dot--${s}`} style={{ flex: counts[s] }} title={`${CAP_STATUS[s].label}: ${counts[s]}`} />)}
        </div>
        <Space size={12} wrap style={{ fontSize: 12, marginBottom: 6 }}>
          {STATUSES.map((s) => <span key={s}><span className={`today-dot today-dot--${s}`} /> {CAP_STATUS[s].label} {counts[s]}</span>)}
        </Space>
      </Card>

      {AREAS.map((area) => {
        const list = rows.filter((r) => r.area === area);
        if (!list.length) return null;
        return (
          <Card key={area} title={area} size="small" styles={{ body: { padding: 0 } }} style={{ marginBottom: 14 }}>
            <Table<CapRow>
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={list}
              rowClassName={(r) => (r.id === focus ? 'cs-row-focus' : '')}
              columns={[
                { title: 'Capability', width: 220, render: (_, r) => <span><strong>{r.label}</strong><br /><span className="mono muted" style={{ fontSize: 11 }}>{r.id}</span></span> },
                {
                  title: 'Today', width: 170, render: (_, r) => (
                    <Space direction="vertical" size={4}>
                      <StatusPill status={r.status} />
                      {r.exception ? <Tag color="gold" style={{ margin: 0 }}>Known issue</Tag> : null}
                    </Space>
                  ),
                },
                { title: 'What exists today', render: (_, r) => <span style={{ fontSize: 13 }}>{r.today}</span> },
                { title: 'Direction', width: 170, render: (_, r) => (r.position ? <span style={{ fontSize: 12.5, fontWeight: 600 }}>{r.position}</span> : <span className="muted">-</span>) },
                { title: 'Release 1 adds', width: 240, render: (_, r) => <span style={{ fontSize: 12.5 }}>{r.delta ?? <span className="muted">-</span>}</span> },
                {
                  title: 'In the demo', width: 110, render: (_, r) => (r.where.length
                    ? <Button size="small" type="link" style={{ padding: 0 }} onClick={() => seeInDemo(r.where[0])}>See it <ArrowRightOutlined /></Button>
                    : <span className="muted" style={{ fontSize: 12 }}>Matrix only</span>),
                },
              ]}
            />
          </Card>
        );
      })}

      <Card title="Direction per component" styles={{ body: { padding: 0 } }} style={{ marginBottom: 16, marginTop: 6 }}>
        <Table
          rowKey="component"
          size="small"
          pagination={false}
          dataSource={POSITIONS}
          columns={[
            { title: 'Component', dataIndex: 'component', width: 260, render: (v: string) => <strong>{v}</strong> },
            { title: 'Direction', dataIndex: 'position', width: 220, render: (v: string) => <Tag color={v === 'Replace' ? 'purple' : v === 'Open' ? 'default' : v.startsWith('Reuse') ? 'success' : 'gold'}>{v}</Tag> },
            { title: 'Why', dataIndex: 'why', render: (v: string) => <span style={{ fontSize: 12.5 }}>{v}</span> },
          ]}
        />
        <Row gutter={[16, 16]} style={{ padding: 16 }}>
          <Col xs={24} md={12}><div className="panel"><div className="metric-label" style={{ marginBottom: 4 }}>Decided</div>{DECIDED.decided}</div></Col>
          <Col xs={24} md={12}><div className="callout-gold"><div className="metric-label" style={{ marginBottom: 4 }}>Not yet decided</div>{DECIDED.open}</div></Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} xl={12}>
          <Card title="Tier 1 delivery" style={{ height: '100%' }}>
            <Steps
              direction="vertical"
              size="small"
              current={MILESTONES.length}
              items={MILESTONES.map((m) => ({
                title: <span>{m.id} <Tag color={m.status === 'Complete' ? 'success' : 'gold'} style={{ marginLeft: 6 }}>{m.status}</Tag></span>,
                description: m.note,
                status: m.status === 'Complete' ? 'finish' : 'process',
                icon: m.status === 'Complete' ? <CheckCircleFilled style={{ color: '#389E0D' }} /> : <ExclamationCircleOutlined style={{ color: '#D48806' }} />,
              }))}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Known issues" extra={<Tag>Carried into the next phase</Tag>} style={{ height: '100%' }}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              {(Object.keys(EXCEPTIONS) as ExceptionId[]).map((id) => (
                <div key={id} className="panel" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <ExclamationCircleOutlined style={{ color: '#D48806', marginTop: 4 }} />
                  <div style={{ flex: 1 }}>
                    <strong>{EXCEPTIONS[id].title}</strong>
                    <div style={{ marginTop: 2, color: 'var(--body)' }}>{EXCEPTIONS[id].text}</div>
                  </div>
                  {EXCEPTIONS[id].where !== '/current-state' ? <Button size="small" type="link" onClick={() => seeInDemo(EXCEPTIONS[id].where)}>See it</Button> : null}
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} xl={14}>
          <Card title="Stack today" styles={{ body: { padding: 0 } }} style={{ height: '100%' }}>
            <Table
              rowKey="layer"
              size="small"
              pagination={false}
              showHeader={false}
              dataSource={STACK}
              columns={[
                { dataIndex: 'layer', width: 130, render: (v: string) => <span className="metric-label">{v}</span> },
                { dataIndex: 'today', render: (v: string) => <span style={{ fontSize: 13 }}>{v}</span> },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="Not started" style={{ height: '100%' }}>
            <Space size={[6, 8]} wrap>{NOT_STARTED.map((n) => <Tag key={n} style={{ margin: 0 }}>{n}</Tag>)}</Space>
            <p className="muted" style={{ fontSize: 12.5, marginBottom: 0, marginTop: 12 }}>Document-store, mail and calendar integrations are deferred to a later phase.</p>
          </Card>
        </Col>
      </Row>

      <p className="muted" style={{ fontSize: 12 }}>{SOURCE_NOTE}</p>
    </div>
  );
}

// Deal overview: where the deal stands in Phase 1, the health signal and its drivers, next required actions
// (all parallel ones), blocked steps with causes, and the plain-language summary in three modes. In the Today lens
// the rail is the earlier 12-stage, 3-gate lifecycle (to be replaced by the tree) and the latest agent run is shown.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Col, Empty, List, Row, Segmented, Space, Tag, Timeline, Tooltip } from 'antd';
import { ArrowRightOutlined, BranchesOutlined, CheckCircleOutlined, NodeExpandOutlined, StopOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons';
import { useDemo } from '../../store/demoStore';
import { useDeal, useDealMetrics, useNextActions, useDealFindings } from '../../store/hooks';
import { TREE_PHASE1 } from '../../data/tree-phase1';
import { WORKSTREAMS } from '../../data/analysis';
import { personaById } from '../../data/people';
import { HEALTH, HealthTag, MetricCard, StageRail, type RailStage, BasisLabel, SEVERITY } from '../../components/ui';
import { Sensitive } from '../../components/perm';
import { usd, underwrite } from '../../calc/underwriting';
import { UW_INPUTS } from '../../data/underwriting';
import type { SummaryMode } from '../../data/types';
import { CapChip, TodayGate, useToday } from '../../components/today';
import { LIFECYCLE_GATES, LIFECYCLE_STAGES, NAMES_NOTE } from '../../data/currentState';
import { HARLOW_RUNS, agentName } from '../../data/agentRuns';

// Today's earlier lifecycle: 12 stages and 3 gates, names not known to us. The deal's position on it is illustrative.
const TODAY_RAIL: RailStage[] = LIFECYCLE_STAGES.map((label, i) => ({
  key: label, label, mark: String(i + 1), state: i < 4 ? 'done' : i === 4 ? 'current' : 'todo', hint: NAMES_NOTE,
}));

function useTyped(text: string, speed = 9) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const t = setInterval(() => setN((v) => (v >= text.length ? (clearInterval(t), v) : v + 3)), speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return { shown: text.slice(0, n), done: n >= text.length };
}

export default function Overview() {
  const deal = useDeal();
  const navigate = useNavigate();
  const m = useDealMetrics(deal.id);
  const actions = useNextActions(deal.id);
  const findings = useDealFindings(deal.id);
  const nodeStatus = useDemo((s) => s.nodeStatus[deal.id]);
  const audit = useDemo((s) => s.audit);
  const persona = useDemo((s) => s.persona);
  const uwVersion = useDemo((s) => s.uwVersion[deal.id] ?? 'v2');
  const [chosenMode, setMode] = useState<SummaryMode>(personaById(persona).summaryMode);
  useEffect(() => setMode(personaById(persona).summaryMode), [persona]);
  const today = useToday();
  // Only the executive summary exists today (agent 015).
  const mode: SummaryMode = today ? 'Executive' : chosenMode;

  const stages: RailStage[] = useMemo(() => {
    const ws = WORKSTREAMS.filter((w) => w.id !== 'X0220');
    const list: RailStage[] = ws.map((w) => {
      const st = nodeStatus[w.id]?.status;
      return {
        key: w.id,
        label: w.name.replace(' & identification', '').replace('Investment Committee (IC) approval', 'IC approval').replace('Refined feasibility & underwriting', 'Refined underwriting'),
        state: st === 'done' ? 'done' : st === 'blocked' ? 'blocked' : st === 'in_progress' || st === 'awaiting_decision' ? 'current' : 'todo',
        hint: `${w.id} · ${w.name}`,
      };
    });
    const g = nodeStatus.X0220?.status;
    list.push({ key: 'X0220', label: 'Gate G1 · acquisition closing', state: g === 'done' ? 'done' : 'todo', gate: true, hint: 'X0220 GATE: ACQUISITION CLOSING' });
    return list;
  }, [nodeStatus]);

  const blocked = useMemo(
    () => TREE_PHASE1.filter((n) => n.stepClass !== 'Container' && (nodeStatus[n.id]?.status === 'blocked' || nodeStatus[n.id]?.status === 'awaiting_decision')),
    [nodeStatus],
  );

  const r = deal.id === 'harlow' ? underwrite(UW_INPUTS[uwVersion]) : null;
  const top = actions.slice(0, 3);
  const summary = useMemo(() => {
    if (!r) {
      return deal.depth === 'intake'
        ? `${deal.name} is at intake. Upload the deal package to start classification, extraction and rule checks. Project type is set to adaptive reuse, so the conversion branch (X0039) is on the path and the other project-type branches are not.`
        : `${deal.name} is in acquisition due diligence. ${m.awaitingDecisions} decisions are with their owners and ${m.blockedNodes} steps are blocked. The rehabilitation branch is active: existing-conditions, IPNA and relocation nodes are on the path.`;
    }
    if (mode === 'Executive') {
      return `Not yet ready for investment committee. ${m.blocking} blocking item${m.blocking === 1 ? '' : 's'}: ${top.map((a) => a.title.replace(/\.$/, '').toLowerCase()).join('; ')}. DSCR is ${r.dscr.toFixed(2)}x against the lender's 1.20x; sources are ${r.balance < 0 ? `short by ${usd(-r.balance)}` : 'balanced'}. Next step: close the blocking items, then take the IC memo to committee.`;
    }
    if (mode === 'Analyst') {
      return `Underwriting input set ${uwVersion} (Form A-1 + sponsor pro forma). TDC ${usd(r.tdc)}; NOI ${usd(r.noi)}; debt service ${usd(r.annualDebtService)} at ${r.rate}% / 35 yr → DSCR ${r.dscr.toFixed(2)}x (lender min 1.20x). Gap-method credit ${usd(r.gapCredit)} vs eligible ${usd(r.eligibleCredit)} (HCR-C-08); request ${usd(r.creditRequest)}; sources - uses ${usd(r.balance)}. Developer fee ${r.devFeePctOfBase}% of acquisition + improvement cost against a 10% base (HCR-C-02); builder's fees ${r.builderFeesPct}% against 14% (HCR-C-01). All figures from calc-engine 1.4.2.`;
    }
    return `Harlow Commons is in refined feasibility and underwriting. ${m.done} of ${m.applicable} Phase 1 steps on this deal's path are complete. ${m.blocking} findings block readiness and ${m.advisory} are advisory. Three things need you now: ${top.map((a) => a.title.replace(/\.$/, '')).join('; ')}. The Phase I is current for HCR but will be outside the lender's 6-month window at the December 15 closing.`;
  }, [r, mode, m, top, deal, uwVersion]);
  const typed = useTyped(summary);

  const dealEvents = audit.filter((e) => e.dealId === deal.id).slice(-6).reverse();
  const lastRun = HARLOW_RUNS.filter((x) => x.dealId === deal.id).slice(-1)[0];

  return (
    <div className="fade-in">
      {today ? (
        <Card
          title={<span>Lifecycle today · 12 stages, 3 gates <CapChip cap="lifecycle.12stage" style={{ marginLeft: 8 }} /></span>}
          style={{ marginBottom: 16 }}
          extra={<span className="muted" style={{ fontSize: 12 }}>{NAMES_NOTE} · position illustrative</span>}
          data-tour="deal-rail"
        >
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 520 }}><StageRail stages={TODAY_RAIL} /></div>
            <div style={{ display: 'flex', gap: 10 }}>
              {LIFECYCLE_GATES.map((g) => (
                <div key={g} style={{ textAlign: 'center' }}>
                  <div className="rail-dot gate" style={{ margin: '0 auto' }}><span>{g.slice(-1)}</span></div>
                  <div className="rail-label">{g}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="muted" style={{ fontSize: 12, margin: '10px 0 0' }}>Direction: replace with the process tree as the deal model; the 12 stages may stay as a view.</p>
        </Card>
      ) : (
        <Card title="Phase 1 · Pre-Acquisition" style={{ marginBottom: 16 }} extra={<a onClick={() => navigate(`/deals/${deal.id}/process`)}>Open the 224-node navigator <ArrowRightOutlined /></a>} data-tour="deal-rail">
          <StageRail stages={stages} onClick={() => navigate(`/deals/${deal.id}/process`)} />
        </Card>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}><TodayGate cap="lifecycle.processTree" chip="none"><MetricCard label="Steps complete" value={`${m.done} / ${m.applicable}`} sub="applicable Phase 1 steps" icon={<CheckCircleOutlined />} tone="primary" /></TodayGate></Col>
        <Col xs={12} lg={6}><MetricCard label="Blocking findings" value={m.blocking} sub={`${m.advisory} advisory · ${m.passed} passed`} icon={<StopOutlined />} tone={m.blocking ? 'danger' : 'success'} /></Col>
        <Col xs={12} lg={6}><TodayGate cap="lifecycle.processTree" chip="none"><MetricCard label="Blocked steps" value={m.blockedNodes} sub="with a stated cause" icon={<WarningOutlined />} tone={m.blockedNodes ? 'danger' : 'neutral'} /></TodayGate></Col>
        <Col xs={12} lg={6}><TodayGate cap="lifecycle.decisions" chip="none"><MetricCard label="Decisions awaiting" value={m.awaitingDecisions} sub="human decision points" icon={<BranchesOutlined />} /></TodayGate></Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <TodayGate cap="lifecycle.health">
          <Card title="Next required actions" extra={<span className="muted" style={{ fontSize: 12 }}>All parallel actions are shown</span>} style={{ marginBottom: 16 }} data-tour="next-actions">
            {actions.length ? (
              <List
                dataSource={actions}
                renderItem={(a) => (
                  <List.Item style={{ cursor: 'pointer' }} onClick={() => navigate(a.to)} actions={[<ArrowRightOutlined key="go" />]}>
                    <List.Item.Meta
                      avatar={<span className="metric-chip" style={{ width: 34, height: 34, fontSize: 15, background: a.priority === 'blocking' ? '#FFF1F0' : '#FFFBE6', color: a.priority === 'blocking' ? '#CF1322' : '#D48806' }}>{SEVERITY[a.priority].icon}</span>}
                      title={<span style={{ fontWeight: 600 }}>{a.title}</span>}
                      description={
                        <Space size={6} wrap style={{ fontSize: 12 }}>
                          <Tag icon={<UserOutlined />}>{a.owner}</Tag>
                          <Tag color={a.priority === 'blocking' ? 'error' : 'warning'}>{a.priority}</Tag>
                          <span className="muted">Basis: {a.basis}</span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : <Empty description="No open actions" />}
          </Card>
          </TodayGate>

          <TodayGate cap="lifecycle.processTree">
          <Card title="Blocked steps and their causes">
            {blocked.length ? (
              <List
                size="small"
                dataSource={blocked}
                renderItem={(n) => (
                  <List.Item style={{ cursor: 'pointer' }} onClick={() => navigate(`/deals/${deal.id}/process?node=${n.id}`)}>
                    <Space align="start">
                      <Tag color={nodeStatus[n.id].status === 'blocked' ? 'error' : 'gold'} style={{ marginTop: 2 }}>{nodeStatus[n.id].status === 'blocked' ? 'Blocked' : 'Awaiting decision'}</Tag>
                      <span><span className="mono muted">{n.id}</span> <strong>{n.name}</strong><br /><span className="muted" style={{ fontSize: 12.5 }}>{nodeStatus[n.id].cause}</span></span>
                    </Space>
                  </List.Item>
                )}
              />
            ) : <Empty description="Nothing blocked" />}
          </Card>
          </TodayGate>
        </Col>

        <Col xs={24} xl={10}>
          {today && lastRun ? (
            <Card
              title={<span><NodeExpandOutlined /> Latest agent run <CapChip cap="agents.chain" style={{ marginLeft: 6 }} /></span>}
              style={{ marginBottom: 16 }}
              extra={<a onClick={() => navigate(`/deals/${deal.id}/runs`)}>All runs <ArrowRightOutlined /></a>}
            >
              <div style={{ fontSize: 13 }}><strong className="mono">{lastRun.id}</strong> · {lastRun.trigger}</div>
              <Space size={6} wrap style={{ marginTop: 8 }}>
                {lastRun.steps.map((st) => <Tag key={st.agent} color={st.status === 'succeeded' ? 'success' : st.status === 'skipped' ? 'default' : 'gold'}>{st.agent} {agentName(st.agent)}</Tag>)}
              </Space>
            </Card>
          ) : null}
          <Card
            title="Plain-language summary"
            style={{ marginBottom: 16 }}
            extra={
              <Space size={6}>
              <CapChip cap="summary.executive" />
              <Segmented
                size="small"
                value={mode}
                onChange={(v) => setMode(v as SummaryMode)}
                options={today
                  ? [{ value: 'Executive', label: 'Executive' }, { value: 'Practitioner', label: 'Practitioner', disabled: true }, { value: 'Analyst', label: 'Analyst', disabled: true }]
                  : ['Executive', 'Practitioner', 'Analyst']}
              />
              </Space>
            }
            data-tour="summary"
          >
            <p className={typed.done ? '' : 'typing-caret'} style={{ fontSize: 14.5, lineHeight: 1.6, minHeight: 120, margin: 0 }}>{typed.shown}</p>
            <Space size={6} style={{ marginTop: 12 }} wrap>
              <BasisLabel value="deal" />
              <BasisLabel value="rule" />
              <span className="muted" style={{ fontSize: 11.5 }}>summary.{mode.toLowerCase()} · pinned prompt version · practitioner-reviewable</span>
            </Space>
          </Card>

          <TodayGate cap="lifecycle.health">
          <Card title="Health signal" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <HealthTag value={m.health} />
              <div style={{ fontSize: 13, color: 'var(--body)' }}>
                The signal is derived from open-item count, severity, step status and deadline proximity. The rules driving it are visible:
              </div>
              {m.drivers.length ? m.drivers.map((d) => <div key={d} style={{ fontSize: 13 }}><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 9, background: HEALTH[m.health].dot, marginRight: 8 }} />{d}</div>) : <span className="muted">No open drivers</span>}
              <div className="muted" style={{ fontSize: 12 }}>Rule: ≥ 3 blocking findings or ≥ 5 blocked steps → needs escalation; any blocking item or ≥ 2 decisions awaiting → at risk.</div>
            </Space>
          </Card>
          </TodayGate>

          <TodayGate cap="audit.trail">
          <Card title="Deal record" extra={<Tooltip title="Versioned deal state: nothing is overwritten; each change is a new version with its actor and basis."><Tag>Version {Math.max(1, audit.filter((e) => e.dealId === deal.id).length)}</Tag></Tooltip>}>
            <div className="kv" style={{ marginBottom: 14 }}>
              <span className="k">Sponsor</span><span>Northbank Housing Partners</span>
              <span className="k">Created</span><span>{deal.createdAt}</span>
              <span className="k">TDC</span><span>{deal.tdc ? <Sensitive>{usd(r?.tdc ?? deal.tdc)}</Sensitive> : 'Not yet underwritten'}</span>
              <span className="k">Credit request</span><span>{deal.creditRequest ? <Sensitive>{usd(deal.creditRequest)} / yr</Sensitive> : '-'}</span>
              <span className="k">Findings</span><span>{findings.length} total</span>
            </div>
            <Timeline
              items={dealEvents.map((e) => ({ children: <span style={{ fontSize: 12.5 }}><strong>{e.action}</strong> · {e.object}<br /><span className="muted">{e.actor} · {e.at}</span></span> }))}
            />
          </Card>
          </TodayGate>
        </Col>
      </Row>
    </div>
  );
}

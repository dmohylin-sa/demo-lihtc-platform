// Decisions & gate G1 (row 14): the 8 Phase 1 decision nodes stop the process, present the basis and record
// actor, time and decision; gate G1 is verified on a first pass by the Closing Coordinator and authorized by the Principal.
import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as AntdApp, Alert, Badge, Card, Col, Collapse, Input, Modal, Progress, Radio, Row, Space, Tag } from 'antd';
import { CheckCircleFilled, CheckOutlined, ClockCircleOutlined, MinusCircleOutlined, PauseCircleFilled, SafetyCertificateOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons';
import { useDemo } from '../../store/demoStore';
import { useDeal, useDealFindings } from '../../store/hooks';
import { ACQ_CHECKLIST, DECISIONS, DECISION_PLATFORM_ROLE, G1_CONDITIONS, GATE_G1 } from '../../data/registry';
import { personaById } from '../../data/people';
import { PageHeader } from '../../components/ui';
import { CitationChip } from '../../components/viewer';
import { PermButton } from '../../components/perm';
import type { Citation, DecisionDef, DecisionState, GateCondition } from '../../data/types';

const STATE_TAG: Record<DecisionState['status'], { label: string; color: string; icon: ReactNode }> = {
  decided: { label: 'Decided', color: 'success', icon: <CheckCircleFilled /> },
  awaiting: { label: 'Awaiting owner', color: 'gold', icon: <PauseCircleFilled /> },
  na: { label: "Not on this project type's path", color: 'default', icon: <MinusCircleOutlined /> },
  not_reached: { label: 'Not reached', color: 'default', icon: <ClockCircleOutlined /> },
};

const SUGGEST: Record<string, { option: string; basis: string; rationale: string; cites: Citation[] }> = {
  'D1-04': {
    option: 'Yes - commission Phase II',
    rationale: 'The Phase I identifies a REC on the up-gradient adjoining parcel (former gasoline station, two USTs, no closure records) and the consultant recommends a limited Phase II. Commissioning it before the deposit goes hard keeps the cleanup-pathway decision (D1-05) open.',
    basis: 'Phase I ESA (ASTM E1527-21) identifies a REC: former gasoline station with two USTs on the up-gradient adjoining lot, no closure records (p.14). Consultant recommends a limited Phase II (p.15). Commission before the deposit goes hard.',
    cites: [{ docId: 'd-esa', page: 14, passageId: 'esa-rec' }, { docId: 'd-esa', page: 15, passageId: 'esa-recommend' }],
  },
  'D1-08': {
    option: '485-x',
    rationale: 'New-construction rental with 84 units, 83 restricted at an average of 58.3% AMI, construction start after June 2025. 485-x is the benefit designed for this profile; Counsel confirms eligibility.',
    basis: 'New-construction rental, 84 units, 83 restricted at 58.3% average AMI (Form A-1 Unit Mix); R7A with MIH (zoning report p.2). 485-x selected; Counsel to confirm legal eligibility.',
    cites: [{ docId: 'd-form-a1', cell: 'Unit Mix!D10' }, { docId: 'd-zoning', page: 2, passageId: 'zon-district' }],
  },
};

const RELATED: Record<string, string[]> = { X0221: ['F-09'], X0222: ['F-04', 'F-14'] };

// Demo subset: checklist items already evidenced in the Harlow Commons package.
const RECEIVED = new Set([
  'Executed PSA', 'Title commitment', 'ALTA/NSPS survey', 'C of O search', 'Taxes & Vault search', 'Housing & Building search',
  'Violations search', 'Fire search', 'Landmark search', 'Flood search', 'Appraisal (MAI within 90 days typical)', 'Guaranty',
  'SPE formation documents', 'EIN', 'Org chart', 'W-9',
]);
const ATTENTION = new Set(['Phase I ESA (lender ≤6 months; HCR ≤12 months)', 'Acquisition loan commitment', 'Operating agreement']);

function DecisionCard({ def, st, dealId, onRecord }: { def: DecisionDef; st: DecisionState; dealId: string; onRecord: (d: DecisionDef) => void }) {
  const persona = useDemo((s) => s.persona);
  const isOwner = personaById(persona).role === def.owner;
  const t = STATE_TAG[st.status];
  const card = (
    <Card
      data-tour={def.id === 'D1-04' ? 'decision-D1-04' : undefined}
      style={{ height: '100%', opacity: st.status === 'na' ? 0.55 : 1, borderLeft: st.status === 'awaiting' ? '4px solid #D48806' : undefined }}
      styles={{ body: { padding: 18 } }}
    >
      <Space size={6} wrap style={{ marginBottom: 6 }}>
        <Tag color="purple" style={{ fontWeight: 700 }}>{def.id}</Tag>
        <span className="mono muted">{def.nodeId}</span>
        <Tag color={t.color} icon={t.icon}>{t.label}</Tag>
      </Space>
      <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 16, margin: '2px 0 10px' }}>{def.title}</h3>
      <div className="kv" style={{ gridTemplateColumns: '120px 1fr', fontSize: 12.5 }}>
        <span className="k">Owner</span><span><UserOutlined /> {def.owner}</span>
        <span className="k">Advisor / verifier</span><span>{def.advisors}</span>
        <span className="k">Criteria</span><span>{def.criteria}</span>
        <span className="k">Options</span>
        <span>{def.options.map((o) => <div key={o.label}><strong>{o.label}</strong> <span className="muted">→ {o.next}</span></div>)}</span>
        <span className="k">Evidence</span><span>{def.evidence}</span>
        <span className="k">Authority</span><span>{def.authority}</span>
        <span className="k">Review</span><span>{def.reviewStatus}</span>
      </div>
      <p className="muted" style={{ fontSize: 11.5, margin: '10px 0 0' }}>Platform role: {DECISION_PLATFORM_ROLE}</p>
      {st.status === 'decided' ? (
        <div className="panel fade-in" style={{ marginTop: 12, background: '#F0F8F2' }}>
          <div style={{ fontWeight: 700 }}><CheckCircleFilled style={{ color: '#389E0D' }} /> {st.option}</div>
          <div style={{ fontSize: 12.5, marginTop: 4 }}>{st.actor} · {st.role} · {st.at}</div>
          <div style={{ fontSize: 12.5, marginTop: 4, color: 'var(--body)' }}>Basis: {st.basis}</div>
        </div>
      ) : null}
      {st.status === 'awaiting' ? (
        <div style={{ marginTop: 12 }}>
          <PermButton
            cap="recordDecision"
            allowed={isOwner}
            denied={`Only the ${def.owner} can record this decision`}
            type="primary"
            onClick={() => onRecord(def)}
          >
            Record decision
          </PermButton>
          <span className="muted" style={{ fontSize: 12, marginLeft: 10 }}>{dealId === 'harlow' && SUGGEST[def.id] ? 'Recommendation drafted' : 'Evidence assembled'}</span>
        </div>
      ) : null}
    </Card>
  );
  return st.status === 'awaiting' ? <Badge.Ribbon text="Process paused here" color="#D48806">{card}</Badge.Ribbon> : card;
}

export default function Decisions() {
  const deal = useDeal();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const decisionsAll = useDemo((s) => s.decisions);
  const gateAll = useDemo((s) => s.gate);
  const recordDecision = useDemo((s) => s.recordDecision);
  const verifyCondition = useDemo((s) => s.verifyCondition);
  const authorizeGate = useDemo((s) => s.authorizeGate);
  const findings = useDealFindings(deal.id);
  const dec = decisionsAll[deal.id] ?? {};
  const gate = gateAll[deal.id];

  const [active, setActive] = useState<DecisionDef | null>(null);
  const [option, setOption] = useState('');
  const [basis, setBasis] = useState('');
  const [verifying, setVerifying] = useState<GateCondition | null>(null);
  const [note, setNote] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [authNote, setAuthNote] = useState('');

  const awaiting = DECISIONS.filter((d) => dec[d.id]?.status === 'awaiting');
  const verifiedCount = G1_CONDITIONS.filter((c) => gate?.conditions[c.id]?.verified).length;
  const allVerified = verifiedCount === G1_CONDITIONS.length;
  const openRelated = (c: GateCondition) => (c.nodeId ? (RELATED[c.nodeId] ?? []) : [])
    .map((id) => findings.find((f) => f.id === id))
    .filter((f) => f && (f.status === 'open' || f.status === 'in review'));

  const checklist = useMemo(() => {
    const harlow = deal.id === 'harlow';
    const items = ACQ_CHECKLIST.flatMap((c) => c.items.map((i) => ({ cat: c.cat, item: i, st: harlow && RECEIVED.has(i) ? 'received' : harlow && ATTENTION.has(i) ? 'attention' : 'missing' })));
    return { items, received: items.filter((i) => i.st === 'received').length, total: items.length };
  }, [deal.id]);

  const startRecord = (d: DecisionDef) => {
    const s = deal.id === 'harlow' ? SUGGEST[d.id] : undefined;
    setOption(s?.option ?? d.options[0].label);
    setBasis(s?.basis ?? `Evidence reviewed: ${d.evidence}.`);
    setActive(d);
  };
  const suggestion = active && deal.id === 'harlow' ? SUGGEST[active.id] : undefined;
  const verifyRelated = verifying ? openRelated(verifying) : [];

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Row 14 · human decision points and gate G1"
        title="Decisions & gate G1"
        desc="The tree's decision nodes and gate conditions are the stopping points. The platform presents; the practitioner decides; actor, time and basis are recorded."
      />

      {awaiting.length ? (
        <Alert
          type="warning"
          showIcon
          icon={<PauseCircleFilled />}
          style={{ marginBottom: 16 }}
          message={`Process paused at ${awaiting.map((d) => `${d.id} (${d.nodeId})`).join(' and ')}`}
          description="Steps that depend on these decisions stay blocked until the accountable owner records a decision with its basis."
        />
      ) : null}

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {DECISIONS.map((d) => (
          <Col key={d.id} xs={24} lg={12}>
            <DecisionCard def={d} st={dec[d.id] ?? { status: 'not_reached' }} dealId={deal.id} onRecord={startRecord} />
          </Col>
        ))}
      </Row>

      <Card
        data-tour="gate-panel"
        title={<span><span className="eyebrow" style={{ display: 'block' }}>Gate G1 · {GATE_G1.nodeId}</span>Acquisition closing</span>}
        extra={
          <Space size={6} wrap>
            <Tag icon={<UserOutlined />}>First pass: {GATE_G1.verifier}</Tag>
            <Tag icon={<SafetyCertificateOutlined />} color="purple">Authorizes: {GATE_G1.authorizer}</Tag>
          </Space>
        }
      >
        <div className="callout-gold" style={{ marginBottom: 16, fontSize: 13.5 }}>{GATE_G1.rule}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <span className="metric-label">Conditions verified</span>
          <Progress percent={Math.round((verifiedCount / G1_CONDITIONS.length) * 100)} format={() => `${verifiedCount} / ${G1_CONDITIONS.length}`} strokeColor="#521B3A" style={{ flex: 1, margin: 0, maxWidth: 420 }} />
        </div>

        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          {G1_CONDITIONS.map((c, i) => {
            const st = gate?.conditions[c.id];
            const related = openRelated(c);
            return (
              <div key={c.id} className="panel" style={{ background: st?.verified ? '#F0F8F2' : 'var(--panel-soft)', border: '1px solid var(--border-soft)' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <span className="avatar-initials" style={{ width: 30, height: 30, fontSize: 12 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <Space size={6} wrap>
                      <Tag color={c.nodeId ? 'default' : 'gold'}>{c.nodeId ?? 'NEW - no tree node yet'}</Tag>
                      <span className="muted" style={{ fontSize: 12 }}>Verifier: {c.verifier}</span>
                    </Space>
                    <div style={{ fontWeight: 600, margin: '4px 0' }}>{c.text}</div>
                    <div className="muted" style={{ fontSize: 12 }}>Evidence: {c.evidenceHint}</div>
                    {related.map((f) => (
                      <Alert
                        key={f!.id}
                        type="warning"
                        showIcon
                        icon={<WarningOutlined />}
                        style={{ marginTop: 8, padding: '4px 10px', cursor: 'pointer' }}
                        message={<span style={{ fontSize: 12.5 }}>{f!.id} {f!.status === 'in review' ? 'in review' : 'open'}: {f!.title}</span>}
                        onClick={() => navigate(`/deals/${deal.id}/findings?f=${f!.id}`)}
                      />
                    ))}
                    {st?.verified ? (
                      <div style={{ fontSize: 12.5, marginTop: 8 }}>
                        <CheckCircleFilled style={{ color: '#389E0D' }} /> Verified by {st.by} · {st.at}{st.note ? ` · "${st.note}"` : ''}
                      </div>
                    ) : null}
                  </div>
                  <div>
                    {st?.verified ? (
                      <Tag color="success" icon={<CheckOutlined />}>Verified</Tag>
                    ) : (
                      <PermButton cap="verifyGate" denied="Only the Closing Coordinator verifies gate conditions on a first pass" onClick={() => { setNote(''); setVerifying(c); }}>
                        Verify
                      </PermButton>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </Space>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
          {gate?.authorized ? (
            <Alert
              type="success"
              showIcon
              style={{ flex: 1 }}
              message={`Gate G1 authorized by ${gate.authorized.by} · ${gate.authorized.at}`}
              description={`Funds may be released at title - X0225 "funds wired and released at title" is the closing event itself, not a condition.${gate.authorized.note ? ` Note: ${gate.authorized.note}` : ''}`}
            />
          ) : (
            <>
              <PermButton
                cap="authorizeGate"
                denied="Only the Principal authorizes a gate, waiver or economic cure"
                type="primary"
                size="large"
                icon={<SafetyCertificateOutlined />}
                disabled={!allVerified}
                onClick={() => { setAuthNote(''); setAuthOpen(true); }}
              >
                Authorize gate G1
              </PermButton>
              <span className="muted" style={{ fontSize: 12.5 }}>
                {allVerified ? 'All conditions verified on first pass - ready for the Principal.' : `${verifiedCount} of ${G1_CONDITIONS.length} conditions verified. The Principal authorizes after the first pass.`}
              </span>
            </>
          )}
        </div>

        <Collapse
          style={{ marginTop: 20 }}
          items={[{
            key: 'chk',
            label: (
              <span>
                <strong>Acquisition closing checklist v3.5</strong> · {checklist.total} items in 5 categories ·{' '}
                <Tag color="purple" style={{ marginLeft: 4 }}>{checklist.received} / {checklist.total} evidenced</Tag>
              </span>
            ),
            children: (
              <>
                <p className="muted" style={{ marginTop: 0, fontSize: 12.5 }}>Item status comes from the deal package (demo subset). Completing the checklist does not by itself authorize the gate.</p>
                <Row gutter={[16, 12]}>
                  {ACQ_CHECKLIST.map((cat) => (
                    <Col key={cat.cat} xs={24} md={12} xl={8}>
                      <div className="panel" style={{ height: '100%' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{cat.cat}</div>
                        {checklist.items.filter((i) => i.cat === cat.cat).map((i) => (
                          <div key={i.item} style={{ fontSize: 12.5, display: 'flex', gap: 6, alignItems: 'baseline' }}>
                            {i.st === 'received' ? <CheckCircleFilled style={{ color: '#389E0D' }} /> : i.st === 'attention' ? <WarningOutlined style={{ color: '#D48806' }} /> : <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 9, border: '1.5px solid #C9BFBB' }} />}
                            <span style={{ color: i.st === 'missing' ? 'var(--secondary)' : 'var(--ink)' }}>{i.item}</span>
                          </div>
                        ))}
                      </div>
                    </Col>
                  ))}
                </Row>
              </>
            ),
          }]}
        />
      </Card>

      <Modal
        open={!!active}
        onCancel={() => setActive(null)}
        width={680}
        title={active ? <span><span className="eyebrow" style={{ display: 'block' }}>{active.id} · {active.nodeId} · owner {active.owner}</span>{active.title}</span> : null}
        okText="Record decision"
        okButtonProps={{ disabled: !basis.trim() }}
        onOk={() => {
          if (!active) return;
          recordDecision(deal.id, active.id, option, basis.trim());
          message.success(`${active.id} recorded - actor, time and basis written to the audit trail`);
          setActive(null);
        }}
      >
        {suggestion ? (
          <div className="callout-gold" style={{ marginBottom: 14 }}>
            <div className="eyebrow">Platform-drafted recommendation</div>
            <div style={{ fontWeight: 700, margin: '4px 0' }}>{suggestion.option}</div>
            <div style={{ fontSize: 13 }}>{suggestion.rationale}</div>
            <Space size={6} wrap style={{ marginTop: 8 }}>{suggestion.cites.map((c, i) => <CitationChip key={i} c={c} />)}</Space>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>The platform drafts; the accountable person decides.</div>
          </div>
        ) : null}
        <div className="metric-label" style={{ marginBottom: 6 }}>Decision</div>
        <Radio.Group value={option} onChange={(e) => setOption(e.target.value)} style={{ width: '100%' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {active?.options.map((o) => (
              <Radio key={o.label} value={o.label}><strong>{o.label}</strong> <span className="muted" style={{ fontSize: 12.5 }}>→ {o.next}</span></Radio>
            ))}
          </Space>
        </Radio.Group>
        <div className="metric-label" style={{ margin: '14px 0 6px' }}>Basis (recorded with actor and time)</div>
        <Input.TextArea rows={4} value={basis} onChange={(e) => setBasis(e.target.value)} />
        {active ? <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>Authority: {active.authority}</p> : null}
      </Modal>

      <Modal
        open={!!verifying}
        onCancel={() => setVerifying(null)}
        title={verifying ? <span><span className="eyebrow" style={{ display: 'block' }}>G1 first-pass verification · {verifying.nodeId ?? 'NEW'}</span>Verify condition</span> : null}
        okText="Verify condition"
        okButtonProps={{ disabled: verifyRelated.length > 0 && !note.trim() }}
        onOk={() => {
          if (!verifying) return;
          verifyCondition(deal.id, verifying.id, note.trim() || undefined);
          message.success('Condition verified on first pass');
          setVerifying(null);
        }}
      >
        {verifying ? (
          <>
            <p style={{ fontWeight: 600 }}>{verifying.text}</p>
            <p className="muted" style={{ fontSize: 12.5 }}>Evidence: {verifying.evidenceHint}</p>
            {verifyRelated.length ? (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 10 }}
                message="Open findings on this condition"
                description={`${verifyRelated.map((f) => `${f!.id} ${f!.title}`).join('; ')}. A note is required: state why the condition is verified on first pass or how it will be cured before closing.`}
              />
            ) : null}
            <Input.TextArea rows={3} placeholder={verifyRelated.length ? 'Required note' : 'Optional note'} value={note} onChange={(e) => setNote(e.target.value)} />
          </>
        ) : null}
      </Modal>

      <Modal
        open={authOpen}
        onCancel={() => setAuthOpen(false)}
        title="Authorize gate G1 · acquisition closing"
        okText="Authorize"
        onOk={() => {
          authorizeGate(deal.id, authNote.trim() || undefined);
          message.success('Gate G1 authorized - recorded with actor, time and basis');
          setAuthOpen(false);
        }}
      >
        <p>All five conditions are verified on first pass. Authorizing records the Principal's decision; funds may then be released at title.</p>
        <div className="metric-label" style={{ marginBottom: 6 }}>Waiver or economic cure (optional)</div>
        <Input.TextArea rows={3} value={authNote} onChange={(e) => setAuthNote(e.target.value)} placeholder="e.g. ESA update to be delivered before funding; lender consent attached" />
      </Modal>
    </div>
  );
}

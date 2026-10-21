// Portfolio: every deal with its health signal, readiness and blocking items; new-deal intake wizard.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as AntdApp, Button, Card, Col, Form, Input, InputNumber, Modal, Progress, Radio, Row, Select, Space, Steps, Table, Tag, Tooltip } from 'antd';
import { AlertOutlined, ApartmentOutlined, FileDoneOutlined, PlusOutlined, PushpinOutlined, ScheduleOutlined } from '@ant-design/icons';
import { useDemo } from '../store/demoStore';
import { dealMetrics, nextActions } from '../store/selectors';
import { PROJECT_TYPES } from '../data/deals';
import { TREE_PHASE1 } from '../data/tree-phase1';
import { HealthTag, MetricCard } from '../components/ui';
import { PermButton, Sensitive } from '../components/perm';
import { usd } from '../calc/underwriting';
import type { Deal, ProjectType } from '../data/types';

const nodeName = (id: string) => TREE_PHASE1.find((n) => n.id === id)?.name ?? id;

function NewDealModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [form] = Form.useForm();
  const addDeal = useDemo((s) => s.addDeal);
  const published = useDemo((s) => s.rulePackPublished);
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const values = Form.useWatch([], form) ?? {};
  const finish = () => {
    const v = form.getFieldsValue(true);
    const id = addDeal({ name: v.name, borough: v.borough, units: v.units, projectType: v.projectType, overlays: v.overlays ?? [] });
    message.success(`${v.name} created and pinned to tree v3.6.1 and rule pack ${published}`);
    onClose();
    setStep(0);
    form.resetFields();
    navigate(`/deals/${id}/documents`);
  };
  return (
    <Modal open={open} onCancel={onClose} width={720} title="New deal" footer={null} destroyOnHidden>
      <Steps size="small" current={step} style={{ margin: '8px 0 22px' }} items={[{ title: 'Deal' }, { title: 'Program & overlays' }, { title: 'Project type' }, { title: 'Review' }]} />
      <Form form={form} layout="vertical" preserve initialValues={{ name: 'Mott Street Senior Residences', borough: 'Bronx', units: 72, program: '9% LIHTC (competitive)', agency: 'NYS HCR', overlays: ['Income averaging'], projectType: 'new' }}>
        <div style={{ display: step === 0 ? 'block' : 'none' }}>
          <Form.Item label="Deal name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item label="Borough / county" name="borough"><Select options={['Bronx', 'Brooklyn', 'Manhattan', 'Queens', 'Staten Island', 'Westchester'].map((v) => ({ value: v }))} /></Form.Item></Col>
            <Col span={12}><Form.Item label="Units" name="units"><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <p className="muted" style={{ fontSize: 12.5 }}>A deal is the primary object: every document, decision, deadline and output belongs to it. The project is the physical development; the transaction is the legal context.</p>
        </div>
        <div style={{ display: step === 1 ? 'block' : 'none' }}>
          <Row gutter={12}>
            <Col span={12}><Form.Item label="Deal type" name="program"><Select options={[{ value: '9% LIHTC (competitive)' }, { value: '4% LIHTC + bonds', disabled: true, label: '4% LIHTC + bonds (Release 3)' }]} /></Form.Item></Col>
            <Col span={12}><Form.Item label="Allocating agency" name="agency"><Select options={[{ value: 'NYS HCR' }, { value: 'NYC HPD', disabled: true, label: 'NYC HPD (later release)' }]} /></Form.Item></Col>
          </Row>
          <Form.Item label="Overlays" name="overlays" extra="Overlays modify the path; they do not create separate process tracks. Each switches on its program rules.">
            <Select mode="multiple" options={['Income averaging', 'NYSERDA clean energy', 'Section 8 HAP', 'Supportive housing (ESSHI)', 'Senior'].map((v) => ({ value: v }))} />
          </Form.Item>
        </div>
        <div style={{ display: step === 2 ? 'block' : 'none' }}>
          <Form.Item name="projectType" label="Project type (D1-01 drives the entire path)">
            <Radio.Group style={{ width: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {(Object.keys(PROJECT_TYPES) as ProjectType[]).map((k) => (
                  <Radio key={k} value={k} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 10, width: '100%' }}>
                    <strong>{PROJECT_TYPES[k].label}</strong>
                    <span className="muted" style={{ marginLeft: 8, fontSize: 12 }}>branch {PROJECT_TYPES[k].branch} · {nodeName(PROJECT_TYPES[k].branch)}</span>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>
        </div>
        {step === 3 ? (
          <div className="panel">
            <div className="kv">
              <span className="k">Deal</span><span>{values.name} · {values.borough} · {values.units} units</span>
              <span className="k">Program</span><span>{values.program} · {values.agency}</span>
              <span className="k">Overlays</span><span>{(values.overlays ?? []).join(', ') || 'None'}</span>
              <span className="k">Project type</span><span>{values.projectType ? PROJECT_TYPES[values.projectType as ProjectType].label : ''}</span>
              <span className="k">Pinned to</span><span><Tag icon={<PushpinOutlined />}>Process tree v3.6.1</Tag><Tag icon={<PushpinOutlined />}>NY HCR 9% {published}</Tag></span>
            </div>
            <p className="muted" style={{ fontSize: 12.5, margin: '12px 0 0' }}>The deal opens on 224 Phase 1 nodes, with branches for other project types marked "not on this path". Next: upload the deal package.</p>
          </div>
        ) : null}
      </Form>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
        <Button disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
        {step < 3 ? <Button type="primary" onClick={() => setStep(step + 1)}>Next</Button> : <Button type="primary" onClick={finish}>Create deal</Button>}
      </div>
    </Modal>
  );
}

export default function Portfolio() {
  const navigate = useNavigate();
  const deals = useDemo((s) => s.deals);
  const nodeStatus = useDemo((s) => s.nodeStatus);
  const findings = useDemo((s) => s.findings);
  const decisions = useDemo((s) => s.decisions);
  const persona = useDemo((s) => s.persona);
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => deals.map((d) => ({ deal: d, m: dealMetrics({ nodeStatus, findings, decisions }, d.id) })), [deals, nodeStatus, findings, decisions]);
  const totals = rows.reduce((a, r) => ({ blocking: a.blocking + r.m.blocking, awaiting: a.awaiting + r.m.awaitingDecisions, readiness: a.readiness + r.m.readiness }), { blocking: 0, awaiting: 0, readiness: 0 });
  const harlow = rows.find((r) => r.deal.id === 'harlow');
  const harlowActions = useMemo(() => nextActions({ findings, decisions }, 'harlow').slice(0, 3), [findings, decisions]);

  return (
    <div className="fade-in">
      <div className="hero" style={{ marginBottom: 20 }}>
        <span className="eyebrow">Northbank Housing Partners · portfolio</span>
        <h1>Where every deal stands, and what it needs next</h1>
        <div className="sub">The platform takes each live deal, knows where it stands in the critical path, does the analysis it can do reliably, and brings you in where judgment or authority is required.</div>
        <div className="rule" />
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
        <Col xs={12} lg={6}><MetricCard label="Active deals" value={deals.length} sub="9% LIHTC · NYS HCR" icon={<ApartmentOutlined />} tone="primary" /></Col>
        <Col xs={12} lg={6}><MetricCard label="Avg. readiness" value={`${Math.round(totals.readiness / Math.max(rows.length, 1))}%`} sub="Phase 1 steps complete" icon={<FileDoneOutlined />} /></Col>
        <Col xs={12} lg={6}><MetricCard label="Blocking findings" value={totals.blocking} sub="need action before IC" icon={<AlertOutlined />} tone={totals.blocking ? 'danger' : 'success'} /></Col>
        <Col xs={12} lg={6}><MetricCard label="Decisions awaiting" value={totals.awaiting} sub="human decision points" icon={<ScheduleOutlined />} /></Col>
      </Row>

      {persona === 'principal' && harlow ? (
        <Card style={{ marginBottom: 18, borderLeft: '4px solid var(--plum)' }} title={<span><span className="eyebrow" style={{ display: 'block' }}>Executive summary · Harlow Commons</span>Is this deal safe to say yes to?</span>}
          extra={<Button type="link" onClick={() => navigate('/deals/harlow/report')}>Open readiness report</Button>}>
          <p style={{ margin: 0, fontSize: 15 }}>
            <Tag color={harlow.m.blocking ? 'error' : 'success'} style={{ fontWeight: 800 }}>{harlow.m.blocking ? 'NOT YET' : 'READY'}</Tag>
            {harlow.m.blocking
              ? `Not ready for investment committee: ${harlow.m.blocking} blocking item${harlow.m.blocking > 1 ? 's' : ''}. Top issues: `
              : 'Ready for investment committee. '}
            {harlowActions.map((a, i) => <span key={a.key}>{i ? '; ' : ''}{a.title.replace(/\.$/, '')}</span>)}.
          </p>
        </Card>
      ) : null}

      <Card
        title="Deals"
        extra={<PermButton cap="upload" denied="Only sponsor practitioners can open a deal" type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>New deal</PermButton>}
        styles={{ body: { padding: 0 } }}
        data-tour="portfolio-table"
      >
        <Table<{ deal: Deal; m: ReturnType<typeof dealMetrics> }>
          className="clickable-rows"
          rowKey={(r) => r.deal.id}
          dataSource={rows}
          pagination={false}
          onRow={(r) => ({ onClick: () => navigate(`/deals/${r.deal.id}/overview`) })}
          columns={[
            {
              title: 'Deal', render: (_, r) => (
                <Space>
                  <span className="avatar-initials">{r.deal.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
                  <span><strong>{r.deal.name}</strong><br /><span className="muted" style={{ fontSize: 12 }}>{r.deal.borough} · {r.deal.units} units · {PROJECT_TYPES[r.deal.projectType].label}</span></span>
                </Space>
              ),
            },
            { title: 'Current workstream', render: (_, r) => <span>{nodeName(r.deal.stage)}<br /><span className="muted mono">{r.deal.stage}</span></span> },
            { title: 'Readiness', width: 170, render: (_, r) => <Progress percent={r.m.readiness} size="small" strokeColor="#521B3A" /> },
            {
              title: 'Health signal', render: (_, r) => (
                <Tooltip title={r.m.drivers.length ? <span>Driven by: {r.m.drivers.join(' · ')}</span> : 'No open blocking items'}>
                  <span><HealthTag value={r.m.health} /></span>
                </Tooltip>
              ),
            },
            { title: 'Blocking', align: 'center', render: (_, r) => (r.m.blocking ? <Tag color="error">{r.m.blocking}</Tag> : <span className="muted">-</span>) },
            { title: 'TDC', align: 'right', render: (_, r) => (r.deal.tdc ? <Sensitive>{usd(r.deal.tdc, { compact: true })}</Sensitive> : <span className="muted">Not yet</span>) },
            { title: 'Pins', render: (_, r) => <span className="mono" style={{ whiteSpace: 'nowrap' }}>{r.deal.treeVersion} · {r.deal.ruleVersion}</span> },
          ]}
        />
      </Card>
      <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
        Tenant isolation: Northbank users see Northbank deals only. Another sponsor's deals on the same platform never appear here, in search or in retrieval.
      </p>
      <NewDealModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

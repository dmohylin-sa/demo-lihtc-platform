// Underwriting: the input set read from Form A-1 and the sponsor pro forma (row 9), and the deterministic
// calculations on it (row 10) - sources and uses, DSCR, eligible basis to credit, fee caps, sensitivity, tolerances.
// The workbook-audit tab shows what today's underwriting agent (009) does: a six-gate audit of the sponsor workbook.
import { useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { App as AntdApp, Alert, Card, Col, Empty, Progress, Row, Slider, Space, Table, Tabs, Tag } from 'antd';
import { CalculatorOutlined, DollarOutlined, EditOutlined, ExperimentOutlined, LineChartOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import {
  Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts';
import { useDemo } from '../../store/demoStore';
import { useDeal, useDealFields } from '../../store/hooks';
import { UW_INPUTS, TOLERANCES } from '../../data/underwriting';
import { underwrite, usd, CALC_ENGINE_VERSION, NO_SENSITIVITY, type Sensitivity, type UwResult } from '../../calc/underwriting';
import { MetricCard, PageHeader } from '../../components/ui';
import { CitationChip } from '../../components/viewer';
import { PermButton, Sensitive } from '../../components/perm';
import type { Citation, UwInputs } from '../../data/types';
import { CapChip, TodayGate, useToday } from '../../components/today';
import { CAPS, CAP_STATUS, type CapId } from '../../data/currentState';
import WorkbookAudit from './WorkbookAudit';

// Today-lens status per tab: the agent audits the workbook's figures; recomputing them in code is Release 1.
const TAB_CAPS: Record<string, CapId> = {
  audit: 'uw.workbookAudit', inputs: 'uw.cellCitations', su: 'uw.calcEngine', op: 'uw.calcEngine', credit: 'uw.calcEngine',
  fees: 'uw.calcEngine', sens: 'uw.sensitivity', tol: 'testing.evals',
};

const SERIES = ['#521B3A', '#F2E286', '#8A5A78', '#CDB9C3', '#6B2A4E', '#E9D27A', '#B48AA3', '#EADDE3'];

// Workbook cell strings look like 'Form A-1 · Uses!C6' or 'Pro forma v2 · Operating Budget!C24'.
function cellCitation(ref: string | undefined, version: 'v2' | 'v3'): Citation | null {
  if (!ref) return null;
  const [src, cell] = ref.split(' · ');
  if (src.startsWith('Form A-1')) return { docId: 'd-form-a1', cell };
  if (src.startsWith('Pro forma')) return { docId: `d-proforma-${version}`, cell };
  if (src.startsWith('Lender term sheet')) return { docId: 'd-lender-ts', page: 2, passageId: 'lts-loan' };
  return null;
}

const pct = (v: number) => `${v.toFixed(2)}%`;

interface InputRow { key: string; label: string; value: ReactNode; cite: Citation | null }

function inputRows(i: UwInputs): InputRow[] {
  const v = i.version;
  const c = (k: string) => cellCitation(i.cells[k], v);
  const avgRent = i.gprMonthlyByBand.reduce((a, b) => a + b.units * b.rent, 0) / i.units;
  return [
    { key: 'rents', label: 'Net rents by AMI band', value: `${i.gprMonthlyByBand.length} bands · avg ${usd(avgRent)} / unit / month`, cite: c('rents') },
    { key: 'otherIncome', label: 'Other income', value: usd(i.otherIncome), cite: c('otherIncome') },
    { key: 'vacancyPct', label: 'Vacancy and collection loss', value: `${i.vacancyPct}% of GPR`, cite: c('vacancyPct') },
    { key: 'opexPerUnit', label: 'Operating expenses per unit', value: usd(i.opexPerUnit), cite: c('opexPerUnit') },
    { key: 'replacementReservePerUnit', label: 'Replacement reserve per unit', value: usd(i.replacementReservePerUnit), cite: c('replacementReservePerUnit') },
    { key: 'acquisition', label: 'Acquisition (land)', value: usd(i.acquisition), cite: c('acquisition') },
    { key: 'hardCosts', label: 'Hard costs incl. contingency', value: usd(i.hardCosts), cite: c('hardCosts') },
    { key: 'softCosts', label: 'Soft costs', value: usd(i.softCosts), cite: c('softCosts') },
    { key: 'financingCosts', label: 'Financing costs', value: usd(i.financingCosts), cite: c('financingCosts') },
    { key: 'developerFee', label: 'Developer fee', value: <Sensitive>{usd(i.developerFee)}</Sensitive>, cite: c('developerFee') },
    { key: 'reserves', label: 'Operating reserve', value: usd(i.reserves), cite: c('reserves') },
    { key: 'permLoan', label: 'Permanent loan', value: usd(i.permLoan), cite: c('permLoan') },
    { key: 'rate', label: 'Rate and amortization', value: `${i.rate.toFixed(2)}% · ${i.amortYears} years`, cite: c('rate') },
    { key: 'creditRequest', label: 'Annual 9% credit request', value: `${usd(i.creditRequest)} / yr`, cite: c('creditRequest') },
    { key: 'creditPrice', label: 'Credit price (equity pricing)', value: <Sensitive>${i.creditPrice.toFixed(2)} per credit</Sensitive>, cite: c('creditPrice') },
    ...i.otherSources.map((s) => ({ key: s.name, label: s.name, value: usd(s.amount), cite: cellCitation(s.cell, v) })),
    { key: 'regTermYears', label: 'Regulatory agreement term', value: `${i.regTermYears} years`, cite: c('regTermYears') },
  ];
}

function StepTable({ rows }: { rows: { step: string; formula: string; value: ReactNode; rule?: string }[] }) {
  return (
    <Table
      size="small"
      pagination={false}
      rowKey="step"
      dataSource={rows}
      columns={[
        { title: 'Step', dataIndex: 'step', width: 230, render: (v) => <strong>{v}</strong> },
        { title: 'Formula', dataIndex: 'formula', render: (v) => <span className="mono">{v}</span> },
        { title: 'Value', dataIndex: 'value', align: 'right', width: 170 },
        { title: 'Rule', dataIndex: 'rule', width: 130, render: (v) => (v ? <Tag color="purple">{v}</Tag> : null) },
      ]}
    />
  );
}

function SensitivityTab({ inputs, base }: { inputs: UwInputs; base: UwResult }) {
  const [s, setS] = useState<Sensitivity>(NO_SENSITIVITY);
  const r = useMemo(() => underwrite(inputs, s), [inputs, s]);
  const breakAt = useMemo(() => {
    for (let k = 0; k >= -30; k -= 0.1) {
      if (underwrite(inputs, { ...NO_SENSITIVITY, rentPct: k }).dscr < 1.15) return k;
    }
    return null;
  }, [inputs]);
  const delta = (now: number, was: number, fmt: (v: number) => string) => {
    const d = now - was;
    if (Math.abs(d) < 0.005) return 'no change';
    return `${d > 0 ? '+' : ''}${fmt(d)} vs base`;
  };
  const slider = (label: string, key: keyof Sensitivity, min: number, max: number, step: number, fmt: (v: number) => string) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <strong>{label}</strong>
        <Tag color={s[key] ? 'purple' : 'default'}>{fmt(s[key])}</Tag>
      </div>
      <Slider min={min} max={max} step={step} value={s[key]} onChange={(v) => setS({ ...s, [key]: v as number })} tooltip={{ formatter: (v) => fmt(v ?? 0) }} />
    </div>
  );
  return (
    <Row gutter={[16, 16]} data-tour="sensitivity">
      <Col xs={24} lg={10}>
        <Card title="Stress the model" extra={<a onClick={() => setS(NO_SENSITIVITY)}>Reset</a>}>
          {slider('Rents', 'rentPct', -15, 10, 0.5, (v) => `${v > 0 ? '+' : ''}${v}%`)}
          {slider('Operating expenses', 'opexPct', -10, 20, 0.5, (v) => `${v > 0 ? '+' : ''}${v}%`)}
          {slider('Interest rate', 'rateDelta', -1, 2, 0.05, (v) => `${v > 0 ? '+' : ''}${v.toFixed(2)} pp`)}
          {slider('Credit price', 'creditPriceDelta', -0.1, 0.05, 0.01, (v) => `${v > 0 ? '+' : ''}$${v.toFixed(2)}`)}
          <Alert type="info" showIcon message="Sliders run the same deterministic engine on a scratch copy. They do not change the deal record or any finding." />
        </Card>
      </Col>
      <Col xs={24} lg={14}>
        <Row gutter={[12, 12]}>
          <Col span={12}><MetricCard label="DSCR" value={`${r.dscr.toFixed(2)}x`} sub={`${delta(r.dscr, base.dscr, (v) => v.toFixed(2))} · lender min 1.20x`} tone={r.dscrPass ? 'success' : 'danger'} icon={<LineChartOutlined />} /></Col>
          <Col span={12}><MetricCard label="NOI (year 1)" value={usd(r.noi)} sub={delta(r.noi, base.noi, (v) => usd(v))} icon={<DollarOutlined />} /></Col>
          <Col span={12}><MetricCard label="Gap-method credit" value={usd(r.gapCredit)} sub={`max credit ${usd(r.maxCredit)} · HCR-C-08`} icon={<CalculatorOutlined />} tone="primary" /></Col>
          <Col span={12}><MetricCard label="Sources - uses" value={usd(r.balance)} sub={delta(r.balance, base.balance, (v) => usd(v))} tone={r.balance < 0 ? 'danger' : 'success'} icon={<SafetyCertificateOutlined />} /></Col>
        </Row>
        <Card style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13.5 }}>
            <strong>What rent decrease would break DSCR below 1.15?</strong>
            <div style={{ marginTop: 6 }}>
              {breakAt === null ? 'DSCR stays above 1.15 for any rent decrease up to 30%.' : <>A rent decrease of <Tag color="error">{Math.abs(breakAt).toFixed(1)}%</Tag> takes DSCR below 1.15x, all else equal.</>}
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Solved by stepping the rent input through {CALC_ENGINE_VERSION}; no model estimate involved.</div>
          </div>
        </Card>
      </Col>
    </Row>
  );
}

const KAT_GROUPS = [
  { group: 'Debt service and mortgage constants', count: 6 },
  { group: 'Operating pro forma and NOI', count: 6 },
  { group: 'DSCR and coverage tests', count: 4 },
  { group: 'Sources and uses reconciliation', count: 5 },
  { group: 'Eligible and qualified basis', count: 6 },
  { group: 'Credit calculation (HCR-C-08)', count: 5 },
  { group: 'Developer fee and builder fee caps', count: 6 },
];

export default function Underwriting() {
  const deal = useDeal();
  const { modal } = AntdApp.useApp();
  const uwVersions = useDemo((s) => s.uwVersion);
  const version = uwVersions[deal.id] ?? 'v2';
  const fields = useDealFields(deal.id);
  const inputs = UW_INPUTS[version];
  const r = useMemo(() => underwrite(inputs), [inputs]);
  const r2 = useMemo(() => underwrite(UW_INPUTS.v2), []);
  const r3 = useMemo(() => underwrite(UW_INPUTS.v3), []);
  const today = useToday();

  if (deal.id !== 'harlow') {
    return (
      <Card>
        <Empty description="Underwriting runs once the HCR application workbook (Form A-1) and the sponsor pro forma are ingested from the deal package." />
      </Card>
    );
  }

  const odgField = fields.find((f) => f.id === 'x-gty-2');
  const proFormaDoc = `d-proforma-${version}`;

  const usesData = [
    { name: 'Uses', ...Object.fromEntries(r.uses.map((u) => [u.name, u.amount])) },
    { name: 'Sources', ...Object.fromEntries(r.sources.map((s) => [s.name, s.amount])) },
  ];
  const stackKeys = [...r.uses.map((u) => u.name), ...r.sources.map((s) => s.name)];

  const cmpKeys: { label: string; get: (i: UwInputs, x: UwResult) => string }[] = [
    { label: 'Operating expenses per unit', get: (i) => usd(i.opexPerUnit) },
    { label: 'Soft costs', get: (i) => usd(i.softCosts) },
    { label: 'Regulatory agreement term', get: (i) => `${i.regTermYears} years` },
    { label: 'Total development cost', get: (_, x) => usd(x.tdc) },
    { label: 'NOI (year 1)', get: (_, x) => usd(x.noi) },
    { label: 'DSCR', get: (_, x) => `${x.dscr.toFixed(2)}x` },
    { label: 'Gap-method credit', get: (_, x) => usd(x.gapCredit) },
    { label: 'Sources - uses', get: (_, x) => usd(x.balance) },
    { label: 'Developer fee % of base', get: (_, x) => pct(x.devFeePctOfBase) },
  ];

  const [params, setParams] = useSearchParams(); // tab in the URL so the tour can open a tab
  const tabs = [
    {
      key: 'inputs',
      label: 'Input set',
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={version === 'v3' ? 14 : 24}>
            <Card title={`Underwriting input set ${version}`} extra={<span className="muted" style={{ fontSize: 12 }}>{inputs.label} + HCR Form A-1 · cell-level references</span>}>
              <Table<InputRow>
                size="small"
                pagination={false}
                rowKey="key"
                dataSource={inputRows(inputs)}
                columns={[
                  { title: 'Input', dataIndex: 'label', render: (v) => <strong>{v}</strong> },
                  { title: 'Value', dataIndex: 'value', align: 'right' },
                  { title: 'Source cell', dataIndex: 'cite', width: 300, render: (c: Citation | null) => (c ? <CitationChip c={c} /> : <span className="muted">-</span>) },
                ]}
              />
            </Card>
          </Col>
          {version === 'v3' ? (
            <Col xs={24} xl={10}>
              <TodayGate cap="change.supersede">
              <Card title="Version comparison · v2 vs v3">
                <Table
                  size="small"
                  pagination={false}
                  rowKey="label"
                  dataSource={cmpKeys.map((k) => ({ label: k.label, v2: k.get(UW_INPUTS.v2, r2), v3: k.get(UW_INPUTS.v3, r3) }))}
                  columns={[
                    { title: 'Item', dataIndex: 'label' },
                    { title: 'v2', dataIndex: 'v2', align: 'right', render: (v) => <span className="muted">{v}</span> },
                    { title: 'v3', dataIndex: 'v3', align: 'right', render: (v, row) => <strong style={{ color: v !== row.v2 ? 'var(--plum)' : undefined }}>{v}</strong> },
                  ]}
                />
                <p className="muted" style={{ fontSize: 12, margin: '10px 0 0' }}>v2 is kept as superseded; findings that depended on it were invalidated and recomputed.</p>
              </Card>
              </TodayGate>
            </Col>
          ) : null}
          {version === 'v2' ? (
            <Col span={24}>
              <Alert type="info" showIcon message="A revised sponsor pro forma (v3) arrives in walkthrough scenario 1. The input set is versioned: v3 supersedes v2 and the calculations re-run on it." />
            </Col>
          ) : null}
        </Row>
      ),
    },
    {
      key: 'su',
      label: 'Sources & uses',
      children: (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type={r.balance < 0 ? 'error' : 'success'}
            showIcon
            message={r.balance < 0 ? `Sources are short of uses by ${usd(-r.balance)}` : 'Sources and uses balance'}
            description={r.balance < 0 ? `The gap method (HCR-C-08) supports ${usd(r.gapCredit)} a year against the ${usd(r.creditRequest)} requested - resizing the request closes the gap within both caps.` : undefined}
          />
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Sources" extra={<strong>{usd(r.totalSources)}</strong>}>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="name"
                  dataSource={r.sources}
                  columns={[
                    { title: 'Source', dataIndex: 'name' },
                    { title: 'Amount', dataIndex: 'amount', align: 'right', render: (v: number, row) => (row.name.startsWith('LIHTC') ? <Sensitive>{usd(v)}</Sensitive> : usd(v)) },
                    { title: 'Cell', dataIndex: 'cell', render: (v?: string) => { const c = cellCitation(v, version); return c ? <CitationChip c={c} short /> : null; } },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Uses" extra={<strong>{usd(r.tdc)}</strong>}>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="name"
                  dataSource={r.uses}
                  columns={[
                    { title: 'Use', dataIndex: 'name' },
                    { title: 'Amount', dataIndex: 'amount', align: 'right', render: (v: number, row) => (row.name === 'Developer fee' ? <Sensitive>{usd(v)}</Sensitive> : usd(v)) },
                    { title: '% of TDC', render: (_, row) => <span className="muted">{((row.amount / r.tdc) * 100).toFixed(1)}%</span>, align: 'right' },
                  ]}
                />
              </Card>
            </Col>
          </Row>
          <Card title="Sources against uses">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={usesData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => usd(Number(v), { compact: true })} />
                <YAxis type="category" dataKey="name" width={70} />
                <RTooltip formatter={(v) => usd(Number(v))} />
                {stackKeys.map((k, idx) => <Bar key={k} dataKey={k} stackId="a" fill={SERIES[idx % SERIES.length]} />)}
                <ReferenceLine x={r.tdc} stroke="#CF1322" strokeDasharray="4 3" label={{ value: 'TDC', position: 'top', fill: '#CF1322', fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Space>
      ),
    },
    {
      key: 'op',
      label: 'Operating pro forma & DSCR',
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={9}>
            <Card title="Year-1 build-up">
              <Table<{ k: string; v: string; b?: boolean; bad?: boolean }>
                size="small"
                pagination={false}
                rowKey="k"
                dataSource={[
                  { k: 'Gross potential rent', v: usd(r.gpr) },
                  { k: 'Other income', v: usd(inputs.otherIncome) },
                  { k: `Vacancy (${inputs.vacancyPct}%)`, v: usd(-r.vacancy) },
                  { k: 'Effective gross income', v: usd(r.egi), b: true },
                  { k: 'Operating expenses', v: usd(-r.opex) },
                  { k: 'Replacement reserve', v: usd(-r.reserve) },
                  { k: 'Net operating income', v: usd(r.noi), b: true },
                  { k: `Debt service (${r.rate}% / ${inputs.amortYears} yr)`, v: usd(r.annualDebtService) },
                  { k: 'DSCR', v: `${r.dscr.toFixed(2)}x`, b: true, bad: !r.dscrPass },
                ]}
                columns={[
                  { dataIndex: 'k', render: (v, row) => (row.b ? <strong>{v}</strong> : v) },
                  { dataIndex: 'v', align: 'right', render: (v, row) => <span style={{ fontWeight: row.b ? 700 : 400, color: row.bad ? '#CF1322' : undefined }}>{v}</span> },
                ]}
                showHeader={false}
              />
              <div style={{ marginTop: 10 }}>
                <Space size={6} wrap>
                  <span className="muted" style={{ fontSize: 12 }}>Covenant:</span>
                  <CitationChip c={{ docId: 'd-lender-ts', page: 2, passageId: 'lts-dscr' }} />
                </Space>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={15}>
            <Card title="15-year operating projection" extra={<span className="muted" style={{ fontSize: 12 }}>Income +2.0% / yr · expenses +3.0% / yr</span>}>
              <ResponsiveContainer width="100%" height={330}>
                <ComposedChart data={r.cashFlow} margin={{ left: 10, right: 10, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" tickFormatter={(v) => `Y${v}`} />
                  <YAxis yAxisId="left" tickFormatter={(v) => usd(Number(v), { compact: true })} />
                  <YAxis yAxisId="right" orientation="right" domain={[0.8, 1.4]} tickFormatter={(v) => `${Number(v).toFixed(2)}x`} />
                  <RTooltip formatter={(v, name) => (name === 'DSCR' ? `${Number(v).toFixed(2)}x` : usd(Number(v)))} labelFormatter={(l) => `Year ${l}`} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="noi" name="NOI" fill="#CDB9C3" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="debtService" name="Debt service" fill="#E9D27A" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="dscr" name="DSCR" stroke="#521B3A" strokeWidth={2.5} dot={{ r: 3 }} />
                  <ReferenceLine yAxisId="right" y={inputs.lenderMinDscr} stroke="#CF1322" strokeDasharray="5 4" label={{ value: 'Lender min 1.20x', position: 'insideTopRight', fill: '#CF1322', fontSize: 11 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'credit',
      label: 'Eligible basis → credit',
      children: (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="HCR-C-08 · 9 NYCRR 2040.3(g)(4)"
            description="Credit = lesser of eligible allocation (qualified basis × applicable %) and gap amount ((adjusted project cost - supportable debt - other financing) ÷ higher of market or syndication pricing)."
          />
          <Card title="Eligible allocation">
            <StepTable rows={[
              { step: 'Eligible basis', formula: 'hard + soft × 0.85 + developer fee + financing × 0.60', value: <Sensitive>{usd(r.eligibleBasis)}</Sensitive> },
              { step: 'Applicable fraction', formula: '83 restricted ÷ 84 units', value: pct(inputs.applicableFraction * 100) },
              { step: 'Basis boost', formula: 'QCT / DDA designation', value: `${Math.round(inputs.basisBoost * 100)}%` },
              { step: 'Qualified basis', formula: 'eligible basis × fraction × boost', value: <Sensitive>{usd(r.qualifiedBasis)}</Sensitive> },
              { step: 'Applicable percentage', formula: '9% credit', value: `${inputs.applicablePct}%` },
              { step: 'Eligible credit', formula: 'qualified basis × 9%', value: usd(r.eligibleCredit), rule: 'HCR-C-08' },
            ]} />
          </Card>
          <Card title="Gap amount">
            <StepTable rows={[
              { step: 'Adjusted project cost', formula: 'total development cost', value: usd(r.tdc) },
              { step: 'Supportable debt', formula: 'permanent loan', value: usd(inputs.permLoan) },
              { step: 'Other financing', formula: 'HTF + city capital + NYSERDA + deferred fee + GP', value: usd(inputs.otherSources.reduce((a, b) => a + b.amount, 0)) },
              { step: 'Pricing factor', formula: `10 years × $${r.creditPrice.toFixed(2)} × 99.9% sold`, value: <Sensitive>{r.pricingFactor.toFixed(4)}</Sensitive>, rule: 'HCR-C-07' },
              { step: 'Gap credit', formula: '(cost - debt - other) ÷ pricing factor', value: usd(r.gapCredit), rule: 'HCR-C-08' },
            ]} />
          </Card>
          <Card title="Credit">
            <StepTable rows={[
              { step: 'Eligible credit', formula: 'from above', value: usd(r.eligibleCredit), rule: 'HCR-C-08' },
              { step: 'Gap credit', formula: 'from above', value: usd(r.gapCredit), rule: 'HCR-C-08' },
              { step: 'Per-project cap, NYC metro', formula: 'term sheet value', value: usd(r.capProject), rule: 'HCR-T-08a' },
              { step: 'Per-unit cap, NYC metro', formula: `$35,000 × ${inputs.units} units`, value: usd(r.capPerUnit), rule: 'HCR-T-08e' },
              { step: 'Maximum credit', formula: 'min(eligible, gap, project cap, per-unit cap)', value: <strong>{usd(r.maxCredit)}</strong> },
              { step: 'Requested', formula: 'Form A-1 Sources!C8', value: usd(r.creditRequest) },
              { step: 'Headroom', formula: 'maximum - requested', value: <span style={{ color: 'var(--plum)', fontWeight: 700 }}>{usd(r.maxCredit - r.creditRequest)}</span> },
            ]} />
          </Card>
        </Space>
      ),
    },
    {
      key: 'fees',
      label: 'Fee caps',
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Developer fee · HCR-C-02 / C-03 / C-05">
              <div className="kv" style={{ marginBottom: 14 }}>
                <span className="k">Developer fee</span><span><Sensitive>{usd(inputs.developerFee)}</Sensitive></span>
                <span className="k">Base</span><span>Acquisition + improvement cost = {usd(inputs.acquisition + r.improvementCost)}</span>
                <span className="k">Base cap 10%</span><span>{usd(r.devFeeBaseCap)}</span>
                <span className="k">Fee % of base</span><span><Tag color={r.devFeePctOfBase > 10 ? 'error' : 'success'}>{pct(r.devFeePctOfBase)}</Tag></span>
                <span className="k">Ceiling 15%</span><span>{usd(r.devFeeCeiling)} of improvement cost - only with both guarantees</span>
              </div>
              <Progress percent={Math.min(100, (r.devFeePctOfBase / 15) * 100)} success={{ percent: (10 / 15) * 100 }} showInfo={false} strokeColor="#CF1322" />
              <div className="muted" style={{ fontSize: 12, marginBottom: 14 }}>Green: base cap (10%) · red: fee above base · full bar: 15% ceiling</div>
              <Table
                size="small"
                pagination={false}
                rowKey="g"
                dataSource={[
                  { g: 'Completion guarantee', ok: true, c: { docId: 'd-guaranty', page: 1, passageId: 'guar-scope' } as Citation, note: 'Executed' },
                  { g: 'Operating deficit guarantee', ok: odgField?.status !== 'silent', c: { docId: 'd-guaranty', page: 4, passageId: 'guar-limit' } as Citation, note: odgField?.status === 'silent' ? 'Executed guaranty is silent - flagged, not defaulted' : odgField?.value ?? '' },
                ]}
                columns={[
                  { title: 'Required for the 15% ceiling (HCR-C-03)', dataIndex: 'g' },
                  { title: 'Status', dataIndex: 'ok', render: (ok: boolean) => <Tag color={ok ? 'success' : 'error'}>{ok ? 'In place' : 'Missing'}</Tag> },
                  { title: 'Evidence', dataIndex: 'c', render: (c: Citation, row) => <Space direction="vertical" size={2}><CitationChip c={c} /><span className="muted" style={{ fontSize: 11.5 }}>{row.note}</span></Space> },
                ]}
              />
              <p className="muted" style={{ fontSize: 12, margin: '10px 0 0' }}>HCR-C-05: the operating deficit guarantee covers 36 months and is at least 0.20 × developer fee ({usd(inputs.developerFee * 0.2)}).</p>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Builder's fees · HCR-C-01">
              <Table
                size="small"
                pagination={false}
                rowKey="item"
                dataSource={[
                  { item: "Builder's profit", now: inputs.builderProfitPct, cap: 6 },
                  { item: "Builder's overhead", now: inputs.builderOverheadPct, cap: 2 },
                  { item: 'General conditions', now: inputs.generalConditionsPct, cap: 6 },
                  { item: 'Combined', now: r.builderFeesPct, cap: 14 },
                ]}
                columns={[
                  { title: 'Item', dataIndex: 'item', render: (v, row) => (row.item === 'Combined' ? <strong>{v}</strong> : v) },
                  { title: 'Contract', dataIndex: 'now', align: 'right', render: (v: number) => `${v.toFixed(1)}%` },
                  { title: 'Limit', dataIndex: 'cap', align: 'right', render: (v: number) => `≤ ${v.toFixed(1)}%` },
                  { title: 'Result', render: (_, row) => <Tag color={row.now > row.cap ? 'error' : 'success'}>{row.now > row.cap ? 'Over' : 'Within'}</Tag> },
                ]}
              />
              <div className="callout-gold" style={{ marginTop: 14, fontSize: 13 }}>
                Combined fees exceed the cap by {(r.builderFeesPct - 14).toFixed(1)} points of the {usd(inputs.gcContract)} contract - {usd(((r.builderFeesPct - 14) / 100) * inputs.gcContract)}.
              </div>
              <div style={{ marginTop: 10 }}><CitationChip c={{ docId: 'd-cost', page: 3, passageId: 'cost-fees' }} /></div>
            </Card>
          </Col>
        </Row>
      ),
    },
    { key: 'sens', label: 'Sensitivity', children: <SensitivityTab inputs={inputs} base={r} /> },
    {
      key: 'tol',
      label: 'Tolerance report',
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={15}>
            <Card title="Engine output against the reference underwriting model">
              <Table
                size="small"
                pagination={false}
                rowKey="key"
                dataSource={TOLERANCES.map((t) => {
                  const v = r[t.key];
                  const fmt = t.key === 'dscr' ? `${v.toFixed(2)}x` : usd(v);
                  return { ...t, engine: fmt, reference: fmt, diff: t.key === 'dscr' ? '0.00' : '$0' };
                })}
                columns={[
                  { title: 'Metric', dataIndex: 'metric', render: (v) => <strong>{v}</strong> },
                  { title: 'Engine', dataIndex: 'engine', align: 'right' },
                  { title: 'Reference', dataIndex: 'reference', align: 'right' },
                  { title: 'Difference', dataIndex: 'diff', align: 'right' },
                  { title: 'Tolerance', dataIndex: 'tolerance' },
                  { title: 'Result', render: () => <Tag color="success">Within tolerance</Tag> },
                ]}
              />
              <p className="muted" style={{ fontSize: 12, margin: '10px 0 0' }}>Reference: Everstead's known-answer set and the reference underwriting model supplied at kickoff (illustrative values in this demo).</p>
            </Card>
          </Col>
          <Col xs={24} lg={9}>
            <Card title="Known-answer tests">
              {today ? (
                <div style={{ marginBottom: 12, fontSize: 13 }}>
                  <strong>Today: known-answer workbooks · run by hand · not gated in CI</strong>
                  <div style={{ marginTop: 4, color: 'var(--body)' }}>{CAPS['testing.evals'].today}</div>
                  <div className="muted" style={{ marginTop: 6 }}>Release 1, below: every known-answer test runs on every build.</div>
                </div>
              ) : null}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <Progress type="circle" percent={100} size={86} strokeColor="#389E0D" format={() => '38 / 38'} />
                <div style={{ fontSize: 13 }}>Unit-tested, regression-tested and reproducible. Principal rulings supplied as known-answer tests run on every build.</div>
              </div>
              <Table
                size="small"
                pagination={false}
                rowKey="group"
                dataSource={KAT_GROUPS}
                columns={[
                  { title: 'Group', dataIndex: 'group' },
                  { title: 'Passed', dataIndex: 'count', align: 'right', render: (v) => <Tag color="success">{v} / {v}</Tag> },
                ]}
              />
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  const auditTab = { key: 'audit', label: 'Workbook audit · 6 gates', children: <WorkbookAudit dealId={deal.id} /> };
  // Today: the audit tab leads; every tab carries its status chip, and what the platform lacks is dimmed.
  const allTabs = (today ? [auditTab, ...tabs] : [...tabs, auditTab]).map((t) => (today && TAB_CAPS[t.key]
    ? {
      ...t,
      label: <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>{t.label}<CapChip cap={TAB_CAPS[t.key]} label={CAP_STATUS[CAPS[TAB_CAPS[t.key]].status].short} /></span>,
      children: <TodayGate cap={TAB_CAPS[t.key]} chip="none">{t.children}</TodayGate>,
    }
    : t));

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Rows 9-10 · workbook ingestion and deterministic calculations"
        title="Underwriting"
        cap="uw.workbookAudit"
        desc="DSCR, eligible basis, credit, fee caps, sources and uses: tested, deterministic code - not a language model."
        extra={
          <>
            {today
              ? <Tag icon={<ExperimentOutlined />} color="gold" style={{ padding: '5px 10px', fontSize: 12.5 }}>Today: agent 009 audits the sponsor workbook · deterministic engine not described</Tag>
              : <Tag icon={<ExperimentOutlined />} color="purple" style={{ padding: '5px 10px', fontSize: 12.5 }}>Deterministic code · {CALC_ENGINE_VERSION} · known-answer tests 38/38</Tag>}
            <Tag style={{ padding: '5px 10px', fontSize: 12.5 }}>Input set {version}</Tag>
            <PermButton
              feature="change.supersede"
              cap="editUnderwriting"
              denied="Only the Underwriting Analyst edits underwriting inputs"
              icon={<EditOutlined />}
              onClick={() => modal.info({
                title: 'Editing underwriting inputs',
                content: 'Edits never overwrite the current input set. Each change creates a new input-set version with actor, time and basis, re-runs the calculations and invalidates the findings that depended on the changed cells. Values read from executed documents keep their citation; a manual override is labelled as user-entered data.',
              })}
            >
              Edit inputs
            </PermButton>
          </>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }} data-tour="uw-kpis">
        <Col xs={12} lg={6}><MetricCard label="Total development cost" value={usd(r.tdc, { compact: true })} sub={`${usd(r.tdc / inputs.units)} per unit`} icon={<DollarOutlined />} tone="primary" /></Col>
        <Col xs={12} lg={6}><MetricCard label="DSCR" value={`${r.dscr.toFixed(2)}x`} sub="lender minimum 1.20x" icon={<LineChartOutlined />} tone={r.dscrPass ? 'success' : 'danger'} /></Col>
        <Col xs={12} lg={6}><MetricCard label="Sources - uses" value={usd(r.balance)} sub={r.balance < 0 ? 'short - blocking' : 'balanced'} icon={<SafetyCertificateOutlined />} tone={r.balance < 0 ? 'danger' : 'success'} /></Col>
        <Col xs={12} lg={6}><MetricCard label="Gap-method credit" value={usd(r.gapCredit, { compact: true })} sub={`requested ${usd(r.creditRequest, { compact: true })} · HCR-C-08`} icon={<CalculatorOutlined />} /></Col>
      </Row>

      <Card styles={{ body: { paddingTop: 6 } }}>
        <Tabs items={allTabs} activeKey={params.get('tab') ?? (today ? 'audit' : 'inputs')} onChange={(k) => setParams({ tab: k }, { replace: true })} />
      </Card>
      <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
        Source documents: <CitationChip c={{ docId: 'd-form-a1', cell: 'Sources!C16' }} /> <CitationChip c={{ docId: proFormaDoc, cell: 'Operating Budget!C24' }} />
      </p>
    </div>
  );
}

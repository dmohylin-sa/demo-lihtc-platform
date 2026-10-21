// Release 1 acceptance: the RFP's seven acceptance tests, each linked to where the evidence lives in the demo.
// AT-7 (practitioner sign-off) turns green once the Harlow Commons readiness report is signed.
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, Row, Space, Tag } from 'antd';
import {
  ArrowRightOutlined, AuditOutlined, CalculatorOutlined, CheckCircleFilled, ClockCircleFilled, FileDoneOutlined,
  LockOutlined, RedoOutlined, SwapOutlined, InboxOutlined,
} from '@ant-design/icons';
import { useDemo } from '../store/demoStore';
import { ACCEPTANCE_TESTS, type AcceptanceTest } from '../data/ops';

const ICONS: Record<string, JSX.Element> = {
  'AT-1': <RedoOutlined />,
  'AT-2': <InboxOutlined />,
  'AT-3': <AuditOutlined />,
  'AT-4': <CalculatorOutlined />,
  'AT-5': <SwapOutlined />,
  'AT-6': <LockOutlined />,
  'AT-7': <FileDoneOutlined />,
};

const LATER = [
  { r: 'Release 2', when: 'Q1 2027', what: '9% to construction loan closing · Year 15 overlay · knowledge graph' },
  { r: 'Release 3', when: 'Q2 2027', what: 'Construction to CO and Form 8609 · 4% and bonds' },
  { r: 'Release 4', when: 'Q3 2027', what: 'Lease-up to permanent conversion · supportive housing' },
  { r: 'Release 5', when: 'Q4 2027', what: 'Asset management and compliance · HUD and RAD' },
  { r: 'Beyond NY', when: '2028', what: 'Federal backbone, then PA, MA, IL, CA, TX' },
];

export default function Acceptance() {
  const navigate = useNavigate();
  const harlowReport = useDemo((s) => s.report.harlow);
  const tests = useMemo<AcceptanceTest[]>(() => ACCEPTANCE_TESTS.map((t) =>
    t.id === 'AT-7' && harlowReport?.status === 'signed'
      ? { ...t, status: 'Passed', result: `Signed off by ${harlowReport.signedBy} on ${harlowReport.signedAt} with ${Object.keys(harlowReport.edits).length} practitioner edits - no material rewrite` }
      : t), [harlowReport]);
  const passed = tests.filter((t) => t.status === 'Passed').length;

  return (
    <div className="fade-in">
      <div className="hero" style={{ marginBottom: 20 }}>
        <span className="eyebrow">Release 1 acceptance</span>
        <h1>Validated, not demonstrated</h1>
        <div className="sub">Release 1 is accepted on real deal files Everstead supplies, against agreed tolerances. Each test below links to where its evidence lives. {passed} of {tests.length} pass in this session.</div>
        <div className="rule" />
      </div>

      <Row gutter={[16, 16]} data-tour="acceptance-grid">
        {tests.map((t) => {
          const ok = t.status === 'Passed';
          return (
            <Col xs={24} md={12} xl={8} key={t.id}>
              <Card hoverable onClick={() => navigate(t.route)} style={{ height: '100%', borderTop: `3px solid ${ok ? '#389E0D' : 'var(--gold)'}` }} styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%' } }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <span className="icon-chip" style={{ background: ok ? '#F0F8F2' : 'var(--gold-fill)', color: ok ? '#389E0D' : 'var(--plum)' }}>{ICONS[t.id]}</span>
                  <Tag color={ok ? 'success' : t.status === 'In progress' ? 'gold' : 'default'} icon={ok ? <CheckCircleFilled /> : <ClockCircleFilled />}>{t.status}</Tag>
                </div>
                <span className="eyebrow" style={{ marginTop: 12 }}>{t.id}</span>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, margin: '2px 0 6px' }}>{t.name}</div>
                <div style={{ fontSize: 13, color: 'var(--secondary)', marginBottom: 10 }}>{t.measure}</div>
                <div className="panel" style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 12, flex: 1 }}>{t.result}</div>
                <Button type="link" style={{ padding: 0, alignSelf: 'flex-start' }} onClick={(e) => { e.stopPropagation(); navigate(t.route); }}>
                  Evidence: {t.evidence} <ArrowRightOutlined />
                </Button>
              </Card>
            </Col>
          );
        })}
      </Row>
      <p className="muted" style={{ fontSize: 12, margin: '10px 0 22px' }}>
        Metrics are illustrative demo values. Thresholds for repeatability, tolerances and "without material rewrite" are agreed with Everstead before build starts.
      </p>

      <Card title={<span>Later releases <Tag style={{ marginLeft: 8 }}>Not part of this demo</Tag></span>} styles={{ body: { padding: 16 } }}>
        <Space size={[10, 10]} wrap>
          {LATER.map((l) => (
            <div key={l.r} style={{ border: '1px dashed var(--border)', borderRadius: 10, padding: '8px 12px', background: 'var(--panel-soft)', maxWidth: 300 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}><strong style={{ fontFamily: 'var(--font-head)' }}>{l.r}</strong><span className="muted" style={{ fontSize: 12 }}>{l.when}</span></div>
              <div style={{ fontSize: 12.5, color: 'var(--secondary)' }}>{l.what}</div>
            </div>
          ))}
        </Space>
      </Card>
    </div>
  );
}

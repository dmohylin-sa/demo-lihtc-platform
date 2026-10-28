// Audit workspace shared by the deal audit trail and the all-tenants admin view: an append-only, hash-chained
// log with live chain verification, a tamper simulation and CSV / JSON export (requirement 07).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, App as AntdApp, Button, Card, Col, Input, Progress, Row, Space, Switch, Table, Tag, Tooltip } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, DownloadOutlined, LinkOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDemo, verifyChain } from '../store/demoStore';
import { CapChip, TodayGate, useToday } from './today';
import type { AuditEvent } from '../data/types';

const short = (h: string) => `${h.slice(0, 8)}…${h.slice(-4)}`;

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function AuditWorkspace({ events, showTenant = false, scopeLabel, fileStem }: {
  events: AuditEvent[]; // events shown (already scoped)
  showTenant?: boolean;
  scopeLabel: string;
  fileStem: string;
}) {
  const audit = useDemo((s) => s.audit); // the full chain - verification always walks every link
  const tamperSeq = useDemo((s) => s.tamperSeq);
  const setTamper = useDemo((s) => s.setTamper);
  const { message } = AntdApp.useApp();
  const today = useToday();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [verify, setVerify] = useState<{ running: boolean; at: number; result: ReturnType<typeof verifyChain> | null }>({ running: false, at: 0, result: null });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Leaving an audit view clears the tamper simulation, so the other view starts from an intact chain.
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); setTamper(null); }, [setTamper]);

  // The tamper target: an event in the middle of what this view shows.
  const tamperTarget = events.length ? events[Math.floor(events.length / 2)].seq : null;

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s ? events.filter((e) => `${e.actor} ${e.role} ${e.action} ${e.object} ${e.tenant}`.toLowerCase().includes(s)) : events;
    return [...list].sort((a, b) => b.seq - a.seq);
  }, [events, q]);

  const runVerify = () => {
    if (timer.current) clearInterval(timer.current);
    const total = audit.length;
    const result = verifyChain(audit, tamperSeq);
    const stopAt = result.ok ? total : audit.findIndex((e) => e.seq === result.brokenAt) + 1;
    setVerify({ running: true, at: 0, result: null });
    let i = 0;
    timer.current = setInterval(() => {
      i += 1;
      if (i >= stopAt) {
        clearInterval(timer.current!);
        setVerify({ running: false, at: stopAt, result });
      } else setVerify((v) => ({ ...v, at: i }));
    }, Math.max(18, Math.round(900 / total)));
  };

  const toggleTamper = (on: boolean) => {
    setTamper(on && tamperTarget ? tamperTarget : null);
    setVerify({ running: false, at: 0, result: null });
    if (on) message.warning(`Event #${tamperTarget} edited in storage (simulation). Run the verification.`);
  };

  const checking = audit[Math.max(0, verify.at - 1)];
  const brokenAt = verify.result && !verify.result.ok ? verify.result.brokenAt : null;

  const exportCsv = () => {
    const head = ['seq', 'at', 'actor', 'role', 'tenant', 'deal', 'action', 'object', 'basis', 'prevHash', 'hash'];
    const body = rows.map((e) => [e.seq, e.at, e.actor, e.role, e.tenant, e.dealId ?? '', e.action, e.object, e.basis ?? '', e.prevHash, e.hash].map(csvCell).join(','));
    download(`${fileStem}.csv`, [head.join(','), ...body].join('\n'), 'text/csv');
    message.success(`${rows.length} events exported as CSV`);
  };
  const exportJson = () => {
    download(`${fileStem}.json`, JSON.stringify({ scope: scopeLabel, algorithm: 'sha256(seq|at|actor|role|tenant|deal|action|object|basis|prevHash)', events: rows }, null, 2), 'application/json');
    message.success(`${rows.length} events exported as JSON`);
  };

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <TodayGate cap="audit.hashChain" fill>
          <Card data-tour="audit-verify" title={<span><SafetyCertificateOutlined /> Verify chain integrity</span>} style={{ height: '100%' }}
            extra={<Button type="primary" onClick={runVerify} loading={verify.running}>Verify chain</Button>}>
            <div style={{ fontSize: 13, color: 'var(--body)', marginBottom: 12 }}>
              Each event stores the hash of the one before it. Verification recomputes every hash from genesis; editing any stored event breaks every link after it.
            </div>
            {verify.running ? (
              <>
                <Progress percent={Math.round((verify.at / audit.length) * 100)} strokeColor="#521B3A" />
                <div className="mono muted" style={{ fontSize: 12 }}>
                  Checking event #{checking?.seq}: sha256(payload + {checking ? short(checking.prevHash) : ''}) = {checking ? short(checking.hash) : ''}
                </div>
              </>
            ) : verify.result ? (
              verify.result.ok ? (
                <Alert className="fade-in" type="success" showIcon icon={<CheckCircleFilled />}
                  message={`Chain intact - ${audit.length} events verified from genesis`}
                  description={<span className="mono" style={{ fontSize: 12 }}>Head hash {audit[audit.length - 1]?.hash}</span>} />
              ) : (
                <Alert className="fade-in" type="error" showIcon icon={<CloseCircleFilled />}
                  message={`Chain broken at event #${verify.result.brokenAt}`}
                  description="The stored hash no longer matches the recomputed hash. The edit is detected, and every later event is reported as unverifiable until the record is restored from the append-only store." />
              )
            ) : (
              <div className="muted" style={{ fontSize: 13 }}>Not verified in this session yet.</div>
            )}
          </Card>
          </TodayGate>
        </Col>
        <Col xs={24} lg={10}>
          <TodayGate cap="audit.export" fill>
          <Card title="Simulate tampering" style={{ height: '100%' }}>
            <Space align="start" size={12}>
              <Switch checked={tamperSeq !== null} onChange={toggleTamper} disabled={!tamperTarget} />
              <div style={{ fontSize: 13, color: 'var(--body)' }}>
                Edits the stored text of event #{tamperTarget ?? '-'} as if someone changed the database directly. Run the verification to see it caught.
                {tamperSeq !== null ? <div style={{ marginTop: 6 }}><Tag color="error">Event #{tamperSeq} altered</Tag></div> : null}
              </div>
            </Space>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button icon={<DownloadOutlined />} onClick={exportCsv}>Export CSV</Button>
              <Button icon={<DownloadOutlined />} onClick={exportJson}>Export JSON</Button>
            </div>
          </Card>
          </TodayGate>
        </Col>
      </Row>

      <Card
        styles={{ body: { padding: 0 } }}
        title={<span>{scopeLabel} <span className="muted" style={{ fontWeight: 500 }}>· {rows.length} events · append-only</span> <CapChip cap="audit.trail" style={{ marginLeft: 6 }} /></span>}
        extra={
          <Space>
            {today ? <Button type="link" onClick={() => navigate('/deals/harlow/runs')}>Per-run audit rows → Agent runs</Button> : null}
            <Input.Search allowClear placeholder="Filter by actor, action or object" onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
          </Space>
        }
      >
        <Table<AuditEvent>
          rowKey="seq"
          size="middle"
          dataSource={rows}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          onRow={(e) => ({ style: e.seq === brokenAt ? { background: '#FFF1F0', boxShadow: 'inset 3px 0 0 #CF1322' } : e.seq === tamperSeq ? { background: '#FFFBE6' } : undefined })}
          columns={[
            { title: '#', dataIndex: 'seq', width: 56, render: (v) => <span className="mono">{v}</span> },
            { title: 'Time', dataIndex: 'at', width: 150, render: (v) => <span className="mono" style={{ fontSize: 12 }}>{v}</span> },
            { title: 'Actor', width: 190, render: (_, e) => <span><strong>{e.actor}</strong><br /><span className="muted" style={{ fontSize: 12 }}>{e.role}</span></span> },
            ...(showTenant ? [{ title: 'Tenant', width: 170, render: (_: unknown, e: AuditEvent) => <Tag style={{ marginInlineEnd: 0 }}>{e.tenant}</Tag> }] : []),
            { title: 'Action', dataIndex: 'action', width: 190, render: (v) => <strong style={{ fontSize: 13 }}>{v}</strong> },
            {
              title: 'Object and basis',
              render: (_, e) => (
                <span style={{ fontSize: 13 }}>
                  {e.seq === tamperSeq ? <span style={{ color: '#CF1322', fontWeight: 600 }}>{e.object} (edited)</span> : e.object}
                  {e.basis ? <><br /><span className="muted" style={{ fontSize: 12 }}>Basis: {e.basis}</span></> : null}
                </span>
              ),
            },
            {
              title: 'Hash chain', width: 170,
              render: (_, e) => (
                <Tooltip title={<span className="mono" style={{ fontSize: 11 }}>prev {e.prevHash}<br />hash {e.hash}</span>} styles={{ root: { maxWidth: 560 } }}>
                  <span className="mono" style={{ fontSize: 11, lineHeight: 1.5 }}>
                    <span className="muted"><LinkOutlined /> {short(e.prevHash)}</span><br />
                    <span style={{ color: e.seq === brokenAt ? '#CF1322' : 'var(--ink)' }}>{short(e.hash)}</span>
                  </span>
                </Tooltip>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}

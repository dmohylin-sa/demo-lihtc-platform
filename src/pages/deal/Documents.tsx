// Documents: package intake at deal scale (resumable upload, malware scan, OCR, classification) and the
// versioned document store with supersession. Rows open the viewer at the first rendered page.
import { useEffect, useMemo, useRef, useState } from 'react';
import { App as AntdApp, Button, Card, Col, Empty, Input, Menu, Progress, Row, Select, Space, Table, Tag, Tooltip, Upload } from 'antd';
import {
  CloudUploadOutlined, FileImageOutlined, FileExcelOutlined, FilePdfOutlined, FileTextOutlined, FileWordOutlined,
  FolderOpenOutlined, InboxOutlined, MailOutlined, PauseOutlined, PlayCircleOutlined, ReloadOutlined, SafetyOutlined,
  ScanOutlined, TagsOutlined, CheckCircleFilled, LoadingOutlined, BuildOutlined,
} from '@ant-design/icons';
import { useDemo } from '../../store/demoStore';
import { useDeal, useDealDocs } from '../../store/hooks';
import { docLabel } from '../../store/selectors';
import { FOLDERS, KEY_DOCS, PACKAGE, fillerDocs } from '../../data/documents';
import { useViewer } from '../../components/viewer';
import { PageHeader } from '../../components/ui';
import { PermButton } from '../../components/perm';
import { useIntakeSim } from './intakeSim';
import type { Doc, DocFormat } from '../../data/types';

const STAGES = [
  { key: 'upload', label: 'Resumable upload', sub: '560 chunks of 5 MB · 2.8 GB', icon: <CloudUploadOutlined />, step: 1.7 },
  { key: 'scan', label: 'Malware scan', sub: '412 files scanned on arrival', icon: <SafetyOutlined />, step: 4.2 },
  { key: 'ocr', label: 'OCR and layout', sub: '1,132 scanned pages · page and passage anchors', icon: <ScanOutlined />, step: 2.6 },
  { key: 'classify', label: 'Classification', sub: 'Phase 1 document types', icon: <TagsOutlined />, step: 3.4 },
] as const;

const STORE_STATUS = ['uploading', 'scanning', 'processing', 'processing'] as const;

const FORMAT_ICON: Record<DocFormat, JSX.Element> = {
  pdf: <FilePdfOutlined style={{ color: '#B23A48' }} />,
  xlsx: <FileExcelOutlined style={{ color: '#2E7D4F' }} />,
  docx: <FileWordOutlined style={{ color: '#3A5A99' }} />,
  eml: <MailOutlined style={{ color: 'var(--plum)' }} />,
  jpg: <FileImageOutlined style={{ color: 'var(--muted)' }} />,
  dwg: <BuildOutlined style={{ color: 'var(--muted)' }} />,
};

interface Sim {
  stage: number; // 0..4, 4 = complete
  pct: number[];
  running: boolean;
  paused: boolean;
  feed: { at: string; text: string }[];
  mode: 'replay' | 'live';
}

const COMPLETE: Sim = { stage: 4, pct: [100, 100, 100, 100], running: false, paused: false, feed: [], mode: 'replay' };
const IDLE: Sim = { stage: 0, pct: [0, 0, 0, 0], running: false, paused: false, feed: [], mode: 'live' };

const clock = () => new Date().toTimeString().slice(0, 8);

function feedLine(stage: number, pct: number, names: Doc[], tick: number): string {
  const d = names[tick % names.length];
  if (stage === 0) return `Chunk ${Math.min(560, Math.round((pct / 100) * 560))} of 560 received · checksum verified`;
  if (stage === 1) return `Scanned ${Math.min(412, Math.round((pct / 100) * 412))} of 412 files · clean`;
  if (stage === 2) return `OCR ${d.name} · page ${1 + (tick % Math.max(1, d.pages))} of ${d.pages} · layout captured`;
  return `Classified ${d.name} → ${d.docType} (${Math.round(d.confidence * 100)}%)`;
}

export default function Documents() {
  const deal = useDeal();
  const docs = useDealDocs(deal.id);
  const upload = useDemo((s) => s.upload[deal.id]);
  const superseded = useDemo((s) => s.superseded);
  const setUpload = useDemo((s) => s.setUpload);
  const completeUpload = useDemo((s) => s.completeUpload);
  const show = useViewer((s) => s.show);
  const token = useIntakeSim((s) => s.token);
  const { message } = AntdApp.useApp();

  const status = upload?.status ?? 'none';
  const [sim, setSim] = useState<Sim>(() => (status === 'done' ? COMPLETE : status === 'none' ? IDLE : { ...IDLE, running: true }));
  const [folder, setFolder] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();

  // Names used for the live job feed: the deal's own documents, key ones first.
  const feedDocs = useMemo(() => {
    const base = deal.id === 'harlow' ? [...KEY_DOCS, ...fillerDocs('harlow').slice(0, 30)] : fillerDocs(deal.id).slice(0, 40);
    return base.filter((d) => d.format !== 'jpg');
  }, [deal.id]);

  // Reset when switching deals.
  useEffect(() => {
    setSim(status === 'done' ? COMPLETE : status === 'none' ? IDLE : { ...IDLE, running: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal.id]);

  // Replay requested by the guided tour (skip the initial mount).
  const firstToken = useRef(token);
  useEffect(() => {
    if (token !== firstToken.current && status === 'done') replay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Simulation clock.
  const tick = useRef(0);
  useEffect(() => {
    if (!sim.running || sim.paused) return;
    const t = setInterval(() => {
      tick.current += 1;
      setSim((s) => {
        if (!s.running || s.paused || s.stage >= 4) return s;
        const pct = [...s.pct];
        pct[s.stage] = Math.min(100, pct[s.stage] + STAGES[s.stage].step);
        const feed = tick.current % 3 === 0 ? [{ at: clock(), text: feedLine(s.stage, pct[s.stage], feedDocs, tick.current) }, ...s.feed].slice(0, 9) : s.feed;
        if (pct[s.stage] >= 100) {
          const next = s.stage + 1;
          const doneLine = { at: clock(), text: `${STAGES[s.stage].label} complete` };
          return { ...s, pct, stage: next, running: next < 4, feed: [doneLine, ...feed].slice(0, 9) };
        }
        return { ...s, pct, feed };
      });
    }, 90);
    return () => clearInterval(t);
  }, [sim.running, sim.paused, feedDocs]);

  // Live intake mirrors stage changes into the store and completes the package at the end.
  useEffect(() => {
    if (sim.mode !== 'live' || status === 'done') return;
    if (sim.stage >= 4) {
      completeUpload(deal.id);
      message.success(`${PACKAGE.files} files processed and classified`);
    } else if (sim.running) {
      setUpload(deal.id, { status: sim.paused ? 'paused' : STORE_STATUS[sim.stage], progress: Math.round(sim.pct.reduce((a, b) => a + b, 0) / 4) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim.stage, sim.paused, sim.running]);

  function replay() {
    tick.current = 0;
    setSim({ ...IDLE, running: true, mode: 'replay', feed: [{ at: clock(), text: `Replaying intake of the ${deal.name} package (visual only)` }] });
  }
  function startLive() {
    tick.current = 0;
    setSim({ ...IDLE, running: true, mode: 'live', feed: [{ at: clock(), text: `Upload session opened · ${PACKAGE.files} files · ${PACKAGE.sizeGb} GB` }] });
  }
  const togglePause = () =>
    setSim((s) => ({
      ...s,
      paused: !s.paused,
      feed: [{ at: clock(), text: s.paused ? `Resumed from chunk ${Math.round((s.pct[0] / 100) * 560) + 1} - received chunks kept` : `Paused at chunk ${Math.round((s.pct[0] / 100) * 560)} of 560` }, ...s.feed].slice(0, 9),
    }));

  const counts = useMemo(() => {
    const byFolder: Record<string, number> = {};
    const byType: Record<string, number> = {};
    for (const d of docs) {
      byFolder[d.folder] = (byFolder[d.folder] ?? 0) + 1;
      byType[d.docType] = (byType[d.docType] ?? 0) + 1;
    }
    return { byFolder, byType };
  }, [docs]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = docs.filter((d) => (folder === 'all' || d.folder === folder) && (!typeFilter || d.docType === typeFilter) && (!q || d.name.toLowerCase().includes(q) || d.docType.toLowerCase().includes(q)));
    // Key documents first, then the rest of the package.
    return [...list].sort((a, b) => Number(!!b.key) - Number(!!a.key));
  }, [docs, folder, query, typeFilter]);

  const totalPct = Math.round(sim.pct.reduce((a, b) => a + b, 0) / 4);
  const runningNow = sim.running && sim.stage < 4;

  const intakePanel = (
    <Card
      data-tour="intake-panel"
      style={{ marginBottom: 16 }}
      title={
        <Space>
          <span>Package intake</span>
          {runningNow ? <Tag color="processing" icon={<LoadingOutlined />}>{sim.paused ? 'Paused' : sim.mode === 'replay' ? 'Replaying' : 'Processing'}</Tag> : sim.stage >= 4 ? <Tag color="success" icon={<CheckCircleFilled />}>Processed</Tag> : <Tag>Waiting for upload</Tag>}
        </Space>
      }
      extra={
        <Space>
          {runningNow && sim.stage === 0 ? <Button icon={sim.paused ? <PlayCircleOutlined /> : <PauseOutlined />} onClick={togglePause}>{sim.paused ? 'Resume' : 'Pause'}</Button> : null}
          {status === 'done' ? <Button icon={<ReloadOutlined />} onClick={replay} disabled={runningNow}>Replay intake</Button> : null}
        </Space>
      }
    >
      <Row gutter={[16, 12]} style={{ marginBottom: 14 }}>
        {[
          ['Files', PACKAGE.files.toLocaleString('en-US')],
          ['Package size', `${PACKAGE.sizeGb} GB`],
          ['Pages', PACKAGE.pages.toLocaleString('en-US')],
          ['Scanned pages (OCR)', PACKAGE.scannedPages.toLocaleString('en-US')],
        ].map(([k, v]) => (
          <Col xs={12} md={6} key={k}>
            <div className="metric-label">{k}</div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22 }}>{v}</div>
          </Col>
        ))}
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {STAGES.map((st, i) => {
              const p = Math.round(sim.pct[i]);
              const active = runningNow && sim.stage === i;
              return (
                <div key={st.key} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span className="metric-chip" style={{ width: 36, height: 36, fontSize: 16, background: p >= 100 ? '#F0F8F2' : active ? 'var(--plum-tint)' : 'var(--panel)', color: p >= 100 ? '#389E0D' : 'var(--plum)' }}>
                    {p >= 100 ? <CheckCircleFilled /> : active && !sim.paused ? <LoadingOutlined /> : st.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <strong style={{ fontSize: 13.5 }}>{st.label}</strong>
                      <span className="muted" style={{ fontSize: 12 }}>{st.sub}</span>
                    </div>
                    <Progress percent={p} size="small" strokeColor={active && sim.paused ? '#D48806' : '#521B3A'} showInfo={false} style={{ margin: 0 }} />
                  </div>
                  <span className="mono" style={{ width: 38, textAlign: 'right' }}>{p}%</span>
                </div>
              );
            })}
            {sim.paused ? (
              <div className="callout-gold" style={{ fontSize: 13 }}>
                Upload paused. {Math.round((sim.pct[0] / 100) * 560)} of 560 chunks are already stored; resuming continues from the next chunk instead of starting again.
              </div>
            ) : null}
          </Space>
        </Col>
        <Col xs={24} lg={10}>
          <div className="panel" style={{ height: '100%', minHeight: 190 }}>
            <div className="metric-label" style={{ marginBottom: 8 }}>Job feed · queue with retries</div>
            {sim.feed.length ? (
              sim.feed.map((f, i) => (
                <div key={`${f.at}-${i}`} className="fade-in" style={{ fontSize: 12, lineHeight: 1.5, color: i === 0 ? 'var(--ink)' : 'var(--secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span className="mono muted">{f.at}</span> {f.text}
                </div>
              ))
            ) : (
              <div className="muted" style={{ fontSize: 12.5 }}>
                {status === 'done'
                  ? deal.id === 'harlow'
                    ? 'Processed on 2026-10-14: upload resumed once, 412 files clean, 1,132 scanned pages OCR-processed, one OCR job retried and succeeded. Replay to watch it run.'
                    : 'Package processed. Replay to watch the pipeline run.'
                  : 'Jobs appear here as the package is processed.'}
              </div>
            )}
          </div>
        </Col>
      </Row>
      {runningNow ? <Progress percent={totalPct} strokeColor="#521B3A" style={{ marginTop: 12, marginBottom: 0 }} /> : null}
    </Card>
  );

  if (status !== 'done' && !runningNow) {
    return (
      <div className="fade-in">
        <PageHeader eyebrow="Document intake" title="Upload the deal package" desc="Large packages of PDFs, scans, Excel, Word and email. Uploads resume after a dropped connection; every file is malware-scanned on arrival." />
        <Card style={{ marginBottom: 16 }}>
          <Upload.Dragger
            multiple
            showUploadList={false}
            beforeUpload={() => { startLive(); return false; }}
            style={{ padding: '28px 0', background: 'var(--panel-soft)' }}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined style={{ color: 'var(--plum)' }} /></p>
            <p className="ant-upload-text" style={{ fontFamily: 'var(--font-head)', fontWeight: 600 }}>Drop the deal package here</p>
            <p className="ant-upload-hint">Folders, PDFs, scans, spreadsheets, Word documents and email. Nothing leaves this browser in the demo.</p>
          </Upload.Dragger>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <PermButton cap="upload" denied="Your role cannot upload documents" type="primary" size="large" icon={<CloudUploadOutlined />} onClick={startLive}>
              Use the sample package ({PACKAGE.files} files · {PACKAGE.sizeGb} GB)
            </PermButton>
          </div>
        </Card>
        {intakePanel}
      </div>
    );
  }

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Document intake"
        title="Documents"
        desc="A versioned document store: nothing is overwritten. A new version supersedes the old one and the findings that depended on it are re-run."
      />
      {intakePanel}

      {docs.length ? (
        <Card title="Classified into Phase 1 document types" style={{ marginBottom: 16 }} styles={{ body: { paddingTop: 14 } }}>
          <Space size={[6, 8]} wrap>
            {Object.entries(counts.byType)
              .sort((a, b) => b[1] - a[1])
              .map(([t, n]) => (
                <Tag key={t} color={typeFilter === t ? 'purple' : undefined} style={{ cursor: 'pointer', padding: '2px 10px' }} onClick={() => setTypeFilter(typeFilter === t ? undefined : t)}>
                  {t} <strong>{n}</strong>
                </Tag>
              ))}
          </Space>
        </Card>
      ) : null}

      <Row gutter={16}>
        <Col xs={24} lg={6}>
          <Card styles={{ body: { padding: 8 } }} style={{ marginBottom: 16 }}>
            <Menu
              mode="inline"
              selectedKeys={[folder]}
              onClick={({ key }) => setFolder(key)}
              style={{ borderInlineEnd: 0 }}
              items={[
                { key: 'all', icon: <FolderOpenOutlined />, label: <span>All documents <span className="muted">{docs.length}</span></span> },
                ...FOLDERS.map((f) => ({ key: f, icon: <FolderOpenOutlined />, label: <span>{f} <span className="muted">{counts.byFolder[f] ?? 0}</span></span> })),
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={18}>
          <Card
            styles={{ body: { padding: 0 } }}
            data-tour="doc-table"
            title={<span>{folder === 'all' ? 'All documents' : folder} <span className="muted" style={{ fontWeight: 500 }}>· {rows.length}</span></span>}
            extra={
              <Space>
                <Select allowClear placeholder="Document type" value={typeFilter} onChange={setTypeFilter} style={{ width: 210 }} options={Object.keys(counts.byType).sort().map((t) => ({ value: t }))} />
                <Input.Search allowClear placeholder="Search names" onChange={(e) => setQuery(e.target.value)} style={{ width: 200 }} />
              </Space>
            }
          >
            {docs.length ? (
              <Table<Doc>
                className="clickable-rows"
                rowKey="id"
                size="middle"
                dataSource={rows}
                pagination={{ pageSize: 12, showSizeChanger: false }}
                onRow={(d) => ({
                  onClick: () => show({ docId: d.id, page: d.content?.[0]?.n }),
                  style: superseded[d.id] ? { opacity: 0.62 } : undefined,
                })}
                columns={[
                  {
                    title: 'Document',
                    render: (_, d) => (
                      <Space align="start" size={10}>
                        <span style={{ fontSize: 18, lineHeight: 1 }}>{FORMAT_ICON[d.format] ?? <FileTextOutlined />}</span>
                        <span>
                          <span style={{ fontWeight: d.key ? 600 : 500 }}>{d.name}</span>
                          <br />
                          <Space size={4} wrap style={{ marginTop: 2 }}>
                            {d.executed ? <Tag color="green" style={{ marginInlineEnd: 0 }}>Executed</Tag> : null}
                            {d.key ? <Tag color="purple" style={{ marginInlineEnd: 0 }}>Cited</Tag> : null}
                            {d.supersedes ? <Tag style={{ marginInlineEnd: 0 }}>Supersedes {docLabel(d.supersedes)}</Tag> : null}
                            {superseded[d.id] ? <Tag color="red" style={{ marginInlineEnd: 0 }}>Superseded by {docLabel(superseded[d.id])}</Tag> : null}
                          </Space>
                        </span>
                      </Space>
                    ),
                  },
                  { title: 'Type', dataIndex: 'docType', width: 190, render: (v) => <span style={{ fontSize: 13 }}>{v}</span> },
                  {
                    title: 'Confidence', dataIndex: 'confidence', width: 110,
                    render: (v: number) => <Tooltip title="Classification confidence"><span className="mono" style={{ color: v < 0.9 ? '#D48806' : 'var(--ink)' }}>{Math.round(v * 100)}%</span></Tooltip>,
                  },
                  { title: 'Pages', dataIndex: 'pages', width: 72, align: 'right' },
                  { title: 'Scanned', dataIndex: 'scannedPct', width: 92, render: (v: number) => (v ? <Tag color="gold" style={{ marginInlineEnd: 0 }}>OCR {v}%</Tag> : <span className="muted">-</span>) },
                  { title: 'Ver.', dataIndex: 'version', width: 60, render: (v: number) => <span className="mono">v{v}</span> },
                  { title: 'Size', dataIndex: 'sizeMb', width: 84, align: 'right', render: (v: number) => <span className="mono">{v} MB</span> },
                ]}
              />
            ) : (
              <Empty style={{ padding: 40 }} description="No documents yet" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

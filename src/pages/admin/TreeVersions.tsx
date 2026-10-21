// Process tree as versioned configuration: version history, a simulated import with a validation report,
// the v3.6 -> v3.6.1 diff, Phase 1 change log and the version each deal is pinned to.
import { useEffect, useMemo, useRef, useState } from 'react';
import { App as AntdApp, Button, Card, Col, Modal, Progress, Row, Space, Table, Tag, Tooltip } from 'antd';
import { CheckCircleFilled, CloudUploadOutlined, FileExcelOutlined, PushpinOutlined, SwapRightOutlined, WarningFilled } from '@ant-design/icons';
import { useDemo } from '../../store/demoStore';
import { TREE_VERSIONS, TREE_DIFF_V361, PHASE1_CHANGES, HARD_RULE_NODES } from '../../data/registry';
import { TREE_PHASE1 } from '../../data/tree-phase1';
import { MetricCard, PageHeader, RuleTypeBadge, StepClassBadge } from '../../components/ui';
import { PermButton } from '../../components/perm';

const TABS = ['Node index (nodes)', 'Rule types and rule basis', 'Step classes', 'Gates', 'Typed links', 'Decision register', 'Gate definitions'];
const WARNINGS = [
  'EGC 2020 cited on design nodes; the governing-document register flags EGC 2026 as NEW EDITION.',
  'X0782: printed outline parent (X0778) differs from the change log (X0734). Change log treated as controlling.',
];

function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const logEvent = useDemo((s) => s.logEvent);
  const [tab, setTab] = useState(0);
  const [pct, setPct] = useState(0);
  const logged = useRef(false);
  const done = tab >= TABS.length;
  useEffect(() => {
    if (!open) {
      // Reset while closed, so a reopened modal starts from an empty run.
      logged.current = false;
      setTab(0);
      setPct(0);
      return;
    }
    let t = 0;
    const iv = setInterval(() => {
      t += 1;
      setPct(Math.min(100, Math.round((t / (TABS.length * 6)) * 100)));
      if (t % 6 === 0) setTab((v) => v + 1);
      if (t >= TABS.length * 6) clearInterval(iv);
    }, 110);
    return () => clearInterval(iv);
  }, [open]);
  useEffect(() => {
    if (!done || !open || logged.current) return;
    logged.current = true;
    logEvent({ action: 'Process tree import validated', object: 'Real_Estate_Development_Process_Tree_v3.6.1.xlsx · 3,403 nodes · 0 errors · 2 warnings', basis: 'Loaded as configuration - no rebuild, no redeployment' });
  }, [done, open, logEvent]);
  return (
    <Modal open={open} onCancel={onClose} width={720} title="Import a process-tree version" footer={<Button type="primary" disabled={!done} onClick={onClose}>Done</Button>}>
      <Space align="center" style={{ marginBottom: 12 }}>
        <FileExcelOutlined style={{ fontSize: 22, color: '#389E0D' }} />
        <span className="mono">Real_Estate_Development_Process_Tree_v3.6.1.xlsx</span>
        <Tag>2.4 MB</Tag>
      </Space>
      <Progress percent={pct} strokeColor="#521B3A" />
      <Space direction="vertical" size={4} style={{ width: '100%', margin: '10px 0 16px' }}>
        {TABS.map((t, i) => (
          <div key={t} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: i < tab ? 'var(--ink)' : 'var(--muted)' }}>
            {i < tab ? <CheckCircleFilled style={{ color: '#389E0D' }} /> : i === tab ? <span className="pulse" style={{ width: 14, height: 14, borderRadius: 9, background: 'var(--plum)', display: 'inline-block' }} /> : <span style={{ width: 14, height: 14, borderRadius: 9, border: '1px solid var(--border)', display: 'inline-block' }} />}
            Parsing tab: {t}
          </div>
        ))}
      </Space>
      {done ? (
        <div className="fade-in">
          <div className="panel" style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: 8 }}>Validation report</div>
            <Space size={6} wrap>
              <Tag>3,403 nodes</Tag><Tag>2,822 leaves</Tag><Tag>149 decisions</Tag><Tag>4 gates</Tag>
              <Tag color="success">0 errors</Tag><Tag color="warning">2 warnings</Tag>
            </Space>
            <Space direction="vertical" size={4} style={{ marginTop: 10 }}>
              {WARNINGS.map((w) => <div key={w} style={{ fontSize: 12.5 }}><WarningFilled style={{ color: '#D48806', marginRight: 6 }} />{w}</div>)}
            </Space>
          </div>
          <div className="callout-gold">Loaded as configuration - no rebuild, no redeployment. Deals stay pinned to their version until a practitioner re-pins them.</div>
        </div>
      ) : null}
    </Modal>
  );
}

export default function TreeVersions() {
  const deals = useDemo((s) => s.deals);
  const { message } = AntdApp.useApp();
  const [open, setOpen] = useState(false);

  const stats = useMemo(() => {
    const count = (k: 'ruleType' | 'stepClass') => TREE_PHASE1.reduce<Record<string, number>>((a, n) => ({ ...a, [n[k]]: (a[n[k]] ?? 0) + 1 }), {});
    return {
      ruleType: count('ruleType'),
      stepClass: count('stepClass'),
      decisions: TREE_PHASE1.filter((n) => n.isDecision).length,
      leaves: TREE_PHASE1.filter((n) => !TREE_PHASE1.some((c) => c.parent === n.id)).length,
    };
  }, []);
  const hard = TREE_PHASE1.filter((n) => HARD_RULE_NODES.includes(n.id));

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Admin console · Everstead staff"
        title="Process tree versions"
        desc="The tree is loaded as versioned configuration, not hard-coded, so a new tree release does not need a rebuild. Each deal is pinned to the version it was checked against."
        extra={<PermButton cap="admin" denied="Everstead staff only" type="primary" icon={<CloudUploadOutlined />} onClick={() => setOpen(true)}>Import new version</PermButton>}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}><MetricCard label="Version of record" value="v3.6.1" sub="October 8, 2026" tone="primary" /></Col>
        <Col xs={12} lg={6}><MetricCard label="Full tree" value="3,403" sub="nodes · 149 decisions · 4 gates" /></Col>
        <Col xs={12} lg={6}><MetricCard label="Phase 1 (Release 1)" value={TREE_PHASE1.length} sub={`nodes · ${stats.leaves} leaves · ${stats.decisions} decisions`} /></Col>
        <Col xs={12} lg={6}><MetricCard label="Gate" value="G1" sub="Acquisition closing (X0220)" /></Col>
      </Row>

      <Card title="Version history" styles={{ body: { padding: 0 } }} style={{ marginBottom: 16 }}>
        <Table
          rowKey="version"
          pagination={false}
          dataSource={TREE_VERSIONS}
          columns={[
            { title: 'Version', dataIndex: 'version', render: (v: string, r) => <Space><strong className="mono">{v}</strong>{r.status === 'Version of record' ? <Tag color="purple">Version of record</Tag> : <Tag>{r.status}</Tag>}</Space> },
            { title: 'Date', dataIndex: 'date', render: (v: string) => <span style={{ whiteSpace: 'nowrap' }}>{v}</span> },
            { title: 'Nodes', dataIndex: 'nodes', align: 'right', render: (v: number) => v.toLocaleString('en-US') },
            { title: 'Leaves', dataIndex: 'leaves', align: 'right', render: (v: number) => v.toLocaleString('en-US') },
            { title: 'Decisions', dataIndex: 'decisions', align: 'right' },
            { title: 'Gates', dataIndex: 'gates', align: 'right' },
            { title: 'Change', dataIndex: 'note', width: 460, render: (v: string) => <span style={{ fontSize: 12.5 }}>{v}</span> },
          ]}
        />
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} xl={14}>
          <Card title="Diff · v3.6 → v3.6.1" style={{ height: '100%' }}>
            {TREE_DIFF_V361.map((d) => (
              <div key={d.node}>
                <Space size={6} style={{ marginBottom: 10 }}>
                  <Tag className="mono">{d.node}</Tag><Tag>{d.phase}</Tag><Tag color="gold">{d.field} moved</Tag>
                </Space>
                <Row gutter={10} align="middle">
                  <Col span={11}><div className="panel" style={{ background: '#FFF1F0' }}><div className="metric-label">Was</div><div style={{ fontWeight: 600 }}>{d.was}</div></div></Col>
                  <Col span={2} style={{ textAlign: 'center' }}><SwapRightOutlined style={{ fontSize: 20, color: 'var(--muted)' }} /></Col>
                  <Col span={11}><div className="panel" style={{ background: '#F0F8F2' }}><div className="metric-label">Now</div><div style={{ fontWeight: 600 }}>{d.now}</div></div></Col>
                </Row>
                <p style={{ fontSize: 13, margin: '12px 0 4px' }}><strong>Why:</strong> {d.why}</p>
                <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>Source: {d.source}. No other changes; counts unchanged.</p>
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="Deals pinned to a version" style={{ height: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }} size={10}>
              {deals.map((d) => (
                <div key={d.id} className="panel" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <PushpinOutlined style={{ color: 'var(--plum)' }} />
                  <div style={{ flex: 1 }}>
                    <strong>{d.name}</strong>
                    <div className="muted" style={{ fontSize: 12 }}>Tree <span className="mono">{d.treeVersion}</span> · rule pack <span className="mono">{d.ruleVersion}</span></div>
                  </div>
                  {d.treeVersion !== 'v3.6.1' ? (
                    <Tooltip title="Re-pinning is a practitioner action on the deal, logged with its basis.">
                      <Button size="small" onClick={() => message.info(`${d.name}: re-pin to v3.6.1 offered to the Deal Lead with a node-level diff`)}>Re-pin to v3.6.1</Button>
                    </Tooltip>
                  ) : <Tag color="success">Current</Tag>}
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="Phase 1 change log" styles={{ body: { padding: 0 } }}>
            <Table
              rowKey={(r) => `${r.version}-${r.node}`}
              size="small"
              pagination={false}
              dataSource={PHASE1_CHANGES}
              columns={[
                { title: 'Version', dataIndex: 'version', width: 80, render: (v: string) => <span className="mono">{v}</span> },
                { title: 'Node', dataIndex: 'node', width: 80, render: (v: string) => <span className="mono">{v}</span> },
                { title: 'Was → now', render: (_, r) => <span style={{ fontSize: 12.5 }}><span className="muted">{r.was}</span><br />{r.now}</span> },
                { title: 'Why', dataIndex: 'why', render: (v: string) => <span style={{ fontSize: 12.5 }}>{v}</span> },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="Phase 1 by rule type and step class" style={{ marginBottom: 16 }}>
            <Space size={[8, 8]} wrap style={{ marginBottom: 12 }}>
              {Object.entries(stats.ruleType).map(([k, v]) => <span key={k} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><RuleTypeBadge value={k} /><strong>{v}</strong></span>)}
            </Space>
            <Space size={[8, 8]} wrap>
              {Object.entries(stats.stepClass).map(([k, v]) => <span key={k} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><StepClassBadge value={k} /><strong>{v}</strong></span>)}
            </Space>
          </Card>
          <Card title="Hard rules in Phase 1">
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {hard.map((n) => (
                <div key={n.id} style={{ fontSize: 13 }}><span className="mono muted">{n.id}</span> {n.name}</div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
      <ImportModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

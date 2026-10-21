// Cited extraction: the agreed field list per document type, each value with document, page and passage.
// Silent documents are flagged and never defaulted; cross-document conflicts show both values and their sources.
import { useMemo, useState, type HTMLAttributes } from 'react';
import { App as AntdApp, Card, Col, Empty, Form, Input, Menu, Modal, Progress, Row, Space, Table, Tag, Tooltip } from 'antd';
import { CheckOutlined, EditOutlined, MailOutlined, WarningFilled, SwapOutlined, StopOutlined, FileSearchOutlined, PercentageOutlined } from '@ant-design/icons';
import { useDemo } from '../../store/demoStore';
import { useDeal, useDealFields } from '../../store/hooks';
import { EXTRACTION_DOC_TYPES } from '../../data/analysis';
import { CitationChip } from '../../components/viewer';
import { FieldStatusTag, MetricCard, PageHeader } from '../../components/ui';
import { PermButton } from '../../components/perm';
import type { ExtractField } from '../../data/types';

const USER_ENTERED_NOTE = 'Entered by practitioner - labelled user-entered data, ranks below executed documents';

export default function Extraction() {
  const deal = useDeal();
  const fields = useDealFields(deal.id);
  const reviewField = useDemo((s) => s.reviewField);
  const { message } = AntdApp.useApp();
  const [type, setType] = useState<string>('all');
  const [editing, setEditing] = useState<ExtractField | null>(null);
  const [form] = Form.useForm();

  // The agreed 10 types always show; any other type present (e.g. an extraction slot) is listed after them.
  const types = useMemo(() => {
    const extra = [...new Set(fields.map((f) => f.docType))].filter((t) => !EXTRACTION_DOC_TYPES.includes(t));
    return { agreed: EXTRACTION_DOC_TYPES, extra };
  }, [fields]);
  const countBy = useMemo(() => {
    const c: Record<string, { n: number; flagged: number }> = {};
    for (const f of fields) {
      c[f.docType] ??= { n: 0, flagged: 0 };
      c[f.docType].n += 1;
      if (f.status === 'silent' || f.status === 'conflict') c[f.docType].flagged += 1;
    }
    return c;
  }, [fields]);

  const rows = useMemo(() => {
    const order = { silent: 0, conflict: 1, review: 2, corrected: 3, accepted: 4 };
    const list = type === 'all' ? fields : fields.filter((f) => f.docType === type);
    return [...list].sort((a, b) => order[a.status] - order[b.status]);
  }, [fields, type]);

  const kpi = useMemo(() => {
    const valued = fields.filter((f) => f.status !== 'silent');
    const cited = valued.filter((f) => f.citation && (f.citation.passageId || f.citation.cell)).length;
    return {
      total: fields.length,
      citedPct: valued.length ? Math.round((cited / valued.length) * 100) : 0,
      silent: fields.filter((f) => f.status === 'silent').length,
      conflicts: fields.filter((f) => f.status === 'conflict').length,
    };
  }, [fields]);

  const openManual = (f: ExtractField) => {
    setEditing(f);
    form.setFieldsValue({ value: '' });
  };
  const saveManual = () => {
    const v = form.getFieldValue('value');
    if (!editing || !v) return;
    reviewField(editing.id, 'corrected', v, USER_ENTERED_NOTE);
    message.success('Saved as user-entered data');
    setEditing(null);
  };

  if (!fields.length) {
    return (
      <div className="fade-in">
        <PageHeader eyebrow="Cited extraction" title="Extracted fields" desc="The agreed field list per Phase 1 document type, each value cited to document, page and passage." />
        <Card><Empty description={deal.depth === 'intake' ? 'Upload and classify the deal package to start extraction.' : 'No fields extracted yet for this deal. Run walkthrough scenario 4 to process the executed HAP contract.'} /></Card>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Cited extraction"
        title="Extracted fields"
        desc="Every value carries its document, page and passage. Where an executed document is silent the platform flags the gap and never fills it with a typical value."
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}><MetricCard label="Fields extracted" value={kpi.total} sub={`${types.agreed.length} agreed document types`} icon={<FileSearchOutlined />} tone="primary" /></Col>
        <Col xs={12} lg={6}><MetricCard label="Cited" value={`${kpi.citedPct}%`} sub="document · page · passage" icon={<PercentageOutlined />} tone="success" /></Col>
        <Col xs={12} lg={6}><MetricCard label="Silent - flagged" value={kpi.silent} sub="never defaulted" icon={<StopOutlined />} tone={kpi.silent ? 'danger' : 'neutral'} /></Col>
        <Col xs={12} lg={6}><MetricCard label="Conflicts" value={kpi.conflicts} sub="both values shown" icon={<SwapOutlined />} tone={kpi.conflicts ? 'danger' : 'neutral'} /></Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={6} xxl={5}>
          <Card styles={{ body: { padding: 8 } }} style={{ marginBottom: 16 }} title={<span style={{ fontSize: 13 }}>Agreed field list</span>}>
            <Menu
              mode="inline"
              selectedKeys={[type]}
              onClick={({ key }) => setType(key)}
              style={{ borderInlineEnd: 0 }}
              items={[
                { key: 'all', label: <span>All types <span className="muted">{fields.length}</span></span> },
                ...types.agreed.map((t) => ({
                  key: t,
                  disabled: !countBy[t],
                  label: (
                    <span style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</span>
                      <span>{countBy[t]?.flagged ? <WarningFilled style={{ color: '#D48806', marginRight: 4 }} /> : null}<span className="muted">{countBy[t]?.n ?? 0}</span></span>
                    </span>
                  ),
                })),
                ...(types.extra.length
                  ? [{
                    type: 'group' as const,
                    label: 'Extraction slots / other',
                    children: types.extra.map((t) => ({ key: t, label: <span style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t}</span><span className="muted">{countBy[t]?.n ?? 0}</span></span> })),
                  }]
                  : []),
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={18} xxl={19}>
          <Card styles={{ body: { padding: 0 } }} title={type === 'all' ? 'All fields' : type}>
            <Table<ExtractField>
              rowKey="id"
              size="middle"
              dataSource={rows}
              pagination={false}
              scroll={{ x: 860 }}
              rowClassName={(r) => (r.status === 'silent' ? 'stripe-blocked' : '')}
              onRow={(r) => ({ 'data-tour': r.id === 'x-gty-2' ? 'field-silent' : r.id === 'x-apr-2' ? 'field-conflict' : undefined } as HTMLAttributes<HTMLElement>)}
              expandable={{
                rowExpandable: (r) => r.status === 'silent' || r.status === 'conflict' || !!r.note,
                defaultExpandedRowKeys: ['x-gty-2', 'x-apr-2', 'x-hap-3'],
                expandedRowRender: (r) => <ExpandedField f={r} onManual={openManual} />,
              }}
              columns={[
                {
                  title: 'Field', width: 190,
                  render: (_, f) => (
                    <span>
                      <strong>{f.field}</strong>
                      <br />
                      <span className="muted" style={{ fontSize: 12 }}>{type === 'all' ? `${f.docType} · ` : ''}</span>
                      {f.nodeId ? <Tooltip title="Process-tree node this value feeds"><span className="mono muted">{f.nodeId}</span></Tooltip> : null}
                    </span>
                  ),
                },
                {
                  title: 'Value',
                  render: (_, f) =>
                    f.status === 'silent' ? (
                      <span style={{ color: '#CF1322', fontWeight: 600 }}><StopOutlined /> {f.value}</span>
                    ) : (
                      <span style={{ fontWeight: 600 }}>{f.value}</span>
                    ),
                },
                {
                  title: 'Confidence', width: 100,
                  render: (_, f) => (f.status === 'silent' ? <span className="muted">-</span> : <Progress percent={Math.round(f.confidence * 100)} size="small" strokeColor={f.confidence < 0.93 ? '#D48806' : '#521B3A'} style={{ margin: 0 }} />),
                },
                { title: 'Source', width: 210, render: (_, f) => (f.citation ? <CitationChip c={f.citation} /> : <span className="muted">-</span>) },
                { title: 'Status', width: 128, render: (_, f) => <FieldStatusTag value={f.status} /> },
                {
                  title: '', width: 104, align: 'right',
                  render: (_, f) =>
                    f.status === 'review' ? (
                      <Space size={4}>
                        <PermButton cap="reviewExtraction" denied="Your role cannot review extracted fields" size="small" type="primary" icon={<CheckOutlined />} onClick={() => { reviewField(f.id, 'accepted'); message.success('Field accepted'); }}>
                          Accept
                        </PermButton>
                      </Space>
                    ) : f.status === 'accepted' || f.status === 'corrected' ? (
                      <PermButton cap="reviewExtraction" denied="Your role cannot correct extracted fields" size="small" type="text" icon={<EditOutlined />} onClick={() => openManual(f)}>
                        Correct
                      </PermButton>
                    ) : null,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Modal open={!!editing} onCancel={() => setEditing(null)} onOk={saveManual} okText="Save value" title={editing ? `${editing.field} · ${editing.docType}` : ''}>
        <p className="muted" style={{ fontSize: 13 }}>
          A value you enter is stored as user-entered data with your name and time. It ranks below executed documents, and a finding that rests only on it goes to human review.
        </p>
        <Form form={form} layout="vertical">
          <Form.Item label="Value" name="value" rules={[{ required: true }]}><Input autoFocus /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function ExpandedField({ f, onManual }: { f: ExtractField; onManual: (f: ExtractField) => void }) {
  const reviewField = useDemo((s) => s.reviewField);
  const logEvent = useDemo((s) => s.logEvent);
  const { message } = AntdApp.useApp();

  if (f.status === 'silent') {
    return (
      <div style={{ padding: '4px 8px 6px' }}>
        <div className="callout-gold" style={{ marginBottom: 10 }}>{f.note}</div>
        <Space>
          <PermButton
            cap="reviewExtraction"
            denied="Your role cannot request documents"
            icon={<MailOutlined />}
            onClick={() => {
              logEvent({ action: 'Document requested', object: `${f.docType} · ${f.field}`, basis: 'Silent extraction slot - request sent to counsel', dealId: f.dealId });
              message.success('Request logged and sent to counsel');
            }}
          >
            Request from counsel
          </PermButton>
          <PermButton cap="reviewExtraction" denied="Your role cannot enter values" icon={<EditOutlined />} onClick={() => onManual(f)}>
            Enter value manually
          </PermButton>
        </Space>
      </div>
    );
  }

  if (f.status === 'conflict' && f.conflict) {
    const sides = [
      { value: f.value, citation: f.citation!, source: 'This document' },
      { value: f.conflict.value, citation: f.conflict.citation, source: f.conflict.source },
    ];
    return (
      <div style={{ padding: '4px 8px 6px' }}>
        <Row gutter={12} style={{ marginBottom: 10 }}>
          {sides.map((s, i) => (
            <Col span={12} key={i}>
              <div className="panel" style={{ background: '#fff', border: '1px solid var(--border)' }}>
                <div className="metric-label">{i === 0 ? 'Value A' : 'Value B'} · {s.source}</div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, margin: '4px 0 8px' }}>{s.value}</div>
                <Space wrap>
                  <CitationChip c={s.citation} />
                  <PermButton
                    cap="reviewExtraction"
                    denied="Your role cannot resolve conflicts"
                    size="small"
                    onClick={() => {
                      const other = sides[1 - i];
                      reviewField(f.id, 'corrected', s.value, `Practitioner chose ${s.value} - ${other.value} (${other.source}) kept on record`);
                      message.success('Choice recorded with your name and basis');
                    }}
                  >
                    Use this value
                  </PermButton>
                </Space>
              </div>
            </Col>
          ))}
        </Row>
        <div style={{ fontSize: 13, color: 'var(--body)' }}><Tag color="warning">Precedence</Tag>{f.conflict.precedence}</div>
      </div>
    );
  }

  return <div style={{ padding: '4px 8px', fontSize: 13, color: 'var(--body)' }}>{f.note}</div>;
}

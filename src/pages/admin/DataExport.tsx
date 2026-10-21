// Data export (requirement 09): a full deal bundle in a documented JSON format, downloaded for real from the
// demo state - deal record, document manifest, fields, findings, decisions, gate, report, audit and pins.
import { useMemo, useState } from 'react';
import { App as AntdApp, Card, Checkbox, Col, Row, Select, Space, Tag, Typography } from 'antd';
import { DownloadOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useDemo } from '../../store/demoStore';
import { useDealDocs } from '../../store/hooks';
import { PageHeader } from '../../components/ui';
import { PermButton } from '../../components/perm';

const SCOPES = [
  { key: 'deal', label: 'Deal record' },
  { key: 'documents', label: 'Documents manifest' },
  { key: 'fields', label: 'Extracted fields with citations' },
  { key: 'findings', label: 'Findings' },
  { key: 'decisions', label: 'Decisions' },
  { key: 'gate', label: 'Gate G1 verification and authorization' },
  { key: 'audit', label: 'Audit history (hash chain)' },
  { key: 'pins', label: 'Configuration pins (tree and rule-pack versions)' },
] as const;

const SCHEMA = `{
  "format": "everstead.deal-export",
  "schemaVersion": "1.0",
  "exportedAt": "ISO-8601 timestamp",
  "exportedBy": { "actor": "string", "role": "string", "tenant": "string" },
  "deal": { "id", "name", "location", "units", "projectType", "program", "agency", "overlays[]" },
  "pins": { "processTree": "v3.6.1", "rulePack": "NY HCR 9% 2026.1" },
  "documents": [ { "id", "name", "folder", "docType", "format", "pages", "scannedPct", "version", "supersedes?" } ],
  "fields": [ { "id", "docType", "field", "value", "confidence", "status", "citation": { "docId", "page", "passageId", "cell" } } ],
  "findings": [ { "id", "title", "severity", "ruleIds[]", "citation", "basis[]", "sources[]", "status" } ],
  "decisions": { "D1-01": { "status", "option", "basis", "actor", "role", "at" } },
  "gate": { "conditions": { "G1-1": { "verified", "by", "at" } }, "authorized?": { "by", "at" } },
  "report": { "status", "version", "signedBy?", "signedAt?", "hash?" },
  "audit": [ { "seq", "at", "actor", "role", "action", "object", "basis", "prevHash", "hash" } ]
}`;

export default function DataExport() {
  const { message } = AntdApp.useApp();
  const deals = useDemo((s) => s.deals);
  const fields = useDemo((s) => s.fields);
  const findings = useDemo((s) => s.findings);
  const decisions = useDemo((s) => s.decisions);
  const gate = useDemo((s) => s.gate);
  const report = useDemo((s) => s.report);
  const audit = useDemo((s) => s.audit);
  const logEvent = useDemo((s) => s.logEvent);
  const [dealId, setDealId] = useState('harlow');
  const [scope, setScope] = useState<string[]>(SCOPES.map((s) => s.key));
  const docs = useDealDocs(dealId);
  const deal = deals.find((d) => d.id === dealId) ?? deals[0];

  const counts = useMemo(() => ({
    documents: docs.length,
    fields: fields.filter((f) => f.dealId === dealId).length,
    findings: findings.filter((f) => f.dealId === dealId).length,
    decisions: Object.values(decisions[dealId] ?? {}).filter((d) => d.status === 'decided').length,
    audit: audit.filter((e) => e.dealId === dealId).length,
  }), [docs, fields, findings, decisions, audit, dealId]);

  const exportBundle = () => {
    const has = (k: string) => scope.includes(k);
    const bundle: Record<string, unknown> = {
      format: 'everstead.deal-export',
      schemaVersion: '1.0',
      exportedAt: new Date().toISOString(),
      exportedBy: { actor: 'Jordan Ellis', role: 'Everstead staff', tenant: 'Everstead Advisory' },
    };
    if (has('deal')) bundle.deal = deal;
    if (has('pins')) bundle.pins = { processTree: deal.treeVersion, rulePack: `NY HCR 9% ${deal.ruleVersion}` };
    if (has('documents')) {
      bundle.documents = docs.map((d) => ({
        id: d.id, name: d.name, folder: d.folder, docType: d.docType, format: d.format, pages: d.pages,
        scannedPct: d.scannedPct, sizeMb: d.sizeMb, version: d.version, supersedes: d.supersedes, executed: d.executed,
      }));
    }
    if (has('fields')) bundle.fields = fields.filter((f) => f.dealId === dealId);
    if (has('findings')) bundle.findings = findings.filter((f) => f.dealId === dealId);
    if (has('decisions')) bundle.decisions = decisions[dealId] ?? {};
    if (has('gate')) bundle.gate = gate[dealId] ?? {};
    bundle.report = report[dealId] ?? {};
    if (has('audit')) bundle.audit = audit.filter((e) => e.dealId === dealId);
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `everstead-export-${dealId}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    logEvent({ action: 'Data exported', object: `${deal.name} · ${scope.length} sections · everstead.deal-export 1.0`, basis: 'Requirement 09 - export at any time in a documented format', dealId });
    message.success(`Exported ${deal.name} bundle`);
  };

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Admin console · Everstead staff"
        title="Data export"
        desc="Everstead owns it: export at any time in a documented format; at least 60 days of transition help."
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={11}>
          <Card title="Export a deal bundle" style={{ marginBottom: 16 }}>
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <div>
                <div className="metric-label" style={{ marginBottom: 6 }}>Deal</div>
                <Select value={dealId} onChange={setDealId} style={{ width: '100%' }} options={deals.map((d) => ({ value: d.id, label: `${d.name} · ${d.units} units` }))} />
              </div>
              <div>
                <div className="metric-label" style={{ marginBottom: 6 }}>Include</div>
                <Checkbox.Group value={scope} onChange={(v) => setScope(v as string[])} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {SCOPES.map((s) => <Checkbox key={s.key} value={s.key}>{s.label}</Checkbox>)}
                </Checkbox.Group>
              </div>
              <Space size={6} wrap>
                <Tag>{counts.documents} documents</Tag>
                <Tag>{counts.fields} fields</Tag>
                <Tag>{counts.findings} findings</Tag>
                <Tag>{counts.decisions} decisions recorded</Tag>
                <Tag>{counts.audit} audit events</Tag>
              </Space>
              <PermButton cap="exportData" denied="Your role cannot export deal data" type="primary" icon={<DownloadOutlined />} disabled={!scope.length} onClick={exportBundle}>
                Export bundle (JSON)
              </PermButton>
            </Space>
          </Card>
          <div className="callout-gold">
            <SafetyCertificateOutlined style={{ marginRight: 6 }} />
            All code, prompts, configurations, rule packs, deal data and the knowledge layer belong to Everstead. Document files export alongside the manifest; the audit chain exports with its hashes so integrity can be re-verified outside the platform.
          </div>
        </Col>
        <Col xs={24} xl={13}>
          <Card title="Documented format · everstead.deal-export 1.0">
            <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
              One JSON document per deal. Every citation keeps its document, page and passage (or workbook cell), so findings stay traceable after export.
            </Typography.Paragraph>
            <pre className="mono" style={{ background: 'var(--panel-soft)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, fontSize: 12, overflow: 'auto', margin: 0, maxHeight: 520 }}>
              {SCHEMA}
            </pre>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

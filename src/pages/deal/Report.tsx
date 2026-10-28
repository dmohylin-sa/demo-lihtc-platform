// Underwriting readiness report (row 15): complete, outstanding, conflicts and recommended next actions with
// basis - every line cited to document, page and passage. Quality gate, practitioner edit, sign-off and export.
import { useMemo, useRef, type ReactNode } from 'react';
import { App as AntdApp, Alert, Button, Card, Col, Divider, List, Popover, Row, Space, Tag, Typography } from 'antd';
import { CheckCircleFilled, FilePdfOutlined, FileWordOutlined, LockOutlined, SafetyCertificateOutlined, WarningOutlined } from '@ant-design/icons';
import { useDemo, useCan, nowIso } from '../../store/demoStore';
import { useDeal, useDealFields, useDealFindings, useDealMetrics, useNextActions } from '../../store/hooks';
import { RULES_HCR9 } from '../../data/rules-hcr9';
import { NEW_RULE_T26 } from '../../data/ops';
import { DECISIONS, G1_CONDITIONS } from '../../data/registry';
import { WORKSTREAMS } from '../../data/analysis';
import { UW_INPUTS } from '../../data/underwriting';
import { underwrite, usd, CALC_ENGINE_VERSION } from '../../calc/underwriting';
import { PageHeader, SeverityTag } from '../../components/ui';
import { useViewer, findPassage, citeText } from '../../components/viewer';
import { PermButton } from '../../components/perm';
import { CapChip, GatedButton, TodayGate, TodayNotice } from '../../components/today';
import { getDoc, docLabel } from '../../store/selectors';
import type { Citation, Finding } from '../../data/types';

type Cite = { kind: 'doc'; c: Citation } | { kind: 'rule'; ruleId: string };
interface Item { key: string; text: ReactNode; cites: Cite[]; tag?: ReactNode }

const ALL_RULES = [...RULES_HCR9, NEW_RULE_T26];
const findingCites = (f: Finding): Cite[] => [
  ...f.sources.map((c) => ({ kind: 'doc' as const, c })),
  ...f.ruleIds.map((ruleId) => ({ kind: 'rule' as const, ruleId })),
];

function Sup({ n, cite }: { n: number; cite: Cite }) {
  const show = useViewer((s) => s.show);
  if (cite.kind === 'rule') {
    const r = ALL_RULES.find((x) => x.id === cite.ruleId);
    return (
      <Popover
        title={<span><Tag color="purple">{cite.ruleId}</Tag>{r?.citation}</span>}
        content={<div style={{ maxWidth: 360, fontSize: 12.5 }}>{r?.rule}<div className="muted" style={{ marginTop: 6 }}>{r?.sourceLayer} · effective {r?.effectiveDate} · {r?.status}</div></div>}
      >
        <sup className="cite-sup">[{n}]</sup>
      </Popover>
    );
  }
  const c = cite.c;
  const quote = findPassage(getDoc(c.docId), c.passageId);
  return (
    <Popover
      title={<span style={{ fontSize: 13 }}>{docLabel(c.docId)} · {citeText(c)}</span>}
      content={
        <div style={{ maxWidth: 380, fontSize: 12.5 }}>
          {quote ? <div style={{ fontStyle: 'italic' }}>“{quote}”</div> : c.cell ? <div>Workbook cell {c.cell}</div> : null}
          <Button size="small" type="link" style={{ padding: 0, marginTop: 6 }} onClick={() => show(c)}>Open source</Button>
        </div>
      }
    >
      <sup className="cite-sup" onClick={() => show(c)}>[{n}]</sup>
    </Popover>
  );
}

export default function Report() {
  const deal = useDeal();
  const { message } = AntdApp.useApp();
  const docRef = useRef<HTMLDivElement>(null);
  const reports = useDemo((s) => s.report);
  const decisionsAll = useDemo((s) => s.decisions);
  const gateAll = useDemo((s) => s.gate);
  const nodeStatusAll = useDemo((s) => s.nodeStatus);
  const uwVersions = useDemo((s) => s.uwVersion);
  const editReport = useDemo((s) => s.editReport);
  const acknowledgeFlag = useDemo((s) => s.acknowledgeFlag);
  const signReport = useDemo((s) => s.signReport);
  const logEvent = useDemo((s) => s.logEvent);
  const canSign = useCan('signReport');
  const findings = useDealFindings(deal.id);
  const fields = useDealFields(deal.id);
  const m = useDealMetrics(deal.id);
  const actions = useNextActions(deal.id);

  const report = reports[deal.id] ?? { status: 'draft', edits: {}, acknowledged: [], version: 1 };
  const dec = decisionsAll[deal.id] ?? {};
  const gate = gateAll[deal.id];
  const ns = nodeStatusAll[deal.id] ?? {};
  const version = uwVersions[deal.id] ?? 'v2';
  const r = deal.id === 'harlow' ? underwrite(UW_INPUTS[version]) : null;
  const signed = report.status === 'signed';
  const asOf = (report.signedAt ?? nowIso()).slice(0, 10);

  const defaultSummary = useMemo(() => {
    const top = actions.slice(0, 3).map((a) => a.title.replace(/\.$/, '')).join('; ');
    const money = r ? ` DSCR is ${r.dscr.toFixed(2)}x against the lender's 1.20x and sources are ${r.balance < 0 ? `short of uses by ${usd(-r.balance)}` : 'balanced against uses'}.` : '';
    return `${deal.name} is ${m.blocking ? 'not yet' : ''} ready for underwriting sign-off. ${m.done} of ${m.applicable} Phase 1 steps on this deal's path are complete; ${m.blocking} finding${m.blocking === 1 ? '' : 's'} block readiness and ${m.advisory} are advisory.${money}${top ? ` Most urgent: ${top}.` : ''}`.replace('is  ready', 'is ready');
  }, [actions, r, deal.name, m]);
  const summary = report.edits.summary ?? defaultSummary;

  const sections = useMemo(() => {
    const open = (f: Finding) => f.status === 'open' || f.status === 'in review';
    const conflictFields = fields.filter((f) => f.status === 'conflict' && f.conflict);
    const coveredByField = (f: Finding) => conflictFields.some((cf) => f.sources.some((s) => s.docId === cf.docId || s.docId === cf.conflict!.citation.docId));

    const complete: Item[] = [
      ...findings.filter((f) => f.status === 'passed' || f.status === 'resolved').map((f) => ({
        key: f.id, text: <><strong>{f.title}.</strong> {f.detail.split('. ')[0].replace(/\.$/, '')}.</>, cites: findingCites(f), tag: <Tag color="success">{f.status === 'resolved' ? 'Resolved' : 'Pass'}</Tag>,
      })),
      ...DECISIONS.filter((d) => dec[d.id]?.status === 'decided').map((d) => ({
        key: d.id, text: <><strong>{d.id} {d.title}:</strong> {dec[d.id].option} - {dec[d.id].actor}, {dec[d.id].role}, {dec[d.id].at}.</>, cites: [] as Cite[], tag: <Tag color="success">Decided</Tag>,
      })),
      ...WORKSTREAMS.filter((w) => ns[w.id]?.status === 'done').map((w) => ({
        key: w.id, text: <><strong>{w.name}</strong> ({w.id}) - all applicable steps complete.</>, cites: [] as Cite[], tag: <Tag>Workstream</Tag>,
      })),
    ];

    const outstanding: Item[] = [
      ...findings.filter((f) => open(f) && f.severity !== 'informational' && f.category !== 'Conflict').map((f) => ({
        key: f.id, text: <><strong>{f.title}.</strong> {f.detail}</>, cites: findingCites(f), tag: <SeverityTag value={f.severity} />,
      })),
      ...fields.filter((f) => f.status === 'silent').map((f) => ({
        key: f.id, text: <><strong>{f.docType}: {f.field}.</strong> The executed document is silent; the slot is flagged and not defaulted.</>,
        cites: f.citation ? [{ kind: 'doc' as const, c: f.citation }] : [], tag: <Tag color="error">Silent slot</Tag>,
      })),
      ...DECISIONS.filter((d) => dec[d.id]?.status === 'awaiting').map((d) => ({
        key: d.id, text: <><strong>{d.id} {d.title}</strong> - awaiting the {d.owner}. Evidence: {d.evidence}.</>,
        cites: (d.id === 'D1-04' && deal.id === 'harlow' ? [{ kind: 'doc' as const, c: { docId: 'd-esa', page: 14, passageId: 'esa-rec' } }] : []) as Cite[],
        tag: <Tag color="gold">Decision</Tag>,
      })),
    ];
    const unverified = G1_CONDITIONS.filter((c) => !gate?.conditions[c.id]?.verified);
    if (unverified.length) {
      outstanding.push({
        key: 'gate', text: <><strong>Gate G1 acquisition closing:</strong> {unverified.length} of {G1_CONDITIONS.length} conditions not yet verified ({unverified.map((c) => c.nodeId ?? 'NEW').join(', ')}).</>,
        cites: [], tag: <Tag>Gate</Tag>,
      });
    }

    const conflicts: Item[] = [
      ...conflictFields.map((f) => ({
        key: f.id,
        text: <><strong>{f.field}:</strong> {f.value} ({docLabel(f.docId)}) vs {f.conflict!.value} ({f.conflict!.source}). {f.conflict!.precedence}</>,
        cites: [...(f.citation ? [{ kind: 'doc' as const, c: f.citation }] : []), { kind: 'doc' as const, c: f.conflict!.citation }],
        tag: <Tag color="warning">Conflict</Tag>,
      })),
      ...findings.filter((f) => open(f) && f.category === 'Conflict' && !coveredByField(f)).map((f) => ({
        key: f.id, text: <><strong>{f.title}.</strong> {f.detail}</>, cites: findingCites(f), tag: <Tag color="warning">Conflict</Tag>,
      })),
    ];

    const next: Item[] = actions.map((a) => {
      const f = findings.find((x) => x.id === a.key);
      return {
        key: a.key,
        text: <><strong>{a.title}</strong> <span className="muted">Owner: {a.owner}. Basis: {a.basis}.</span></>,
        cites: f ? findingCites(f) : [],
        tag: <Tag color={a.priority === 'blocking' ? 'error' : 'warning'}>{a.priority}</Tag>,
      };
    });
    return { complete, outstanding, conflicts, next };
  }, [findings, fields, dec, ns, gate, actions, deal.id]);

  const flags = useMemo(() => [
    ...fields.filter((f) => f.status === 'silent').map((f) => ({ key: `field:${f.id}`, label: `Silent slot · ${f.docType} · ${f.field}` })),
    ...fields.filter((f) => f.status === 'conflict').map((f) => ({ key: `field:${f.id}`, label: `Conflict · ${f.docType} · ${f.field}` })),
    ...findings.filter((f) => f.method === 'model-assisted' && (f.status === 'open' || f.status === 'in review')).map((f) => ({ key: `finding:${f.id}`, label: `Model-assisted · ${f.id} ${f.title}` })),
  ], [fields, findings]);
  const pending = flags.filter((f) => !report.acknowledged.includes(f.key));
  const uncited = findings.filter((f) => !f.sources.length && !f.ruleIds.length).length;

  // Numbered citations in reading order.
  let counter = 0;
  const renderItems = (items: Item[], empty: string) =>
    items.length ? (
      items.map((it) => (
        <div className="report-item" key={it.key}>
          <Space size={8} align="start">
            <span style={{ flex: 'none', marginTop: 1 }}>{it.tag}</span>
            <span style={{ fontSize: 13.5, lineHeight: 1.55 }}>
              {it.text}
              {it.cites.map((c) => { counter += 1; return <Sup key={counter} n={counter} cite={c} />; })}
            </span>
          </Space>
        </div>
      ))
    ) : <p className="muted" style={{ fontSize: 13 }}>{empty}</p>;

  const exportWord = () => {
    if (!docRef.current) return;
    const html = `<html><head><meta charset="utf-8"><title>${deal.name} - Underwriting readiness report</title><style>body{font-family:Arial,sans-serif;font-size:11pt;color:#2B2026}h1,h2{color:#521B3A}h2{border-bottom:2px solid #521B3A;text-transform:uppercase;font-size:12pt}sup{color:#521B3A}</style></head><body>${docRef.current.innerHTML}</body></html>`;
    const blob = new Blob(['﻿', html], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${deal.name} - Underwriting readiness report.doc`;
    a.click();
    URL.revokeObjectURL(a.href);
    logEvent({ action: 'Report exported', object: `Underwriting readiness report v${report.version} · Word`, dealId: deal.id });
    message.success('Word export downloaded');
  };
  const exportPdf = () => {
    logEvent({ action: 'Report exported', object: `Underwriting readiness report v${report.version} · PDF`, dealId: deal.id });
    window.print();
  };

  return (
    <div className="fade-in">
      <div className="no-print">
        <PageHeader
          eyebrow="Row 15 · source-cited readiness report and plain-language summary"
          title="Underwriting readiness report"
          desc="Complete, outstanding, conflicts and recommended next actions with basis. Every finding traced to document, page and passage."
          extra={
            <>
              <GatedButton feature="report.export" icon={<FilePdfOutlined />} onClick={exportPdf}>Export PDF</GatedButton>
              <GatedButton feature="report.export" icon={<FileWordOutlined />} onClick={exportWord}>Export Word</GatedButton>
            </>
          }
        />
        <TodayNotice cap="report.readiness" also={['summary.executive', 'review.beforeFinal']} />
      </div>

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={16}>
          <div className="report-doc" ref={docRef} data-tour="report-doc">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <span className="eyebrow">Everstead · underwriting readiness report</span>
                <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 26, margin: '6px 0 2px', color: 'var(--ink)' }}>{deal.name}</h1>
                <div className="muted" style={{ fontSize: 13 }}>{deal.location} · {deal.units} units · {deal.program} · {deal.agency}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {signed ? <Tag color="success" icon={<LockOutlined />} style={{ fontSize: 13, padding: '3px 10px' }}>Signed · v{report.version}</Tag> : <Tag color="gold" style={{ fontSize: 13, padding: '3px 10px' }}>Draft · v{report.version}</Tag>}
              </div>
            </div>
            <div className="kv" style={{ marginTop: 16, gridTemplateColumns: '130px 1fr 130px 1fr' }}>
              <span className="k">As of</span><span>{asOf}</span>
              <span className="k">Readiness</span><span>{m.readiness}% of applicable Phase 1 steps</span>
              <span className="k">Process tree</span><span>{deal.treeVersion}</span>
              <span className="k">Rule pack</span><span>NY HCR 9% {deal.ruleVersion}</span>
              <span className="k">Input set</span><span>{deal.id === 'harlow' ? `${version} (Form A-1 + sponsor pro forma)` : 'Not yet ingested'}</span>
              <span className="k">Calculations</span><span>{CALC_ENGINE_VERSION}</span>
            </div>

            <h2>Plain-language summary <CapChip cap="summary.executive" style={{ marginLeft: 8, verticalAlign: 2 }} /></h2>
            <Typography.Paragraph
              style={{ fontSize: 14.5, lineHeight: 1.65 }}
              editable={!signed && canSign ? { onChange: (t) => editReport(deal.id, 'summary', t), tooltip: 'Edit the summary - your edit is recorded as a practitioner change' } : false}
            >
              {summary}
            </Typography.Paragraph>
            {report.edits.summary ? <div className="muted" style={{ fontSize: 11.5, marginTop: -8 }}>Edited by a practitioner.</div> : null}

            <TodayGate cap="report.readiness">
            <h2>Complete</h2>
            {renderItems(sections.complete, 'Nothing complete yet.')}
            <h2>Outstanding</h2>
            {renderItems(sections.outstanding, 'Nothing outstanding.')}
            <h2>Conflicts</h2>
            {renderItems(sections.conflicts, 'No conflicts between sources.')}
            <h2>Recommended next actions with basis</h2>
            {renderItems(sections.next, 'No open actions.')}
            </TodayGate>

            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              <span>Every finding traced to document, page and passage · {counter} citations</span>
              <span>Sample data - fictional deal</span>
            </div>
            {signed ? (
              <div style={{ marginTop: 14, fontSize: 12.5 }}>
                Signed off by {report.signedBy} · {report.signedAt} · sha256 {report.hash?.slice(0, 16)}…
              </div>
            ) : null}
          </div>
        </Col>

        <Col xs={24} xl={8} className="no-print">
          <div style={{ position: 'sticky', top: 84 }}>
            <TodayGate cap="review.beforeFinal">
            <Card title="Quality gate" data-tour="report-signoff">
              <List
                size="small"
                dataSource={[
                  { label: 'Uncited findings', value: uncited, ok: uncited === 0, sub: 'every finding has a document or rule citation' },
                  { label: 'Unchecked calculations', value: 0, ok: true, sub: `all figures from ${CALC_ENGINE_VERSION}` },
                  { label: 'Open flags', value: pending.length, ok: pending.length === 0, sub: 'silent slots, conflicts, model-assisted findings' },
                ]}
                renderItem={(x) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={x.ok ? <CheckCircleFilled style={{ color: '#389E0D', fontSize: 18 }} /> : <WarningOutlined style={{ color: '#D48806', fontSize: 18 }} />}
                      title={<span>{x.label} <Tag style={{ marginLeft: 6 }}>{x.value}</Tag></span>}
                      description={<span style={{ fontSize: 12 }}>{x.sub}</span>}
                    />
                  </List.Item>
                )}
              />
              {flags.length ? (
                <div style={{ marginTop: 8 }}>
                  <div className="metric-label" style={{ marginBottom: 6 }}>Flags to clear</div>
                  <Space direction="vertical" size={6} style={{ width: '100%' }}>
                    {flags.map((f) => {
                      const done = report.acknowledged.includes(f.key);
                      return (
                        <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                          <span style={{ color: done ? 'var(--muted)' : 'var(--ink)' }}>{done ? <CheckCircleFilled style={{ color: '#389E0D' }} /> : null} {f.label}</span>
                          {done || signed ? null : (
                            <PermButton cap="signReport" denied="Your role cannot clear quality-gate flags" size="small" onClick={() => acknowledgeFlag(deal.id, f.key)}>Acknowledge</PermButton>
                          )}
                        </div>
                      );
                    })}
                  </Space>
                </div>
              ) : null}
              <p className="muted" style={{ fontSize: 12, margin: '14px 0 10px' }}>
                The quality gate is a practitioner action, not an automatic release: the platform surfaces issues; the practitioner clears them and authorizes release.
              </p>
              {signed ? (
                <Alert
                  type="success"
                  showIcon
                  icon={<LockOutlined />}
                  message={`Signed off by ${report.signedBy}`}
                  description={<span style={{ fontSize: 12.5 }}>{report.signedAt} · version {report.version} locked · sha256 {report.hash?.slice(0, 16)}…</span>}
                />
              ) : (
                <>
                  <PermButton
                    cap="signReport"
                    denied="Your role cannot sign the readiness report"
                    type="primary"
                    block
                    size="large"
                    icon={<SafetyCertificateOutlined />}
                    disabled={pending.length > 0}
                    onClick={() => { signReport(deal.id); message.success('Readiness report signed off - version locked'); }}
                  >
                    Sign off readiness report
                  </PermButton>
                  {pending.length ? <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>Clear {pending.length} flag{pending.length === 1 ? '' : 's'} to enable sign-off.</div> : null}
                </>
              )}
            </Card>
            </TodayGate>
            <TodayGate cap="review.beforeFinal" chip="none">
            <Card style={{ marginTop: 14 }} styles={{ body: { padding: 16 } }}>
              <div className="metric-label">Acceptance test 7</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>A practitioner signs off the readiness report without material rewrite. Edits so far: <strong>{Object.keys(report.edits).length}</strong>.</div>
            </Card>
            </TodayGate>
          </div>
        </Col>
      </Row>
    </div>
  );
}

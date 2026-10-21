// Source map: every finding linked to the rule it applies and the evidence it rests on (document, page,
// passage), plus a deal-scoped evidence search that labels each answer by knowledge layer.
import { useMemo, useState, type ReactNode } from 'react';
import { Card, Col, Empty, Input, Row, Segmented, Space, Tag, Tooltip } from 'antd';
import { ApartmentOutlined, BookOutlined, DeploymentUnitOutlined, FileSearchOutlined, LinkOutlined, SearchOutlined } from '@ant-design/icons';
import { useDeal, useDealDocs, useDealFields, useDealFindings } from '../../store/hooks';
import { getDoc, docLabel } from '../../store/selectors';
import { RULES_HCR9 } from '../../data/rules-hcr9';
import { NEW_RULE_T26 } from '../../data/ops';
import { CitationChip, findPassage } from '../../components/viewer';
import { BasisLabel, FindingStatusTag, MetricCard, PageHeader, SeverityTag } from '../../components/ui';
import type { Citation, Finding, Rule, Severity } from '../../data/types';

const ruleById = (id: string): Rule | undefined => RULES_HCR9.find((r) => r.id === id) ?? (id === NEW_RULE_T26.id ? NEW_RULE_T26 : undefined);

function cellValue(c: Citation): string | null {
  const d = getDoc(c.docId);
  if (!d?.sheet || !c.cell) return null;
  const [sheetName, ref] = c.cell.split('!');
  const sheet = d.sheet.sheets.find((s) => s.name === sheetName);
  const m = ref?.match(/^([A-Z])(\d+)$/);
  if (!sheet || !m) return null;
  const row = sheet.rows[Number(m[2]) - 1];
  const v = row?.[m[1].charCodeAt(0) - 65];
  if (v === undefined || v === '') return null;
  return `${row[0] || sheetName}: ${typeof v === 'number' ? v.toLocaleString('en-US') : v}`;
}

const quoteFor = (c: Citation) => findPassage(getDoc(c.docId), c.passageId) ?? cellValue(c);

const SEV_ORDER: Record<Severity, number> = { blocking: 0, advisory: 1, informational: 2 };

// --- deal-scoped evidence search ---------------------------------------------------------------
interface Hit { key: string; kind: 'deal' | 'rule'; text: string; citation?: Citation; rule?: Rule; title: string }

const STOP = new Set(['the', 'is', 'of', 'on', 'what', 'and', 'for', 'to', 'in', 'a', 'an', 'does', 'do', 'any', 'this', 'deal', 'how', 'are', 'there']);
const tokenize = (q: string) =>
  q.toLowerCase().split(/[^a-z0-9%$.-]+/).filter((t) => t.length >= 2 && !STOP.has(t)).map((t) => (t.length > 4 && t.endsWith('s') ? t.slice(0, -1) : t));

const GENERAL_NOTES: { match: string; text: string }[] = [
  { match: 'parking', text: 'Parking requirements are set by the zoning district and, in many areas, have been reduced or removed for income-restricted housing. Confirm against the zoning report or with the architect for this site.' },
];
const DEFAULT_GENERAL = 'General information is shown only on request and is labelled separately. It never feeds a finding or a decision until a person accepts a source.';

function highlight(text: string, tokens: string[]): ReactNode {
  if (!tokens.length) return text;
  const re = new RegExp(`(${tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return text.split(re).map((part, i) => (i % 2 === 1 ? <mark key={i} style={{ background: 'var(--gold-fill)', padding: 0 }}>{part}</mark> : part));
}

export default function Evidence() {
  const deal = useDeal();
  const findings = useDealFindings(deal.id);
  const docs = useDealDocs(deal.id);
  const fields = useDealFields(deal.id);
  const [filter, setFilter] = useState<'All' | 'Blocking' | 'Advisory' | 'Informational'>('All');
  const [query, setQuery] = useState('');

  const sorted = useMemo(() => {
    const list = filter === 'All' ? findings : findings.filter((f) => f.severity === filter.toLowerCase());
    return [...list].sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity] || a.id.localeCompare(b.id));
  }, [findings, filter]);

  const stats = useMemo(() => {
    const links = findings.reduce((a, f) => a + f.sources.length, 0);
    const rules = new Set(findings.flatMap((f) => f.ruleIds)).size;
    const traced = findings.filter((f) => f.sources.length || f.ruleIds.length).length;
    return { links, rules, traced };
  }, [findings]);

  // Search index: rendered passages and workbook rows of this deal's documents, its extracted fields, and the rule pack.
  const index = useMemo<Hit[]>(() => {
    const hits: Hit[] = [];
    for (const d of docs) {
      d.content?.forEach((p) => p.blocks.forEach((b) => {
        if (b.passageId && b.text) hits.push({ key: `${d.id}-${b.passageId}`, kind: 'deal', text: b.text, citation: { docId: d.id, page: p.n, passageId: b.passageId }, title: docLabel(d.id) });
      }));
      d.sheet?.sheets.forEach((s) => s.rows.forEach((r, ri) => {
        const ci = r.findIndex((v, i) => i > 0 && typeof v === 'number');
        if (typeof r[0] === 'string' && r[0] && ci > 0) {
          hits.push({ key: `${d.id}-${s.name}-${ri}`, kind: 'deal', text: `${r[0]}: ${(r[ci] as number).toLocaleString('en-US')}`, citation: { docId: d.id, cell: `${s.name}!${String.fromCharCode(65 + ci)}${ri + 1}` }, title: docLabel(d.id) });
        }
      }));
    }
    for (const f of fields) {
      if (f.status === 'silent') continue;
      hits.push({ key: `field-${f.id}`, kind: 'deal', text: `${f.docType} · ${f.field}: ${f.value}`, citation: f.citation, title: `Extracted field · ${f.docType}` });
    }
    for (const r of RULES_HCR9) hits.push({ key: `rule-${r.id}`, kind: 'rule', text: `${r.rule} (${r.citation})`, rule: r, title: `${r.id} · NY HCR 9% rule pack` });
    return hits;
  }, [docs, fields]);

  const tokens = useMemo(() => tokenize(query), [query]);
  const results = useMemo(() => {
    if (!tokens.length) return null;
    const matched = index.filter((h) => {
      const t = `${h.title} ${h.text}`.toLowerCase();
      return tokens.every((tok) => t.includes(tok));
    });
    return { deal: matched.filter((h) => h.kind === 'deal').slice(0, 6), rule: matched.filter((h) => h.kind === 'rule').slice(0, 4) };
  }, [index, tokens]);
  const general = GENERAL_NOTES.find((g) => tokens.some((t) => t.startsWith(g.match)))?.text ?? DEFAULT_GENERAL;

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Source map"
        title="Every finding, traced to its sources"
        desc="Finding → rule it applies → the document, page and passage it rests on. Each line is labelled with its knowledge layer, and the layers never mix."
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}><MetricCard label="Findings mapped" value={findings.length} sub="this deal only" icon={<ApartmentOutlined />} tone="primary" /></Col>
        <Col xs={12} lg={6}><MetricCard label="Traced to a source" value={`${stats.traced} / ${findings.length}`} sub="rule or document evidence" icon={<LinkOutlined />} tone="success" /></Col>
        <Col xs={12} lg={6}><MetricCard label="Evidence links" value={stats.links} sub="document · page · passage or cell" icon={<FileSearchOutlined />} /></Col>
        <Col xs={12} lg={6}><MetricCard label="Rules referenced" value={stats.rules} sub="NY HCR 9% rule pack" icon={<BookOutlined />} /></Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Card
            data-tour="source-map"
            title="Evidence map"
            extra={<Segmented size="small" value={filter} onChange={(v) => setFilter(v as typeof filter)} options={['All', 'Blocking', 'Advisory', 'Informational']} />}
          >
            {sorted.length ? (
              <Space direction="vertical" size={18} style={{ width: '100%' }}>
                {sorted.map((f) => <FindingBranch key={f.id} f={f} />)}
              </Space>
            ) : (
              <Empty description={findings.length ? 'No findings at this severity' : 'No findings yet for this deal'} />
            )}
          </Card>
        </Col>

        <Col xs={24} xl={9}>
          <Card title={<span><SearchOutlined /> Evidence search</span>} style={{ marginBottom: 16 }}>
            <Input.Search allowClear placeholder={`Ask about ${deal.name}`} value={query} onChange={(e) => setQuery(e.target.value)} enterButton />
            <Space size={[6, 6]} wrap style={{ margin: '10px 0 4px' }}>
              {['phase I date', 'developer fee', 'flood zone', 'parking requirement'].map((q) => (
                <Tag key={q} style={{ cursor: 'pointer' }} onClick={() => setQuery(q)}>{q}</Tag>
              ))}
            </Space>
            <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
              Scoped to {deal.name}. Retrieval never crosses deals or tenants.
            </div>

            {results ? (
              results.deal.length || results.rule.length ? (
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  {!results.deal.length ? (
                    <div className="callout-gold" style={{ fontSize: 13 }}>This deal holds nothing on that question. The matches below are Everstead rules, not deal facts.</div>
                  ) : null}
                  {[...results.deal, ...results.rule].map((h) => (
                    <div key={h.key} className="panel fade-in" style={{ background: '#fff', border: '1px solid var(--border-soft)', padding: '10px 12px' }}>
                      <Space size={6} wrap style={{ marginBottom: 6 }}>
                        <BasisLabel value={h.kind} />
                        {h.citation ? <CitationChip c={h.citation} /> : <span className="mono muted">{h.rule?.citation}</span>}
                      </Space>
                      <div style={{ fontSize: 13, lineHeight: 1.5 }}>{highlight(h.text, tokens)}</div>
                      {h.kind === 'rule' && h.rule ? <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>{h.rule.id} · {h.rule.sourceLayer} · effective {h.rule.effectiveDate}</div> : null}
                    </div>
                  ))}
                </Space>
              ) : (
                <Space direction="vertical" size={10} style={{ width: '100%' }} className="fade-in">
                  <div className="panel" style={{ borderLeft: '3px solid var(--plum)' }}>
                    <BasisLabel value="deal" />
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, marginTop: 8 }}>This deal holds nothing on that question.</div>
                    <div style={{ fontSize: 13, color: 'var(--body)', marginTop: 4 }}>No document, page or extracted field in {deal.name} addresses it, so the platform does not infer an answer.</div>
                  </div>
                  <div className="panel" style={{ background: '#F7F7F9', border: '1px dashed #C9CDD4' }}>
                    <BasisLabel value="general" />
                    <div style={{ fontSize: 13, color: '#4B5563', marginTop: 8 }}>{general}</div>
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>Not drawn from this deal. Never used in a finding or decision until a person accepts a source.</div>
                  </div>
                </Space>
              )
            ) : (
              <div className="muted" style={{ fontSize: 13 }}>Try one of the suggested questions. Answers come back labelled as deal evidence, an Everstead rule, or general information.</div>
            )}
          </Card>

          <Card>
            <Space align="start" size={12}>
              <span className="icon-chip" style={{ background: 'var(--plum-tint)', color: 'var(--plum)' }}><DeploymentUnitOutlined /></span>
              <div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15 }}>Internal evidence map</div>
                <div style={{ fontSize: 13, color: 'var(--body)', marginTop: 4 }}>
                  Release 1 links each finding to its sources as shown here. The visual knowledge graph follows in Release 2, built on the same links.
                </div>
                <Space size={6} wrap style={{ marginTop: 10 }}>
                  <BasisLabel value="deal" />
                  <BasisLabel value="rule" />
                  <BasisLabel value="general" />
                </Space>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

function FindingBranch({ f }: { f: Finding }) {
  const rules = f.ruleIds.map((id) => ({ id, rule: ruleById(id) }));
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <SeverityTag value={f.severity} />
        <span className="mono muted">{f.id}</span>
        <strong style={{ fontSize: 14.5 }}>{f.title}</strong>
        <FindingStatusTag value={f.status} />
      </div>
      <div style={{ marginLeft: 14, marginTop: 8, borderLeft: '2px solid var(--plum-tint-2)', paddingLeft: 16 }}>
        <div className="metric-label" style={{ marginBottom: 4 }}>Rule applied</div>
        {rules.length ? (
          rules.map(({ id, rule }) => (
            <div key={id} style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 6, fontSize: 13 }}>
              <BookOutlined style={{ color: 'var(--plum)' }} />
              <strong className="mono">{id}</strong>
              <Tooltip title={rule?.rule}><span style={{ color: 'var(--body)', maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', verticalAlign: 'bottom' }}>{rule?.rule}</span></Tooltip>
              <span className="muted" style={{ fontSize: 12 }}>{rule?.citation}{rule ? ` · ${rule.layer}` : ''}</span>
              <BasisLabel value="rule" />
            </div>
          ))
        ) : (
          <div style={{ fontSize: 13, color: 'var(--body)', marginBottom: 6 }}>
            <span className="muted">No rule-pack rule - basis:</span> {f.citation}
          </div>
        )}
        <div className="metric-label" style={{ margin: '8px 0 4px' }}>Evidence</div>
        {f.sources.length ? (
          f.sources.map((c, i) => {
            const q = quoteFor(c);
            return (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap' }}>
                <CitationChip c={c} />
                {q ? <span style={{ fontSize: 12.5, fontStyle: 'italic', color: 'var(--secondary)', flex: 1, minWidth: 220 }}>“{q.length > 180 ? `${q.slice(0, 180)}…` : q}”</span> : null}
                <BasisLabel value="deal" />
              </div>
            );
          })
        ) : (
          <div className="muted" style={{ fontSize: 12.5 }}>Rests on the rule pack only - labelled as an Everstead rule, not a deal fact.</div>
        )}
      </div>
    </div>
  );
}

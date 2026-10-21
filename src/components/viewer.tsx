// Citation chips and the document viewer. A chip opens the source at the cited page and highlights the
// passage (or spreadsheet cell) the finding rests on - acceptance test "traceability".
import { useEffect, useMemo, useRef, useState } from 'react';
import { create } from 'zustand';
import { Drawer, Empty, Segmented, Space, Tag, Tooltip, Typography } from 'antd';
import { FileTextOutlined, TableOutlined, MailOutlined, LinkOutlined } from '@ant-design/icons';
import type { Citation, Doc } from '../data/types';
import { getDoc, docLabel } from '../store/selectors';
import { useDemo } from '../store/demoStore';

interface ViewerState {
  open: boolean;
  docId: string | null;
  focus: Citation | null;
  show: (c: Citation) => void;
  close: () => void;
}

export const useViewer = create<ViewerState>((set) => ({
  open: false,
  docId: null,
  focus: null,
  show: (c) => set({ open: true, docId: c.docId, focus: c }),
  close: () => set({ open: false }),
}));

export function citeText(c: Citation) {
  if (c.cell) return c.cell;
  return c.page ? `p.${c.page}` : '';
}

export function CitationChip({ c, short = false }: { c: Citation; short?: boolean }) {
  const show = useViewer((s) => s.show);
  const doc = getDoc(c.docId);
  const icon = doc?.format === 'xlsx' ? <TableOutlined /> : doc?.format === 'eml' ? <MailOutlined /> : <FileTextOutlined />;
  const passage = useMemo(() => findPassage(doc, c.passageId), [doc, c.passageId]);
  return (
    <Tooltip title={passage ? <span style={{ fontSize: 12 }}>“{passage}”</span> : `Open ${docLabel(c.docId)}`} styles={{ root: { maxWidth: 420 } }}>
      <span className="cite" onClick={(e) => { e.stopPropagation(); show(c); }}>
        {icon}
        {!short ? <span className="cite-doc" style={{ maxWidth: 210 }}>{docLabel(c.docId)}</span> : null}
        <span>{citeText(c)}</span>
      </span>
    </Tooltip>
  );
}

export function findPassage(doc: Doc | undefined, passageId?: string): string | null {
  if (!doc?.content || !passageId) return null;
  for (const p of doc.content) for (const b of p.blocks) if (b.passageId === passageId) return b.text ?? null;
  return null;
}

const colName = (i: number) => String.fromCharCode(65 + i);

export function SheetGrid({ doc, cell }: { doc: Doc; cell?: string }) {
  const [sheetName, ref] = cell?.includes('!') ? cell.split('!') : [undefined, undefined];
  const initial = doc.sheet!.sheets.find((s) => s.name === sheetName)?.name ?? doc.sheet!.sheets[0].name;
  const [active, setActive] = useState(initial);
  useEffect(() => setActive(initial), [initial]);
  const sheet = doc.sheet!.sheets.find((s) => s.name === active)!;
  const m = ref?.match(/^([A-Z])(\d+)$/);
  const hl = m && active === sheetName ? { col: m[1].charCodeAt(0) - 65, row: Number(m[2]) - 1 } : null;
  const hlRef = useRef<HTMLTableCellElement>(null);
  useEffect(() => { hlRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, [active, cell]);
  const width = Math.max(...sheet.rows.map((r) => r.length));
  return (
    <div>
      <Segmented value={active} onChange={(v) => setActive(v as string)} options={doc.sheet!.sheets.map((s) => s.name)} style={{ marginBottom: 12 }} />
      <div style={{ overflow: 'auto', maxHeight: '68vh', border: '1px solid var(--border)', borderRadius: 8 }}>
        <table className="sheet">
          <thead>
            <tr><th style={{ width: 36 }} />{Array.from({ length: width }, (_, i) => <th key={i}>{colName(i)}</th>)}</tr>
          </thead>
          <tbody>
            {sheet.rows.map((r, ri) => (
              <tr key={ri}>
                <th>{ri + 1}</th>
                {Array.from({ length: width }, (_, ci) => {
                  const v = r[ci] ?? '';
                  const isHl = hl && hl.row === ri && hl.col === ci;
                  const num = typeof v === 'number';
                  return (
                    <td key={ci} ref={isHl ? hlRef : undefined} className={`${num ? 'num' : 'label'} ${isHl ? 'hl' : ''}`} style={ri === 0 ? { fontWeight: 700 } : undefined}>
                      {num ? (Math.abs(v) < 10 && !Number.isInteger(v) ? v : v.toLocaleString('en-US')) : v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PaperPages({ doc, focus }: { doc: Doc; focus?: Citation | null }) {
  const wrap = useRef<HTMLDivElement>(null);
  // zustand v5: select the raw slice and derive with useMemo (a selector must not return a new object).
  const fields = useDemo((s) => s.fields);
  const citedIds = useMemo(() => new Set(fields.filter((f) => f.docId === doc.id).map((f) => f.citation?.passageId)), [fields, doc.id]);
  useEffect(() => {
    if (!focus) return;
    const t = setTimeout(() => {
      const el = wrap.current?.querySelector(focus.passageId ? `[data-passage="${focus.passageId}"]` : `[data-page="${focus.page}"]`);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 250);
    return () => clearTimeout(t);
  }, [focus, doc.id]);
  if (!doc.content) {
    return <Empty description="Preview not rendered in this demo - OCR text and metadata are indexed." />;
  }
  return (
    <div className="viewer-wrap" ref={wrap}>
      {doc.content.map((p) => (
        <div key={p.n} className={`paper ${doc.scan ? 'scan' : ''}`} data-page={p.n}>
          {doc.header ? <div className="doc-head">{doc.header}</div> : null}
          {p.blocks.map((b, i) => {
            const cls = b.passageId ? `passage ${focus?.passageId === b.passageId ? 'focus' : citedIds.has(b.passageId) ? 'cited' : ''}` : '';
            if (b.type === 'h') return <h3 key={i}>{b.text}</h3>;
            if (b.type === 'kv' || b.type === 'table') {
              return (
                <table key={i}>
                  <tbody>{b.rows!.map((r, ri) => <tr key={ri}>{r.map((c, ci) => (ri === 0 && b.type === 'table' ? <th key={ci}>{c}</th> : <td key={ci}>{c}</td>))}</tr>)}</tbody>
                </table>
              );
            }
            if (b.type === 'sig') return <p key={i} style={{ marginTop: 24, fontStyle: 'italic', borderTop: '1px solid #ccc', paddingTop: 8 }}>{b.text}</p>;
            if (b.type === 'note') return <p key={i} style={{ color: '#a33', fontSize: 11.5, border: '1px dashed #e0a0a0', padding: '4px 8px' }}>{b.text}</p>;
            return <p key={i}><span className={cls} data-passage={b.passageId}>{b.text}</span></p>;
          })}
          <div className="page-no">Page {p.n} of {doc.pages}</div>
        </div>
      ))}
    </div>
  );
}

export function DocViewerDrawer() {
  const { open, docId, focus, close } = useViewer();
  const superseded = useDemo((s) => s.superseded);
  const doc = docId ? getDoc(docId) : undefined;
  return (
    <Drawer
      open={open}
      onClose={close}
      width={820}
      title={
        doc ? (
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <span>{doc.name}</span>
            <Space size={6} wrap>
              <Tag>{doc.docType}</Tag>
              <Tag>{doc.pages} pages</Tag>
              {doc.scannedPct ? <Tag color="gold">Scanned · OCR</Tag> : null}
              {doc.executed ? <Tag color="green">Executed</Tag> : null}
              <Tag>v{doc.version}</Tag>
              {superseded[doc.id] ? <Tag color="red">Superseded by {docLabel(superseded[doc.id])}</Tag> : null}
              {focus ? <Tag icon={<LinkOutlined />} color="purple">Cited {citeText(focus)}</Tag> : null}
            </Space>
          </Space>
        ) : 'Document'
      }
    >
      {doc ? (doc.sheet ? <SheetGrid doc={doc} cell={focus?.cell} /> : <PaperPages doc={doc} focus={focus} />) : <Empty />}
      {doc && !doc.sheet ? (
        <Typography.Paragraph type="secondary" style={{ marginTop: 12, fontSize: 12 }}>
          Highlighted passages are cited by extracted fields or findings. The focused passage is the one you opened.
        </Typography.Paragraph>
      ) : null}
    </Drawer>
  );
}

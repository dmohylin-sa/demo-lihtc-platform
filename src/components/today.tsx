// The "Today" lens. In Release 1 target mode every component here renders its children untouched (no wrapper),
// so layout and tour targets never move. In Today mode a capability the current platform lacks stays readable but
// dimmed and inert, with a chip that says what exists today and links to its row in the capability matrix.
// Imports only antd, the router, the store and the registry - never ui.tsx, which imports this file.
import { createContext, useContext, type CSSProperties, type KeyboardEvent, type ReactNode, type SyntheticEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Popover, type ButtonProps } from 'antd';
import { ArrowRightOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useDemo } from '../store/demoStore';
import { CAPS, CAP_STATUS, EXCEPTIONS, type CapDef, type CapId, type ExceptionId } from '../data/currentState';

export const useToday = () => useDemo((s) => s.mode === 'today');
const def = (cap: CapId): CapDef => CAPS[cap];
export const capDims = (cap: CapId) => CAP_STATUS[def(cap).status].dims;

// Set inside a dimmed area: nested chips and gates render nothing there, since they could not be hovered anyway.
const DimContext = createContext(false);

function useOpenMatrix() {
  const navigate = useNavigate();
  return (cap?: CapId) => navigate({ pathname: '/current-state', search: cap ? `?cap=${cap}` : '' });
}

function CapCard({ cap }: { cap: CapId }) {
  const d = def(cap);
  const open = useOpenMatrix();
  return (
    <div style={{ maxWidth: 360, fontSize: 13, lineHeight: 1.5 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.label}</div>
      <div style={{ color: 'var(--body)' }}>{d.today}</div>
      {d.position ? <div style={{ marginTop: 6 }}><span className="muted">Direction:</span> <strong>{d.position}</strong></div> : null}
      {d.exception ? <div style={{ marginTop: 6 }}><ExclamationCircleOutlined style={{ color: '#D48806' }} /> Known issue: {EXCEPTIONS[d.exception].text}</div> : null}
      {d.delta ? <div style={{ marginTop: 6 }}><span className="muted">Release 1 adds:</span> {d.delta}</div> : null}
      <Button type="link" size="small" style={{ padding: 0, marginTop: 6 }} onClick={() => open(cap)}>Open in capability matrix <ArrowRightOutlined /></Button>
    </div>
  );
}

// Status chip with what exists today in a popover. Renders nothing in target mode or inside a dimmed area.
export function CapChip({ cap, label, style }: { cap: CapId; label?: string; style?: CSSProperties }) {
  const today = useToday();
  const dimmed = useContext(DimContext);
  if (!today || dimmed) return null;
  const d = def(cap);
  return (
    <Popover content={<CapCard cap={cap} />} placement="bottomRight">
      <span className={`today-chip today-chip--${d.status}`} style={style}>
        {label ?? CAP_STATUS[d.status].label}{d.exception ? ' · known issue' : ''}
      </span>
    </Popover>
  );
}

export function ExceptionTag({ id }: { id: ExceptionId }) {
  const today = useToday();
  const dimmed = useContext(DimContext);
  if (!today || dimmed) return null;
  return (
    <Popover content={<div style={{ maxWidth: 320, fontSize: 13 }}><strong>{EXCEPTIONS[id].title}</strong><div style={{ marginTop: 4 }}>{EXCEPTIONS[id].text}</div><div className="muted" style={{ marginTop: 4 }}>Carried into the next phase.</div></div>}>
      <span className="today-chip today-chip--partial">Known issue</span>
    </Popover>
  );
}

// Capture-phase guard: clicks, presses, typing and drops never reach a dimmed feature. Tabs, pagination, expanders
// and scrolling stay usable so the screen can still be read.
const ALLOW = '.ant-tabs-nav, .ant-pagination, .ant-table-row-expand-icon, .ant-tree-switcher, .ant-collapse-header, [data-today-allow]';
const block = (e: SyntheticEvent) => {
  const t = e.target as Element | null;
  if (t?.closest?.(ALLOW)) return;
  e.preventDefault();
  e.stopPropagation();
};
const blockKey = (e: KeyboardEvent) => { if (e.key !== 'Tab') block(e); };

export function TodayGate({ cap, children, chip = 'auto', fill, chipLabel, style }: {
  cap: CapId; children: ReactNode; chip?: 'auto' | 'always' | 'none'; fill?: boolean; chipLabel?: string; style?: CSSProperties;
}) {
  const today = useToday();
  const dimmedAbove = useContext(DimContext);
  if (!today || dimmedAbove) return <>{children}</>;
  const d = def(cap);
  const cls = `today-gate${fill ? ' today-gate--fill' : ''}`;
  if (!capDims(cap)) {
    const show = chip === 'always' || (chip === 'auto' && d.status !== 'built');
    if (!show) return <>{children}</>;
    return <div className={cls} style={style}><span className="today-gate__chip"><CapChip cap={cap} label={chipLabel} /></span>{children}</div>;
  }
  return (
    <div className={`${cls} today-gate--dim`} style={style} aria-disabled="true">
      {chip !== 'none' ? <span className="today-gate__chip"><CapChip cap={cap} label={chipLabel} /></span> : null}
      <DimContext.Provider value>
        <div
          className="today-gate__body"
          onClickCapture={block}
          onMouseDownCapture={block}
          onPointerDownCapture={block}
          onKeyDownCapture={blockKey}
          onDragOverCapture={block}
          onDropCapture={block}
        >
          {children}
        </div>
      </DimContext.Provider>
    </div>
  );
}

// Banner explaining a whole screen in Today mode.
export function TodayNotice({ cap, also, slim }: { cap: CapId; also?: CapId[]; slim?: boolean }) {
  const today = useToday();
  const open = useOpenMatrix();
  if (!today) return null;
  const d = def(cap);
  return (
    <div className={`today-notice today-notice--${d.status} no-print`}>
      <div className="today-notice__head">
        <CapChip cap={cap} />
        <strong>{d.label}</strong>
      </div>
      <div style={{ color: 'var(--body)', fontSize: 13.5, marginTop: 4 }}>{d.today}</div>
      {!slim && d.delta ? <div style={{ fontSize: 13, marginTop: 4 }}><span className="muted">Release 1 adds:</span> {d.delta}</div> : null}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
        {also?.length ? <><span className="muted" style={{ fontSize: 12 }}>Also on this screen:</span>{also.map((c) => <CapChip key={c} cap={c} label={def(c).label} />)}</> : null}
        <Button type="link" size="small" style={{ padding: 0, marginLeft: 'auto' }} onClick={() => open(cap)}>Open in capability matrix <ArrowRightOutlined /></Button>
      </div>
    </div>
  );
}

// Whole-screen gate, used at the route.
export function TodayPage({ cap, also, children }: { cap: CapId; also?: CapId[]; children: ReactNode }) {
  const today = useToday();
  if (!today) return <>{children}</>;
  return (
    <>
      <TodayNotice cap={cap} also={also} />
      <TodayGate cap={cap} chip="none">{children}</TodayGate>
    </>
  );
}

// A button for a feature the current platform lacks: disabled in Today mode, with what exists today on hover.
export function GatedButton({ feature, children, ...rest }: ButtonProps & { feature: CapId }) {
  const today = useToday();
  if (!today || !capDims(feature)) return <Button {...rest}>{children}</Button>;
  return (
    <Popover content={<CapCard cap={feature} />}>
      <Button {...rest} disabled onClick={undefined}>{children}</Button>
    </Popover>
  );
}

// Sidebar label with a status dot. Items stay clickable so the screen-level notice can be read.
export function todayMenuLabel(label: ReactNode, cap: CapId | undefined, today: boolean): ReactNode {
  if (!today || !cap) return label;
  const st = def(cap).status;
  return (
    <span className={CAP_STATUS[st].dims ? 'menu-today-dim' : undefined} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      {label}<span className={`today-dot today-dot--${st}`} />
    </span>
  );
}

// Title and class for a table column: spread into the column so the chip sits in its header and, if the
// platform lacks it, the column dims. In target mode it is just the title.
export function todayCol(title: ReactNode, cap: CapId, today: boolean): { title: ReactNode; className?: string } {
  if (!today) return { title };
  return {
    title: <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>{title}<CapChip cap={cap} label={CAP_STATUS[def(cap).status].short} /></span>,
    className: capDims(cap) ? 'today-col-dim' : undefined,
  };
}

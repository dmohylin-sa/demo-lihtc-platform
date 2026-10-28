// UI kit: MetricCard / StageRail / StatusTag from the antd-modern-style-demo skill (ported to TSX),
// plus badges that reproduce the review pack's own visual vocabulary.
import type { ReactNode } from 'react';
import { Card, Tag, Tooltip, theme } from 'antd';
import {
  CheckOutlined, CloseCircleFilled, ExclamationCircleFilled, InfoCircleFilled, LockOutlined, PauseCircleFilled,
  FileSearchOutlined, BookOutlined, GlobalOutlined,
} from '@ant-design/icons';
import type { Basis, FieldStatus, FindingStatus, Health, NodeStatus, Severity } from '../data/types';
import type { CapId } from '../data/currentState';
import { CapChip } from './today';

export function MetricCard({ label, value, sub, icon, tone = 'neutral', dataTour }: {
  label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode; tone?: 'primary' | 'neutral' | 'danger' | 'success'; dataTour?: string;
}) {
  const { token } = theme.useToken();
  const accent = tone === 'primary' ? token.colorPrimary : tone === 'danger' ? token.colorError : tone === 'success' ? token.colorSuccess : token.colorTextHeading;
  const chipBg = tone === 'primary' ? '#F3E9EE' : tone === 'danger' ? '#FFF1F0' : tone === 'success' ? '#F0F8F2' : '#F5EFEA';
  return (
    <Card styles={{ body: { padding: 18 } }} data-tour={dataTour}>
      <div className="metric-row">
        <div style={{ minWidth: 0 }}>
          <div className="metric-label">{label}</div>
          <div className="metric-value" style={{ color: accent }}>{value}</div>
          {sub ? <div className="metric-sub">{sub}</div> : null}
        </div>
        {icon ? <span className="metric-chip" style={{ color: accent, background: chipBg }}>{icon}</span> : null}
      </div>
    </Card>
  );
}

export interface RailStage { key: string; label: string; state: 'done' | 'current' | 'blocked' | 'todo'; gate?: boolean; hint?: string; mark?: string }

export function StageRail({ stages, onClick }: { stages: RailStage[]; onClick?: (key: string) => void }) {
  const lastOn = stages.reduce((acc, s, i) => (s.state !== 'todo' ? i : acc), -1);
  return (
    <div className="rail">
      {stages.map((s, i) => (
        <div className={`rail-step${i <= lastOn ? ' on' : ''}`} key={s.key} onClick={() => onClick?.(s.key)} style={{ cursor: onClick ? 'pointer' : undefined }}>
          <Tooltip title={s.hint}>
            <div className={`rail-dot ${s.state === 'done' ? 'done' : s.state === 'current' ? 'current' : s.state === 'blocked' ? 'blocked' : ''} ${s.gate ? 'gate' : ''}`}>
              <span>{s.mark && s.state !== 'blocked' ? s.mark : s.state === 'done' ? <CheckOutlined /> : s.state === 'blocked' ? '!' : s.gate ? 'G1' : i + 1}</span>
            </div>
          </Tooltip>
          <div className={`rail-label${s.state === 'current' || s.state === 'blocked' ? ' active' : ''}`}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export function StatusTag({ status, map }: { status: string; map: Record<string, { label: string; color: string }> }) {
  const s = map[status] || { label: status, color: 'default' };
  return <Tag color={s.color} style={{ fontWeight: 600, marginInlineEnd: 0 }}>{s.label}</Tag>;
}

export function PageHeader({ title, desc, extra, eyebrow, cap }: { title: ReactNode; desc?: ReactNode; extra?: ReactNode; eyebrow?: string; cap?: CapId }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0 }}>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2 className="section-title">{title}{cap ? <CapChip cap={cap} style={{ marginLeft: 10, verticalAlign: 4 }} /> : null}</h2>
        {desc ? <p className="section-desc">{desc}</p> : null}
      </div>
      {extra ? <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{extra}</div> : null}
    </div>
  );
}

// --- review-pack badges (p.250 styling) ---
export const RuleTypeBadge = ({ value }: { value: string }) => <span className={`rt-badge rt-${value}`}>{value}</span>;
export const StepClassBadge = ({ value }: { value: string }) => <span className={`sc-badge sc-${value}`}>{value}</span>;

export const SEVERITY: Record<Severity, { label: string; color: string; icon: ReactNode }> = {
  blocking: { label: 'Blocking', color: 'error', icon: <CloseCircleFilled /> },
  advisory: { label: 'Advisory', color: 'warning', icon: <ExclamationCircleFilled /> },
  informational: { label: 'Informational', color: 'default', icon: <InfoCircleFilled /> },
};
export const SeverityTag = ({ value }: { value: Severity }) => (
  <Tag color={SEVERITY[value].color} icon={SEVERITY[value].icon} style={{ marginInlineEnd: 0 }}>{SEVERITY[value].label}</Tag>
);

export const HEALTH: Record<Health, { color: string; dot: string }> = {
  'on track': { color: 'success', dot: '#389E0D' },
  'at risk': { color: 'warning', dot: '#D48806' },
  'needs escalation': { color: 'error', dot: '#CF1322' },
};
export const HealthTag = ({ value }: { value: Health }) => (
  <Tag color={HEALTH[value].color} style={{ marginInlineEnd: 0, textTransform: 'capitalize' }}>
    <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 9, background: HEALTH[value].dot, marginRight: 6, verticalAlign: 1 }} />
    {value}
  </Tag>
);

export const NODE_STATUS: Record<NodeStatus, { label: string; color: string; dot: string }> = {
  done: { label: 'Complete', color: 'success', dot: '#389E0D' },
  in_progress: { label: 'In progress', color: 'processing', dot: '#521B3A' },
  blocked: { label: 'Blocked', color: 'error', dot: '#CF1322' },
  awaiting_decision: { label: 'Awaiting decision', color: 'gold', dot: '#D48806' },
  not_started: { label: 'Not started', color: 'default', dot: '#C9BFBB' },
  na: { label: 'Not on this path', color: 'default', dot: '#E9E2DE' },
};
export const NodeStatusTag = ({ value }: { value: NodeStatus }) => (
  <Tag color={NODE_STATUS[value].color} style={{ marginInlineEnd: 0 }} icon={value === 'awaiting_decision' ? <PauseCircleFilled /> : undefined}>
    {NODE_STATUS[value].label}
  </Tag>
);
export const StatusDot = ({ value }: { value: NodeStatus }) => (
  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 9, background: NODE_STATUS[value].dot, flex: 'none' }} />
);

export const FINDING_STATUS: Record<FindingStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'error' },
  'in review': { label: 'In human review', color: 'gold' },
  resolved: { label: 'Resolved', color: 'success' },
  invalidated: { label: 'Invalidated', color: 'default' },
  passed: { label: 'Pass', color: 'success' },
};
export const FindingStatusTag = ({ value }: { value: FindingStatus }) => <StatusTag status={value} map={FINDING_STATUS} />;

export const FIELD_STATUS: Record<FieldStatus, { label: string; color: string }> = {
  accepted: { label: 'Accepted', color: 'success' },
  review: { label: 'Needs review', color: 'processing' },
  silent: { label: 'Silent - flagged', color: 'error' },
  conflict: { label: 'Conflict', color: 'warning' },
  corrected: { label: 'Corrected', color: 'purple' },
};
export const FieldStatusTag = ({ value }: { value: FieldStatus }) => <StatusTag status={value} map={FIELD_STATUS} />;

// --- knowledge-layer labels (Vision §8.5) ---
export const BASIS: Record<Basis, { label: string; cls: string; icon: ReactNode; tip: string }> = {
  deal: { label: 'Deal evidence', cls: 'basis-deal', icon: <FileSearchOutlined />, tip: 'Cited to this deal\'s documents - document, page and passage.' },
  rule: { label: 'Approved Everstead rule', cls: 'basis-rule', icon: <BookOutlined />, tip: 'Everstead\'s encoded expertise: rule pack or process tree, with citation and effective date.' },
  general: { label: 'General information', cls: 'basis-general', icon: <GlobalOutlined />, tip: 'General AI knowledge - never presented as deal fact and never feeds a decision until a person accepts the source.' },
};
export const BasisLabel = ({ value }: { value: Basis }) => (
  <Tooltip title={BASIS[value].tip}>
    <span className={`basis ${BASIS[value].cls}`}>{BASIS[value].icon}{BASIS[value].label}</span>
  </Tooltip>
);

export const Restricted = ({ text = 'Restricted' }: { text?: string }) => (
  <Tooltip title="Field-level permission: developer fee, equity pricing and sponsor cash are hidden from this role.">
    <span style={{ color: 'var(--muted)', fontWeight: 600, display: 'inline-flex', gap: 5, alignItems: 'center' }}><LockOutlined /> {text}</span>
  </Tooltip>
);

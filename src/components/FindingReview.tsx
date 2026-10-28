// Accept, Override or Flag on a finding, as reviewers do on today's platform. Override and Flag need a
// note; every action is written to the audit trail. Kept apart from the finding's status.
import { useState } from 'react';
import { App as AntdApp, Button, Input, Space, Tag, Timeline } from 'antd';
import { CheckOutlined, EditOutlined, FlagOutlined } from '@ant-design/icons';
import { useDemo } from '../store/demoStore';
import { PermButton } from './perm';
import { CapChip } from './today';
import type { Finding, ReviewAction } from '../data/types';

export const REVIEW: Record<ReviewAction, { label: string; color: string }> = {
  accepted: { label: 'Accepted', color: 'success' },
  overridden: { label: 'Overridden', color: 'purple' },
  flagged: { label: 'Flagged', color: 'warning' },
};

export function ReviewTag({ findingId }: { findingId: string }) {
  const reviews = useDemo((s) => s.findingReviews[findingId]);
  const last = reviews?.[reviews.length - 1];
  if (!last) return null;
  return <Tag color={REVIEW[last.action].color} style={{ marginInlineEnd: 0 }}>{REVIEW[last.action].label}</Tag>;
}

export function ReviewPanel({ f }: { f: Finding }) {
  const reviews = useDemo((s) => s.findingReviews[f.id]);
  const reviewFinding = useDemo((s) => s.reviewFinding);
  const { message } = AntdApp.useApp();
  const [pending, setPending] = useState<Exclude<ReviewAction, 'accepted'> | null>(null);
  const [note, setNote] = useState('');

  const submit = (action: ReviewAction, text?: string) => {
    reviewFinding(f.id, action, text);
    message.success(`${f.id} ${REVIEW[action].label.toLowerCase()} - recorded in the audit trail`);
    setPending(null);
    setNote('');
  };
  const denied = 'Reviewing findings needs a practitioner role';

  return (
    <div>
      <Space size={8} wrap>
        <PermButton cap="reviewFindings" denied={denied} icon={<CheckOutlined />} onClick={() => submit('accepted')}>Accept</PermButton>
        <PermButton cap="reviewFindings" denied={denied} icon={<EditOutlined />} onClick={() => setPending('overridden')}>Override</PermButton>
        <PermButton cap="reviewFindings" denied={denied} icon={<FlagOutlined />} onClick={() => setPending('flagged')}>Flag</PermButton>
        <CapChip cap="findings.review" />
      </Space>
      {pending ? (
        <div className="panel" style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{pending === 'overridden' ? 'Override - state the basis' : 'Flag - say what needs checking'}</div>
          <Input.TextArea
            autoFocus
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={pending === 'overridden' ? 'e.g. Lender confirmed 1.15x in the signed amendment of Oct 22' : 'e.g. Confirm the fee base with the sponsor before IC'}
          />
          <Space style={{ marginTop: 8 }}>
            <Button type="primary" disabled={!note.trim()} onClick={() => submit(pending, note.trim())}>{pending === 'overridden' ? 'Record override' : 'Record flag'}</Button>
            <Button onClick={() => { setPending(null); setNote(''); }}>Cancel</Button>
          </Space>
        </div>
      ) : null}
      {reviews?.length ? (
        <Timeline
          style={{ marginTop: 14, marginBottom: -14 }}
          items={[...reviews].reverse().map((r) => ({
            children: (
              <span style={{ fontSize: 12.5 }}>
                <Tag color={REVIEW[r.action].color}>{REVIEW[r.action].label}</Tag>
                {r.actor} · {r.role} · <span className="mono">{r.at}</span>
                {r.note ? <div style={{ color: 'var(--body)', marginTop: 2 }}>{r.note}</div> : null}
              </span>
            ),
          }))}
        />
      ) : null}
    </div>
  );
}

// Risk register: the output of the risk agent (010), the third agent in today's chain. Entries come
// from the deal's blocking and advisory findings; likelihood and impact are illustrative.
import { Table, Tag } from 'antd';
import { CitationChip } from '../../components/viewer';
import { FindingStatusTag } from '../../components/ui';
import { ReviewTag } from '../../components/FindingReview';
import { RISK_META, riskRating, type Level } from '../../data/agentRuns';
import type { Finding, FindingStatus } from '../../data/types';

const LEVEL_COLOR: Record<Level, string> = { High: 'error', Medium: 'warning', Low: 'default' };

export default function RiskRegister({ findings, onOpen }: { findings: Finding[]; onOpen: (id: string) => void }) {
  const rows = findings
    .filter((f) => f.severity !== 'informational' && RISK_META[f.id])
    .map((f) => ({ ...f, ...RISK_META[f.id], rating: riskRating(RISK_META[f.id].likelihood, RISK_META[f.id].impact) }))
    .sort((a, b) => ['High', 'Medium', 'Low'].indexOf(a.rating) - ['High', 'Medium', 'Low'].indexOf(b.rating));

  return (
    <Table
      className="clickable-rows"
      rowKey="id"
      pagination={false}
      dataSource={rows}
      onRow={(f) => ({ onClick: () => onOpen(f.id), style: { opacity: f.status === 'resolved' ? 0.62 : 1 } })}
      columns={[
        { title: 'ID', dataIndex: 'id', width: 72, render: (v: string) => <span className="mono">{v}</span> },
        { title: 'Risk', dataIndex: 'title', render: (v: string, f) => <span><strong>{v}</strong><br /><span className="muted" style={{ fontSize: 12 }}>{f.category}</span></span> },
        { title: 'Likelihood', dataIndex: 'likelihood', width: 100, render: (v: Level) => <Tag color={LEVEL_COLOR[v]}>{v}</Tag> },
        { title: 'Impact', dataIndex: 'impact', width: 90, render: (v: Level) => <Tag color={LEVEL_COLOR[v]}>{v}</Tag> },
        { title: 'Rating', dataIndex: 'rating', width: 90, render: (v: Level) => <Tag color={LEVEL_COLOR[v]} style={{ fontWeight: 800 }}>{v}</Tag> },
        { title: 'Owner', dataIndex: 'owner', width: 140, render: (v: string) => <span style={{ fontSize: 12.5 }}>{v}</span> },
        { title: 'Mitigation', dataIndex: 'action', render: (v: string) => <span style={{ fontSize: 12.5 }}>{v}</span> },
        { title: 'Source', width: 130, render: (_, f) => (f.sources[0] ? <CitationChip c={f.sources[0]} short /> : <span className="muted">Rule</span>) },
        { title: 'Status', dataIndex: 'status', width: 150, render: (v: FindingStatus, f) => <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}><FindingStatusTag value={v} /><ReviewTag findingId={f.id} /></span> },
      ]}
    />
  );
}

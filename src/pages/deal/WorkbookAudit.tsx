// Six-gate workbook audit: what the 9% underwriting agent (009) does today - audit the sponsor workbook gate by
// gate and point each finding to its cell. The gates were not named to us, so they stay
// numbered; which findings sit under which gate is illustrative. Gate status follows the findings live.
import { useNavigate } from 'react-router-dom';
import { Card, Col, Row, Space, Tag } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled } from '@ant-design/icons';
import { useDealFindings } from '../../store/hooks';
import { CitationChip } from '../../components/viewer';
import { FindingStatusTag } from '../../components/ui';
import { ReviewTag } from '../../components/FindingReview';
import { NAMES_NOTE } from '../../data/currentState';
import { WORKBOOK_AUDIT } from '../../data/agentRuns';

const isOpen = (s: string) => s === 'open' || s === 'in review';

export default function WorkbookAudit({ dealId }: { dealId: string }) {
  const navigate = useNavigate();
  const findings = useDealFindings(dealId);
  const gates = WORKBOOK_AUDIT.map((g) => {
    const linked = findings.filter((f) => g.findingIds.includes(f.id));
    const open = linked.filter((f) => isOpen(f.status));
    const state = open.some((f) => f.severity === 'blocking') ? 'blocking' : open.length ? 'flagged' : 'passed';
    return { ...g, linked, state };
  });
  const flagged = gates.filter((g) => g.state !== 'passed').length;

  return (
    <Card
      title="Workbook audit · six gates"
      extra={<span className="muted" style={{ fontSize: 12 }}>Agent 009</span>}
    >
      <p style={{ marginTop: 0, color: 'var(--body)' }}>
        The underwriting agent audits the sponsor's 9% workbook through six gates and points each finding to its sheet and cell. {6 - flagged} of 6 gates pass; {flagged} flagged.
      </p>
      <Row gutter={[12, 12]}>
        {gates.map((g) => (
          <Col xs={24} lg={12} key={g.gate}>
            <div className="panel" style={{ height: '100%', background: g.state === 'blocking' ? '#FFF1F0' : g.state === 'flagged' ? 'var(--gold-fill)' : '#F0F8F2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span>
                  <strong style={{ fontFamily: 'var(--font-head)', fontSize: 15 }}>Audit gate {g.gate}</strong>
                  <span className="muted" style={{ fontSize: 11.5, marginLeft: 8 }}>name to confirm at code review</span>
                </span>
                {g.state === 'passed'
                  ? <Tag color="success" icon={<CheckCircleFilled />}>Passed</Tag>
                  : g.state === 'blocking'
                    ? <Tag color="error" icon={<CloseCircleFilled />}>Flagged · blocking</Tag>
                    : <Tag color="warning" icon={<ExclamationCircleFilled />}>Flagged</Tag>}
              </div>
              <Space direction="vertical" size={6} style={{ width: '100%', marginTop: 8 }}>
                {g.linked.map((f) => (
                  <div key={f.id} style={{ fontSize: 13 }}>
                    <a onClick={() => navigate(`/deals/${dealId}/findings?f=${f.id}`)}><span className="mono">{f.id}</span> {f.title}</a>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                      <FindingStatusTag value={f.status} />
                      <ReviewTag findingId={f.id} />
                      {f.sources.filter((c) => c.cell).map((c, i) => <CitationChip key={i} c={c} short />)}
                    </div>
                  </div>
                ))}
              </Space>
            </div>
          </Col>
        ))}
      </Row>
      <p className="muted" style={{ fontSize: 12, margin: '12px 0 0' }}>{NAMES_NOTE}. The mapping of findings to gates is illustrative.</p>
    </Card>
  );
}

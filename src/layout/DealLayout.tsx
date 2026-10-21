// Deal workspace frame: the deal record header (versioned, pinned to tree and rule-pack versions) above every deal page.
import { Outlet, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Progress, Space, Tag, Tooltip } from 'antd';
import { EnvironmentOutlined, PushpinOutlined, SyncOutlined } from '@ant-design/icons';
import { useDemo } from '../store/demoStore';
import { useDeal, useDealMetrics } from '../store/hooks';
import { PROJECT_TYPES } from '../data/deals';
import { HealthTag } from '../components/ui';
import { PermButton } from '../components/perm';

export default function DealLayout() {
  const deal = useDeal();
  const m = useDealMetrics(deal.id);
  const published = useDemo((s) => s.rulePackPublished);
  const rerun = useDemo((s) => s.rerunRules);
  const navigate = useNavigate();
  const stale = published !== deal.ruleVersion;
  return (
    <div className="fade-in" key={deal.id}>
      <Card styles={{ body: { padding: '18px 22px' } }} style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 320 }}>
            <span className="eyebrow">Deal record · {deal.program} · {deal.agency}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 2 }}>
              <h1 style={{ margin: 0, fontSize: 26, fontFamily: 'var(--font-head)' }}>{deal.name}</h1>
              <HealthTag value={m.health} />
            </div>
            <Space size={6} wrap style={{ marginTop: 8 }}>
              <span style={{ color: 'var(--secondary)', fontSize: 13 }}><EnvironmentOutlined /> {deal.location}</span>
              <Tag>{deal.units} units</Tag>
              <Tag color="purple">{PROJECT_TYPES[deal.projectType].label}</Tag>
              {deal.overlays.map((o) => <Tag key={o}>{o}</Tag>)}
            </Space>
          </div>
          <Space size={8} direction="vertical" style={{ alignItems: 'flex-end' }}>
            <Space size={6}>
              <Tooltip title="Each deal is pinned to the process-tree version it was checked against. A new tree release loads as configuration.">
                <Tag icon={<PushpinOutlined />} color="default">Tree {deal.treeVersion}</Tag>
              </Tooltip>
              <Tooltip title="Rule pack version the deal's findings were produced with.">
                <Tag icon={<PushpinOutlined />} color={stale ? 'gold' : 'default'}>NY HCR 9% {deal.ruleVersion}</Tag>
              </Tooltip>
              <Tag>Target closing {deal.targetClosing}</Tag>
            </Space>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 300 }} data-tour="readiness">
              <span className="metric-label" style={{ whiteSpace: 'nowrap' }}>Underwriting readiness</span>
              <Progress percent={m.readiness} strokeColor="#521B3A" size="small" style={{ margin: 0, flex: 1 }} />
            </div>
          </Space>
        </div>
      </Card>
      {stale ? (
        <Alert
          type="warning"
          showIcon
          icon={<SyncOutlined />}
          style={{ marginBottom: 18 }}
          message={`Rule pack ${published} is published. This deal is pinned to ${deal.ruleVersion}.`}
          description="Findings were produced against the earlier version. Re-run to see which findings change; both versions stay in the audit trail."
          action={
            <Space direction="vertical">
              <PermButton cap="runScenarios" denied="Your role cannot re-run rule checks" type="primary" onClick={() => rerun(deal.id)} data-tour="rerun-btn">
                Re-run against {published}
              </PermButton>
              <Button size="small" type="link" onClick={() => navigate('/admin/rules')}>What changed in the rule pack</Button>
            </Space>
          }
        />
      ) : null}
      <Outlet />
    </div>
  );
}

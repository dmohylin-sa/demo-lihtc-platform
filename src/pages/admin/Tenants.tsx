// Tenants & roles: sponsor tenants, invited users with MFA, and the permission matrix at deal, document,
// field and platform level that `can()` enforces across the demo.
import { Card, Col, Row, Space, Table, Tag, Tooltip } from 'antd';
import { CheckCircleFilled, LockOutlined, SafetyCertificateOutlined, TeamOutlined, ApartmentOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { CAPABILITY_LABELS, PERMISSIONS, PERSONAS, TENANTS, TENANT_USERS, type Capability } from '../../data/people';
import { OTHER_TENANT_DEALS } from '../../data/deals';
import { PageHeader } from '../../components/ui';

const LEVEL_COLOR: Record<string, string> = { Deal: 'purple', Document: 'gold', Field: 'magenta', Platform: 'default' };

export default function Tenants() {
  const caps = Object.keys(CAPABILITY_LABELS) as Capability[];
  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Admin console · Everstead staff"
        title="Tenants, users and roles"
        desc="Each sponsor organisation is a tenant. Isolation is logical, enforced on every query and storage path, and proven by cross-deal and cross-tenant leakage tests (acceptance test AT-6)."
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {TENANTS.map((t) => (
          <Col xs={24} md={8} key={t.id}>
            <Card styles={{ body: { padding: 18 } }}>
              <Space align="start" size={12}>
                <span className="icon-chip" style={{ background: t.kind === 'Sponsor' ? 'var(--plum-tint)' : 'var(--gold-fill)', color: 'var(--plum)' }}>
                  {t.kind === 'Sponsor' ? <TeamOutlined /> : <SafetyCertificateOutlined />}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16 }}>{t.name}</div>
                  <Space size={6} wrap style={{ margin: '6px 0' }}>
                    <Tag color={t.kind === 'Sponsor' ? 'purple' : 'gold'}>{t.kind}</Tag>
                    <Tag>{t.users} users</Tag>
                    <Tag>{t.deals} deals</Tag>
                    <Tag className="mono">{t.region}</Tag>
                  </Space>
                  <div style={{ fontSize: 12.5, color: 'var(--secondary)' }}>{t.isolation}</div>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="Permission matrix" style={{ marginBottom: 16 }} data-tour="perm-matrix"
        extra={<span className="muted" style={{ fontSize: 12 }}>Enforced live: switch persona in the header to see buttons lock and fields mask</span>}>
        <div style={{ overflowX: 'auto' }}>
          <table className="sheet" style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 10px' }}>Capability</th>
                <th style={{ padding: '8px 10px' }}>Level</th>
                {PERSONAS.map((p) => (
                  <th key={p.id} style={{ padding: '8px 10px', minWidth: 120 }}>
                    <div style={{ color: 'var(--ink)', fontWeight: 700 }}>{p.title}</div>
                    <div style={{ fontWeight: 500, fontSize: 11 }}>{p.access}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {caps.map((c) => (
                <tr key={c}>
                  <td style={{ padding: '8px 10px' }} className="label">{CAPABILITY_LABELS[c].label}</td>
                  <td style={{ textAlign: 'center' }}><Tag color={LEVEL_COLOR[CAPABILITY_LABELS[c].level]} style={{ margin: 0 }}>{CAPABILITY_LABELS[c].level}</Tag></td>
                  {PERSONAS.map((p) => (
                    <td key={p.id} style={{ textAlign: 'center' }}>
                      {PERMISSIONS[p.id].includes(c)
                        ? <CheckCircleFilled style={{ color: '#389E0D', fontSize: 16 }} />
                        : <Tooltip title={`${p.title} cannot: ${CAPABILITY_LABELS[c].label.toLowerCase()}`}><LockOutlined style={{ color: 'var(--plum-tint-3)', fontSize: 15 }} /></Tooltip>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ fontSize: 12, margin: '10px 0 0' }}>
          Decision recording is further limited to the owner role named in the decision register; gate authorization belongs to the Principal alone.
        </p>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card title="Invited users" styles={{ body: { padding: 0 } }}>
            <Table
              rowKey="email"
              size="middle"
              pagination={false}
              dataSource={TENANT_USERS}
              columns={[
                { title: 'User', render: (_, u) => <span><strong>{u.name}</strong><br /><span className="muted mono">{u.email}</span></span> },
                { title: 'Tenant', dataIndex: 'tenant' },
                { title: 'Role', dataIndex: 'role' },
                { title: 'Access', dataIndex: 'access', render: (v: string) => <Tag color={v === 'Owner' ? 'gold' : v === 'Everstead staff' ? 'purple' : 'default'}>{v}</Tag> },
                { title: 'MFA', dataIndex: 'mfa', align: 'center', render: (v: boolean) => (v ? <Tag color="success" icon={<SafetyCertificateOutlined />}>On</Tag> : <Tag color="error">Off</Tag>) },
                { title: 'Last seen', dataIndex: 'lastSeen' },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title={<span><EyeInvisibleOutlined /> Harbor & Hill deals - invisible to Northbank users</span>}>
            <Space direction="vertical" style={{ width: '100%' }} size={10}>
              {OTHER_TENANT_DEALS.map((d) => (
                <div key={d.id} className="panel" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <ApartmentOutlined style={{ color: 'var(--plum)' }} />
                  <div>
                    <strong>{d.name}</strong>
                    <div className="muted" style={{ fontSize: 12 }}>{d.tenant} · {d.projectType} · {d.units} units</div>
                  </div>
                </div>
              ))}
              <div className="callout-gold" style={{ fontSize: 12.5 }}>
                Leakage tests run a query against one tenant's deal and assert that nothing from another deal or tenant comes back - in search, retrieval or exports.
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

// Application shell: plum header (logo, STAGING badge, scenarios, tour, persona switcher), contextual sider,
// footer with the sample-data label and the Geniusee credit. Hosts the global viewer, modal and tour.
import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { App as AntdApp, Avatar, Button, Drawer, Dropdown, Layout, Menu, Space, Tag, Tooltip, Typography } from 'antd';
import {
  AppstoreOutlined, ApartmentOutlined, AuditOutlined, BranchesOutlined, CalculatorOutlined, CheckSquareOutlined,
  CloudUploadOutlined, CompassOutlined, DashboardOutlined, DatabaseOutlined, ExperimentOutlined, ExportOutlined,
  FileProtectOutlined, FileSearchOutlined, FlagOutlined, LockOutlined, LogoutOutlined, NodeIndexOutlined,
  PlayCircleOutlined, ReloadOutlined, SafetyCertificateOutlined, TeamOutlined, ThunderboltOutlined, UnorderedListOutlined,
  CheckCircleFilled, RobotOutlined,
} from '@ant-design/icons';
import Logo from '../brand/Logo';
import { PERSONAS, personaById } from '../data/people';
import { useDemo, type ScenarioId } from '../store/demoStore';
import { DocViewerDrawer } from '../components/viewer';
import WhatChangedModal from '../components/WhatChangedModal';
import TourHost from '../tour/TourHost';
import type { PersonaId } from '../data/types';

const { Header, Sider, Content, Footer } = Layout;

export const DEAL_SECTIONS = [
  { key: 'overview', label: 'Overview', icon: <DashboardOutlined /> },
  { key: 'process', label: 'Process navigator', icon: <ApartmentOutlined /> },
  { key: 'documents', label: 'Documents', icon: <CloudUploadOutlined /> },
  { key: 'extraction', label: 'Cited extraction', icon: <FileSearchOutlined /> },
  { key: 'underwriting', label: 'Underwriting', icon: <CalculatorOutlined /> },
  { key: 'findings', label: 'Findings & risks', icon: <FlagOutlined /> },
  { key: 'decisions', label: 'Decisions & gate G1', icon: <BranchesOutlined /> },
  { key: 'report', label: 'Readiness report', icon: <FileProtectOutlined /> },
  { key: 'evidence', label: 'Source map', icon: <NodeIndexOutlined /> },
  { key: 'audit', label: 'Audit trail', icon: <AuditOutlined /> },
];

const ADMIN_SECTIONS = [
  { key: 'tenants', label: 'Tenants & roles', icon: <TeamOutlined /> },
  { key: 'tree', label: 'Process tree versions', icon: <ApartmentOutlined /> },
  { key: 'rules', label: 'Rule packs', icon: <SafetyCertificateOutlined /> },
  { key: 'jobs', label: 'Processing jobs', icon: <UnorderedListOutlined /> },
  { key: 'model-ops', label: 'Model operations', icon: <RobotOutlined /> },
  { key: 'audit', label: 'Audit (all tenants)', icon: <AuditOutlined /> },
  { key: 'export', label: 'Data export', icon: <ExportOutlined /> },
];

export const SCENARIOS: { id: ScenarioId; title: string; rfp: string; body: string; persona: PersonaId }[] = [
  { id: 's1', title: 'A revised underwriting model changes earlier findings', rfp: 'RFP §06 walkthrough 1', persona: 'analyst', body: 'Sponsor Pro Forma v3 supersedes v2. Dependent findings are invalidated, recalculated by the deterministic engine and shown as a before / after diff.' },
  { id: 's2', title: 'A lender email conflicts with a cited source', rfp: 'RFP §06 walkthrough 2', persona: 'dealLead', body: 'The lender writes that a 12-month Phase I is fine; the executed term sheet says 6 months. Source ranking applies and the conflict goes to a person.' },
  { id: 's3', title: 'A new HCR term sheet arrives mid-deal', rfp: 'RFP §06 walkthrough 3', persona: 'admin', body: 'Everstead publishes rule pack 2026.2 without a rebuild. Deals in flight stay pinned and are offered a re-run with a diff.' },
  { id: 's4', title: 'An executed document is silent on an extraction slot', rfp: 'RFP §06 walkthrough 4', persona: 'dealLead', body: "Linden Court's executed HAP contract is silent on the rent adjustment method (X0139). The slot is flagged, never defaulted." },
];

function PersonaSwitcher() {
  const persona = useDemo((s) => s.persona);
  const setPersona = useDemo((s) => s.setPersona);
  const resetDemo = useDemo((s) => s.resetDemo);
  const logout = useDemo((s) => s.logout);
  const navigate = useNavigate();
  const { modal, message } = AntdApp.useApp();
  const p = personaById(persona);
  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items: [
          { type: 'group', label: 'View the platform as', children: PERSONAS.map((x) => ({
            key: x.id,
            label: (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '2px 0', minWidth: 290 }}>
                <span className="avatar-initials" style={{ width: 32, height: 32 }}>{x.initials}</span>
                <span style={{ lineHeight: 1.25 }}>
                  <strong>{x.name}</strong> {x.id === persona ? <CheckCircleFilled style={{ color: 'var(--plum)' }} /> : null}
                  <br /><span style={{ fontSize: 12, color: 'var(--secondary)' }}>{x.title} · {x.access}</span>
                </span>
              </div>
            ),
          })) },
          { type: 'divider' },
          { key: 'reset', icon: <ReloadOutlined />, label: 'Reset demo data' },
          { key: 'logout', icon: <LogoutOutlined />, label: 'Sign out' },
        ],
        onClick: ({ key }) => {
          if (key === 'reset') {
            modal.confirm({ title: 'Reset the demo?', content: 'Decisions, scenarios, sign-offs and audit events from this session are cleared.', okText: 'Reset', onOk: () => { resetDemo(); message.success('Demo data reset'); navigate('/deals'); } });
          } else if (key === 'logout') {
            logout(); navigate('/login');
          } else {
            setPersona(key as PersonaId);
            message.info(`Now viewing as ${personaById(key as PersonaId).name} · ${personaById(key as PersonaId).title}`);
          }
        },
      }}
    >
      <div data-tour="persona" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.08)' }}>
        <Avatar style={{ background: 'var(--gold)', color: 'var(--ink)', fontWeight: 700 }}>{p.initials}</Avatar>
        <div style={{ lineHeight: 1.15, color: '#fff' }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
          <div style={{ fontSize: 11.5, opacity: 0.78 }}>{p.title}</div>
        </div>
      </div>
    </Dropdown>
  );
}

function ScenarioDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ran = useDemo((s) => s.scenarios);
  const run = useDemo((s) => s.runScenario);
  const persona = useDemo((s) => s.persona);
  const setPersona = useDemo((s) => s.setPersona);
  return (
    <Drawer open={open} onClose={onClose} width={520} title={<span><span className="eyebrow" style={{ display: 'block' }}>RFP response section 06</span>Walkthrough scenarios</span>}>
      <Typography.Paragraph type="secondary">
        The four situations the RFP asks bidders to walk through. Each one changes the live demo state and ends on a "What changed" view.
      </Typography.Paragraph>
      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        {SCENARIOS.map((s, i) => (
          <div key={s.id} className="panel" style={{ background: ran[s.id] ? '#F0F8F2' : 'var(--panel)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span className="eyebrow">{s.rfp}</span>
              {ran[s.id] ? <Tag color="success" icon={<CheckCircleFilled />}>Ran</Tag> : null}
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15.5, margin: '4px 0 6px' }}>{i + 1}. {s.title}</div>
            <div style={{ color: 'var(--body)', fontSize: 13.5, marginBottom: 10 }}>{s.body}</div>
            <Button
              type={ran[s.id] ? 'default' : 'primary'}
              icon={<PlayCircleOutlined />}
              disabled={ran[s.id]}
              onClick={() => { if (persona !== s.persona) setPersona(s.persona); run(s.id); onClose(); }}
            >
              {ran[s.id] ? 'Already run - reset the demo to replay' : `Run as ${personaById(s.persona).title}`}
            </Button>
          </div>
        ))}
      </Space>
    </Drawer>
  );
}

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const deals = useDemo((s) => s.deals);
  const persona = useDemo((s) => s.persona);
  const setTour = useDemo((s) => s.setTour);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const dealId = params.dealId ?? 'harlow';
  const deal = deals.find((d) => d.id === dealId) ?? deals[0];
  const isAdmin = persona === 'admin';

  const selected = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith('/deals/')) return [`deal:${p.split('/')[3] ?? 'overview'}`];
    if (p.startsWith('/admin/')) return [`admin:${p.split('/')[2]}`];
    return [p];
  }, [location.pathname]);

  const items = [
    { type: 'group' as const, label: 'Workspace', children: [{ key: '/deals', icon: <AppstoreOutlined />, label: 'Portfolio' }] },
    {
      type: 'group' as const,
      label: deal.name,
      children: DEAL_SECTIONS.map((s) => ({ key: `deal:${s.key}`, icon: s.icon, label: s.label })),
    },
    { type: 'group' as const, label: 'Release 1', children: [{ key: '/acceptance', icon: <ExperimentOutlined />, label: 'Acceptance tests' }] },
    {
      type: 'group' as const,
      label: (<span>Admin console {isAdmin ? null : <Tooltip title="Everstead staff only"><LockOutlined /></Tooltip>}</span>),
      children: ADMIN_SECTIONS.map((s) => ({ key: `admin:${s.key}`, icon: s.icon, label: s.label })),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="app-header">
        <span style={{ cursor: 'pointer', display: 'inline-flex' }} onClick={() => navigate('/deals')}><Logo /></span>
        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12.5, lineHeight: 1.2 }} className="no-print header-sub">
          Release 1 · Phase 1 9% LIHTC intake → underwriting readiness · NY HCR
        </span>
        <div style={{ flex: 1 }} />
        <Tooltip title="Staging is separate from production. Demo sessions run on staging, with tenant isolation, roles and the audit log already in place.">
          <span className="env-badge">Staging</span>
        </Tooltip>
        <Button className="header-btn" icon={<ThunderboltOutlined />} onClick={() => setScenarioOpen(true)} data-tour="scenarios-btn">Walkthrough scenarios</Button>
        <Button className="header-btn" icon={<CompassOutlined />} onClick={() => setTour(true, 0)}>Guided tour</Button>
        <PersonaSwitcher />
      </Header>
      <Layout>
        <Sider width={248} theme="light" className="no-print" style={{ position: 'sticky', top: 63, height: 'calc(100vh - 63px)', overflow: 'auto' }}>
          <Menu
            mode="inline"
            selectedKeys={selected}
            items={items}
            style={{ borderInlineEnd: 0, paddingTop: 8, paddingBottom: 16 }}
            onClick={({ key }) => {
              if (key.startsWith('deal:')) navigate(`/deals/${deal.id}/${key.slice(5)}`);
              else if (key.startsWith('admin:')) navigate(`/admin/${key.slice(6)}`);
              else navigate(key);
            }}
          />
        </Sider>
        <Layout>
          <Content style={{ padding: '24px 28px 32px' }}>
            <div style={{ maxWidth: 1320, margin: '0 auto' }}>
              <Outlet />
            </div>
          </Content>
          <Footer className="app-footer">
            <span><DatabaseOutlined /> Sample data - fictional deals, illustrative figures</span>
            <span className="credit">Prototype by Geniusee</span>
            <span><CheckSquareOutlined /> From plan to place</span>
          </Footer>
        </Layout>
      </Layout>
      <DocViewerDrawer />
      <WhatChangedModal />
      <ScenarioDrawer open={scenarioOpen} onClose={() => setScenarioOpen(false)} />
      <TourHost />
    </Layout>
  );
}

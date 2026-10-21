// Admin console guard: Everstead staff only. Other roles see a 403 that explains why.
import { Outlet, useNavigate } from 'react-router-dom';
import { Button, Result } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useDemo } from '../../store/demoStore';
import { personaById } from '../../data/people';

export default function AdminGuard() {
  const persona = useDemo((s) => s.persona);
  const setPersona = useDemo((s) => s.setPersona);
  const navigate = useNavigate();
  if (persona === 'admin') return <Outlet />;
  const p = personaById(persona);
  return (
    <Result
      status="403"
      icon={<LockOutlined style={{ fontSize: 64, color: 'var(--plum)' }} />}
      title="The admin console is for Everstead staff"
      subTitle={`${p.name} is signed in as ${p.title} (${p.access}) in the Northbank Housing Partners tenant. Publishing process-tree and rule-pack versions, managing tenants and reading other tenants' audit logs need the Everstead staff role.`}
      extra={[
        <Button key="switch" type="primary" onClick={() => setPersona('admin')}>Switch to Everstead platform admin</Button>,
        <Button key="back" onClick={() => navigate('/deals')}>Back to portfolio</Button>,
      ]}
    />
  );
}

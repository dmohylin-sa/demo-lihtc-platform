// Permission-aware controls. Denied actions stay visible but disabled, with the reason - access control
// is something the client should see working, not something hidden.
import type { ReactNode } from 'react';
import { Button, Tooltip, type ButtonProps } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import type { Capability } from '../data/people';
import { useCan } from '../store/demoStore';
import { Restricted } from './ui';

export function PermButton({ cap, denied, allowed: forced, children, ...rest }: ButtonProps & { cap: Capability; denied: string; allowed?: boolean }) {
  const has = useCan(cap);
  const ok = forced ?? has;
  if (ok) return <Button {...rest}>{children}</Button>;
  return (
    <Tooltip title={<span><LockOutlined /> {denied}</span>}>
      <Button {...rest} disabled icon={<LockOutlined />} onClick={undefined}>{children}</Button>
    </Tooltip>
  );
}

export function Sensitive({ children }: { children: ReactNode }) {
  const ok = useCan('viewSensitiveFields');
  return ok ? <>{children}</> : <Restricted />;
}

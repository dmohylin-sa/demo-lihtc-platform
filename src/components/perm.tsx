// Permission-aware controls. Denied actions stay visible but disabled, with the reason - access control
// is something the client should see working, not something hidden.
import type { ReactNode } from 'react';
import { Button, Tooltip, type ButtonProps } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import type { Capability } from '../data/people';
import type { CapId } from '../data/currentState';
import { useCan } from '../store/demoStore';
import { Restricted } from './ui';
import { GatedButton, capDims, useToday } from './today';

// `feature` names the platform capability behind the action: in the Today lens a feature the current platform
// lacks is disabled, saying what exists today. Roles are not enforced in the Today lens, so owner checks lift too.
export function PermButton({ cap, denied, allowed: forced, feature, children, ...rest }: ButtonProps & { cap: Capability; denied: string; allowed?: boolean; feature?: CapId }) {
  const has = useCan(cap);
  const today = useToday();
  if (today && feature && capDims(feature)) return <GatedButton feature={feature} {...rest}>{children}</GatedButton>;
  const ok = today || (forced ?? has);
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

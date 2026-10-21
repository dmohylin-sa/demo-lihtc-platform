// All-tenants audit view for Everstead staff. Sponsor users only ever see their own tenant's events.
import { Alert } from 'antd';
import { useDemo } from '../../store/demoStore';
import { PageHeader } from '../../components/ui';
import AuditWorkspace from '../../components/AuditTable';

export default function AdminAudit() {
  const audit = useDemo((s) => s.audit);
  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Admin console"
        title="Audit trail - all tenants"
        desc="Platform-wide log: sign-ins, version publishes, deal actions and decisions across every tenant, hash-chained and retrievable."
      />
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Everstead staff view"
        description="Sponsor users see only their own tenant's events, and only for deals they can access. This view exists for platform operations and is itself logged."
      />
      <AuditWorkspace events={audit} showTenant scopeLabel="Platform audit trail" fileStem="audit-all-tenants" />
    </div>
  );
}

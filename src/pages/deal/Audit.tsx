// Deal audit trail: every action, finding, calculation and decision on this deal, with actor and basis,
// hash-chained and exportable.
import { useMemo } from 'react';
import { useDemo } from '../../store/demoStore';
import { useDeal } from '../../store/hooks';
import { PageHeader } from '../../components/ui';
import AuditWorkspace from '../../components/AuditTable';

export default function Audit() {
  const deal = useDeal();
  const audit = useDemo((s) => s.audit);
  const events = useMemo(() => audit.filter((e) => e.dealId === deal.id), [audit, deal.id]);
  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Audit trail"
        title="Tamper-evident audit trail"
        cap="audit.trail"
        desc="Append-only: every action, finding, calculation and decision is logged with actor, time and basis, and chained by hash so any edit is detectable."
      />
      <AuditWorkspace events={events} scopeLabel={`${deal.name} audit trail`} fileStem={`audit-${deal.id}`} />
    </div>
  );
}

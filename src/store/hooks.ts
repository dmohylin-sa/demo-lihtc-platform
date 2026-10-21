// Route-aware hooks for deal pages.
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useDemo } from './demoStore';
import { dealDocs, dealFindings, dealMetrics, nextActions } from './selectors';

export const useDealId = () => useParams().dealId ?? 'harlow';

export function useDeal() {
  const id = useDealId();
  const deals = useDemo((s) => s.deals);
  return deals.find((d) => d.id === id) ?? deals[0];
}

export function useDealMetrics(dealId: string) {
  const nodeStatus = useDemo((s) => s.nodeStatus);
  const findings = useDemo((s) => s.findings);
  const decisions = useDemo((s) => s.decisions);
  return useMemo(() => dealMetrics({ nodeStatus, findings, decisions }, dealId), [nodeStatus, findings, decisions, dealId]);
}

export function useNextActions(dealId: string) {
  const findings = useDemo((s) => s.findings);
  const decisions = useDemo((s) => s.decisions);
  return useMemo(() => nextActions({ findings, decisions }, dealId), [findings, decisions, dealId]);
}

export function useDealFindings(dealId: string) {
  const findings = useDemo((s) => s.findings);
  return useMemo(() => dealFindings({ findings }, dealId), [findings, dealId]);
}

export function useDealDocs(dealId: string) {
  const upload = useDemo((s) => s.upload);
  const extraDocs = useDemo((s) => s.extraDocs);
  return useMemo(() => dealDocs({ upload, extraDocs }, dealId), [upload, extraDocs, dealId]);
}

export function useDealFields(dealId: string) {
  const fields = useDemo((s) => s.fields);
  return useMemo(() => fields.filter((f) => f.dealId === dealId), [fields, dealId]);
}

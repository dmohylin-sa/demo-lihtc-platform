import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useDemo } from './store/demoStore';
import { personaById } from './data/people';
import AppShell from './layout/AppShell';
import DealLayout from './layout/DealLayout';
import Login from './pages/Login';
import Portfolio from './pages/Portfolio';
import Overview from './pages/deal/Overview';
import Process from './pages/deal/Process';
import Documents from './pages/deal/Documents';
import Extraction from './pages/deal/Extraction';
import Underwriting from './pages/deal/Underwriting';
import Findings from './pages/deal/Findings';
import Decisions from './pages/deal/Decisions';
import Report from './pages/deal/Report';
import Evidence from './pages/deal/Evidence';
import Audit from './pages/deal/Audit';
import Acceptance from './pages/Acceptance';
import AdminGuard from './pages/admin/AdminGuard';
import Tenants from './pages/admin/Tenants';
import TreeVersions from './pages/admin/TreeVersions';
import RulePacks from './pages/admin/RulePacks';
import Jobs from './pages/admin/Jobs';
import ModelOps from './pages/admin/ModelOps';
import AdminAudit from './pages/admin/AdminAudit';
import DataExport from './pages/admin/DataExport';
import AgentRuns from './pages/deal/AgentRuns';
import CurrentState from './pages/CurrentState';
import { TodayPage } from './components/today';

function RequireLogin({ children }: { children: ReactNode }) {
  const loggedIn = useDemo((s) => s.loggedIn);
  return loggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}

function Home() {
  const persona = useDemo((s) => s.persona);
  return <Navigate to={personaById(persona).home} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireLogin><AppShell /></RequireLogin>}>
        <Route index element={<Home />} />
        <Route path="deals" element={<Portfolio />} />
        <Route path="deals/:dealId" element={<DealLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="process" element={<TodayPage cap="lifecycle.processTree"><Process /></TodayPage>} />
          <Route path="documents" element={<Documents />} />
          <Route path="runs" element={<AgentRuns />} />
          <Route path="extraction" element={<TodayPage cap="extraction.fields" also={['extraction.confidence', 'extraction.silentConflict', 'review.bulk']}><Extraction /></TodayPage>} />
          <Route path="underwriting" element={<Underwriting />} />
          <Route path="findings" element={<Findings />} />
          <Route path="decisions" element={<TodayPage cap="lifecycle.decisions" also={['access.rbac']}><Decisions /></TodayPage>} />
          <Route path="report" element={<Report />} />
          <Route path="evidence" element={<Evidence />} />
          <Route path="audit" element={<Audit />} />
        </Route>
        <Route path="acceptance" element={<Acceptance />} />
        <Route path="current-state" element={<CurrentState />} />
        <Route path="admin" element={<AdminGuard />}>
          <Route index element={<Navigate to="rules" replace />} />
          <Route path="tenants" element={<TodayPage cap="access.rbac" also={['tenancy.isolation', 'access.mfa']}><Tenants /></TodayPage>} />
          <Route path="tree" element={<TodayPage cap="lifecycle.treeVersions"><TreeVersions /></TodayPage>} />
          <Route path="rules" element={<RulePacks />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="model-ops" element={<ModelOps />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="export" element={<TodayPage cap="data.export"><DataExport /></TodayPage>} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

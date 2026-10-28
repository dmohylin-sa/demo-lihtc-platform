// Processing job monitor: upload, malware scan, OCR, classification, extraction and recalculation jobs,
// on a queue with retries for large files. One job runs live so the monitor reads as a working system. In the Today
// lens the queue holds today's agent jobs, with the dead-letter queue, and the jobs today's platform lacks are dimmed.
import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Progress, Row, Space, Table, Tag } from 'antd';
import { ClockCircleOutlined, FieldTimeOutlined, InboxOutlined, RedoOutlined, ThunderboltOutlined, WarningOutlined } from '@ant-design/icons';
import { JOBS, type Job } from '../../data/ops';
import { MetricCard, PageHeader, StatusTag } from '../../components/ui';
import { CapChip, TodayGate, useToday } from '../../components/today';
import { CAPS } from '../../data/currentState';

type JobRow = Omit<Job, 'kind' | 'status'> & { kind: string; status: Job['status'] | 'Dead-letter'; live?: boolean };
// Kinds today's platform does not run (resumable upload, malware scan, OCR): dimmed in the Today lens.
const NOT_TODAY = ['Upload', 'Malware scan', 'OCR'];
// Today's agent jobs (illustrative), newest first.
const AGENT_JOBS: JobRow[] = [
  { id: 'run-0424·015', kind: 'Agent 015', target: 'Executive summary · re-driven run', deal: 'Harlow Commons', status: 'Succeeded', attempts: 1, duration: '24 s', at: '14:33:51' },
  { id: 'run-0424·010', kind: 'Agent 010', target: 'Risk register · re-driven from the dead-letter queue', deal: 'Harlow Commons', status: 'Succeeded', attempts: 1, duration: '47 s', at: '14:32:27' },
  { id: 'run-0423·010', kind: 'Agent 010', target: 'Risk register · output failed schema re-validation; partial results of 002 and 009 saved', deal: 'Harlow Commons', status: 'Dead-letter', attempts: 3, duration: '1 min 36 s', at: '14:14:46' },
  { id: 'run-0418·009', kind: 'Agent 009', target: 'Six-gate workbook audit · retried after a timeout', deal: 'Harlow Commons', status: 'Retried', attempts: 2, duration: '2 min 51 s', at: '09:05:28' },
];

const JOB_STATUS = {
  Succeeded: { label: 'Succeeded', color: 'success' },
  Running: { label: 'Running', color: 'processing' },
  Queued: { label: 'Queued', color: 'default' },
  Retried: { label: 'Retried · succeeded', color: 'gold' },
  Failed: { label: 'Failed', color: 'error' },
  'Dead-letter': { label: 'Dead-letter queue', color: 'error' },
};

export default function Jobs() {
  // Live element: an OCR job working through a scanned appendix (local state only).
  const today = useToday();
  const [pages, setPages] = useState(3);
  const total = 28;
  useEffect(() => {
    const t = setInterval(() => setPages((p) => (p >= total ? 3 : p + 1)), 650);
    return () => clearInterval(t);
  }, []);

  const rows = useMemo<JobRow[]>(() => [
    ...(today ? AGENT_JOBS : []),
    {
      id: 'job-48230', kind: 'OCR', target: `ESA appendix - EDR radius report 011.pdf · page ${pages} of ${total}`, deal: 'Harlow Commons',
      status: pages >= total ? 'Succeeded' : 'Running', attempts: 1, duration: `${Math.round(pages * 2.9)} s`, at: 'now', live: true,
    },
    { id: 'job-48231', kind: 'Classification', target: 'ESA appendix - EDR radius report 011.pdf', deal: 'Harlow Commons', status: 'Queued', attempts: 0, duration: '-', at: 'queued' },
    ...JOBS,
  ], [pages, today]);

  const retries = JOBS.filter((j) => j.attempts > 1).length;

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Admin console · Everstead staff"
        title="Processing jobs"
        cap="reliability.retries"
        desc="Every upload, scan, OCR, classification, extraction and recalculation runs as a job on a queue with retries, so large packages and scanned documents never block the workspace."
      />
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}><MetricCard label="Jobs today" value={rows.length} sub="across 3 deals" icon={<ThunderboltOutlined />} tone="primary" /></Col>
        <Col xs={12} lg={6}><MetricCard label="Retried" value={retries} sub="succeeded on a later attempt" icon={<RedoOutlined />} /></Col>
        <Col xs={12} lg={6}>
          {today
            ? <MetricCard label="Dead-letter queue" value={1} sub="partial results saved · re-driven" icon={<InboxOutlined />} tone="danger" />
            : <MetricCard label="Failures" value={0} sub="nothing waiting on a person" icon={<WarningOutlined />} tone="success" />}
        </Col>
        <Col xs={12} lg={6}><TodayGate cap="intake.ocr"><MetricCard label="Avg. OCR page" value="2.9 s" sub="scanned pages, layout + tables" icon={<FieldTimeOutlined />} /></TodayGate></Col>
      </Row>

      <Card title="Queue" styles={{ body: { padding: 0 } }} extra={<Tag icon={<ClockCircleOutlined />} color="processing">Live</Tag>}>
        <Table
          rowKey="id"
          pagination={false}
          dataSource={rows}
          rowClassName={(r) => [r.live ? 'fade-in' : '', today && NOT_TODAY.includes(r.kind) ? 'today-row-dim' : ''].join(' ')}
          columns={[
            { title: 'Job', dataIndex: 'id', width: 110, render: (v: string) => <span className="mono">{v}</span> },
            { title: 'Kind', dataIndex: 'kind', width: 130, render: (v: string) => <Tag>{v}</Tag> },
            {
              title: 'Target', dataIndex: 'target', render: (v: string, r) => (
                <div>
                  <div style={{ fontSize: 13 }}>{v}</div>
                  {r.live && r.status === 'Running' ? <Progress percent={Math.round((pages / total) * 100)} size="small" strokeColor="#521B3A" style={{ margin: 0, maxWidth: 320 }} /> : null}
                </div>
              ),
            },
            { title: 'Deal', dataIndex: 'deal', width: 190 },
            { title: 'Status', dataIndex: 'status', width: 170, render: (v: JobRow['status']) => <StatusTag status={v} map={JOB_STATUS} /> },
            { title: 'Attempts', dataIndex: 'attempts', width: 90, align: 'center' },
            { title: 'Duration', dataIndex: 'duration', width: 110 },
            { title: 'At', dataIndex: 'at', width: 90, render: (v: string) => <span className="mono">{v}</span> },
          ]}
        />
      </Card>
      {today ? (
        <div className="callout-gold" style={{ marginTop: 12, fontSize: 13 }}>
          <CapChip cap="reliability.stuckSweep" style={{ marginRight: 6 }} />
          Today: {CAPS['reliability.retries'].today} {CAPS['reliability.stuckSweep'].today} Agent job rows are illustrative; dimmed rows are jobs today's platform does not run.
        </div>
      ) : null}
      <Space direction="vertical" size={4} style={{ marginTop: 12 }}>
        <span className="muted" style={{ fontSize: 12.5 }}>Uploads are resumable: the Harlow Commons package (2.8 GB) resumed once after a dropped connection without re-sending completed chunks.</span>
        <span className="muted" style={{ fontSize: 12.5 }}>A failed job retries with back-off; after the last attempt it surfaces here and on the deal, never silently.</span>
      </Space>
    </div>
  );
}

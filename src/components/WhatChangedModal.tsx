// "What changed" - the before/after view every change-handling scenario ends on.
import { Button, Modal, Table, Tag } from 'antd';
import { SwapRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDemo, type ChangeRow } from '../store/demoStore';

const KIND: Record<ChangeRow['kind'], { label: string; color: string }> = {
  resolved: { label: 'Resolved', color: 'success' },
  recomputed: { label: 'Recomputed', color: 'processing' },
  new: { label: 'New', color: 'purple' },
  invalidated: { label: 'Invalidated', color: 'default' },
  superseded: { label: 'Superseded', color: 'default' },
  routed: { label: 'Routed to a person', color: 'gold' },
};

export default function WhatChangedModal() {
  const wc = useDemo((s) => s.whatChanged);
  const close = useDemo((s) => s.closeWhatChanged);
  const navigate = useNavigate();
  return (
    <Modal
      open={!!wc}
      onCancel={close}
      rootClassName="wc-modal"
      width={860}
      title={<span><span className="eyebrow" style={{ display: 'block' }}>What changed</span>{wc?.title}</span>}
      footer={[
        <Button key="close" onClick={close}>Close</Button>,
        wc?.link ? (
          <Button key="go" type="primary" onClick={() => { close(); navigate(wc.link!.to); }}>{wc.link.label}</Button>
        ) : null,
      ]}
    >
      {wc ? (
        <>
          <div className="callout-gold" style={{ marginBottom: 14 }}>{wc.trigger}</div>
          <Table
            size="small"
            pagination={false}
            rowKey="label"
            dataSource={wc.rows}
            columns={[
              { title: 'Item', dataIndex: 'label', width: 280, render: (v) => <strong>{v}</strong> },
              { title: 'Before', dataIndex: 'before', render: (v) => <span style={{ color: 'var(--muted)' }}>{v}</span> },
              { title: '', width: 30, render: () => <SwapRightOutlined style={{ color: 'var(--muted)' }} /> },
              { title: 'After', dataIndex: 'after' },
              { title: 'Change', dataIndex: 'kind', width: 150, render: (k: ChangeRow['kind']) => <Tag color={KIND[k].color}>{KIND[k].label}</Tag> },
            ]}
          />
          {wc.notes.map((n) => <p key={n} style={{ margin: '10px 0 0', color: 'var(--secondary)', fontSize: 13 }}>{n}</p>)}
        </>
      ) : null}
    </Modal>
  );
}

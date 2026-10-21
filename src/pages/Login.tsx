// Sign-in: email + password, a 6-digit MFA step that fills itself in, then a persona pick.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Checkbox, Form, Input, Space, Steps, Tag } from 'antd';
import { CompassOutlined, LockOutlined, MailOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import Logo from '../brand/Logo';
import { PERSONAS, personaById } from '../data/people';
import { useDemo } from '../store/demoStore';
import type { PersonaId } from '../data/types';

export default function Login() {
  const navigate = useNavigate();
  const login = useDemo((s) => s.login);
  const setTour = useDemo((s) => s.setTour);
  const [step, setStep] = useState(0);
  const [code, setCode] = useState('');
  const [pick, setPick] = useState<PersonaId>('dealLead');

  useEffect(() => {
    if (step !== 1) return;
    const digits = '482915';
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setCode(digits.slice(0, i));
      if (i >= digits.length) {
        clearInterval(t);
        setTimeout(() => setStep(2), 450);
      }
    }, 170);
    return () => clearInterval(t);
  }, [step]);

  const enter = (tour: boolean) => {
    login(pick);
    if (tour) {
      setTour(true, 0);
      navigate('/deals');
    } else navigate(personaById(pick).home);
  };

  return (
    <div className="login-bg">
      <div className="login-art">
        <div className="slab" style={{ right: 120, top: -40, width: 180, height: 420 }} />
        <div className="slab" style={{ right: -40, top: 260, width: 140, height: 520 }} />
        <div className="slab" style={{ right: 260, top: 520, width: 120, height: 420 }} />
        <Logo size={26} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 520 }}>
          <span className="eyebrow" style={{ color: 'var(--gold)' }}>Release 1 · interactive demo</span>
          <h1 style={{ color: '#fff', fontFamily: 'var(--font-head)', fontSize: 40, lineHeight: 1.08, margin: '12px 0 14px' }}>
            Phase 1 9% LIHTC intake through underwriting readiness
          </h1>
          <div style={{ width: 120, height: 3, background: 'var(--gold)', borderRadius: 2, marginBottom: 18 }} />
          <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 16, lineHeight: 1.55 }}>
            A live deal package, the 224-node Phase 1 path, the NY HCR 9% rule pack and a source-cited readiness report.
            The platform presents; the practitioner decides.
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
          <span>Sample data - fictional deals</span>
          <span style={{ color: 'var(--gold)', fontWeight: 700 }}>From plan to place</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ width: '100%', maxWidth: 560 }}>
          <Steps size="small" current={step} style={{ marginBottom: 22 }} items={[{ title: 'Sign in' }, { title: 'MFA' }, { title: 'Choose a role' }]} />

          {step === 0 ? (
            <Card className="fade-in">
              <h2 style={{ fontFamily: 'var(--font-head)', margin: '0 0 4px' }}>Sign in to Everstead</h2>
              <p style={{ color: 'var(--secondary)', marginTop: 0 }}>Invited users only. Each sponsor organisation is its own tenant.</p>
              <Form layout="vertical" onFinish={() => setStep(1)} initialValues={{ email: 'maya.ortiz@northbank.example', password: 'demo-password' }}>
                <Form.Item label="Work email" name="email"><Input prefix={<MailOutlined />} size="large" /></Form.Item>
                <Form.Item label="Password" name="password"><Input.Password prefix={<LockOutlined />} size="large" /></Form.Item>
                <Form.Item><Checkbox defaultChecked>Keep me signed in on this device</Checkbox></Form.Item>
                <Button type="primary" htmlType="submit" size="large" block>Continue</Button>
              </Form>
            </Card>
          ) : null}

          {step === 1 ? (
            <Card className="fade-in">
              <Space align="start" size={14}>
                <span className="icon-chip" style={{ background: 'var(--plum-tint)', color: 'var(--plum)' }}><SafetyCertificateOutlined /></span>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-head)', margin: '0 0 4px' }}>Multi-factor authentication</h2>
                  <p style={{ color: 'var(--secondary)', marginTop: 0 }}>Enter the 6-digit code from your authenticator app.</p>
                </div>
              </Space>
              <Input.OTP length={6} value={code} size="large" style={{ marginTop: 10 }} />
              <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 14 }}>Managed identity service · TOTP · the code fills itself in for the demo.</p>
            </Card>
          ) : null}

          {step === 2 ? (
            <div className="fade-in">
              <h2 style={{ fontFamily: 'var(--font-head)', margin: '0 0 4px' }}>Who are you today?</h2>
              <p style={{ color: 'var(--secondary)', marginTop: 0 }}>Roles come from Everstead's persona set. You can switch at any time from the header.</p>
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                {PERSONAS.map((p) => (
                  <Card
                    key={p.id}
                    hoverable
                    onClick={() => setPick(p.id)}
                    styles={{ body: { padding: '12px 16px' } }}
                    style={{ borderColor: pick === p.id ? 'var(--plum)' : undefined, boxShadow: pick === p.id ? '0 0 0 2px var(--plum-tint-2)' : undefined }}
                  >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span className="avatar-initials">{p.initials}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <strong>{p.name}</strong>
                          <Tag style={{ margin: 0 }}>{p.title}</Tag>
                          <Tag color={p.access === 'Owner' ? 'gold' : p.access === 'Everstead staff' ? 'purple' : 'default'} style={{ margin: 0 }}>{p.access}</Tag>
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--secondary)', marginTop: 2 }}>{p.blurb}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </Space>
              <Space style={{ marginTop: 18, width: '100%' }} size={10}>
                <Button type="primary" size="large" icon={<CompassOutlined />} onClick={() => enter(true)}>Start the guided tour</Button>
                <Button size="large" onClick={() => enter(false)}>Explore on my own</Button>
              </Space>
            </div>
          ) : null}

          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, marginTop: 26 }}>Prototype by Geniusee · sample data only</p>
        </div>
      </div>
    </div>
  );
}

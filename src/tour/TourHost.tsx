// Controlled AntD Tour across routes: navigate, switch persona, run the step's action, wait for the target,
// then open. The shown step only advances once its target is on screen, so the popover never jumps.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tour } from 'antd';
import { useDemo } from '../store/demoStore';
import { TOUR_STEPS } from './steps';

export default function TourHost() {
  // useNavigate() changes identity on every route change; keep it in a ref so navigating does not re-run the step.
  const navigate = useNavigate();
  const navRef = useRef(navigate);
  navRef.current = navigate;
  const tourOpen = useDemo((s) => s.tourOpen);
  const tourStep = useDemo((s) => s.tourStep);
  const setTour = useDemo((s) => s.setTour);
  const [shown, setShown] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!tourOpen) { setReady(false); return; }
    const st = TOUR_STEPS[tourStep];
    if (!st) { setTour(false, 0); return; }
    setReady(false);
    const s = useDemo.getState();
    if (st.persona && s.persona !== st.persona) s.setPersona(st.persona);
    const here = window.location.hash.slice(1);
    if (here !== st.route) navRef.current(st.route);
    const enter = setTimeout(() => st.onEnter?.(), 200);
    let tries = 0;
    let showT: ReturnType<typeof setTimeout> | undefined;
    const poll = setInterval(() => {
      const el = document.querySelector(st.target);
      tries += 1;
      if (el || tries > 40) {
        clearInterval(poll);
        if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        showT = setTimeout(() => { setShown(tourStep); setReady(true); }, 450);
      }
    }, 120);
    return () => { clearTimeout(enter); clearInterval(poll); clearTimeout(showT); };
  }, [tourOpen, tourStep, setTour]);

  return (
    <Tour
      open={tourOpen && ready}
      current={shown}
      type="primary"
      onChange={(c) => setTour(true, c)}
      onClose={() => setTour(false)}
      onFinish={() => setTour(false, 0)}
      zIndex={1100}
      scrollIntoViewOptions={{ block: 'center' }}
      indicatorsRender={(current, total) => <span style={{ fontSize: 12, opacity: 0.85 }}>{TOUR_STEPS[current].chapter} · {current + 1} / {total}</span>}
      steps={TOUR_STEPS.map((st) => ({
        title: st.title,
        description: st.body,
        placement: st.placement,
        target: () => document.querySelector(st.target) as HTMLElement,
      }))}
    />
  );
}

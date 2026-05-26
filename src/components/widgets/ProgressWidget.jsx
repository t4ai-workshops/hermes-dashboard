import { useRef, useEffect, useState } from 'react';
import './ProgressWidget.css';

export default function ProgressWidget({ value, max = 100, label, warning, critical }) {
  const canvasRef = useRef(null);
  const [animated, setAnimated] = useState(0);
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const pct = Math.round(ratio * 100);

  const status = critical != null && value >= critical ? 'crit'
    : warning != null && value >= warning ? 'warn'
    : 'ok';

  useEffect(() => {
    const target = ratio;
    let start = 0;
    const duration = 600;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setAnimated(start + (target - start) * eased);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [ratio]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.4;
    const lineW = size * 0.08;

    ctx.clearRect(0, 0, size, size);

    // Background ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = lineW;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Progress arc
    const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    if (status === 'crit') {
      grad.addColorStop(0, '#dc2626');
      grad.addColorStop(1, '#ef4444');
    } else if (status === 'warn') {
      grad.addColorStop(0, '#d97706');
      grad.addColorStop(1, '#fbbf24');
    } else {
      grad.addColorStop(0, '#16a34a');
      grad.addColorStop(1, '#4ade80');
    }

    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + animated * Math.PI * 2);
    ctx.strokeStyle = grad;
    ctx.lineWidth = lineW;
    ctx.lineCap = 'round';
    ctx.shadowColor = status === 'crit' ? 'rgba(239,68,68,0.4)' : status === 'warn' ? 'rgba(251,191,36,0.4)' : 'rgba(74,222,128,0.4)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }, [animated, status]);

  return (
    <div className={`progress-widget progress-${status}`}>
      <canvas ref={canvasRef} width={120} height={120} aria-label={`Progress: ${label} — ${pct}%`} />
      <div className="progress-value">{pct}%</div>
      <div className="progress-label">{label}</div>
    </div>
  );
}

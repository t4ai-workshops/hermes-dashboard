import { useRef, useEffect } from 'react';
import './GaugeWidget.css';

export default function GaugeWidget({ value, min = 0, max = 100, label, warning, critical, suffix = '' }) {
  const canvasRef = useRef(null);
  const clamped = Math.min(max, Math.max(min, value));

  const status = critical != null && value >= critical ? 'crit'
    : warning != null && value >= warning ? 'warn'
    : 'ok';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h * 0.72;
    const radius = w * 0.38;

    ctx.clearRect(0, 0, w, h);

    // Background arc
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI, 0);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = w * 0.08;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Value arc with gradient
    const ratio = (clamped - min) / (max - min);
    const angle = Math.PI + ratio * Math.PI;

    const grad = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
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
    ctx.arc(cx, cy, radius, Math.PI, angle);
    ctx.strokeStyle = grad;
    ctx.lineWidth = w * 0.08;
    ctx.lineCap = 'round';
    ctx.shadowColor = status === 'crit' ? 'rgba(239,68,68,0.4)' : status === 'warn' ? 'rgba(251,191,36,0.4)' : 'rgba(74,222,128,0.4)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Warning marker
    if (warning != null) {
      const wAngle = Math.PI + ((warning - min) / (max - min)) * Math.PI;
      const wx = cx + Math.cos(wAngle) * (radius + 6);
      const wy = cy + Math.sin(wAngle) * (radius + 6);
      ctx.beginPath();
      ctx.arc(wx, wy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
    }

    // Critical marker
    if (critical != null) {
      const cAngle = Math.PI + ((critical - min) / (max - min)) * Math.PI;
      const cx2 = cx + Math.cos(cAngle) * (radius + 6);
      const cy2 = cy + Math.sin(cAngle) * (radius + 6);
      ctx.beginPath();
      ctx.arc(cx2, cy2, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    }
  }, [clamped, min, max, status, warning, critical]);

  return (
    <div className={`gauge-widget gauge-${status}`}>
      <canvas
        ref={canvasRef}
        width={180}
        height={140}
        aria-label={`Gauge: ${label} — ${clamped}${suffix}`}
      />
      <div className="gauge-value">{clamped}{suffix}</div>
      <div className="gauge-label">{label}</div>
      <div className={`gauge-status-dot status-${status}`} />
    </div>
  );
}

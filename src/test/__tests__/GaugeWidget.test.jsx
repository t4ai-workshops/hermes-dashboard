import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GaugeWidget from '../../components/widgets/GaugeWidget';

// Mock canvas context
const mockCtx = {
  beginPath: vi.fn(),
  arc: vi.fn(),
  stroke: vi.fn(),
  clearRect: vi.fn(),
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  fill: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  measureText: vi.fn(() => ({ width: 50 })),
  fillText: vi.fn(),
  font: '',
  textAlign: '',
  textBaseline: '',
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 0,
  lineCap: '',
  shadowColor: '',
  shadowBlur: 0,
};

HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx);
Object.defineProperty(HTMLCanvasElement.prototype, 'width', { value: 200, writable: true });
Object.defineProperty(HTMLCanvasElement.prototype, 'height', { value: 200, writable: true });

describe('GaugeWidget', () => {
  it('renders a canvas element', () => {
    const { container } = render(<GaugeWidget value={50} min={0} max={100} label="CPU" />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('renders the label text', () => {
    render(<GaugeWidget value={50} min={0} max={100} label="CPU Load" />);
    expect(screen.getByText('CPU Load')).toBeInTheDocument();
  });

  it('renders the formatted value', () => {
    render(<GaugeWidget value={75} min={0} max={100} label="Temp" suffix="°C" />);
    expect(screen.getByText('75°C')).toBeInTheDocument();
  });

  it('shows "ok" status dot when value is below warning', () => {
    const { container } = render(
      <GaugeWidget value={60} min={0} max={100} label="CPU" warning={80} critical={95} />
    );
    const dot = container.querySelector('.gauge-status-dot');
    expect(dot).toHaveClass('status-ok');
  });

  it('shows "warn" status dot when value exceeds warning', () => {
    const { container } = render(
      <GaugeWidget value={85} min={0} max={100} label="CPU" warning={80} critical={95} />
    );
    const dot = container.querySelector('.gauge-status-dot');
    expect(dot).toHaveClass('status-warn');
  });

  it('shows "crit" status dot when value exceeds critical', () => {
    const { container } = render(
      <GaugeWidget value={97} min={0} max={100} label="CPU" warning={80} critical={95} />
    );
    const dot = container.querySelector('.gauge-status-dot');
    expect(dot).toHaveClass('status-crit');
  });

  it('clamps the display value between min and max', () => {
    render(<GaugeWidget value={150} min={0} max={100} label="Over" />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('includes an aria-label for accessibility', () => {
    const { container } = render(
      <GaugeWidget value={50} min={0} max={100} label="CPU" />
    );
    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveAttribute('aria-label', 'Gauge: CPU — 50');
  });
});

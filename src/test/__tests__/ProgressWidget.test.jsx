import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressWidget from '../../components/widgets/ProgressWidget';

const mockCtx = {
  beginPath: vi.fn(),
  arc: vi.fn(),
  stroke: vi.fn(),
  clearRect: vi.fn(),
  fill: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
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
  scale: vi.fn(),
};

HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx);
Object.defineProperty(HTMLCanvasElement.prototype, 'width', { value: 120, writable: true });
Object.defineProperty(HTMLCanvasElement.prototype, 'height', { value: 120, writable: true });

describe('ProgressWidget', () => {
  it('renders a canvas element', () => {
    const { container } = render(<ProgressWidget value={50} max={100} label="Disk" />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders the percentage text', () => {
    render(<ProgressWidget value={75} max={100} label="Storage" />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders the label', () => {
    render(<ProgressWidget value={30} max={100} label="Memory" />);
    expect(screen.getByText('Memory')).toBeInTheDocument();
  });

  it('shows ok status for value below warning', () => {
    const { container } = render(
      <ProgressWidget value={60} max={100} label="Disk" warning={80} critical={95} />
    );
    expect(container.querySelector('.progress-ok')).toBeInTheDocument();
  });

  it('shows warn status for value above warning', () => {
    const { container } = render(
      <ProgressWidget value={85} max={100} label="Disk" warning={80} critical={95} />
    );
    expect(container.querySelector('.progress-warn')).toBeInTheDocument();
  });

  it('shows crit status for value above critical', () => {
    const { container } = render(
      <ProgressWidget value={96} max={100} label="Disk" warning={80} critical={95} />
    );
    expect(container.querySelector('.progress-crit')).toBeInTheDocument();
  });

  it('handles max of 0 gracefully', () => {
    render(<ProgressWidget value={0} max={0} label="Empty" />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});

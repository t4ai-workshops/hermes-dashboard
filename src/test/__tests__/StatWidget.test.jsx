import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatWidget from '../../components/widgets/StatWidget';

describe('StatWidget', () => {
  it('renders the value and label', () => {
    render(<StatWidget value={42} label="CPU Temp" />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('CPU Temp')).toBeInTheDocument();
  });

  it('renders a positive delta with up arrow and green color', () => {
    render(<StatWidget value={100} label="Active Jobs" delta={5} />);
    const delta = screen.getByText('▲ 5%');
    expect(delta).toBeInTheDocument();
    expect(delta).toHaveClass('delta-positive');
  });

  it('renders a negative delta with down arrow and red color', () => {
    render(<StatWidget value={50} label="Memory" delta={-10} />);
    const delta = screen.getByText('▼ 10%');
    expect(delta).toBeInTheDocument();
    expect(delta).toHaveClass('delta-negative');
  });

  it('does not render delta when delta prop is null/undefined', () => {
    const { container } = render(<StatWidget value={75} label="Uptime" />);
    expect(container.querySelector('.stat-delta')).toBeNull();
  });

  it('renders delta as zero with no arrow when delta is 0', () => {
    render(<StatWidget value={50} label="Stable" delta={0} />);
    const delta = screen.getByText('0%');
    expect(delta).toBeInTheDocument();
    expect(delta).toHaveClass('delta-neutral');
  });

  it('applies warning class when value exceeds warning threshold', () => {
    const { container } = render(
      <StatWidget value={85} label="CPU" warning={80} critical={95} />
    );
    expect(container.firstChild).toHaveClass('stat-warning');
  });

  it('applies critical class when value exceeds critical threshold', () => {
    const { container } = render(
      <StatWidget value={96} label="Temp" warning={80} critical={95} />
    );
    expect(container.firstChild).toHaveClass('stat-critical');
  });

  it('formats the value with a suffix when provided', () => {
    render(<StatWidget value={32} label="Temperature" suffix="°C" />);
    expect(screen.getByText('32°C')).toBeInTheDocument();
  });
});

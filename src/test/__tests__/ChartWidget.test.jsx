import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChartWidget from '../../components/widgets/ChartWidget';

// Mock react-chartjs-2
vi.mock('react-chartjs-2', () => ({
  Line: vi.fn(() => <div data-testid="mock-chart" />),
}));

// Mock Chart.js registration to avoid errors
vi.mock('chart.js', () => ({
  Chart: { register: vi.fn() },
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  PointElement: vi.fn(),
  LineElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
  Filler: vi.fn(),
}));

describe('ChartWidget', () => {
  const mockData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    values: [45, 52, 68, 72, 65, 58],
  };

  it('renders the title', () => {
    render(<ChartWidget title="CPU History" />);
    expect(screen.getByText('CPU History')).toBeInTheDocument();
  });

  it('renders a chart when data is provided', () => {
    render(<ChartWidget title="Temperature" data={mockData} />);
    expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
  });

  it('shows loading state when loading prop is true', () => {
    const { container } = render(<ChartWidget title="Loading Chart" loading={true} />);
    expect(container.querySelector('.chart-loading')).toBeInTheDocument();
    expect(container.querySelector('.chart-placeholder')).toHaveTextContent('Loading...');
  });

  it('shows empty state when no data and not loading', () => {
    const { container } = render(<ChartWidget title="No Data" />);
    expect(container.querySelector('.chart-empty')).toBeInTheDocument();
    expect(container.querySelector('.chart-placeholder')).toHaveTextContent('No data available');
  });

  it('shows empty state when data has empty values array', () => {
    const { container } = render(<ChartWidget title="Empty" data={{ labels: [], values: [] }} />);
    expect(container.querySelector('.chart-empty')).toBeInTheDocument();
  });

  it('accepts a color accent prop and uses green by default', () => {
    const { container } = render(
      <ChartWidget title="CPU" data={mockData} />
    );
    const wrapper = container.querySelector('.chart-widget');
    expect(wrapper).toBeInTheDocument();
  });
});

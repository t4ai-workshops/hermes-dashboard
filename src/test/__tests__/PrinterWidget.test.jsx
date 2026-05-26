import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PrinterWidget from '../../components/widgets/PrinterWidget';

describe('PrinterWidget', () => {
  const mockPrinter = {
    name: 'Bambu X1C',
    status: 'printing',
    progress: 67,
    nozzleTemp: 210,
    bedTemp: 60,
    filament: 'PLA Green',
    filename: 'gearbox_v2.gcode',
  };

  it('renders the printer name', () => {
    render(<PrinterWidget printer={mockPrinter} />);
    expect(screen.getByText('Bambu X1C')).toBeInTheDocument();
  });

  it('shows the progress percentage', () => {
    render(<PrinterWidget printer={mockPrinter} />);
    expect(screen.getByText('67%')).toBeInTheDocument();
  });

  it('shows the filename being printed', () => {
    render(<PrinterWidget printer={mockPrinter} />);
    expect(screen.getByText('gearbox_v2.gcode')).toBeInTheDocument();
  });

  it('shows nozzle and bed temperatures', () => {
    render(<PrinterWidget printer={mockPrinter} />);
    expect(screen.getByText(/210/)).toBeInTheDocument();
    expect(screen.getByText(/60/)).toBeInTheDocument();
  });

  it('shows filament type', () => {
    render(<PrinterWidget printer={mockPrinter} />);
    expect(screen.getByText('PLA Green')).toBeInTheDocument();
  });

  it('shows pulsing indicator when status is printing', () => {
    const { container } = render(<PrinterWidget printer={mockPrinter} />);
    const indicator = container.querySelector('.printer-indicator');
    expect(indicator).toHaveClass('indicator-printing');
  });

  it('shows idle indicator when status is idle', () => {
    const idlePrinter = { ...mockPrinter, status: 'idle', progress: 0, filename: null };
    const { container } = render(<PrinterWidget printer={idlePrinter} />);
    const indicator = container.querySelector('.printer-indicator');
    expect(indicator).toHaveClass('indicator-idle');
  });

  it('shows offline state when printer prop is null', () => {
    const { container } = render(<PrinterWidget printer={null} />);
    expect(container.querySelector('.printer-offline')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const errorPrinter = { ...mockPrinter, status: 'error', progress: 45 };
    const { container } = render(<PrinterWidget printer={errorPrinter} />);
    expect(container.querySelector('.indicator-error')).toBeInTheDocument();
  });
});

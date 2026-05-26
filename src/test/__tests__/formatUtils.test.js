import { describe, it, expect } from 'vitest';
import { formatMetric, getWidgetValue, formatBytes } from '../../components/Dashboard';

describe('formatBytes', () => {
  it('formats bytes per second correctly', () => {
    expect(formatBytes(0)).toBe('0 B/s');
    expect(formatBytes(500)).toBe('500 B/s');
    expect(formatBytes(2048)).toBe('2 KB/s');
    expect(formatBytes(1048576)).toBe('1.0 MB/s');
    expect(formatBytes(2097152)).toBe('2.0 MB/s');
    expect(formatBytes(1536000)).toBe('1.5 MB/s');
  });

  it('handles undefined/null gracefully', () => {
    expect(formatBytes(undefined)).toBe('0 B/s');
    expect(formatBytes(null)).toBe('0 B/s');
  });

  it('handles NaN gracefully', () => {
    expect(formatBytes(NaN)).toBe('0 B/s');
  });
});

describe('formatMetric', () => {
  const mockMetrics = {
    cpu: 45.2,
    memory: 62.1,
    temperature: 48.5,
    uptime: 120.7,
    network: { rx: 2048, tx: 1024 },
  };

  const mockStats = {
    activeJobs: 3,
    completedJobs: 142,
    totalPrintTime: 520,
    filamentUsed: 5,
  };

  it('formats uptime correctly', () => {
    const result = formatMetric(mockMetrics, 'uptime', 'uptime', null);
    expect(result).toBe(121); // Math.round(120.7)
  });

  it('formats network-rx correctly', () => {
    const result = formatMetric(mockMetrics, 'network', 'network-rx', null);
    expect(result).toBe('2 KB/s');
  });

  it('formats network-tx correctly', () => {
    const result = formatMetric(mockMetrics, 'network', 'network-tx', null);
    expect(result).toBe('1 KB/s');
  });

  it('formats activeJobs from stats', () => {
    const result = formatMetric(mockMetrics, 'stats', 'activeJobs', mockStats);
    expect(result).toBe(3);
  });

  it('formats completedJobs from stats', () => {
    const result = formatMetric(mockMetrics, 'stats', 'completedJobs', mockStats);
    expect(result).toBe(142);
  });

  it('formats printTime from stats', () => {
    const result = formatMetric(mockMetrics, 'stats', 'printTime', mockStats);
    expect(result).toBe('520h');
  });

  it('formats filament from stats', () => {
    const result = formatMetric(mockMetrics, 'stats', 'filament', mockStats);
    expect(result).toBe('5kg');
  });

  it('returns 0 for missing metric', () => {
    const result = formatMetric(mockMetrics, 'nonexistent', null, null);
    expect(result).toBe(0);
  });

  it('handles null metrics', () => {
    const result = formatMetric(null, 'cpu', null, null);
    expect(result).toBe(0);
  });
});

describe('getWidgetValue', () => {
  const mockMetrics = {
    cpu: 45.2,
    memory: 62.1,
    network: { rx: 2048, tx: 1024 },
    uptime: 120.7,
  };

  const mockStats = {
    activeJobs: 3,
    completedJobs: 142,
  };

  it('gets numeric cpu value', () => {
    const cfg = { metric: 'cpu' };
    expect(getWidgetValue(mockMetrics, cfg, null)).toBe(45.2);
  });

  it('gets memory value', () => {
    const cfg = { metric: 'memory' };
    expect(getWidgetValue(mockMetrics, cfg, null)).toBe(62.1);
  });

  it('gets network-rx value', () => {
    const cfg = { metric: 'network', formatter: 'network-rx' };
    expect(getWidgetValue(mockMetrics, cfg, null)).toBe(2048);
  });

  it('gets network-tx value', () => {
    const cfg = { metric: 'network', formatter: 'network-tx' };
    expect(getWidgetValue(mockMetrics, cfg, null)).toBe(1024);
  });

  it('gets activeJobs from stats via formatter', () => {
    const cfg = { metric: 'stats', formatter: 'activeJobs' };
    expect(getWidgetValue(mockMetrics, cfg, mockStats)).toBe(3);
  });

  it('gets completedJobs from stats via formatter', () => {
    const cfg = { metric: 'stats', formatter: 'completedJobs' };
    expect(getWidgetValue(mockMetrics, cfg, mockStats)).toBe(142);
  });

  it('gets uptime rounded', () => {
    const cfg = { metric: 'uptime', formatter: 'uptime' };
    expect(getWidgetValue(mockMetrics, cfg, null)).toBe(121);
  });

  it('returns 0 for null metrics', () => {
    const cfg = { metric: 'cpu' };
    expect(getWidgetValue(null, cfg, null)).toBe(0);
  });
});

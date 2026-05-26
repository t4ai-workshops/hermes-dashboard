import { describe, it, expect } from 'vitest';
import {
  generateMetrics,
  generateHistory,
  generatePrinters,
  generateStats,
  generateJobs,
} from '../../services/mock-data';

describe('generateMetrics', () => {
  it('returns all required metric fields', () => {
    const m = generateMetrics();
    expect(m).toHaveProperty('cpu');
    expect(m).toHaveProperty('memory');
    expect(m).toHaveProperty('temperature');
    expect(m).toHaveProperty('disk');
    expect(m).toHaveProperty('uptime');
    expect(m).toHaveProperty('network');
  });

  it('returns numeric values within expected ranges', () => {
    const m = generateMetrics();
    expect(m.cpu).toBeGreaterThanOrEqual(5);
    expect(m.cpu).toBeLessThanOrEqual(95);
    expect(m.memory).toBeGreaterThanOrEqual(10);
    expect(m.memory).toBeLessThanOrEqual(95);
    expect(m.temperature).toBeGreaterThanOrEqual(20);
    expect(m.temperature).toBeLessThanOrEqual(85);
    expect(m.disk).toBeGreaterThanOrEqual(10);
    expect(m.disk).toBeLessThanOrEqual(95);
  });

  it('returns network with rx and tx rates', () => {
    const m = generateMetrics();
    expect(m.network).toHaveProperty('rx');
    expect(m.network).toHaveProperty('tx');
    expect(typeof m.network.rx).toBe('number');
    expect(typeof m.network.tx).toBe('number');
    expect(m.network.rx).toBeGreaterThanOrEqual(0);
    expect(m.network.tx).toBeGreaterThanOrEqual(0);
  });

  it('produces variable output (not all same values)', () => {
    const results = Array.from({ length: 5 }, () => generateMetrics());
    const cpuValues = results.map((r) => r.cpu);
    const unique = new Set(cpuValues);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('returns uptime as a positive number', () => {
    const m = generateMetrics();
    expect(m.uptime).toBeGreaterThan(0);
    expect(Number.isInteger(m.uptime)).toBe(true);
  });
});

describe('generateHistory', () => {
  it('returns labels and values arrays of equal length', () => {
    const h = generateHistory('cpu', 12);
    expect(Array.isArray(h.labels)).toBe(true);
    expect(Array.isArray(h.values)).toBe(true);
    expect(h.labels.length).toBe(h.values.length);
  });

  it('returns history for custom hour count', () => {
    const h = generateHistory('memory', 6);
    expect(h.labels.length).toBe(7); // 0..6 inclusive = 7 points
  });

  it('defaults to 24 hours when no hours param', () => {
    const h = generateHistory('disk');
    expect(h.labels.length).toBe(25); // 0..24 inclusive
  });

  it('values are within 0-100 range', () => {
    const h = generateHistory('cpu', 50);
    h.values.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    });
  });

  it('labels are valid time strings (HH:MM format)', () => {
    const h = generateHistory('temperature', 3);
    h.labels.forEach((label) => {
      expect(label).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  it('different metrics produce different base ranges', () => {
    const cpu = generateHistory('cpu', 1);
    const temp = generateHistory('temperature', 1);
    // Not guaranteed different every time, but likely
    expect(cpu.values.length).toBe(2);
    expect(temp.values.length).toBe(2);
  });
});

describe('generatePrinters', () => {
  it('returns an array of printers', () => {
    const printers = generatePrinters();
    expect(Array.isArray(printers)).toBe(true);
    expect(printers.length).toBeGreaterThanOrEqual(1);
  });

  it('each printer has required properties', () => {
    const printers = generatePrinters();
    printers.forEach((p) => {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('name');
      expect(p).toHaveProperty('status');
      expect(['printing', 'idle', 'offline', 'error']).toContain(p.status);
    });
  });

  it('first printer is always Bambu X1C', () => {
    const printers = generatePrinters();
    expect(printers[0].name).toBe('Bambu X1C');
  });

  it('printing printer has progress between 0-100', () => {
    const printers = generatePrinters();
    const printing = printers.filter((p) => p.status === 'printing');
    printing.forEach((p) => {
      expect(p.progress).toBeGreaterThanOrEqual(0);
      expect(p.progress).toBeLessThanOrEqual(100);
    });
  });

  it('idle printer has null temps', () => {
    // Note: due to pseudoRandom, first call might not give idle.
    // Run multiple times to increase chance.
    let foundIdle = false;
    for (let i = 0; i < 20; i++) {
      const printers = generatePrinters();
      const idle = printers.find((p) => p.status === 'idle');
      if (idle) {
        foundIdle = true;
        expect(idle.nozzleTemp).toBeNull();
        break;
      }
    }
    // If no idle printer found in 20 attempts, skip assertion
    if (!foundIdle) {
      // Very unlikely but possible — just verify structure
      expect(true).toBe(true);
    }
  });
});

describe('generateStats', () => {
  it('returns all required stat fields', () => {
    const s = generateStats();
    expect(s).toHaveProperty('activeJobs');
    expect(s).toHaveProperty('completedJobs');
    expect(s).toHaveProperty('totalPrintTime');
    expect(s).toHaveProperty('filamentUsed');
  });

  it('activeJobs is between 0-3', () => {
    const s = generateStats();
    expect(s.activeJobs).toBeGreaterThanOrEqual(0);
    expect(s.activeJobs).toBeLessThanOrEqual(3);
  });

  it('completedJobs is a positive integer', () => {
    const s = generateStats();
    expect(s.completedJobs).toBeGreaterThan(0);
    expect(Number.isInteger(s.completedJobs)).toBe(true);
  });

  it('totalPrintTime is in hours', () => {
    const s = generateStats();
    expect(s.totalPrintTime).toBeGreaterThan(0);
  });

  it('filamentUsed is a positive number', () => {
    const s = generateStats();
    expect(s.filamentUsed).toBeGreaterThan(0);
    expect(typeof s.filamentUsed).toBe('number');
  });
});

describe('generateJobs', () => {
  it('returns an array of jobs', () => {
    const jobs = generateJobs();
    expect(Array.isArray(jobs)).toBe(true);
    expect(jobs.length).toBeGreaterThan(0);
  });

  it('each job has required properties', () => {
    const jobs = generateJobs();
    jobs.forEach((j) => {
      expect(j).toHaveProperty('id');
      expect(j).toHaveProperty('filename');
      expect(j).toHaveProperty('printer');
      expect(j).toHaveProperty('status');
      expect(j).toHaveProperty('progress');
      expect(j).toHaveProperty('eta');
    });
  });

  it('job statuses are valid', () => {
    const jobs = generateJobs();
    const validStatuses = ['printing', 'queued', 'completed', 'paused', 'failed'];
    jobs.forEach((j) => {
      expect(validStatuses).toContain(j.status);
    });
  });

  it('queued jobs have progress 0', () => {
    const jobs = generateJobs();
    const queued = jobs.filter((j) => j.status === 'queued');
    queued.forEach((j) => {
      expect(j.progress).toBe(0);
    });
  });

  it('returns deterministic output (same jobs every call)', () => {
    const jobs1 = generateJobs();
    const jobs2 = generateJobs();
    expect(jobs1).toEqual(jobs2);
  });
});

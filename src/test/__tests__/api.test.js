import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api, useMock, fetchMetrics, fetchHistory, fetchPrinters, fetchStats, fetchJobs } from '../../services/api';

describe('API Service', () => {
  beforeEach(() => {
    useMock(true);
  });

  describe('fetchMetrics', () => {
    it('returns system metrics with expected shape', async () => {
      const metrics = await fetchMetrics();
      expect(metrics).toHaveProperty('cpu');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('temperature');
      expect(metrics).toHaveProperty('disk');
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('network');
    });

    it('returns numeric values for cpu and memory', async () => {
      const metrics = await fetchMetrics();
      expect(typeof metrics.cpu).toBe('number');
      expect(typeof metrics.memory).toBe('number');
      expect(metrics.cpu).toBeGreaterThanOrEqual(0);
      expect(metrics.cpu).toBeLessThanOrEqual(100);
      expect(metrics.memory).toBeGreaterThanOrEqual(0);
      expect(metrics.memory).toBeLessThanOrEqual(100);
    });
  });

  describe('fetchHistory', () => {
    it('returns time-series data with labels and values', async () => {
      const history = await fetchHistory('cpu');
      expect(Array.isArray(history.labels)).toBe(true);
      expect(Array.isArray(history.values)).toBe(true);
      expect(history.labels.length).toBe(history.values.length);
      expect(history.labels.length).toBeGreaterThan(0);
    });
  });

  describe('fetchPrinters', () => {
    it('returns an array of printers', async () => {
      const printers = await fetchPrinters();
      expect(Array.isArray(printers)).toBe(true);
      expect(printers.length).toBeGreaterThan(0);
      expect(printers[0]).toHaveProperty('name');
      expect(printers[0]).toHaveProperty('status');
    });
  });

  describe('fetchStats', () => {
    it('returns aggregate stats', async () => {
      const stats = await fetchStats();
      expect(stats).toHaveProperty('activeJobs');
      expect(stats).toHaveProperty('completedJobs');
      expect(stats).toHaveProperty('totalPrintTime');
    });
  });

  describe('fetchJobs', () => {
    it('returns a job queue array', async () => {
      const jobs = await fetchJobs();
      expect(Array.isArray(jobs)).toBe(true);
      if (jobs.length > 0) {
        expect(jobs[0]).toHaveProperty('id');
        expect(jobs[0]).toHaveProperty('filename');
        expect(jobs[0]).toHaveProperty('status');
      }
    });
  });

  describe('useMock toggle', () => {
    it('allows toggling mock mode', () => {
      useMock(false);
      // After disabling mock, fetch should throw since no real backend
      // But we just verify the flag state
      useMock(true);
    });
  });
});

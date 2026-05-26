import { describe, it, expect } from 'vitest';
import widgetConfigs from '../../services/widget-configs';

const VALID_TYPES = ['gauge', 'chart', 'stat', 'progress', 'printer'];
const VALID_VIEWS = ['overview', 'printers', 'system', 'jobs', 'settings'];
const GRID_COLUMNS = 10;

describe('widgetConfigs', () => {
  it('has configs for all expected views', () => {
    VALID_VIEWS.forEach((view) => {
      expect(widgetConfigs).toHaveProperty(view);
      expect(Array.isArray(widgetConfigs[view])).toBe(true);
      expect(widgetConfigs[view].length).toBeGreaterThan(0);
    });
  });

  it('every widget has required fields', () => {
    Object.entries(widgetConfigs).forEach(([view, widgets]) => {
      widgets.forEach((w, i) => {
        expect(w, `${view}[${i}] missing id`).toHaveProperty('id');
        expect(w, `${view}[${i}] missing type`).toHaveProperty('type');
        expect(w, `${view}[${i}] missing x`).toHaveProperty('x');
        expect(w, `${view}[${i}] missing y`).toHaveProperty('y');
        expect(w, `${view}[${i}] missing w`).toHaveProperty('w');
        expect(w, `${view}[${i}] missing h`).toHaveProperty('h');
      });
    });
  });

  it('all widget types are valid', () => {
    Object.entries(widgetConfigs).forEach(([view, widgets]) => {
      widgets.forEach((w) => {
        expect(VALID_TYPES, `${view}/${w.id}: ${w.type}`).toContain(w.type);
      });
    });
  });

  it('widget IDs are unique within each view', () => {
    Object.entries(widgetConfigs).forEach(([view, widgets]) => {
      const ids = widgets.map((w) => w.id);
      const unique = new Set(ids);
      expect(unique.size, `${view} has duplicate IDs`).toBe(ids.length);
    });
  });

  it('widgets fit within grid columns (x + w <= 10)', () => {
    Object.entries(widgetConfigs).forEach(([view, widgets]) => {
      widgets.forEach((w) => {
        expect(
          w.x + w.w,
          `${view}/${w.id}: x=${w.x} + w=${w.w} = ${w.x + w.w} exceeds ${GRID_COLUMNS}`
        ).toBeLessThanOrEqual(GRID_COLUMNS);
      });
    });
  });

  it('widgets have non-negative coordinates', () => {
    Object.entries(widgetConfigs).forEach(([view, widgets]) => {
      widgets.forEach((w) => {
        expect(w.x, `${view}/${w.id}: negative x`).toBeGreaterThanOrEqual(0);
        expect(w.y, `${view}/${w.id}: negative y`).toBeGreaterThanOrEqual(0);
        expect(w.w, `${view}/${w.id}: zero/negative w`).toBeGreaterThan(0);
        expect(w.h, `${view}/${w.id}: zero/negative h`).toBeGreaterThan(0);
      });
    });
  });

  it('printer widgets have printerIndex', () => {
    Object.entries(widgetConfigs).forEach(([view, widgets]) => {
      widgets
        .filter((w) => w.type === 'printer')
        .forEach((w) => {
          expect(w, `${view}/${w.id} missing printerIndex`).toHaveProperty('printerIndex');
          expect(typeof w.printerIndex).toBe('number');
        });
    });
  });

  it('chart widgets have a metric field', () => {
    Object.entries(widgetConfigs).forEach(([view, widgets]) => {
      widgets
        .filter((w) => w.type === 'chart')
        .forEach((w) => {
          expect(w, `${view}/${w.id} chart missing metric`).toHaveProperty('metric');
        });
    });
  });

  it('gauge widgets have warning and critical thresholds', () => {
    Object.entries(widgetConfigs).forEach(([view, widgets]) => {
      widgets
        .filter((w) => w.type === 'gauge')
        .forEach((w) => {
          expect(w, `${view}/${w.id} gauge missing warning`).toHaveProperty('warning');
          expect(w, `${view}/${w.id} gauge missing critical`).toHaveProperty('critical');
          expect(w.warning, `${view}/${w.id}: warning >= critical`).toBeLessThan(w.critical);
        });
    });
  });

  it('progress widgets have a warning threshold', () => {
    Object.entries(widgetConfigs).forEach(([view, widgets]) => {
      widgets
        .filter((w) => w.type === 'progress')
        .forEach((w) => {
          expect(w, `${view}/${w.id} progress missing warning`).toHaveProperty('warning');
        });
    });
  });

  it('stat widgets with formatter have the formatter field', () => {
    Object.entries(widgetConfigs).forEach(([view, widgets]) => {
      widgets
        .filter((w) => w.type === 'stat' && w.formatter)
        .forEach((w) => {
          expect(typeof w.formatter).toBe('string');
          expect(w.formatter.length).toBeGreaterThan(0);
        });
    });
  });

  it('overview includes all widget types', () => {
    const types = new Set(widgetConfigs.overview.map((w) => w.type));
    expect(types.has('gauge')).toBe(true);
    expect(types.has('chart')).toBe(true);
    expect(types.has('stat')).toBe(true);
    expect(types.has('progress')).toBe(true);
  });

  it('printers view includes printer and stat widgets', () => {
    const types = new Set(widgetConfigs.printers.map((w) => w.type));
    expect(types.has('printer')).toBe(true);
    expect(types.has('stat')).toBe(true);
  });
});

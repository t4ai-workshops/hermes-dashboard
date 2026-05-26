/**
 * Widget layout configuration per view.
 * Each widget has: id, type, title, grid coords (x, y, w, h), and data source.
 * Grid is 10 columns. Heights are in grid rows.
 *
 * Data shape matches the metrics server API response:
 *   { cpu, memory, disk, temperature, uptime, network: { rx, tx }, timestamp }
 *
 * Stats are fetched from the Hermes dashboard API:
 *   { activeJobs, completedJobs, totalPrintTime, filamentUsed }
 */

const widgetConfigs = {
  overview: [
    { id: 'cpu-usage',    type: 'gauge',    title: 'CPU',            x: 0, y: 0, w: 2, h: 2, metric: 'cpu',           warning: 80, critical: 95 },
    { id: 'cpu-history',  type: 'chart',    title: 'CPU History',    x: 2, y: 0, w: 4, h: 2, metric: 'cpu' },
    { id: 'memory',       type: 'gauge',    title: 'Memory',         x: 6, y: 0, w: 2, h: 2, metric: 'memory',        warning: 80, critical: 95 },
    { id: 'disk',         type: 'progress', title: 'Disk',           x: 8, y: 0, w: 2, h: 2, metric: 'disk',           warning: 80, critical: 95 },
    { id: 'temp',         type: 'stat',     title: 'Temperature',    x: 0, y: 2, w: 2, h: 1, metric: 'temperature',    suffix: '°C' },
    { id: 'uptime',       type: 'stat',     title: 'Uptime',         x: 2, y: 2, w: 2, h: 1, metric: 'uptime',         suffix: 'h', formatter: 'uptime' },
    { id: 'network-rx',   type: 'stat',     title: 'Network RX',     x: 4, y: 2, w: 2, h: 1, metric: 'network',        formatter: 'network-rx' },
    { id: 'network-tx',   type: 'stat',     title: 'Network TX',     x: 6, y: 2, w: 2, h: 1, metric: 'network',        formatter: 'network-tx' },
    { id: 'jobs-stats',   type: 'stat',     title: 'Active Jobs',    x: 8, y: 2, w: 2, h: 1, metric: 'stats',          formatter: 'activeJobs' },
    { id: 'mem-history',  type: 'chart',    title: 'Memory History', x: 0, y: 3, w: 5, h: 2, metric: 'memory' },
    { id: 'disk-history', type: 'chart',    title: 'Disk History',   x: 5, y: 3, w: 5, h: 2, metric: 'disk' },
    { id: 'temp-history', type: 'chart',    title: 'Temp History',   x: 0, y: 5, w: 5, h: 2, metric: 'temperature' },
    { id: 'completed',    type: 'stat',     title: 'Completed Jobs', x: 5, y: 5, w: 2, h: 1, metric: 'stats',        formatter: 'completedJobs' },
    { id: 'print-time',   type: 'stat',     title: 'Print Time',     x: 7, y: 5, w: 3, h: 1, metric: 'stats',        formatter: 'printTime' },
  ],
  printers: [
    { id: 'printer-1',    type: 'printer',  title: null,             x: 0, y: 0, w: 4, h: 3, printerIndex: 0 },
    { id: 'printer-2',    type: 'printer',  title: null,             x: 4, y: 0, w: 4, h: 3, printerIndex: 1 },
    { id: 'print-stats',  type: 'stat',     title: 'Active Jobs',    x: 8, y: 0, w: 2, h: 1, metric: 'stats',   formatter: 'activeJobs' },
    { id: 'print-time',   type: 'stat',     title: 'Print Time',     x: 8, y: 1, w: 2, h: 1, metric: 'stats',   formatter: 'printTime' },
    { id: 'filament',     type: 'stat',     title: 'Filament',       x: 8, y: 2, w: 2, h: 1, metric: 'stats',   formatter: 'filament' },
    { id: 'jobs-queue',   type: 'stat',     title: 'Queue',          x: 8, y: 3, w: 2, h: 1, metric: 'stats',   formatter: 'completedJobs' },
    { id: 'mem-usage',    type: 'progress', title: 'Memory',         x: 0, y: 3, w: 2, h: 2, metric: 'memory',  warning: 80 },
    { id: 'disk-usage',   type: 'progress', title: 'Disk',           x: 2, y: 3, w: 2, h: 2, metric: 'disk',    warning: 80 },
    { id: 'cpu-usage-p',  type: 'gauge',    title: 'CPU',            x: 4, y: 3, w: 2, h: 2, metric: 'cpu',     warning: 80, critical: 95 },
    { id: 'temp-p',       type: 'gauge',    title: 'Temperature',    x: 6, y: 3, w: 2, h: 2, metric: 'temperature', warning: 70, critical: 85 },
  ],
  system: [
    { id: 'cpu-gauge',    type: 'gauge',    title: 'CPU Load',       x: 0, y: 0, w: 2, h: 2, metric: 'cpu',           warning: 80, critical: 95 },
    { id: 'cpu-chart',    type: 'chart',    title: 'CPU History',    x: 2, y: 0, w: 4, h: 2, metric: 'cpu' },
    { id: 'mem-chart',    type: 'chart',    title: 'Memory History', x: 6, y: 0, w: 4, h: 2, metric: 'memory' },
    { id: 'mem-gauge',    type: 'gauge',    title: 'Memory',         x: 0, y: 2, w: 2, h: 2, metric: 'memory',        warning: 80, critical: 95 },
    { id: 'disk-prog',    type: 'progress', title: 'Disk Usage',     x: 2, y: 2, w: 2, h: 2, metric: 'disk',           warning: 80, critical: 95 },
    { id: 'temp-gauge',   type: 'gauge',    title: 'Temperature',    x: 4, y: 2, w: 2, h: 2, metric: 'temperature',    warning: 70, critical: 85 },
    { id: 'net-rx',       type: 'stat',     title: 'Network RX',     x: 6, y: 2, w: 2, h: 1, metric: 'network',        formatter: 'network-rx' },
    { id: 'net-tx',       type: 'stat',     title: 'Network TX',     x: 8, y: 2, w: 2, h: 1, metric: 'network',        formatter: 'network-tx' },
    { id: 'uptime-stat',  type: 'stat',     title: 'Uptime',         x: 6, y: 3, w: 2, h: 1, metric: 'uptime',         suffix: 'h', formatter: 'uptime' },
    { id: 'temp-stat',    type: 'stat',     title: 'Temperature',    x: 8, y: 3, w: 2, h: 1, metric: 'temperature',    suffix: '°C' },
    { id: 'disk-chart',   type: 'chart',    title: 'Disk History',   x: 0, y: 4, w: 5, h: 2, metric: 'disk' },
    { id: 'temp-chart',   type: 'chart',    title: 'Temp History',   x: 5, y: 4, w: 5, h: 2, metric: 'temperature' },
  ],
  jobs: [
    { id: 'jobs-active',  type: 'stat',     title: 'Active',         x: 0, y: 0, w: 2, h: 1, metric: 'stats', formatter: 'activeJobs' },
    { id: 'jobs-done',    type: 'stat',     title: 'Completed',      x: 2, y: 0, w: 2, h: 1, metric: 'stats', formatter: 'completedJobs' },
    { id: 'print-time-s', type: 'stat',     title: 'Total Time',     x: 4, y: 0, w: 2, h: 1, metric: 'stats', formatter: 'printTime' },
    { id: 'filament-s',   type: 'stat',     title: 'Filament',       x: 6, y: 0, w: 2, h: 1, metric: 'stats', formatter: 'filament' },
    { id: 'printer-1j',   type: 'printer',  title: null,             x: 0, y: 1, w: 4, h: 3, printerIndex: 0 },
    { id: 'printer-2j',   type: 'printer',  title: null,             x: 4, y: 1, w: 4, h: 3, printerIndex: 1 },
    { id: 'disk-job',     type: 'progress', title: 'Disk',           x: 8, y: 1, w: 2, h: 2, metric: 'disk', warning: 80 },
    { id: 'mem-job',      type: 'progress', title: 'Memory',         x: 8, y: 3, w: 2, h: 1, metric: 'memory', warning: 80 },
    { id: 'cpu-job',      type: 'gauge',    title: 'CPU',            x: 0, y: 4, w: 2, h: 2, metric: 'cpu', warning: 80, critical: 95 },
    { id: 'temp-job',     type: 'gauge',    title: 'Temperature',    x: 2, y: 4, w: 2, h: 2, metric: 'temperature', warning: 70, critical: 85 },
    { id: 'net-rx-job',   type: 'stat',     title: 'Network RX',     x: 4, y: 4, w: 2, h: 1, metric: 'network', formatter: 'network-rx' },
    { id: 'net-tx-job',   type: 'stat',     title: 'Network TX',     x: 6, y: 4, w: 2, h: 1, metric: 'network', formatter: 'network-tx' },
    { id: 'uptime-job',   type: 'stat',     title: 'Uptime',         x: 8, y: 4, w: 2, h: 1, metric: 'uptime', suffix: 'h', formatter: 'uptime' },
  ],
  settings: [
    { id: 'cpu-s',        type: 'gauge',    title: 'CPU',            x: 0, y: 0, w: 3, h: 2, metric: 'cpu', warning: 80, critical: 95 },
    { id: 'mem-s',        type: 'gauge',    title: 'Memory',         x: 3, y: 0, w: 3, h: 2, metric: 'memory', warning: 80, critical: 95 },
    { id: 'disk-s',       type: 'progress', title: 'Disk',           x: 6, y: 0, w: 2, h: 2, metric: 'disk', warning: 80 },
    { id: 'temp-s',       type: 'stat',     title: 'Temperature',    x: 8, y: 0, w: 2, h: 1, metric: 'temperature', suffix: '°C' },
    { id: 'uptime-s',     type: 'stat',     title: 'Uptime',         x: 8, y: 1, w: 2, h: 1, metric: 'uptime', suffix: 'h' },
  ],
};

export default widgetConfigs;

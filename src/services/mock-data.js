/**
 * Mock data generator — simulates real backend responses.
 * All functions are deterministic but produce realistic variation.
 */

let seed = 42;
function pseudoRandom() {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export function generateMetrics() {
  return {
    cpu: clamp(35 + pseudoRandom() * 30, 5, 95),
    memory: clamp(55 + pseudoRandom() * 20, 10, 95),
    temperature: clamp(38 + pseudoRandom() * 15, 20, 85),
    disk: clamp(60 + pseudoRandom() * 15, 10, 95),
    uptime: Math.floor(120000 + pseudoRandom() * 50000),
    network: {
      rx: Math.floor(pseudoRandom() * 5000),
      tx: Math.floor(pseudoRandom() * 3000),
    },
  };
}

export function generateHistory(metric, hours = 24) {
  const labels = [];
  const values = [];
  const now = new Date();
  for (let i = hours; i >= 0; i--) {
    const t = new Date(now - i * 3600000);
    labels.push(t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    const base = metric === 'cpu' ? 40 : metric === 'memory' ? 60 : metric === 'temperature' ? 45 : 30;
    values.push(clamp(base + pseudoRandom() * 30 - 15, 0, 100));
  }
  return { labels, values };
}

export function generatePrinters() {
  return [
    {
      id: 'p1',
      name: 'Bambu X1C',
      status: 'printing',
      progress: Math.floor(40 + pseudoRandom() * 50),
      nozzleTemp: Math.floor(200 + pseudoRandom() * 15),
      bedTemp: Math.floor(55 + pseudoRandom() * 10),
      filament: pseudoRandom() > 0.5 ? 'PLA Green' : 'PETG Black',
      filename: pseudoRandom() > 0.5 ? 'gearbox_v2.gcode' : 'bracket_large.gcode',
    },
    (() => {
      const isIdle = pseudoRandom() > 0.6;
      return {
        id: 'p2',
        name: 'Prusa MK4',
        status: isIdle ? 'idle' : 'printing',
        progress: isIdle ? 0 : Math.floor(10 + pseudoRandom() * 80),
        nozzleTemp: isIdle ? null : Math.floor(195 + pseudoRandom() * 20),
        bedTemp: isIdle ? null : Math.floor(50 + pseudoRandom() * 15),
        filament: isIdle ? null : 'ABS White',
        filename: isIdle ? null : 'case_top.gcode',
      };
    })(),
  ];
}

export function generateStats() {
  return {
    activeJobs: Math.floor(pseudoRandom() * 4),
    completedJobs: Math.floor(120 + pseudoRandom() * 30),
    totalPrintTime: Math.floor(450 + pseudoRandom() * 200),
    filamentUsed: Math.floor(2.5 + pseudoRandom() * 3),
  };
}

export function generateJobs() {
  return [
    { id: 'j001', filename: 'gearbox_v2.gcode', printer: 'Bambu X1C', status: 'printing', progress: 67, eta: '2h 14m' },
    { id: 'j002', filename: 'bracket_large.gcode', printer: 'Bambu X1C', status: 'queued', progress: 0, eta: '-' },
    { id: 'j003', filename: 'case_bottom.gcode', printer: 'Prusa MK4', status: 'queued', progress: 0, eta: '-' },
  ];
}

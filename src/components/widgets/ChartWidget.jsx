import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import './ChartWidget.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const DARK_THEME = {
  borderColor: 'rgba(255,255,255,0.06)',
  gridColor: 'rgba(255,255,255,0.06)',
  textColor: '#94a3b8',
};

export default function ChartWidget({ title, data, loading = false, colorAccent = '#4ade80' }) {
  if (loading) {
    return (
      <div className="chart-widget chart-loading">
        <div className="chart-title">{title}</div>
        <div className="chart-placeholder">Loading...</div>
      </div>
    );
  }

  if (!data || !data.values || data.values.length === 0) {
    return (
      <div className="chart-widget chart-empty">
        <div className="chart-title">{title}</div>
        <div className="chart-placeholder">No data available</div>
      </div>
    );
  }

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.values,
        borderColor: colorAccent,
        backgroundColor: `${colorAccent}15`,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: colorAccent,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a2030',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { color: DARK_THEME.gridColor, drawBorder: false },
        ticks: { color: DARK_THEME.textColor, font: { size: 10 }, maxTicksLimit: 6 },
        border: { display: false },
      },
      y: {
        grid: { color: DARK_THEME.gridColor, drawBorder: false },
        ticks: { color: DARK_THEME.textColor, font: { size: 10 }, maxTicksLimit: 5 },
        border: { display: false },
        beginAtZero: false,
      },
    },
  };

  return (
    <div className="chart-widget">
      <div className="chart-title">{title}</div>
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

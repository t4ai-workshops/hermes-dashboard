import './StatWidget.css';

/**
 * StatWidget — displays a single metric value.
 *
 * Supports both numeric values (with automatic warning/critical coloring)
 * and string display values (for formatted outputs like "1.2 MB/s").
 */
export default function StatWidget({
  value,
  displayValue,
  label,
  delta,
  warning,
  critical,
  suffix = '',
}) {
  // Determine status class from numeric value
  const numericValue = typeof value === 'number' ? value : null;
  const statusClass =
    numericValue != null && critical != null && numericValue >= critical
      ? 'stat-critical'
      : numericValue != null && warning != null && numericValue >= warning
        ? 'stat-warning'
        : '';

  // Use displayValue if provided, otherwise format numeric value
  const shown =
    displayValue != null
      ? displayValue
      : numericValue != null
        ? `${numericValue}${suffix}`
        : '—';

  const deltaEl =
    delta != null ? (
      <span
        className={`stat-delta ${
          delta > 0 ? 'delta-positive' : delta < 0 ? 'delta-negative' : 'delta-neutral'
        }`}
      >
        {delta > 0 ? `▲ ${delta}%` : delta < 0 ? `▼ ${Math.abs(delta)}%` : '0%'}
      </span>
    ) : null;

  return (
    <div className={`stat-widget ${statusClass}`}>
      <div className="stat-value">{shown}</div>
      <div className="stat-label">{label}</div>
      {deltaEl}
    </div>
  );
}

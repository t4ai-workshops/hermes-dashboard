import './PrinterWidget.css';

export default function PrinterWidget({ printer }) {
  if (!printer) {
    return (
      <div className="printer-widget printer-offline">
        <div className="printer-indicator indicator-offline" />
        <div className="printer-name">No printer</div>
        <div className="printer-status-text">Offline</div>
      </div>
    );
  }

  const { name, status, progress = 0, nozzleTemp, bedTemp, filament, filename } = printer;
  const indicatorClass =
    status === 'printing' ? 'indicator-printing'
    : status === 'error' ? 'indicator-error'
    : status === 'idle' ? 'indicator-idle'
    : 'indicator-offline';

  return (
    <div className={`printer-widget printer-${status}`}>
      <div className={`printer-indicator ${indicatorClass}`} />
      <div className="printer-name">{name}</div>
      <div className="printer-status-text">
        {status === 'printing' ? 'Printing' : status === 'error' ? 'Error' : 'Idle'}
      </div>

      {filename && <div className="printer-filename">{filename}</div>}

      {status === 'printing' && (
        <>
          <div className="printer-progress-bar">
            <div className="printer-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="printer-progress-text">{progress}%</div>
        </>
      )}

      <div className="printer-temps">
        {nozzleTemp != null && (
          <span className="printer-temp">
            <span className="temp-label">Nozzle</span> {nozzleTemp}°C
          </span>
        )}
        {bedTemp != null && (
          <span className="printer-temp">
            <span className="temp-label">Bed</span> {bedTemp}°C
          </span>
        )}
      </div>

      {filament && <div className="printer-filament">{filament}</div>}
    </div>
  );
}

import SystemCheck from '../utils/SystemCheck'; 


function ErrorDisplay({ error, onRetry }) {
  const systemStatus = SystemCheck.getSystemStatus();

  return (
    <main className="container mt-4">
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Database Error!</h4>
        <p>{error}</p>
        <hr />
        <p className="mb-0">
          <strong>System Status:</strong><br />
          Cross-Origin Isolated: {systemStatus.crossOriginIsolated ? '✅ Yes' : '❌ No'}<br />
          SharedArrayBuffer: {systemStatus.hasSharedArrayBuffer ? '✅ Available' : '❌ Not Available'}
        </p>
        <button 
          className="btn btn-outline-danger mt-2" 
          onClick={onRetry}
        >
          Retry
        </button>
      </div>
    </main>
  );
}

export default ErrorDisplay;
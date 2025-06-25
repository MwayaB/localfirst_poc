function LoadingSpinner({ message = "Loading..." }) {
  return (
    <main className="container mt-4">
      <div className="d-flex justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-2">{message}</span>
      </div>
    </main>
  );
}
export default LoadingSpinner;
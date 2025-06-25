import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './bs.scss';
import 'bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import sqlite, { initializeSQLite } from './db';
import HomeScreen from './components/HomeScreen';
import { ServicesProvider } from './contexts/ServicesContext';

function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const dbName = searchParams.get('db') || 'mydb.sqlite3';

    initializeSQLite(dbName)
      .then(() => setDbInitialized(true))
      .catch((error) => console.error('Failed to initialize database:', error));
  }, [location.search]);

  if (!dbInitialized) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <ServicesProvider>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
      </Routes>
    </ServicesProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>
);
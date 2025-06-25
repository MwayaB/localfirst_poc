import { useEffect, useState, useContext } from 'react';
import VisitService from '../services/VisitService';
import WaitingRoom from '../components/WaitingRoom';
import Navbar from './NavBar';
import TriageSection from '../components/TriageSection';
import sqlite from '../db';
import Sidebar from './SideBar';
import { ServicesContext } from '../contexts/ServicesContext';

const HomeScreen = () => {
  const [counts, setCounts] = useState({
    waitingRoom: 0,
    triage: 0,
    assessment: 0,
    allPatients: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeSection, setActiveSection] = useState('waiting-room');
  const [collapsed, setCollapsed] = useState(false);
  
  

  const { databaseService, patientService, visitService } = useContext(ServicesContext);

  useEffect(() => {
    const initializeAndFetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isInitialized) {
          await patientService.initializeSchema();
          await patientService.seedSamplePatients();
          await visitService.seedSampleVisits();
          setIsInitialized(true);
        }

        const stats = await visitService.getVisitStatistics();
        setCounts({
          waitingRoom: stats.waitingRoom,
          triage: stats.triage,
          assessment: stats.primarySurvey,
          allPatients: stats.total,
        });
      } catch (error) {
        console.error('Error initializing data:', error);
        setError(`Failed to load data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    initializeAndFetchData();
  }, [patientService, visitService, isInitialized]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await visitService.getVisitStatistics();
      setCounts({
        waitingRoom: stats.waitingRoom,
        triage: stats.triage,
        assessment: stats.primarySurvey,
        allPatients: stats.total,
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError(`Failed to refresh data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

 const sidebarItems = [
  {
    label: 'WAITING ROOM',
    count: counts.waitingRoom,
    key: 'waiting-room',
    icon: 'bi-clock-history', // example icon
  },
  {
    label: 'TRIAGE',
    count: counts.triage,
    key: 'triage',
    icon: 'bi-heart-pulse',
  },
  {
    label: 'ASSESSMENT',
    count: counts.assessment,
    key: 'primary-survey',
    icon: 'bi-clipboard-pulse',
  },
  {
    label: 'ALL PATIENTS',
    count: counts.allPatients,
    key: 'all-patients',
    icon: 'bi-people',
  },
];

  if (loading && !isInitialized) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-success mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Initializing database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column vh-100">
      <Navbar />
      <div className="d-flex flex-grow-1">
    <Sidebar error={error} loading={loading} isInitialized={isInitialized} 
  sidebarItems={sidebarItems}
  activeSection={activeSection}
  setActiveSection={setActiveSection}
  refreshData={refreshData}
  collapsed={collapsed}
  setCollapsed={setCollapsed}
 />
        <main className="flex-grow-1">
          {isInitialized ? (
            activeSection === 'waiting-room' ? (
              <WaitingRoom 
                visitService={visitService} 
                patientService={patientService}
                collapsed={collapsed}
                searchTerm={searchTerm}
                onDataChange={refreshData}
              />
            ) : activeSection === 'triage' ? (
              <TriageSection 
                visitService={visitService} 
                patientService={patientService}
                searchTerm={searchTerm}
                onDataChange={refreshData}
              />
            ) : (
              <div className="p-4">Section "{activeSection}" is under construction.</div>
            )
          ) : (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="text-center">
                <div className="spinner-border text-success mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted">Setting up patient data...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default HomeScreen;
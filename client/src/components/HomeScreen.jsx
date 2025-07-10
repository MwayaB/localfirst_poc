import { useState, useEffect, useContext } from 'react';
import WaitingRoom from '../components/WaitingRoom';
import TriageSection from '../components/TriageSection';
import Navbar from './NavBar';
import Sidebar from './SideBar';
import { useSyncMutation } from '../hooks/useSync';
import { useSeedPatients, useInitializeSchema } from '../hooks/usePatients';
import { useVisitStats, useSeedVisits, useGetWaitingRoomList } from '../hooks/useVisits';


const HomeScreen = () => {

  const [activeSection, setActiveSection] = useState('waiting-room');
  const [collapsed, setCollapsed] = useState(false);
  const { mutateAsync: seedSamplePatients } = useSeedPatients();
  const { mutateAsync: seedVisits  } = useSeedVisits();
  const { mutateAsync: initializeSchema, isSuccess: isInitialized } = useInitializeSchema();
  const { data: stats, isLoading, isError, error } = useVisitStats();
  const { data: waitingPatients, isLoading: visitsLoading } = useGetWaitingRoomList();
  const { mutateAsync: syncNow } = useSyncMutation();

  const counts = {
    waitingRoom: stats?.waitingRoom || 0,
    triage: stats?.triage || 0,
    assessment: stats?.primarySurvey || 0,
    allPatients: stats?.total || 0,
  };

  useEffect(() => {
    const initializeAndSeed = async () => {
      if (!isInitialized) {
        try {
          await initializeSchema();
          await syncNow();

        } catch (err) {
          console.error('Seeding error:', err);
        }
      }
    };

    initializeAndSeed();
  }, [isInitialized, waitingPatients]);

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const sidebarItems = [
    {
      label: 'WAITING ROOM',
      count: counts.waitingRoom,
      key: 'waiting-room',
      icon: 'bi-clock-history',
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

  if (isLoading && !isInitialized) {
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
        <Sidebar
          error={error}
          loading={isLoading}
          isInitialized={isInitialized}
          sidebarItems={sidebarItems}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
        <main className="flex-grow-1">
          {isInitialized ? (
            activeSection === 'waiting-room' ? (
              <WaitingRoom
                collapsed={collapsed}
              />
            ) : activeSection === 'triage' ? (
              <TriageSection
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
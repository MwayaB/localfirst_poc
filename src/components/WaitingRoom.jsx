import { useEffect, useState, useMemo } from 'react';
import NewArrivalModal from './NewArrivalModal';

const WaitingRoom = ({ visitService, patientService, collapsed }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [isArrivalModalOpen, setIsArrivalModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Refresh every second to update waiting times
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await visitService.getSectionPatients('registration');
        setPatients(data);
      } catch (error) {
        console.error('Error loading waiting room patients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [visitService]);

  const getGenderColor = (gender) => {
    if (gender?.toLowerCase() === 'male') return 'bg-primary';
    if (gender?.toLowerCase() === 'female') return 'bg-pink';
    return 'bg-secondary';
  };

  const getWaitTimeClass = (visitDate, visitStartTime) => {
    if (!visitDate || !visitStartTime) return 'bg-secondary';

    const [year, month, day] = visitDate.split('-').map(Number);
    const [hour, minute] = visitStartTime.split(':').map(Number);
    const start = new Date(year, month - 1, day, hour, minute);

    if (isNaN(start.getTime())) return 'bg-secondary';

    const diffMins = Math.floor((now - start) / 60000);
    if (diffMins < 0) return 'bg-secondary'; // future time

    if (diffMins < 5) return 'bg-success';
    if (diffMins < 10) return 'bg-warning';
    return 'bg-danger';
  };

  const formatWaitTime = (visitDate, visitStartTime) => {
    if (!visitDate || !visitStartTime) return 'N/A';

    const [year, month, day] = visitDate.split('-').map(Number);
    const [hour, minute] = visitStartTime.split(':').map(Number);
    const start = new Date(year, month - 1, day, hour, minute);

    if (isNaN(start.getTime())) return 'Invalid start time';

    let diffMs = now - start;
    if (diffMs < 0) return 'Just now';

    const hours = Math.floor(diffMs / 3600000);
    diffMs %= 3600000;
    const minutes = Math.floor(diffMs / 60000);
    diffMs %= 60000;
    const seconds = Math.floor(diffMs / 1000);

    const parts = [];
    if (hours > 0) parts.push(`${hours} hr${hours !== 1 ? 's' : ''}`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes} min${minutes !== 1 ? 's' : ''}`);
    parts.push(`${seconds} sec${seconds !== 1 ? 's' : ''}`);

    return parts.join(' ');
  };

  // Filter patients by search term (case-insensitive)
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients;
    const term = searchTerm.toLowerCase();
    return patients.filter((p) =>
      `${p.given_name} ${p.family_name}`.toLowerCase().includes(term)
    );
  }, [patients, searchTerm]);

  return (
    <div className="flex-grow-1 bg-light p-4">
      <h4 className="mb-4">WAITING ROOM</h4>

      <input
        type="text"
        placeholder="Search patients by name..."
        className="form-control mb-4"
        style={{ maxWidth: '300px' }}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        aria-label="Search patients by name"
      />

      {loading ? (
        <div>Loading patients...</div>
      ) : filteredPatients.length === 0 ? (
        <div className="alert alert-info">
          <i className="bi bi-info-circle"></i> No patients found in the waiting room.
        </div>
      ) : (
        <>
          <div className="mb-3">
            <div className="d-flex flex-wrap gap-3">
              <div className="d-flex align-items-center">
                <div className="bg-success rounded-circle me-2" style={{ width: '16px', height: '16px' }}></div>
                <small>Waiting for under 5 minutes</small>
              </div>
              <div className="d-flex align-items-center">
                <div className="bg-warning rounded-circle me-2" style={{ width: '16px', height: '16px' }}></div>
                <small>Waiting for 5–9 minutes</small>
              </div>
              <div className="d-flex align-items-center">
                <div className="bg-danger rounded-circle me-2" style={{ width: '16px', height: '16px' }}></div>
                <small>Waiting for 10+ minutes</small>
              </div>
              <div className="d-flex align-items-center">
                <div className="bg-secondary rounded-circle me-2" style={{ width: '16px', height: '16px' }}></div>
                <small>Unknown/Invalid Time</small>
              </div>
            </div>
          </div>

          <div className={`row g-4 ${collapsed ? 'row-cols-1 row-cols-sm-2 row-cols-md-4' : 'row-cols-1 row-cols-sm-2 row-cols-md-3'}`}>
            {filteredPatients.map((patient) => (
              <div key={patient.patient_id} className="col">
                <div className="card shadow-sm">
                  <div className={`card-header p-3 ${getWaitTimeClass(patient.visit_date, patient.visit_start_time)}`}></div>
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <div
                        className={`rounded-circle text-white d-flex align-items-center justify-content-center me-3 ${getGenderColor(patient.gender)}`}
                        style={{ width: 40, height: 40 }}
                        aria-label={`${patient.gender || 'Unknown gender'} patient initials`}
                      >
                        <strong>
                          {patient.given_name?.[0] || '?'}
                          {patient.family_name?.[0] || '?'}
                        </strong>
                      </div>
                      <div className="fw-medium">
                        {patient.given_name} {patient.family_name}
                      </div>
                    </div>
                    <div className="text-dark fw-semibold mb-1">
                      Age: {patientService.calculateAge(patient.birthdate)}
                    </div>
                    <div className="text-muted mb-1">
                      Visit #: <code>{patient.aetc_visit_number}</code>
                    </div>
                    <div className="text-muted mb-3">
                      Time Waiting:{' '}
                      <strong className="text-muted">{formatWaitTime(patient.visit_date, patient.visit_start_time)}</strong>
                    </div>
                    <button className="btn btn-contrast" type="button" aria-label={`Screen patient ${patient.given_name} ${patient.family_name}`}>
                      SCREEN
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="col">
              <div
                onClick={() => setIsArrivalModalOpen(true)}
                className="card h-100 text-center text-muted text-decoration-none border border-secondary border-dashed"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsArrivalModalOpen(true);
                  }
                }}
                aria-label="Add new patient arrival"
              >
                <div className="card-body d-flex flex-column align-items-center justify-content-center">
                  <div className="display-5">＋</div>
                  <div>New Arrival</div>
                </div>
              </div>
            </div>

            <NewArrivalModal
              isOpen={isArrivalModalOpen}
              onClose={() => setIsArrivalModalOpen(false)}
              patientService={patientService}
              visitService={visitService}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default WaitingRoom;
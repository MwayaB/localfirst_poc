import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetSectionPatients } from '../hooks/useVisits';
import { calculateAge } from '../utils/calculateAge.js';

const TriageSection = () => {
  const [loading, setLoading] = useState(true);
  const[ patientList, setPatientList] = useState([]);
  const { data: triageList,  isLoading: visitsLoading} = useGetSectionPatients('triage');


  useEffect(() => {
    setPatientList(triageList || []);

  },[ triageList]);


  return (
    <div className="flex-grow-1 bg-light p-4">
      <h4 className="mb-4">TRIAGE</h4>

      <input
        type="text"
        placeholder="Search..."
        className="form-control mb-4"
        style={{ maxWidth: '300px' }}
      />

      {visitsLoading ? (
        <div>Loading triage patients...</div>
      ) : patientList.length === 0 ? (
        <div className="alert alert-info">
          <i className="bi bi-info-circle"></i> No patients currently in triage.
        </div>
      ) : (
        <div className="row g-4">
          {patientList.map((patient) => (
            <div key={patient.patient_id} className="col-md-4">
              <div className="card shadow-sm">
                <div className="card-header bg-warning-contrast p-3"></div>
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <div
                      className="rounded-circle bg-warning text-white d-flex align-items-center justify-content-center me-3"
                      style={{ width: '40px', height: '40px' }}
                    >
                      <strong>
                        {patient.given_name[0]}
                        {patient.family_name[0]}
                      </strong>
                    </div>
                    <div className="fw-medium">
                      {patient.given_name} {patient.family_name}
                    </div>
                  </div>
                  <div className="text-dark fw-semibold mb-3">
                    Age: {calculateAge(patient.birthdate)}
                  </div>
                  <div className="text-muted mb-2">
                    Visit #: <code>{patient.aetc_visit_number}</code>
                  </div>
                  <button className="btn btn-warning">START TRIAGE</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TriageSection;
import { toTimeString } from "../utils/helpers";
export default class SyncService {
  constructor(patientService, visitService) {
    this.patientService = patientService;
    this.visitService = visitService;
    this.SYNC_ENDPOINT = 'http://localhost:3000/sync';
    this.SSE_ENDPOINT = 'http://localhost:3000/sync/events';
    this.eventSource = null;
  }

  /**
   * Connect to server-sent events
   */
  connectToSSE = () => {
  if (this.eventSource) {
    this.eventSource.close(); // Prevent multiple listeners
  }

  this.eventSource = new EventSource(this.SSE_ENDPOINT);

  this.eventSource.onmessage = async (e) => {
    
    try {
      const payload = JSON.parse(e.data);
      console.log('SSE Message:', payload);

      if (payload.type === 'sync_complete' && payload.data) {
       
    const { patients, visits } = payload.data;
      
    const transformedPatients = patients.map((p) => {
        const fallbackBirthdate = '1900-01-01'; // use a fallback if missing

        return {
          patient_id: Number(p.external_id),
          given_name: p.given_name,
          family_name: p.family_name,
          birthdateEstimated: p.birthdateEstimated ? 1 : 0,
          gender: p.gender,
          birthdate: p.birthdate
            ? new Date(p.birthdate).toISOString().split('T')[0]
            : fallbackBirthdate,
        };
      });
    
        const transformedVisits = visits.map(v => ({
          visit_id: String(v.external_id),
          patient_id: Number(v.expand.patient.external_id),
          visit_date: v.visit_date.slice(0, 10),
          visit_start_time: toTimeString( new Date(new Date(v.visit_start_time).getTime() - 2 * 60 * 1000)),
          visit_status: v.visit_status,
          visit_step: v.visit_step,
          created_at: v.created_at,
          updated_at: v.updated_at,
        }));
        
        await this.patientService.insertPatients(transformedPatients);
        await this.visitService.insertVisits(transformedVisits);

        this.setLastSyncTimestamp(payload.timestamp);
      }
    } catch (err) {
      console.error('Failed to parse SSE data:', e.data);
    }
  };

  this.eventSource.onerror = (err) => {
    console.error('SSE connection error:', err);
    this.eventSource.close();
    this.eventSource = null;
  };
};

  /**
   * Retrieve the last sync timestamp
   */
  getLastSyncTimestamp() {
    if (localStorage.getItem('lastSync'))
        return localStorage.getItem('lastSync') 

    return null;
  }

  /**
   * Update the last sync timestamp
   */
  setLastSyncTimestamp(ts) {
    localStorage.setItem('lastSync', ts);
  }

  /**
   * Push changes and pull server-side updates
   */
  async sync() {
    const lastSync = this.getLastSyncTimestamp();
    
    const changedPatients = await this.patientService.getUpdatedSince(lastSync);
    const changedVisits = await this.visitService.getUpdatedSince(lastSync);

    const payload = {
      lastSync,
      changes: {
        patients: changedPatients,
        visits: changedVisits,
      },
    };

    const res = await fetch(this.SYNC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Sync failed: ${err.message}`);
    }

  }
}
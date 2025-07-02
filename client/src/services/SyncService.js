export default class SyncService {
  constructor(patientService, visitService) {
    this.patientService = patientService;
    this.visitService = visitService;
    this.SYNC_ENDPOINT = 'http://localhost:3000/sync';
  }

  getLastSyncTimestamp() {
    return localStorage.getItem('lastSync') || null;
  }

  setLastSyncTimestamp(ts) {
    localStorage.setItem('lastSync', ts);
  }

  async sync() {
    const lastSync = this.getLastSyncTimestamp();

    const changedPatients = await this.patientService.getUpdatedSince(lastSync);
    const changedVisits = await this.visitService.getUpdatedSince(lastSync);

    const payload = {
      lastSync,
      changes:{
        patients: changedPatients,
        visits: changedVisits,
      }

    };

    const res = await fetch(this.SYNC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Sync failed: ${err.message}`);
    }

    const { patients: remotePatients, visits: remoteVisits, serverTime } = await res.json();

    await this.patientService.upsertMany(remotePatients);
    await this.visitService.upsertMany(remoteVisits);

    this.setLastSyncTimestamp(serverTime || new Date().toISOString());
  }
}
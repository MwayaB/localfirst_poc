class PatientService {
  constructor(databaseService) {
    this.db = databaseService;
  }

  // Only creates tables — no sample data
  async initializeSchema() {
    return this.db.initializeSchema();
  }

  // Seeds sample data only if none exists
  async seedSamplePatients() {
    const existingPatients = await this.db.selectPatients();
    if (existingPatients.length === 0) {
      const samplePatients = [
        {
          patient_id: 1,
          given_name: 'John',
          family_name: 'Doe',
          birthdateEstimated: 0,
          gender: 'Male',
          birthdate: '1990-01-01',
        },
        {
          patient_id: 2,
          given_name: 'Jane',
          family_name: 'Smith',
          birthdateEstimated: 1,
          gender: 'Female',
          birthdate: '1985-05-15',
        },
        {
          patient_id: 3,
          given_name: 'Michael',
          family_name: 'Johnson',
          birthdateEstimated: 0,
          gender: 'Male',
          birthdate: '1978-12-03',
        }
      ];

      await this.db.insertPatients(samplePatients);
      console.log('✓ Seeded sample patients');
    } else {
      console.log('✓ Patients table already has data — skipping seed');
    }

    return await this.db.selectPatients();
  }

  async getAllPatients() {
    return this.db.selectPatients();
  }

  async getPatientById(patient_id) {
    const result = await this.db.selectPatientById(patient_id);
    return result || null;
  }


  insertPatients(patientsData) {
    return this.db.insertPatients(patientsData);
  }

  getUpdatedSince(lastSync) {
      return this.db.getUnsyncedPatients(lastSync);
  }
}
export default PatientService;

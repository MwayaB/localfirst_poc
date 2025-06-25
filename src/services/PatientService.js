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
          latest_encounter_type: 'initial',
          given_name: 'John',
          family_name: 'Doe',
          aetc_visit_number: 'A123',
          birthdateEstimated: 0,
          gender: 'Male',
          birthdate: '1990-01-01',
          uuid: 'patient-uuid-001',
        },
        {
          patient_id: 2,
          latest_encounter_type: 'follow-up',
          given_name: 'Jane',
          family_name: 'Smith',
          aetc_visit_number: 'B456',
          birthdateEstimated: 1,
          gender: 'Female',
          birthdate: '1985-05-15',
          uuid: 'patient-uuid-002',
        },
        {
          patient_id: 3,
          latest_encounter_type: 'initial',
          given_name: 'Michael',
          family_name: 'Johnson',
          aetc_visit_number: 'C789',
          birthdateEstimated: 0,
          gender: 'Male',
          birthdate: '1978-12-03',
          uuid: 'patient-uuid-003',
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

  calculateAge(birthdate) {
    const age = Date.now() - new Date(birthdate);
    return Math.floor(age / (1000 * 60 * 60 * 24 * 365.25));
  }

  insertPatients(patientsData) {
    return this.db.insertPatients(patientsData);
  }
}

export default PatientService;

import { calculateAge, toTimeString } from "../utils/helpers";

const now = new Date();



const today = now.toISOString().split('T')[0];

const sampleVisits = [
  {
    visit_id: 1,
    patient_id: 1,
    visit_date: today,
    visit_start_time: toTimeString(new Date(now.getTime() - 2 * 60 * 1000)), // 2 mins ago
    visit_status: 'active',
    visit_step: 'registration'
  },
  {
    visit_id: 2,
    patient_id: 2,
    visit_date: today,
    visit_start_time: toTimeString(new Date(now.getTime() - 7 * 60 * 1000)), // 7 mins ago
    visit_status: 'active',
    visit_step: 'registration'
  },
  {
    visit_id: 3,
    patient_id: 3,
    visit_date: today,
    visit_start_time: toTimeString(new Date(now.getTime() - 15 * 60 * 1000)), // 15 mins ago
    visit_status: 'active',
    visit_step: 'triage'
  }
];

class VisitService {
  constructor(dbService) {
    this.dbService = dbService;
  }

  async seedSampleVisits() {
    const existingVisits = await this.dbService.selectVisits();
    if (existingVisits.length === 0) {
      await this.dbService.insertVisits(sampleVisits);
    }
  }

  async insertVisits(visit) {
  await this.dbService.insertVisits(visit);
  return visit;
}

  async getAllVisits() {
    return await this.dbService.selectVisits();
  }

  async getVisitsByStep(step) {
    const all = await this.dbService.selectVisits();
    return all.filter(v => v.visit_step === step);
  }

  async updateVisitStatus(visit_id, newStatus, newStep) {
    await this.dbService.updateVisitStatus(visit_id, newStatus, newStep);
    return (await this.dbService.selectVisits()).find(v => v.visit_id === visit_id);
  }

  async updateVisitStep(visit_id, newStep) {
    await this.dbService.executeQuery(
      `UPDATE visits SET visit_step = ? WHERE visit_id = ?`,
      [newStep, visit_id]
    );
    return (await this.dbService.selectVisits()).find(v => v.visit_id === visit_id);
  }

async getWaitingRoomPatients() {
  const visits = await this.getVisitsByStep('registration');
  const result = [];

  const filteredVisits = visits.filter(visit => visit.visit_status !== 'discharged');

  for (const visit of filteredVisits) {
    const patientResult = await this.dbService.selectPatientById(visit.patient_id);
    const patient = Array.isArray(patientResult) ? patientResult[0] : patientResult;

    if (patient) {
      patient.visit_id = visit.visit_id;
      patient.visit_date = visit.visit_date;
      patient.visit_start_time = visit.visit_start_time;
      patient.age = calculateAge(patient.birthdate)
      result.push(patient);

      console.log(`Found patient: ${patient.given_name} ${patient.family_name}`);
    } else {
      console.warn(`No patient found for visit ID: ${visit.visit_id}`);
    }
  }
  
  return result;
}

  async getVisitStatistics() {
  
    const visits = await this.dbService.selectVisitWhereStatusNot('discharged');

    const stats = {
      waitingRoom: 0,
      triage: 0,
      primarySurvey: 0,
      total: visits.length,
    };
    
    for (const v of visits) {
      if (v.visit_step === 'registration') stats.waitingRoom++;
      else if (v.visit_step === 'triage') stats.triage++;
      else if (v.visit_step === 'primary-survey') stats.primarySurvey++;
    }

    return stats;
  }


  async getSectionPatients(section) {
    return this.dbService.selectPatientsByVisitStep(section)
      .then(patients => {
        return patients.map(patient => ({
          ...patient,
        }));
      });
  }

  async getUpdatedSince(lastSync) {
      return this.dbService.getUnsyncedVisits(lastSync);
  }
}

export default VisitService;

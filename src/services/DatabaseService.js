import { allSchemas } from '../schemas/index.js';


class DatabaseService {
  constructor(sqlite) {
    this.sqlite = sqlite;
  }



  async executeQuery(sql, bind = {}) {
  const { promiser, dbId } = this.sqlite;

  const { result } = await promiser("exec", {
    dbId,
    sql,
    bind,
    rowMode: "object"

  });
 

  return {
    rows: result?.resultRows ?? [],
  };
} 

async initializeSchema() {

  for (const rawSQL of allSchemas) {
    const statements = rawSQL
      .split(';')
      .map(s => s.trim())
      .filter(Boolean); // filters out empty strings

    for (const sql of statements) {
      console.log('Executing SQL:', JSON.stringify(sql));
      await this.executeQuery(sql + ';',{}); // Ensure semicolon per statement
    }
  }

  console.log('All tables created successfully');
}

  async dropPatientsTable() {

    await this.executeQuery(`DROP TABLE IF EXISTS patients;`);
    console.log('Patients table dropped successfully');
  }

  async insertPatients(patientsData) {
  await this.executeQuery('BEGIN TRANSACTION');
  try {
    for (const patient of patientsData) {
     await this.executeQuery(`
          INSERT INTO patients (
            patient_id, latest_encounter_type, given_name, family_name, aetc_visit_number, birthdateEstimated, gender, birthdate, uuid
          ) VALUES (
            $patient_id, $latest_encounter_type, $given_name, $family_name, $aetc_visit_number, $birthdateEstimated, $gender, $birthdate, $uuid
          )
        `, {
          $patient_id: patient.patient_id,
          $latest_encounter_type: patient.latest_encounter_type,
          $given_name: patient.given_name,
          $family_name: patient.family_name,
          $aetc_visit_number: patient.aetc_visit_number,
          $birthdateEstimated: patient.birthdateEstimated,
          $gender: patient.gender,
          $birthdate: patient.birthdate,
          $uuid: patient.uuid,
        });
    }
    await this.executeQuery('COMMIT');
    console.log(`${patientsData.length} patients inserted successfully`);
  } catch (error) {
    await this.executeQuery('ROLLBACK');
    throw error;
  }
}

  async selectPatients() {

    const {rows} = await this.executeQuery(`
      SELECT *
      FROM patients
      ORDER BY patient_id;
    `);

    const columns = Object.keys(rows[0] || {});
    return rows.map(row => {
      const obj = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });
  }

  async selectPatientById(patientId) {
    const { rows } = await this.executeQuery(`
      SELECT *
      FROM patients
      WHERE patient_id = ?;
    `, [patientId]);

    if (rows.length === 0) return null;
 const columns = Object.keys(rows[0] || {});
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = rows[0][idx];
    });
    return obj;
  }

  async selectPatientsByVisitStep(visitStep) {
    const { rows } = await this.executeQuery(`
      SELECT p.*, v.visit_id, v.visit_status, v.visit_step, v.visit_date, v.visit_start_time
      FROM patients p
      JOIN visits v ON p.patient_id = v.patient_id
      WHERE v.visit_step = ?; `, [visitStep]);

        return rows.map(row => ({ ...row }));
        
  }


  // === VISITS SUPPORT ===

  async dropVisitsTable() {
    const {promiser } = this.sqlite;
    await this.executeQuery(`DROP TABLE IF EXISTS visits;`);
    console.log('Visits table dropped successfully');
  }

  async insertVisits(visitsData) {
  console.log('Inserting visits data:', visitsData);
  try {
    await this.executeQuery('BEGIN TRANSACTION');

    for (const visit of visitsData) {
      await this.executeQuery(`
        INSERT INTO visits (
          visit_id, patient_id, visit_date, visit_start_time, visit_status, visit_step
        ) VALUES (
          $visit_id, $patient_id, $visit_date, $visit_start_time, $visit_status, $visit_step
        )
      `, {
        $visit_id: visit.visit_id,
        $patient_id: visit.patient_id,
        $visit_date: visit.visit_date,
        $visit_start_time: visit.visit_start_time,
        $visit_status: visit.visit_status,
        $visit_step: visit.visit_step,
      });
    }

    await this.executeQuery('COMMIT');
  } catch (error) {
    await this.executeQuery('ROLLBACK');
    throw error;
  }
}

async selectVisits() {

  const { rows } = await this.executeQuery(`
    SELECT *
    FROM visits 
    ORDER BY visit_id;
  `);

   const columns = Object.keys(rows[0] || {});

  return rows.map(row => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

async selectVisitsByStatus(status) {
  const sql = `
    SELECT * FROM visits
    WHERE visit_status = $status;
  `;

  const bind = { $status: status };

  const { rows } = await this.executeQuery(sql, bind);

  return rows.map(row => ({ ...row }));
}



  async updateVisitStatus(visitId, newStatus) {
    await this.executeQuery(`
      UPDATE visits
      SET visit_status = ?
      WHERE visit_id = ?;
    `, [newStatus, visitId]);

    console.log(`Visit ${visitId} updated to status "${newStatus}"`);
  }

  async selectPatientsByVisitStatus(status) {
    const { rows  } = await this.executeQuery(`
      SELECT p.*, v.visit_id, v.visit_status, v.visit_step, v.visit_date, v.visit_start_time
      FROM patients p
      JOIN visits v ON p.patient_id = v.patient_id
      WHERE v.visit_status = ?;
    `, [status]);

    return rows.map(row => ({ ...row }));
  }
}

export default DatabaseService;


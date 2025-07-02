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
            patient_id,
            given_name,
            family_name,
            birthdateEstimated,
            gender,
            birthdate,
            updated_at
          ) VALUES (
            $patient_id,
            $given_name,
            $family_name,
            $birthdateEstimated,
            $gender,
            $birthdate,
            $updated_at
          )
        `, {
          $patient_id: patient.patient_id,
          $given_name: patient.given_name,
          $family_name: patient.family_name,
          $birthdateEstimated: patient.birthdateEstimated,
          $gender: patient.gender,
          $birthdate: patient.birthdate,
          $updated_at: patient.updated_at || new Date().toISOString(),
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

    return rows.map(row => ({ ...row }));
  }

  async selectPatientsByVisitStep(visitStep) {
    const { rows } = await this.executeQuery(`
      SELECT p.*, v.visit_id, v.visit_status, v.visit_step, v.visit_date, v.visit_start_time
      FROM patients p
      JOIN visits v ON p.patient_id = v.patient_id
      WHERE v.visit_step = ?; `, [visitStep]);

        return rows.map(row => ({ ...row }));
        
  }

async getUnsyncedPatients(lastSync) {
  const { rows } = await this.executeQuery(
    `SELECT *
      FROM patients
      WHERE updated_at > ?;
    `,
    [lastSync]
  );

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
          visit_id, patient_id, visit_date, visit_start_time, visit_status, visit_step, updated_at
        ) VALUES (
          $visit_id, $patient_id, $visit_date, $visit_start_time, $visit_status, $visit_step, $updated_at
        )
      `, {
        $visit_id: visit.visit_id,
        $patient_id: visit.patient_id,
        $visit_date: visit.visit_date,
        $visit_start_time: visit.visit_start_time,
        $visit_status: visit.visit_status,
        $visit_step: visit.visit_step,
        $updated_at: visit.updated_at || new Date().toISOString(),
      });
    }

    await this.executeQuery('COMMIT');
    console.log(`${visitsData.length} visits inserted successfully`);
  } catch (error) {
    await this.executeQuery('ROLLBACK');
    console.error('Failed to insert visits:', error);
    throw error;
  }
}

async selectVisits() {

  const { rows } = await this.executeQuery(`
    SELECT *
    FROM visits 
    ORDER BY visit_id;
  `);

   return rows.map(row => ({ ...row }));
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

async selectVisitWhereStatusNot(status) {
   const sql = `
    SELECT * FROM visits
    WHERE visit_status != $status;
  `;

  const bind = { $status: status };

  const { rows } = await this.executeQuery(sql, bind);

  return rows.map(row => ({ ...row }));
}



  async updateVisitStatus(visitId, newStatus, newStep = null) {
  if (newStep !== null) {
    await this.executeQuery(`
      UPDATE visits
      SET visit_status = ?, visit_step = ?
      WHERE visit_id = ?;
    `, [newStatus, newStep, visitId]);

    console.log(`Visit ${visitId} updated to status "${newStatus}" and step "${newStep}"`);
  } else {
    await this.executeQuery(`
      UPDATE visits
      SET visit_status = ?
      WHERE visit_id = ?;
    `, [newStatus, visitId]);

    console.log(`Visit ${visitId} updated to status "${newStatus}"`);
  }
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

  async getUnsyncedVisits(lastSync) {
      const { rows } = await this.executeQuery(
        `SELECT *
        FROM visits
        WHERE datetime(updated_at) > datetime(?);`,
        [lastSync]
      );

      return rows.map(row => ({ ...row }));
    }
}

export default DatabaseService;


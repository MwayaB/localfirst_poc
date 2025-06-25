CREATE TABLE IF NOT EXISTS visits (
  visit_id INTEGER PRIMARY KEY,
  patient_id INTEGER,
  visit_date TEXT,
  visit_start_time TEXT,
  visit_status TEXT,
  visit_step TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);
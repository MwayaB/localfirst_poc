CREATE TABLE IF NOT EXISTS patients (
  patient_id INTEGER PRIMARY KEY,
  latest_encounter_type TEXT,
  given_name TEXT NOT NULL,
  family_name TEXT NOT NULL,
  aetc_visit_number TEXT,
  birthdateEstimated INTEGER DEFAULT 0,
  gender TEXT,
  birthdate TEXT,
  uuid TEXT UNIQUE,
  visit_uuid TEXT,
  arrival_time TEXT,
  triage_result TEXT,
  latest_encounter_time TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);
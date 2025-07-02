CREATE TABLE IF NOT EXISTS patients (
  patient_id INTEGER PRIMARY KEY,
  given_name TEXT NOT NULL,
  family_name TEXT NOT NULL,
  birthdateEstimated INTEGER DEFAULT 0,
  gender TEXT,
  birthdate TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);
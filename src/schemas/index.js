import patientsSQL from './patients.sql?raw';
import visitsSQL from './visits.sql?raw';

export const allSchemas = [
  patientsSQL,
  visitsSQL,
];

  console.log('Schema count:', allSchemas.length);
console.log('Schema contents:', allSchemas.map(s => s.slice(0, 100)));
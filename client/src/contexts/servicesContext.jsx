import { createContext, useMemo } from 'react';
import DatabaseService from '../services/DatabaseService';
import PatientService from '../services/PatientService';
import VisitService from '../services/VisitService';
import SyncService from '../services/SyncService'; // ✅ import
import sqlite from '../db';

export const ServicesContext = createContext(null);

export const ServicesProvider = ({ children }) => {
  const value = useMemo(() => {
    const databaseService = new DatabaseService(sqlite);
    const patientService = new PatientService(databaseService);
    const visitService = new VisitService(databaseService);
    const syncService = new SyncService(patientService, visitService); // ✅ instantiate

    return {
      databaseService,
      patientService,
      visitService,
      syncService, // ✅ add to context
    };
  }, []);

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
};
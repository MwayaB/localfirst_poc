import { createContext, useEffect, useMemo } from 'react';
import DatabaseService from '../services/DatabaseService';
import PatientService from '../services/PatientService';
import VisitService from '../services/VisitService';
import SyncService from '../services/SyncService';
import sqlite from '../db';

export const ServicesContext = createContext(null);

export const ServicesProvider = ({ children }) => {
  const value = useMemo(() => {
    const databaseService = new DatabaseService(sqlite);
    const patientService = new PatientService(databaseService);
    const visitService = new VisitService(databaseService);
    const syncService = new SyncService(patientService, visitService);

    return { databaseService, patientService, visitService, syncService };
  }, []);

  useEffect(() => {
    value.syncService.connectToSSE();
  }, [value.syncService]);

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
};
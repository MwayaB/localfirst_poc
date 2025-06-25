import { createContext, useMemo } from 'react';
import DatabaseService from '../services/DatabaseService';
import PatientService from '../services/PatientService';
import VisitService from '../services/VisitService';
import sqlite from '../db';

export const ServicesContext = createContext(null);

export const ServicesProvider = ({ children }) => {
  const value = useMemo(() => {
    const databaseService = new DatabaseService(sqlite);
    const patientService = new PatientService(databaseService);
    const visitService = new VisitService(databaseService);

    return { databaseService, patientService, visitService };
  }, []);

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
};
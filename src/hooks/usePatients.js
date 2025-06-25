import { useMutation } from '@tanstack/react-query';

export const useSeedPatients = (patientService) =>
  useMutation({
    mutationFn: () => {
      if (!patientService) {
        throw new Error('Patient service not initialized');
      }
      return patientService.seedSamplePatients();
    },
  });

export const useInitializeSchema = (patientService) =>
  useMutation({
    mutationFn: () => {
      if (!patientService) {
        throw new Error('Patient service not initialized');
      }
      return patientService.initializeSchema();
    },
  });
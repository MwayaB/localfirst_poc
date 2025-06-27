import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from './useServices';


export const useSeedPatients = () => {
  const { patientService } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!patientService) {
        throw new Error('Patient service not initialized');
      }
      return patientService.seedSamplePatients();
    },
    onSuccess: () => {
      
      queryClient.invalidateQueries({ queryKey: ['visit-stats'] });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['waiting-room-list'] });
      queryClient.invalidateQueries({ queryKey: ['triage-list'] });

    },
  });
};

export const useAddPatient = () => {
  const { patientService, syncService } = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patientData) => {
      if (!patientService) {
        throw new Error('Patient service not initialized');
      }

      const flattenedPatient = {
        ...patientData[0],
        updated_at: new Date().toISOString(),
      };

      await patientService.insertPatients([flattenedPatient]);


      try {
        await syncService.sync();
      } catch (err) {
        console.error('Sync failed:', err);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-room-list'] });
      queryClient.invalidateQueries({ queryKey: ['triage-list'] });
    },
  });
};

export const useInitializeSchema = () => {
  const { patientService } = useServices();

  return useMutation({
    mutationFn: async () => {
      if (!patientService) {
        throw new Error('Patient service not initialized');
      }
      return patientService.initializeSchema();
    },
  });
};
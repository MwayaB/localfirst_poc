import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from './useServices';
import SyncService from '../services/SyncService';

export const useSyncMutation = () => {
  const { patientService, visitService } = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!patientService || !visitService) {
        throw new Error('Required services not available');
      }

      const syncService = new SyncService(patientService, visitService);
      await syncService.sync();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['visit-stats'] });
      queryClient.invalidateQueries({ queryKey: ['waiting-room-list'] });
      queryClient.invalidateQueries({ queryKey: ['triage-list'] });
    },
  });
};
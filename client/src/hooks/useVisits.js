import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from './useServices'; 


export const useVisitStats = () => {
const { visitService } = useServices();
  return useQuery({
    queryKey: ['visit-stats'],
    queryFn: () => {
      if (!visitService) throw new Error('Visit service not initialized');
      return visitService.getVisitStatistics();
    },
    enabled: !!visitService,
  });
};

export const useSeedVisits = () => {
const { visitService } = useServices();
  return useMutation({
    mutationFn: () => {
      if (!visitService) throw new Error('Visit service not initialized');
      return visitService.seedSampleVisits();
    },
  });
};

export const useVisitsByStep = (step) => {
  const { visitService } = useServices();
  return useQuery({
    queryKey: ['visits', step],
    queryFn: () => {
      if (!visitService) throw new Error('Visit service not initialized');
      return visitService.getVisitsByStep(step);
    },
    enabled: !!visitService,
  });
};

export const useGetWaitingRoomList = () => {
  const { visitService } = useServices();

  return useQuery({
    queryKey: ['waiting-room-list'],
    queryFn: async () => {
      if (!visitService) throw new Error('Visit service not initialized');
      const list = visitService.getWaitingRoomPatients();
      return list;
    },
    enabled: !!visitService,
  });
};

export const useGetSectionPatients = (section) =>{
    const { visitService } = useServices();

  return useQuery({
    queryKey: [`${section}-list`],
    queryFn: async () => {
      if (!visitService) throw new Error('Visit service not initialized');
      const list = visitService.getSectionPatients(section);
      return list;
    },
    enabled: !!visitService,
  });
}

export const useAddVisit = () => {
  const { visitService, syncService } = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newVisitData) => {
      const visit = Array.isArray(newVisitData) ? newVisitData[0] : newVisitData;

      const timestampedVisit = {
        ...visit,
        updated_at: new Date().toISOString(),
      };

      await visitService.insertVisits([timestampedVisit]);

      try {
        await syncService.sync();
      } catch (err) {
        console.error('Sync failed:', err);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-stats'] });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['waiting-room-list'] });
      queryClient.invalidateQueries({ queryKey: ['triage-list'] });
    },
  });
};

export const useUpdateVisitStatus = () => {
  const { visitService } = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ visitId, newStatus, newStep }) => {
      if (!visitService) throw new Error('Visit service not initialized');
      debugger;
      return visitService.updateVisitStatus(visitId, newStatus, newStep);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-stats'] });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['waiting-room-list'] });
      queryClient.invalidateQueries({ queryKey: ['triage-list'] });
    },
  });
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from '../contexts/servicesContext';

const { visitService } = useServices();

export const useVisitStats = () =>
  useQuery({
    queryKey: ['visit-stats'],
    queryFn: () => {
      if (!visitService) {
        throw new Error('Visit service not initialized');
      }
      return visitService.getVisitStatistics();
    },
    enabled: !!visitService, 
  });

export const useSeedVisits = () =>
  useMutation({
    mutationFn: () => {
      if (!visitService) {
        throw new Error('Visit service not initialized');
      }
      return visitService.seedSampleVisits();
    },
  });

export const useVisitsByStep = (step) =>
  useQuery({
    queryKey: ['visits', step],
    queryFn: () => {
      if (!visitService) {
        throw new Error('Visit service not initialized');
      }
      return visitService.getVisitsByStep(step);
    },
    enabled: !!visitService, 
  });
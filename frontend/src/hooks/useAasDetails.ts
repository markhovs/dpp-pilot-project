import { useQuery } from '@tanstack/react-query';
import { AasService } from '../client';

function useAasDetails(aasId: string) {
  return useQuery({
    queryKey: ['aasDetails', aasId],
    queryFn: () => AasService.getAas({ aasId }),
    enabled: !!aasId,
  });
}

export default useAasDetails;

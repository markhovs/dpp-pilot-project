import { useQuery } from "@tanstack/react-query";
import { AasService } from "../client";

const useAasDetails = (aasId: string) => {
  return useQuery({
    queryKey: ["aas", aasId],
    queryFn: async (): Promise<any> => {
      try {
        const response = await AasService.getAas({ aasId });
        if (!response || typeof response !== "object") throw new Error("Invalid response format");
        return response; // No strict typing, fully flexible
      } catch (error) {
        console.error("Failed to fetch AAS details:", error);
        throw error;
      }
    },
    refetchOnMount: true, // Ensures fresh data on every mount
    refetchOnWindowFocus: true, // Refetch when user returns to the page
  });
};

export default useAasDetails;

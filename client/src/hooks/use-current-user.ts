import { useQuery } from "@tanstack/react-query";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  userType: 'freelancer' | 'client';
}

export function useCurrentUser() {
  return useQuery<CurrentUser>({
    queryKey: ["/api/auth/me"],
    retry: 1, // Allow one retry for better reliability
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchInterval: false,
    // Add error handling for better debugging
    meta: {
      errorMessage: "Failed to fetch user authentication"
    }
  });
}
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
    retry: 2, // Allow more retries for authentication
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true, // Refetch when user comes back to window  
    refetchOnMount: true,
    refetchInterval: false,
    // Custom query function to handle authentication properly
    queryFn: async () => {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Always include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        // Return null for unauthenticated users rather than throwing
        return null;
      }

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      // Return the user object from the response
      return data.user;
    },
    // Add error handling for better debugging
    meta: {
      errorMessage: "Failed to fetch user authentication"
    }
  });
}
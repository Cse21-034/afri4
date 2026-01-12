import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  email: string;
  role: string;
  companyName?: string;
  contactPersonName: string;
  subscriptionStatus: string;
  emailVerified: boolean;
}

interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export function useAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    enabled: Boolean(localStorage.getItem('auth_token')), // Re-enable session hydration
    select: (data: any) => data?.user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      return response.json();
    },
    onSuccess: (data: AuthResponse) => {
      localStorage.setItem('auth_token', data.token);
      queryClient.setQueryData(['/api/auth/me'], { user: data.user });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Success",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { type: 'trucking' | 'shipping'; userData: any }) => {
      const endpoint = data.type === 'trucking' 
        ? '/api/auth/register/trucking' 
        : '/api/auth/register/shipping';
      const response = await apiRequest('POST', endpoint, data.userData);
      return response.json();
    },
    onSuccess: (data: { message: string }) => {
      toast({
        title: "Success",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logout = () => {
    localStorage.removeItem('auth_token');
    queryClient.setQueryData(['/api/auth/me'], null);
    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    window.location.href = '/';
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
  };
}

import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { getUserData, loginUserData, registerUserData } from "@/lib/types";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: getUserData | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<getUserData, Error, loginUserData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<getUserData, Error, registerUserData>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<getUserData | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: loginUserData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: getUserData) => {
      queryClient.setQueryData(["/api/user"], user);
      // Invalidate all related queries to ensure fresh data is fetched
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-sports-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/browse-sports-groups"] });
      toast({
        title: "Success!",
        description: `Welcome back, ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: registerUserData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user: getUserData) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Success!",
        description: `Welcome to PlayPals, ${user.name}! Let's set up your sports preferences.`,
      });
      // Use a more reliable method for navigation by using window.location directly
      console.log("Registration successful, redirecting to sports preferences");
      // Use a timeout to ensure the toast is displayed and data is properly set
      setTimeout(() => {
        window.location.href = '/sports-preferences';
      }, 300);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
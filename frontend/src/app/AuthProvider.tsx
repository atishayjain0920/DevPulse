import { createContext, PropsWithChildren, useContext } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "./api";
import { LoadingState } from "../components/ui";

export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  role: "Developer" | "Team Lead" | "Administrator";
  organizationId: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const me = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api<{ user: AuthUser }>("/auth/me"),
    retry: false
  });
  const logoutMutation = useMutation({
    mutationFn: () => api<{ loggedOut: boolean }>("/auth/logout", { method: "POST" }),
    onSettled: () => queryClient.clear()
  });

  return (
    <AuthContext.Provider value={{ user: me.data?.user ?? null, isLoading: me.isLoading, logout: () => logoutMutation.mutateAsync().then(() => undefined) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <LoadingState label="Validating session" />;
  if (!user) return <Navigate to="/welcome" replace state={{ from: location }} />;
  return children;
}

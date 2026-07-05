import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../app/api";
import { LoadingState } from "../components/ui";

export function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");
    if (!code || !state) {
      navigate("/login", { replace: true });
      return;
    }
    api(`/auth/github/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`)
      .then(() => queryClient.invalidateQueries({ queryKey: ["auth", "me"] }))
      .then(() => navigate("/dashboard", { replace: true }))
      .catch(() => navigate("/login", { replace: true }));
  }, [navigate, params, queryClient]);

  return <LoadingState label="Completing GitHub sign in" />;
}

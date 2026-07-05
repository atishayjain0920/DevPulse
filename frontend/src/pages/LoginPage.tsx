import { Github, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { API_URL, api } from "../app/api";
import { Button, Card } from "../components/ui";

type GitHubAuth = { authorizationUrl: string };

export function LoginPage() {
  const login = useMutation({
    mutationFn: () => api<GitHubAuth>("/auth/github"),
    onSuccess: (data) => {
      window.location.href = data.authorizationUrl.startsWith("http") ? data.authorizationUrl : `${API_URL}${data.authorizationUrl}`;
    }
  });

  return (
    <div className="auth-page compact">
      <Card title="Sign in to DevPulse">
        <p>Use GitHub OAuth to connect your account and start repository synchronization.</p>
        <Button onClick={() => login.mutate()} disabled={login.isPending}>
          {login.isPending ? <Loader2 className="spin" size={18} /> : <Github size={18} />}
          Continue with GitHub
        </Button>
        {login.error && <p className="error">{login.error.message}</p>}
      </Card>
    </div>
  );
}

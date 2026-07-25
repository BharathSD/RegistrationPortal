import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy } from "lucide-react";
import { Button, Card } from "../../design-system";
import { Input } from "../../design-system/components/Field";
import { useAdminLogin } from "../../lib/api/auth";
import { useAuthStore } from "../../lib/hooks/useAuthStore";
import { useToast } from "../../design-system/components/Toast";
import { ApiError } from "../../lib/api/client";

export function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const adminLogin = useAdminLogin();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await adminLogin.mutateAsync({ email, password });
      setTokens(result.accessToken, result.refreshToken);
      setSession({ type: "ADMIN", profile: result.admin });
      const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? "/admin";
      navigate(redirectTo || "/admin");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 sm:py-24">
      <div className="mb-4 w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>
      </div>
      <Card className="w-full max-w-sm" variant="raised">
        <div className="mb-5 flex flex-col items-center gap-2 text-center">
          <Trophy className="h-8 w-8 text-gold" />
          <h1 className="font-display text-xl font-bold">Organizer Sign In</h1>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" size="lg" loading={adminLogin.isPending}>
            Sign in
          </Button>
        </form>
      </Card>
    </div>
  );
}

import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { IdCard, ShieldCheck, Trophy, Zap } from "lucide-react";
import { Card } from "../../design-system";
import { OtpGate } from "../auth-otp/OtpGate";
import { useAuthStore } from "../../lib/hooks/useAuthStore";
import { StadiumBackdrop } from "../../components/ui/StadiumBackdrop";

const FEATURES = [
  { icon: ShieldCheck, text: "Verified player identity" },
  { icon: IdCard, text: "Digital player card & QR" },
  { icon: Zap, text: "One-tap tournament entry" },
];

/**
 * The single re-entry point for anyone who already registered. One mobile +
 * OTP check establishes a real session (JWT access/refresh pair) — from
 * here on, the dashboard and tournament registration use that session
 * directly. Nothing past this page should ever ask for OTP again.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setSession = useAuthStore((s) => s.setSession);

  return (
    <div className="grid lg:min-h-[75vh] lg:grid-cols-2">
      {/* Hero panel — stadium-lights branding, hidden of its bulk on very small screens */}
      <div className="relative isolate flex flex-col justify-between overflow-hidden bg-pitch px-8 py-12 text-white sm:px-12 lg:py-16">
        <StadiumBackdrop />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
          className="relative z-10 flex items-center gap-2 font-display text-lg font-bold"
        >
          <Trophy className="h-6 w-6 text-gold" aria-hidden="true" />
          Aviyukthas Player Hub
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, delay: 0.05, ease: [0.2, 0, 0, 1] }}
          className="relative z-10 flex flex-col gap-6"
        >
          <div>
            <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              Welcome back,
              <br />
              champion.
            </h1>
            <p className="mt-3 max-w-sm text-white/75">
              Log in with your verified mobile number to reach your player card, your tournament history, and every
              open tournament — no re-entering your details.
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Icon className="h-4 w-4 text-gold" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </motion.div>

        <p className="relative z-10 text-xs text-white/50">One identity. Every tournament.</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-canvas px-4 py-12 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
          className="w-full max-w-sm"
        >
          <Card variant="raised">
            <OtpGate
              purpose="LOGIN"
              title="Player Login"
              subtitle="Log in with your registered mobile number."
              onVerified={(result) => {
                setTokens(result.accessToken);
                setSession({ type: "PLAYER", profile: result.player });
                const redirectTo = (location.state as { from?: Location })?.from?.pathname;
                navigate(redirectTo || "/dashboard", { replace: true });
              }}
            />
          </Card>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Don't have an account yet?{" "}
            <Link to="/register" className="font-medium text-primary underline">
              Register as a player
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-text-secondary">
            Tournament admin?{" "}
            <Link to="/admin/login" className="font-medium text-primary underline">
              Sign in here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

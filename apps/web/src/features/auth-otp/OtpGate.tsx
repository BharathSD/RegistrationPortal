import { useEffect, useRef, useState } from "react";
import type { OtpPurpose } from "@cricket-platform/shared";
import { MOBILE_REGEX } from "@cricket-platform/shared";
import { Button } from "../../design-system";
import { Input } from "../../design-system/components/Field";
import { useRequestOtp, useVerifyOtp, type VerifyOtpResponse } from "../../lib/api/auth";
import { ApiError } from "../../lib/api/client";
import { useToast } from "../../design-system/components/Toast";

const RESEND_COOLDOWN = 30;

interface OtpGateProps {
  purpose: OtpPurpose;
  title: string;
  subtitle?: string;
  onVerified: (result: VerifyOtpResponse, mobile: string) => void;
}

export function OtpGate({ purpose, title, subtitle, onVerified }: OtpGateProps) {
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("+91");
  const [mobileError, setMobileError] = useState<string | undefined>();
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [codeError, setCodeError] = useState<string | undefined>();
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | undefined>();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const toast = useToast();

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function sendOtp() {
    setMobileError(undefined);
    if (!MOBILE_REGEX.test(mobile)) {
      setMobileError("Enter a valid mobile number, e.g. +919876543210");
      return;
    }
    try {
      const result = await requestOtp.mutateAsync({ mobile, purpose });
      setStep("otp");
      setCooldown(RESEND_COOLDOWN);
      setDevCode(result.devCode);
      if (result.devCode) {
        // Dev mode only (see RequestOtpUseCase.ts): no real SMS provider is
        // configured, so the API hands the code straight back instead of
        // requiring someone to tail the server's console output.
        toast.info(`Dev mode — no SMS sent. Your code is ${result.devCode}`);
      } else {
        toast.success("Code sent! Check your messages.");
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }

  function autofillDevCode() {
    if (!devCode) return;
    setCode(devCode.split(""));
    void submitCode(devCode);
  }

  function handleDigitChange(index: number, digit: string) {
    if (!/^\d?$/.test(digit)) return;
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (next.every((d) => d) && next.join("").length === 6) {
      void submitCode(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function submitCode(fullCode: string) {
    setCodeError(undefined);
    try {
      const result = await verifyOtp.mutateAsync({ mobile, code: fullCode, purpose });
      onVerified(result, mobile);
    } catch (err) {
      if (err instanceof ApiError) {
        setCodeError(err.message);
        setCode(Array(6).fill(""));
        inputRefs.current[0]?.focus();
      }
    }
  }

  if (step === "mobile") {
    return (
      <div className="mx-auto flex max-w-sm flex-col gap-4 text-center">
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
        <div className="text-left">
          <Input
            label="Mobile number"
            required
            type="tel"
            inputMode="tel"
            value={mobile}
            error={mobileError}
            onChange={(e) => setMobile(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendOtp()}
          />
        </div>
        <Button size="lg" loading={requestOtp.isPending} onClick={sendOtp}>
          Send OTP
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 text-center">
      <h1 className="font-display text-2xl font-bold">Verify your number</h1>
      <p className="text-sm text-text-secondary">
        We sent a code to <span className="font-medium text-text-primary">{mobile}</span>
      </p>
      {devCode && (
        <div className="flex flex-col items-center gap-2 rounded-sm border border-warning/30 bg-warning/5 px-3 py-2 text-sm">
          <p className="text-warning">
            Dev mode — no real SMS was sent. Your code is <span className="font-semibold tabular-nums">{devCode}</span>
          </p>
          <button onClick={autofillDevCode} className="font-medium text-primary underline">
            Autofill it for me
          </button>
        </div>
      )}
      <div className="flex gap-2" role="group" aria-label="One-time password">
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            value={digit}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            inputMode="numeric"
            maxLength={1}
            aria-label={`Digit ${i + 1} of 6`}
            className="h-12 w-10 rounded-sm border border-border bg-surface text-center text-lg font-semibold tabular-nums focus-visible:border-primary"
          />
        ))}
      </div>
      {codeError && (
        <p role="alert" className="text-sm text-danger">
          {codeError}
        </p>
      )}
      {verifyOtp.isPending && <p className="text-sm text-text-secondary">Verifying...</p>}
      <button
        disabled={cooldown > 0}
        onClick={sendOtp}
        className="text-sm font-medium text-primary disabled:text-text-secondary"
      >
        {cooldown > 0 ? `Resend code in 00:${String(cooldown).padStart(2, "0")}` : "Resend code"}
      </button>
      <button
        onClick={() => {
          setStep("mobile");
          setDevCode(undefined);
          setCode(Array(6).fill(""));
        }}
        className="text-xs text-text-secondary underline"
      >
        Change mobile number
      </button>
    </div>
  );
}

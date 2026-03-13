"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { QUERY_KEYS, ROUTES } from "@/lib/constants";
import {
  registerSchema,
  type RegisterInput,
} from "@/lib/validations/auth.schema";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { OtpBox } from "@/components/auth/OtpBox";
import { OtpTimer } from "@/components/auth/OtpTimer";
import Link from "next/link";

// ─── Step 1: Registration Form ─────────────────────────────────────────────────

interface RegisterFormProps {
  onSuccess: (email: string) => void;
}

function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const password = watch("password", "");

  const onSubmit = async (data: RegisterInput) => {
    setApiError("");
    try {
      await authService.register({
        name:     data.name,
        email:    data.email,
        password: data.password,
        phone:    data.phone || undefined,
      });
      toast.success("Account created! Verify OTP to continue.");
      onSuccess(data.email);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setApiError(
        msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exist")
          ? "An account with this email already exists. Try signing in."
          : msg
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {apiError && <Alert variant="error" message={apiError} />}

      <Input
        label="Your name"
        type="text"
        autoComplete="name"
        placeholder="First and last name"
        error={errors.name?.message}
        {...register("name")}
      />

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <Input
        label="Mobile number (optional)"
        type="tel"
        autoComplete="tel"
        placeholder="10-digit mobile number"
        error={errors.phone?.message}
        {...register("phone")}
      />

      <div>
        <PasswordInput
          label="Password"
          id="register-password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          hint="Must contain uppercase letter and number"
          {...register("password")}
        />
        <PasswordStrength password={password} />
      </div>

      <PasswordInput
        label="Re-enter password"
        id="register-confirm-password"
        autoComplete="new-password"
        placeholder="Confirm your password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <Button type="submit" fullWidth loading={isSubmitting} className="btn-amazon !rounded-lg">
        Create your Amazon account
      </Button>

      <p className="text-xs text-[var(--amazon-text-muted)] leading-relaxed">
        By creating an account, you agree to Amazon&apos;s{" "}
        <Link href="/conditions" className="amazon-link">Conditions of Use</Link>{" "}
        and{" "}
        <Link href="/privacy" className="amazon-link">Privacy Notice</Link>.
      </p>
    </form>
  );
}

// ─── Step 2: Email OTP Verification ───────────────────────────────────────────

interface VerifyOtpStepProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

function VerifyOtpStep({ email, onSuccess, onBack }: VerifyOtpStepProps) {
  const { setUser } = useAuthStore();
  const qc = useQueryClient();
  const [otp, setOtp] = useState("");
  const [apiError, setApiError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyOtp = async () => {
    setApiError("");
    if (otp.length < 6) { setApiError("Please enter the complete 6-digit OTP"); return; }
    setIsVerifying(true);
    try {
      const res = await authService.verifyOtp({ email, otp, purpose: "REGISTER" });
      const user = res.data.data;
      setUser(user);
      qc.setQueryData(QUERY_KEYS.ME, user);
      toast.success("OTP verified! Welcome to Amazon.");
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setOtp("");
      setApiError(
        msg.toLowerCase().includes("expired")
          ? "OTP has expired. Please request a new one."
          : "Invalid OTP. Check your email and try again."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const resendOtp = async () => {
    await authService.sendOtp({ email, purpose: "REGISTER" });
    toast.success("A new OTP has been sent");
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-[var(--amazon-text-primary)]">Verify OTP</h2>
        <p className="text-sm text-[var(--amazon-text-muted)] mt-1">
          Enter the 6-digit OTP for <span className="font-semibold text-[var(--amazon-text-primary)]">{email}</span>
        </p>
      </div>

      {apiError && <Alert variant="error" message={apiError} />}

      <div className="space-y-2">
        <label className="form-label text-center block">Enter OTP</label>
        <OtpBox value={otp} onChange={setOtp} />
      </div>

      <Button fullWidth loading={isVerifying} onClick={verifyOtp} className="btn-amazon !rounded-lg">
        Verify OTP
      </Button>

      <OtpTimer onResend={resendOtp} />

      <button type="button" className="amazon-link text-sm w-full text-center block" onClick={onBack}>
        ← Back to registration
      </button>
    </div>
  );
}

// ─── Register Page ─────────────────────────────────────────────────────────────

type Step = "register" | "verify";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[320px]" />}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
  const [step, setStep] = useState<Step>("register");
  const [email, setEmail] = useState("");
  const [stepError, setStepError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? ROUTES.HOME;

  const handleRegistered = async (registeredEmail: string) => {
    setStepError("");
    setEmail(registeredEmail);
    try {
      await authService.sendOtp({ email: registeredEmail, purpose: "REGISTER" });
      toast.success("Verification OTP sent");
      setStep("verify");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP";
      setStepError(msg);
      toast.error(msg);
    }
  };

  const handleVerified = () => router.push(redirect);

  return (
    <>
      {step === "register" ? (
        <>
          <h1 className="text-2xl font-semibold text-[var(--amazon-text-primary)] mb-5">Create account</h1>
          {stepError && <Alert variant="error" message={stepError} />}
          <RegisterForm onSuccess={handleRegistered} />
          <div className="amazon-divider my-5">already have an account?</div>
          <Link
            href={`${ROUTES.LOGIN}${redirect !== ROUTES.HOME ? `?redirect=${redirect}` : ""}`}
            className="block text-center"
          >
            <Button variant="outline" fullWidth>Sign in</Button>
          </Link>
        </>
      ) : (
        <VerifyOtpStep
          email={email}
          onSuccess={handleVerified}
          onBack={() => setStep("register")}
        />
      )}
    </>
  );
}

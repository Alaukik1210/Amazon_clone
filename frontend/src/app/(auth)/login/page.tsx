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
  passwordLoginSchema,
  otpRequestSchema,
  otpVerifyLoginSchema,
  type PasswordLoginInput,
  type OtpRequestInput,
  type OtpVerifyLoginInput,
} from "@/lib/validations/auth.schema";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { OtpBox } from "@/components/auth/OtpBox";
import { OtpTimer } from "@/components/auth/OtpTimer";
import Link from "next/link";

// ─── Password Login Tab ────────────────────────────────────────────────────────

function PasswordLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { setUser } = useAuthStore();
  const qc = useQueryClient();
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordLoginInput>({ resolver: zodResolver(passwordLoginSchema) });

  const onSubmit = async (data: PasswordLoginInput) => {
    setApiError("");
    try {
      const res = await authService.login(data);
      const user = res.data.data;
      setUser(user);
      qc.setQueryData(QUERY_KEYS.ME, user); // hydrate the ME cache
      toast.success(`Welcome back, ${user.name?.split(" ")[0] ?? "there"}!`);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed. Please try again.";
      // Show specific messages for common errors
      setApiError(
        msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("password")
          ? "Incorrect email or password."
          : msg
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {apiError && <Alert variant="error" message={apiError} />}

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <PasswordInput
        label="Password"
        id="password-login"
        autoComplete="current-password"
        placeholder="Enter your password"
        error={errors.password?.message}
        {...register("password")}
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input type="checkbox" className="w-4 h-4 accent-[var(--amazon-orange)]" />
          Keep me signed in
        </label>
        <Link href="/forgot-password" className="amazon-link text-sm">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" fullWidth loading={isSubmitting} className="btn-amazon !rounded-lg">
        Sign in
      </Button>
    </form>
  );
}

// ─── OTP Login Tab ─────────────────────────────────────────────────────────────

type OtpStep = "email" | "verify";

function OtpLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { setUser } = useAuthStore();
  const qc = useQueryClient();
  const [step, setStep] = useState<OtpStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [apiError, setApiError] = useState("");

  const emailForm = useForm<OtpRequestInput>({ resolver: zodResolver(otpRequestSchema) });
  const verifyForm = useForm<OtpVerifyLoginInput>({ resolver: zodResolver(otpVerifyLoginSchema) });

  const sendOtp = async (data: OtpRequestInput) => {
    setApiError("");
    try {
      await authService.sendOtp({ email: data.email, purpose: "LOGIN" });
      setEmail(data.email);
      setStep("verify");
      toast.success("OTP sent successfully");
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Failed to send OTP");
    }
  };

  const verifyOtp = async () => {
    setApiError("");
    if (otp.length < 6) {
      setApiError("Please enter the complete 6-digit OTP");
      return;
    }
    try {
      const res = await authService.verifyOtp({ email, otp, purpose: "LOGIN" });
      const user = res.data.data;
      setUser(user);
      qc.setQueryData(QUERY_KEYS.ME, user);
      toast.success(`Welcome back, ${user.name?.split(" ")[0] ?? "there"}!`);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid or expired OTP";
      setOtp(""); // clear OTP on failure so user re-enters
      setApiError(msg.toLowerCase().includes("expired") ? "OTP has expired. Please request a new one." : msg);
    }
  };

  const resendOtp = async () => {
    await authService.sendOtp({ email, purpose: "LOGIN" });
    toast.success("A new OTP has been sent");
  };

  if (step === "email") {
    return (
      <form onSubmit={emailForm.handleSubmit(sendOtp)} noValidate className="space-y-4">
        {apiError && <Alert variant="error" message={apiError} />}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={emailForm.formState.errors.email?.message}
          {...emailForm.register("email")}
        />
        <Button type="submit" fullWidth loading={emailForm.formState.isSubmitting} className="btn-amazon !rounded-lg">
          Send OTP
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      {apiError && <Alert variant="error" message={apiError} />}
      <Alert
        variant="info"
        message={`Enter the 6-digit OTP for ${email}.`}
      />
      <div className="space-y-3">
        <label className="form-label text-center block">Enter OTP</label>
        <OtpBox value={otp} onChange={setOtp} error={otp.length > 0 && otp.length < 6 ? "Enter all 6 digits" : undefined} />
      </div>
      <Button
        fullWidth
        loading={verifyForm.formState.isSubmitting}
        onClick={verifyOtp}
        className="btn-amazon !rounded-lg"
      >
        Verify &amp; Sign in
      </Button>
      <OtpTimer onResend={resendOtp} />
      <button
        type="button"
        className="amazon-link text-sm w-full text-center block"
        onClick={() => { setStep("email"); setApiError(""); setOtp(""); }}
      >
        ← Change email
      </button>
    </div>
  );
}

// ─── Login Page ─────────────────────────────────────────────────────────────

type Tab = "password" | "otp";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[320px]" />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const [tab, setTab] = useState<Tab>("password");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? ROUTES.HOME;

  const handleSuccess = () => router.push(redirect);

  return (
    <>
      <h1 className="text-2xl font-semibold text-[var(--amazon-text-primary)] mb-5">Sign in</h1>

      {/* Tab switcher */}
      <div className="flex border-b border-[var(--amazon-border)] mb-5">
        {(["password", "otp"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`tab-btn flex-1 ${tab === t ? "active" : ""}`}
          >
            {t === "password" ? "Password" : "One-time password"}
          </button>
        ))}
      </div>

      {tab === "password" ? (
        <PasswordLoginForm onSuccess={handleSuccess} />
      ) : (
        <OtpLoginForm onSuccess={handleSuccess} />
      )}

      <div className="amazon-divider my-5">or</div>

      <p className="text-center text-sm">
        New to Amazon?{" "}
        <Link href={`${ROUTES.REGISTER}${redirect !== ROUTES.HOME ? `?redirect=${redirect}` : ""}`} className="amazon-link font-semibold">
          Create your Amazon account
        </Link>
      </p>
    </>
  );
}

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
  type PasswordLoginInput,
} from "@/lib/validations/auth.schema";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { PasswordInput } from "@/components/auth/PasswordInput";
import Link from "next/link";

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
      qc.setQueryData(QUERY_KEYS.ME, user);
      toast.success(`Welcome back, ${user.name?.split(" ")[0] ?? "there"}!`);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed. Please try again.";
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[320px]" />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? ROUTES.HOME;

  const handleSuccess = () => router.push(redirect);

  return (
    <>
      <h1 className="text-2xl font-semibold text-[var(--amazon-text-primary)] mb-5">Sign in</h1>

      <PasswordLoginForm onSuccess={handleSuccess} />

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

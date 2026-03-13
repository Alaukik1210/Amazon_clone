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
import Link from "next/link";

interface RegisterFormProps {
  onSuccess: () => void;
}

function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { setUser } = useAuthStore();
  const qc = useQueryClient();
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
      const res = await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
      });

      const user = res.data.data;
      setUser(user);
      qc.setQueryData(QUERY_KEYS.ME, user);
      toast.success(`Welcome, ${user.name?.split(" ")[0] ?? "there"}!`);
      onSuccess();
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[320px]" />}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? ROUTES.HOME;

  return (
    <>
      <h1 className="text-2xl font-semibold text-[var(--amazon-text-primary)] mb-5">Create account</h1>
      <RegisterForm onSuccess={() => router.push(redirect)} />
      <div className="amazon-divider my-5">already have an account?</div>
      <Link
        href={`${ROUTES.LOGIN}${redirect !== ROUTES.HOME ? `?redirect=${redirect}` : ""}`}
        className="block text-center"
      >
        <Button variant="outline" fullWidth>Sign in</Button>
      </Link>
    </>
  );
}

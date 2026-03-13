"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations/auth.schema";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { ROUTES } from "@/lib/constants";

export function PasswordForm() {
  const { logout } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  const newPassword = watch("newPassword", "");

  const mutation = useMutation({
    mutationFn: (data: ChangePasswordInput) =>
      authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword:     data.newPassword,
      }),
    onSuccess: () => {
      toast.success("Password changed. Please sign in again.");
      // Backend clears the HttpOnly cookie on password change — force logout
      logout();
      router.push(ROUTES.LOGIN);
    },
    onError: (err: Error) => {
      // Don't reset form — user might want to correct just the current password
      toast.error(err.message?.includes("incorrect") ? "Current password is incorrect." : (err.message ?? "Failed to change password"));
    },
  });

  return (
    <form
      onSubmit={handleSubmit((d) => mutation.mutate(d))}
      noValidate
      className="space-y-4 max-w-sm"
    >
      <Alert
        variant="info"
        message="For security, you'll be signed out after changing your password."
      />

      <PasswordInput
        label="Current password"
        id="current-password"
        autoComplete="current-password"
        placeholder="Your current password"
        error={errors.currentPassword?.message}
        {...register("currentPassword")}
      />

      <div>
        <PasswordInput
          label="New password"
          id="new-password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.newPassword?.message}
          hint="Must contain uppercase letter and number"
          {...register("newPassword")}
        />
        <PasswordStrength password={newPassword} />
      </div>

      <PasswordInput
        label="Re-enter new password"
        id="confirm-new-password"
        autoComplete="new-password"
        placeholder="Confirm new password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <div className="flex gap-3">
        <Button type="submit" loading={isSubmitting || mutation.isPending}>
          Change password
        </Button>
        <Button type="button" variant="ghost" onClick={() => reset()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

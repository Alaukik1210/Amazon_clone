"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { QUERY_KEYS } from "@/lib/constants";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/auth.schema";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { CheckCircle2 } from "lucide-react";
import type { User } from "@/types";

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { setUser } = useAuthStore();
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: user.name ?? "", phone: user.phone ?? "" },
  });

  // Sync form when user object changes (e.g. from another tab)
  useEffect(() => {
    reset({ name: user.name ?? "", phone: user.phone ?? "" });
  }, [user.name, user.phone, reset]);

  const mutation = useMutation({
    mutationFn: (data: UpdateProfileInput) =>
      authService.updateProfile({ name: data.name, phone: data.phone || undefined }),
    onSuccess: (res) => {
      const updated = res.data.data;
      setUser(updated);
      qc.setQueryData(QUERY_KEYS.ME, updated);
      reset({ name: updated.name ?? "", phone: updated.phone ?? "" });
      toast.success("Profile updated successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to update profile");
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate className="space-y-4">
      <div>
        <Input
          label="Full name"
          type="text"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />
      </div>

      {/* Email is read-only — can't change without re-verification */}
      <div>
        <label className="form-label">Email</label>
        <div className="flex items-center gap-2">
          <input
            type="email"
            value={user.email}
            disabled
            className="flex-1 rounded border border-[var(--amazon-border)] bg-gray-100 px-3 py-2 text-sm text-[var(--amazon-text-muted)] cursor-not-allowed"
          />
          {user.isEmailVerified && (
            <span className="flex items-center gap-1 text-xs text-[var(--amazon-success)] font-medium">
              <CheckCircle2 size={14} /> Verified
            </span>
          )}
        </div>
        <p className="form-hint">Email cannot be changed. Contact support if needed.</p>
      </div>

      <div>
        <Input
          label="Mobile number (optional)"
          type="tel"
          autoComplete="tel"
          placeholder="10-digit mobile number"
          error={errors.phone?.message}
          {...register("phone")}
        />
      </div>

      {!user.isEmailVerified && (
        <Alert
          variant="warning"
          title="Verification pending"
          message="Complete OTP verification to access all features."
        />
      )}

      <Button
        type="submit"
        loading={isSubmitting || mutation.isPending}
        disabled={!isDirty}
      >
        Save changes
      </Button>
    </form>
  );
}

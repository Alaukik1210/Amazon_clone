"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema, type AddressInput } from "@/lib/validations/auth.schema";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Address } from "@/types";

interface AddressFormProps {
  initial?: Address;
  onSubmit: (data: AddressInput) => Promise<unknown>;
  onCancel: () => void;
}

export function AddressForm({ initial, onSubmit, onCancel }: AddressFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: initial
      ? {
          street:     initial.street,
          city:       initial.city,
          state:      initial.state,
          postalCode: initial.postalCode,
          country:    initial.country,
        }
      : { country: "India" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      <Input
        label="Street / House No."
        placeholder="Building, street, area"
        error={errors.street?.message}
        {...register("street")}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="City"  placeholder="City"  error={errors.city?.message}  {...register("city")} />
        <Input label="State" placeholder="State" error={errors.state?.message} {...register("state")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="PIN code" placeholder="6-digit PIN" error={errors.postalCode?.message} {...register("postalCode")} />
        <Input label="Country"  placeholder="Country"     error={errors.country?.message}    {...register("country")} />
      </div>
      <div className="flex gap-3 pt-1">
        <Button type="submit" size="sm" loading={isSubmitting}>
          {initial ? "Update address" : "Add address"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

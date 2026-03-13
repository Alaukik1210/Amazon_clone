"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addressService } from "@/services/address.service";
import { QUERY_KEYS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AddressForm } from "@/components/account/AddressForm";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Address } from "@/types";
import type { AddressInput } from "@/lib/validations/auth.schema";

interface AddressSelectorProps {
  selectedId: string | null;
  onSelect:   (id: string) => void;
}

export function AddressSelector({ selectedId, onSelect }: AddressSelectorProps) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: addresses, isLoading } = useQuery<Address[]>({
    queryKey: QUERY_KEYS.ADDRESSES,
    queryFn:  () => addressService.getAll().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: AddressInput) => addressService.create(data),
    onSuccess: (res) => {
      const newAddr = res.data.data;
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ADDRESSES });
      setShowForm(false);
      onSelect(newAddr.id); // auto-select newly added address
      toast.success("Address saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-32 rounded-sm" />;

  return (
    <div className="space-y-3">
      {/* Existing addresses */}
      {addresses?.map((addr) => (
        <button
          key={addr.id}
          type="button"
          onClick={() => onSelect(addr.id)}
          className={cn(
            "w-full text-left rounded-sm border p-4 transition-colors",
            selectedId === addr.id
              ? "border-[#E77600] bg-[#FFF8F0]"
              : "border-[#D5D9D9] hover:border-[#A2A6AC]"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Radio circle */}
              <div className={cn(
                "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center mt-0.5",
                selectedId === addr.id ? "border-[#E77600]" : "border-[#888C8C]"
              )}>
                {selectedId === addr.id && (
                  <div className="w-2 h-2 rounded-full bg-[#E77600]" />
                )}
              </div>
              <div className="text-[13px]">
                <p className="font-medium text-[#0F1111]">{addr.street}</p>
                <p className="text-[#565959]">
                  {addr.city}, {addr.state} – {addr.postalCode}
                </p>
                <p className="text-[#565959]">{addr.country}</p>
              </div>
            </div>
            {addr.isDefault && <Badge variant="info" className="text-xs shrink-0">Default</Badge>}
          </div>
        </button>
      ))}

      {/* Add new address toggle */}
      {showForm ? (
        <div className="border border-[#D5D9D9] rounded-sm p-4 bg-[#FCFCFC]">
          <h3 className="font-semibold text-[14px] mb-3 flex items-center gap-2 text-[#0F1111]">
            <MapPin size={14} /> Add new delivery address
          </h3>
          <AddressForm
            onSubmit={(data) => createMutation.mutateAsync(data)}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="text-[13px]">
          <Plus size={14} /> Add a new address
        </Button>
      )}
    </div>
  );
}

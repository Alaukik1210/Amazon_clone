"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addressService } from "@/services/address.service";
import { QUERY_KEYS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { AddressForm } from "./AddressForm";
import { MapPin, Pencil, Trash2, Plus } from "lucide-react";
import type { Address } from "@/types";
import type { AddressInput } from "@/lib/validations/auth.schema";

export function AddressList() {
  const qc = useQueryClient();
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<Address | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: addresses, isLoading } = useQuery({
    queryKey: QUERY_KEYS.ADDRESSES,
    queryFn: () => addressService.getAll().then((r) => r.data.data),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: QUERY_KEYS.ADDRESSES });

  const createMutation = useMutation({
    mutationFn: (data: AddressInput) => addressService.create(data),
    onSuccess: () => { invalidate(); setShowForm(false); toast.success("Address added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddressInput }) => addressService.update(id, data),
    onSuccess: () => { invalidate(); setEditing(null); toast.success("Address updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const defaultMutation = useMutation({
    mutationFn: (id: string) => addressService.setDefault(id),
    onSuccess: () => { invalidate(); toast.success("Default address updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => addressService.delete(id),
    onSuccess: () => { invalidate(); setDeletingId(null); toast.success("Address deleted"); },
    onError: (e: Error) => { setDeletingId(null); toast.error(e.message); },
  });

  if (isLoading) return <Skeleton className="h-32 rounded" />;

  return (
    <div className="space-y-4">
      {/* Add new address */}
      {showForm ? (
        <div className="amazon-card p-4">
          <h3 className="font-semibold text-sm mb-3">Add a new address</h3>
          <AddressForm
            onSubmit={(data) => createMutation.mutateAsync(data)}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Add new address
        </Button>
      )}

      {/* Existing addresses */}
      {!addresses?.length && !showForm ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Add an address to speed up checkout"
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses?.map((address) => (
            <div key={address.id} className="amazon-card p-4 space-y-2">
              {/* Editing inline */}
              {editing?.id === address.id ? (
                <>
                  <h3 className="font-semibold text-sm mb-2">Edit address</h3>
                  <AddressForm
                    initial={address}
                    onSubmit={(data) => updateMutation.mutateAsync({ id: address.id, data })}
                    onCancel={() => setEditing(null)}
                  />
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm space-y-0.5">
                      <p>{address.street}</p>
                      <p>{address.city}, {address.state} – {address.postalCode}</p>
                      <p className="text-[var(--amazon-text-muted)]">{address.country}</p>
                    </div>
                    {address.isDefault && <Badge variant="success">Default</Badge>}
                  </div>
                  <div className="flex gap-2 flex-wrap pt-1">
                    {!address.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={defaultMutation.isPending}
                        onClick={() => defaultMutation.mutate(address.id)}
                      >
                        Set as default
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setEditing(address)}>
                      <Pencil size={12} /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      loading={deletingId === address.id && deleteMutation.isPending}
                      onClick={() => {
                        if (confirm("Delete this address?")) {
                          setDeletingId(address.id);
                          deleteMutation.mutate(address.id);
                        }
                      }}
                    >
                      <Trash2 size={12} /> Delete
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { QUERY_KEYS } from "@/lib/constants";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { ProfileForm } from "@/components/account/ProfileForm";
import { PasswordForm } from "@/components/account/PasswordForm";
import { AddressList } from "@/components/account/AddressList";
import { PageSpinner } from "@/components/ui/Spinner";
import { User, KeyRound, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "profile" | "password" | "addresses";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "profile",   label: "Profile",   icon: <User size={16} /> },
  { id: "password",  label: "Password",  icon: <KeyRound size={16} /> },
  { id: "addresses", label: "Addresses", icon: <MapPin size={16} /> },
];

function AccountContent() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const { user: cachedUser } = useAuthStore();

  // Fresh data from server — but use cached user as fallback immediately
  const { data: user, isLoading } = useQuery({
    queryKey: QUERY_KEYS.ME,
    queryFn: () => authService.getMe().then((r) => r.data.data),
    initialData: cachedUser ?? undefined,
    staleTime: 0, // always re-fetch on account page to show fresh data
  });

  if (isLoading && !user) return <PageSpinner />;
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-[var(--amazon-text-primary)] mb-6">Your Account</h1>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar tabs */}
        <nav className="sm:w-48 shrink-0">
          <ul className="amazon-card overflow-hidden divide-y divide-[var(--amazon-border)]">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-3 text-sm text-left transition-colors",
                    activeTab === tab.id
                      ? "bg-[var(--amazon-bg-subtle)] font-semibold text-[var(--amazon-warning)] border-l-2 border-[var(--amazon-warning)]"
                      : "hover:bg-[var(--amazon-bg-subtle)] text-[var(--amazon-text-primary)]"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Tab content */}
        <div className="flex-1 amazon-card p-6">
          {activeTab === "profile" && (
            <>
              <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
              <ProfileForm user={user} />
            </>
          )}
          {activeTab === "password" && (
            <>
              <h2 className="text-lg font-semibold mb-4">Change Password</h2>
              <PasswordForm />
            </>
          )}
          {activeTab === "addresses" && (
            <>
              <h2 className="text-lg font-semibold mb-4">Manage Addresses</h2>
              <AddressList />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <AccountContent />
    </ProtectedRoute>
  );
}

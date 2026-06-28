"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Confirm } from "@/components/ui/Confirm";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────────

type SettingsTab = "api-key" | "billing" | "account";

interface KeyStatus {
  has_key: boolean;
  is_connected: boolean;
  auth_error?: string | null;
  last_used_at?: string | null;
}

interface PlanInfo {
  tier: "free" | "pro" | "business";
  status: string;
  maxChannels: number;
  pollingIntervalMins: number;
  maxStorageBytes: number;
  currentPeriodEnd?: string | null;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1_024).toFixed(1)} KB`;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(iso?: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ── Tab bar ─────────────────────────────────────────────────────────────────

const TABS: { key: SettingsTab; label: string }[] = [
  { key: "api-key", label: "API Key" },
  { key: "billing", label: "Billing" },
  { key: "account", label: "Account" },
];

function TabBar({ active, onChange }: { active: SettingsTab; onChange: (t: SettingsTab) => void }) {
  return (
    <div className="flex gap-1 border-b border-border mb-6">
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "px-4 py-2.5 font-mono text-[11px] border-b-[2px] transition-colors -mb-[1px]",
            active === t.key
              ? "text-accent border-accent"
              : "text-text2 border-transparent hover:text-text"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── API Key tab ─────────────────────────────────────────────────────────────

function ApiKeyTab() {
  const [keyStatus, setKeyStatus] = useState<KeyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [sessionString, setSessionString] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const toast = useToast();

  const fetchKeyStatus = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { setIsLoading(false); return; }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/keys`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );

      if (res.status === 404) {
        setKeyStatus({ has_key: false, is_connected: false });
        return;
      }
      if (!res.ok) throw new Error("Failed to load key status");

      const data = await res.json();
      setKeyStatus(data);
    } catch {
      setKeyStatus({ has_key: false, is_connected: false });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchKeyStatus(); }, [fetchKeyStatus]);

  const handleSave = async () => {
    if (!apiId || !apiHash || !sessionString) {
      toast.error("All fields are required");
      return;
    }
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/keys`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            telegram_api_id: apiId,
            telegram_api_hash: apiHash,
            session_string: sessionString,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save API key");
      }

      toast.success("API key saved");
      setSessionString(""); // Clear the masked field
      fetchKeyStatus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save API key");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/keys`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to remove API key");

      toast.success("API key removed");
      setShowRemoveConfirm(false);
      setApiId("");
      setApiHash("");
      setSessionString("");
      fetchKeyStatus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove API key");
    } finally {
      setIsRemoving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-lg">
        <Skeleton height="40px" />
        <Skeleton height="36px" />
        <Skeleton height="36px" />
        <Skeleton height="56px" />
        <Skeleton height="32px" />
      </div>
    );
  }

  const isConnected = keyStatus?.is_connected;
  const hasKey = keyStatus?.has_key;

  return (
    <div className="max-w-lg">
      {/* Status banner */}
      <div
        className={cn(
          "rounded-panel border px-4 py-2.5 mb-6 font-mono text-[11px]",
          keyStatus?.auth_error
            ? "bg-red-dim border-red/30 text-red"
            : isConnected
              ? "bg-green-dim border-green/30 text-green"
              : "bg-yellow-dim border-yellow/30 text-yellow"
        )}
      >
        {keyStatus?.auth_error
          ? `${keyStatus.auth_error} — Re-enter your credentials`
          : isConnected
            ? `Connected · last used ${timeAgo(keyStatus?.last_used_at)}`
            : hasKey
              ? "Credentials saved but not connected — verify your session string"
              : "No Telegram API key connected"}
      </div>

      {/* Form */}
      <div className="space-y-4">
        <MonoLabel>API credentials</MonoLabel>

        <Input
          label="API ID"
          placeholder="Your Telegram API ID"
          value={apiId}
          onChange={(e) => setApiId(e.target.value)}
        />

        <Input
          label="API hash"
          type="password"
          placeholder="Your Telegram API hash"
          value={apiHash}
          onChange={(e) => setApiHash(e.target.value)}
        />

        <Input
          label="Session string"
          type="password"
          placeholder="Your Telethon session string"
          value={sessionString}
          onChange={(e) => setSessionString(e.target.value)}
        />
        <p className="font-mono text-[9px] text-text3 -mt-2 mb-2">
          Get your API ID and hash from{" "}
          <a
            href="https://my.telegram.org/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            my.telegram.org
          </a>
          , then generate a session string using{" "}
          <a
            href="https://docs.telethon.dev/en/stable/concepts/sessions.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Telethon&apos;s StringSession
          </a>
        </p>

        <Button
          variant="primary"
          size="md"
          loading={isSaving}
          disabled={!apiId || !apiHash || !sessionString}
          onClick={handleSave}
        >
          Save credentials
        </Button>
      </div>

      {/* Remove section */}
      {(hasKey || isConnected) && (
        <div className="mt-10 pt-6 border-t border-border">
          <MonoLabel className="text-red">Remove API key</MonoLabel>
          <p className="font-sans text-[12px] text-text2 mt-1 mb-3">
            Removing your key will pause all monitoring. Your scraped data will not be deleted.
          </p>
          <Button
            variant="danger"
            size="sm"
            loading={isRemoving}
            onClick={() => setShowRemoveConfirm(true)}
          >
            Remove API key
          </Button>
        </div>
      )}

      <Confirm
        open={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={handleRemove}
        title="Remove API key"
        body="Removing your key will pause all monitoring. Your scraped data will not be deleted."
        confirmString="REMOVE"
      />
    </div>
  );
}

// ── Billing tab ─────────────────────────────────────────────────────────────

function BillingTab() {
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [upgradeTarget, setUpgradeTarget] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) { setIsLoading(false); return; }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/billing/subscription`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );

        if (res.status === 404) {
          setPlan({
            tier: "free",
            status: "active",
            maxChannels: 3,
            pollingIntervalMins: 60,
            maxStorageBytes: 524288000,
          });
          return;
        }
        if (!res.ok) throw new Error("Failed to load subscription");

        const data = await res.json();
        setPlan(data.subscription ?? data);
      } catch {
        setPlan({
          tier: "free",
          status: "active",
          maxChannels: 3,
          pollingIntervalMins: 60,
          maxStorageBytes: 524288000,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlan();
  }, []);

  const handleCheckout = async (tier: string) => {
    setUpgradeTarget(tier);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/billing/checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ tier }),
        }
      );

      if (!res.ok) throw new Error("Failed to start checkout");

      const data = await res.json();
      if (data.checkout_url) window.location.href = data.checkout_url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start checkout");
    } finally {
      setUpgradeTarget(null);
    }
  };

  const handlePortal = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/billing/portal`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );

      if (!res.ok) throw new Error("Failed to open portal");

      const data = await res.json();
      if (data.portal_url) window.location.href = data.portal_url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open portal");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-lg">
        <Skeleton height="120px" />
        <Skeleton height="80px" />
        <Skeleton height="80px" />
      </div>
    );
  }

  const tier = plan?.tier ?? "free";
  const isPaid = tier !== "free";
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  return (
    <div className="max-w-lg">
      {/* Current plan */}
      <div className="bg-surface2 border border-border rounded-panel p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[18px] text-text font-medium">{tierLabel}</span>
          <Badge variant={plan?.status === "active" ? "green" : "yellow"}>
            {plan?.status ?? "unknown"}
          </Badge>
        </div>
        <div className="space-y-1.5 font-mono text-[10px] text-text3">
          <div className="flex justify-between">
            <span>Channels</span>
            <span className="text-text2">{plan?.maxChannels ?? 3}</span>
          </div>
          <div className="flex justify-between">
            <span>Polling interval</span>
            <span className="text-text2">every {plan?.pollingIntervalMins ?? 60}m</span>
          </div>
          <div className="flex justify-between">
            <span>Storage</span>
            <span className="text-text2">{formatBytes(plan?.maxStorageBytes ?? 0)}</span>
          </div>
          {isPaid && plan?.currentPeriodEnd && (
            <div className="flex justify-between">
              <span>Renews</span>
              <span className="text-text2">{formatDate(plan.currentPeriodEnd)}</span>
            </div>
          )}
        </div>
        {isPaid && (
          <Button variant="ghost" size="sm" className="mt-3" onClick={handlePortal}>
            Manage subscription
          </Button>
        )}
      </div>

      {/* Upgrade cards */}
      {!isPaid && (
        <div className="space-y-3">
          <UpgradeCard
            tier="Pro"
            price="$29/mo"
            features={[
              "20 channels",
              "5-minute polling",
              "10 GB storage",
              "365-day history",
              "Priority support",
            ]}
            isLoading={upgradeTarget === "pro"}
            onUpgrade={() => handleCheckout("pro")}
          />
          <UpgradeCard
            tier="Business"
            price="$99/mo"
            features={[
              "Unlimited channels",
              "5-minute polling",
              "100 GB storage",
              "Unlimited history",
              "Outbound webhooks",
              "Dedicated support",
            ]}
            isLoading={upgradeTarget === "business"}
            onUpgrade={() => handleCheckout("business")}
          />
        </div>
      )}
    </div>
  );
}

function UpgradeCard({
  tier,
  price,
  features,
  isLoading,
  onUpgrade,
}: {
  tier: string;
  price: string;
  features: string[];
  isLoading: boolean;
  onUpgrade: () => void;
}) {
  return (
    <div className="bg-surface border border-border rounded-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[13px] text-text font-medium">{tier}</span>
        <span className="font-mono text-[13px] text-accent">{price}</span>
      </div>
      <ul className="space-y-1 mb-4">
        {features.map((f) => (
          <li key={f} className="font-sans text-[12px] text-text2 flex items-center gap-2">
            <span className="text-green font-mono text-[10px]">✓</span> {f}
          </li>
        ))}
      </ul>
      <Button variant="primary" size="sm" loading={isLoading} onClick={onUpgrade}>
        Upgrade to {tier}
      </Button>
    </div>
  );
}

// ── Account tab ─────────────────────────────────────────────────────────────

function AccountTab() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setEmail(session.user.email);
          setDisplayName(session.user.user_metadata?.display_name ?? "");
        }
      } catch { /* ignore */ }
    };
    fetchProfile();
  }, []);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/account`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to delete account");

      await supabase.auth.signOut();
      router.push("/login?deleted=1");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-lg">
      {/* Profile */}
      <div className="space-y-4 mb-10">
        <MonoLabel>Profile</MonoLabel>

        <Input
          label="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your display name"
        />

        <div className="flex flex-col gap-1">
          <label className="font-mono text-[9px] uppercase tracking-[0.1em] text-text3">Email</label>
          <input
            className="bg-surface2 border border-border text-text3 text-[12px] px-3 py-2 rounded-card cursor-not-allowed"
            value={email}
            readOnly
          />
          <p className="font-mono text-[9px] text-text3 mt-0.5">
            Managed by Supabase Auth
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-mono text-[9px] uppercase tracking-[0.1em] text-text3">Timezone</label>
          <select
            className="bg-surface2 border border-border text-text text-[12px] px-3 py-2 rounded-card outline-none focus:border-accent"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {Intl.supportedValuesOf?.("timeZone") ? (
              Intl.supportedValuesOf("timeZone").map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))
            ) : (
              <>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Chicago">America/Chicago</option>
                <option value="America/Denver">America/Denver</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Europe/Berlin">Europe/Berlin</option>
              </>
            )}
          </select>
        </div>

        <Button variant="primary" size="sm" disabled>
          Save changes
        </Button>
      </div>

      {/* Danger zone */}
      <div className="pt-6 border-t border-border">
        <MonoLabel className="text-red">Delete account</MonoLabel>
        <p className="font-sans text-[12px] text-text2 mt-1 mb-3">
          All your channels, messages, and media will be permanently deleted. This cannot be undone.
        </p>
        <Button
          variant="danger"
          size="sm"
          loading={isDeleting}
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete account
        </Button>
      </div>

      <Confirm
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete account"
        body="All your channels, messages, and media will be permanently deleted. This cannot be undone."
        confirmString="DELETE"
      />
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab") as SettingsTab | null;
  const [activeTab, setActiveTab] = useState<SettingsTab>(tabParam || "api-key");

  // Update URL when tab changes
  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <div>
      <h1 className="font-mono text-[15px] text-text mb-6">Settings</h1>

      <TabBar active={activeTab} onChange={handleTabChange} />

      {activeTab === "api-key" && <ApiKeyTab />}
      {activeTab === "billing" && <BillingTab />}
      {activeTab === "account" && <AccountTab />}
    </div>
  );
}
"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase";

// ── Types ───────────────────────────────────────────────────────────────────

interface AddChannelModalProps {
  open: boolean;
  onClose: () => void;
  onChannelAdded: () => void;
}

type ModalState =
  | { kind: "form" }
  | { kind: "resolving" }
  | { kind: "limit"; used: number; max: number }
  | { kind: "noApiKey" }
  | { kind: "error"; message: string };

// ── Component ───────────────────────────────────────────────────────────────

export function AddChannelModal({ open, onClose, onChannelAdded }: AddChannelModalProps) {
  const [input, setInput] = useState("");
  const [state, setState] = useState<ModalState>({ kind: "form" });
  const toast = useToast();

  const handleClose = () => {
    setInput("");
    setState({ kind: "form" });
    onClose();
  };

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setState({ kind: "resolving" });

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setState({ kind: "error", message: "Not authenticated. Please log in again." });
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/channels`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ channel_input: trimmed }),
        }
      );

      if (res.status === 402) {
        const data = await res.json().catch(() => ({}));
        setState({
          kind: "limit",
          used: data.used ?? 3,
          max: data.max ?? 3,
        });
        return;
      }

      if (res.status === 422) {
        setState({ kind: "noApiKey" });
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setState({
          kind: "error",
          message: data.error || "Failed to add channel. Please try again.",
        });
        return;
      }

      toast.success("Channel added. Scraping started.");
      onChannelAdded();
      handleClose();
    } catch {
      setState({ kind: "error", message: "Connection lost. Check your network and try again." });
    }
  };

  // ── Render per state ────────────────────────────────────────────────────

  const renderContent = () => {
    switch (state.kind) {
      // ── Form ──────────────────────────────────────────────────────────
      case "form":
      case "resolving":
        return (
          <>
            <p className="font-sans text-[12px] text-text2 mb-4">
              Paste a Telegram channel link, @username, or channel ID to start
              monitoring messages and media.
            </p>
            <Input
              placeholder="t.me/channelname or @username"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && state.kind === "form") handleSubmit();
              }}
              disabled={state.kind === "resolving"}
            />
            <div className="flex gap-2 mt-4 justify-end">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={state.kind === "resolving"}
                disabled={!input.trim() || state.kind === "resolving"}
                onClick={handleSubmit}
              >
                {state.kind === "resolving" ? "Resolving channel…" : "Add channel"}
              </Button>
            </div>
          </>
        );

      // ── Plan limit (402) ──────────────────────────────────────────────
      case "limit":
        return (
          <>
            <p className="font-sans text-[12px] text-text2 mb-2">
              You&apos;re on the Free plan ({state.used}/{state.max} channels used).
            </p>
            <p className="font-sans text-[12px] text-text2 mb-4">
              Upgrade to Pro to track up to 20 channels.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  handleClose();
                  window.location.href = "/dashboard/settings?tab=billing";
                }}
              >
                Upgrade to Pro — 20 channels
              </Button>
            </div>
          </>
        );

      // ── No API key (422) ──────────────────────────────────────────────
      case "noApiKey":
        return (
          <>
            <p className="font-sans text-[12px] text-text2 mb-4">
              Connect your Telegram API key to start tracking channels.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  handleClose();
                  window.location.href = "/dashboard/settings";
                }}
              >
                Go to Settings
              </Button>
            </div>
          </>
        );

      // ── Generic error ─────────────────────────────────────────────────
      case "error":
        return (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-red-dim border border-red/30 flex items-center justify-center shrink-0">
                <span className="font-mono text-[14px] text-red">!</span>
              </div>
              <p className="font-mono text-[12px] text-red">{state.message}</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setState({ kind: "form" })}
              >
                Try again
              </Button>
            </div>
          </>
        );
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add channel">
      {renderContent()}
    </Modal>
  );
}
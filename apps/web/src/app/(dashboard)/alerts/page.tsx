import { EmptyState } from "@/components/ui/EmptyState";

export default function AlertsPage() {
  return (
    <div>
      <h1 className="font-mono text-[15px] text-text mb-6">Alert Rules</h1>
      <EmptyState
        icon={<span className="font-mono text-[48px] text-text3 opacity-20">◭</span>}
        title="Alert rules — Phase 2"
        description="Keyword-based alert rules with email and webhook delivery are coming in the next phase."
      />
    </div>
  );
}

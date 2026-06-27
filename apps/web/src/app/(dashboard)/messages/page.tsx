import { EmptyState } from "@/components/ui/EmptyState";

export default function MessagesPage() {
  return (
    <div>
      <h1 className="font-mono text-[15px] text-text mb-6">Messages</h1>
      <EmptyState
        icon={<span className="font-mono text-[48px] text-text3 opacity-20">◩</span>}
        title="Cross-channel search coming soon"
        description="Full-text message search across all channels will be available in Phase 2."
      />
    </div>
  );
}

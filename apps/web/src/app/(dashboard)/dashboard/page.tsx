import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

/**
 * Dashboard index page — shown at /dashboard.
 *
 * Currently a placeholder with an empty state prompting the user to add
 * their first channel. Will be replaced with analytics overview in Phase 2.
 */
export default function DashboardPage() {
  return (
    <div>
      <h1 className="font-mono text-[15px] text-text mb-6">Dashboard</h1>

      <EmptyState
        icon={
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <line x1="9" y1="10" x2="15" y2="10" />
            <line x1="12" y1="7" x2="12" y2="13" />
          </svg>
        }
        title="No channels tracked yet"
        description="Add a Telegram channel to start monitoring messages, media, and member activity."
        action={
          <Link href="/dashboard/channels">
            <Button variant="primary" size="sm">
              Add your first channel
            </Button>
          </Link>
        }
      />
    </div>
  );
}

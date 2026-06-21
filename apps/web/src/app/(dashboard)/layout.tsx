import Link from "next/link";
import { ApiKeyBanner } from "@/components/ApiKeyBanner";

/**
 * Dashboard layout — wraps all /dashboard/* routes.
 *
 * Provides:
 * - Persistent API key warning banner when no key is connected
 * - Sidebar navigation
 * - Consistent spacing for child pages
 *
 * Full AppShell (FE-003) will replace the sidebar placeholder in a future task.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "◧" },
    { href: "/dashboard/channels", label: "Channels", icon: "◫" },
    { href: "/dashboard/messages", label: "Messages", icon: "◩" },
    { href: "/dashboard/media", label: "Media", icon: "◨" },
    { href: "/dashboard/settings", label: "Settings", icon: "⚙" },
  ];

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="w-[220px] flex-shrink-0 bg-surface border-r border-border flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border">
          <div className="w-7 h-7 rounded-chip bg-accent-dim border border-accent flex items-center justify-center font-mono text-[13px] text-accent font-medium">
            tg
          </div>
          <span className="font-mono text-[13px] text-text font-medium">
            tg[scan]
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 h-8 px-3 rounded-btn font-mono text-[11px] text-text2 hover:bg-surface2 hover:text-text transition-colors"
            >
              <span className="text-[10px] w-4 text-center">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border">
          <p className="font-mono text-[10px] text-text3">Signed in</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        <ApiKeyBanner />
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}

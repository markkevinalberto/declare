"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { DeclareMark } from "@/components/brand/declare-mark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";
import { primaryNav, settingsNav } from "./nav-config";

const ALL_NAV = [...primaryNav, settingsNav];

/** The current section's label ("Services", "Songs"…), falling back to the
 * brand name on routes with no nav entry (e.g. a service's own sub-pages). */
function usePageTitle() {
  const pathname = usePathname();
  const match = ALL_NAV.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  return match?.label ?? "Declare";
}

export function AppShell({
  orgName,
  isScheduler,
  isAdmin,
  isSuperAdmin,
  unreadCount,
  userName,
  userEmail,
  avatarUrl,
  children,
}: {
  orgName: string;
  isScheduler: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  unreadCount: number;
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageTitle = usePageTitle();

  return (
    <div className="flex min-h-svh w-full">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar/70 backdrop-blur-xl md:flex print:hidden">
        <div className="flex h-14 items-center gap-2.5 border-b px-4">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-2 shadow-md shadow-primary/25">
            <DeclareMark className="size-4 text-primary-foreground" />
          </span>
          <span className="truncate text-sm font-semibold">{orgName}</span>
        </div>
        <SidebarNav isScheduler={isScheduler} isAdmin={isAdmin} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-14 items-center gap-2.5 border-b px-4">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-2 shadow-md shadow-primary/25">
              <DeclareMark className="size-4 text-primary-foreground" />
            </span>
            <span className="truncate text-sm font-semibold">{orgName}</span>
          </div>
          <SidebarNav
            isScheduler={isScheduler}
            isAdmin={isAdmin}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background/75 backdrop-blur-md px-4 print:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </Button>
            {/* Each page renders its own <h1> in the scrolling content below
                — this is a static wayfinding label, not the document heading. */}
            <span className="truncate text-sm font-semibold">{pageTitle}</span>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell unreadCount={unreadCount} />
            <UserMenu
              name={userName}
              email={userEmail}
              avatarUrl={avatarUrl}
              isSuperAdmin={isSuperAdmin}
            />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 print:overflow-visible print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}

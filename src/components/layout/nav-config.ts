import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ListTree,
  MessageSquare,
  Music,
  Settings,
  CalendarOff,
  type LucideIcon,
} from "lucide-react";
import { FEATURES } from "@/lib/features";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  schedulerOnly?: boolean;
};

export const primaryNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/services", label: "Services", icon: CalendarDays },
  // The song library only has a purpose when something can consume it (the
  // plan builder or the presenter) — hidden along with those, not deleted.
  ...(FEATURES.planning || FEATURES.presenter
    ? [{ href: "/songs", label: "Songs", icon: Music }]
    : []),
  { href: "/people", label: "People", icon: Users, schedulerOnly: true },
  { href: "/roles", label: "Roles", icon: ListTree, schedulerOnly: true },
  { href: "/my-schedule", label: "My Schedule", icon: CalendarDays },
  { href: "/blockouts", label: "Blockout Dates", icon: CalendarOff },
  { href: "/messages", label: "Messages", icon: MessageSquare },
];

export const settingsNav: NavItem = {
  href: "/settings",
  label: "Settings",
  icon: Settings,
};

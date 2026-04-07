"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Clock,
  Calendar,
  FileCheck,
  DollarSign,
  Shield,
  List,
  Calendar as CalendarIcon,
  TrendingUp,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

type UserRole = "admin" | "manager" | "employee";

interface NavItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: UserRole[];
  children?: NavItem[];
}

const workspaceNav: NavItem[] = [
  {
    name: "Dashboard",
    href: "/app/dashboard",
    icon: LayoutDashboard,
    allowedRoles: ["admin", "manager", "employee"],
  },
  {
    name: "Time Tracking",
    href: "/app/time",
    icon: Clock,
    allowedRoles: ["admin", "manager", "employee"],
    children: [
      {
        name: "Today",
        href: "/app/time",
        icon: Clock,
        allowedRoles: ["admin", "manager", "employee"],
      },
      {
        name: "Calendar",
        href: "/app/time/calendar",
        icon: CalendarIcon,
        allowedRoles: ["admin", "manager", "employee"],
      },
      {
        name: "Entries",
        href: "/app/time/entries",
        icon: List,
        allowedRoles: ["admin", "manager", "employee"],
      },
    ],
  },
  {
    name: "My Leaves",
    href: "/app/leaves",
    icon: Calendar,
    allowedRoles: ["admin", "manager", "employee"],
  },
  {
    name: "Reports",
    href: "/app/reports",
    icon: TrendingUp,
    allowedRoles: ["admin", "manager", "employee"],
  },
];

const adminNav: NavItem[] = [
  {
    name: "Admin Overview",
    href: "/admin/dashboard",
    icon: BarChart3,
    allowedRoles: ["admin", "manager"],
  },
  {
    name: "Team",
    href: "/admin/team",
    icon: Users,
    allowedRoles: ["admin", "manager"],
  },
  {
    name: "Time Management",
    href: "/admin/time/entries",
    icon: Clock,
    allowedRoles: ["admin", "manager"],
    children: [
      {
        name: "All Entries",
        href: "/admin/time/entries",
        icon: List,
        allowedRoles: ["admin", "manager"],
      },
      {
        name: "Calendar",
        href: "/admin/time/calendar",
        icon: CalendarIcon,
        allowedRoles: ["admin", "manager"],
      },
    ],
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    allowedRoles: ["admin", "manager"],
  },
  {
    name: "Leave Management",
    href: "/admin/leaves",
    icon: FileCheck,
    allowedRoles: ["admin", "manager"],
  },
  {
    name: "Payroll",
    href: "/admin/payroll",
    icon: DollarSign,
    allowedRoles: ["admin", "manager"],
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: TrendingUp,
    allowedRoles: ["admin", "manager"],
  },
  {
    name: "Roles",
    href: "/admin/roles",
    icon: Shield,
    allowedRoles: ["admin"],
  },
];

function NavLink({
  item,
  pathname,
  userRole,
}: {
  item: NavItem;
  pathname: string;
  userRole?: UserRole;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const hasChildren = item.children && item.children.length > 0;

  const isActive = item.href
    ? item.href === "/app/time" || item.href === "/admin/time/entries"
      ? pathname === item.href || (hasChildren && !pathname.startsWith(item.href + "/"))
        ? pathname === item.href
        : false
      : pathname.startsWith(item.href)
    : false;

  const hasActiveChild = item.children?.some((child) =>
    child.href ? pathname.startsWith(child.href) : false
  );

  React.useEffect(() => {
    if (hasActiveChild) setIsExpanded(true);
  }, [hasActiveChild]);

  if (!userRole || !item.allowedRoles.includes(userRole)) return null;

  const isHighlighted = isActive || hasActiveChild;

  return (
    <div>
      {item.href ? (
        <Link
          href={item.href}
          className={cn(
            "group flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors relative",
            isHighlighted
              ? "text-primary bg-primary/8 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:bg-primary before:rounded-r"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
          aria-current={isActive ? "page" : undefined}
        >
          <item.icon className={cn("h-4 w-4 flex-shrink-0", isHighlighted ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
          <span className="flex-1 truncate">{item.name}</span>
          {hasChildren && (
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsExpanded(!isExpanded);
              }}
              className="ml-auto p-0.5 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </Link>
      ) : (
        <button
          className={cn(
            "w-full group flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            hasActiveChild
              ? "text-foreground bg-accent"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <item.icon className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 text-left truncate">{item.name}</span>
          {hasChildren && (
            isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )
          )}
        </button>
      )}

      {hasChildren && isExpanded && (
        <div className="ml-6 mt-0.5 space-y-0.5 border-l border-border pl-2">
          {item.children!.map((child) => {
            if (!userRole || !child.allowedRoles.includes(userRole)) return null;
            const isChildActive = child.href ? pathname === child.href || pathname.startsWith(child.href + "/") : false;
            return (
              <Link
                key={child.name}
                href={child.href || "#"}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                  isChildActive
                    ? "text-primary font-medium bg-primary/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <child.icon className="h-3.5 w-3.5 flex-shrink-0" />
                {child.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      {label}
    </p>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole | undefined;
  const isAdminOrManager = userRole === "admin" || userRole === "manager";

  const userName = session?.user?.email || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <aside
      className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-60 md:bg-card md:border-r md:border-border"
      aria-label="Sidebar navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-border flex-shrink-0">
        <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
          <Clock className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-semibold tracking-tight">Tracker</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4" aria-label="Main navigation">
        {/* Workspace section — visible to all */}
        <div className="space-y-0.5">
          <SectionLabel label="Workspace" />
          {workspaceNav.map((item) => (
            <NavLink key={item.name} item={item} pathname={pathname || ""} userRole={userRole} />
          ))}
        </div>

        {/* Admin section — visible to admin/manager only */}
        {isAdminOrManager && (
          <div className="space-y-0.5">
            <SectionLabel label="Admin" />
            {adminNav.map((item) => (
              <NavLink key={item.name} item={item} pathname={pathname || ""} userRole={userRole} />
            ))}
          </div>
        )}
      </nav>

      {/* User info at bottom */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-border">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary">{userInitial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

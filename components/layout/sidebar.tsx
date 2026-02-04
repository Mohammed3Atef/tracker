"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  Users,
  FileText,
  BarChart3,
  Bug,
  Clock,
  Calendar,
  FileCheck,
  DollarSign,
  Shield,
  ChevronDown,
  ChevronRight,
  List,
  Calendar as CalendarIcon,
  TrendingUp,
} from "lucide-react";

type UserRole = "admin" | "manager" | "employee";

interface NavItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: UserRole[];
  children?: NavItem[];
}

const navigation: NavItem[] = [
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
  {
    name: "Admin Dashboard",
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
    name: "Users Management",
    href: "/admin/users",
    icon: Users,
    allowedRoles: ["admin", "manager"],
  },
  {
    name: "Role Management",
    href: "/admin/roles",
    icon: Shield,
    allowedRoles: ["admin"],
  },
  {
    name: "Leave Management",
    href: "/admin/leaves",
    icon: FileCheck,
    allowedRoles: ["admin", "manager"],
  },
  {
    name: "Payroll Preview",
    href: "/admin/payroll",
    icon: DollarSign,
    allowedRoles: ["admin", "manager"],
  },
  {
    name: "Admin Reports",
    href: "/admin/reports",
    icon: TrendingUp,
    allowedRoles: ["admin", "manager"],
  },
];

function NavItem({ item, pathname, userRole }: { item: NavItem; pathname: string; userRole?: UserRole }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.href ? pathname?.startsWith(item.href) : false;
  const hasActiveChild = item.children?.some((child) => pathname?.startsWith(child.href || ""));

  React.useEffect(() => {
    if (hasActiveChild) {
      setIsExpanded(true);
    }
  }, [hasActiveChild]);

  if (!userRole || !item.allowedRoles.includes(userRole)) {
    return null;
  }

  return (
    <div>
      {item.href ? (
        <Link
          href={item.href}
          className={cn(
            "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
          aria-current={isActive ? "page" : undefined}
        >
          <item.icon
            className={cn(
              "mr-3 h-5 w-5 flex-shrink-0",
              isActive ? "text-primary-foreground" : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
          <span className="flex-1">{item.name}</span>
          {hasChildren && (
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsExpanded(!isExpanded);
              }}
              className="ml-auto"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
        </Link>
      ) : (
        <div
          className={cn(
            "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
            hasActiveChild
              ? "bg-primary/10 text-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <item.icon
            className="mr-3 h-5 w-5 flex-shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="flex-1">{item.name}</span>
          {hasChildren && (
            <>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </>
          )}
        </div>
      )}
      {hasChildren && isExpanded && (
        <div className="ml-4 mt-1 space-y-1">
          {item.children!.map((child) => {
            if (!userRole || !child.allowedRoles.includes(userRole)) {
              return null;
            }
            const isChildActive = child.href ? pathname?.startsWith(child.href) : false;
            return (
              <Link
                key={child.name}
                href={child.href || "#"}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isChildActive
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <child.icon
                  className="mr-3 h-4 w-4 flex-shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                {child.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole | undefined;

  // Filter navigation items based on user role
  const visibleNavigation = navigation.filter((item) => {
    if (!userRole) return false;
    return item.allowedRoles.includes(userRole);
  });

  return (
    <aside
      className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 md:bg-card md:border-r md:border-border"
      aria-label="Sidebar navigation"
    >
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h2 className="text-xl font-semibold">Tracker</h2>
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1" aria-label="Main navigation">
          {visibleNavigation.map((item) => (
            <NavItem key={item.name} item={item} pathname={pathname || ""} userRole={userRole} />
          ))}
        </nav>
      </div>
    </aside>
  );
}

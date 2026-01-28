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
} from "lucide-react";

type UserRole = "admin" | "manager" | "employee";

const navigation = [
  {
    name: "Dashboard",
    href: "/app/dashboard",
    icon: LayoutDashboard,
    allowedRoles: ["admin", "manager", "employee"] as UserRole[],
  },
  {
    name: "Time Tracking",
    href: "/app/time",
    icon: Clock,
    allowedRoles: ["admin", "manager", "employee"] as UserRole[],
  },
  {
    name: "My Leaves",
    href: "/app/leaves",
    icon: Calendar,
    allowedRoles: ["admin", "manager", "employee"] as UserRole[],
  },
  {
    name: "Admin",
    href: "/admin/dashboard",
    icon: BarChart3,
    allowedRoles: ["admin", "manager"] as UserRole[],
  },
  {
    name: "Users Management",
    href: "/admin/users",
    icon: Users,
    allowedRoles: ["admin", "manager"] as UserRole[],
  },
  {
    name: "Leave Management",
    href: "/admin/leaves",
    icon: FileCheck,
    allowedRoles: ["admin", "manager"] as UserRole[],
  },
  {
    name: "Payroll Preview",
    href: "/admin/payroll",
    icon: DollarSign,
    allowedRoles: ["admin", "manager"] as UserRole[],
  },
  {
    name: "API Debug",
    href: "/app/debug",
    icon: Bug,
    allowedRoles: ["admin", "manager"] as UserRole[],
  },
];

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
          {visibleNavigation.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.name}
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
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

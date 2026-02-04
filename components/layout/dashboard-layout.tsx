"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { QuickActions, FloatingQuickActions } from "@/components/time/quick-actions";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/403";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <QuickActions />
      <Sidebar />
      <div className="flex flex-1 flex-col md:pl-64">
        <Navbar />
        <main className="flex-1">{children}</main>
      </div>
      <FloatingQuickActions />
    </div>
  );
}

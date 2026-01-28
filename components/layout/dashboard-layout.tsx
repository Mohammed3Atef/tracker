"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/403";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Sidebar />
      <div className="flex flex-1 flex-col md:pl-64">
        <Navbar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

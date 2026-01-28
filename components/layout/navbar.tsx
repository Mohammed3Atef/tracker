"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

type UserRole = "admin" | "manager" | "employee";

const mobileNavigation = [
  {
    name: "App Dashboard",
    href: "/app/dashboard",
    allowedRoles: ["admin", "manager", "employee"] as UserRole[],
  },
  {
    name: "Time Tracking",
    href: "/app/time",
    allowedRoles: ["admin", "manager", "employee"] as UserRole[],
  },
  {
    name: "My Leaves",
    href: "/app/leaves",
    allowedRoles: ["admin", "manager", "employee"] as UserRole[],
  },
  {
    name: "Admin Dashboard",
    href: "/admin/dashboard",
    allowedRoles: ["admin", "manager"] as UserRole[],
  },
  {
    name: "Users Management",
    href: "/admin/users",
    allowedRoles: ["admin", "manager"] as UserRole[],
  },
  {
    name: "Leave Management",
    href: "/admin/leaves",
    allowedRoles: ["admin", "manager"] as UserRole[],
  },
  {
    name: "Payroll Preview",
    href: "/admin/payroll",
    allowedRoles: ["admin", "manager"] as UserRole[],
  },
  {
    name: "API Debug",
    href: "/app/debug",
    allowedRoles: ["admin", "manager"] as UserRole[],
  },
];

export function Navbar() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const userRole = session?.user?.role as UserRole | undefined;

  // Filter navigation items based on user role
  const visibleMobileNavigation = mobileNavigation.filter((item) => {
    if (!userRole) return false;
    return item.allowedRoles.includes(userRole);
  });

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  };

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link
            href="/"
            className="mr-6 flex items-center space-x-2"
            aria-label="Home"
          >
            <span className="font-bold">Tracker</span>
          </Link>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <SheetHeader>
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
              <div className="flex flex-col space-y-2">
                {visibleMobileNavigation.map((item) => {
                  const isActive = pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "text-foreground/70 transition-colors hover:text-foreground",
                        isActive && "text-foreground font-medium"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none"></div>
          <nav className="flex items-center space-x-2">
            <ThemeToggle />
            {session?.user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <User className="h-5 w-5" />
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.role}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        </div>
      </div>
    </nav>
  );
}

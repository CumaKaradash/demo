"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Calendar,
  FlaskConical,
  Archive,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Home,
  Users,
  LogOut
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/admin-paneli", label: "Ana Sayfa", icon: Home },
  { href: "/admin-paneli/calendar", label: "Takvim", icon: Calendar },
  { href: "/admin-paneli/people", label: "Kişiler", icon: Users },
  { href: "/admin-paneli/tests", label: "Testler", icon: FlaskConical },
  { href: "/admin-paneli/archive", label: "Arşiv", icon: Archive },
  { href: "/admin-paneli/accounting", label: "Muhasebe", icon: Receipt }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-blue-100 bg-white transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex items-center justify-between h-14 px-4 border-b border-blue-100">
        {!collapsed && (
          <span className="text-sm font-medium text-slate-800">Admin</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          aria-label={collapsed ? "Menüyü aç" : "Menüyü kapat"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/admin-paneli"
              ? pathname === "/admin-paneli"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-600 border border-blue-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
      {!collapsed && (
        <div className="p-3 border-t border-blue-100">
          <button
            onClick={() => {
              signOut({ callbackUrl: '/login' });
            }}
            className="flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md w-full"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Çıkış</span>
          </button>
        </div>
      )}
    </aside>
  );
}

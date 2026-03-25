"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock,
  FileText,
  FolderOpen,
  Heart,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/consulta/historial", label: "Historial de consultas", icon: Clock },
  { href: "/consulta/snippets", label: "Mis snippets", icon: Zap },
  { href: "/consulta/consentimientos", label: "Consentimientos", icon: FileText },
  { href: "/consulta/expedientes", label: "Todos mis expedientes", icon: FolderOpen },
];

const BOTTOM_ITEMS: typeof NAV_ITEMS = [];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 flex flex-col"
      style={{
        width: "var(--sidebar-width)",
        background: "var(--sidebar-bg)",
      }}
    >
      <Link href="/consulta" className="block px-5 pt-5 pb-2 no-underline">
        <div className="flex items-center gap-2.5">
          <Heart
            className="h-6 w-6"
            style={{ color: "var(--sidebar-accent)" }}
          />
          <div>
            <div
              className="text-base font-bold"
              style={{ color: "var(--sidebar-text-active)" }}
            >
              MedCapture
            </div>
            <div
              className="text-xs"
              style={{ color: "var(--sidebar-text)" }}
            >
              Expedientes clínicos
            </div>
          </div>
        </div>
      </Link>

      <div
        className="mx-4 mt-4 mb-6 px-3 py-3 rounded-lg flex items-center gap-3"
        style={{ background: "var(--sidebar-bg-hover)" }}
      >
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium"
          style={{
            background: "rgba(77, 182, 168, 0.2)",
            color: "var(--sidebar-accent)",
          }}
        >
          DE
        </div>
        <div>
          <div
            className="text-sm font-medium"
            style={{ color: "var(--sidebar-text-active)" }}
          >
            Dra. Ejemplo
          </div>
          <div
            className="text-xs"
            style={{ color: "var(--sidebar-text)" }}
          >
            Medicina General
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors no-underline"
              style={{
                background: isActive ? "var(--sidebar-bg-hover)" : "transparent",
                color: isActive
                  ? "var(--sidebar-text-active)"
                  : "var(--sidebar-text)",
              }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 space-y-1">
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors no-underline"
              style={{ color: "var(--sidebar-text)" }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

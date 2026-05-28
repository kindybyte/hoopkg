"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const tabs = [
  { href: "/games", label: "Игры" },
  { href: "/courts", label: "Площадки" },
  { href: "/games/new", label: "Создать" },
  { href: "/profile", label: "Профиль" }
];

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-line bg-white sm:hidden">
      <ul className="grid grid-cols-4">
        {tabs.map((t) => {
          const active = pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={clsx(
                  "flex h-16 flex-col items-center justify-center text-xs font-medium",
                  active ? "text-ink" : "text-ink/55"
                )}
              >
                <span
                  className={clsx(
                    "mb-1 h-1 w-6 rounded-full",
                    active ? "bg-hoop" : "bg-transparent"
                  )}
                />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

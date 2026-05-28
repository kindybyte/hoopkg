"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";

const FILTERS: { key: string; value: string; label: string }[] = [
  { key: "when", value: "today", label: "Сегодня" },
  { key: "when", value: "tomorrow", label: "Завтра" },
  { key: "pay", value: "paid", label: "Платные" },
  { key: "pay", value: "free", label: "Бесплатные" },
  { key: "format", value: "3x3", label: "3x3" },
  { key: "format", value: "5x5", label: "5x5" },
  { key: "level", value: "beginner", label: "Новички" },
  { key: "level", value: "advanced", label: "Сильные" }
];

export function GameFilters() {
  const pathname = usePathname();
  const params = useSearchParams();

  function hrefFor(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (next.get(key) === value) next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => {
        const active = params.get(f.key) === f.value;
        return (
          <Link
            key={`${f.key}-${f.value}`}
            href={hrefFor(f.key, f.value)}
            className={clsx(active ? "chip-active" : "chip")}
          >
            {f.label}
          </Link>
        );
      })}
      {params.toString() && (
        <Link href={pathname} className="chip">
          Сбросить
        </Link>
      )}
    </div>
  );
}

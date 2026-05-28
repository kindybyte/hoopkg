import Link from "next/link";
import type { Court } from "@/types/database";
import { formatPrice } from "@/lib/format";

export function AdminCourtsTable({ courts }: { courts: Court[] }) {
  if (courts.length === 0) {
    return <p className="text-sm text-ink/60">Пока нет площадок.</p>;
  }
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead className="text-left text-ink/60">
          <tr>
            <th className="px-4 py-3">Название</th>
            <th className="px-4 py-3">Тип</th>
            <th className="px-4 py-3">Цена</th>
            <th className="px-4 py-3">Статус</th>
            <th className="px-4 py-3 text-right">Действие</th>
          </tr>
        </thead>
        <tbody>
          {courts.map((c) => (
            <tr key={c.id} className="border-t border-line/70">
              <td className="px-4 py-3">{c.name}</td>
              <td className="px-4 py-3">{c.type === "paid" ? "Платный" : "Бесплатно"}</td>
              <td className="px-4 py-3">{formatPrice(c.price_per_hour)}</td>
              <td className="px-4 py-3">{c.status === "active" ? "Активна" : "Скрыта"}</td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/admin/courts/${c.id}`}
                  className="text-navy underline"
                >
                  Редактировать
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

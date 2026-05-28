"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { hideGame } from "@/lib/actions/admin";
import { formatDateTimeRu, gameStatusLabel } from "@/lib/format";
import type { Game } from "@/types/database";

export function AdminGamesTable({
  games
}: {
  games: Array<Game & { courts: { name: string } }>;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  if (games.length === 0) return <p className="text-sm text-ink/60">Пока нет игр.</p>;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="text-left text-ink/60">
          <tr>
            <th className="px-4 py-3">Название</th>
            <th className="px-4 py-3">Площадка</th>
            <th className="px-4 py-3">Дата</th>
            <th className="px-4 py-3">Статус</th>
            <th className="px-4 py-3 text-right">Действие</th>
          </tr>
        </thead>
        <tbody>
          {games.map((g) => (
            <tr key={g.id} className="border-t border-line/70">
              <td className="px-4 py-3">{g.title}</td>
              <td className="px-4 py-3">{g.courts.name}</td>
              <td className="px-4 py-3">{formatDateTimeRu(g.starts_at)}</td>
              <td className="px-4 py-3">{gameStatusLabel(g.status)}</td>
              <td className="px-4 py-3 text-right">
                {g.status !== "cancelled" && g.status !== "finished" && (
                  <button
                    className="text-red-600 underline disabled:opacity-50"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        await hideGame(g.id);
                        router.refresh();
                      })
                    }
                  >
                    Скрыть
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

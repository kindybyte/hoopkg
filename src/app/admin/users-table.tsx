"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { blockUser } from "@/lib/actions/admin";
import { levelLabel } from "@/lib/format";
import type { Profile } from "@/types/database";

export function AdminUsersTable({ users }: { users: Profile[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  if (users.length === 0) return <p className="text-sm text-ink/60">Пока нет пользователей.</p>;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="text-left text-ink/60">
          <tr>
            <th className="px-4 py-3">Имя</th>
            <th className="px-4 py-3">Telegram</th>
            <th className="px-4 py-3">Уровень</th>
            <th className="px-4 py-3">Роль</th>
            <th className="px-4 py-3">Статус</th>
            <th className="px-4 py-3 text-right">Действие</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-line/70">
              <td className="px-4 py-3">{u.name || "—"}</td>
              <td className="px-4 py-3">{u.telegram_username ? `@${u.telegram_username}` : "—"}</td>
              <td className="px-4 py-3">{levelLabel(u.level)}</td>
              <td className="px-4 py-3">{u.role}</td>
              <td className="px-4 py-3">{u.is_blocked ? "Заблокирован" : "Активен"}</td>
              <td className="px-4 py-3 text-right">
                <button
                  disabled={pending}
                  className="underline disabled:opacity-50"
                  onClick={() =>
                    start(async () => {
                      await blockUser(u.id, !u.is_blocked);
                      router.refresh();
                    })
                  }
                >
                  {u.is_blocked ? "Разблокировать" : "Заблокировать"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

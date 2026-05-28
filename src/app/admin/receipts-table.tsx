"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setReceiptStatus } from "@/lib/actions/admin";
import { ReceiptViewer } from "@/components/ReceiptViewer";
import type { RentalReceipt } from "@/types/database";

export function AdminReceiptsTable({
  receipts
}: {
  receipts: Array<RentalReceipt & { games: { title: string; courts: { name: string } } }>;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  if (receipts.length === 0) return <p className="text-sm text-ink/60">Чеков нет.</p>;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <thead className="text-left text-ink/60">
          <tr>
            <th className="px-4 py-3">Игра</th>
            <th className="px-4 py-3">Площадка</th>
            <th className="px-4 py-3">Статус</th>
            <th className="px-4 py-3">Файл</th>
            <th className="px-4 py-3 text-right">Действие</th>
          </tr>
        </thead>
        <tbody>
          {receipts.map((r) => (
            <tr key={r.id} className="border-t border-line/70">
              <td className="px-4 py-3">{r.games?.title}</td>
              <td className="px-4 py-3">{r.games?.courts?.name}</td>
              <td className="px-4 py-3">
                {r.status === "pending"
                  ? "На проверке"
                  : r.status === "approved"
                    ? "Подтверждён"
                    : "Отклонён"}
              </td>
              <td className="px-4 py-3">
                <ReceiptViewer filePath={r.file_path} />
              </td>
              <td className="px-4 py-3 text-right space-x-2">
                <button
                  disabled={pending || r.status === "approved"}
                  className="text-green-700 underline disabled:opacity-50"
                  onClick={() =>
                    start(async () => {
                      await setReceiptStatus(r.id, "approved");
                      router.refresh();
                    })
                  }
                >
                  Подтвердить
                </button>
                <button
                  disabled={pending || r.status === "rejected"}
                  className="text-red-600 underline disabled:opacity-50"
                  onClick={() =>
                    start(async () => {
                      await setReceiptStatus(r.id, "rejected");
                      router.refresh();
                    })
                  }
                >
                  Отклонить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCourt } from "@/lib/actions/admin";

export function DeleteCourtButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function onDelete() {
    if (!confirm("Удалить площадку? Это действие нельзя отменить.")) return;
    setError(null);
    start(async () => {
      const res = await deleteCourt(id);
      if (res?.error) setError(res.error);
      else router.push("/admin");
    });
  }

  return (
    <>
      <button onClick={onDelete} disabled={pending} className="btn-danger w-full">
        {pending ? "..." : "Удалить площадку"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </>
  );
}

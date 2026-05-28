"use client";

import { useState, useTransition } from "react";
import { getReceiptSignedUrl } from "@/lib/actions/games";

export function ReceiptViewer({ filePath }: { filePath: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function open() {
    setError(null);
    start(async () => {
      const url = await getReceiptSignedUrl(filePath);
      if (!url) {
        setError("Нет доступа к чеку.");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button onClick={open} disabled={pending} className="text-navy underline">
        {pending ? "..." : "Открыть"}
      </button>
      {error && <span className="text-red-600">{error}</span>}
    </span>
  );
}

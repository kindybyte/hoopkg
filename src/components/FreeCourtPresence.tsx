"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { leavePresence, markPresence } from "@/lib/actions/presence";

const PRESENCE_WINDOW_MS = 2 * 60 * 60 * 1000;

export function FreeCourtPresence({
  courtId,
  initialCount,
  initialUserPresent
}: {
  courtId: string;
  initialCount: number;
  initialUserPresent: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [present, setPresent] = useState(initialUserPresent);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`presence-card-${courtId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "court_presence",
          filter: `court_id=eq.${courtId}`
        },
        async () => {
          const cutoff = new Date(Date.now() - PRESENCE_WINDOW_MS).toISOString();
          const { count: c } = await supabase
            .from("court_presence")
            .select("id", { head: true, count: "exact" })
            .eq("court_id", courtId)
            .gt("updated_at", cutoff);
          setCount(c ?? 0);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [courtId]);

  function onHere() {
    setError(null);
    start(async () => {
      const res = await markPresence(courtId);
      if (res?.error) setError(res.error);
      else {
        if (!present) setCount((c) => c + 1);
        setPresent(true);
        router.refresh();
      }
    });
  }

  function onGone() {
    setError(null);
    start(async () => {
      const res = await leavePresence(courtId);
      if (res?.error) setError(res.error);
      else {
        setPresent(false);
        setCount((c) => Math.max(0, c - 1));
        router.refresh();
      }
    });
  }

  return (
    <div>
      <p className="text-sm text-ink/70">
        Сейчас на площадке:{" "}
        <span className="font-semibold text-ink">{count}</span>
      </p>
      <div className="mt-2">
        {!present ? (
          <button
            type="button"
            onClick={onHere}
            disabled={pending}
            className="btn-accent w-full !py-2 text-sm"
          >
            {pending ? "..." : "Я здесь"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onGone}
            disabled={pending}
            className="btn-ghost w-full !py-2 text-sm"
          >
            {pending ? "..." : "Я ушёл"}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

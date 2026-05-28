"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { leavePresence, markPresence } from "@/lib/actions/presence";

export function PresenceButtons({
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
      .channel(`presence-${courtId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "court_presence", filter: `court_id=eq.${courtId}` },
        async () => {
          const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
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
        setPresent(true);
        setCount((c) => (present ? c : c + 1));
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
    <div className="card px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink/60">Сейчас на площадке</p>
          <p className="text-2xl font-semibold">{count} человек</p>
        </div>
        <div className="flex gap-2">
          {!present ? (
            <button onClick={onHere} disabled={pending} className="btn-accent">
              Я здесь
            </button>
          ) : (
            <button onClick={onGone} disabled={pending} className="btn-ghost">
              Я ушёл
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

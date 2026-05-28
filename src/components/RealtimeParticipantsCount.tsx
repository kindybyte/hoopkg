"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RealtimeParticipantsCount({
  gameId,
  initial,
  max
}: {
  gameId: string;
  initial: number;
  max: number;
}) {
  const [count, setCount] = useState(initial);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_participants", filter: `game_id=eq.${gameId}` },
        async () => {
          const { count: c } = await supabase
            .from("game_participants")
            .select("id", { head: true, count: "exact" })
            .eq("game_id", gameId)
            .eq("status", "joined");
          setCount(c ?? 0);
          router.refresh();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, router]);

  return (
    <span>
      {count}/{max}
    </span>
  );
}

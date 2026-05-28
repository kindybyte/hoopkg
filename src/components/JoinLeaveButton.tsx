"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { joinGame, leaveGame } from "@/lib/actions/games";

export function JoinLeaveButton({
  gameId,
  isParticipant,
  disabled
}: {
  gameId: string;
  isParticipant: boolean;
  disabled?: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function onClick() {
    setError(null);
    start(async () => {
      const res = isParticipant ? await leaveGame(gameId) : await joinGame(gameId);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={pending || disabled}
        className={isParticipant ? "btn-ghost w-full" : "btn-accent w-full"}
      >
        {pending ? "..." : isParticipant ? "Покинуть игру" : "Присоединиться"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

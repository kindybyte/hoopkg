"use client";

import { useState } from "react";

export function CopyInviteButton({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      window.prompt("Скопируйте ссылку вручную:", url);
    }
  }
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input className="input sm:flex-1" readOnly value={url} />
      <div className="flex gap-2">
        <button onClick={copy} className="btn-ghost flex-1 sm:flex-none">
          {done ? "Скопировано" : "Скопировать"}
        </button>
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(
            "Присоединяйся к игре в баскетбол!"
          )}`}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost flex-1 sm:flex-none"
        >
          Telegram
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Присоединяйся к игре: ${url}`)}`}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost flex-1 sm:flex-none"
        >
          WhatsApp
        </a>
      </div>
    </div>
  );
}

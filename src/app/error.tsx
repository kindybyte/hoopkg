"use client";

export default function ErrorBoundary({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card mx-auto max-w-md px-6 py-10 text-center">
      <h2 className="text-xl font-semibold">Что-то пошло не так</h2>
      <p className="mt-2 text-sm text-ink/60">{error.message || "Попробуйте обновить страницу."}</p>
      <button onClick={reset} className="btn-primary mt-5 inline-flex">
        Попробовать ещё раз
      </button>
    </div>
  );
}

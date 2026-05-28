import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-md px-6 py-12 text-center">
      <h1 className="text-2xl font-semibold">Страница не найдена</h1>
      <p className="mt-2 text-sm text-ink/60">Возможно, она была удалена или ссылка устарела.</p>
      <Link href="/" className="btn-primary mt-5 inline-flex">
        На главную
      </Link>
    </div>
  );
}

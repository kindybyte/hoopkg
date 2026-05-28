import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { Logo } from "@/components/Logo";

export async function Navbar() {
  const profile = await getCurrentProfile();
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-white/85 backdrop-blur">
      <div className="container-px flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>
        <nav className="hidden sm:flex items-center gap-1">
          <Link href="/games" className="px-3 py-2 text-sm font-medium text-ink/80 hover:text-ink">
            Игры
          </Link>
          <Link href="/courts" className="px-3 py-2 text-sm font-medium text-ink/80 hover:text-ink">
            Площадки
          </Link>
          <Link href="/games/new" className="ml-2 btn-accent !py-2 !px-4 text-sm">
            Создать игру
          </Link>
          {profile?.role === "admin" && (
            <Link href="/admin" className="px-3 py-2 text-sm font-medium text-ink/80 hover:text-ink">
              Админка
            </Link>
          )}
          {profile ? (
            <Link href="/profile" className="ml-1 px-3 py-2 text-sm font-medium text-ink">
              {profile.name || "Профиль"}
            </Link>
          ) : (
            <Link href="/login" className="ml-1 btn-ghost !py-2 !px-4 text-sm">
              Войти
            </Link>
          )}
        </nav>
        <div className="sm:hidden">
          {profile ? (
            <Link href="/games/new" className="btn-accent !py-2 !px-3 text-sm">
              + Игра
            </Link>
          ) : (
            <Link href="/login" className="btn-ghost !py-2 !px-3 text-sm">
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

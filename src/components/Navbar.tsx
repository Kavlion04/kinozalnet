import { Link } from "@tanstack/react-router";
import {
  Film,
  Heart,
  ListMusic,
  LogIn,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";

const linkBase =
  "flex items-center gap-2 rounded-full px-3 py-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground";

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const items = (
    <>
      <Link
        to="/search"
        search={{ q: "", type: "", genre: "", sort: "rating" }}
        onClick={() => setOpen(false)}
        className={linkBase}
        activeProps={{ className: "text-foreground bg-secondary" }}
      >
        <Search className="h-4 w-4 shrink-0" />
        <span>Qidirish</span>
      </Link>
      <Link
        to="/favorites"
        onClick={() => setOpen(false)}
        className={linkBase}
        activeProps={{ className: "text-foreground bg-secondary" }}
      >
        <Heart className="h-4 w-4 shrink-0" />
        <span>Sevimli</span>
      </Link>
      <Link
        to="/playlists"
        onClick={() => setOpen(false)}
        className={linkBase}
        activeProps={{ className: "text-foreground bg-secondary" }}
      >
        <ListMusic className="h-4 w-4 shrink-0" />
        <span>To'plamlar</span>
      </Link>
      {isAdmin && (
        <Link
          to="/admin"
          onClick={() => setOpen(false)}
          className={linkBase}
          activeProps={{ className: "text-foreground bg-secondary" }}
        >
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Admin</span>
        </Link>
      )}
      {user && (
        <Link
          to="/profile"
          onClick={() => setOpen(false)}
          className={linkBase}
          activeProps={{ className: "text-foreground bg-secondary" }}
        >
          <User className="h-4 w-4 shrink-0" />
          <span>Profil</span>
        </Link>
      )}
      {user ? (
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            signOut();
          }}
          className={linkBase}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Chiqish</span>
        </button>
      ) : (
        <Link
          to="/auth"
          onClick={() => setOpen(false)}
          className={linkBase}
          activeProps={{ className: "text-foreground bg-secondary" }}
        >
          <LogIn className="h-4 w-4 shrink-0" />
          <span>Kirish</span>
        </Link>
      )}
      {isAdmin && (
        <Link
          to="/add"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>Qo'shish</span>
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_var(--color-primary)]">
            <Film className="h-5 w-5" />
          </span>
          <span className="display truncate text-2xl tracking-tight">
            KINOZAL
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 text-sm lg:flex">{items}</nav>

        {/* Mobile actions */}
        <div className="flex items-center gap-1 lg:hidden">
          <Link
            to="/search"
            search={{ q: "", type: "", genre: "", sort: "rating" }}
            aria-label="Qidirish"
            className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <Search className="h-5 w-5" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menyu"
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-full border border-border/60 bg-secondary/60 text-foreground transition hover:bg-secondary"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden">
          <button
            type="button"
            aria-label="Yopish"
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-[64px] z-30 bg-background/60 backdrop-blur-sm"
          />
          <nav className="relative z-40 flex flex-col gap-1 border-t border-border/60 bg-background/95 px-4 pb-5 pt-3 text-base">
            {items}
          </nav>
        </div>
      )}
    </header>
  );
}

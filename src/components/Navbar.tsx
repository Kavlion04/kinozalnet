import { Link } from "@tanstack/react-router";
import { Film, Heart, ListMusic, LogIn, LogOut, Plus, ShieldCheck, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Film className="h-5 w-5" />
          </div>
          <span className="display text-2xl">KINOZAL</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/favorites"
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "text-foreground bg-secondary" }}
          >
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Sevimli</span>
          </Link>
          <Link
            to="/playlists"
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "text-foreground bg-secondary" }}
          >
            <ListMusic className="h-4 w-4" />
            <span className="hidden sm:inline">To'plamlar</span>
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "text-foreground bg-secondary" }}
              aria-label="Admin panel"
            >
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          {user ? (
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "text-foreground bg-secondary" }}
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Kirish</span>
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/add"
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Qo'shish</span>
            </Link>
          )}

        </nav>
      </div>
    </header>
  );
}

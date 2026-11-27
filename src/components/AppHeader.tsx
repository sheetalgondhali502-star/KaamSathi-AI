import { Link } from "@tanstack/react-router";
import { Factory, Mic, LayoutDashboard } from "lucide-react";

export function AppHeader() {
  const base = "inline-flex items-center gap-2 rounded-lg px-3 py-2 sm:px-4 text-sm sm:text-base font-semibold transition-colors";
  return (
    <header className="sticky top-0 z-20 bg-primary text-primary-foreground shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground"><Factory className="h-5 w-5" /></span>
          <span className="truncate text-lg font-extrabold tracking-tight">KaamSathi<span className="text-accent"> AI</span></span>
        </Link>
        <nav className="flex shrink-0 gap-1">
          <Link to="/" className={base} activeOptions={{ exact: true }} activeProps={{ className: "bg-accent text-accent-foreground" }} inactiveProps={{ className: "hover:bg-primary-foreground/10" }}>
            <Mic className="h-4 w-4" /><span className="hidden sm:inline">Worker</span>
          </Link>
          <Link to="/dashboard" className={base} activeProps={{ className: "bg-accent text-accent-foreground" }} inactiveProps={{ className: "hover:bg-primary-foreground/10" }}>
            <LayoutDashboard className="h-4 w-4" /><span className="hidden sm:inline">Supervisor</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

import { Link, Outlet, useNavigate, useRouteContext } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  LayoutDashboard,
  Layers,
  PlayCircle,
  NotebookPen,
  HelpCircle,
  RotateCcw,
  CandlestickChart,
  Settings,
  Menu,
  LogOut,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { allLessonsQuery } from "@/lib/data";
import { progressPercent } from "@/lib/progress";
import { Logo } from "./Logo";
import { GlobalSearch } from "./GlobalSearch";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/modules", label: "Meus módulos", icon: Layers },
  { to: "/lessons", label: "Todas as aulas", icon: PlayCircle },
  { to: "/notebook", label: "Caderno de estudos", icon: NotebookPen },
  { to: "/doubts", label: "Minhas dúvidas", icon: HelpCircle },
  { to: "/reviews", label: "Revisões", icon: RotateCcw },
  { to: "/journal", label: "Diário de gráficos", icon: CandlestickChart },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          activeProps={{ className: "bg-sidebar-accent text-foreground font-medium" }}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell() {
  const [open, setOpen] = useState(false);
  const { user } = useRouteContext({ from: "/_authenticated" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: lessons } = useQuery(allLessonsQuery());
  const total = lessons?.length ?? 0;
  const done = lessons?.filter((l) => l.status === "completed").length ?? 0;
  const pct = progressPercent(done, total);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 md:flex">
        <Logo className="mb-8 px-2" />
        <NavLinks />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 max-w-[85vw] bg-sidebar p-4">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Logo className="mb-8 px-2" />
          <NavLinks onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-2 md:hidden">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </Button>
          <Logo className="min-w-0" />
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <GlobalSearch />
            <div className="hidden items-center gap-2 sm:flex" title={`${done} de ${total} aulas concluídas`}>
              <span className="text-xs text-muted-foreground">Progresso</span>
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-success transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="font-mono text-xs text-success">{pct}%</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Perfil">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                  <Settings className="mr-2 h-4 w-4" /> Configurações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function useSignOut() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}

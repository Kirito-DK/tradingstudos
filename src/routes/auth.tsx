import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — TradeStudy" },
      { name: "description", content: "Acesso privado à sua plataforma de estudos TradeStudy." },
      { property: "og:title", content: "Entrar — TradeStudy" },
      { property: "og:description", content: "Acesso privado à sua plataforma de estudos TradeStudy." },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error("Não foi possível entrar. Verifique e-mail e senha.");
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  async function onForgot(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) toast.error("Não foi possível enviar o e-mail. Tente novamente.");
    else toast.success("Se o e-mail estiver cadastrado, você receberá um link de redefinição.");
  }

  return (
    <div className="bg-grid flex min-h-screen items-center justify-center px-4">
      <div className="panel w-full max-w-sm p-8 shadow-2xl">
        <Logo className="mb-8" />
        {mode === "login" ? (
          <form onSubmit={onLogin} className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold">Entrar</h1>
              <p className="text-sm text-muted-foreground">Acesso privado aos seus estudos.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Entrando..." : "Entrar"}
            </Button>
            <button type="button" onClick={() => setMode("forgot")} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
              Esqueci minha senha
            </button>
          </form>
        ) : (
          <form onSubmit={onForgot} className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold">Recuperar senha</h1>
              <p className="text-sm text-muted-foreground">Enviaremos um link para redefinir sua senha.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="femail">E-mail</Label>
              <Input id="femail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Enviando..." : "Enviar link"}
            </Button>
            <button type="button" onClick={() => setMode("login")} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
              Voltar ao login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

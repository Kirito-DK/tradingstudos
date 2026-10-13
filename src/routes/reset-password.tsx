import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Redefinir senha — TradeStudy" },
      { name: "description", content: "Defina uma nova senha para sua conta TradeStudy." },
      { property: "og:title", content: "Redefinir senha — TradeStudy" },
      { property: "og:description", content: "Defina uma nova senha para sua conta TradeStudy." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("A senha deve ter pelo menos 8 caracteres.");
    if (password !== confirm) return toast.error("As senhas não coincidem.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error("Não foi possível alterar a senha. Abra novamente o link do e-mail.");
    toast.success("Senha alterada.");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="bg-grid flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="panel w-full max-w-sm space-y-4 p-8">
        <Logo className="mb-4" />
        <h1 className="text-xl font-semibold">Nova senha</h1>
        <div className="space-y-2">
          <Label htmlFor="p1">Nova senha</Label>
          <Input id="p1" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p2">Confirmar senha</Label>
          <Input id="p2" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </form>
    </div>
  );
}

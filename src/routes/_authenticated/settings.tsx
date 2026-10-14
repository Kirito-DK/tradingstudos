import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/common";
import { useSignOut } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Configurações — TradeStudy" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const qc = useQueryClient();
  const signOut = useSignOut();
  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()).data,
  });
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setName(profile.data?.display_name ?? ""); }, [profile.data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, display_name: name.trim() || null });
    setBusy(false);
    if (error) { toast.error("Não foi possível salvar."); return; }
    toast.success("Perfil atualizado.");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  return (
    <>
      <PageHeader title="Configurações" />
      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={save} className="panel space-y-4 p-5">
          <h2 className="font-medium">Perfil</h2>
          <div className="space-y-2">
            <Label htmlFor="dn">Nome de exibição</Label>
            <Input id="dn" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button type="submit" disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button>
        </form>
        <div className="panel space-y-3 p-5">
          <h2 className="font-medium">Conta</h2>
          <p className="text-sm"><span className="text-muted-foreground">E-mail: </span>{user.email}</p>
          <p className="text-sm"><span className="text-muted-foreground">Criada em: </span>{new Date(user.created_at).toLocaleDateString("pt-BR")}</p>
          <p className="text-xs text-muted-foreground">Exportação dos estudos chega na Etapa 3.</p>
          <Button variant="outline" onClick={signOut}>Encerrar sessão</Button>
        </div>
      </div>
    </>
  );
}

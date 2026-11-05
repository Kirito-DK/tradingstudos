import { pageHead } from "@/lib/page-head";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InstallApp } from "@/components/InstallApp";
import { PageHeader } from "@/components/common";
import { useSignOut } from "@/components/AppShell";
import { exportCSV, exportJSON } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => pageHead("Configurações — TradeStudy", "Gerencie seu perfil, exporte seus estudos e instale o TradeStudy."),
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
  const [exporting, setExporting] = useState(false);
  async function run(fn: () => Promise<void>) {
    setExporting(true);
    try { await fn(); toast.success("Exportação concluída."); } catch { toast.error("Não foi possível exportar."); }
    setExporting(false);
  }
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
          <p className="break-all text-sm"><span className="text-muted-foreground">E-mail: </span>{user.email}</p>
          <p className="text-sm"><span className="text-muted-foreground">Criada em: </span>{new Date(user.created_at).toLocaleDateString("pt-BR")}</p>
          <Button variant="outline" onClick={signOut}>Encerrar sessão</Button>
        </div>
        <div className="panel space-y-3 p-5 lg:col-span-2">
          <h2 className="font-medium">Exportar meus estudos</h2>
          <p className="text-sm text-muted-foreground">Baixe uma cópia completa dos seus dados. Apenas o que pertence à sua conta é exportado.</p>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button className="col-span-2" disabled={exporting} onClick={() => run(exportJSON)}>Cópia completa (JSON)</Button>
            {([["modules","Módulos"],["lessons","Aulas"],["lesson_notes","Anotações"],["doubts","Dúvidas"],["review_logs","Revisões"],["chart_entries","Diário"]] as const).map(([t, l]) => (
              <Button key={t} variant="outline" disabled={exporting} onClick={() => run(() => exportCSV(t))}>{l} (CSV)</Button>
            ))}
          </div>
        </div>
        <InstallApp />
      </div>
    </>
  );
}

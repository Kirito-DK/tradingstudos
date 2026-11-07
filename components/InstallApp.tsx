import { useEffect, useState } from "react";
import { Download, Share, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const mode = window.matchMedia("(display-mode: standalone)");
    const refresh = () => setInstalled(mode.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const ready = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const done = () => { setInstalled(true); setPrompt(null); };
    refresh();
    mode.addEventListener("change", refresh);
    window.addEventListener("beforeinstallprompt", ready);
    window.addEventListener("appinstalled", done);
    return () => {
      mode.removeEventListener("change", refresh);
      window.removeEventListener("beforeinstallprompt", ready);
      window.removeEventListener("appinstalled", done);
    };
  }, []);

  async function install() {
    if (!prompt) { setOpen(true); return; }
    setBusy(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
    } catch { setOpen(true); }
    finally { setPrompt(null); setBusy(false); }
  }

  return (
    <section className="space-y-3 border-t border-border pt-5 lg:col-span-2">
      <h2 className="font-medium">TradeStudy no celular</h2>
      <Button onClick={install} disabled={installed || busy} className="w-full sm:w-auto">
        <Download className="h-4 w-4" />{installed ? "App instalado" : busy ? "Abrindo..." : "Instalar app"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-lg sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Instalar TradeStudy</DialogTitle>
            <DialogDescription>Abra o site publicado no navegador do celular. A instalação não funciona dentro desta prévia.</DialogDescription>
          </DialogHeader>
          <a href="https://tradingstudos.lovable.app/settings" target="_blank" rel="noopener noreferrer" className="break-all text-sm text-primary underline">tradingstudos.lovable.app</a>
          <div className="space-y-4 text-sm">
            <div><h3 className="mb-1 flex items-center gap-2 font-medium"><Share className="h-4 w-4" />iPhone / iPad</h3><p>No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início. Confirme em Adicionar.</p></div>
            <div><h3 className="mb-1 flex items-center gap-2 font-medium"><Smartphone className="h-4 w-4" />Android</h3><p>No Chrome, abra o menu ⋮ e escolha Instalar app ou Adicionar à tela inicial.</p></div>
            <p className="text-muted-foreground">O app precisa de internet para acessar e salvar seus estudos.</p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
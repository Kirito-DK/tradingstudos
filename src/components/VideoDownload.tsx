import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { safeVideoFilename, validateDownloadSource } from "@/lib/video-download";

type VideoDownloadProps = {
  url: string | null;
  authorized: boolean;
  title: string;
};

type DownloadState = "idle" | "downloading" | "done" | "error" | "cancelled";

export function VideoDownload({ url, authorized, title }: VideoDownloadProps) {
  const [state, setState] = useState<DownloadState>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const controllerRef = useRef<AbortController | null>(null);

  const validation = validateDownloadSource(url, authorized);
  const isDownloading = state === "downloading";

  async function startDownload() {
    if (!validation.valid || isDownloading) return;

    const controller = new AbortController();
    controllerRef.current = controller;
    setState("downloading");
    setProgress(0);
    setMessage("Conectando à fonte autorizada...");

    try {
      const response = await fetch(validation.url, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`A fonte respondeu com erro HTTP ${response.status}.`);
      }
      if (response.url) {
        const finalHost = new URL(response.url).hostname.toLowerCase();
        if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(finalHost)) {
          throw new Error("A fonte redirecionou para o YouTube. Não é permitido baixar mídia do player.");
        }
      }

      const contentType = (response.headers.get("content-type") ?? "")
        .split(";")[0]
        .trim()
        .toLowerCase();
      if (!response.body) {
        throw new Error("O navegador não conseguiu ler o arquivo para acompanhar o progresso.");
      }

      const totalHeader = response.headers.get("content-length");
      const total = totalHeader ? Number(totalHeader) : 0;
      const reader = response.body.getReader();
      const chunks: BlobPart[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.byteLength;
          if (total > 0) {
            setProgress(Math.min(99, Math.round((received / total) * 100)));
            setMessage(`${formatBytes(received)} de ${formatBytes(total)}`);
          } else {
            setMessage(`${formatBytes(received)} recebidos`);
          }
        }
      }

      const blob = new Blob(chunks, { type: contentType === "video/mp4" ? "video/mp4" : "application/octet-stream" });
      if (blob.size === 0) throw new Error("O arquivo recebido está vazio.");

      // Confirm MP4 either through the server MIME type or the ISO-BMFF ftyp/styp box.
      const signature = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
      const boxType = String.fromCharCode(...signature.slice(4, 8));
      if (contentType !== "video/mp4" && boxType !== "ftyp" && boxType !== "styp") {
        throw new Error("O conteúdo recebido não foi identificado como MP4. O download foi bloqueado.");
      }

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = safeVideoFilename(title);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);

      setProgress(100);
      setState("done");
      setMessage(`Download preparado (${formatBytes(blob.size)}).`);
    } catch (error) {
      if (controller.signal.aborted) {
        setState("cancelled");
        setMessage("Download cancelado.");
      } else {
        setState("error");
        setMessage(error instanceof Error
          ? `${error.message} Verifique se a fonte permite CORS e download direto.`
          : "Não foi possível baixar este arquivo.");
      }
    } finally {
      controllerRef.current = null;
    }
  }

  function cancelDownload() {
    controllerRef.current?.abort();
  }

  return (
    <section className="panel space-y-3 p-4" aria-label="Download da videoaula">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">Material para estudar offline</p>
          <p className="text-xs text-muted-foreground">
            O arquivo é baixado diretamente da fonte autorizada, sem passar pelo armazenamento do TradeStudy.
          </p>
        </div>
        {isDownloading ? (
          <Button variant="outline" size="sm" onClick={cancelDownload}>
            <X className="mr-1 h-4 w-4" />Cancelar
          </Button>
        ) : (
          <Button size="sm" onClick={startDownload} disabled={!validation.valid}>
            <Download className="mr-1 h-4 w-4" />Baixar aula em MP4
          </Button>
        )}
      </div>

      {!validation.valid && (
        <p className="flex items-start gap-2 text-xs text-muted-foreground" role="status">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{validation.message}
        </p>
      )}

      {isDownloading && (
        <div className="space-y-2" aria-live="polite">
          <div className="flex justify-between gap-3 text-xs text-muted-foreground">
            <span>{message}</span>
            <span>{progress > 0 ? `${progress}%` : "Aguardando dados..."}</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {(state === "done" || state === "error" || state === "cancelled") && (
        <p
          role="status"
          className={`flex items-start gap-2 text-xs ${
            state === "error" ? "text-destructive" : state === "done" ? "text-success" : "text-muted-foreground"
          }`}
        >
          {state === "done" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> :
            state === "error" ? <AlertCircle className="h-4 w-4 shrink-0" /> :
              <X className="h-4 w-4 shrink-0" />}
          {message}
        </p>
      )}
      {state === "done" && (
        <Button variant="ghost" size="sm" onClick={() => { setState("idle"); setMessage(""); setProgress(0); }}>
          <Download className="mr-1 h-4 w-4" />Baixar novamente
        </Button>
      )}
    </section>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

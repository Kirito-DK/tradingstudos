import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseYouTubeId, youTubeWatchUrl } from "@/lib/youtube";

export function VideoDownload({ url }: { url: string | null }) {
  const videoId = parseYouTubeId(url);

  if (!url) {
    return (
      <div className="space-y-2">
        <Button variant="outline" size="sm" disabled>
          <Download className="mr-1 h-4 w-4" />
          Vídeo não cadastrado
        </Button>
      </div>
    );
  }

  if (!videoId) {
    return (
      <div className="space-y-2">
        <Button variant="outline" size="sm" disabled>
          <Download className="mr-1 h-4 w-4" />
          Link de vídeo inválido
        </Button>
        <p role="status" className="text-xs text-muted-foreground">
          Edite a aula e informe um link válido do YouTube.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" size="sm" asChild>
        <a
          href={youTubeWatchUrl(videoId)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir vídeo desta aula no YouTube"
        >
          <ExternalLink className="mr-1 h-4 w-4" />
          Abrir vídeo no YouTube
        </a>
      </Button>
      <p className="text-xs text-muted-foreground">
        Para assistir offline, use os recursos oficiais de download do YouTube,
        quando disponíveis para sua conta e região.
      </p>
    </div>
  );
}

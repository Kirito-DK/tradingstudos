import { parseYouTubeId } from "./youtube";
export function videoDownloadAvailability(url: string | null | undefined) {
  if (!url) return "Esta aula não possui vídeo cadastrado.";
  if (parseYouTubeId(url)) return "O YouTube não permite baixar este vídeo pelo TradeStudy. Downloads, quando disponíveis, são feitos no próprio YouTube e não geram um arquivo aqui.";
  return "Download indisponível: esta fonte não possui um mecanismo oficial de download integrado ao TradeStudy.";
}
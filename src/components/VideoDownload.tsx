import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { videoDownloadAvailability } from "@/lib/video-download";
export function VideoDownload({ url }: { url: string | null }) {
  const [message, setMessage] = useState("");
  return <div className="space-y-2">
    <Button variant="outline" size="sm" onClick={() => setMessage(videoDownloadAvailability(url))}><Download className="mr-1 h-4 w-4" />Baixar vídeo</Button>
    {message && <p role="status" className="text-xs text-muted-foreground">{message}</p>}
  </div>;
}
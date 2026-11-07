const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
]);

export type DownloadSourceValidation =
  | { valid: true; url: string }
  | { valid: false; message: string };

/**
 * A download source must be a direct HTTPS URL, separate from YouTube,
 * and explicitly authorized by the person managing the lesson.
 * The actual response is checked again for MP4 content before saving.
 */
export function validateDownloadSource(
  rawUrl: string | null | undefined,
  authorized: boolean,
): DownloadSourceValidation {
  const value = rawUrl?.trim();
  if (!value) return { valid: false, message: "Esta aula não possui um arquivo MP4 cadastrado." };
  if (!authorized) return { valid: false, message: "O download não foi liberado pelo responsável pela aula." };

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { valid: false, message: "O endereço do arquivo MP4 é inválido." };
  }

  if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
    return { valid: false, message: "A fonte do MP4 precisa ser um endereço HTTPS válido." };
  }
  if (YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) {
    return { valid: false, message: "Links do YouTube não são fontes diretas de MP4." };
  }

  return { valid: true, url: url.toString() };
}

export function safeVideoFilename(title: string): string {
  const base = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
  return `${base || "aula"}.mp4`;
}

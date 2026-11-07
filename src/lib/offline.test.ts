import { describe, expect, it } from "vitest";
import { cachedValue } from "./offline";
import { refuseOfflineWorker } from "./register-offline";
import { videoDownloadAvailability } from "./video-download";

describe("Offline consultation", () => {
  const entries = [
    { queryKey: ["lessons"], data: [{ id: "aula-1", title: "Gestão de risco", next_review_at: "2026-11-08" }], updatedAt: 1 },
    { queryKey: ["notes", "search", ""], data: [{ lesson_id: "aula-1", summary: "Limitar o risco" }], updatedAt: 1 },
    { queryKey: ["reviewLogs"], data: [{ lesson_id: "aula-1" }], updatedAt: 1 },
  ];
  it("makes a loaded lesson available for offline consultation", () => {
    expect(cachedValue(entries, ["lesson", "aula-1"])).toEqual({ found: true, data: { id: "aula-1", title: "Gestão de risco", next_review_at: "2026-11-08" } });
  });
  it("makes loaded notebook notes available inside the lesson", () => {
    expect(cachedValue(entries, ["notes", "aula-1"]).data).toEqual({ lesson_id: "aula-1", summary: "Limitar o risco" });
  });
  it("makes loaded reviews available", () => {
    expect(cachedValue(entries, ["reviewLogs"]).data).toEqual([{ lesson_id: "aula-1" }]);
  });
  it("does not invent data for an unloaded lesson", () => {
    expect(cachedValue(entries, ["lesson", "aula-2"]).found).toBe(false);
  });
  it.each(["id-preview--app.lovable.app", "preview-v2--app.gpt-eng.com", "project--app-dev.lovable.app", "x.lovableproject.com", "beta.lovable.dev"])("blocks worker in %s", (host) => {
    expect(refuseOfflineWorker(true, host, false, false)).toBe(true);
  });
  it("allows the published app", () => expect(refuseOfflineWorker(true, "tradingstudos.lovable.app", false, false)).toBe(false));
  it("allows a custom domain whose name resembles a preview", () => expect(refuseOfflineWorker(true, "preview-v2--shop.example.com", false, false)).toBe(false));
  it("blocks dev, iframe and kill switch", () => {
    expect(refuseOfflineWorker(false, "localhost", false, false)).toBe(true);
    expect(refuseOfflineWorker(true, "tradingstudos.lovable.app", true, false)).toBe(true);
    expect(refuseOfflineWorker(true, "tradingstudos.lovable.app", false, true)).toBe(true);
  });
});
describe("Official video downloads", () => {
  it("does not offer extraction of a YouTube video", () => {
    expect(videoDownloadAvailability("https://youtu.be/dQw4w9WgXcQ")).toContain("não permite");
  });
  it("does not expose an unintegrated private source as a download", () => {
    expect(videoDownloadAvailability("https://example.com/private.mp4?token=secret")).not.toContain("token=secret");
  });
});
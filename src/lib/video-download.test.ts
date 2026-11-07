import { describe, expect, it } from "vitest";
import { safeVideoFilename, validateDownloadSource } from "./video-download";

describe("validateDownloadSource", () => {
  it("requires a URL and explicit authorization", () => {
    expect(validateDownloadSource(null, true).valid).toBe(false);
    expect(validateDownloadSource("https://cdn.example.com/class.mp4", false).valid).toBe(false);
  });

  it("accepts an authorized HTTPS source outside YouTube", () => {
    expect(validateDownloadSource("https://cdn.example.com/class.mp4", true)).toEqual({
      valid: true,
      url: "https://cdn.example.com/class.mp4",
    });
  });

  it("rejects YouTube URLs and insecure HTTP URLs", () => {
    expect(validateDownloadSource("https://youtube.com/watch?v=abcdefghijk", true).valid).toBe(false);
    expect(validateDownloadSource("http://cdn.example.com/class.mp4", true).valid).toBe(false);
  });
});

describe("safeVideoFilename", () => {
  it("creates a safe MP4 filename from the lesson title", () => {
    expect(safeVideoFilename("Aula: Introdução ao Forex")).toBe("Aula-Introducao-ao-Forex.mp4");
  });
});

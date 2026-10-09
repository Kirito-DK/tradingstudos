import { describe, expect, it } from "vitest";
import { parseYouTubeId } from "./youtube";

describe("parseYouTubeId", () => {
  it("accepts watch links", () => {
    expect(parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10")).toBe("dQw4w9WgXcQ");
  });
  it("accepts youtu.be links", () => {
    expect(parseYouTubeId("https://youtu.be/dQw4w9WgXcQ?si=abc")).toBe("dQw4w9WgXcQ");
  });
  it("accepts shorts and embed links", () => {
    expect(parseYouTubeId("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("rejects other domains and bad ids", () => {
    expect(parseYouTubeId("https://evil.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseYouTubeId("https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseYouTubeId("https://www.youtube.com/watch?v=short")).toBeNull();
    expect(parseYouTubeId("javascript:alert(1)")).toBeNull();
  });
});

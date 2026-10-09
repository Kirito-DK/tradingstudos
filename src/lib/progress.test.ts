import { describe, expect, it } from "vitest";
import { progressPercent } from "./progress";

describe("progressPercent", () => {
  it("returns 0 for a module without lessons", () => {
    expect(progressPercent(0, 0)).toBe(0);
  });
  it("is completed lessons over total lessons", () => {
    expect(progressPercent(1, 4)).toBe(25);
    expect(progressPercent(3, 3)).toBe(100);
  });
});

import { describe, expect, it } from "vitest";
import { addDaysISO, reviewBucket } from "./review";

const base = new Date(2026, 0, 30); // 30 Jan 2026

describe("quick review dates", () => {
  it("computes real dates from the selected day", () => {
    expect(addDaysISO(1, base)).toBe("2026-01-31");
    expect(addDaysISO(3, base)).toBe("2026-02-02");
    expect(addDaysISO(7, base)).toBe("2026-02-06");
    expect(addDaysISO(30, base)).toBe("2026-03-01");
  });
});

describe("reviewBucket", () => {
  const today = "2026-01-30";
  it("classifies overdue, today and upcoming", () => {
    expect(reviewBucket({ next_review_at: "2026-01-29", review_status: "pending" }, today)).toBe("overdue");
    expect(reviewBucket({ next_review_at: "2026-01-30", review_status: "pending" }, today)).toBe("today");
    expect(reviewBucket({ next_review_at: "2026-02-05", review_status: "later" }, today)).toBe("upcoming");
  });
  it("treats reviewed with no next date as done", () => {
    expect(reviewBucket({ next_review_at: null, review_status: "reviewed" }, today)).toBe("done");
  });
});

import { describe, expect, it, vi } from "vitest";
import { analyzePassword, analyzePasswordAsync } from "./index";

describe("analyzePasswordAsync", () => {
  it("returns offline analysis when checkPwned is false", async () => {
    const offline = analyzePassword("hunter2");
    const result = await analyzePasswordAsync("hunter2", { checkPwned: false });

    expect(result.isPwned).toBe(false);
    expect(result.label).toBe(offline.label);
    expect(result.score).toBe(offline.score);
  });

  it("marks breached passwords as pwned", async () => {
    const fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => "1E4C9B93F3F0682250B6CF8331B7EE68FD8:999\n",
    })) as typeof fetch;

    const result = await analyzePasswordAsync("password", { checkPwned: true, hibp: { fetch } });

    expect(result.isPwned).toBe(true);
    expect(result.label).toBe("pwned");
    expect(result.pwnedCount).toBe(999);
  });

  it("falls back gracefully when HIBP fails", async () => {
    const fetch = vi.fn(async () => ({
      ok: false,
      status: 503,
      text: async () => "",
    })) as typeof fetch;

    const result = await analyzePasswordAsync("xK9#mP2$vL7@nQ4!", {
      checkPwned: true,
      hibp: { fetch, retryCount: 0, retryDelayMs: 1 },
    });

    expect(result.isPwned).toBe(false);
    expect(result.feedback.warning).toMatch(/Could not verify breach status/);
  });
});

describe("analyzePassword", () => {
  it("returns empty label for blank input", () => {
    expect(analyzePassword("").label).toBe("empty");
  });
});

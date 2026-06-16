import { describe, expect, it, vi } from "vitest";
import { checkPwnedPassword } from "./hibp";

function mockFetch(responses: Array<{ ok: boolean; status?: number; body?: string }>) {
  return vi.fn(async () => {
    const next = responses.shift();
    if (!next) {
      throw new Error("No mock response left.");
    }

    return {
      ok: next.ok,
      status: next.status ?? (next.ok ? 200 : 500),
      text: async () => next.body ?? "",
    } as Response;
  });
}

describe("checkPwnedPassword", () => {
  it("returns not pwned for empty password", async () => {
    await expect(checkPwnedPassword("")).resolves.toEqual({ isPwned: false, count: 0 });
  });

  it("detects a pwned password from the range response", async () => {
    const fetch = mockFetch([
      {
        ok: true,
        body: "1E4C9B93F3F0682250B6CF8331B7EE68FD8:42\n",
      },
    ]);

    await expect(checkPwnedPassword("password", { fetch })).resolves.toEqual({
      isPwned: true,
      count: 42,
    });
  });

  it("returns not pwned when suffix is absent", async () => {
    const fetch = mockFetch([
      {
        ok: true,
        body: "0000000000000000000000000000000000000:1\n",
      },
    ]);

    await expect(checkPwnedPassword("unique-password-xyz", { fetch })).resolves.toEqual({
      isPwned: false,
      count: 0,
    });
  });

  it("matches suffix case-insensitively", async () => {
    const fetch = mockFetch([
      {
        ok: true,
        body: "1e4c9b93f3f0682250b6cf8331b7ee68fd8:7\n",
      },
    ]);

    await expect(checkPwnedPassword("password", { fetch })).resolves.toEqual({
      isPwned: true,
      count: 7,
    });
  });

  it("retries after HTTP 429", async () => {
    const fetch = mockFetch([
      { ok: false, status: 429 },
      { ok: true, body: "" },
    ]);

    await expect(
      checkPwnedPassword("unique-password-xyz", { fetch, retryCount: 1, retryDelayMs: 1 }),
    ).resolves.toEqual({ isPwned: false, count: 0 });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("throws when fetch is unavailable", async () => {
    const originalFetch = globalThis.fetch;
    // @ts-expect-error test override
    globalThis.fetch = undefined;

    await expect(checkPwnedPassword("password")).rejects.toThrow("fetch is not available");

    globalThis.fetch = originalFetch;
  });
});

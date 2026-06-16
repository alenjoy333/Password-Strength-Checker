export type HibpOptions = {
  fetch?: typeof fetch;
  baseUrl?: string;
  timeoutMs?: number;
  /** Add padding to the range request to reduce response fingerprinting. Default: true */
  addPadding?: boolean;
  /** Retries after HTTP 429/503. Default: 2 */
  retryCount?: number;
  /** Initial delay before retry in ms. Doubles each attempt. Default: 1000 */
  retryDelayMs?: number;
};

export type PwnedPasswordResult = {
  isPwned: boolean;
  count: number;
};

const DEFAULT_BASE_URL = "https://api.pwnedpasswords.com/range";
const RETRYABLE_STATUSES = new Set([429, 503]);

async function sha1Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).toUpperCase().padStart(2, "0"))
    .join("");
}

function parseCount(line: string): number {
  const [, count = "0"] = line.split(":");
  return Number.parseInt(count, 10) || 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchRange(
  fetchImpl: typeof fetch,
  url: string,
  timeoutMs: number,
  retryCount: number,
  retryDelayMs: number,
): Promise<Response> {
  const maxAttempts = retryCount + 1;
  let delayMs = retryDelayMs;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(url, {
        method: "GET",
        headers: { Accept: "text/plain" },
        signal: controller.signal,
      });

      if (RETRYABLE_STATUSES.has(response.status) && attempt < maxAttempts - 1) {
        await sleep(delayMs);
        delayMs *= 2;
        continue;
      }

      return response;
    } catch (error) {
      if (attempt < maxAttempts - 1) {
        await sleep(delayMs);
        delayMs *= 2;
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("HIBP request failed after retries.");
}

export async function checkPwnedPassword(password: string, options: HibpOptions = {}): Promise<PwnedPasswordResult> {
  if (!password) {
    return { isPwned: false, count: 0 };
  }

  const fetchImpl = options.fetch ?? globalThis.fetch;
  if (!fetchImpl) {
    throw new Error("fetch is not available. Provide options.fetch for this environment.");
  }

  const hash = await sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const url = new URL(`${baseUrl}/${prefix}`);

  if (options.addPadding ?? true) {
    url.searchParams.set("padding", "true");
  }

  const response = await fetchRange(
    fetchImpl,
    url.toString(),
    options.timeoutMs ?? 5000,
    options.retryCount ?? 2,
    options.retryDelayMs ?? 1000,
  );

  if (!response.ok) {
    throw new Error(`HIBP request failed with status ${response.status}.`);
  }

  const body = await response.text();
  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [hashSuffix] = trimmed.split(":");
    if (hashSuffix.toUpperCase() === suffix) {
      return { isPwned: true, count: parseCount(trimmed) };
    }
  }

  return { isPwned: false, count: 0 };
}

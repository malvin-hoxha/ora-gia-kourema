import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const CONFIGURED_API_URL = "https://api.test.example/api/";
const NORMALIZED_API_URL = "https://api.test.example/api";
const TEST_GOOGLE_CLIENT_ID =
  "phase5-test.apps.googleusercontent.com";

type FetchImplementation = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

function createDeferred<T>() {
  let resolvePromise!: (
    value: T | PromiseLike<T>,
  ) => void;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve: resolvePromise,
  };
}

function jsonResponse(
  status: number,
  data: unknown,
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function getRequestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function installFetchMock(
  implementation: FetchImplementation,
) {
  const fetchMock = vi.fn<FetchImplementation>(implementation);

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

function getCalledUrls(
  fetchMock: ReturnType<typeof installFetchMock>,
) {
  return fetchMock.mock.calls.map(([input]) =>
    getRequestUrl(input),
  );
}

function expectIncludedCredentials(
  fetchMock: ReturnType<typeof installFetchMock>,
) {
  for (const [, init] of fetchMock.mock.calls) {
    expect(init?.credentials).toBe("include");
  }
}

async function loadApiClient() {
  return import("../../src/api/api-client");
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("VITE_API_URL", CONFIGURED_API_URL);
  vi.stubEnv(
    "VITE_GOOGLE_CLIENT_ID",
    TEST_GOOGLE_CLIENT_ID,
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("apiRequest refresh single-flight behavior", () => {
  it("shares one in-flight refresh across concurrent unauthorized requests", async () => {
    const firstUrl = `${NORMALIZED_API_URL}/protected/first`;
    const secondUrl = `${NORMALIZED_API_URL}/protected/second`;
    const refreshUrl = `${NORMALIZED_API_URL}/auth/refresh`;
    const refreshResponse = createDeferred<Response>();
    const refreshStarted = createDeferred<void>();
    const protectedCallCounts = new Map<string, number>();
    const fetchMock = installFetchMock(async (input) => {
      const url = getRequestUrl(input);

      if (url === refreshUrl) {
        refreshStarted.resolve();
        return refreshResponse.promise;
      }

      const callCount = (protectedCallCounts.get(url) ?? 0) + 1;
      protectedCallCounts.set(url, callCount);

      if (url === firstUrl) {
        return callCount === 1
          ? jsonResponse(401, { message: "First access expired" })
          : jsonResponse(200, { result: "first-success" });
      }

      if (url === secondUrl) {
        return callCount === 1
          ? jsonResponse(401, { message: "Second access expired" })
          : jsonResponse(200, { result: "second-success" });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    const { apiRequest } = await loadApiClient();
    let firstSettled = false;
    let secondSettled = false;

    const firstRequest = apiRequest<{ result: string }>(
      "/protected/first",
    ).finally(() => {
      firstSettled = true;
    });
    const secondRequest = apiRequest<{ result: string }>(
      "/protected/second",
    ).finally(() => {
      secondSettled = true;
    });

    await refreshStarted.promise;
    await Promise.resolve();

    expect(protectedCallCounts.get(firstUrl)).toBe(1);
    expect(protectedCallCounts.get(secondUrl)).toBe(1);
    expect(
      getCalledUrls(fetchMock).filter((url) => url === refreshUrl),
    ).toHaveLength(1);
    expect(getCalledUrls(fetchMock)).toEqual([
      firstUrl,
      secondUrl,
      refreshUrl,
    ]);
    expect(firstSettled).toBe(false);
    expect(secondSettled).toBe(false);

    refreshResponse.resolve(
      jsonResponse(200, { refreshed: true }),
    );

    await expect(
      Promise.all([firstRequest, secondRequest]),
    ).resolves.toEqual([
      { result: "first-success" },
      { result: "second-success" },
    ]);
    expect(protectedCallCounts.get(firstUrl)).toBe(2);
    expect(protectedCallCounts.get(secondUrl)).toBe(2);

    const completedUrls = getCalledUrls(fetchMock);
    const refreshIndex = completedUrls.indexOf(refreshUrl);

    expect(completedUrls.filter((url) => url === refreshUrl)).toHaveLength(1);
    expect(completedUrls.filter((url) => url === firstUrl)).toHaveLength(2);
    expect(completedUrls.filter((url) => url === secondUrl)).toHaveLength(2);
    expect(completedUrls.lastIndexOf(firstUrl)).toBeGreaterThan(refreshIndex);
    expect(completedUrls.lastIndexOf(secondUrl)).toBeGreaterThan(refreshIndex);
    expectIncludedCredentials(fetchMock);
  });

  it("shares a failed refresh and does not retry protected requests", async () => {
    const firstUrl = `${NORMALIZED_API_URL}/protected/failure-first`;
    const secondUrl = `${NORMALIZED_API_URL}/protected/failure-second`;
    const refreshUrl = `${NORMALIZED_API_URL}/auth/refresh`;
    const refreshResponse = createDeferred<Response>();
    const refreshStarted = createDeferred<void>();
    const fetchMock = installFetchMock(async (input) => {
      const url = getRequestUrl(input);

      if (url === refreshUrl) {
        refreshStarted.resolve();
        return refreshResponse.promise;
      }

      if (url === firstUrl) {
        return jsonResponse(401, {
          message: "First protected request failed",
        });
      }

      if (url === secondUrl) {
        return jsonResponse(401, {
          message: "Second protected request failed",
        });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    const { apiRequest, ApiError } = await loadApiClient();
    const firstRequest = apiRequest("/protected/failure-first");
    const secondRequest = apiRequest("/protected/failure-second");

    await refreshStarted.promise;
    await Promise.resolve();

    expect(getCalledUrls(fetchMock)).toEqual([
      firstUrl,
      secondUrl,
      refreshUrl,
    ]);

    refreshResponse.resolve(
      jsonResponse(401, { message: "Refresh failed" }),
    );

    const [firstResult, secondResult] = await Promise.allSettled([
      firstRequest,
      secondRequest,
    ]);

    if (
      firstResult.status !== "rejected" ||
      !(firstResult.reason instanceof ApiError)
    ) {
      throw new Error("First request did not reject with ApiError");
    }

    if (
      secondResult.status !== "rejected" ||
      !(secondResult.reason instanceof ApiError)
    ) {
      throw new Error("Second request did not reject with ApiError");
    }

    expect(firstResult.reason).toMatchObject({
      status: 401,
      message: "First protected request failed",
      data: { message: "First protected request failed" },
    });
    expect(secondResult.reason).toMatchObject({
      status: 401,
      message: "Second protected request failed",
      data: { message: "Second protected request failed" },
    });
    expect(getCalledUrls(fetchMock)).toEqual([
      firstUrl,
      secondUrl,
      refreshUrl,
    ]);
    expectIncludedCredentials(fetchMock);
  });

  it("clears settled single-flight state so a later refresh can start", async () => {
    const failedUrl = `${NORMALIZED_API_URL}/protected/failed-cycle`;
    const laterUrl = `${NORMALIZED_API_URL}/protected/later-cycle`;
    const refreshUrl = `${NORMALIZED_API_URL}/auth/refresh`;
    let refreshCallCount = 0;
    let laterCallCount = 0;
    const fetchMock = installFetchMock(async (input) => {
      const url = getRequestUrl(input);

      if (url === refreshUrl) {
        refreshCallCount += 1;

        return refreshCallCount === 1
          ? jsonResponse(401, { message: "Refresh failed" })
          : jsonResponse(200, { refreshed: true });
      }

      if (url === failedUrl) {
        return jsonResponse(401, { message: "Initial cycle failed" });
      }

      if (url === laterUrl) {
        laterCallCount += 1;

        return laterCallCount === 1
          ? jsonResponse(401, { message: "Later access expired" })
          : jsonResponse(200, { result: "later-success" });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    const { apiRequest } = await loadApiClient();

    await expect(
      apiRequest("/protected/failed-cycle"),
    ).rejects.toMatchObject({
      status: 401,
      message: "Initial cycle failed",
    });

    await expect(
      apiRequest<{ result: string }>("/protected/later-cycle"),
    ).resolves.toEqual({ result: "later-success" });

    expect(refreshCallCount).toBe(2);
    expect(laterCallCount).toBe(2);
    expect(getCalledUrls(fetchMock)).toEqual([
      failedUrl,
      refreshUrl,
      laterUrl,
      refreshUrl,
      laterUrl,
    ]);
    expectIncludedCredentials(fetchMock);
  });
});

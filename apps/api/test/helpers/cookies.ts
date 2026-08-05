type ResponseHeaders = Record<string, unknown>;

export function getSetCookies(headers: ResponseHeaders) {
  const rawSetCookies = headers["set-cookie"];

  if (Array.isArray(rawSetCookies)) {
    return rawSetCookies.filter(
      (cookie): cookie is string =>
        typeof cookie === "string",
    );
  }

  return typeof rawSetCookies === "string"
    ? [rawSetCookies]
    : [];
}

export function findCookie(
  setCookies: string[],
  cookieName: string,
) {
  return setCookies.find((cookie) =>
    cookie.startsWith(`${cookieName}=`),
  );
}

export function requireCookie(
  setCookies: string[],
  cookieName: string,
) {
  const cookie = findCookie(setCookies, cookieName);

  if (!cookie) {
    throw new Error(`Response did not include the ${cookieName} cookie`);
  }

  return cookie;
}

export function extractCookieValue(cookie: string) {
  const firstSegment = cookie.split(";", 1)[0];
  const separatorIndex = firstSegment?.indexOf("=") ?? -1;

  if (!firstSegment || separatorIndex < 0) {
    throw new Error(
      "Response contained a malformed authentication cookie",
    );
  }

  return decodeURIComponent(
    firstSegment.slice(separatorIndex + 1),
  );
}

export function toCookieHeader(cookie: string) {
  const firstSegment = cookie.split(";", 1)[0];

  if (!firstSegment) {
    throw new Error("Cannot create a Cookie header from an empty cookie");
  }

  return firstSegment;
}

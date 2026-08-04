function getRequiredEnvironmentValue(
  name:
    | "VITE_API_URL"
    | "VITE_GOOGLE_CLIENT_ID",
  value: string | undefined,
) {
  const normalizedValue =
    value?.trim();

  if (!normalizedValue) {
    throw new Error(
      `${name} is not configured`,
    );
  }

  return normalizedValue;
}

function normalizeApiUrl(
  value: string,
) {
  /*
   * Same-origin production deployment:
   * VITE_API_URL=/api
   */
  if (value.startsWith("/")) {
    if (value.startsWith("//")) {
      throw new Error(
        "VITE_API_URL must not start with //",
      );
    }

    const parsedUrl = new URL(
      value,
      "https://frontend.invalid",
    );

    if (
      parsedUrl.search ||
      parsedUrl.hash
    ) {
      throw new Error(
        "VITE_API_URL must not contain a query string or fragment",
      );
    }

    const normalizedPath =
      parsedUrl.pathname.replace(
        /\/+$/,
        "",
      );

    if (!normalizedPath) {
      throw new Error(
        "VITE_API_URL must contain an API path such as /api",
      );
    }

    return normalizedPath;
  }

  /*
   * Separate API origin:
   * http://localhost:4000/api
   * https://api.example.com/api
   */
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(
      "VITE_API_URL must be a valid HTTP URL or a root-relative path such as /api",
    );
  }

  if (
    parsedUrl.protocol !== "http:" &&
    parsedUrl.protocol !== "https:"
  ) {
    throw new Error(
      "VITE_API_URL must use HTTP or HTTPS",
    );
  }

  if (
    parsedUrl.username ||
    parsedUrl.password
  ) {
    throw new Error(
      "VITE_API_URL must not contain credentials",
    );
  }

  if (
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error(
      "VITE_API_URL must not contain a query string or fragment",
    );
  }

  const normalizedPath =
    parsedUrl.pathname === "/"
      ? ""
      : parsedUrl.pathname.replace(
          /\/+$/,
          "",
        );

  return (
    parsedUrl.origin +
    normalizedPath
  );
}

function validateGoogleClientId(
  value: string,
) {
  if (
    !value.endsWith(
      ".apps.googleusercontent.com",
    )
  ) {
    throw new Error(
      "VITE_GOOGLE_CLIENT_ID must be a Google OAuth client ID",
    );
  }

  return value;
}

const rawApiUrl =
  getRequiredEnvironmentValue(
    "VITE_API_URL",
    import.meta.env.VITE_API_URL,
  );

const rawGoogleClientId =
  getRequiredEnvironmentValue(
    "VITE_GOOGLE_CLIENT_ID",
    import.meta.env
      .VITE_GOOGLE_CLIENT_ID,
  );

export const webEnv = Object.freeze({
  API_URL: normalizeApiUrl(
    rawApiUrl,
  ),

  GOOGLE_CLIENT_ID:
    validateGoogleClientId(
      rawGoogleClientId,
    ),
});
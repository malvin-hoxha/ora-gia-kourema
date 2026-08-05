import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const testEnvironmentPath = fileURLToPath(
  new URL("../../.env.test.local", import.meta.url),
);
const developmentEnvironmentPath = fileURLToPath(
  new URL("../../.env", import.meta.url),
);

dotenv.config({ path: testEnvironmentPath, quiet: true });

type DatabaseIdentity = {
  protocol: "postgresql:";
  hostname: string;
  port: string;
  databaseName: string;
};

function parsePostgresUrl(
  value: string,
  variableName: string,
  rejectFragment: boolean,
) {
  if (value !== value.trim()) {
    throw new Error(
      `${variableName} must not contain leading or trailing whitespace`,
    );
  }

  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${variableName} must be a valid URL`);
  }

  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error(
      `${variableName} must use the postgres or postgresql protocol`,
    );
  }

  if (
    !parsed.hostname ||
    !parsed.username ||
    !parsed.password ||
    (rejectFragment && parsed.hash)
  ) {
    const fragmentRequirement = rejectFragment
      ? " without a URL fragment"
      : "";

    throw new Error(
      `${variableName} must include a host, username, password, and database name${fragmentRequirement}`,
    );
  }

  let databaseName: string;

  try {
    databaseName = decodeURIComponent(parsed.pathname.slice(1));
  } catch {
    throw new Error(
      `${variableName} contains an invalid encoded database name`,
    );
  }

  if (!databaseName || databaseName.includes("/")) {
    throw new Error(
      `${variableName} must include exactly one database name`,
    );
  }

  return {
    parsed,
    databaseName,
  };
}

export function getDatabaseIdentity(
  value: string,
  variableName: string,
): DatabaseIdentity {
  const { parsed, databaseName } = parsePostgresUrl(
    value,
    variableName,
    false,
  );

  return {
    protocol: "postgresql:",
    hostname: parsed.hostname.toLowerCase().replace(/\.$/, ""),
    port: parsed.port || "5432",
    databaseName,
  };
}

export function requireDifferentDatabaseIdentities(
  testDatabaseUrl: string,
  developmentDatabaseUrl: string,
) {
  const testIdentity = getDatabaseIdentity(
    testDatabaseUrl,
    "DATABASE_URL_TEST",
  );
  const developmentIdentity = getDatabaseIdentity(
    developmentDatabaseUrl,
    "development DATABASE_URL",
  );

  if (
    testIdentity.protocol === developmentIdentity.protocol &&
    testIdentity.hostname === developmentIdentity.hostname &&
    testIdentity.port === developmentIdentity.port &&
    testIdentity.databaseName === developmentIdentity.databaseName
  ) {
    throw new Error(
      "DATABASE_URL_TEST must not point to the same database as the development DATABASE_URL",
    );
  }
}

export function requireDevelopmentDatabaseUrl(
  developmentDatabaseUrlFromFile: string | undefined,
  fallbackDevelopmentDatabaseUrl: string | undefined,
) {
  const developmentDatabaseUrl =
    developmentDatabaseUrlFromFile ||
    fallbackDevelopmentDatabaseUrl;

  if (!developmentDatabaseUrl) {
    throw new Error(
      "A development database URL is required for safety comparison. Define DATABASE_URL in apps/api/.env or DATABASE_URL_DEVELOPMENT in apps/api/.env.test.local.",
    );
  }

  return developmentDatabaseUrl;
}

function readDevelopmentDatabaseUrl() {
  let developmentDatabaseUrlFromFile: string | undefined;

  try {
    const developmentEnvironment = dotenv.parse(
      readFileSync(developmentEnvironmentPath),
    );

    developmentDatabaseUrlFromFile =
      developmentEnvironment.DATABASE_URL;
  } catch (error) {
    const isMissingFile =
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT";

    if (!isMissingFile) {
      throw new Error(
        "Unable to read apps/api/.env for development database safety comparison",
        { cause: error },
      );
    }
  }

  return requireDevelopmentDatabaseUrl(
    developmentDatabaseUrlFromFile,
    process.env.DATABASE_URL_DEVELOPMENT,
  );
}

function requireSafeTestDatabaseUrl() {
  const rawTestDatabaseUrl = process.env.DATABASE_URL_TEST;

  if (!rawTestDatabaseUrl) {
    throw new Error(
      "DATABASE_URL_TEST is required for API integration tests",
    );
  }

  const { databaseName } = parsePostgresUrl(
    rawTestDatabaseUrl,
    "DATABASE_URL_TEST",
    true,
  );

  if (
    !databaseName ||
    databaseName.includes("/") ||
    !databaseName.endsWith("_test")
  ) {
    throw new Error(
      "DATABASE_URL_TEST database name must end with _test",
    );
  }

  requireDifferentDatabaseIdentities(
    rawTestDatabaseUrl,
    readDevelopmentDatabaseUrl(),
  );

  return rawTestDatabaseUrl;
}

process.env.DATABASE_URL = requireSafeTestDatabaseUrl();

if (process.argv.includes("--migrate")) {
  const require = createRequire(import.meta.url);
  const prismaCli = require.resolve("prisma/build/index.js");
  const migration = spawnSync(
    process.execPath,
    [prismaCli, "migrate", "deploy"],
    {
      cwd: fileURLToPath(new URL("../..", import.meta.url)),
      env: process.env,
      stdio: "inherit",
    },
  );

  if (migration.error) {
    throw migration.error;
  }

  if (migration.status !== 0) {
    throw new Error(
      `prisma migrate deploy exited with status ${migration.status ?? "unknown"}`,
    );
  }
}

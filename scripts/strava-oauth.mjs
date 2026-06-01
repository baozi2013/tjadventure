import crypto from "node:crypto";
import {
  DEFAULT_ENV_FILE,
  getTokenFilePath,
  loadEnvFile,
  readRequiredEnv,
  requestStravaToken,
  readTokenFile,
  refreshTokenIfNeeded,
  summarizeToken,
  writeTokenFile,
} from "./lib/strava-client.mjs";

function usage() {
  return `Usage:
  npm run strava:oauth -- auth-url [--redirect-uri <url>] [--scope <scope>]
  npm run strava:oauth -- exchange --code <code>
  npm run strava:oauth -- refresh
  npm run strava:oauth -- status

Required env:
  STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET in ${DEFAULT_ENV_FILE}

Token storage:
  ${getTokenFilePath()} (override with STRAVA_TOKEN_FILE)

OAuth notes:
  Use auth-url first, authorize the app in a browser, then copy the "code"
  query parameter from the redirected URL into the exchange command.`;
}

function readOptionValue(args, index, optionName) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${optionName} requires a value.`);
  }
  return value;
}

function parseOptions(args) {
  const options = {
    command: args[0] ?? "",
    code: "",
    redirectUri: process.env.STRAVA_REDIRECT_URI ?? "http://localhost:3000/api/strava/callback",
    scope: "read,activity:read_all",
  };

  for (let index = 1; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help") {
      console.log(usage());
      process.exit(0);
    }
    if (argument === "--code") {
      options.code = readOptionValue(args, index, argument);
      index += 1;
      continue;
    }
    if (argument === "--redirect-uri") {
      options.redirectUri = readOptionValue(args, index, argument);
      index += 1;
      continue;
    }
    if (argument === "--scope") {
      options.scope = readOptionValue(args, index, argument);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

function buildAuthUrl(options) {
  const url = new URL("https://www.strava.com/oauth/authorize");
  url.searchParams.set("client_id", readRequiredEnv("STRAVA_CLIENT_ID"));
  url.searchParams.set("redirect_uri", options.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("approval_prompt", "auto");
  url.searchParams.set("scope", options.scope);
  url.searchParams.set("state", crypto.randomBytes(12).toString("hex"));
  return url.toString();
}

async function main() {
  await loadEnvFile();
  const options = parseOptions(process.argv.slice(2));

  if (!options.command || options.command === "--help") {
    console.log(usage());
    return;
  }

  if (options.command === "auth-url") {
    console.log(buildAuthUrl(options));
    return;
  }

  if (options.command === "exchange") {
    if (!options.code) throw new Error("exchange requires --code <code>.");
    const token = await requestStravaToken({
      grant_type: "authorization_code",
      code: options.code,
    });
    const tokenFile = await writeTokenFile(token);
    console.log(`Strava token saved: ${tokenFile}`);
    console.log(JSON.stringify(summarizeToken(token), null, 2));
    return;
  }

  if (options.command === "refresh") {
    const current = await readTokenFile();
    const { token, refreshed } = await refreshTokenIfNeeded(current, { safetyWindowSeconds: Number.POSITIVE_INFINITY });
    console.log(refreshed ? "Strava token refreshed." : "Strava token still valid.");
    console.log(JSON.stringify(summarizeToken(token), null, 2));
    return;
  }

  if (options.command === "status") {
    const token = await readTokenFile();
    console.log(JSON.stringify(summarizeToken(token), null, 2));
    return;
  }

  throw new Error(`Unknown command: ${options.command}`);
}

main().catch((error) => {
  console.error(`[strava-oauth] ${error.message}`);
  console.error(usage());
  process.exitCode = 1;
});

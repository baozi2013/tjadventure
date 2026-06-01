import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const DEFAULT_ENV_FILE = path.join(os.homedir(), ".openclaw", ".env");
export const DEFAULT_TOKEN_FILE = path.join(os.homedir(), ".openclaw", "strava-token.json");

function parseEnvLine(line) {
  const normalized = line.trim();
  if (!normalized || normalized.startsWith("#")) return null;

  const match = normalized.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!match) return null;

  let value = match[2].trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return {
    key: match[1],
    value,
  };
}

export async function loadEnvFile(envFile = process.env.STRAVA_ENV_FILE ?? DEFAULT_ENV_FILE) {
  try {
    const content = await fs.readFile(envFile, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (parsed && process.env[parsed.key] == null) {
        process.env[parsed.key] = parsed.value;
      }
    }
    return envFile;
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

export function readRequiredEnv(name) {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing ${name}. Add it to ${process.env.STRAVA_ENV_FILE ?? DEFAULT_ENV_FILE}.`);
  }

  return value.trim();
}

export function getTokenFilePath() {
  return process.env.STRAVA_TOKEN_FILE ?? DEFAULT_TOKEN_FILE;
}

export async function readTokenFile(tokenFile = getTokenFilePath()) {
  try {
    const raw = await fs.readFile(tokenFile, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`Missing Strava token file: ${tokenFile}. Run npm run strava:oauth -- exchange --code <code>.`);
    }
    throw error;
  }
}

export async function writeTokenFile(token, tokenFile = getTokenFilePath()) {
  await fs.mkdir(path.dirname(tokenFile), { recursive: true, mode: 0o700 });
  await fs.writeFile(tokenFile, `${JSON.stringify(token, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await fs.chmod(tokenFile, 0o600);
  return tokenFile;
}

export function summarizeToken(token) {
  return {
    athleteId: token.athlete?.id ?? null,
    athleteUsername: token.athlete?.username ?? null,
    scope: token.scope ?? "",
    expiresAt: token.expires_at ? new Date(token.expires_at * 1000).toISOString() : null,
    hasRefreshToken: Boolean(token.refresh_token),
  };
}

export async function requestStravaToken(params) {
  const body = new URLSearchParams({
    client_id: readRequiredEnv("STRAVA_CLIENT_ID"),
    client_secret: readRequiredEnv("STRAVA_CLIENT_SECRET"),
    ...params,
  });

  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "TJAdventure/1.0 Strava sync",
    },
    body,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Strava token request failed (${response.status}): ${payload.message ?? "unknown error"}`);
  }

  return payload;
}

export async function refreshTokenIfNeeded(token, options = {}) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const safetyWindowSeconds = options.safetyWindowSeconds ?? 300;

  if (token.access_token && token.expires_at && token.expires_at - safetyWindowSeconds > nowSeconds) {
    return {
      token,
      refreshed: false,
    };
  }

  if (!token.refresh_token) {
    throw new Error("Stored Strava token has no refresh_token.");
  }

  const refreshedToken = await requestStravaToken({
    grant_type: "refresh_token",
    refresh_token: token.refresh_token,
  });
  const nextToken = {
    ...token,
    ...refreshedToken,
    athlete: refreshedToken.athlete ?? token.athlete,
  };
  await writeTokenFile(nextToken);

  return {
    token: nextToken,
    refreshed: true,
  };
}

export async function getFreshAccessToken() {
  await loadEnvFile();
  const token = await readTokenFile();
  return refreshTokenIfNeeded(token);
}

export async function stravaApi(pathname, options = {}) {
  const { token } = await getFreshAccessToken();
  const url = new URL(pathname, "https://www.strava.com");

  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      if (value != null && value !== "") url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "User-Agent": "TJAdventure/1.0 Strava sync",
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Strava API request failed (${response.status}): ${payload.message ?? pathname}`);
  }

  return payload;
}

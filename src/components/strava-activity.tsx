"use client";

import { useEffect } from "react";

const STRAVA_EMBED_SCRIPT_SRC = "https://strava-embeds.com/embed.js";

declare global {
  interface Window {
    __STRAVA_EMBED_BOOTSTRAP__?: () => void;
  }
}

type StravaActivityProps = {
  id: string;
  token?: string;
  embedStyle?: "standard" | string;
  fromEmbed?: boolean;
};

function loadStravaEmbedScript(onReady: () => void) {
  if (window.__STRAVA_EMBED_BOOTSTRAP__) {
    onReady();
    return undefined;
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${STRAVA_EMBED_SCRIPT_SRC}"]`,
  );
  if (existingScript) {
    existingScript.addEventListener("load", onReady, { once: true });
    return () => existingScript.removeEventListener("load", onReady);
  }

  const script = document.createElement("script");
  script.src = STRAVA_EMBED_SCRIPT_SRC;
  script.async = true;
  script.addEventListener("load", onReady, { once: true });
  document.body.appendChild(script);

  return () => script.removeEventListener("load", onReady);
}

export function StravaActivity({
  id,
  token,
  embedStyle = "standard",
  fromEmbed = false,
}: StravaActivityProps) {
  useEffect(() => {
    let isMounted = true;

    const bootstrap = () => {
      if (!isMounted) return;
      window.__STRAVA_EMBED_BOOTSTRAP__?.();
    };

    const cleanup = loadStravaEmbedScript(bootstrap);
    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [id, token, embedStyle, fromEmbed]);

  if (!id) return null;

  return (
    <div className="strava-embed-frame">
      <div
        className="strava-embed-placeholder"
        data-embed-type="activity"
        data-embed-id={id}
        data-style={embedStyle}
        data-from-embed={String(fromEmbed)}
        data-token={token}
      />
    </div>
  );
}

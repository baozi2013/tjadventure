"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

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

function loadStravaEmbedScript(onReady: () => void, onError: () => void) {
  if (window.__STRAVA_EMBED_BOOTSTRAP__) {
    onReady();
    return undefined;
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${STRAVA_EMBED_SCRIPT_SRC}"]`,
  );
  if (existingScript) {
    existingScript.addEventListener("load", onReady, { once: true });
    existingScript.addEventListener("error", onError, { once: true });
    return () => {
      existingScript.removeEventListener("load", onReady);
      existingScript.removeEventListener("error", onError);
    };
  }

  const script = document.createElement("script");
  script.src = STRAVA_EMBED_SCRIPT_SRC;
  script.async = true;
  script.addEventListener("load", onReady, { once: true });
  script.addEventListener("error", onError, { once: true });
  document.body.appendChild(script);

  return () => {
    script.removeEventListener("load", onReady);
    script.removeEventListener("error", onError);
  };
}

export function StravaActivity({
  id,
  token,
  embedStyle = "standard",
  fromEmbed = false,
}: StravaActivityProps) {
  const t = useTranslations("StravaActivity");
  const [loadedForId, setLoadedForId] = useState(id);
  const [hasError, setHasError] = useState(false);

  if (id !== loadedForId) {
    setLoadedForId(id);
    setHasError(false);
  }

  useEffect(() => {
    let isMounted = true;

    const bootstrap = () => {
      if (!isMounted) return;
      window.__STRAVA_EMBED_BOOTSTRAP__?.();
    };

    const handleError = () => {
      if (!isMounted) return;
      setHasError(true);
    };

    const cleanup = loadStravaEmbedScript(bootstrap, handleError);
    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [id, token, embedStyle, fromEmbed]);

  if (!id) return null;

  if (hasError) {
    return (
      <div className="strava-embed-frame">
        <a
          href={`https://www.strava.com/activities/${id}`}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 bg-neutral-50 px-5 py-8 text-center text-sm text-neutral-600 transition hover:bg-neutral-100 dark:border-white/15 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <span className="font-medium text-neutral-900 dark:text-white">{t("unavailableTitle")}</span>
          <span>{t("openOnStrava")}</span>
        </a>
      </div>
    );
  }

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

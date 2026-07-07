"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const t = useTranslations("ErrorPage");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-5 pb-20 pt-10 text-center sm:px-8">
      <div className="rounded-3xl border border-black/10 bg-white p-10 shadow-sm dark:border-white/10 dark:bg-neutral-950">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{t("eyebrow")}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-4 text-base leading-8 text-neutral-700 dark:text-neutral-300">{t("description")}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex rounded-full border border-neutral-900 bg-neutral-900 px-5 py-2.5 text-sm font-semibold !text-white shadow-sm shadow-black/10 transition hover:bg-neutral-800 dark:border-white/20 dark:bg-white dark:!text-neutral-950 dark:hover:bg-neutral-100"
          >
            {t("retry")}
          </button>
          <Link
            href="/"
            className="inline-flex rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-white/15 dark:text-neutral-200 dark:hover:bg-neutral-900"
          >
            {t("backHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}

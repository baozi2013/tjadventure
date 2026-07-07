import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAllLearningEntries } from "@/lib/learning";
import { LearningCard } from "@/components/learning-card";
import { SiteNav } from "@/components/site-nav";
import { createPageMetadata } from "@/lib/metadata";
import { resolveLocale, type LocaleParams } from "@/i18n/locale";

type PageProps = {
  params: LocaleParams;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "Learning" });

  return createPageMetadata({
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    pathname: "/learning",
    locale,
    keywords: ["Godot", "Godot Engine", "game development", "learning journal", "devlog"],
  });
}

export default async function LearningPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Learning" });
  const entries = getAllLearningEntries(locale);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
      <SiteNav current="learning" />

      <header className="mb-8 rounded-3xl border border-black/10 bg-white p-7 dark:border-white/10 dark:bg-neutral-950">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{t("collection")}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-3 max-w-2xl text-base leading-8 text-neutral-700 dark:text-neutral-300">{t("intro")}</p>
      </header>

      {entries.length === 0 ? (
        <p className="rounded-2xl border border-black/10 bg-white px-5 py-6 text-sm text-neutral-600 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-300">
          {t("empty")}
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry, index) => (
            <LearningCard key={entry.slug} entry={entry} priority={index === 0} />
          ))}
        </div>
      )}
    </main>
  );
}

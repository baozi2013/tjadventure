import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteNav } from "@/components/site-nav";
import { createPageMetadata } from "@/lib/metadata";
import { resolveLocale, type LocaleParams } from "@/i18n/locale";

type PageProps = {
  params: LocaleParams;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "About" });

  return createPageMetadata({
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    pathname: "/about",
    locale,
    image: "/about/tian.png",
    keywords: ["about TJ Adventure", "family travel bloggers", "travel photography family"],
  });
}

export default async function AboutPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "About" });

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
      <SiteNav current="about" />

      <section className="rounded-3xl border border-black/10 bg-white p-7 dark:border-white/10 dark:bg-neutral-950">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-4 text-base leading-8 text-neutral-700 dark:text-neutral-300">
          {t("intro")}
        </p>

        <div className="mt-8 space-y-7">
          <article>
            <h2 className="text-xl font-semibold">{t("tianName")}</h2>
            <p className="mt-2 text-base leading-8 text-neutral-700 dark:text-neutral-300">
              {t("tian1")}
            </p>
            <p className="mt-2 text-base leading-8 text-neutral-700 dark:text-neutral-300">
              {t("tian2")}
            </p>
            <p className="mt-2 text-base leading-8 text-neutral-700 dark:text-neutral-300">
              {t("tianGear")}
            </p>
            <div className="relative mt-4 h-72 w-full overflow-hidden rounded-2xl border border-black/10 sm:h-96 dark:border-white/10">
              <Image
                src="/about/tian.png"
                alt={t("tianAlt")}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 768px"
              />
            </div>
          </article>

          <article>
            <h2 className="text-xl font-semibold">{t("janeName")}</h2>
            <p className="mt-2 text-base leading-8 text-neutral-700 dark:text-neutral-300">
              {t("jane1")}
            </p>
            <p className="mt-2 text-base leading-8 text-neutral-700 dark:text-neutral-300">
              {t("jane2")}
            </p>
            <p className="mt-2 text-base leading-8 text-neutral-700 dark:text-neutral-300">
              {t("janeGear")}
            </p>
            <div className="relative mt-4 h-64 w-full overflow-hidden rounded-2xl border border-black/10 sm:h-80 dark:border-white/10">
              <Image
                src="/trips/palm-spring-2025/day1-3.jpg"
                alt={t("janeAlt")}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 768px"
              />
            </div>
          </article>

          <article>
            <h2 className="text-xl font-semibold">{t("williamName")}</h2>
            <div className="relative mt-4 h-72 w-full overflow-hidden rounded-2xl border border-black/10 sm:h-96 dark:border-white/10">
              <Image
                src="/about/william.png"
                alt="William"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 768px"
              />
            </div>
          </article>

          <article>
            <h2 className="text-xl font-semibold">{t("georgeName")}</h2>
            <div className="relative mt-4 h-72 w-full overflow-hidden rounded-2xl border border-black/10 sm:h-96 dark:border-white/10">
              <Image
                src="/about/george.png"
                alt="George"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 768px"
              />
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

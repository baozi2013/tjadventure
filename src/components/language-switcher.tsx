"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import { getLocalizedPathname, stripLocalePrefix, type Locale } from "@/i18n/routing";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function buildHref(pathname: string, search: string, locale: Locale) {
  const cleanPathname = stripLocalePrefix(pathname);
  const localizedPathname = getLocalizedPathname(cleanPathname, locale);
  return search ? `${localizedPathname}?${search}` : localizedPathname;
}

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("Nav");
  const search = searchParams.toString();

  const options: Array<{ locale: Locale; label: string }> = [
    { locale: "zh-CN", label: t("zh") },
    { locale: "en-US", label: t("en") },
  ];

  return (
    <div
      aria-label={t("languageLabel")}
      className="ml-auto inline-flex rounded-full border border-black/10 bg-white p-0.5 text-xs font-semibold shadow-sm dark:border-white/10 dark:bg-neutral-950"
    >
      {options.map((option) => {
        const isActive = option.locale === locale;

        return (
          <Link
            key={option.locale}
            href={buildHref(pathname, search, option.locale)}
            aria-current={isActive ? "true" : undefined}
            className={cx(
              "rounded-full px-2.5 py-1 transition",
              isActive
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-900 dark:hover:text-white",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}

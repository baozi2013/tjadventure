"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

type RandomTripButtonProps = {
  hrefs: string[];
  className?: string;
};

export function RandomTripButton({ hrefs, className }: RandomTripButtonProps) {
  const router = useRouter();
  const t = useTranslations("RandomTrip");

  if (hrefs.length === 0) return null;

  function handleClick() {
    const href = hrefs[Math.floor(Math.random() * hrefs.length)];
    router.push(href);
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {t("cta")}
    </button>
  );
}

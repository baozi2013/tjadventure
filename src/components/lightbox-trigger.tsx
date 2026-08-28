"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

type LightboxTriggerProps = {
  src: string;
  alt: string;
  children: ReactNode;
};

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const t = useTranslations("Lightbox");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt || t("open")}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t("close")}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain"
      />
    </div>,
    document.body,
  );
}

export function LightboxTrigger({ src, alt, children }: LightboxTriggerProps) {
  const t = useTranslations("Lightbox");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={t("open")}
        className="block w-full cursor-zoom-in appearance-none border-0 bg-transparent p-0 text-left"
      >
        {children}
      </button>
      {isOpen ? <ImageLightbox src={src} alt={alt} onClose={() => setIsOpen(false)} /> : null}
    </>
  );
}

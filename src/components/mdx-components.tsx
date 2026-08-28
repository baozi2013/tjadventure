import type { CSSProperties } from "react";
import Image from "next/image";
import { LightboxTrigger } from "@/components/lightbox-trigger";
import { StravaActivity } from "@/components/strava-activity";

const DEFAULT_CONTENT_IMAGE_SIZES = "(max-width: 768px) 100vw, (max-width: 1280px) 92vw, 1100px";
const FALLBACK_DIMENSIONS = { width: 1600, height: 1067 };
const OPTIMIZABLE_REMOTE_HOSTS = new Set([
  "res.cloudinary.com",
  "images.unsplash.com",
]);

type MdxImageProps = {
  src?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  sizes?: string;
  className?: string;
  style?: CSSProperties;
  loading?: "eager" | "lazy";
};

function parseDimension(value: number | string | undefined): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return undefined;
}

function isLocalPublicSrc(src: string) {
  return src.startsWith("/") && !src.startsWith("//");
}

function isOptimizableRemoteSrc(src: string) {
  try {
    const url = new URL(src);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      OPTIMIZABLE_REMOTE_HOSTS.has(url.hostname)
    );
  } catch {
    return false;
  }
}

export function MdxImage({
  src,
  alt = "",
  width,
  height,
  sizes,
  className,
  style,
  loading,
}: MdxImageProps) {
  if (typeof src !== "string" || src.trim().length === 0) {
    return null;
  }

  const shouldUseNextImage = isLocalPublicSrc(src) || isOptimizableRemoteSrc(src);

  if (!shouldUseNextImage) {
    const fallbackStyle: CSSProperties = {
      width: "100%",
      height: "auto",
      ...(style ?? {}),
    };

    return (
      <LightboxTrigger src={src} alt={alt}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          width={parseDimension(width)}
          height={parseDimension(height)}
          className={className}
          style={fallbackStyle}
          loading={loading === "eager" ? "eager" : "lazy"}
          decoding="async"
        />
      </LightboxTrigger>
    );
  }

  const finalWidth = parseDimension(width) ?? FALLBACK_DIMENSIONS.width;
  const finalHeight = parseDimension(height) ?? FALLBACK_DIMENSIONS.height;
  const imageStyle: CSSProperties = {
    width: "100%",
    height: "auto",
    ...(style ?? {}),
  };

  return (
    <LightboxTrigger src={src} alt={alt}>
      <Image
        src={src}
        alt={alt}
        width={finalWidth}
        height={finalHeight}
        sizes={sizes ?? DEFAULT_CONTENT_IMAGE_SIZES}
        className={className}
        style={imageStyle}
        quality={75}
        loading={loading === "eager" ? "eager" : "lazy"}
      />
    </LightboxTrigger>
  );
}

export const mdxComponents = {
  img: MdxImage,
  StravaActivity,
};

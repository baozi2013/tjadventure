import fs from "node:fs";
import path from "node:path";
import type { CSSProperties } from "react";
import Image from "next/image";
import sharp from "sharp";

const DEFAULT_CONTENT_IMAGE_SIZES = "(max-width: 768px) 100vw, (max-width: 1280px) 92vw, 1100px";
const FALLBACK_DIMENSIONS = { width: 1600, height: 1067 };
const OPTIMIZABLE_REMOTE_HOSTS = new Set([
  "res.cloudinary.com",
  "images.unsplash.com",
]);

type LocalDimensions = {
  width: number;
  height: number;
};

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

const localDimensionsCache = new Map<string, Promise<LocalDimensions | null>>();

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

function normalizeLocalSrc(src: string) {
  return src.split("#")[0].split("?")[0];
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

async function getLocalImageDimensions(src: string): Promise<LocalDimensions | null> {
  const normalizedSrc = normalizeLocalSrc(src);
  const cached = localDimensionsCache.get(normalizedSrc);
  if (cached) {
    return cached;
  }

  const task = (async () => {
    const absolutePath = path.join(
      process.cwd(),
      "public",
      normalizedSrc.replace(/^\/+/, ""),
    );

    if (!fs.existsSync(absolutePath)) {
      return null;
    }

    try {
      const metadata = await sharp(absolutePath).metadata();

      if (metadata.width && metadata.height) {
        return { width: metadata.width, height: metadata.height };
      }
    } catch {
      return null;
    }

    return null;
  })();

  localDimensionsCache.set(normalizedSrc, task);
  return task;
}

export async function MdxImage({
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
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        loading={loading === "eager" ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }

  let finalWidth = parseDimension(width);
  let finalHeight = parseDimension(height);

  if ((!finalWidth || !finalHeight) && isLocalPublicSrc(src)) {
    const localDimensions = await getLocalImageDimensions(src);
    if (localDimensions) {
      finalWidth ??= localDimensions.width;
      finalHeight ??= localDimensions.height;
    }
  }

  finalWidth ??= FALLBACK_DIMENSIONS.width;
  finalHeight ??= FALLBACK_DIMENSIONS.height;

  return (
    <Image
      src={src}
      alt={alt}
      width={finalWidth}
      height={finalHeight}
      sizes={sizes ?? DEFAULT_CONTENT_IMAGE_SIZES}
      className={className}
      style={style}
      quality={75}
      loading={loading === "eager" ? "eager" : "lazy"}
    />
  );
}

export const mdxComponents = {
  img: MdxImage,
};

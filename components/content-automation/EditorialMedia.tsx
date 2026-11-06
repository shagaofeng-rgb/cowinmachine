import Image from "next/image";
import { BookOpenText, Newspaper } from "@phosphor-icons/react/ssr";
import type { ContentImage } from "@/types/content-automation";

export function EditorialMedia({ image, channel, sizes, eager = false }: {
  image?: ContentImage;
  channel: "/blog" | "/news";
  sizes: string;
  eager?: boolean;
}) {
  const Icon = channel === "/blog" ? BookOpenText : Newspaper;
  return (
    <div className={`cw-editorial-media${image ? "" : " cw-editorial-placeholder"}`}>
      {image
        ? <Image src={image.src} alt={image.alt} fill sizes={sizes} loading={eager ? "eager" : undefined} fetchPriority={eager ? "high" : undefined} />
        : <Icon size={57} weight="light" aria-hidden="true" />}
    </div>
  );
}

export function EditorialDate({ value, long = false }: { value?: string; long?: boolean }) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.valueOf())) return null;
  return <time dateTime={date.toISOString()}>{new Intl.DateTimeFormat("en", { dateStyle: long ? "long" : "medium", timeZone: "UTC" }).format(date)}</time>;
}

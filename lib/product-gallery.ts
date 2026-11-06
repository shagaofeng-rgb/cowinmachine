import dimensions from "@/data/product-detail/image-dimensions.json";
import type { Product } from "@/types/product";

const imageSizes: Record<string, number[] | undefined> = dimensions;
const imageRoot = "/images/products/";

export type GalleryPhoto = Product["gallery"][number] & { width?: number; height?: number };

export function getGalleryPhotos(product: Pick<Product, "heroImage" | "gallery" | "name">): GalleryPhoto[] {
  const hero = product.heroImage && (product.gallery.find(({ src }) => src === product.heroImage) ?? {
    src: product.heroImage,
    alt: `${product.name} product view`,
  });
  const photos = hero ? [hero, ...product.gallery] : product.gallery;
  const seen = new Set<string>();
  return photos.flatMap((photo) => {
    if (seen.has(photo.src)) return [];
    seen.add(photo.src);
    const size = photo.src.startsWith(imageRoot) ? imageSizes[photo.src.slice(imageRoot.length)] : undefined;
    return [{ ...photo, width: size?.[0], height: size?.[1] }];
  });
}

export function isZoomablePhoto(photo: GalleryPhoto) {
  const { width = 0, height = 0 } = photo;
  return Math.max(width, height) >= 1000 && Math.min(width, height) >= 650;
}

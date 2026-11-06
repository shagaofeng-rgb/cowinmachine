"use client";

import Image from "next/image";
import { MagnifyingGlassPlus, X } from "@phosphor-icons/react/ssr";
import { useRef, useState } from "react";
import { EquipmentIcon } from "@/components/interior/EquipmentIcon";
import type { GalleryPhoto } from "@/lib/product-gallery";
import type { ProductCategorySlug } from "@/types/product";

type DisplayPhoto = GalleryPhoto & { zoomable: boolean };

export function ProductGallery({ photos, productName, family }: {
  photos: DisplayPhoto[];
  productName: string;
  family: ProductCategorySlug;
}) {
  const [selected, setSelected] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const zoomButton = useRef<HTMLButtonElement>(null);
  const photo = photos[selected];

  return (
    <section className="cw-product-gallery" aria-label={`${productName} gallery`}>
      <div className="cw-gallery-stage">
        {photo ? (
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 760px) 92vw, (max-width: 1240px) 49vw, 622px"
            loading={selected === 0 ? "eager" : undefined}
            fetchPriority={selected === 0 ? "high" : undefined}
            style={{ maxWidth: photo.width, maxHeight: photo.height }}
          />
        ) : (
          <div className="cw-no-photo"><EquipmentIcon family={family} size={76} /><p>Product photo unavailable</p></div>
        )}
        {photo?.zoomable && (
          <button ref={zoomButton} className="cw-icon-button cw-gallery-zoom" type="button" aria-label="Enlarge product photo" title="Enlarge product photo" onClick={() => {
            dialog.current?.showModal();
            setZoomOpen(true);
          }}><MagnifyingGlassPlus size={22} aria-hidden="true" /></button>
        )}
      </div>
      {photos.length > 1 && (
        <div className="cw-gallery-strip" role="group" aria-label="Product photos">
          {photos.map((image, index) => (
            <button key={image.src} className="cw-gallery-thumbnail" type="button" aria-label={`Photo ${index + 1}: ${image.alt}`} aria-pressed={index === selected} onClick={() => setSelected(index)}>
              <Image src={image.src} alt="" fill sizes="76px" />
            </button>
          ))}
        </div>
      )}
      {photo?.zoomable && (
        <dialog className="cw-zoom-dialog" ref={dialog} aria-label={`Enlarged photo of ${productName}`} onClose={() => {
          setZoomOpen(false);
          zoomButton.current?.focus({ preventScroll: true });
        }} onClick={(event) => {
          if (event.currentTarget === event.target) dialog.current?.close();
        }}>
          <div className="cw-zoom-content">
            <button className="cw-icon-button cw-zoom-close" type="button" aria-label="Close photo preview" title="Close photo preview" onClick={() => dialog.current?.close()}><X size={22} aria-hidden="true" /></button>
            {zoomOpen && <Image src={photo.src} alt={photo.alt} width={photo.width ?? 1000} height={photo.height ?? 650} sizes="(max-width: 760px) 92vw, 1080px" />}
          </div>
        </dialog>
      )}
    </section>
  );
}

import type { ProductCategorySlug } from "@/types/product";

export function EquipmentIcon({ family, size = 40 }: { family: ProductCategorySlug; size?: number }) {
  const geometry = {
    "compressed-air-equipment": <>
      <rect x="6" y="9" width="35" height="25" rx="3" />
      <path d="M12 15h13m-13 5h13m-13 5h13m6-11v14m6-9h4m-5 15v5m-23-5v5M9 39h31" />
      <circle cx="34" cy="18" r="1.5" className="cw-icon-accent" />
    </>,
    "generator-systems": <>
      <rect x="6" y="10" width="36" height="25" rx="2" />
      <path d="M10 35v4h28v-4m-26-19h8m-8 5h8m-8 5h8m12 1h4" />
      <path d="m32 15-5 7h5l-2 5 6-8h-5l1-4Z" className="cw-icon-accent" />
    </>,
    "drilling-equipment": <>
      <rect x="5" y="33" width="33" height="7" rx="3.5" />
      <path d="M10 33V22h13l7 7v4m-18-7h9m-8 10h16m6-3V8h6v25m-2-24-9-4m2 14 3 2m6 4h3" />
      <path d="M38 14v15" className="cw-icon-accent" />
    </>,
    "drilling-consumables": <>
      <path d="m8 34 8-8 5 5-8 8-5-5Zm8-8 15-15 6 6-16 14m10-20 5-5 6 6-5 5m-3-9 6 6m-11 0 6 6" />
      <path d="m20 22 6 6m-3-9 6 6m-3-9 6 6" className="cw-icon-accent" />
    </>,
    "mobile-lighting-systems": <>
      <path d="M24 12v21m-6 0 6-8 7 8M8 33h31v4H8z" />
      <circle cx="13" cy="39" r="3" /><circle cx="34" cy="39" r="3" />
      <path d="M24 10h-7m7 0h7M9 7h8v6H9zm22 0h8v6h-8z" />
      <path d="m11 17-2 4m6-4v4m20-4v4m4-4 2 4" className="cw-icon-accent" />
    </>,
    "magnetic-separators": <>
      <path d="M9 32h29a4 4 0 0 1 0 8H9a4 4 0 0 1 0-8Zm3 4h23m-20-4-5-8m28 8 5-8M14 7v12a10 10 0 0 0 20 0V7h-6v12a4 4 0 0 1-8 0V7h-6Z" />
      <path d="M14 13h6m8 0h6M24 29v3" className="cw-icon-accent" />
    </>,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.85"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {geometry[family]}
    </svg>
  );
}

export function ConveyorIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="13" width="26" height="10" rx="5" />
      <path d="M7 23v5m18-5v5M7 8h17m-4-3 4 3-4 3" />
      <circle cx="8" cy="18" r="1.7" /><circle cx="16" cy="18" r="1.7" /><circle cx="24" cy="18" r="1.7" />
    </svg>
  );
}

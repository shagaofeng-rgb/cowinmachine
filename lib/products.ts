import type { Product, ProductCategorySlug } from "@/types/product";

export const productCategories: {
  slug: ProductCategorySlug;
  name: string;
  summary: string;
  subcategories: string[];
}[] = [
  {
    slug: "air-compressors",
    name: "Air Compressors",
    summary: "Replaceable equipment placeholders for compressed-air applications.",
    subcategories: ["Diesel Screw Air Compressors", "Electric Screw Air Compressors", "Portable Air Compressors", "Industrial Air Compressors"],
  },
  {
    slug: "drilling-rigs",
    name: "Drilling Rigs",
    summary: "Replaceable equipment placeholders for drilling applications.",
    subcategories: ["DTH Drilling Rigs", "Water Well Drilling Rigs", "Crawler Drilling Rigs", "Rock Drilling Equipment"],
  },
  {
    slug: "solar-light-towers",
    name: "Solar Light Towers",
    summary: "Replaceable equipment placeholders for temporary and remote lighting.",
    subcategories: ["Solar Light Towers", "Hybrid Light Towers", "Diesel Light Towers", "Solar CCTV Trailers"],
  },
  {
    slug: "magnetic-separators",
    name: "Magnetic Separators",
    summary: "Replaceable equipment placeholders for material separation applications.",
    subcategories: ["Dry Magnetic Separators", "Wet Magnetic Separators", "High-Intensity Magnetic Separators", "Overband Magnetic Separators"],
  },
];

function placeholder(category: ProductCategorySlug, slug: string, name: string): Product {
  return {
    id: slug,
    slug,
    name,
    category,
    shortDescription: "Replaceable product placeholder. Confirm the application before preparing a recommendation.",
    description: "TODO: Replace with verified product specifications.",
    applications: ["TODO: Replace with verified application information."],
    keySpecifications: [
      { label: "Model", value: "TODO: Replace with verified model information." },
      { label: "Configuration", value: "TODO: Replace with verified product specifications." },
      { label: "Application", value: "TODO: Replace with verified application information." },
    ],
    technicalSpecifications: [{ label: "Technical data", value: "TODO: Replace with verified product specifications." }],
    status: "Replaceable placeholder",
  };
}

export const products: Product[] = [
  placeholder("air-compressors", "demo-diesel-screw-air-compressor", "Demo Diesel Screw Air Compressor"),
  placeholder("air-compressors", "demo-electric-screw-air-compressor", "Demo Electric Screw Air Compressor"),
  placeholder("air-compressors", "demo-portable-air-compressor", "Demo Portable Air Compressor"),
  placeholder("air-compressors", "demo-industrial-air-compressor", "Demo Industrial Air Compressor"),
  placeholder("drilling-rigs", "demo-dth-drilling-rig", "Demo DTH Drilling Rig"),
  placeholder("drilling-rigs", "demo-water-well-drilling-rig", "Demo Water Well Drilling Rig"),
  placeholder("drilling-rigs", "demo-crawler-drilling-rig", "Demo Crawler Drilling Rig"),
  placeholder("drilling-rigs", "demo-rock-drilling-rig", "Demo Rock Drilling Rig"),
  placeholder("solar-light-towers", "demo-solar-light-tower", "Demo Solar Light Tower"),
  placeholder("solar-light-towers", "demo-hybrid-light-tower", "Demo Hybrid Light Tower"),
  placeholder("solar-light-towers", "demo-diesel-light-tower", "Demo Diesel Light Tower"),
  placeholder("solar-light-towers", "demo-solar-cctv-trailer", "Demo Solar CCTV Trailer"),
  placeholder("magnetic-separators", "demo-dry-magnetic-separator", "Demo Dry Magnetic Separator"),
  placeholder("magnetic-separators", "demo-wet-magnetic-separator", "Demo Wet Magnetic Separator"),
  placeholder("magnetic-separators", "demo-high-intensity-magnetic-separator", "Demo High-Intensity Magnetic Separator"),
  placeholder("magnetic-separators", "demo-overband-magnetic-separator", "Demo Overband Magnetic Separator"),
];

export function getCategory(slug: string) {
  return productCategories.find((category) => category.slug === slug);
}

export function getProduct(category: string, slug: string) {
  return products.find((product) => product.category === category && product.slug === slug);
}

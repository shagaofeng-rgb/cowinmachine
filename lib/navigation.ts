export const desktopNavigation = [
  { href: "/", label: "Home" },
  { href: "/solutions", label: "Solutions" },
  { href: "/about", label: "About Us" },
  { href: "/resources", label: "Resources" },
  { href: "/contact", label: "Contact" },
] as const;

export const productNavigation = [
  { number: "01", href: "/products/compressed-air-equipment", label: "Air Compressors", description: "Compressed air solutions for industrial and jobsite applications." },
  { number: "02", href: "/products/generator-systems", label: "Generator Systems", description: "Temporary and project-site power equipment." },
  { number: "03", href: "/products/drilling-equipment", label: "Drilling Rigs", description: "Equipment solutions for drilling and site preparation." },
  { number: "04", href: "/products/drilling-consumables", label: "Drilling Tools", description: "Tools and consumables for drilling systems." },
  { number: "05", href: "/products/mobile-lighting-systems", label: "Mobile Light Towers", description: "Mobile lighting solutions for remote and temporary jobsites." },
  { number: "06", href: "/products/magnetic-separators", label: "Magnetic Separators", description: "Equipment for material separation and industrial processing." },
] as const;

export const siteMenuNavigation = [
  { href: "/", label: "Home" },
  { href: "/solutions", label: "Solutions" },
  { href: "/about", label: "About Us" },
  { href: "/factory-quality", label: "Factory & Quality" },
  { href: "/cases", label: "Cases" },
  { href: "/resources", label: "Resources" },
  { href: "/contact", label: "Contact Us" },
] as const;

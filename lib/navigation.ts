export const desktopNavigation = [
  { href: "/", label: "Home" },
  { href: "/solutions", label: "Solutions" },
  { href: "/about", label: "About Us" },
  { href: "/resources", label: "Resources" },
  { href: "/contact", label: "Contact" },
] as const;

export const productNavigation = [
  { number: "01", href: "/products/air-compressors", label: "Air Compressors", description: "Compressed air solutions for industrial and jobsite applications." },
  { number: "02", href: "/products/drilling-rigs", label: "Drilling Rigs", description: "Equipment solutions for drilling and site preparation." },
  { number: "03", href: "/products/solar-light-towers", label: "Solar Light Towers", description: "Mobile lighting solutions for remote and temporary jobsites." },
  { number: "04", href: "/products/magnetic-separators", label: "Magnetic Separators", description: "Equipment for material separation and industrial processing." },
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

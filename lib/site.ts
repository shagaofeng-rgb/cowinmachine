export const siteConfig = {
  brandName: "cowinmachine",
  legalName: "REVIEW REQUIRED — NEW_COMPANY_NAME",
  email: "davidsha@cowinmachine.com",
  phone: "+8617601255205",
  whatsApp: "+8617601255205",
  address: {
    line1: "REVIEW REQUIRED — NEW_ADDRESS",
    line2: "",
    city: "",
    region: "",
    country: "",
  },
  defaultTitle: "cowinmachine | Mobile Lighting & Site Monitoring Equipment",
  defaultDescription:
    "cowinmachine is preparing an independent product range for mobile lighting and site monitoring equipment enquiries.",
  companyIntroduction:
    "cowinmachine is preparing independent product information for industrial buyers. Contact our team to discuss your application and equipment requirements.",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://cowinmachine.com",
} as const;

export const primaryNavigation = [
  { href: "/", label: "Home" },
  { href: "/solutions", label: "Solutions" },
  { href: "/about", label: "About Us" },
  { href: "/resources", label: "Resources" },
  { href: "/contact", label: "Contact" },
] as const;

export const whatsappHref = `https://wa.me/${siteConfig.whatsApp.replace(/\D/g, "")}`;
export const mailtoHref = `mailto:${siteConfig.email}`;

export const siteConfig = {
  brandName: "COWIN MACHINE",
  legalName: "COWIN MACHINE",
  email: "davidsha@cowinmagnet.com",
  phone: "+86 156 6513 5205",
  whatsApp: "+8615665135205",
  address: {
    line1: "Room 110, 1st Floor, Building 2",
    line2: "Qushidai Future Building, Kecheng District",
    city: "Quzhou City",
    region: "Zhejiang Province",
    country: "China",
  },
  defaultTitle: "COWIN MACHINE | Industrial Equipment Solutions",
  defaultDescription:
    "COWIN MACHINE provides industrial equipment solutions for mining, construction, remote power and material processing applications.",
  companyIntroduction:
    "COWIN MACHINE provides industrial equipment solutions for global B2B buyers. Contact our team to discuss your application and equipment requirements.",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://cowinmachine.com",
} as const;

export const primaryNavigation = [
  { href: "/", label: "Home" },
  { href: "/news", label: "News & Blog" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
] as const;

export const whatsappHref = `https://wa.me/${siteConfig.whatsApp.replace(/\D/g, "")}`;
export const mailtoHref = `mailto:${siteConfig.email}`;

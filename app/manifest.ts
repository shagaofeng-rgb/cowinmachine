import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "COWIN MACHINE",
    short_name: "COWIN",
    description: "Industrial equipment solutions and application-led technical review.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b1f33",
    icons: [{ src: "/icon.jpg", sizes: "any", type: "image/jpeg" }],
  };
}

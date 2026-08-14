import Image from "next/image";

type PageHeroProps = { eyebrow?: string; title: string; description: string; image?: { src: string; alt: string } };

export function PageHero({ eyebrow, title, description, image }: PageHeroProps) {
  return <section className={`page-hero${image ? " page-hero-with-image" : ""}`}>
    {image && <Image className="page-hero-image" src={image.src} alt={image.alt} fill priority sizes="100vw" />}
    <div className="page-hero-content">{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1><p>{description}</p></div>
  </section>;
}

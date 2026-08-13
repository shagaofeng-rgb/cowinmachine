export function PageHero({ eyebrow, title, description }: { eyebrow?: string; title: string; description: string }) {
  return <section className="page-hero"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1><p>{description}</p></div></section>;
}

import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import { EquipmentIcon } from "@/components/interior/EquipmentIcon";
import { catalogProducts } from "@/lib/catalog-presentation";
import { productCategories } from "@/lib/products";
import type { ProductCategorySlug } from "@/types/product";

export function CatalogDirectory({ active }: { active?: ProductCategorySlug }) {
  return (
    <nav className="cw-directory" aria-label="Equipment families">
      <div className="cw-wrap">
        <div className="cw-directory-caption">
          <h2>Equipment families</h2>
          {active && <Link className="cw-link" href="/products">All equipment <ArrowUpRight size={15} aria-hidden="true" /></Link>}
        </div>
        <ul>
          {productCategories.map((category) => {
            const count = catalogProducts.filter((product) => product.category === category.slug).length;
            return (
              <li key={category.slug}>
                <Link href={`/products/${category.slug}`} aria-current={active === category.slug ? "page" : undefined}>
                  <EquipmentIcon family={category.slug} />
                  <span className="cw-directory-name">{category.name}</span>
                  <span className="cw-directory-count">{count} models</span>
                  <ArrowUpRight className="cw-directory-arrow" size={16} aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

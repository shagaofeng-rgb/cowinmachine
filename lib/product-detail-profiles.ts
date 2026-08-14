import detailContent from "@/data/product-detail/product-detail-content.json";
import type { Product, ProductDetailProfile } from "@/types/product";

type StoredProfile = ProductDetailProfile & { routeKey: string };

const profiles = detailContent.profiles as StoredProfile[];
const profilesByRoute = new Map(profiles.map((profile) => [profile.routeKey, profile]));

export function getProductDetailProfile(product: Product): ProductDetailProfile {
  const routeKey = `${product.category}/${product.slug}`;
  const profile = profilesByRoute.get(routeKey);

  if (!profile) {
    return {
      canonicalId: null,
      model: null,
      publicationState: "configuration-review",
      reviewReason: "No canonical product-family mapping is available.",
      imageStatus: "Image requires owner confirmation",
      content: {
        overview: "This catalog record requires a configuration review before technical content is published.",
        workingPrinciple: "Configuration subject to application review.",
        applications: ["Application review required before suitability is stated"],
        selectionGuide: ["Send the model marking, application and project requirements for review."],
        benefits: ["Prevents unsupported technical claims."],
        maintenanceAndSafety: ["Follow only the approved manual for the confirmed product."],
        faqs: [{ question: "Why is a technical review needed?", answer: "The product record needs a confirmed model and approved evidence." }],
        citationsInternalOnly: [],
      },
      specifications: [],
      standardConfiguration: ["Request Configuration Review"],
      optionalConfiguration: ["Request verified model and configuration information"],
      relatedProductSlugs: [],
    };
  }

  const { routeKey: _routeKey, ...detailProfile } = profile;
  return detailProfile;
}

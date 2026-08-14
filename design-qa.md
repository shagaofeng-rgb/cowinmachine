# Homepage redesign — design QA

## Comparison target

- **Source visual truth:** `D:\codex\.codex\generated_images\019ff932-39ce-7ed1-94e6-8c3123e73093\exec-4c0dc740-eb6c-4f98-8496-726732435493.png`
- **Implementation:** `C:\Users\Administrator\Documents\ChatGPT\cowinmachine.com\.tmp-home-redesign-implementation.png`
- **Side-by-side comparison:** `C:\Users\Administrator\Documents\ChatGPT\cowinmachine.com\.tmp-home-design-qa-comparison.png`
- **Route / state:** homepage at the initial desktop state; technical selection desk visible.
- **Source dimensions:** 864 × 1821 px. The source’s top 1024 px was normalized to a 1440 × 1024 px comparison region.
- **Implementation dimensions:** 1425 × 1013 px at a browser viewport override of 1440 × 1024 CSS px. The browser scrollbar accounts for the rendered width.
- **Mobile evidence:** `C:\Users\Administrator\Documents\ChatGPT\cowinmachine.com\.tmp-home-redesign-mobile.png`, rendered at 390 × 844 CSS px (375 × 812 px image output).

## Full-view evidence

The side-by-side image compares the top source region and desktop implementation on one canvas. The implementation keeps the selected visual’s hierarchy: white sticky header, dark left technical-selection panel, quarry drilling image at right, orange primary CTA, then a six-family equipment index.

The implementation intentionally uses the current site navigation, COWIN MACHINE logo treatment, six approved categories, and source-safe content. The source mock’s non-site navigation, generic categories, placeholder contact details, and unverified marketing copy were not copied.

## Focused checks

- **Desktop hero:** the title, form and image remain fully visible; the form controls are labeled and the CTA has contrast against the navy panel.
- **Mobile hero:** no horizontal overflow (`375px` document width at a `390px` viewport); the technical-review button ends above the fixed conversion bar (`button bottom 782.95px`, conversion bar top `792px`).
- **Primary interaction:** selected `Drilling Rigs`, `Water well drilling` and `Remote or mobile operation` routed to `/request-a-quote` with category, application and working-condition context prefilled.
- **Console:** no error-level console messages observed. The only captured warning was the earlier Next.js smooth-scroll advisory before the `data-scroll-behavior="smooth"` attribute change; the rendered document now contains that attribute.

## Fidelity surfaces

- **Fonts and typography:** the existing system font is retained for consistency with the established site. The hierarchy, heavy headline, small uppercase eyebrow and dense RFQ labels match the selected direction. The implementation’s headline is intentionally slightly more editorial to accommodate verified copy.
- **Spacing and layout rhythm:** desktop uses a contained left technical desk, large image field and a six-column product index. On smaller screens the form collapses to one field per row and keeps clearance above the conversion bar.
- **Colors and tokens:** existing `--navy`, `--orange`, white and pale-gray tokens are used; no new gradient system was introduced.
- **Image quality and asset fidelity:** the one new hero is an original unbranded AI-generated quarry image at `public/images/generated/home-technical-selection-hero.png`, used exactly once and registered in the site visual register. Product imagery is drawn from the existing authorized local product catalog.
- **Copy and content:** visible copy is original, B2B-oriented and avoids factory, certification, performance, pricing, customer and delivery claims. The News & Blog area links only to the existing published-content route rather than fabricating example articles.

## Findings

No actionable P0, P1 or P2 findings remain.

- [P3] The selected mock showed a full COWIN wordmark in the header while the existing site retains the user-supplied circular CY logo mark. This is an intentional brand-asset preservation decision and should only change if a horizontal authorized logo file is supplied.

## Comparison history

1. **Mobile clearance issue (P1):** the initial mobile rendering placed the technical-review CTA under the fixed conversion bar. The mobile hero top/bottom spacing was adjusted. Post-fix evidence shows a positive 9px gap above the bar.
2. **Post-fix result:** desktop and mobile screens are visually stable; no horizontal overflow, error-level console output, or blocked primary interaction was found.
3. **Category-index typography refinement:** the six category links now use a fixed media / number / title grid, with a shared 206px card height, aligned title baselines and arrows, and reduced whitespace before the following technical-selection section. Visual evidence: `C:\Users\Administrator\Documents\ChatGPT\cowinmachine.com\.tmp-home-category-refined.png`.
4. **Source-matched category and RFQ refinement:** removed the `01–06` category and RFQ labels. The category index now follows the selected visual with compact product imagery, category names and directional arrows. The RFQ strip now uses six accessible Phosphor line icons with centered labels and retains the supplied project-information sequence. Desktop visual verification found no horizontal overflow.
5. **Independent category-asset refinement:** replaced the category strip's catalog-derived images and labels with six dedicated homepage family records and six original, unbranded AI-generated product visuals. The category bar preserves the selected visual's six equal columns, centered visual treatment, title baseline and orange directional arrow. Reference evidence: `C:\Users\Administrator\AppData\Local\Temp\codex-clipboard-477edbfd-9b60-4670-985f-41841c5d263b.png`. Updated implementation evidence: `C:\Users\Administrator\Documents\ChatGPT\cowinmachine.com\.tmp-home-category-ai-assets.png` at a 1280 × 720 CSS viewport. No horizontal overflow or error-level console messages were observed.
6. **Category scale correction:** increased the desktop category container to 1320px, image slot to 104px, card height to 190px and category-label scale to address the undersized visual hierarchy reported in review. The revised category strip remains within the 1280px viewport without horizontal overflow or console errors.

## Implementation checklist

- [x] Selected technical-selection direction translated to the existing Next.js homepage.
- [x] New hero image registered and used once.
- [x] Product family navigation stays data-driven.
- [x] RFQ route receives category/application/conditions context.
- [x] Desktop and mobile screens checked.
- [x] Home category bar now has independent, local AI-generated assets rather than product-catalog image lookups.
- [x] Lint, typecheck and production build passed.

## Follow-up polish

- If an approved horizontal COWIN MACHINE logo lockup is provided, evaluate it against the header’s current compact logo treatment.

final result: passed

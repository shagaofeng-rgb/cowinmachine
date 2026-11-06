import { ClipboardText, FileText, Package } from "@phosphor-icons/react/ssr";
import { InteriorCallout, InteriorFigure, InteriorIntro } from "@/components/interior/Interior";
import { pageMetadata } from "@/lib/seo";

const baseMetadata = pageMetadata("Quality Documentation", "Request applicable quality and technical documentation for a confirmed equipment model.", "/factory-quality");
export const metadata = { ...baseMetadata, robots: { index: false, follow: true } };

const documents = [
  { title: "Technical information", text: "Model-specific specifications and configuration details, where verified.", icon: FileText },
  { title: "Inspection documentation", text: "Applicable inspection information for the reviewed equipment and destination.", icon: ClipboardText },
  { title: "Packing information", text: "Packing and shipment details for the equipment configuration under review.", icon: Package },
];

export default function FactoryQualityPage() {
  return (
    <div className="cw-interior">
      <InteriorIntro items={[{ label: "Quality Documentation" }]} label="Equipment records" title="Quality Documentation"
        description="Available records depend on the confirmed model, configuration and destination market." />
      <section className="cw-section"><div className="cw-wrap cw-feature-split cw-quality-layout">
        <div className="cw-feature-copy">
          <h2>Documents you can request</h2>
          <ul className="cw-icon-rows">
            {documents.map(({ title, text, icon: Icon }) => (
              <li key={title}><Icon size={27} aria-hidden="true" /><div><h3>{title}</h3><p>{text}</p></div></li>
            ))}
          </ul>
        </div>
        <InteriorFigure src="/images/generated/quality-inspection-station.png" alt="Illustration of a technician inspecting industrial equipment" caption="Illustrative inspection scene. Not evidence of certification." />
      </div></section>
      <InteriorCallout title="Request applicable records" description="Include the model reference, intended application and destination country." href="/request-a-quote?request=quality-documents" action="Request documentation" />
    </div>
  );
}

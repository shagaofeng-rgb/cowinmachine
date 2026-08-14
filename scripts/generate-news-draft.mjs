import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const id = process.argv[2];
if (!id) throw new Error("Usage: node scripts/generate-news-draft.mjs TOPIC-XX");
const queue = JSON.parse(fs.readFileSync(path.join(root, "data/news/article-queue.json"), "utf8")).articles;
const candidates = JSON.parse(fs.readFileSync(path.join(root, "data/news/source-candidates.json"), "utf8")).candidates;
const item = queue.find((entry) => entry.id === id);
if (!item) throw new Error(`Unknown topic: ${id}`);
if (item.status !== "research-ready" || item.requiredSources.some((source) => !source.startsWith("NEWS-"))) throw new Error("Draft generation blocked: two independent eligible, recent sources have not been mapped.");
const sources = item.requiredSources.map((sourceId) => candidates.find((candidate) => candidate.id === sourceId)).filter(Boolean);
if (sources.length < 2) throw new Error("Draft generation blocked: source mapping is incomplete.");

const guide = item.primaryProductUrl.includes("drilling-equipment") ? {
  overview: "A drilling rig is selected around the bore objective and the operating system that will support it. The machine, drill string, circulation method, access route and crew procedures all need to work together. A model reference is useful for starting a conversation, but it does not replace a review of formation, target depth, hole diameter, tooling, power, compressor or mud support and safe site setup.",
  workflow: "A practical workflow starts with the bore objective and available site information. The team then chooses a drilling method, confirms circulation and tool-string interfaces, checks access and pad preparation, and plans the sequence for set-up, drilling, sampling or completion. The review should identify handoffs between the rig crew, support equipment and site management before mobilization.",
  pain: "Buyers commonly face a mismatch between the planned bore and the information available when equipment is requested. Access limitations, incomplete formation data, uncertain utility supply, insufficient support capacity and unclear consumable planning can all disrupt work. These are planning problems first; they should not be turned into assumptions about a listed rig's capability.",
  selection: "Ask for the intended drilling method, target depth, hole diameter, expected formation, site access, drill-pipe program, circulation support, power arrangement and local safety controls. For remote sites, add transport constraints, spares planning, crew capability and the proposed maintenance window. The final configuration should be reviewed against an approved model record.",
  benefits: "This approach helps buyers align the rig and supporting system with the actual work package. It gives procurement teams a clearer question set, helps field teams expose access and support constraints earlier, and creates a better basis for comparing quotations. It does not predict penetration rate, bore outcome or formation-specific performance.",
  example: "For a quarry or exploration project, the contractor might first confirm the cleared work area, the drilling pattern, the planned hole program and the available support equipment. A technical review can then map the sequence from mobilization to setup, tool-string checks, circulation planning and safe handover. That is more useful than treating a single model label as a complete drilling plan.",
  evaluate: "Before requesting a quotation, consolidate the bore objective, geology information, site plan, access restrictions, power or air availability, tooling interfaces, target schedule and safety requirements. Request the current approved model-specific specification and document every assumption that remains open.",
  term: "DTH drilling uses a down-the-hole hammer system, while other drilling methods use different energy-transfer and circulation arrangements. The method must be confirmed before matching a rig, compressor, hammer, bit or pipe.",
} : item.primaryProductUrl.includes("mobile-lighting-systems") ? {
  overview: "Mobile lighting and security towers are site systems rather than stand-alone lamps. The useful configuration depends on the operating schedule, placement plan, mast handling procedure, available energy, transport route, maintenance access and the local rules that govern temporary work. A solar, battery, hybrid or generator-supported arrangement should be reviewed against the duty instead of selected by headline runtime or coverage claims.",
  workflow: "A project team first defines the work zones, lighting objective, night-time schedule and installation locations. It then checks energy input, charging opportunity, battery-management approach, trailer access, stabilizer placement, mast operation and monitoring or communications needs. The operating plan should include secure transport, pre-use checks and a safe procedure for raising and lowering the mast.",
  pain: "Common problems include designing from a headline light output without a placement plan, assuming that solar charging will be consistent, overlooking the effect of lighting load on stored energy, and treating a trailer as automatically suitable for every destination. Site security adds another layer: camera, network, power and data responsibilities need to be defined.",
  selection: "Review the intended work area, shifts, desired lighting zones, power arrangement, charging conditions, mast height and lifting method, trailer interface, ground conditions, weather procedures and service access. If cameras are requested, also confirm mounting, connectivity, power and data-management requirements. Model-specific runtime, wind and illumination claims require approved evidence.",
  benefits: "A condition-led review improves the chance that the temporary system can be transported, placed and operated as intended. It helps buyers separate energy capacity from operating duration, consider the whole worksite rather than a single tower, and identify requirements that should be included in the technical inquiry. It does not guarantee autonomy or area coverage.",
  example: "For night roadwork, a supervisor could map the traffic-management area and work zones, identify safe trailer locations and then work backward to determine mast positions, energy requirements, maintenance access and retrieval timing. This process avoids treating a tower's label as a lighting design.",
  evaluate: "Before requesting a quotation, send the operating schedule, site layout, required deployment locations, local transport constraints, expected weather conditions, power or charging information and any CCTV or communications requirement. Request the approved configuration and operating documents for the specific model.",
  term: "Energy capacity is the stored energy available to a system, while lighting load is the power drawn during use. Duration depends on both values as well as controls, charging conditions and environmental factors.",
} : {
  overview: "Magnetic separation equipment should be selected from the material stream and the process objective, not from a generic product title. The buyer needs to distinguish equipment protection, tramp-metal removal, ferrous recovery and non-ferrous recovery, then provide the conveyor or process geometry that determines how a configuration can be assessed. Material behavior, feed condition, burden depth, cleaning duty, installation space and maintenance access are part of the selection.",
  workflow: "The review begins by mapping the feed stream and the reason for separation. The team then records belt or chute geometry, material type, particle behavior, burden condition, operating schedule, available power and the desired cleaning method. Only after these inputs are known can installation, mounting, cleaning and downstream handoff be reviewed against an approved product configuration.",
  pain: "Plants may know that unwanted metal is present but not have a complete record of where it enters the process, how it is distributed in the burden or how cleaning will be handled. A shallow, uniform conveyor burden and a deep, mixed one are not the same application. Similarly, an announcement about recycling technology is not proof that a particular separator will achieve a particular recovery result.",
  selection: "Confirm the separation objective, feed condition, conveyor width and speed where applicable, burden depth, suspension space, material type, cleaning duty, process temperature and installation access. For an electromagnetic arrangement, confirm power and control requirements. For food or hygienic processes, request verified construction and validation evidence before suitability is stated.",
  benefits: "A material-stream review helps protect downstream equipment, defines the information required for a technical inquiry and makes cleaning responsibilities visible. It can also prevent a buyer from specifying an unsuitable dry, wet, manual-clean or self-cleaning arrangement. It does not establish magnetic intensity, capacity, recovery or material compatibility without approved data.",
  example: "For a recycling conveyor, the operations team might record the feed mix, belt geometry, burden behavior, known tramp-metal risk, desired discharge method and the maintenance window. The supplier can then review the installation concept with those facts rather than extrapolating from a product label.",
  evaluate: "Before requesting a quotation, provide process drawings or photographs, belt dimensions and speed where relevant, material description, feed condition, expected operating hours, cleaning preference, installation clearance and any downstream equipment that needs protection. Request approved product-specific specifications before procurement.",
  term: "Tramp metal is unwanted metallic material in a bulk stream that can damage downstream equipment or contaminate the process. The correct control point and cleaning method depend on the process layout and material behavior.",
};

const sourceDigest = sources.map((source) => `${source.sourceName} published a dated update on ${source.publishedAt}. For this draft, its usable context is limited to: ${source.primaryFacts[0]} ${source.primaryFacts[1]}`).join(" ");
const sourceList = sources.map((source) => `- [${source.sourceName}: ${source.title}](${source.url}) - published ${source.publishedAt}`).join("\n");
const related = item.internalLinks.slice(0, 3).map((link) => `- [${link}](${link})`).join("\n");
const body = `# ${item.title}

> Local draft only. This file is not approved for publication, is not a customer case study, and must pass source-to-claim review before any publishing request.

## Answer-first introduction

${item.title} is best approached as a configuration and workflow question. ${guide.overview} The immediate next step is to collect the operating inputs that affect selection, then review the approved product record against those conditions. This article uses recent industry developments as context; it does not transfer another organisation's product features, results or commitments to COWIN MACHINE.

## Product / equipment category overview

The linked COWIN MACHINE product family is an identified catalog record, not a promise that it will suit every project. A product page should help a buyer understand the information required for a technical review: what work is being done, how the process flows, which interfaces matter and which conditions cannot be assumed. ${guide.term} Exact technical fields remain subject to the model-specific record and application review.

## Industry context and current development

Recent reporting is useful when it identifies a change in the operating environment, such as a project mobilisation, an energy-system development, a recycling-process investment or a new worksite-security approach. ${sourceDigest} These sources are independent of COWIN MACHINE. They are included to help readers frame questions about planning, interfaces and verification, rather than to support a performance comparison or a supplier endorsement.

## Operational pain points

${guide.pain} A disciplined request for information turns these issues into checkable inputs. It also prevents procurement teams from relying on an image, a series name or an isolated parameter when the operating system has not been defined.

## How the equipment fits the workflow

${guide.workflow} The equipment category fits at a defined point in that workflow, but the final scope must be confirmed with project documentation. This distinction matters when the site has variable material, changing access, limited power, restrictive weather, or a short maintenance window.

## Configuration and selection considerations

${guide.selection} Buyers should state which information is known, which is estimated and which still requires a site survey or engineering input. Where a requested value cannot be verified, the correct public wording is: Configuration subject to application review.

## Practical operational benefits

${guide.benefits} The practical value is a more transparent procurement discussion: the buyer can see what must be supplied, the review team can identify open questions and the quotation can distinguish confirmed scope from items that need a decision.

## Example scenario

${guide.example} This is an illustrative planning scenario only. It does not describe a COWIN MACHINE customer, project result, tested configuration or delivery record.

## Recent industry developments

The current sources point to a broader operational theme: projects are increasingly described in terms of deployment conditions, system interfaces, traceability, maintenance and the way equipment is integrated into a worksite or processing flow. That does not change the need for model-specific evidence. It does reinforce the value of asking better questions before equipment is selected.

For that reason, a useful review separates external context from the proposed equipment scope. News can reveal that a project is moving into a new phase, that a process is being evaluated, or that an operating constraint is receiving attention. It cannot establish the dimensions, power requirement, safety rating, capacity, compatibility, runtime, recovery result or commercial availability of a COWIN MACHINE configuration. Those points must be confirmed from an approved product record and the buyer's documented application. Keeping the two evidence layers separate makes later copy review, quotation review and internal approval more reliable.

## What buyers should evaluate next

${guide.evaluate} Include the product page URL, model reference where available and clear photos or drawings of existing interfaces. That creates a usable evidence trail for the technical review.

## FAQ

### Can the listed product be confirmed from the article alone?

No. The article provides category and workflow guidance. A model-specific review still requires the project inputs and approved technical documentation.

### Are the recent developments a product recommendation?

No. Third-party developments are contextual facts only. They are not endorsements, customer cases or evidence of COWIN MACHINE performance.

### What should be included in an inquiry?

Send the application, industry, operating conditions, material or medium where relevant, site constraints, required quantity, country and the product URL or model reference.

### Why are some specifications not stated here?

Exact values must come from verified model-specific documentation. Where that evidence is missing, the configuration remains subject to review.

### What happens after the technical review?

The next step is to clarify the open inputs and identify which approved documentation is needed before a quotation or configuration can be confirmed.

## CTA

For a configuration review, [send your project requirements](/request-a-quote) with the operating context and product reference.

## Internal links

${related}

## Sources and further reading

${sourceList}
`;
const count = body.replace(/[#>*_`\-\[\]\(\)]/g, " ").trim().split(/\s+/).length;
if (count < 1200 || count > 1800) throw new Error(`Generated draft word count ${count} is outside the 1,200-1,800 range.`);
const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const output = path.join(root, "data/news/drafts", `${slug}.md`); fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, body);
console.log(JSON.stringify({ output, wordCount: count, sources: sources.length, status: "local-draft-only" }, null, 2));

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const audit = readJson("data/product-audit/canonical-product-master.json");
const inventory = readJson("data/product-audit/raw-product-inventory.json");
const matrix = readJson("data/research/industry-use-case-matrix.json");
const categoryLabels = Object.fromEntries(matrix.categories.map((item) => [item.category, item.label]));
const canonicalByUrl = new Map(audit.products.flatMap((item) => item.currentUrls.map((url) => [url, item])));
const sourceName = "COWIN MACHINE product-audit record";

const shared = {
  "compressed-air-equipment": {
    overview: (name, model) => `${name}${model ? ` (${model})` : ""} is presented for industrial compressed-air planning where the duty must be defined before equipment is selected. The review begins at the point of use: required pressure, simultaneous air demand, air cleanliness and the site power arrangement. That information is more useful than a model name alone when the equipment may serve pneumatic tools, drilling support or a workshop distribution line. The published specification table reproduces only fields captured in the approved catalog record for this identified model. It does not establish a site guarantee. COWIN MACHINE can use the project brief to check whether the required air delivery, pressure range, treatment train, access and service plan are aligned. Configuration subject to application review.`,
    principle: `A compressed-air package converts mechanical input into pressurized air. In a rotary screw arrangement, the compression element draws in and compresses air before cooling, separation and downstream treatment are considered. The user’s process determines the useful pressure at the point of use, not simply the pressure shown at the compressor outlet. A receiver, filtration, drying, distribution pipework and condensate management may all affect delivered air quality and pressure stability. Diesel and electric drives are selected around site utilities, mobility, ventilation and service logistics. The final configuration should therefore be reviewed against measured or documented demand, peak events and the intended duty cycle.`,
    applications: ["Quarry or mining support where air demand and access conditions are documented", "DTH drilling support after pressure and free-air-delivery matching", "Road and infrastructure crews using pneumatic tools", "Workshop air distribution with defined treatment requirements", "Shipyard or fabrication work where ventilation and power are reviewed", "Rental or temporary jobsites with documented transport and service access"],
    selection: ["Required working pressure at the point of use", "Free-air-delivery demand, simultaneous users and peak events", "Electric supply availability versus diesel logistics", "Stationary installation versus portable access requirements", "Air quality, filtration, drying and condensate requirements", "Ambient temperature, ventilation, hose routing and maintenance access"],
    benefits: ["Creates a clearer basis for pressure and flow matching", "Separates air-treatment requirements from the compressor selection", "Supports discussion of leakage and pressure-loss reduction", "Helps identify portable versus fixed installation constraints", "Keeps final equipment scope tied to documented site conditions"],
    maintenance: ["Follow the approved model-specific maintenance instructions before service", "Isolate and depressurize the system before opening lines or filters", "Inspect hoses, couplings and guards for damage before operation", "Monitor filters and condensate controls according to the duty", "Check distribution leakage and pressure loss as part of system review", "Keep ventilation paths clear where the package is installed"],
    faq: [["How do I choose pressure and air delivery?", "Provide the end-use tools or rig, required pressure, simultaneous demand and expected operating pattern for review."], ["Should I choose diesel or electric power?", "The decision depends on available utility power, mobility, ventilation, fuel planning and the project duty."], ["Is air treatment included?", "Drying, filtration and condensate treatment must be specified from the required air quality and process conditions."], ["Can a listed model serve drilling work?", "Share the drilling system, hammer or tool requirement and site conditions before a configuration is confirmed."], ["Are noise figures guaranteed?", "Noise data is shown only where approved for the exact model and stated test condition."]],
    standard: ["Drive package and compression element subject to the approved model record", "Controls and protection matched to the confirmed duty", "Cooling and separation arrangement reviewed against installation conditions"],
    optional: ["Air receiver, aftercooler, dryer or filters where application review requires them", "Hose, coupling and distribution accessories matched to the site", "Portable or stationary installation support subject to project review"],
  },
  "generator-systems": {
    overview: (name, model) => `${name}${model ? ` (${model})` : ""} is an identified generator-system record intended for project power planning, not a generic power promise. A practical review starts with a load schedule: running loads, motor starting demand, load steps, voltage, frequency, phase and required operating duty. These items determine whether the equipment is considered for prime, standby or another defined duty arrangement. The captured table contains only catalog fields associated with this model record; it does not establish site output, autonomy or compliance. COWIN MACHINE can review enclosure needs, fuel planning, cable routing, earthing, service access and local conditions with the project team. Configuration subject to application review.`,
    principle: `A generator system combines an engine, alternator, controller, starting system, fuel arrangement and protective equipment to convert fuel energy into electrical power. The electrical load and its transient behavior govern selection. Motor starting can impose a different demand from the normal running load, while voltage, frequency and phase must match the connected system. Enclosure, ventilation, exhaust, earthing, fuel storage and service access are installation matters rather than assumptions. Prime and standby ratings are duty definitions that must be confirmed from an approved specification and project operating schedule.`,
    applications: ["Temporary construction distribution after a documented load review", "Remote infrastructure where utility supply is unavailable", "Selected essential loads with an approved transfer arrangement", "Industrial facility contingency planning", "Rental fleet planning with a defined duty classification", "Remote mining support after fuel and service logistics are assessed"],
    selection: ["Running load, starting load and expected load steps", "Required duty classification and operating hours", "Voltage, frequency, phase and connection arrangement", "Ambient temperature, altitude, ventilation and exhaust constraints", "Open-frame or enclosed installation requirements", "Fuel storage, service access, earthing and local compliance needs"],
    benefits: ["Creates a traceable load-sizing discussion", "Reduces the risk of a voltage or frequency mismatch", "Identifies starting-load issues before installation", "Clarifies enclosure and service-access requirements", "Keeps power planning linked to the actual operating duty"],
    maintenance: ["Use approved electrical isolation and lockout procedures", "Inspect fuel, coolant, lubrication and battery condition as applicable", "Keep ventilation and exhaust paths clear", "Check cable, earthing and protective-device condition before use", "Follow the approved service intervals for the exact engine and alternator", "Do not operate in an enclosed area without a verified ventilation arrangement"],
    faq: [["What is the difference between prime and standby duty?", "Duty definitions, permissible operating pattern and load profile must be checked against an approved model document."], ["What information is needed for sizing?", "Provide the load schedule, motor starting details, voltage, frequency, phase and expected operating hours."], ["Can an open-frame generator be used indoors?", "Installation requires a documented ventilation, exhaust, noise and safety review."], ["Is fuel consumption published?", "Fuel use is only published from an approved model-specific source at a stated load condition."], ["Can the unit support motor loads?", "Motor starting behavior and load steps must be reviewed before configuration confirmation."]],
    standard: ["Engine, alternator and controller arrangement subject to the approved model record", "Starting, protection and output connection arrangement reviewed for the project", "Baseframe or enclosure configuration confirmed against installation conditions"],
    optional: ["Transfer, distribution and cable accessories subject to electrical design review", "Enclosure, monitoring and fuel-planning options subject to approved scope", "Site installation support after earthing and ventilation requirements are confirmed"],
  },
  "drilling-equipment": {
    overview: (name, model) => `${name}${model ? ` (${model})` : ""} is an identified drilling-rig record for projects that require the drilling method and ground conditions to be defined before equipment is selected. Product selection is shaped by the planned hole diameter, target depth, formation, drilling method, access route, compressor or mud support, tooling and safe working envelope. The captured table is limited to fields associated with the catalog record and does not promise a result in any formation or project. COWIN MACHINE can review the bore objective, site mobility, air or mud supply, drill-pipe program, transport constraints and local safety requirements with the buyer. Configuration subject to application review.`,
    principle: `A drilling rig combines a mast, feed system, rotary head, power source, controls and a drill-string handling arrangement to advance a borehole. The drilling method is selected around the formation, hole objective and circulation medium. In air drilling, compressed air helps clear cuttings; in mud drilling, fluid management becomes part of the operating system. Torque, rotary speed, feed travel and drill-pipe dimensions must be matched to the selected method and approved tooling. Mobility and site setup depend on terrain, access, support equipment and safe working conditions.`,
    applications: ["Water-well drilling where a bore objective and formation information are available", "Agricultural irrigation projects with documented access and depth requirements", "DTH drilling after compressor, hammer and bit compatibility review", "Quarry or mining support under an approved drilling plan", "Foundation or anchoring work with site-specific engineering requirements", "Geotechnical investigation subject to method and safety review"],
    selection: ["Target depth, hole diameter and expected formation", "Air, mud or other drilling method and circulation requirements", "Rotary torque, speed, feed stroke and pullback needs", "Drill-pipe diameter, length and compatible tool string", "Crawler mobility, terrain, transport and setup space", "Compressor, pump, power and support-equipment availability"],
    benefits: ["Connects the rig choice to the bore objective", "Promotes method and circulation planning before deployment", "Identifies compatible tool-string requirements early", "Clarifies site mobility and support-equipment constraints", "Keeps formation-specific performance claims out of unverified content"],
    maintenance: ["Follow the approved rig and engine maintenance schedule", "Inspect mast, feed, hydraulic lines, guards and fasteners before use", "Use approved lifting and drill-pipe handling procedures", "Confirm stable setup, exclusion zones and ground conditions", "Depressurize air or fluid systems before service", "Replace worn consumables using confirmed compatibility information"],
    faq: [["Which drilling method should I use?", "The choice depends on formation, hole objective, circulation medium and the project’s approved drilling plan."], ["How are depth and diameter selected?", "Provide the planned bore, geology information and required casing or completion details for review."], ["Is an air compressor included?", "Air supply must be sized separately against the drilling method, hammer and operating conditions."], ["Can the rig work on any terrain?", "Mobility and setup require a site-access and ground-condition review."], ["Are formation results guaranteed?", "No. Formation behavior and operating outcomes must be evaluated for each project."]],
    standard: ["Rig structure, rotary and feed arrangement subject to the approved model record", "Controls and power package reviewed for the planned drilling method", "Drill-string and circulation interfaces confirmed before quotation"],
    optional: ["Air, mud or water circulation support subject to the drilling plan", "Drill-pipe, hammer, bit and handling accessories matched to the tool string", "Transport and site-setup support subject to access review"],
  },
  "drilling-consumables": {
    overview: (name, model) => `${name}${model ? ` (${model})` : ""} is an identified drilling-tool record intended for compatibility-led selection. A tool should not be selected from diameter or model reference alone: the hammer or rock drill interface, thread or shank, drill-pipe connection, formation, flushing method and operating pressure all affect suitability. The catalog fields shown for this record are limited to its captured evidence and do not create a compatibility, wear-life or performance guarantee. COWIN MACHINE can review the rig, hammer or rock drill, required hole size, connection details and drilling method before proposing a configuration. Configuration subject to application review.`,
    principle: `Drilling consumables transmit impact, rotation and flushing energy from a drilling system to the rock or formation. A DTH hammer, bit and drill pipe act as a matched system, while top-hammer tools depend on the correct shank, thread and drilling-machine interface. Wear is influenced by formation, operating practice, flushing, alignment and the selected duty. The tool needs a verified interface and operating envelope before it is fitted to a rig.`,
    applications: ["DTH drilling string planning with confirmed hammer and pipe interface", "Water-well drilling where the bore and tool program are documented", "Quarry drilling after formation and bit-selection review", "Rock-drill tooling replacement with confirmed shank or thread", "Geotechnical or anchoring work subject to tool-string confirmation", "Maintenance planning for documented drilling consumables"],
    selection: ["Tool type and intended drilling method", "Compatible hammer, rock drill, thread or shank", "Required hole diameter and bit configuration", "Drill-pipe connection and string geometry", "Operating pressure, flushing medium and formation", "Wear history, safe handling and replacement plan"],
    benefits: ["Reduces the risk of incompatible tool interfaces", "Supports a documented drill-string review", "Connects the bit choice to the bore objective", "Encourages planned wear inspection and replacement", "Keeps material-grade claims behind verified documentation"],
    maintenance: ["Verify the tool interface before installation", "Inspect threads, shanks, flushing passages and wear surfaces", "Use safe lifting and handling methods for heavy tooling", "Depressurize the drilling system before tool changes", "Remove damaged tools from service according to the approved procedure", "Use only confirmed lubrication and connection practices"],
    faq: [["How do I confirm hammer or rock-drill compatibility?", "Provide the exact equipment model, interface, thread or shank and the intended drilling method."], ["Can a bit be selected by diameter only?", "No. The compatible hammer, tool interface, formation and flushing requirements must also be reviewed."], ["How is wear life determined?", "Wear depends on formation, operating practice and tool setup; no life claim is made without approved evidence."], ["Are carbide grades published?", "Material or carbide details are published only when confirmed in an approved model document."], ["What is required for a replacement quote?", "Send clear photos, existing tool markings, dimensions and equipment-interface details."]],
    standard: ["Tool identity and interface subject to the approved catalog record", "Connection details checked against the related rig or hammer", "Handling and packaging scope confirmed with the quotation"],
    optional: ["Compatible bits, hammers, pipes or adapters subject to interface review", "Tooling quantities and replacement planning based on the drilling program", "Protective handling accessories where required by the project"],
  },
  "mobile-lighting-systems": {
    overview: (name, model) => `${name}${model ? ` (${model})` : ""} is an identified mobile-lighting record for temporary, remote or project-site planning. The correct configuration begins with the night-work schedule, installation space, transport route, lighting objective, available energy source and local weather constraints. Solar, battery, hybrid and generator-supported arrangements solve different operating problems and should not be treated as interchangeable. The technical table only presents fields captured for this model record. It does not promise runtime, coverage, autonomy, wind suitability or regulatory compliance unless those details are separately approved. COWIN MACHINE can review site layout, mast use, charging conditions, trailer requirements, monitoring needs and maintenance access. Configuration subject to application review.`,
    principle: `A mobile light tower combines luminaires, a mast, controls, a support frame or trailer and an energy arrangement such as solar generation, batteries, a generator or a hybrid combination. Energy storage is measured as capacity while lighting demand is measured as power, so actual operating duration depends on the load, charging conditions, control settings and environmental conditions. Mast height, aiming and placement affect useful illumination. The tower must be stabilized, transported and operated within approved limits.`,
    applications: ["Construction sites with documented night-work and placement requirements", "Roadworks where temporary lighting layout is planned", "Mining or quarry support subject to site safety review", "Remote camps and infrastructure projects with energy constraints", "Emergency-response staging where logistics and operational limits are confirmed", "Security or CCTV monitoring where mounting and power interfaces are reviewed"],
    selection: ["Lighting objective, placement layout and night-time operating schedule", "Solar, diesel, hybrid or battery energy arrangement", "Mast height, lifting method and approved stabilizing procedure", "Battery capacity, chemistry and charging conditions where verified", "Trailer, hitch, transport and site-access requirements", "Weather, wind, local safety rules and maintenance access"],
    benefits: ["Frames lighting selection around the work schedule and site layout", "Separates energy storage capacity from lighting-load assumptions", "Supports transport and deployment planning", "Identifies mast and stabilizer procedures before operation", "Avoids unverified runtime, coverage and weather claims"],
    maintenance: ["Inspect mast, winch, outriggers, trailer components and guards before use", "Stabilize the unit on suitable ground before raising the mast", "Keep electrical connections and battery areas dry and protected as required", "Follow approved battery, generator and lighting maintenance instructions", "Lower and secure the mast before transport or service", "Do not operate outside the approved weather and wind limits"],
    faq: [["How long will a solar tower operate at night?", "Operating duration depends on verified battery capacity, lighting load, charging conditions and control settings."], ["Should I choose solar, diesel, hybrid or battery power?", "Choose after reviewing site power, operating schedule, charging opportunity, access and maintenance needs."], ["Can a tower be used in high wind?", "Only the approved model-specific wind limit and stabilizing procedure should be used."], ["Is CCTV included?", "CCTV mounting, power, network and data requirements must be confirmed for the selected configuration."], ["What trailer information is needed?", "Provide the destination, hitch standard, transport route and any local road or registration requirements."]],
    standard: ["Lighting, mast and support arrangement subject to the approved model record", "Energy, controls and trailer configuration confirmed against the project schedule", "Stabilizer and transport arrangement reviewed before delivery"],
    optional: ["CCTV, monitoring, charging or power-interface options subject to approved scope", "Solar, battery or generator arrangement matched to the operating profile", "Trailer and hitch configuration reviewed for destination requirements"],
  },
  "magnetic-separators": {
    overview: (name, model) => `${name}${model ? ` (${model})` : ""} is an identified magnetic-separation record for material-handling and process review. Selection starts with the separation objective: tramp-iron removal, ferrous recovery, non-ferrous recovery or a process-specific separation step. Conveyor geometry, belt width, burden depth, suspension height, material characteristics, moisture, particle size and cleaning duty can change the suitable configuration. The captured catalog fields are limited to the identified record and do not establish magnetic intensity, capacity, temperature suitability, food-process suitability or separation performance unless separately approved. COWIN MACHINE can review the conveyor, feed stream, installation space and cleaning arrangement with the buyer. Configuration subject to application review.`,
    principle: `Magnetic separation uses a magnetic field to attract or influence magnetically responsive material. Permanent and electromagnetic systems are selected around the separation duty, installation environment and cleaning requirement. A suspended or overband arrangement may be positioned above a conveyor to remove tramp metal, while drum and wet-process arrangements are selected around feed condition and material behavior. Separation is affected by belt geometry, burden depth, suspension height, feed presentation, particle size and material characteristics. Self-cleaning and manual-clean options change how captured metal is discharged and must be reviewed against the duty.`,
    applications: ["Conveyor protection ahead of crushers, mills or shredders", "Aggregate and quarry processing with documented belt and burden conditions", "Coal or bulk-material handling where tramp-metal removal is required", "Mineral processing with dry or wet feed conditions under review", "Recycling lines separating ferrous or non-ferrous fractions", "Plastics, chemicals or grain processes only after hygiene and material evidence is confirmed"],
    selection: ["Separation objective and the target material fraction", "Permanent versus electromagnetic field requirement", "Manual-clean versus self-cleaning discharge duty", "Belt width, speed, burden depth and suspension height", "Dry, wet or slurry feed condition and particle-size behavior", "Installation access, power requirement and maintenance space"],
    benefits: ["Links equipment selection to the material stream rather than the model name", "Helps protect downstream process equipment from tramp metal", "Clarifies conveyor and installation data needed for review", "Identifies cleaning-duty and maintenance requirements early", "Avoids unverified intensity, capacity and food-grade claims"],
    maintenance: ["Use lockout procedures for driven and electromagnetic equipment", "Keep people and ferromagnetic tools clear of strong magnetic fields", "Inspect belts, scrapers, guards, bearings and support structure as applicable", "Use controlled collection procedures for captured metal", "Verify mounting and suspension hardware before operation", "Do not claim hygienic or food-grade suitability without approved construction evidence"],
    faq: [["When should a permanent or electromagnetic separator be considered?", "The choice depends on separation duty, installation environment, cleaning cycle and approved project requirements."], ["When is self-cleaning preferred?", "Continuous or higher-duty tramp-metal removal may require a reviewed self-cleaning arrangement; the duty must be confirmed."], ["What conveyor data is needed?", "Provide belt width, speed, burden depth, suspension space, material type and feed condition."], ["How do dry and wet separation differ?", "Feed condition, particle behavior and process layout determine whether a dry or wet approach is considered."], ["Can this equipment be used for food processing?", "Only after verified material, construction, hygiene and validation information is available."]],
    standard: ["Magnet and cleaning arrangement subject to the approved model record", "Installation and support arrangement reviewed against conveyor geometry", "Electrical supply and controls confirmed for electromagnetic configurations"],
    optional: ["Self-cleaning, controls or monitoring options subject to duty review", "Mounting, chute or conveyor-interface support matched to the site", "Process-specific material testing or engineering review where required"],
  },
};

const fieldDefinitions = {
  "compressed-air-equipment": [["Air delivery / FAD", ["air capacity", "air delivery", "free air"]], ["Working pressure", ["working pressure", "pressure"]], ["Motor or engine power", ["power", "motor", "engine"]], ["Power source", ["voltage", "diesel", "electric"]], ["Compression stage", ["compression stage"]], ["Cooling method", ["cooling"]], ["Air outlet size", ["outlet"]], ["Dimensions", ["dimension"]], ["Weight", ["weight"]], ["Noise level", ["noise"]]],
  "generator-systems": [["Rated power", ["rated power", "power"]], ["Standby power", ["standby"]], ["Voltage", ["voltage"]], ["Frequency", ["frequency"]], ["Phase", ["phase"]], ["Engine", ["engine"]], ["Alternator", ["alternator"]], ["Fuel tank", ["fuel tank"]], ["Noise level", ["noise"]], ["Dimensions", ["dimension"]], ["Weight", ["weight"]]],
  "drilling-equipment": [["Drilling depth", ["drilling depth", "depth"]], ["Hole diameter", ["diameter"]], ["Drilling method", ["method"]], ["Air consumption", ["air consumption"]], ["Air pressure", ["air pressure"]], ["Rotary torque", ["torque"]], ["Rotary speed", ["speed"]], ["Feed stroke", ["feed", "advance"]], ["Drill pipe diameter", ["drill pipe"]], ["Engine power", ["power"]], ["Dimensions", ["dimension"]], ["Weight", ["weight"]]],
  "drilling-consumables": [["Tool type", ["tool type", "type"]], ["Compatible hammer or rock drill", ["hammer", "rock drill", "compatible"]], ["Bit diameter", ["diameter"]], ["Thread", ["thread"]], ["Shank type", ["shank"]], ["Working pressure", ["pressure"]], ["Length", ["length"]], ["Weight", ["weight"]], ["Material or carbide grade", ["material", "carbide"]]],
  "mobile-lighting-systems": [["Light type", ["lamp", "light type"]], ["Lighting power", ["lighting power", "lamp"]], ["Light output", ["lumen", "output"]], ["Mast height", ["mast", "height extended"]], ["Mast lifting method", ["mast lifting"]], ["Solar panel capacity", ["solar panel"]], ["Battery capacity and chemistry", ["battery"]], ["Generator type", ["engine", "generator"]], ["Autonomy", ["runtime", "autonomy"]], ["Wind rating", ["wind"]], ["Trailer dimensions", ["dimension", "trailer"]], ["Weight", ["weight"]]],
  "magnetic-separators": [["Separator type", ["type", "separator"]], ["Magnet type", ["magnet type"]], ["Cleaning method", ["clean", "discharge"]], ["Installation method", ["installation", "suspension"]], ["Suitable belt width", ["belt width"]], ["Suspension height", ["suspension height"]], ["Material burden depth", ["burden"]], ["Magnetic intensity", ["intensity", "gauss"]], ["Capacity", ["capacity"]], ["Operating temperature", ["temperature"]], ["Power requirement", ["power"]], ["Dimensions", ["dimension"]], ["Weight", ["weight"]]],
};

function makeSpecifications(product, canonical) {
  if (canonical.productStatus !== "verified-model") return [];
  const source = Object.entries(canonical.verifiedSpecifications || {});
  const used = new Set();
  return fieldDefinitions[canonical.category].map(([label, matches]) => {
    const hitIndex = source.findIndex(([key]) => !used.has(key) && matches.some((match) => key.toLowerCase().includes(match)));
    if (hitIndex === -1) return { label, value: "Configuration subject to application review." };
    const [key, value] = source[hitIndex]; used.add(key);
    return { label, value: `${value}` };
  }).filter((item, index, all) => item.value !== "Configuration subject to application review." || index < all.length);
}

function evidence(canonical) {
  return Object.keys(canonical.verifiedSpecifications || {}).map((field) => ({ field, sourceUrl: canonical.currentUrls[0], sourceName, accessedAt: canonical.evidence[0]?.accessedAt ?? "2026-08-14", confidence: "medium" }));
}

function expandedArticle(text, product, topic) {
  const additions = [
    `For the ${product.currentH1} record, the review should document the actual application, site interfaces and operating sequence before any configuration is confirmed.`,
    `This ${topic} explains general selection context only. Exact capability, limits, materials, test conditions and compatibility remain subject to the approved model record and application review.`,
    `The buyer should retain the project inputs with the inquiry so the final recommendation can be checked against the intended duty rather than inferred from a catalog label.`,
  ];
  let result = text;
  for (const addition of additions) {
    if (result.trim().split(/\s+/).length >= 120) break;
    result += ` ${addition}`;
  }
  return result.trim().split(/\s+/).slice(0, 180).join(" ");
}

function reviewContent(product, canonical) {
  const label = categoryLabels[product.category];
  const productName = product.currentH1 || product.modelReference || "This product";
  return {
    overview: `${productName} is retained as a ${label} catalog reference, but its model identity, configuration or supporting specification evidence requires owner review before technical claims are published. Share the intended application, material or medium, required quantity, country and project conditions so COWIN MACHINE can request the correct configuration information.`,
    workingPrinciple: `Technical operating content is intentionally withheld for this record until the exact model or product family is confirmed. Configuration subject to application review.`,
    applications: ["Application review required before suitability is stated"],
    selectionGuide: ["Provide the existing model marking or a clear product photo", "Describe the process, material or medium and operating environment", "Confirm installation space, utilities and required quantity", "Request approved model-specific specifications before procurement"],
    benefits: ["Prevents unsupported technical claims", "Creates a documented basis for configuration review"],
    maintenanceAndSafety: ["Follow only the approved manual for the confirmed product", "Do not install or operate equipment without model-specific safety information"],
    faqs: [{ question: "Why are specifications not shown?", answer: "The current record needs owner confirmation before product-specific data can be published." }, { question: "What should I send for review?", answer: "Send the model marking, application, material or medium, site conditions and required quantity." }],
    citationsInternalOnly: canonical ? evidence(canonical) : [],
  };
}

const profiles = inventory.records.map((product) => {
  const canonical = canonicalByUrl.get(product.url);
  const localImage = product.imagePath && fs.existsSync(path.join(root, "public", product.imagePath));
  if (!canonical || canonical.productStatus !== "verified-model") return {
    routeKey: `${product.category}/${product.slug}`,
    canonicalId: canonical?.canonicalId ?? null,
    model: canonical?.model ?? product.modelReference ?? null,
    publicationState: "configuration-review",
    reviewReason: canonical ? "Model-specific supporting information is pending review." : "A confirmed product-family mapping is not yet available.",
    imageStatus: localImage ? "Local catalog image available" : "Image pending review",
    content: reviewContent(product, canonical), specifications: [], standardConfiguration: ["Request Configuration Review"], optionalConfiguration: ["Request verified model and configuration information"], relatedProductSlugs: [],
  };
  const template = shared[canonical.category];
  const peers = audit.products.filter((item) => item.category === canonical.category && item.productStatus === "verified-model" && item.canonicalId !== canonical.canonicalId).slice(0, 3);
  return {
    routeKey: `${product.category}/${product.slug}`,
    canonicalId: canonical.canonicalId,
    model: canonical.model,
    publicationState: "full-technical-content",
    reviewReason: null,
    imageStatus: localImage ? "Local catalog image available" : "Image pending review",
    content: {
      overview: expandedArticle(template.overview(product.currentH1, canonical.model), product, "overview"),
      workingPrinciple: expandedArticle(template.principle, product, "working-principle guidance"),
      applications: template.applications,
      selectionGuide: template.selection,
      benefits: template.benefits,
      maintenanceAndSafety: template.maintenance,
      faqs: template.faq.map(([question, answer]) => ({ question, answer })),
      citationsInternalOnly: evidence(canonical),
    },
    specifications: makeSpecifications(product, canonical),
    standardConfiguration: template.standard,
    optionalConfiguration: template.optional,
    relatedProductSlugs: peers.flatMap((peer) => peer.currentUrls.map((url) => url.split("/").slice(-2).join("/"))).slice(0, 3),
  };
});

const output = { generatedAt: new Date().toISOString(), totalRoutes: profiles.length, profiles };
fs.mkdirSync(path.join(root, "data/product-detail"), { recursive: true });
fs.writeFileSync(path.join(root, "data/product-detail/product-detail-content.json"), JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify({ routes: profiles.length, full: profiles.filter((p) => p.publicationState === "full-technical-content").length, review: profiles.filter((p) => p.publicationState === "configuration-review").length, missingImages: profiles.filter((p) => p.imageStatus !== "Local catalog image available").length }, null, 2));

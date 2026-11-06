const categories = [
  { value: "compressed-air-equipment", label: "Air compressors" },
  { value: "generator-systems", label: "Generator systems" },
  { value: "drilling-equipment", label: "Drilling rigs" },
  { value: "drilling-consumables", label: "Drilling tools & consumables" },
  { value: "mobile-lighting-systems", label: "Solar & mobile light towers" },
  { value: "magnetic-separators", label: "Magnetic separators" },
] as const;

const workingConditions = [
  "Available power and site access",
  "Remote or mobile operation",
  "Continuous industrial duty",
  "Material handling or separation",
];

export function HomeTechnicalSelector() {
  return <form className="home-selection-form" action="/request-a-quote" method="get">
    <label>
      <span>1. What equipment do you need?</span>
      <select name="category" defaultValue="" required>
        <option value="">Select equipment category</option>
        {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>
    <div className="home-selection-form-row">
      <label>
        <span>2. Application</span>
        <select name="application" defaultValue="" required>
          <option value="">Select application</option>
          <option value="Mining and quarrying">Mining and quarrying</option>
          <option value="Water well drilling">Water well drilling</option>
          <option value="Construction site">Construction site</option>
          <option value="Remote worksite">Remote worksite</option>
          <option value="Material processing">Material processing</option>
        </select>
      </label>
      <label>
        <span>3. Working conditions</span>
        <select name="requirements" defaultValue="" required>
          <option value="">Select conditions</option>
          {workingConditions.map((condition) => <option value={`Working conditions: ${condition}.`} key={condition}>{condition}</option>)}
        </select>
      </label>
    </div>
    <button className="button button-primary home-selection-submit" type="submit">Start a Technical Review <span aria-hidden="true">→</span></button>
    <p>We use your project details to begin a configuration discussion.</p>
  </form>;
}

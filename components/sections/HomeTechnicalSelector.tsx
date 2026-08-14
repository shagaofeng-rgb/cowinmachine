"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const categories = [
  { value: "compressed-air-equipment", label: "Air compressors" },
  { value: "generator-systems", label: "Generator systems" },
  { value: "drilling-equipment", label: "Drilling rigs" },
  { value: "drilling-consumables", label: "Drilling tools & consumables" },
  { value: "mobile-lighting-systems", label: "Solar & mobile light towers" },
  { value: "magnetic-separators", label: "Magnetic separators" },
] as const;

export function HomeTechnicalSelector() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [application, setApplication] = useState("");
  const [workingConditions, setWorkingConditions] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (application) params.set("application", application);
    if (workingConditions) params.set("requirements", `Working conditions: ${workingConditions}.`);
    router.push(`/request-a-quote?${params.toString()}`);
  }

  return <form className="home-selection-form" onSubmit={submit}>
    <label>
      <span>1. What equipment do you need?</span>
      <select value={category} onChange={(event) => setCategory(event.target.value)} required>
        <option value="">Select equipment category</option>
        {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>
    <div className="home-selection-form-row">
      <label>
        <span>2. Application</span>
        <select value={application} onChange={(event) => setApplication(event.target.value)} required>
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
        <select value={workingConditions} onChange={(event) => setWorkingConditions(event.target.value)} required>
          <option value="">Select conditions</option>
          <option value="Available power and site access">Available power and site access</option>
          <option value="Remote or mobile operation">Remote or mobile operation</option>
          <option value="Continuous industrial duty">Continuous industrial duty</option>
          <option value="Material handling or separation">Material handling or separation</option>
        </select>
      </label>
    </div>
    <button className="button button-primary home-selection-submit" type="submit">Start a Technical Review <span aria-hidden="true">→</span></button>
    <p>We use your project details to begin a configuration discussion.</p>
  </form>;
}

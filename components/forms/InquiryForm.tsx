"use client";

import { PaperPlaneTilt } from "@phosphor-icons/react/ssr";
import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getAnalyticsRequestHeaders, trackAnalyticsEvent } from "@/components/analytics/AnalyticsTracker";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(120),
  company: z.string().trim().min(2, "Enter your company name.").max(180),
  country: z.string().trim().min(2, "Enter your country.").max(100),
  email: z.string().trim().email("Enter a valid business email.").max(180),
  category: z.string().trim().min(1, "Select a product category.").max(100),
  message: z.string().trim().min(10, "Tell us a little about your application.").max(6000),
  website: z.string().max(0),
  productModel: z.string().trim().max(180).optional(),
  productUrl: z.string().url().max(600).optional().or(z.literal("")),
  application: z.string().trim().max(600).optional(),
  material: z.string().trim().max(300).optional(),
  quantity: z.string().trim().max(100).optional(),
  whatsapp: z.string().trim().max(100).optional(),
});

const categories = [
  ["compressed-air-equipment", "Air Compressors"],
  ["generator-systems", "Generator Systems"],
  ["drilling-equipment", "Drilling Rigs"],
  ["drilling-consumables", "Drilling Tools & Consumables"],
  ["mobile-lighting-systems", "Solar & Mobile Light Towers"],
  ["magnetic-separators", "Magnetic Separators"],
];

type FormData = z.infer<typeof schema>;
type VisibleInput = "name" | "company" | "country" | "email" | "application" | "material" | "quantity" | "whatsapp";
type FormProps = { productModel?: string; productUrl?: string; compact?: boolean; defaults?: Partial<FormData> };

export function InquiryForm({ productModel, productUrl, compact = false, defaults = {} }: FormProps) {
  const formId = useId();
  const [submission, setSubmission] = useState<{ ok: boolean; message: string }>();
  const hasTrackedStart = useRef(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: "", productModel: productModel ?? "", productUrl: productUrl ?? "", website: "", ...defaults },
  });

  const onSubmit = async (data: FormData) => {
    setSubmission(undefined);
    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAnalyticsRequestHeaders() },
        body: JSON.stringify(data),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "We could not submit your request. Please try again.");
      trackAnalyticsEvent("inquiry_submitted", { category: data.category });
      setSubmission({ ok: true, message: result.message ?? "Your request has been received." });
      reset({ category: data.category, productModel: productModel ?? "", productUrl: productUrl ?? "", website: "" });
    } catch (error) {
      setSubmission({ ok: false, message: error instanceof Error && !(error instanceof SyntaxError) ? error.message : "We could not submit your request. Please try again or contact us by email." });
    }
  };

  const fieldId = (name: keyof FormData) => `${formId}-${name}`;
  const errorProps = (name: keyof FormData) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${fieldId(name)}-error` : undefined,
  });
  const errorText = (name: keyof FormData) => errors[name] && (
    <span id={`${fieldId(name)}-error`} className="cw-field-error" role="alert">{errors[name]?.message}</span>
  );
  const requiredMark = <span className="cw-field-required" aria-hidden="true">*</span>;

  function input(name: VisibleInput, label: string, maxLength: number, options: { required?: boolean; type?: string; autoComplete?: string } = {}) {
    return (
      <div className="cw-field">
        <label htmlFor={fieldId(name)}>{label}{options.required ? requiredMark : null}</label>
        <input id={fieldId(name)} type={options.type ?? "text"} autoComplete={options.autoComplete} maxLength={maxLength}
          required={options.required} {...register(name)} {...errorProps(name)} />
        {errorText(name)}
      </div>
    );
  }

  return (
    <form className="cw-inquiry-form" noValidate aria-busy={isSubmitting}
      onFocus={() => {
        if (!hasTrackedStart.current) {
          hasTrackedStart.current = true;
          trackAnalyticsEvent("inquiry_started");
        }
      }}
      onSubmit={handleSubmit(onSubmit, () => setSubmission(undefined))}
    >
      <input className="honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" {...register("website")} />
      <input type="hidden" {...register("productModel")} />
      <input type="hidden" {...register("productUrl")} />
      <fieldset className="cw-form-group">
        <legend>Contact details</legend>
        <div className="cw-form-grid">
          {input("name", "Full name", 120, { required: true, autoComplete: "name" })}
          {input("company", "Company name", 180, { required: true, autoComplete: "organization" })}
          {input("country", "Country", 100, { required: true, autoComplete: "country-name" })}
          {input("email", "Business email", 180, { required: true, type: "email", autoComplete: "email" })}
          {!compact && input("whatsapp", "WhatsApp / phone", 100, { type: "tel", autoComplete: "tel" })}
        </div>
      </fieldset>
      <fieldset className="cw-form-group">
        <legend>Equipment requirements</legend>
        <div className="cw-form-grid">
          <div className="cw-field">
            <label htmlFor={fieldId("category")}>Equipment family{requiredMark}</label>
            <select id={fieldId("category")} required {...register("category")} {...errorProps("category")}>
              <option value="">Select a category</option>
              {categories.map(([slug, label]) => <option value={slug} key={slug}>{label}</option>)}
            </select>
            {errorText("category")}
          </div>
          {!compact && <>
            {input("quantity", "Required quantity", 100)}
            {input("application", "Application", 600)}
            {input("material", "Material / medium", 300)}
          </>}
        </div>
      </fieldset>
      <fieldset className="cw-form-group">
        <legend>Project conditions</legend>
        <div className="cw-field">
          <label htmlFor={fieldId("message")}>Project details{requiredMark}</label>
          <textarea id={fieldId("message")} required rows={compact ? 4 : 5} maxLength={6000} {...register("message")} {...errorProps("message")} placeholder="Application, required output and operating conditions" />
          {errorText("message")}
        </div>
      </fieldset>
      <div className="cw-form-submit">
        <button type="submit" className="cw-btn cw-btn-primary" disabled={isSubmitting}><PaperPlaneTilt size={18} aria-hidden="true" />{isSubmitting ? "Sending request..." : "Send inquiry"}</button>
        {submission && <p className={`cw-form-result ${submission.ok ? "cw-form-result-ok" : "cw-form-result-error"}`} role={submission.ok ? "status" : "alert"}>{submission.message}</p>}
      </div>
    </form>
  );
}

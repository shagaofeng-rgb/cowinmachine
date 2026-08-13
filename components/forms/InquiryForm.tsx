"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Enter your full name."),
  company: z.string().min(2, "Enter your company name."),
  country: z.string().min(2, "Enter your country."),
  email: z.string().email("Enter a valid business email."),
  category: z.string().min(1, "Select a product category."),
  message: z.string().min(10, "Tell us a little about your application."),
  website: z.string().max(0),
  productModel: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function InquiryForm({ productModel, compact = false }: { productModel?: string; compact?: boolean }) {
  const [serverMessage, setServerMessage] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { category: "", productModel: productModel ?? "", website: "" } });
  const onSubmit = async (data: FormData) => {
    setServerMessage(undefined);
    try {
      const response = await fetch("/api/inquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "We could not submit your request. Please try again.");
      setServerMessage("Your request has been received. Our sales team will reply within 24 hours.");
      reset({ category: data.category, productModel: productModel ?? "", website: "" });
    } catch (error) { setServerMessage(error instanceof Error ? error.message : "We could not submit your request. Please try again."); }
  };
  const field = (id: keyof FormData, label: string, type = "text") => <label>{label}<input type={type} {...register(id)} aria-invalid={Boolean(errors[id])} />{errors[id] && <span className="field-error" role="alert">{errors[id]?.message}</span>}</label>;
  return <form className={`inquiry-form ${compact ? "compact" : ""}`} onSubmit={handleSubmit(onSubmit)} noValidate>
    <input className="honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" {...register("website")} />
    {field("name", "Full Name")}{field("company", "Company Name")}{field("country", "Country")}{field("email", "Business Email", "email")}
    <label>Product Category<select {...register("category")} aria-invalid={Boolean(errors.category)}><option value="">Select a category</option><option>Air Compressors</option><option>Drilling Rigs</option><option>Solar Light Towers</option><option>Magnetic Separators</option></select>{errors.category && <span className="field-error" role="alert">{errors.category.message}</span>}</label>
    {productModel && <input type="hidden" {...register("productModel")} />}
    <label className="form-wide">Message<textarea rows={compact ? 4 : 6} {...register("message")} aria-invalid={Boolean(errors.message)} placeholder="Share your application, required quantity and technical requirements." />{errors.message && <span className="field-error" role="alert">{errors.message.message}</span>}</label>
    <div className="form-wide"><button className="button button-primary" disabled={isSubmitting}>{isSubmitting ? "Sending request…" : "Send Inquiry"}</button>{serverMessage && <p role="status" className="form-status">{serverMessage}</p>}</div>
  </form>;
}

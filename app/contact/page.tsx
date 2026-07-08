import { products } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function ContactPage() {
  return (
    <>
      <div className="page-title"><h1>Contact Us</h1><p>Submit an inquiry. The backend stores the form with status, source and anti-spam fields.</p></div>
      <section className="section">
        <form className="form" action="/api/forms/submit" method="post">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" style={{ display: "none" }} />
          <label>Name<input required name="name" /></label>
          <label>Company<input name="company" /></label>
          <label>Email<input required type="email" name="email" /></label>
          <label>Country<input name="country" /></label>
          <label>Product<select name="product_id"><option value="">General inquiry</option>{products().map((p) => <option key={p.id} value={p.id}>{p.english_name}</option>)}</select></label>
          <label>Message<textarea required name="message" /></label>
          <label><span><input required type="checkbox" name="consent" value="1" /> I agree to the privacy policy.</span></label>
          <button className="button">Submit Inquiry</button>
        </form>
      </section>
    </>
  );
}

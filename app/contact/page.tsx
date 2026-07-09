import { products } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function ContactPage() {
  return (
    <>
      <div className="page-title"><h1>Contact Us</h1><p>Send your packaging machine requirements to Wenzhou Lianteng Packaging Machinery Co., LTD.</p></div>
      <section className="section">
        <div className="contact-grid">
          <div>
            <h2>Factory Contact</h2>
            <p><strong>Email:</strong> <a href="mailto:lianteng@31819.com">lianteng@31819.com</a></p>
            <p><strong>Tel:</strong> <a href="tel:+8657788309030">(86)-0577-88309030</a></p>
            <p><strong>Address:</strong> No.405-1 Xia Jin Road, Jinzhu Industrial Zone, South White Elephant, Ouhai District, Wenzhou City, Zhejiang Province, China</p>
            <p>Tell us your product, bag or container size, material, target speed and automation requirements. Lianteng can support machine selection, line layout and after-sales service.</p>
          </div>
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
        </div>
      </section>
    </>
  );
}

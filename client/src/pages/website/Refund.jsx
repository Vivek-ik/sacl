import React from "react";
import { Intro } from "./WebsiteLayout";
import { business as B } from "./data";
export default function Refund() {
  return (
    <>
      <Intro
        tag="Legal information"
        title="Refund Policy"
        desc="This policy describes how refund requests are handled for purchases and tournament registrations. Specific quotations or event rules may provide additional terms."
      />
      <section className="section p-20">
        <div className="wrap max-w-4xl space-y-8">
          {[
            [
              "Solar equipment orders",
              "Cancellation, return, replacement and refund eligibility depend on the product, condition, dispatch status, supplier/manufacturer terms and written quotation or invoice. Contact us before returning an item.",
            ],
            [
              "Tournament registration fees",
              "Refund eligibility depends on the cancellation deadline and refund terms published for the specific tournament before payment. If an event is cancelled or materially changed by the organizer, participants will be informed about the applicable refund or alternative arrangement.",
            ],
            [
              "Duplicate or failed payments",
              "If you believe you were charged more than once or a payment was debited without registration confirmation, contact us with transaction reference, date, amount and registered contact details. Never share your UPI PIN or password.",
            ],
            [
              "How to request help",
              `Email ${B.email} or call ${B.phone}. Include your order or registration reference and payment transaction ID.`,
            ],
          ].map(([h, p]) => (
            <article key={h}>
              <h2 className="text-xl font-black">{h}</h2>
              <p className="mt-3 leading-8 text-slate-600">{p}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

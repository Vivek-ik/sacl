import React from "react";
import { Intro } from "./WebsiteLayout";
import { business as B } from "./data";
export default function Privacy() {
  return (
    <Policy
      title="Privacy Policy"
      intro="This policy explains how Arohan handles information shared through this website and its enquiry or registration processes."
      sections={[
        [
          "Information we may collect",
          "We may collect contact details such as name, phone number and email address, enquiry details, product requirements and information submitted during tournament registration.",
        ],
        [
          "How information is used",
          "Information may be used to respond to enquiries, prepare quotations, manage registrations, communicate event updates, process payments through an authorized payment provider and provide support.",
        ],
        [
          "Payments",
          "Payment credentials are handled by the relevant payment service provider. Arohan does not intend to store full card details, UPI PINs or banking passwords.",
        ],
        [
          "Sharing and security",
          "Information may be shared with service providers where needed to operate services, comply with law or process payments. Reasonable safeguards are used, but no internet transmission can be guaranteed completely secure.",
        ],
        [
          "Privacy requests",
          `For privacy-related requests, contact ${B.email}.`,
        ],
      ]}
    />
  );
}
function Policy({ title, intro, sections }) {
  return (
    <>
      <Intro tag="Legal information" title={title} desc={intro} />
      <section className="section p-20">
        <div className="wrap max-w-4xl space-y-8">
          {sections.map(([h, p]) => (
            <article key={h}>
              <h2 className="text-xl font-black">{h}</h2>
              <p className="mt-3 leading-8 text-slate-600">{p}</p>
            </article>
          ))}
          <p className="border-t pt-5 text-xs text-slate-500">
            Draft policy. Review against actual business practices and
            applicable legal requirements before publishing.
          </p>
        </div>
      </section>
    </>
  );
}

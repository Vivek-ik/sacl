import React from "react";
import { Intro } from "./WebsiteLayout";
import { business as B } from "./data";
export default function Terms() {
  return (
    <>
      <Intro
        tag="Legal information"
        title="Terms & Conditions"
        desc="By using this website, you agree to these terms. Review the applicable product quotation or tournament listing before placing an order or registering."
      />
      <section className="section p-20">
        <div className="wrap max-w-4xl space-y-8">
          {[
            [
              "Business information",
              `This website is operated under the name Arohan, proprietor ${B.proprietor}, at ${B.address}.`,
            ],
            [
              "Solar products",
              "Product specifications, availability, price, taxes, delivery, installation scope and warranty are governed by the written quotation, invoice and applicable manufacturer terms.",
            ],
            [
              "Tournament registration",
              "Tournament participation is subject to event rules, eligibility, deadlines, availability and fees shown on the relevant event page. Submission of a form does not guarantee a place unless confirmation is issued.",
            ],
            [
              "Payments",
              "The amount payable is displayed before payment. Payments may be processed by an authorized provider. Payment confirmation is subject to successful provider confirmation.",
            ],
            [
              "Changes and contact",
              `Product availability, event schedules and website content may change. Contact ${B.email} or ${B.phone}.`,
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

import React from "react";
import { Trophy } from "lucide-react";
import { Intro } from "./WebsiteLayout";
import Navbar from "./Navbar";
export default function Tournaments() {
  return (
    <>
      <Navbar />
      <Intro
        tag="Sports initiatives"
        title="Tournament information and player registration."
        desc="Arohan also supports cricket and sports tournament initiatives. Participants should review event details and registration fees before applying or paying."
      />
      <section className="section">
        <div className="wrap max-w-4xl rounded-3xl border p-8">
          <Trophy className="text-leaf" size={34} />
          <h2 className="mt-4 text-2xl font-black">Tournament registration</h2>
          <p className="mt-4 leading-8 text-slate-600">
            Tournament dates, venue, eligibility, player categories,
            registration deadlines, fees and payment instructions are published
            on the relevant event listing. The final payable amount must be
            shown before checkout.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Event and venue details",
              "Eligibility and player categories",
              "Registration fee and inclusions",
              "Payment and refund conditions",
            ].map((x) => (
              <p className="rounded-xl bg-cream p-4 font-semibold" key={x}>
                ✓ {x}
              </p>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

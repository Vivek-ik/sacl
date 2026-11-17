import React from "react";
import { Intro } from "./WebsiteLayout";
import { business as B } from "./data";
import Navbar from "./Navbar";
export default function About() {
  return (
    <>
      <Navbar />

      <section className="section p-20">
        <Intro
          tag="About Arohan"
          title="A local business focused on practical progress."
          desc="Arohan, led by proprietor Narendra Lodhi, provides solar equipment and supports sports and community initiatives."
        />
        <div className="wrap grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="heading">Arohan</h2>
            <p className="mt-5 leading-8 text-slate-600">
              Based in Vidisha, Madhya Pradesh, Arohan's activities include
              solar equipment enquiries and sales, along with sports and
              tournament initiatives. Product availability, specifications,
              event details and charges are communicated for each offering.
            </p>
          </div>
          <div className="rounded-3xl bg-cream p-8">
            <h3 className="text-xl font-black">Business information</h3>
            {[
              ["Business name", B.name],
              ["Proprietor", B.proprietor],
              ["Associated name", B.foundation],
              ["Address", B.address],
            ].map(([a, b]) => (
              <div className="mt-5 border-b border-slate-200 pb-3" key={a}>
                <small className="text-slate-500">{a}</small>
                <p className="mt-1 font-semibold">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

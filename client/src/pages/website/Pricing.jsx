import React from "react";
import { Sun, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { Intro } from "./WebsiteLayout";
import Navbar from "./Navbar";
export default function Pricing() {
  return (
    <>
      <Navbar />
      <Intro
        tag="Pricing & fees"
        title="Know the applicable price before you pay."
        desc="Pricing depends on the product selected or tournament entered. Request a written solar quotation or review the event page for the exact fee."
      />
      <section className="section">
        <div className="wrap grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border p-8">
            <Sun className="text-leaf" size={32} />
            <h2 className="mt-5 text-2xl font-black">
              Solar equipment pricing
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Prices are quoted based on product, brand, capacity, quantity,
              delivery and agreed installation or service scope. Written
              quotations should show taxes and total payable.
            </p>
            <Link
              className="mt-6 inline-block font-bold text-leaf"
              to="/contact"
            >
              Request a quotation ↗
            </Link>
          </article>
          <article className="rounded-3xl bg-forest p-8 text-white">
            <Trophy className="text-sun" size={32} />
            <h2 className="mt-5 text-2xl font-black">
              Tournament registration fees
            </h2>
            <p className="mt-4 leading-7 text-white/70">
              The fee, inclusions and refund conditions for each event should be
              displayed on its registration page before checkout.
            </p>
            <Link
              className="mt-6 inline-block font-bold text-sun"
              to="/tournaments"
            >
              Tournament information ↗
            </Link>
          </article>
        </div>
      </section>
    </>
  );
}

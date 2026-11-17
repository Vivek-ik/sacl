import React from "react";
import { Sun, Zap, ShieldCheck } from "lucide-react";
import { Intro, Tile } from "./WebsiteLayout";
import Navbar from "./Navbar";
export default function Services() {
  return (
    <>
        <Navbar/>
    
      <Intro
        tag="Solar & services"
        title="Solar equipment information and support."
        desc="Connect with Arohan to discuss solar equipment requirements, product specifications, availability and quotations."
      />
      <section className="section">
        <div className="wrap grid gap-6 md:grid-cols-3">
          <Tile
            icon={<Sun />}
            title="Solar panels"
            desc="Enquire about solar panel options, specifications, capacity and availability."
            to="/contact"
            action="Request details"
          />
          <Tile
            icon={<Zap />}
            title="Solar accessories"
            desc="Ask about compatible equipment and accessories for your solar requirements."
            to="/contact"
            action="Ask for a quote"
          />
          <Tile
            icon={<ShieldCheck />}
            title="Product guidance"
            desc="Share your requirement to discuss suitable products and next steps."
            to="/contact"
            action="Talk to us"
          />
        </div>
      </section>
    </>
  );
}

import React from "react";
import { Link } from "react-router-dom";
import { Sun, Trophy, Zap, CheckCircle2 } from "lucide-react";
import { Intro, Tile, CTA } from "./WebsiteLayout";
import Navbar from "./Navbar";
function Eyebrow({ children }) {
  return (
    <p className="mb-4 text-xs font-extrabold uppercase tracking-[.22em] text-leaf">
      — {children}
    </p>
  );
}
export default function Home() {
  return (
    <>
    <Navbar/>
      <section className="bg-forest text-white p-20">
        <div className="wrap grid min-h-[620px] items-center gap-12 py-20 lg:grid-cols-2">
          <div>
            <Eyebrow>Energy for tomorrow · Opportunity today</Eyebrow>
            <h1 className="text-5xl font-black leading-[1.05] md:text-7xl">
              Building a brighter future,{" "}
              <span className="text-sun">together.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-white/65">
              Arohan brings together solar equipment solutions and community
              sports initiatives. Explore our solar offering or discover
              tournament information and registrations.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-sun px-6 py-3 font-bold text-forest"
                to="/services"
              >
                Explore solar ↗
              </Link>
              <Link
                className="rounded-full  px-6 py-3 font-bold text-forest"
                to="/tournaments"
              >
                Explore tournaments ↗
              </Link>
            </div>
            <p className="mt-10 text-sm text-white/45">
              Vidisha, Madhya Pradesh · Narendra Lodhi
            </p>
          </div>
          <div className="rounded-[2rem] bg-gradient-to-br from-leaf to-[#173b30] p-6">
            <div className="rounded-3xl border border-white/15 /5 p-8">
              <Sun className="text-sun" size={44} />
              <p className="mt-10 text-xs uppercase tracking-widest text-white/50">
                Our focus
              </p>
              <h2 className="mt-3 text-4xl font-black">Powering progress.</h2>
              <p className="mt-4 leading-7 text-white/65">
                Solar products, practical support and sports participation
                opportunities.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-forest/70 p-5">
                  <Zap className="text-sun" />
                  <b className="mt-3 block">Solar</b>
                  <small className="text-white/55">Equipment & solutions</small>
                </div>
                <div className="rounded-2xl bg-forest/70 p-5">
                  <Trophy className="text-sun" />
                  <b className="mt-3 block">Sports</b>
                  <small className="text-white/55">
                    Tournament initiatives
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <Eyebrow>What we do</Eyebrow>
          <h2 className="heading">Two pathways. One commitment to progress.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Tile
              icon={<Sun />}
              title="Solar equipment & solutions"
              desc="Explore solar equipment options, request product information and connect with our team for recommendations and quotations."
              to="/services"
              action="Explore solar"
            />
            <Tile
              icon={<Trophy />}
              title="Sports & tournament initiatives"
              desc="Discover tournament details, registration information, fees and payment instructions for listed events."
              to="/tournaments"
              action="View tournaments"
            />
          </div>
        </div>
      </section>
      <section className="section bg-cream">
        <div className="wrap">
          <h2 className="heading">Clear information at every step.</h2>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              "Clear product information",
              "Upfront tournament fees",
              "Accessible support",
              "Published policies",
            ].map((x) => (
              <div
                className="flex gap-2 rounded-xl  p-4 font-semibold"
                key={x}
              >
                <CheckCircle2 className="text-leaf" />
                {x}
              </div>
            ))}
          </div>
        </div>
      </section>
      <CTA />
    </>
  );
}

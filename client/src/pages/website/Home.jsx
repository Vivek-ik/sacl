import React from "react";
import { Link } from "react-router-dom";
import { Sun, Trophy, Zap, CheckCircle2, ArrowRight } from "lucide-react";
import { Intro, Tile, CTA } from "./WebsiteLayout";
import Navbar from "./Navbar";
import Privacy from "./Privacy";
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
      <Navbar />
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
      <section className="section p-20">
        <div className="wrap">
          <Eyebrow>What we do</Eyebrow>
          <h2 className="heading">Two pathways. One commitment to progress.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Tile
              icon={<Sun />}
              title="Solar equipment & solutions"
              desc="Explore solar equipment options, request product information and connect with our team for recommendations and quotations."
              to="https://arohanmp.in"
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
      <section className="section bg-cream p-20">
        <div className="wrap">
          <h2 className="heading">Clear information at every step.</h2>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              "Clear product information",
              "Upfront tournament fees",
              "Accessible support",
              "Published policies",
            ].map((x) => (
              <div className="flex gap-2 rounded-xl  p-4 font-semibold" key={x}>
                <CheckCircle2 className="text-leaf" />
                {x}
              </div>
            ))}
          </div>
        </div>
      </section>
      <CTA />
      {/* Footer */}
      <footer className="mt-10 border-t border-white/10 bg-[#0b1629] p-20 rounded-xl">
        <div className="grid gap-10 py-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Platform */}
          <div>
            <Link to="/home" className="inline-flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400 text-slate-950">
                <Trophy size={22} />
              </div>
              <div>
                <p className="text-xl font-black">
                  We<span className="text-amber-400">Khiladi</span>
                </p>
                <p className="text-[10px] uppercase tracking-widest text-slate-400">
                  Digital Auction Arena
                </p>
              </div>
            </Link>

            <p className="mt-4 text-sm leading-7 text-slate-400">
              WeKhiladi is a sports registration and tournament management
              platform dedicated to promoting sports, supporting emerging
              talent, and creating opportunities for aspiring athletes.
            </p>

            <a
              href="https://wekhiladi.in/home"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-amber-400 hover:text-amber-300"
            >
              Visit wekhiladi.in
              <ArrowRight size={16} />
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-white">Quick Links</h3>

            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
              <Link to="/home" className="hover:text-amber-400">
                Home
              </Link>
              <Link to="/contact" className="hover:text-amber-400">
                Contact us
              </Link>
              <Link to="/tournaments" className="hover:text-amber-400">
                Tournaments
              </Link>
              <Link to="/register" className="hover:text-amber-400">
                Registration
              </Link>
              <Link to="/login" className="hover:text-amber-400">
                Login
              </Link>
              <Link
                to="/organization/register"
                className="hover:text-amber-400"
              >
                Organization Registration
              </Link>
            </div>
          </div>

          {/* Associated Organisations */}
          <div>
            <h3 className="font-bold text-white">
              Our Associated Organisations
            </h3>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="font-semibold text-amber-400">Arohan</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="font-semibold text-amber-400">
                  Lodheshwar Foundation
                </p>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div>
            <h3 className="font-bold text-white">Business Information</h3>

            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">Business Name</p>
                <p className="mt-1 font-semibold text-slate-200">Arohan</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Proprietor</p>
                <p className="mt-1 font-semibold text-slate-200">
                  Narendra Lodhi
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Associated Name</p>
                <p className="mt-1 font-semibold text-slate-200">
                  Lodheshwar Foundation
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Business Address</p>
                <p className="mt-1 leading-6 text-slate-300">
                  126 B, Vaishali Nagar, Vidisha, Madhya Pradesh 464001, India
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 py-5">
          <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} WeKhiladi. All rights reserved.
            </p>

            <a
              href="https://wekhiladi.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-slate-400 transition hover:text-amber-400"
            >
              Powered by WeKhiladi
            </a>
          </div>
        </div>
        <div className="wrap">
          <h3 className="font-bold text-white">We Khiladi</h3>

          <p className="mt-2 text-sm text-slate-400">
            Tournament registration and management platform.
          </p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <Link
              to="/terms-and-conditions"
              className="text-slate-400 transition hover:text-white"
            >
              Terms & Conditions
            </Link>

            <Link
              to="/privacy"
              className="text-slate-400 transition hover:text-white"
            >
              Privacy Policy
            </Link>

            <Link
              to="/refund-policy"
              className="text-slate-400 transition hover:text-white"
            >
              Refund & Cancellation Policy
            </Link>
          </div>

          <div className="mt-8 border-t border-white/10 pt-5 text-xs text-slate-500">
            © {new Date().getFullYear()} We khiladi. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}

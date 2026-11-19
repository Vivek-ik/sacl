import React from "react";
import { Intro } from "./WebsiteLayout";
import { business as B } from "./data";
import Navbar from "./Navbar";
import { Link } from "react-router-dom";
import { ArrowRight, Trophy } from "lucide-react";
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

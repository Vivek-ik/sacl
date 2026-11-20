import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Sun, Menu, X } from "lucide-react";
import { business as B } from "./data";
import Navbar from "./Navbar";
const nav = [
  ["Home", "/"],
  ["About", "/about"],
  ["Solar & Services", "/services"],
  ["Pricing", "/pricing"],
  ["Tournaments", "/tournaments"],
  ["Contact", "/contact"],
];
export function Header() {
  const [o, S] = useState(false);
  return (
    <>
      <Navbar />
      <header className="sticky top-0 z-50 bg-forest text-white shadow-lg">
        <div className="wrap flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <span className="rounded-xl bg-sun p-3 text-forest">
              <Sun />
            </span>
            <span>
              <b className="block text-xl">AROHAN</b>
              <small className="text-[10px] tracking-[.2em] text-white/60">
                SOLAR • SPORTS • COMMUNITY
              </small>
            </span>
          </Link>
          <nav className="hidden gap-6 lg:flex">
            {nav.map(([n, p]) => (
              <NavLink
                key={p}
                to={p}
                className={({ isActive }) =>
                  isActive ? "text-sun" : "text-white/80 hover:text-sun"
                }
              >
                {n}
              </NavLink>
            ))}
          </nav>
          <Link
            to="/contact"
            className="hidden rounded-full bg-sun px-5 py-3 font-bold text-forest lg:block"
          >
            Get in touch ↗
          </Link>
          <button className="lg:hidden" onClick={() => S(!o)} aria-label="Menu">
            {o ? <X /> : <Menu />}
          </button>
        </div>
        {o && (
          <nav className="grid gap-1 border-t border-white/10 p-4 lg:hidden">
            {nav.map(([n, p]) => (
              <Link
                onClick={() => S(false)}
                className="rounded-lg p-3 hover:bg-white/10"
                to={p}
                key={p}
              >
                {n}
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
export function Footer() {
  return (
    <footer className="bg-[#0b1e1a] text-white">
      <div className="wrap grid gap-9 py-14 md:grid-cols-4">
        <div>
          <b className="text-2xl">AROHAN</b>
          <p className="mt-4 text-sm leading-7 text-white/60">
            Solar equipment and community sports initiatives, with clear
            information and accessible support.
          </p>
          <p className="mt-3 text-sun">{B.foundation}</p>
        </div>
        <div>
          <b>Explore</b>
          {nav.slice(1).map(([n, p]) => (
            <Link
              className="mt-3 block text-sm text-white/60 hover:text-sun"
              to={p}
              key={p}
            >
              {n}
            </Link>
          ))}
        </div>
        <div>
          <b>Policies</b>
          {[
            ["Privacy Policy", "/privacy"],
            ["Terms & Conditions", "/terms"],
            ["Refund Policy", "/refund"],
          ].map(([n, p]) => (
            <Link
              className="mt-3 block text-sm text-white/60 hover:text-sun"
              to={p}
              key={p}
            >
              {n}
            </Link>
          ))}
        </div>
        <div>
          <b>Contact</b>
          <p className="mt-4 text-sm text-white/65">☎ {B.phone}</p>
          <p className="mt-3 text-sm text-white/65">{B.email}</p>
          <p className="mt-3 text-sm leading-6 text-white/65">{B.address}</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Arohan · Proprietor: {B.proprietor}
      </div>
    </footer>
  );
}
export function Intro({ tag, title, desc }) {
  return (
    <section className="bg-cream py-16 md:p-20">
      <div className="wrap">
        <p className="mb-4 text-xs font-extrabold uppercase tracking-[.22em] text-leaf">
          — {tag}
        </p>
        <h1 className="max-w-4xl text-4xl font-black leading-tight text-forest md:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          {desc}
        </p>
      </div>
    </section>
  );
}
export function CTA() {
  return (
    <section className="bg-leaf py-14 text-white p-20">
      <div className="wrap flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/60">
            Need assistance?
          </p>
          <h2 className="mt-2 text-3xl font-black">Talk to the We Khiladi team.</h2>
        </div>
        <Link
          className="rounded-full px-6 py-3 font-bold text-forest"
          to="/contact"
        >
          Contact us ↗
        </Link>
      </div>
    </section>
  );
}
export function Tile({ icon, title, desc, to, action }) {
  return (
    <article className="rounded-3xl border border-slate-200  p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="inline-flex rounded-2xl bg-cream p-4 text-leaf">
        {icon}
      </div>
      <h3 className="mt-5 text-2xl font-black text-forest">{title}</h3>
      <p className="mt-3 leading-7 text-slate-600">{desc}</p>
      <Link className="mt-5 inline-block font-bold text-leaf" to={to}>
        {action} ↗
      </Link>
    </article>
  );
}

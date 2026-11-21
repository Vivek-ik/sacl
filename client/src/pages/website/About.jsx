import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Trophy,
  Users,
  Gavel,
  ShieldCheck,
  Target,
  Building2,
} from "lucide-react";

import { Intro } from "./WebsiteLayout";
import { business as B } from "./data";
import Navbar from "./Navbar";

export default function About() {
  return (
    <>
      <Navbar />

      {/* About Hero */}
      <section className="relative overflow-hidden bg-[#0B1629] px-6 py-20 text-white md:py-28">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="wrap relative">
          <Intro
            tag="About WeKhiladi"
            title="Connecting players. Empowering teams. Growing sports."
            desc="WeKhiladi is a digital sports platform that brings players, teams, organizations and sports communities together through technology."
          />

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/tournaments"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 font-bold text-white transition hover:bg-blue-700"
            >
              Explore Tournaments
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/register"
              className="rounded-full border border-white/20 px-7 py-3.5 font-bold text-white transition hover:border-blue-400 hover:text-blue-400"
            >
              Register Now
            </Link>
          </div>
        </div>
      </section>

      {/* About Platform */}
      <section className="px-6 py-20">
        <div className="wrap grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[.22em] text-blue-600">
               Who We Are
            </p>

            <h2 className="text-3xl font-black leading-tight md:text-5xl">
              A platform built to bring sports communities together.
            </h2>

            <p className="mt-6 leading-8">
              WeKhiladi is a sports registration and tournament management
              platform dedicated to promoting sports, supporting emerging
              talent, and creating opportunities for aspiring athletes.
            </p>

            <p className="mt-4 leading-8">
              The platform helps players register for sporting events, allows
              teams and organizations to manage participation, and supports
              tournament activities through digital registration and auction
              facilities.
            </p>

            <p className="mt-4 leading-8">
              Our aim is to make sports participation more accessible, organized
              and convenient for players, teams and organizers.
            </p>
          </div>

          <div className="rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-800 to-[#0B1629] p-8 text-white shadow-xl">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-400 text-slate-950">
              <Trophy size={34} />
            </div>

            <h3 className="mt-8 text-3xl font-black">WeKhiladi</h3>

            <p className="mt-3 text-lg font-semibold text-blue-200">
              Your game. Your journey. Your opportunity.
            </p>

            <p className="mt-5 leading-8 text-white/70">
              A digital platform designed to connect sports enthusiasts with
              tournaments, teams and sporting opportunities.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                <Users className="text-amber-400" size={28} />
                <p className="mt-3 font-bold">Players</p>
                <p className="mt-1 text-xs text-white/60">
                  Registration & profiles
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                <Gavel className="text-amber-400" size={28} />
                <p className="mt-3 font-bold">Auctions</p>
                <p className="mt-1 text-xs text-white/60">Digital bidding</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="bg-blue-50 px-6 py-20">
        <div className="wrap">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[.22em] text-blue-600">
               What We Do
            </p>

            <h2 className="text-3xl font-black text-slate-900 md:text-5xl">
              Making sports management easier through technology.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-blue-100 bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl">
              <div className="inline-flex rounded-xl bg-blue-100 p-3 text-blue-600">
                <Users size={28} />
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Player Registration
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                Online player registration and profile management to simplify
                participation in sporting events.
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl">
              <div className="inline-flex rounded-xl bg-blue-100 p-3 text-blue-600">
                <Trophy size={28} />
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Tournament Management
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                Discover tournaments, review event information and follow
                registration opportunities.
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl">
              <div className="inline-flex rounded-xl bg-blue-100 p-3 text-blue-600">
                <Gavel size={28} />
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Digital Auctions
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                Support digital player auctions and team-building activities
                through an organized bidding experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="px-6 py-20">
        <div className="wrap grid gap-10 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 p-8 md:p-10">
            <div className="inline-flex rounded-xl bg-blue-100 p-3 text-blue-600">
              <Target size={30} />
            </div>

            <h3 className="mt-6 text-2xl font-black">Our Mission</h3>

            <p className="mt-4 leading-8">
              To make sports participation and tournament administration simpler
              through accessible digital tools that connect players, teams and
              organizers.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 p-8 md:p-10">
            <div className="inline-flex rounded-xl bg-blue-100 p-3 text-blue-600">
              <ShieldCheck size={30} />
            </div>

            <h3 className="mt-6 text-2xl font-black">Our Commitment</h3>

            <p className="mt-4 leading-8">
              We aim to provide clear registration information, transparent fee
              details, accessible support and an organized digital experience
              for sports communities.
            </p>
          </div>
        </div>
      </section>

      {/* Associated Organisations */}
      <section className="bg-[#0B1629] px-6 py-20 text-white">
        <div className="wrap">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[.22em] text-blue-400">
               Our Network
            </p>

            <h2 className="text-3xl font-black md:text-5xl">
              Associated Organisations
            </h2>

            <p className="mt-5 leading-8 text-white/60">
              WeKhiladi is associated with organisations that support community
              initiatives and related activities. These associations are
              presented separately from the WeKhiladi platform and its identity.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <a
              href="https://arohanmp.in"
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-white/10 bg-white/5 p-7 transition hover:border-blue-400/60 hover:bg-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-600 text-white">
                  <Building2 size={25} />
                </div>

                <ArrowRight
                  size={20}
                  className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-400"
                />
              </div>

              <h3 className="mt-6 text-2xl font-black text-blue-400">Arohan</h3>

              <p className="mt-2 text-sm text-slate-400">
                Associated Organisation
              </p>

              <p className="mt-4 leading-7 text-white/65">
                An associated organisation with activities including solar
                equipment solutions and community initiatives.
              </p>

              <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-amber-400">
                Visit Arohan Website
                <ArrowRight size={16} />
              </span>
            </a>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-7">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-600 text-white">
                <Building2 size={25} />
              </div>

              <h3 className="mt-6 text-2xl font-black text-blue-400">
                Lodheshwar Foundation
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Associated Organisation
              </p>

              <p className="mt-4 leading-7 text-white/65">
                An associated organisation retained as part of WeKhiladi's wider
                organisational network.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Arohan Business Information */}
      <section className="bg-blue-50 px-6 py-20">
        <div className="wrap grid items-start gap-10 md:grid-cols-2">
          <div>
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[.22em] text-blue-600">
               Associated Business Details
            </p>

            <h2 className="text-3xl font-black text-slate-900 md:text-5xl">
              Arohan Business Information
            </h2>

            <p className="mt-5 leading-8 text-slate-600">
              The following details relate to Arohan, an associated organisation
              of WeKhiladi. They are not the legal organizer details of the
              WeKhiladi platform.
            </p>

            <a
              href="https://arohanmp.in"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-800"
            >
              Visit Arohan
              <ArrowRight size={18} />
            </a>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-900">
              Arohan – Business Information
            </h3>

            {[
              ["Business Name", B.name],
              ["Proprietor", B.proprietor],
              ["Associated Name", B.foundation],
              ["Business Address", B.address],
            ].map(([label, value]) => (
              <div
                className="mt-5 border-b border-slate-200 pb-4 last:border-0"
                key={label}
              >
                <small className="text-slate-500">{label}</small>
                <p className="mt-1 font-semibold leading-7 text-slate-800">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white px-6 py-16">
        <div className="wrap rounded-3xl bg-gradient-to-r from-blue-700 to-[#0B1629] px-8 py-12 text-center text-white md:px-16">
          <h2 className="text-3xl font-black md:text-4xl">
            Be a part of the sporting journey.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/70">
            Explore tournaments, register as a player or connect with sports
            organizations through WeKhiladi.
          </p>

          <Link
            to="/tournaments"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-400 px-7 py-3.5 font-bold text-slate-950 transition hover:bg-amber-300"
          >
            Explore Tournaments
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 rounded-t-2xl bg-[#0B1629] px-6 py-14 text-white">
        <div className="wrap">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Platform */}
            <div>
              <Link to="/home" className="inline-flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">
                  <Trophy size={22} />
                </div>

                <div>
                  <p className="text-xl font-black">
                    We<span className="text-blue-400">Khiladi</span>
                  </p>

                  <p className="text-[10px] uppercase tracking-widest text-slate-400">
                    Digital Sports Platform
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
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-400 transition hover:text-blue-300"
              >
                Visit wekhiladi.in
                <ArrowRight size={16} />
              </a>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-white">Quick Links</h3>

              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                <Link to="/home" className="transition hover:text-blue-400">
                  Home
                </Link>

                <Link to="/about" className="transition hover:text-blue-400">
                  About Us
                </Link>

                <Link to="/contact" className="transition hover:text-blue-400">
                  Contact Us
                </Link>

                <Link
                  to="/tournaments"
                  className="transition hover:text-blue-400"
                >
                  Tournaments
                </Link>

                <Link to="/register" className="transition hover:text-blue-400">
                  Registration
                </Link>

                <Link to="/login" className="transition hover:text-blue-400">
                  Login
                </Link>

                <Link
                  to="/organization/register"
                  className="transition hover:text-blue-400"
                >
                  Organization Registration
                </Link>
              </div>
            </div>

            {/* Associated Organisations */}
            <div>
              <h3 className="font-bold text-white">Associated Organisations</h3>

              <div className="mt-4 space-y-3">
                <a
                  href="https://arohanmp.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-blue-400/50"
                >
                  <p className="font-semibold text-blue-400">Arohan</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Associated Organisation
                  </p>
                </a>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold text-blue-400">
                    Lodheshwar Foundation
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Associated Organisation
                  </p>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div>
              <h3 className="font-bold text-white">
                Arohan Business Information
              </h3>

              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Business Name</p>
                  <p className="mt-1 font-semibold text-slate-200">{B.name}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Proprietor</p>
                  <p className="mt-1 font-semibold text-slate-200">
                    {B.proprietor}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Associated Name</p>
                  <p className="mt-1 font-semibold text-slate-200">
                    {B.foundation}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Business Address</p>
                  <p className="mt-1 leading-6 text-slate-300">{B.address}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Contact</p>
                  <p className="mt-1 leading-6 text-slate-300">
                    Phone: 9109101114 <br />
                    Email: arohanmp@gmail.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Policies */}
          <div className="mt-12 border-t border-white/10 pt-8">
            <h3 className="font-bold text-white">Legal & Policies</h3>

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
              <Link
                to="/terms-and-conditions"
                className="transition hover:text-blue-400"
              >
                Terms & Conditions
              </Link>

              <Link to="/privacy" className="transition hover:text-blue-400">
                Privacy Policy
              </Link>

              <Link
                to="/refund-policy"
                className="transition hover:text-blue-400"
              >
                Refund & Cancellation Policy
              </Link>

              <Link
                to="/payment-delivery-policy"
                className="transition hover:text-blue-400"
              >
                Payment & Delivery Policy
              </Link>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-center sm:flex-row sm:text-left">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} WeKhiladi. All rights reserved.
            </p>

            <a
              href="https://wekhiladi.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-slate-400 transition hover:text-blue-400"
            >
              Powered by WeKhiladi
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}

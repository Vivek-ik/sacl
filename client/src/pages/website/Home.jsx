import React from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Users,
  Gavel,
  ClipboardList,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Target,
  Award,
  Zap,
} from "lucide-react";

import Navbar from "./Navbar";
import { CTA } from "./WebsiteLayout";

function Eyebrow({ children }) {
  return (
    <p className="mb-4 text-xs font-extrabold uppercase tracking-[.22em] text-blue-400">
      — {children}
    </p>
  );
}

const features = [
  {
    icon: <ClipboardList size={28} />,
    title: "Easy Player Registration",
    desc: "Register players online, submit required details, and track registration status from one place.",
  },
  {
    icon: <Users size={28} />,
    title: "Team & Organization Management",
    desc: "Create teams, manage player information, and participate in organized sporting events.",
  },
  {
    icon: <Gavel size={28} />,
    title: "Live Player Auctions",
    desc: "Experience a digital auction process with live bidding and real-time updates.",
  },
  {
    icon: <Trophy size={28} />,
    title: "Tournament Management",
    desc: "Explore tournaments, follow participation details, and stay informed about upcoming events.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create Your Account",
    desc: "Register as a player or organization and provide the required information.",
  },
  {
    number: "02",
    title: "Explore & Participate",
    desc: "Discover available tournaments, review eligibility and complete registration.",
  },
  {
    number: "03",
    title: "Play & Grow",
    desc: "Follow tournament updates and participate in sporting opportunities.",
  },
];

const commitments = [
  "Clear registration information",
  "Transparent fee details",
  "Accessible support",
  "Published platform policies",
];

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#0B1629] px-6 py-20 text-white md:py-28">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="wrap relative grid min-h-[540px] items-center gap-14 lg:grid-cols-2">
          <div>
            <Eyebrow>One Platform. Endless Opportunities.</Eyebrow>

            <h1 className="text-5xl font-black leading-[1.08] md:text-7xl">
              Play your game.
              <span className="mt-2 block text-blue-400">
                Own your journey.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-white/65">
              WeKhiladi brings players, teams, organizers and sports communities
              together through a digital platform for registrations, tournaments
              and player auctions.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                to="/tournaments"
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
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

            <div className="mt-10 flex flex-wrap items-center gap-5 text-sm text-white/50">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-400" />
                Easy Registration
              </span>

              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-400" />
                Digital Auctions
              </span>
            </div>
          </div>

          {/* Hero Feature Card */}
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-600 via-blue-800 to-[#0B1629] p-6 shadow-2xl">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-8 backdrop-blur">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 text-slate-950">
                <Trophy size={34} />
              </div>

              <p className="mt-10 text-xs font-bold uppercase tracking-widest text-white/60">
                Welcome to WeKhiladi
              </p>

              <h2 className="mt-3 text-4xl font-black">
                Your game starts here.
              </h2>

              <p className="mt-4 leading-7 text-white/70">
                Register, connect with teams, participate in tournaments and
                take your sporting journey forward.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-[#0B1629]/60 p-5">
                  <Users className="text-amber-400" size={28} />
                  <p className="mt-3 font-bold">Players</p>
                  <p className="mt-1 text-xs text-white/50">
                    Registration & profiles
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0B1629]/60 p-5">
                  <Gavel className="text-amber-400" size={28} />
                  <p className="mt-3 font-bold">Auctions</p>
                  <p className="mt-1 text-xs text-white/50">
                    Digital player bidding
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About WeKhiladi */}
      <section className="px-6 py-20">
        <div className="wrap mx-auto max-w-4xl text-center">
          <Eyebrow>About WeKhiladi</Eyebrow>

          <h2 className="text-3xl font-black  md:text-5xl">
            Making sports participation simpler and more accessible.
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            WeKhiladi is a digital sports platform designed to simplify the way
            players register, teams manage participation and organizers conduct
            sporting events. Our goal is to make sports administration more
            accessible, organized and transparent through technology.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="bg-blue-50 px-6 py-20">
        <div className="wrap">
          <Eyebrow>Platform Features</Eyebrow>

          <h2 className="max-w-2xl text-3xl font-black text-slate-900 md:text-5xl">
            Everything you need for your sporting journey.
          </h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-blue-100 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5"
              >
                <div className="inline-flex rounded-xl bg-blue-100 p-3 text-blue-600">
                  {feature.icon}
                </div>

                <h3 className="mt-6 text-lg font-bold text-slate-900">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20">
        <div className="wrap">
          <div className="text-center">
            <Eyebrow>Getting Started</Eyebrow>

            <h2 className="text-3xl font-black  md:text-5xl">
              Your journey in three simple steps.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-500">
              Get started with WeKhiladi and discover opportunities to
              participate in sporting events.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border border-slate-200 bg-white p-8 transition hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5"
              >
                <span className="text-5xl font-black text-blue-600/20">
                  {step.number}
                </span>

                <h3 className="mt-5 text-xl font-bold text-slate-900">
                  {step.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Commitment */}
      <section className="bg-[#0B1629] px-6 py-20 text-white">
        <div className="wrap">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <Eyebrow>Our Commitment</Eyebrow>

              <h2 className="text-3xl font-black md:text-5xl">
                Clear processes.
                <span className="block text-blue-400">
                  Better sports experiences.
                </span>
              </h2>

              <p className="mt-6 leading-8 text-white/60">
                We aim to provide clear registration information, transparent
                fee details and accessible support throughout the participation
                process.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {commitments.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-5"
                >
                  <CheckCircle2 className="shrink-0 text-blue-400" size={20} />

                  <span className="text-sm font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Additional Platform Highlights */}
      <section className="px-6 py-20">
        <div className="wrap">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-blue-50 p-7">
              <Target className="text-blue-600" size={32} />
              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Sports Opportunities
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Discover sporting events and opportunities to participate in
                tournaments.
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-7">
              <Award className="text-blue-600" size={32} />
              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Player Recognition
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Build your player profile and showcase your sporting journey.
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-7">
              <Zap className="text-blue-600" size={32} />
              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Digital Experience
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Access registration and tournament information through one
                convenient platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <CTA />

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0B1629] px-6 py-14 text-white">
        <div className="wrap">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <Link to="/home" className="inline-flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white">
                  <Trophy size={24} />
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

              <p className="mt-5 text-sm leading-7 text-slate-400">
                WeKhiladi connects players, teams and organizers through a
                digital platform for sports registration, tournaments and player
                auctions.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold">Quick Links</h3>

              <div className="mt-5 flex flex-col gap-3 text-sm text-slate-400">
                <Link to="/home" className="transition hover:text-blue-400">
                  Home
                </Link>

                <Link
                  to="/tournaments"
                  className="transition hover:text-blue-400"
                >
                  Tournaments
                </Link>

                <Link to="/register" className="transition hover:text-blue-400">
                  Player Registration
                </Link>

                <Link
                  to="/organization/register"
                  className="transition hover:text-blue-400"
                >
                  Organization Registration
                </Link>

                <Link to="/login" className="transition hover:text-blue-400">
                  Login
                </Link>

                <Link to="/contact" className="transition hover:text-blue-400">
                  Contact Us
                </Link>
              </div>
            </div>

            {/* Platform */}
            <div>
              <h3 className="font-bold">Our Platform</h3>

              <div className="mt-5 flex flex-col gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-3">
                  <Users size={17} className="text-blue-400" />
                  Player Management
                </span>

                <span className="flex items-center gap-3">
                  <Trophy size={17} className="text-blue-400" />
                  Tournament Management
                </span>

                <span className="flex items-center gap-3">
                  <Gavel size={17} className="text-blue-400" />
                  Digital Auctions
                </span>

                <span className="flex items-center gap-3">
                  <ShieldCheck size={17} className="text-blue-400" />
                  Transparent Processes
                </span>
              </div>
            </div>

            {/* Associated Organisations */}
            <div>
              <h3 className="font-bold">Associated Organisations</h3>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                WeKhiladi works alongside associated organisations supporting
                sports initiatives and community development.
              </p>

              <div className="mt-5">
                <a
                  href="https://arohanmp.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-blue-400/50 hover:bg-white/10"
                >
                  <p className="font-bold text-blue-400">Arohan</p>

                  <p className="mt-1 text-xs text-slate-400">
                    Associated Organisation
                  </p>

                  <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-amber-400">
                    Visit Website
                    <ArrowRight size={14} />
                  </span>
                </a>
              </div>
            </div>
          </div>

          {/* Legal Policies */}
          <div className="mt-12 border-t border-white/10 pt-8">
            <h3 className="font-bold">Legal & Policies</h3>

            <div className="mt-5 flex flex-wrap gap-x-7 gap-y-4 text-sm text-slate-400">
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

            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-center sm:flex-row sm:text-left">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} WeKhiladi. All rights reserved.
            </p>

            <a
              href="https://wekhiladi.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-blue-400"
            >
              Visit WeKhiladi
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}

import React from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import { Intro } from "./WebsiteLayout";
import { business as B } from "./data";
import Navbar from "./Navbar";

import { useState } from "react";
import { Send, User, MessageSquare, ArrowUpRight } from "lucide-react";

export function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    message: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const subject = "Website Enquiry - Arohan";
    const body = `
Name: ${form.name}
Phone: ${form.phone}

Message:
${form.message}
    `;

    window.location.href = `mailto:${B.email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  };

  const updateField = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-forest outline-none transition placeholder:text-slate-400 focus:border-leaf  focus:ring-4 focus:ring-leaf/10";

  return (
    <section className="relative overflow-hidden bg-transparent p-20">
      <Intro
        tag="Contact"
        title="We're here to help."
        desc="Reach Arohan for solar equipment enquiries, quotations, tournament information or support."
      />
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-sun/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-leaf/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
        {/* Left Content */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-leaf/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-leaf">
            <span className="h-2 w-2 rounded-full bg-leaf" />
            Get in touch
          </span>

          <h2 className="mt-7 text-4xl font-black leading-tight tracking-tight text-forest md:text-6xl">
            Let's start a<span className="block text-leaf">conversation.</span>
          </h2>

          <p className="mt-6 max-w-lg text-base leading-8 text-slate-600">
            Have questions about solar equipment, product enquiries, or
            tournament registrations? Send us a message. Our team will be happy
            to assist you.
          </p>

          {/* Contact details */}
          <div className="mt-10 space-y-5">
            <a
              href={`tel:${B.phone}`}
              className="group flex items-center gap-4"
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl  text-leaf shadow-sm transition group-hover:bg-leaf group-hover:text-white">
                <Phone size={22} />
              </span>
              <span>
                <small className="block text-sm text-slate-500">
                  Call us directly
                </small>
                <strong className="mt-1 block text-lg text-forest">
                  {B.phone}
                </strong>
              </span>
            </a>

            <a
              href={`mailto:${B.email}`}
              className="group flex items-center gap-4"
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl text-leaf shadow-sm transition group-hover:bg-leaf group-hover:text-white">
                <Mail size={22} />
              </span>
              <span>
                <small className="block text-sm text-slate-500">Email us</small>
                <strong className="mt-1 block text-lg text-forest">
                  {B.email}
                </strong>
              </span>
            </a>
          </div>

          {/* Address */}
          <div className="mt-10 rounded-2xl border border-leaf/10  p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-leaf">
              Our location
            </p>
            <p className="mt-2 max-w-sm text-sm leading-7 text-slate-600">
              {B.address}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-[2rem] border border-white  p-6 shadow-[0_25px_80px_rgba(16,42,36,0.10)] sm:p-10">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-leaf">
                  Contact form
                </p>
                <h3 className="mt-2 text-3xl font-black text-forest">
                  Send us a message
                </h3>
              </div>

              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cream text-leaf">
                <Send size={22} />
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Fill in your details and tell us how we can help.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-bold text-forest">
                Full name <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  required
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="Enter your full name"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-bold text-forest">
                Phone number <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  required
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={updateField}
                  placeholder="Enter your phone number"
                  pattern="[0-9+\-\s]{10,15}"
                  title="Enter a valid phone number"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="mb-2 block text-sm font-bold text-forest">
                Your message <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <MessageSquare
                  size={18}
                  className="absolute left-4 top-4 text-slate-400"
                />
                <textarea
                  required
                  name="message"
                  value={form.message}
                  onChange={updateField}
                  rows={5}
                  placeholder="Tell us about your requirements..."
                  className={`${inputClass} resize-none pt-4`}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="group flex w-full items-center justify-center rounded-xl bg-forest px-6 py-4 font-bold text-white shadow-lg shadow-forest/15 transition hover:bg-leaf"
            >
              Send enquiry
              <ArrowUpRight
                size={19}
                className="ml-2 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
              />
            </button>

            <p className="text-center text-xs text-slate-400">
              By submitting, your email application will open with your enquiry.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

export default function Contact() {
  return (
    <>
      <Navbar />

      <ContactForm />
    </>
  );
}

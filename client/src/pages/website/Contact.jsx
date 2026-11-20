import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Trophy,
  Send,
  User,
  MessageSquare,
  ArrowUpRight,
  Building2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import Navbar from "./Navbar";
import { business as B } from "./data";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({
    type: "",
    message: "",
  });

  const updateField = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setStatus({ type: "", message: "" });

    if (!form.email.trim() && !form.phone.trim()) {
      setStatus({
        type: "error",
        message: "Please provide an email address or phone number.",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${API_BASE_URL}/contact`, form, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 15000,
      });

      setStatus({
        type: "success",
        message:
          response.data.message ||
          "Your enquiry has been submitted successfully.",
      });

      setForm(initialForm);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to submit your enquiry. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  return (
    <section className="relative overflow-hidden bg-[#0d192c] px-6 py-20">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="wrap relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
        {/* Left Content */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-600">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Get in touch
          </span>

          <h1 className="mt-7 text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Let's start a
            <span className="block text-blue-600">conversation.</span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-8 text-slate-600">
            Have questions about player registration, tournaments, team
            participation or digital auctions? Contact WeKhiladi. We will be
            happy to assist you.
          </p>

          {/* Contact highlights */}
          <div className="mt-10 space-y-6">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                <Trophy size={24} />
              </span>

              <span>
                <small className="block text-sm text-slate-500">Platform</small>
                <strong className="mt-1 block text-lg">
                  WeKhiladi
                </strong>
              </span>
            </div>

            <a
              href="https://wekhiladi.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4"
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                <ArrowUpRight size={24} />
              </span>

              <span>
                <small className="block text-sm text-slate-500">
                  Official Website
                </small>
                <strong className="mt-1 block text-lg">
                  wekhiladi.in
                </strong>
              </span>
            </a>
          </div>

          {/* Associated Organisations */}
          <div className="mt-10 rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Associated Organisations
            </p>

            <div className="mt-5 space-y-4">
              <a
                href="https://arohanmp.in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl bg-white p-4 transition hover:shadow-md"
              >
                <span>
                  <strong className="block text-[#0B1629]">Arohan</strong>
                  <small className="text-slate-500">
                    Associated Organisation
                  </small>
                </span>

                <ArrowRight size={18} className="text-blue-600" />
              </a>

              <div className="flex items-center justify-between rounded-xl bg-white p-4">
                <span>
                  <strong className="block text-[#0B1629]">
                    Lodheshwar Foundation
                  </strong>
                  <small className="text-slate-500">
                    Associated Organisation
                  </small>
                </span>

                <Building2 size={20} className="text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.08)] sm:p-10">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">
                  Contact Form
                </p>

                <h2 className="mt-2 text-3xl font-black text-[#0B1629]">
                  Send us a message
                </h2>
              </div>

              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-600">
                <Send size={22} />
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Fill in your details and tell us how we can help.
            </p>
          </div>

          {/* Status Message */}
          {status.message && (
            <div
              role="status"
              className={`mb-6 flex items-start gap-3 rounded-xl p-4 text-sm ${
                status.type === "success"
                  ? "border border-green-200 bg-green-50 text-green-700"
                  : "border border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {status.type === "success" ? (
                <CheckCircle2 size={20} className="shrink-0" />
              ) : (
                <AlertCircle size={20} className="shrink-0" />
              )}

              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-bold text-[#0B1629]">
                Full name <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  required
                  minLength={2}
                  maxLength={80}
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="Enter your full name"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-bold text-[#0B1629]">
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="Enter your email address"
                  maxLength={120}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-bold text-[#0B1629]">
                Phone number
              </label>

              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
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

              <p className="mt-2 text-xs text-slate-400">
                Provide at least an email address or phone number.
              </p>
            </div>

            {/* Subject */}
            <div>
              <label className="mb-2 block text-sm font-bold text-[#0B1629]">
                Subject
              </label>

              <div className="relative">
                <MessageSquare
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  name="subject"
                  value={form.subject}
                  onChange={updateField}
                  placeholder="What is your enquiry about?"
                  maxLength={120}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="mb-2 block text-sm font-bold text-[#0B1629]">
                Your message <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <MessageSquare
                  size={18}
                  className="absolute left-4 top-4 text-slate-400"
                />

                <textarea
                  required
                  minLength={10}
                  maxLength={3000}
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
              disabled={loading}
              className="group flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-4 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={19} className="mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Send Enquiry
                  <ArrowUpRight
                    size={19}
                    className="ml-2 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                  />
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-400">
              Your enquiry will be submitted securely to WeKhiladi.
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

      {/* Footer */}
      <footer className="rounded-t-2xl border-t border-white/10 bg-[#0B1629] px-6 py-14 text-white">
        <div className="wrap">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
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
                href="https://wekhiladi.in"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-400 hover:text-blue-300"
              >
                Visit wekhiladi.in
                <ArrowRight size={16} />
              </a>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold">Quick Links</h3>

              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                <Link to="/home" className="hover:text-blue-400">
                  Home
                </Link>
                <Link to="/about" className="hover:text-blue-400">
                  About Us
                </Link>
                <Link to="/contact" className="hover:text-blue-400">
                  Contact Us
                </Link>
                <Link to="/tournaments" className="hover:text-blue-400">
                  Tournaments
                </Link>
                <Link to="/register" className="hover:text-blue-400">
                  Registration
                </Link>
                <Link to="/login" className="hover:text-blue-400">
                  Login
                </Link>
                <Link
                  to="/organization/register"
                  className="hover:text-blue-400"
                >
                  Organization Registration
                </Link>
              </div>
            </div>

            {/* Associated Organisations */}
            <div>
              <h3 className="font-bold">Associated Organisations</h3>

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

            {/* Arohan Business Details */}
            <div>
              <h3 className="font-bold">Arohan Business Information</h3>

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
              </div>
            </div>
          </div>

          {/* Policies */}
          <div className="mt-12 border-t border-white/10 pt-8">
            <h3 className="font-bold">Legal & Policies</h3>

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
              <Link to="/terms-and-conditions" className="hover:text-blue-400">
                Terms & Conditions
              </Link>

              <Link to="/privacy" className="hover:text-blue-400">
                Privacy Policy
              </Link>

              <Link to="/refund-policy" className="hover:text-blue-400">
                Refund & Cancellation Policy
              </Link>

              <Link
                to="/payment-delivery-policy"
                className="hover:text-blue-400"
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

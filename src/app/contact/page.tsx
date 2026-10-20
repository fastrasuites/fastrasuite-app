"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Check,
  X,
  Loader2,
  AlertCircle,
  ClipboardList,
  Mail,
  MessageCircle,
  ExternalLink,
  Copy,
  ArrowLeft,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const EMAIL_ADDRESS = "info@fastrasuite.com";
const SUPPORT_EMAIL = "support@fastrasuite.com";
const WHATSAPP_NUMBER = "+234 808 989 2733";
const WHATSAPP_LINK = "https://wa.me/2348089892733";

const GMAIL_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(EMAIL_ADDRESS)}`;
const OUTLOOK_URL = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(EMAIL_ADDRESS)}`;

export default function ContactPage() {
  const router = useRouter();
  const auth = useSelector((state: RootState) => state.auth);

  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    company_name: "",
    email: "",
    phone_number: "",
    what_are_you_using_today: "",
    preferred_contact_method: "email",
  });

  // Prefill authenticated user info
  useEffect(() => {
    if (auth?.user) {
      const u = auth.user;
      const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username || "";
      setFormData((prev) => ({
        ...prev,
        full_name: prev.full_name || fullName,
        email: prev.email || u.email || "",
        company_name: prev.company_name || (auth as any)?.company?.name || "",
        phone_number: prev.phone_number || (u as any)?.phone || (u as any)?.phone_number || "",
      }));
    }
  }, [auth]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedMethod, setSubmittedMethod] = useState("email");

  // Email routing modal
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Client-side validation
    if (!formData.full_name.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!formData.company_name.trim()) {
      setErrorMsg("Please enter your company name.");
      return;
    }
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!formData.phone_number.trim()) {
      setErrorMsg("Please enter your phone number.");
      return;
    }
    if (!formData.what_are_you_using_today) {
      setErrorMsg("Please select what solution you are currently using.");
      return;
    }

    setIsSubmitting(true);
    const chosenMethod = formData.preferred_contact_method;

    try {
      const response = await fetch("https://www.fastrasuiteapi.com.ng/contact/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errMessage = "Something went wrong while submitting. Please try again.";
        try {
          const errData = await response.json();
          if (errData && typeof errData === "object") {
            const firstKey = Object.keys(errData)[0];
            const firstVal = errData[firstKey];
            if (Array.isArray(firstVal) && firstVal.length > 0) {
              errMessage = `${firstKey.replace(/_/g, " ")}: ${firstVal[0]}`;
            } else if (typeof firstVal === "string") {
              errMessage = firstVal;
            }
          }
        } catch {
          // Ignore JSON parse errors
        }
        throw new Error(errMessage);
      }

      setSubmittedMethod(chosenMethod);
      setShowSuccessModal(true);

      // Reset form
      setFormData({
        full_name: "",
        company_name: "",
        email: "",
        phone_number: "",
        what_are_you_using_today: "",
        preferred_contact_method: "email",
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit request. Please try again or reach us via WhatsApp/Email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL_ADDRESS);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch {
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Top App Bar Navigation */}
      <div className="w-full bg-white border-b border-gray-100 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <span className="text-xs font-semibold text-gray-700">Contact & Support</span>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/settings/billing">
            <Button variant="outline" className="h-8 text-xs font-semibold border-gray-200 text-gray-700 hover:bg-gray-50">
              Billing & Plans
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-[#0c1524] text-white pt-16 pb-16 md:pt-24 md:pb-24 overflow-hidden flex flex-col items-center justify-center text-center px-4 sm:px-6 md:px-12">
        {/* Background Photo Layer */}
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
          <Image
            src="/about_scenario_photo.jpg"
            alt="FastraSuite Support"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1524]/90 via-[#0c1524]/75 to-[#0c1524] pointer-events-none z-0" />

        {/* Content */}
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-4 uppercase tracking-wider">
              Talk to Our Team
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.15] mb-5">
              Prefer a guided walkthrough first?
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed"
          >
            If you&apos;d rather see FastraSuite on your own numbers before diving in, or you&apos;re evaluating custom deployment for a larger enterprise team, tell us a bit about your workflow. We&apos;ll show you exactly where FastraSuite fits.
          </motion.p>
        </div>
      </section>

      {/* Form Section */}
      <section id="contact-form" className="relative z-20 -mt-8 sm:-mt-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 shadow-xl border border-gray-100"
        >
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs sm:text-sm animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="full_name" className="text-xs font-semibold text-gray-700">
                  Full name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#3B7CED] focus:ring-2 focus:ring-[#3B7CED]/20 transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Company Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="company_name" className="text-xs font-semibold text-gray-700">
                  Company name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  required
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="e.g. Acme Construction Ltd"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#3B7CED] focus:ring-2 focus:ring-[#3B7CED]/20 transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Work Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-gray-700">
                  Work email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@company.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#3B7CED] focus:ring-2 focus:ring-[#3B7CED]/20 transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Phone Number */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone_number" className="text-xs font-semibold text-gray-700">
                  Phone number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  required
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+234 801 234 5678"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#3B7CED] focus:ring-2 focus:ring-[#3B7CED]/20 transition-all placeholder:text-gray-400"
                />
              </div>

              {/* What are you using today? */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor="what_are_you_using_today" className="text-xs font-semibold text-gray-700">
                  What are you using today? <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="what_are_you_using_today"
                    name="what_are_you_using_today"
                    required
                    value={formData.what_are_you_using_today}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-[#3B7CED] focus:ring-2 focus:ring-[#3B7CED]/20 transition-all appearance-none cursor-pointer bg-white"
                  >
                    <option value="" disabled className="text-gray-400">
                      Select current solution
                    </option>
                    <option value="Excel / Spreadsheet">Excel / Spreadsheet</option>
                    <option value="Paper & Pen">Paper & Pen</option>
                    <option value="Procore / Other Construction Software">
                      Procore / Other Construction Software
                    </option>
                    <option value="General ERP (NetSuite, etc.)">
                      General ERP (NetSuite, etc.)
                    </option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Preferred contact method */}
            <div className="flex flex-col gap-2.5 pt-2">
              <label className="text-xs font-semibold text-gray-700">
                Preferred contact method
              </label>
              <div className="flex flex-wrap gap-4 sm:gap-8">
                {[
                  { label: "Email", value: "email" },
                  { label: "Phone Call", value: "phone" },
                  { label: "WhatsApp", value: "whatsapp" },
                ].map((method) => (
                  <label key={method.value} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="preferred_contact_method"
                      value={method.value}
                      checked={formData.preferred_contact_method === method.value}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#3B7CED] focus:ring-[#3B7CED] border-gray-300 cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                      {method.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-[#3B7CED] hover:bg-[#2d63c7] text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Inquiry...</span>
                  </>
                ) : (
                  <span>Submit Inquiry</span>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </section>

      {/* Contact Cards Section */}
      <section className="bg-gray-50 border-t border-gray-200/80 py-16 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Other ways to reach us
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Need immediate assistance? Our support team is active across multiple channels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Form */}
            <a
              href="#contact-form"
              className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-7 flex flex-col items-center text-center shadow-2xs hover:shadow-sm hover:border-gray-300 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Online Inquiry</h3>
              <p className="text-xs text-gray-500">Submit the walkthrough form above</p>
            </a>

            {/* Card 2: Email */}
            <div
              onClick={() => setIsEmailModalOpen(true)}
              className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-7 flex flex-col items-center text-center shadow-2xs hover:shadow-sm hover:border-blue-300 hover:bg-blue-50/20 transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#3B7CED] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Email Support</h3>
              <p className="text-xs text-[#3B7CED] font-medium">{EMAIL_ADDRESS}</p>
            </div>

            {/* Card 3: WhatsApp */}
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-7 flex flex-col items-center text-center shadow-2xs hover:shadow-sm hover:border-emerald-300 hover:bg-emerald-50/20 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">WhatsApp Chat</h3>
              <p className="text-xs text-emerald-600 font-medium">{WHATSAPP_NUMBER}</p>
            </a>
          </div>
        </div>
      </section>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative z-10 bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 flex flex-col items-center text-center p-6 sm:p-8"
            >
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-14 h-14 rounded-full bg-blue-50 text-[#3B7CED] flex items-center justify-center mb-4 mt-1">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
                Inquiry Received
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-6">
                Thank you for reaching out. We&apos;ve received your request and will contact you via{" "}
                <span className="font-semibold text-gray-800 capitalize">{submittedMethod}</span> shortly.
              </p>

              <Button
                onClick={() => setShowSuccessModal(false)}
                className="w-full h-11 bg-[#3B7CED] hover:bg-[#2d63c7] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs"
              >
                Done
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Email Routing Modal */}
      <AnimatePresence>
        {isEmailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative z-10 bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 p-6 sm:p-7 flex flex-col"
            >
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3B7CED] flex items-center justify-center">
                  <Mail className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Contact via Email</h3>
                  <p className="text-xs text-gray-500">{EMAIL_ADDRESS}</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 mb-5 mt-2">
                Choose how you&apos;d like to send your email, or copy our address:
              </p>

              <div className="flex flex-col gap-2.5">
                {/* Gmail Web */}
                <a
                  href={GMAIL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">
                      G
                    </div>
                    <div className="text-left">
                      <span className="block text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        Open in Gmail
                      </span>
                      <span className="block text-[11px] text-gray-500">
                        Webmail in new tab
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </a>

                {/* Outlook Web */}
                <a
                  href={OUTLOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                      O
                    </div>
                    <div className="text-left">
                      <span className="block text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        Open in Outlook Web
                      </span>
                      <span className="block text-[11px] text-gray-500">
                        Webmail in new tab
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </a>

                {/* Default Mail App */}
                <a
                  href={`mailto:${EMAIL_ADDRESS}`}
                  onClick={() => setIsEmailModalOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="block text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        Default Email App
                      </span>
                      <span className="block text-[11px] text-gray-500">
                        Apple Mail, Outlook, or system app
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </a>
              </div>

              {/* Copy Email Button */}
              <button
                type="button"
                onClick={handleCopyEmail}
                className="mt-4 w-full py-3 px-4 rounded-xl border border-dashed border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 flex items-center justify-center gap-2 text-xs font-medium text-gray-700 transition-all"
              >
                {emailCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">Email copied to clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-gray-500" />
                    <span>Copy email address ({EMAIL_ADDRESS})</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertTriangle, X, Loader2, ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStatusModal, StatusModal, extractErrorMessage } from "@/components/shared/StatusModal";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import { useGetCompanyQuery } from "@/api/settings/companyApi";
import {
  useGetSubscriptionPlansQuery,
  useGetSubscriptionStatusQuery,
  useSelfServeCheckoutMutation,
  useGetSubscriptionInvoicesQuery,
  useGeneratePaymentLinkMutation,
  useCancelSubscriptionMutation,
  Plan,
} from "@/api/settings/subscriptionApi";

interface PlanFeature {
  text: string;
  isHeader?: boolean;
}

const PLAN_FEATURES: Record<string, PlanFeature[]> = {
  starter: [
    { text: "Up to 3 active projects" },
    { text: "Up to 5 users" },
    { text: "1 warehouse" },
    { text: "Project & budget management" },
    { text: "Budget revisions and project costing" },
    { text: "Material, labour, expense, and other project requests" },
    { text: "Procurement and inventory management" },
    { text: "Material issue and returns" },
    { text: "Client invoicing" },
    { text: "Budget vs Actual and project profitability" },
    { text: "Standard reports" },
    { text: "Email and in-app support" },
  ],
  professional: [
    { text: "Everything in Starter", isHeader: true },
    { text: "Up to 15 active projects" },
    { text: "Up to 25 users" },
    { text: "Up to 3 warehouses" },
    { text: "Advanced approval workflows" },
    { text: "Advanced procurement and inventory" },
    { text: "Labour and equipment costing" },
    { text: "Project cost ledger and cost forecasting" },
    { text: "Advanced Budget vs Actual and profitability" },
    { text: "Advanced reports and dashboards" },
    { text: "Advanced user permissions" },
    { text: "Priority support and guided onboarding" },
  ],
  enterprise: [
    { text: "Everything in Professional", isHeader: true },
    { text: "Unlimited projects" },
    { text: "50+ users" },
    { text: "Multiple warehouses" },
    { text: "Multi-company management" },
    { text: "Custom approval workflows" },
    { text: "Advanced roles and permissions" },
    { text: "Custom reports and dashboards" },
    { text: "API and system integrations" },
    { text: "Advanced data migration" },
    { text: "Custom workflows" },
    { text: "Dedicated onboarding and account management" },
    { text: "Priority technical support" },
    { text: "Enterprise security and audit controls" },
  ],
};

const PLAN_PRICES = {
  starter: {
    monthly: 49000,
    yearly: 490000,
    tagline: "For small contractors managing a few projects",
  },
  professional: {
    monthly: 149000,
    yearly: 1490000,
    tagline: "For growing contractors managing multiple projects",
  },
  enterprise: {
    monthly: 399000,
    yearly: 3990000,
    tagline: "For large contractors and organizations with complex project operations",
  },
};

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<"plan" | "payment">("plan");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly");

  // Modals state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [selectedPlanTier, setSelectedPlanTier] = useState<"starter" | "professional" | "enterprise">("starter");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const statusModal = useStatusModal();

  // Redux auth & company data
  const auth = useSelector((state: RootState) => state.auth);
  const { data: companyData } = useGetCompanyQuery();

  // API hooks
  const { data: subStatus, isLoading: isStatusLoading, refetch: refetchStatus } = useGetSubscriptionStatusQuery();
  const { data: plans = [], isLoading: isPlansLoading } = useGetSubscriptionPlansQuery();
  const { data: invoices = [], isLoading: isInvoicesLoading, refetch: refetchInvoices } = useGetSubscriptionInvoicesQuery();

  const [checkout, { isLoading: isCheckingOut }] = useSelfServeCheckoutMutation();
  const [cancelSub, { isLoading: isCanceling }] = useCancelSubscriptionMutation();
  const [generatePaymentLink, { isLoading: isGeneratingLink }] = useGeneratePaymentLinkMutation();

  // Current Subscription Properties
  const isTrial = subStatus?.status === "trialing" || !subStatus?.plan;
  const currentStatus = subStatus?.status || "trialing";
  const currentPlanTier = subStatus?.plan?.tier || (isTrial ? "trial" : "starter");
  const currentPlanName = isTrial ? "Free Trial" : subStatus?.plan?.name || "Starter";
  const currentInterval = subStatus?.plan?.interval || "monthly";
  const trialDaysRemaining = subStatus?.trial_days_remaining ?? 14;
  const daysToRenewal = subStatus?.days_to_renewal ?? 30;

  // Format dates
  const expiresOrRenewsDate = subStatus?.current_period_end || subStatus?.trial_end || "2026-09-01";
  const formattedExpiry = expiresOrRenewsDate
    ? new Date(expiresOrRenewsDate).toISOString().split("T")[0]
    : "2026-09-01";

  // Helpers for plan actions
  const getPlanByTierAndInterval = (tier: string, interval: "monthly" | "annually"): Plan | undefined => {
    return plans.find((p) => (p.tier === tier || (tier === "starter" && p.tier === "core")) && p.interval === interval);
  };

  const [createdInvoice, setCreatedInvoice] = useState<any>(null);

  const handleOpenPlanModal = (defaultTier?: "starter" | "professional" | "enterprise") => {
    if (defaultTier) setSelectedPlanTier(defaultTier);
    setCreatedInvoice(null);
    setModalStep(1);
    setIsPlanModalOpen(true);
  };

  const handleReviewAndConfirm = async () => {
    const targetPlan = getPlanByTierAndInterval(selectedPlanTier, billingCycle);
    if (!targetPlan) {
      statusModal.showError("Plan Not Found", "The selected plan is currently unavailable.");
      return;
    }

    try {
      const res = await checkout({
        plan_id: targetPlan.id,
        callback_url: window.location.href,
      }).unwrap();

      setCreatedInvoice(res);
      refetchInvoices();
      refetchStatus();
      setModalStep(2);
    } catch (err: any) {
      statusModal.showError("Checkout Failed", extractErrorMessage(err, "Failed to prepare invoice."));
    }
  };

  const handleExecuteCheckout = () => {
    if (createdInvoice?.payment_url) {
      setIsPlanModalOpen(false);
      window.location.href = createdInvoice.payment_url;
    } else {
      statusModal.showError("Payment Failed", "Payment URL is not available. Please try paying from the invoice history table.");
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await cancelSub({ reason: "User requested cancellation via settings" }).unwrap();
      setIsCancelModalOpen(false);
      statusModal.showSuccess("Subscription Canceled", "Your subscription will remain active until the end of your billing period.");
      refetchStatus();
    } catch (err: any) {
      statusModal.showError("Cancellation Failed", extractErrorMessage(err, "Failed to cancel subscription."));
    }
  };

  const handlePayInvoice = async (invoiceId: number, existingPaymentUrl?: string) => {
    if (existingPaymentUrl) {
      window.location.href = existingPaymentUrl;
      return;
    }

    try {
      const res = await generatePaymentLink({
        invoice_id: invoiceId,
        callback_url: window.location.href,
      }).unwrap();

      if (res.payment_url) {
        window.location.href = res.payment_url;
      } else {
        statusModal.showError("Payment Failed", "Payment authorization URL could not be generated.");
      }
    } catch (err: any) {
      statusModal.showError("Payment Failed", extractErrorMessage(err, "Could not generate payment link."));
    }
  };

  const handleDownloadInvoice = (inv: {
    invoice_number?: string;
    plan_name?: string;
    amount?: string | number;
    billing_period?: string;
    issue_date?: string;
    due_date?: string;
    status?: string;
  }) => {
    const invNum =
      inv.invoice_number ||
      (createdInvoice?.invoice_number
        ? createdInvoice.invoice_number
        : invoices[0]
        ? `INV-${String(invoices[0].id).padStart(6, "0")}`
        : "INV-000001");
    const invPlan =
      inv.plan_name ||
      `${selectedPlanTier.charAt(0).toUpperCase() + selectedPlanTier.slice(1)} Plan`;
    const invAmt = Number(inv.amount) || modalSelectedPrice || 49000;
    const invIssue = inv.issue_date || formattedToday;
    const invDue = inv.due_date || formattedToday;
    const invPeriod = inv.billing_period || billingPeriodString;
    const teamName = auth?.tenant_company_name || "Workspace";
    const userEmail = auth?.user?.email || "support@fastrasuite.com";
    const companyAddress = companyData?.street_address || "123, Lagos st";
    const companyCity = companyData?.city || "Lagos";
    const companyCountry = companyData?.country || "Nigeria";

    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${invNum}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      margin: 0;
      padding: 24px;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .title { font-size: 32px; font-weight: 800; color: #111827; margin: 0; }
    .logo-container { display: flex; align-items: center; gap: 10px; }
    .logo-bars { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .bar-blue { width: 32px; height: 6px; background: #3B7CED; border-radius: 9999px; }
    .bar-green { width: 24px; height: 6px; background: #10B981; border-radius: 9999px; }
    .bar-red { width: 14px; height: 6px; background: #EF4444; border-radius: 9999px; }
    .logo-text { font-size: 20px; font-weight: 900; line-height: 1; color: #111827; }
    .logo-sub { font-size: 11px; font-weight: 700; color: #3B7CED; letter-spacing: 0.05em; }

    .meta-grid { display: grid; grid-template-columns: 140px 1fr; gap: 6px; font-size: 12px; margin-bottom: 24px; }
    .meta-label { font-weight: 600; color: #374151; }
    .meta-val { font-weight: 500; color: #111827; }

    .addr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; font-size: 12px; line-height: 1.5; color: #4B5563; margin-bottom: 28px; border-top: 1px solid #E5E7EB; padding-top: 18px; }
    .addr-heading { font-weight: 700; color: #111827; margin-bottom: 4px; }

    .amount-due-banner { margin-bottom: 28px; }
    .amount-heading { font-size: 24px; font-weight: 800; color: #111827; margin: 0 0 4px 0; }
    .amount-sub { font-size: 12px; color: #6B7280; margin: 0; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { text-align: left; font-size: 12px; font-weight: 600; color: #6B7280; padding-bottom: 10px; border-bottom: 1px solid #E5E7EB; }
    td { font-size: 12px; padding: 14px 0; border-bottom: 1px solid #F3F4F6; color: #1F2937; }
    .text-right { text-align: right; }

    .totals { width: 260px; margin-left: auto; font-size: 12px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; color: #4B5563; }
    .totals-row.final { font-size: 14px; font-weight: 800; color: #111827; border-top: 1px solid #E5E7EB; padding-top: 10px; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">Invoice</h1>
    <div class="logo-container">
      <div class="logo-bars">
        <div class="bar-blue"></div>
        <div class="bar-green"></div>
        <div class="bar-red"></div>
      </div>
      <div>
        <div class="logo-text">fastra</div>
        <div class="logo-sub">suite</div>
      </div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-label">Invoice number</div>
    <div class="meta-val">${invNum}</div>
    <div class="meta-label">Date of issue</div>
    <div class="meta-val">${invIssue}</div>
    <div class="meta-label">Date due</div>
    <div class="meta-val">${invDue}</div>
    <div class="meta-label">Billing period</div>
    <div class="meta-val">${invPeriod}</div>
    <div class="meta-label">Team name</div>
    <div class="meta-val">${teamName}</div>
  </div>

  <div class="addr-grid">
    <div>
      <div class="addr-heading">Fastra Suite, Inc</div>
      <div>123, Lagos st</div>
      <div>Lagos st</div>
      <div>Nigeria</div>
      <div>support@Fastra.com</div>
    </div>
    <div>
      <div class="addr-heading">Bill to</div>
      <div>${teamName}</div>
      <div>${companyAddress}</div>
      <div>${companyCity}, ${companyCountry}</div>
      <div>${userEmail}</div>
    </div>
  </div>

  <div class="amount-due-banner">
    <h2 class="amount-heading">&#8358;${invAmt.toLocaleString()} due ${invDue}</h2>
    <p class="amount-sub">Fastra ${invPeriod}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 50%;">Description</th>
        <th class="text-right" style="width: 15%;">Qty</th>
        <th class="text-right" style="width: 17%;">Unit price</th>
        <th class="text-right" style="width: 18%;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div style="font-weight: 600; color: #111827;">${invPlan} (${invPeriod})</div>
          <div style="font-size: 11px; color: #6B7280; margin-top: 2px;">FastraSuite Subscription & Entitlements</div>
        </td>
        <td class="text-right">1</td>
        <td class="text-right">&#8358;${invAmt.toLocaleString()}</td>
        <td class="text-right">&#8358;${invAmt.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal</span>
      <span>&#8358;${invAmt.toLocaleString()}</span>
    </div>
    <div class="totals-row">
      <span>Total</span>
      <span>&#8358;${invAmt.toLocaleString()}</span>
    </div>
    <div class="totals-row final">
      <span>Amount due</span>
      <span>&#8358;${invAmt.toLocaleString()}</span>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`);
    printWindow.document.close();
  };

  const tierOrder = { trial: 0, core: 1, starter: 1, professional: 2, enterprise: 3 };

  // Invoice dynamic details for A4 sheet
  const today = new Date();
  const formattedToday = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const periodEndDate = new Date(
    Date.now() + (billingCycle === "annually" ? 365 : 30) * 24 * 60 * 60 * 1000
  );
  const formattedPeriodEnd = periodEndDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedPeriodStart = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const billingPeriodString = `${formattedPeriodStart} - ${formattedPeriodEnd}`;
  const modalSelectedPrice =
    billingCycle === "monthly"
      ? PLAN_PRICES[selectedPlanTier].monthly
      : PLAN_PRICES[selectedPlanTier].yearly;
  const maxInvoiceId = invoices.reduce((max, inv) => (inv.id > max ? inv.id : max), 0);
  const nextInvoiceNumber =
    createdInvoice?.invoice_number || `INV-${String(maxInvoiceId + 1).padStart(6, "0")}`;

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F8F9FA] pb-24">
      {/* Sub Tab Header */}
      <div className="bg-white border-b border-gray-200 px-8 pt-4">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("plan")}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "plan"
                ? "border-[#3B7CED] text-[#3B7CED] font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Plan & Billing
          </button>
          <button
            onClick={() => setActiveTab("payment")}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "payment"
                ? "border-[#3B7CED] text-[#3B7CED] font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Payment
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-8 py-8 space-y-8">
        {/* TAB 1: PLAN & BILLING */}
        {activeTab === "plan" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Top Card: Current Plan Banner */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-2xs space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Current Plan: {currentPlanName}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {isTrial
                      ? `${trialDaysRemaining} days remaining · Expires ${formattedExpiry}`
                      : currentStatus === "expired"
                      ? `${currentInterval === "annually" ? "Annual" : "Monthly"} · Expired (${formattedExpiry})`
                      : currentStatus === "past_due"
                      ? `${currentInterval === "annually" ? "Annual" : "Monthly"} · Past Due (${formattedExpiry})`
                      : `${currentInterval === "annually" ? "Annual" : "Monthly"} · ${
                          daysToRenewal === 0 ? "Due Today" : `Renews ${formattedExpiry}`
                        }`}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                    currentStatus === "active"
                      ? "bg-green-100 text-green-700"
                      : currentStatus === "past_due"
                      ? "bg-amber-100 text-amber-800"
                      : currentStatus === "expired"
                      ? "bg-red-100 text-red-700"
                      : currentStatus === "canceled"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-blue-50 text-[#3B7CED]"
                  }`}
                >
                  {currentStatus === "trialing" ? "Trial" : currentStatus.replace("_", " ")}
                </span>
              </div>

              {/* Status Alert Banner */}
              {isTrial ? (
                <div className="bg-[#EEF4FF] border border-[#C7DBFE] rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Free trial — {trialDaysRemaining} days remaining
                    </h4>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Trial expires {formattedExpiry}. Subscribe to continue without interruption.
                    </p>
                  </div>
                  <Button
                    onClick={() => handleOpenPlanModal("starter")}
                    className="bg-white hover:bg-gray-50 text-[#3B7CED] border border-[#3B7CED] text-xs font-medium h-9 shadow-2xs"
                  >
                    Subscribe
                  </Button>
                </div>
              ) : currentStatus === "past_due" ? (
                <div className="bg-[#FFF8E6] border border-[#FDE68A] rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">
                      Subscription Past Due — please pay invoice
                    </h4>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Your subscription is past due. Pay now to avoid interruption.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      const pendingInv = invoices.find(
                        (inv) => inv.status === "pending" || inv.status === "overdue"
                      );
                      if (pendingInv) {
                        handlePayInvoice(pendingInv.id, pendingInv.payment_url);
                      } else {
                        setActiveTab("payment");
                      }
                    }}
                    className="bg-white hover:bg-amber-50 text-amber-900 border border-amber-400 text-xs font-medium h-9 shadow-2xs"
                  >
                    Pay Now
                  </Button>
                </div>
              ) : currentStatus === "expired" ? (
                <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-red-900">
                      Plan Expired
                    </h4>
                    <p className="text-xs text-red-700 mt-0.5">
                      Your subscription is expired. Renew now to reactivate.
                    </p>
                  </div>
                  <Button
                    onClick={() => handleOpenPlanModal("starter")}
                    className="bg-white hover:bg-red-50 text-red-700 border border-red-400 text-xs font-medium h-9 shadow-2xs"
                  >
                    Renew
                  </Button>
                </div>
              ) : null}
            </div>

            {/* Metrics 4-Column Bar */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <span className="text-xs text-gray-500 font-medium block mb-2">Subscription Status</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${
                    currentStatus === "active"
                      ? "bg-green-100 text-green-700"
                      : currentStatus === "past_due"
                      ? "bg-amber-100 text-amber-800"
                      : currentStatus === "expired"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-50 text-[#3B7CED]"
                  }`}
                >
                  {currentStatus === "trialing" ? "Trial" : currentStatus.replace("_", " ")}
                </span>
              </div>
              <div className="lg:border-l lg:border-gray-100 lg:pl-6">
                <span className="text-xs text-gray-500 font-medium block mb-1">Current Plan</span>
                <span className="text-base font-bold text-gray-900">{currentPlanName}</span>
              </div>
              <div className="lg:border-l lg:border-gray-100 lg:pl-6">
                <span className="text-xs text-gray-500 font-medium block mb-1">Billing Cycle</span>
                <span className="text-base font-bold text-gray-900">
                  {currentInterval === "annually" ? "Annual" : "Monthly"}
                </span>
              </div>
              <div className="lg:border-l lg:border-gray-100 lg:pl-6">
                <span className="text-xs text-gray-500 font-medium block mb-1">Next Charge</span>
                <span className="text-base font-bold text-gray-900">
                  {isTrial
                    ? "-"
                    : `₦${(Number(subStatus?.plan?.amount) || 49000).toLocaleString()}/${
                        currentInterval === "annually" ? "yr" : "mo"
                      }`}
                </span>
                {!isTrial && (
                  <span className={`text-xs block mt-0.5 ${currentStatus === "expired" ? "text-red-600 font-semibold" : currentStatus === "past_due" ? "text-amber-600 font-semibold" : daysToRenewal === 0 ? "text-amber-600 font-semibold" : "text-gray-400"}`}>
                    {currentStatus === "expired" ? `Expired (${formattedExpiry})` : currentStatus === "past_due" ? `Past Due (${formattedExpiry})` : daysToRenewal === 0 ? "Due Today" : `Renews ${formattedExpiry}`}
                  </span>
                )}
              </div>
            </div>

            {/* Available Plans Section */}
            <div className="space-y-6 pt-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-lg font-bold text-gray-900">Available Plans</h2>

                {/* Monthly / Yearly Toggle */}
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200">
                  <span
                    className={`text-xs font-semibold cursor-pointer ${
                      billingCycle === "monthly" ? "text-[#3B7CED]" : "text-gray-400"
                    }`}
                    onClick={() => setBillingCycle("monthly")}
                  >
                    Monthly
                  </span>
                  <button
                    type="button"
                    onClick={() => setBillingCycle(billingCycle === "monthly" ? "annually" : "monthly")}
                    className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      billingCycle === "annually" ? "bg-[#3B7CED]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        billingCycle === "annually" ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span
                    className={`text-xs font-semibold cursor-pointer ${
                      billingCycle === "annually" ? "text-[#3B7CED]" : "text-gray-400"
                    }`}
                    onClick={() => setBillingCycle("annually")}
                  >
                    Yearly
                  </span>
                </div>
              </div>

              {/* 3 Pricing Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {(["starter", "professional", "enterprise"] as const).map((tier) => {
                  const isCurrent = !isTrial && currentPlanTier === tier;
                  const isMostPopular = tier === "professional";
                  const priceInfo = PLAN_PRICES[tier];
                  const price = billingCycle === "monthly" ? priceInfo.monthly : priceInfo.yearly;
                  const unitText = billingCycle === "monthly" ? "/month" : "/year";
                  const features = PLAN_FEATURES[tier];

                  const currentRank = tierOrder[currentPlanTier as keyof typeof tierOrder] || 0;
                  const thisRank = tierOrder[tier];
                  const buttonText = isCurrent
                    ? "Current Plan"
                    : isTrial || thisRank > currentRank
                    ? "Upgrade"
                    : "Downgrade";

                  return (
                    <div
                      key={tier}
                      className={`bg-white rounded-2xl p-7 flex flex-col justify-between relative transition-all duration-200 ${
                        isCurrent
                          ? "border-2 border-[#3B7CED] shadow-sm"
                          : isMostPopular
                          ? "border border-gray-200 shadow-sm"
                          : "border border-gray-100 shadow-2xs"
                      }`}
                    >
                      {isMostPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#708090] text-white text-[11px] font-semibold px-3 py-0.5 rounded-full shadow-2xs uppercase tracking-wide">
                          Most Popular
                        </div>
                      )}

                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 capitalize">{tier}</h3>
                          <p className="text-xs text-gray-500 mt-1 min-h-[32px]">{priceInfo.tagline}</p>
                        </div>

                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-extrabold text-gray-900">
                              ₦{price.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">{unitText}</span>
                          </div>
                        </div>

                        <div className="space-y-3 border-t border-gray-100 pt-5">
                          {features.map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-2.5">
                              <div className="mt-0.5 rounded-full bg-emerald-500 text-white p-0.5 flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                              <span
                                className={`text-xs ${
                                  feat.isHeader ? "font-bold text-gray-900" : "text-gray-700"
                                }`}
                              >
                                {feat.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-8">
                        <Button
                          disabled={isCurrent}
                          onClick={() => handleOpenPlanModal(tier)}
                          className={`w-full h-11 text-xs font-semibold rounded-lg transition-all ${
                            isCurrent
                              ? "bg-slate-400 text-white cursor-default"
                              : "bg-[#3B7CED] hover:bg-[#2d63c7] text-white shadow-2xs"
                          }`}
                        >
                          {buttonText}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: PAYMENT */}
        {activeTab === "payment" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Payment Tab Subscription Summary */}
            {isTrial ? (
              /* Free Trial State */
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-2xs space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Current Plan: Free Trial</h1>
                    <p className="text-sm text-gray-500 mt-1">
                      {trialDaysRemaining} days remaining · Expires {formattedExpiry}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleOpenPlanModal("starter")}
                    className="bg-white hover:bg-gray-50 text-[#3B7CED] border border-[#3B7CED] text-xs font-semibold h-10 px-5 shadow-2xs"
                  >
                    Choose a Subscription Plan
                  </Button>
                </div>

                <div className="bg-[#EEF4FF] border border-[#C7DBFE] rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Free trial — {trialDaysRemaining} days remaining
                    </h4>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Trial expires {formattedExpiry}. Subscribe to continue without interruption.
                    </p>
                  </div>
                  <Button
                    onClick={() => handleOpenPlanModal("starter")}
                    className="bg-white hover:bg-gray-50 text-[#3B7CED] border border-[#3B7CED] text-xs font-medium h-9 shadow-2xs"
                  >
                    Subscribe
                  </Button>
                </div>
              </div>
            ) : (
              /* Active Subscription State */
              <div className="bg-white rounded-xl border border-gray-100 p-7 shadow-2xs space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      FastraSuite {currentPlanName}
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                      {currentInterval === "annually" ? "Annual Billing" : "Monthly Billing"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                      currentStatus === "active"
                        ? "bg-green-100 text-green-700"
                        : currentStatus === "past_due"
                        ? "bg-amber-100 text-amber-800"
                        : currentStatus === "expired"
                        ? "bg-red-100 text-red-700"
                        : currentStatus === "canceled"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-blue-50 text-[#3B7CED]"
                    }`}
                  >
                    {currentStatus === "trialing" ? "Trial" : currentStatus.replace("_", " ")}
                  </span>
                </div>

                {/* 4 Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2 pb-2">
                  <div>
                    <span className="text-xs text-gray-400 font-medium block mb-1">Billing Period</span>
                    <span className="text-sm font-bold text-gray-900">
                      {subStatus?.current_period_start || "15 May 2026"} – {subStatus?.current_period_end || "15 May 2027"}
                    </span>
                  </div>
                  <div className="lg:border-l lg:border-gray-100 lg:pl-6">
                    <span className="text-xs text-gray-400 font-medium block mb-1">Next Renewal</span>
                    <span className={`text-sm font-bold ${currentStatus === "expired" ? "text-red-600 font-bold" : currentStatus === "past_due" ? "text-amber-600 font-bold" : "text-gray-900"}`}>
                      {currentStatus === "expired" ? `Expired (${formattedExpiry})` : currentStatus === "past_due" ? `Overdue (${formattedExpiry})` : daysToRenewal === 0 ? "Due Today" : formattedExpiry}
                    </span>
                  </div>
                  <div className="lg:border-l lg:border-gray-100 lg:pl-6">
                    <span className="text-xs text-gray-400 font-medium block mb-1">
                      {currentInterval === "annually" ? "Annual Amount" : "Monthly Amount"}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      ₦{(Number(subStatus?.plan?.amount) || 49000).toLocaleString()}
                    </span>
                  </div>
                  <div className="lg:border-l lg:border-gray-100 lg:pl-6">
                    <span className="text-xs text-gray-400 font-medium block mb-1">Days to Renewal</span>
                    <span className={`text-sm font-bold ${currentStatus === "expired" ? "text-red-600 font-extrabold" : currentStatus === "past_due" ? "text-amber-600 font-extrabold" : daysToRenewal === 0 ? "text-amber-600 font-extrabold" : "text-gray-900"}`}>
                      {currentStatus === "expired" ? "Expired" : currentStatus === "past_due" ? "Past Due" : daysToRenewal === 0 ? "Due today" : `${daysToRenewal} days`}
                    </span>
                  </div>
                </div>

                {/* Included Features Grid */}
                <div className="border-t border-gray-100 pt-6 space-y-3">
                  <h4 className="text-xs font-bold text-gray-900">
                    Included in {currentPlanName}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-6">
                    {(PLAN_FEATURES[currentPlanTier as keyof typeof PLAN_FEATURES] || PLAN_FEATURES.starter)
                      .slice(0, 6)
                      .map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="rounded-full bg-emerald-500 text-white p-0.5 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span className="text-xs text-gray-700">{feat.text}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t border-gray-100 pt-6 flex justify-end gap-3">
                  {(daysToRenewal === 0 || currentStatus === "past_due" || currentStatus === "expired") && (
                    <Button
                      onClick={() => {
                        const pendingInv = invoices.find(
                          (inv) => inv.status === "pending" || inv.status === "overdue"
                        );
                        if (pendingInv) {
                          handlePayInvoice(pendingInv.id, pendingInv.payment_url);
                        } else {
                          handleOpenPlanModal(selectedPlanTier);
                        }
                      }}
                      className="bg-[#3B7CED] hover:bg-[#2d63c7] text-white text-xs font-semibold h-9 px-4 shadow-xs"
                    >
                      Renew Now
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleOpenPlanModal()}
                    className="border-[#3B7CED] text-[#3B7CED] hover:bg-blue-50 text-xs font-medium h-9 px-4"
                  >
                    Change Plan
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCancelModalOpen(true)}
                    className="border-red-300 text-red-600 hover:bg-red-50 text-xs font-medium h-9 px-4"
                  >
                    Cancel Subscription
                  </Button>
                </div>
              </div>
            )}

            {/* Invoice History Table */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-[#3B7CED]">Invoice History</h2>

              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8F9FA] border-b border-gray-100 text-gray-500 font-semibold">
                      <tr>
                        <th className="py-3 px-5">Invoice Number</th>
                        <th className="py-3 px-5">Plan</th>
                        <th className="py-3 px-5">Billing Date</th>
                        <th className="py-3 px-5">Due Date</th>
                        <th className="py-3 px-5">Amount</th>
                        <th className="py-3 px-5 text-center">Status</th>
                        <th className="py-3 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoices.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-400">
                            No billing invoice records found.
                          </td>
                        </tr>
                      ) : (
                        invoices.map((inv) => {
                          const isPending = inv.status === "pending";
                          const isPaid = inv.status === "paid";

                          return (
                            <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                              <td className="py-4 px-5 font-semibold text-gray-800">
                                {inv.invoice_number || `INV-${String(inv.id).padStart(6, "0")}`}
                              </td>
                              <td className="py-4 px-5 text-gray-700">
                                {inv.plan?.name || "Standard Plan"}
                              </td>
                              <td className="py-4 px-5 text-gray-600">{inv.period_start}</td>
                              <td className="py-4 px-5 text-gray-600">{inv.due_date}</td>
                              <td className="py-4 px-5 font-bold text-gray-900">
                                ₦{Number(inv.amount).toLocaleString()}
                              </td>
                              <td className="py-4 px-5 text-center">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                                    isPaid
                                      ? "bg-emerald-100 text-emerald-700"
                                      : isPending
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {inv.status}
                                </span>
                              </td>
                              <td className="py-4 px-5 text-right">
                                <div className="flex items-center justify-end gap-2.5">
                                  {isPending ? (
                                    <Button
                                      size="sm"
                                      onClick={() => handlePayInvoice(inv.id, inv.payment_url)}
                                      disabled={isGeneratingLink}
                                      className="bg-[#3B7CED] hover:bg-[#2d63c7] text-white text-xs h-7 px-3"
                                    >
                                      Pay Now
                                    </Button>
                                  ) : inv.payment_url ? (
                                    <a
                                      href={inv.payment_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[#3B7CED] hover:underline font-medium text-xs"
                                    >
                                      View Receipt
                                    </a>
                                  ) : null}

                                  <button
                                    onClick={() =>
                                      handleDownloadInvoice({
                                        invoice_number:
                                          inv.invoice_number || `INV-${String(inv.id).padStart(6, "0")}`,
                                        plan_name: inv.plan?.name || "FastraSuite Plan",
                                        amount: inv.amount,
                                        billing_period: `${inv.period_start} - ${inv.period_end}`,
                                        issue_date: inv.period_start,
                                        due_date: inv.due_date,
                                        status: inv.status,
                                      })
                                    }
                                    className="p-1 text-gray-400 hover:text-[#3B7CED] hover:bg-gray-100 rounded transition-colors"
                                    title="Download Invoice PDF"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* MODAL: CHOOSE PLAN & CONFIRM SUBSCRIPTION (A4 INVOICE SHEET IN STEP 2) */}
      <AnimatePresence>
        {isPlanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className={`bg-white rounded-2xl w-full ${
                modalStep === 2 ? "max-w-3xl" : "max-w-4xl"
              } p-6 sm:p-8 shadow-2xl relative my-8`}
            >
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* STEP 1: CHOOSE YOUR PLAN */}
              {modalStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Choose your plan</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Select the FastraSuite plan that fits your organisation.
                    </p>
                  </div>

                  {/* Monthly / Yearly Toggle in Modal */}
                  <div className="flex justify-center items-center gap-3">
                    <span
                      className={`text-xs font-semibold cursor-pointer ${
                        billingCycle === "monthly" ? "text-[#3B7CED]" : "text-gray-400"
                      }`}
                      onClick={() => setBillingCycle("monthly")}
                    >
                      Monthly
                    </span>
                    <button
                      type="button"
                      onClick={() => setBillingCycle(billingCycle === "monthly" ? "annually" : "monthly")}
                      className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        billingCycle === "annually" ? "bg-[#3B7CED]" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          billingCycle === "annually" ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span
                      className={`text-xs font-semibold cursor-pointer ${
                        billingCycle === "annually" ? "text-[#3B7CED]" : "text-gray-400"
                      }`}
                      onClick={() => setBillingCycle("annually")}
                    >
                      Yearly
                    </span>
                  </div>

                  {/* 3 Modal Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[58vh] overflow-y-auto pt-4 pb-2 px-1">
                    {(["starter", "professional", "enterprise"] as const).map((tier) => {
                      const isSelected = selectedPlanTier === tier;
                      const isMostPopular = tier === "professional";
                      const priceInfo = PLAN_PRICES[tier];
                      const price = billingCycle === "monthly" ? priceInfo.monthly : priceInfo.yearly;
                      const unitText = billingCycle === "monthly" ? "/month" : "/year";
                      const features = PLAN_FEATURES[tier];

                      return (
                        <div
                          key={tier}
                          onClick={() => setSelectedPlanTier(tier)}
                          className={`rounded-xl p-5 border cursor-pointer transition-all relative flex flex-col justify-between ${
                            isSelected
                              ? "border-2 border-[#3B7CED] bg-[#F7FAFF] shadow-xs"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          {isMostPopular && (
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#708090] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                              Most Popular
                            </div>
                          )}

                          <div className="space-y-4">
                            <div>
                              <h3 className="text-base font-bold text-gray-900 capitalize">{tier}</h3>
                              <p className="text-[11px] text-gray-500 mt-0.5 min-h-[30px]">{priceInfo.tagline}</p>
                            </div>

                            <div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-extrabold text-gray-900">
                                  ₦{price.toLocaleString()}
                                </span>
                                <span className="text-[11px] text-gray-500 font-medium">{unitText}</span>
                              </div>
                            </div>

                            <div className="space-y-2 border-t border-gray-100 pt-3">
                              {features.map((feat, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <div className="mt-0.5 rounded-full bg-emerald-500 text-white p-0.5 flex items-center justify-center flex-shrink-0">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  </div>
                                  <span
                                    className={`text-[11px] ${
                                      feat.isHeader ? "font-bold text-gray-900" : "text-gray-600"
                                    }`}
                                  >
                                    {feat.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Step Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-[#3B7CED] text-white flex items-center justify-center text-[10px]">
                        1
                      </span>
                      <span>Choose your plan</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                      <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px]">
                        2
                      </span>
                      <span className="text-gray-400 font-medium">Invoice Summary</span>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setIsPlanModalOpen(false)}
                        className="text-xs h-9 px-4 border-gray-200"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleReviewAndConfirm}
                        disabled={isCheckingOut}
                        className="bg-[#3B7CED] hover:bg-[#2d63c7] text-white text-xs h-9 px-5 font-semibold flex items-center gap-2"
                      >
                        {isCheckingOut ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Preparing Invoice...
                          </>
                        ) : (
                          "Review & Confirm"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: A4 INVOICE SHEET (MATCHING A4 - 2.PNG) */}
              {modalStep === 2 && (
                <div className="space-y-6">
                  {/* A4 Document Card */}
                  <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-10 shadow-sm font-sans space-y-8 max-w-[720px] mx-auto text-gray-900">
                    {/* Invoice Top Header */}
                    <div className="flex justify-between items-start">
                      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Invoice</h1>
                      <div className="flex items-center gap-2.5">
                        <div className="flex flex-col gap-1 items-end">
                          <div className="w-8 h-1.5 bg-[#3B7CED] rounded-full" />
                          <div className="w-6 h-1.5 bg-[#10B981] rounded-full" />
                          <div className="w-3.5 h-1.5 bg-[#EF4444] rounded-full" />
                        </div>
                        <div className="flex flex-col leading-none">
                          <span className="text-xl font-black text-gray-900 tracking-tight">fastra</span>
                          <span className="text-xs font-bold text-[#3B7CED] tracking-wider">suite</span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata & Billing Addresses */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-[130px_1fr] text-xs gap-y-1.5">
                        <span className="font-semibold text-gray-900">Invoice number</span>
                        <span className="text-gray-900 uppercase font-medium">{nextInvoiceNumber}</span>

                        <span className="font-semibold text-gray-900">Date of issue</span>
                        <span className="text-gray-900 font-medium">{formattedToday}</span>

                        <span className="font-semibold text-gray-900">Date due</span>
                        <span className="text-gray-900 font-medium">{formattedToday}</span>

                        <span className="font-semibold text-gray-900">Billing period</span>
                        <span className="text-gray-900 font-medium">{billingPeriodString}</span>

                        <span className="font-semibold text-gray-900">Team name</span>
                        <span className="text-gray-900 font-medium">
                          {auth?.tenant_company_name || "Workspace"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-2 text-xs text-gray-800 leading-relaxed">
                        <div>
                          <p className="font-bold text-gray-900">Fastra Suite, Inc</p>
                          <p>123, Lagos st</p>
                          <p>123, Lagos st</p>
                          <p>Lagos st</p>
                          <p>Nigeria</p>
                          <p>support@Fastra.com</p>
                        </div>

                        <div>
                          <p className="font-bold text-gray-900 mb-0.5">Bill to</p>
                          <p className="font-medium text-gray-900">
                            {auth?.tenant_company_name || "WorkAll"}
                          </p>
                          <p>{companyData?.street_address || "234, Abuja st"}</p>
                          <p>{companyData?.city || "Abuja st"}</p>
                          <p>{companyData?.country || "Nigeria"}</p>
                          <p>{auth?.user?.email || "support@workall.com"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Big Amount Due Banner */}
                    <div className="pt-2">
                      <h2 className="text-2xl font-bold text-gray-900">
                        ₦{modalSelectedPrice.toLocaleString()} due {formattedToday}
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">
                        Fastra {billingPeriodString}
                      </p>
                    </div>

                    {/* Items Table */}
                    <div className="space-y-4 pt-2">
                      <div className="border-b border-gray-300 pb-2 flex justify-between text-xs text-gray-500 font-medium">
                        <span className="w-1/2">Description</span>
                        <span className="w-16 text-center">Qty</span>
                        <span className="w-28 text-right">Unit price</span>
                        <span className="w-28 text-right">Amount</span>
                      </div>

                      <div className="flex justify-between text-xs text-gray-900 py-1">
                        <span className="w-1/2 font-medium capitalize">
                          {selectedPlanTier} Plan ({billingCycle === "annually" ? "1 year" : "1 month"} subscription)
                        </span>
                        <span className="w-16 text-center">1</span>
                        <span className="w-28 text-right font-medium">
                          ₦{modalSelectedPrice.toLocaleString()}
                        </span>
                        <span className="w-28 text-right font-medium">
                          ₦{modalSelectedPrice.toLocaleString()}
                        </span>
                      </div>

                      {/* Totals Right Aligned */}
                      <div className="pt-4 flex flex-col items-end gap-2 text-xs">
                        <div className="flex justify-between w-64 text-gray-700">
                          <span className="font-medium">Subtotal</span>
                          <span className="font-medium">₦{modalSelectedPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between w-64 text-gray-700">
                          <span className="font-medium">Total</span>
                          <span className="font-medium">₦{modalSelectedPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between w-64 pt-2 border-t border-gray-200 text-gray-900 font-extrabold text-sm">
                          <span>Amount due</span>
                          <span>₦{modalSelectedPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 Actions Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                      <span className="text-gray-500">Choose your plan</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                      <span className="w-5 h-5 rounded-full bg-[#3B7CED] text-white flex items-center justify-center text-[10px]">
                        2
                      </span>
                      <span className="text-[#3B7CED] font-bold">Invoice Summary</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleDownloadInvoice({
                            invoice_number: nextInvoiceNumber,
                            plan_name: `${selectedPlanTier.charAt(0).toUpperCase() + selectedPlanTier.slice(1)} Plan`,
                            amount: modalSelectedPrice,
                            billing_period: billingPeriodString,
                            due_date: formattedToday,
                            issue_date: formattedToday,
                          })
                        }
                        className="text-xs h-9 px-3.5 border-gray-200 text-gray-700 hover:text-[#3B7CED] hover:bg-gray-50 flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Invoice
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setModalStep(1)}
                        className="text-xs h-9 px-4 border-gray-200"
                        disabled={isCheckingOut}
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleExecuteCheckout}
                        disabled={isCheckingOut}
                        className="bg-[#3B7CED] hover:bg-[#2d63c7] text-white text-xs h-9 px-5 font-semibold flex items-center gap-2"
                      >
                        {isCheckingOut ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Confirm & Pay Now"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: CANCEL SUBSCRIPTION (DEACTIVATE.PNG) */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative space-y-6"
            >
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900">Cancel subscription?</h3>
                <p className="text-xs text-gray-500">This action cannot be undone easily.</p>
                <p className="text-xs text-gray-600 leading-relaxed pt-1">
                  Your {currentPlanName} subscription will remain active until{" "}
                  <span className="font-bold text-gray-900">{formattedExpiry}</span>. After that date, your account will revert to limited access.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCancelModalOpen(false)}
                  disabled={isCanceling}
                  className="flex-1 border-[#3B7CED] text-[#3B7CED] hover:bg-blue-50 text-xs font-semibold h-10"
                >
                  Keep Subscription
                </Button>
                <Button
                  onClick={handleCancelSubscription}
                  disabled={isCanceling}
                  className="flex-1 bg-[#3B7CED] hover:bg-[#2d63c7] text-white text-xs font-semibold h-10"
                >
                  {isCanceling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Cancel"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={statusModal.close}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
      />
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  useGetCompanyQuery,
  useUpdateCompanyMutation,
} from "@/api/settings/companyApi";
import { FaPlusCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { LoadingDots } from "@/components/shared/LoadingComponents";
import StatusModal, { useStatusModal } from "@/components/shared/StatusModal";
import { extractErrorMessage } from "@/lib/utils";

import Form from "@/components/Settings/form/form";
import FormSection from "@/components/Settings/form/FormSection";
import FormInput from "@/components/Settings/form/FormInput";
import FormImageUpload from "@/components/Settings/form/FormImageUpload";
import FormSubmitButton from "@/components/Settings/form/FormSubmitButton";
import FormSelect from "@/components/Settings/form/FormSelect";

const INDUSTRIES = [
  "Agriculture",
  "Construction",
  "Education",
  "Energy & Utilities",
  "Financial Services",
  "FMCG (Fast-Moving Consumer Goods)",
  "Healthcare",
  "Hospitality & Tourism",
  "Information Technology",
  "Manufacturing",
  "Media & Entertainment",
  "Oil & Gas",
  "Professional Services",
  "Real Estate",
  "Retail",
  "Telecommunications",
  "Transportation & Logistics",
];

export default function CompanyEdit() {
  const { data, isLoading } = useGetCompanyQuery();
  const [updateCompany, { isLoading: isUpdating }] = useUpdateCompanyMutation();
  const user = useSelector((state: any) => state.auth.user);
  const tenant_company_name = useSelector(
    (state: any) => state.auth.tenant_company_name,
  );
  const router = useRouter();
  const statusModal = useStatusModal();

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    phone: "",
    street_address: "",
    city: "",
    state: "",
    country: "",
    registration_number: "",
    tax_id: "",
    industry: "",
    language: "en",
    company_size: "",
    website: "",
    roles: [] as string[],
    logoPreview: null as string | null,
    logoFile: null as File | null,
  });

  useEffect(() => {
    if (data) {
      setForm({
        phone: data.phone ?? "",
        street_address: data.street_address ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
        country: data.country ?? "",
        registration_number: data.registration_number ?? "",
        tax_id: data.tax_id ?? "",
        industry: data.industry ?? "",
        language: data.language ?? "en",
        company_size: data.company_size ?? "",
        website: data.website ?? "",
        roles: data.roles?.map((r: any) => r.name) ?? [""],
        logoPreview: data.logo ? data.logo : null,
        logoFile: null,
      });
    }
  }, [data]);

  const handleInput = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const fieldName = e.target.name;
    setForm({ ...form, [fieldName]: e.target.value });
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[fieldName];
        return copy;
      });
    }
  };

  const handleImageChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const rawBase64 = base64String.split(",")[1];
        setForm({
          ...form,
          logoFile: file,
          logoPreview: rawBase64,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setForm({
        ...form,
        logoFile: null,
        logoPreview: null,
      });
    }
  };

  const handleRoleChange = (index: number, value: string) => {
    const newRoles = [...form.roles];
    newRoles[index] = value;
    setForm({ ...form, roles: newRoles });
  };

  const addRole = () => {
    setForm({ ...form, roles: [...form.roles, ""] });
  };

  const languageOptions = [{ label: "English", value: "en" }];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setFieldErrors({});
      const fd = new FormData();

      fd.append("phone", form.phone);
      fd.append("street_address", form.street_address);
      fd.append("city", form.city);
      fd.append("state", form.state);
      fd.append("country", form.country);
      fd.append("registration_number", form.registration_number);
      fd.append("tax_id", form.tax_id);
      fd.append("industry", form.industry);
      fd.append("language", form.language);
      fd.append("company_size", form.company_size);
      fd.append("website", form.website);

      const cleanedRoles = form.roles.filter((r) => r.trim() !== "");
      fd.append(
        "roles",
        JSON.stringify(cleanedRoles.map((r) => ({ name: r }))),
      );

      if (form.logoFile && form.logoPreview) {
        const file = new File(
          [Uint8Array.from(atob(form.logoPreview), (c) => c.charCodeAt(0))],
          "logo.png",
          { type: "image/png" },
        );
        fd.append("logo_image", file);
      }

      await updateCompany(fd).unwrap();
      statusModal.showSuccess("Success", "Company updated successfully!");
      setTimeout(() => {
        router.push("/settings/company/1");
      }, 1500);
    } catch (err: any) {
      console.error("Company update error:", err);
      const message = extractErrorMessage(err, "Failed to update company");

      // Extract field-specific errors to highlight on inputs
      const errorsObj: Record<string, string> = {};
      const data = err?.data;
      if (data) {
        if (Array.isArray(data.error)) {
          data.error.forEach((item: any) => {
            if (typeof item === "object" && item !== null) {
              Object.entries(item).forEach(([k, v]) => {
                errorsObj[k] = Array.isArray(v) ? String(v[0]) : String(v);
              });
            }
          });
        } else if (typeof data === "object") {
          Object.entries(data).forEach(([k, v]) => {
            if (k !== "detail" && k !== "message" && k !== "error") {
              errorsObj[k] = Array.isArray(v) ? String(v[0]) : String(v);
            }
          });
        }
      }
      setFieldErrors(errorsObj);

      statusModal.showError("Failed to update company", message);
    }
  };

  const handleCancel = () => {
    router.push("/settings/company/1");
  };

  if (isLoading)
    return (
      <div className="p-6 flex justify-center items-center">
        <LoadingDots count={3} />
      </div>
    );

  const industryOptions = INDUSTRIES.map((item) => ({
    label: item,
    value: item,
  }));

  const handleSelect = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto">
      <div className="flex px-4 justify-between items-center border-b py-4 border-[#E2E6E9] mb-6 bg-white">
        <div className="flex items-center">
          {/* <button
            onClick={handleCancel}
            className="mr-4 text-2xl text-[#717171] cursor-pointer"
          >
            &larr;
          </button> */}
          <h1 className="text-xl text-[#1A1A1A] font-normal">Update Company</h1>
        </div>
      </div>

      <Form onSubmit={handleSubmit}>
        <FormSection title="Basic Information">
          <div className="flex flex-col md:flex-row md:items-center items-start gap-8 mt-2">
            <FormImageUpload
              label=""
              image={form.logoPreview}
              onChange={handleImageChange}
              textToDisplay="Click to Update Company Logo"
            />
            <div className="flex flex-col justify-center w-full md:w-auto">
              <p className="text-[#1A1A1A] text-base">Company Name</p>
              <p className="font-normal text-lg text-[#8C9AA6]">
                {tenant_company_name}
              </p>
            </div>
          </div>
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="flex flex-col justify-center md:col-span-3">
              <p className="text-[#1A1A1A] text-base">Company Name</p>
              <input
                name="company Name"
                placeholder="Enter your company name"
                type="text"
                className="border border-[#7A8A98] p-2 text-sm"
              />
            </div>
          </div> */}
        </FormSection>

        <FormSection title="Contact Information">
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              <FormInput
                label="Email"
                name="email"
                value={user?.email || ""}
                placeholder="Enter your email"
                onChange={handleInput}
                error={fieldErrors.email}
              />
              <FormInput
                label="Phone Number"
                name="phone"
                placeholder="Enter your phone number"
                value={form.phone}
                onChange={handleInput}
                error={fieldErrors.phone}
              />
              <FormInput
                label="Website"
                name="website"
                placeholder="Enter your company website here"
                value={form.website}
                onChange={handleInput}
                error={fieldErrors.website}
              />
            </div>
            <div className="mt-6">
              <h3 className="text-[#1A1A1A] font-semibold text-base">
                Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <FormInput
                  label="Street & Number"
                  placeholder="Enter your street & number"
                  name="street_address"
                  value={form.street_address}
                  onChange={handleInput}
                  error={fieldErrors.street_address}
                />
                <FormInput
                  label="City"
                  name="city"
                  placeholder="Enter your city"
                  value={form.city}
                  onChange={handleInput}
                  error={fieldErrors.city}
                />
                <FormInput
                  label="State"
                  name="state"
                  placeholder="Enter your state"
                  value={form.state}
                  onChange={handleInput}
                  error={fieldErrors.state}
                />
                <FormInput
                  label="Country"
                  name="country"
                  placeholder="Enter your country"
                  value={form.country}
                  onChange={handleInput}
                  error={fieldErrors.country}
                />
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection title="Company Registration Info">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <FormInput
              label="Registration Number"
              name="registration_number"
              placeholder="Enter your company registration number"
              value={form.registration_number}
              onChange={handleInput}
              error={fieldErrors.registration_number}
            />
            <FormInput
              label="Tax ID"
              name="tax_id"
              value={form.tax_id}
              placeholder="Enter your company Tax Identification Number"
              onChange={handleInput}
              error={fieldErrors.tax_id}
            />
          </div>
        </FormSection>

        <FormSection title="Other Information">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <FormSelect
              label="Industry"
              name="industry"
              placeholder="Select your company Industry"
              value={form.industry}
              options={industryOptions}
              onChange={(e) => handleSelect("industry", e.target.value)}
              error={fieldErrors.industry}
            />
            <FormSelect
              label="Language"
              name="language"
              value={form.language}
              placeholder="Select your language"
              options={languageOptions}
              onChange={(e) => handleSelect("language", e.target.value)}
              error={fieldErrors.language}
            />
            <FormInput
              label="Company Size"
              name="company_size"
              value={form.company_size}
              onChange={handleInput}
              error={fieldErrors.company_size}
            />
          </div>
        </FormSection>

        <FormSection title="Roles Set-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4 items-end">
            {form.roles.map((role, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <FormInput
                  label="Role"
                  name={`role-${idx}`}
                  value={role}
                  onChange={(e) => handleRoleChange(idx, e.target.value)}
                  className="flex-1"
                />
                {form.roles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newRoles = [...form.roles];
                      newRoles.splice(idx, 1);
                      setForm({ ...form, roles: newRoles });
                    }}
                    className="w-5 h-5 shrink-0 flex items-center justify-center bg-red-500 text-white rounded-full text-xs font-bold mt-6"
                  >
                    -
                  </button>
                )}
              </div>
            ))}

            <div className="flex items-center h-full pb-1">
              <button
                type="button"
                onClick={addRole}
                className="flex items-center gap-2 text-[#7A8A98] text-sm hover:text-[#3B7CED] transition-colors"
              >
                <FaPlusCircle className="w-5 h-5" />
                Add more role
              </button>
            </div>
          </div>
        </FormSection>

        <div className="w-full flex justify-end gap-4 py-6 px-6 border-t border-gray-200 mt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <FormSubmitButton label="Save Changes" />
        </div>
      </Form>

      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={statusModal.close}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
      />
    </div>
  );
}

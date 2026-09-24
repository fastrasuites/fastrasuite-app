"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Trash2, AlertCircle } from "lucide-react";
import { useGetAvailableBudgetQuery } from "@/api/projectApi";
import {
  useGetProjectOptionsQuery,
  useGetPhaseOptionsQuery,
  useGetActivityOptionsQuery,
} from "@/api/requests/projectRequestApi";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import { useCurrentUserName } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { StatusModal, useStatusModal } from "@/components/shared/StatusModal";
import { RequestFormConfig } from "./types";
import { extractErrorMessage } from "@/lib/utils";

interface RequestFormProps<T extends Record<string, any>> {
  config: RequestFormConfig<T>;
}

function MilestonesField({
  control,
  name,
  errors,
}: {
  control: any;
  name: string;
  errors: any;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: name as any,
  });

  const milestonesWatch = useWatch({ control, name }) || [];
  const currentItems = Array.isArray(milestonesWatch) ? milestonesWatch : [];
  const totalPercentage = currentItems.reduce(
    (sum: number, item: any) => sum + (Number(item?.percentage) || 0),
    0
  );

  return (
    <div className="space-y-4 col-span-2">
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex gap-3 items-start p-3 border border-gray-100 rounded-lg bg-gray-50/50"
          >
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                  Name
                </Label>
                <Controller
                  name={`${name}.${index}.name` as any}
                  control={control}
                  render={({ field: inputField }) => (
                    <Input
                      {...inputField}
                      placeholder="e.g. Foundation"
                      className="bg-white h-9 text-sm"
                    />
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                  Percentage (%)
                </Label>
                <Controller
                  name={`${name}.${index}.percentage` as any}
                  control={control}
                  render={({ field: inputField }) => (
                    <Input
                      {...inputField}
                      type="number"
                      placeholder="0"
                      className="bg-white h-9 text-sm"
                    />
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                  Criteria
                </Label>
                <Controller
                  name={`${name}.${index}.completion_criteria` as any}
                  control={control}
                  render={({ field: inputField }) => (
                    <Input
                      {...inputField}
                      placeholder="e.g. Concrete poured"
                      className="bg-white h-9 text-sm"
                    />
                  )}
                />
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => remove(index)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 mt-5"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => append({ name: "", percentage: "", completion_criteria: "" })}
        className="w-full border-2 border-dashed border-gray-200 text-[#3B7CED] hover:bg-[#3B7CED]/5 h-10"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Milestone
      </Button>

      <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
        <span className="text-sm font-bold text-gray-700">
          Total Percentage
        </span>
        <span
          className={cn(
            "text-lg font-black",
            totalPercentage === 100
              ? "text-green-600"
              : "text-red-600"
          )}
        >
          {totalPercentage}%
        </span>
      </div>
      {totalPercentage !== 100 && (
        <p className="text-[10px] text-red-500 italic text-right">
          * Must total exactly 100%
        </p>
      )}
      {fields.length < 2 && (
        <p className="text-[10px] text-amber-600 italic text-right">
          * At least 2 milestones are required for milestone-based payment
        </p>
      )}
    </div>
  );
}

function BudgetIndicator({ config, values }: { config: any; values: any }) {
  const projectId = values[config.projectField];
  const wbsId = values[config.wbsField];

  const { data: budget, isLoading } = useGetAvailableBudgetQuery(
    {
      project_id: Number(projectId),
      wbs_id: wbsId,
      cost_code: config.costCode,
    },
    { skip: !projectId || !wbsId },
  );

  if (!projectId || !wbsId) return null;
  if (isLoading)
    return (
      <div className="p-4 bg-gray-50 animate-pulse rounded-lg text-sm text-gray-500">
        Checking available budget...
      </div>
    );

  if (!budget || budget.available_budget === undefined || budget.available_budget === null) {
    return null;
  }

  const available = Number(budget.available_budget);

  return (
    <div
      className={cn(
        "mb-6 p-4 rounded-xl flex items-start gap-3 border shadow-sm transition-all",
        available > 0
          ? "bg-blue-50/50 border-blue-100"
          : "bg-red-50/50 border-red-100",
      )}
    >
      <AlertCircle
        className={cn(
          "h-5 w-5 mt-0.5",
          available > 0 ? "text-blue-500" : "text-red-500",
        )}
      />
      <div>
        <p
          className={cn(
            "text-sm font-semibold",
            available > 0 ? "text-blue-900" : "text-red-900",
          )}
        >
          Available Budget
        </p>
        <p
          className={cn(
            "text-lg font-bold",
            available > 0 ? "text-[#3B7CED]" : "text-red-600",
          )}
        >
          ₦{available.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
}

export function RequestForm<T extends Record<string, any>>({
  config,
}: RequestFormProps<T>) {
  const router = useRouter();
  const statusModal = useStatusModal();
  const currentUserName = useCurrentUserName();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
    setValue,
  } = useForm<T>({
    resolver: zodResolver(config.schema as any),
    defaultValues: config.defaultValues as any,
    mode: "onBlur",
  });

  const currentValues = watch();
  const projectVal = currentValues["project"] || currentValues["project_id"] || "";
  const phaseVal = currentValues["phase"] || "";
  const taskVal = currentValues["task"] || currentValues["activity"] || currentValues["wbsElement"] || "";

  const prevProjectRef = React.useRef(projectVal);
  const prevPhaseRef = React.useRef(phaseVal);

  const defaultValuesRef = React.useRef<string>("");

  React.useEffect(() => {
    if (config.defaultValues) {
      const stringified = JSON.stringify(config.defaultValues);
      if (defaultValuesRef.current !== stringified) {
        defaultValuesRef.current = stringified;
        const defaultProject = (config.defaultValues as any)["project"] || (config.defaultValues as any)["project_id"] || "";
        const defaultPhase = (config.defaultValues as any)["phase"] || "";
        prevProjectRef.current = defaultProject;
        prevPhaseRef.current = defaultPhase;
        reset(config.defaultValues as any);
      }
    }
  }, [config.defaultValues, reset]);

  const projectedCost = config.calculateProjectedCost
    ? config.calculateProjectedCost(currentValues)
    : null;

  const { data: rawProjectOptions = [] } = useGetProjectOptionsQuery();
  const projectOptionsList = Array.isArray(rawProjectOptions)
    ? rawProjectOptions
    : (rawProjectOptions as any)?.results || [];
  const projectSelectOptions = projectOptionsList.map((p: any) => ({
    label: p.name,
    value: String(p.id),
  }));

  const numericProjectId = Number(projectVal);
  const isValidProjectId = Boolean(projectVal && !isNaN(numericProjectId) && numericProjectId > 0);

  const { data: rawPhaseOptions = [] } = useGetPhaseOptionsQuery(
    { project_id: numericProjectId },
    { skip: !isValidProjectId }
  );
  const phaseOptionsList = Array.isArray(rawPhaseOptions)
    ? rawPhaseOptions
    : (rawPhaseOptions as any)?.results || [];
  const phaseSelectOptions = phaseOptionsList.map((ph: any) => ({
    label: ph.name,
    value: String(ph.id),
    amount: ph.current_budget ?? ph.original_amount,
  }));

  const { data: rawActivityOptions = [] } = useGetActivityOptionsQuery(
    { project_id: numericProjectId, phase_id: String(phaseVal) },
    { skip: !isValidProjectId || !phaseVal }
  );
  const activityOptionsList = Array.isArray(rawActivityOptions)
    ? rawActivityOptions
    : (rawActivityOptions as any)?.results || [];
  const activitySelectOptions = activityOptionsList.map((act: any) => ({
    label:
      act.serial_number !== undefined && act.serial_number !== null
        ? `${act.serial_number} - ${act.name}`
        : act.name,
    value: String(act.id),
    amount: act.available_budget ?? act.current_budget ?? act.original_amount,
  }));

  const budgetCostCode = config.budgetConfig?.costCode || (config as any).costCode || "";
  const { data: budgetData } = useGetAvailableBudgetQuery(
    {
      project_id: numericProjectId,
      wbs_id: taskVal,
      cost_code: budgetCostCode || "CC-01",
    },
    { skip: !isValidProjectId || !taskVal }
  );

  const selectedActivity = activityOptionsList.find((a: any) => String(a.id) === String(taskVal));
  const fallbackBudget = Number((config as any)?.defaultBudget) || 0;
  const availableBudgetAmount =
    selectedActivity?.available_budget !== undefined && selectedActivity.available_budget !== null
      ? Number(selectedActivity.available_budget)
      : selectedActivity?.current_budget !== undefined && selectedActivity.current_budget !== null
      ? Number(selectedActivity.current_budget)
      : budgetData?.available_budget !== undefined && budgetData.available_budget !== null
      ? Number(budgetData.available_budget)
      : fallbackBudget;

  const selectedCostCode =
    (selectedActivity as any)?.cost_code || (selectedActivity as any)?.code || budgetCostCode || "-";

  // Cascading reset: clear phase and task when project changes
  React.useEffect(() => {
    if (prevProjectRef.current && prevProjectRef.current !== projectVal) {
      setValue("phase" as any, "" as any);
      setValue("task" as any, "" as any);
      setValue("activity" as any, "" as any);
      setValue("wbsElement" as any, "" as any);
    }
    prevProjectRef.current = projectVal;
  }, [projectVal, setValue]);

  // Cascading reset: clear task when phase changes
  React.useEffect(() => {
    if (prevPhaseRef.current && prevPhaseRef.current !== phaseVal) {
      setValue("task" as any, "" as any);
      setValue("activity" as any, "" as any);
      setValue("wbsElement" as any, "" as any);
    }
    prevPhaseRef.current = phaseVal;
  }, [phaseVal, setValue]);

  const onSubmit = async (data: T) => {
    try {
      console.log("Form submitted from RequestForm component:", data);
      await config.onSubmit(data);
      statusModal.showSuccess(
        config.successMessage.title,
        config.successMessage.description,
      );
    } catch (error) {
      console.error("API Submission Error:", error);
      statusModal.showError(
        config.errorMessage?.title || "Submission Unsuccessful",
        extractErrorMessage(
          error,
          config.errorMessage?.description ||
            "There was an error submitting your request. Please check your connection and try again.",
        ),
      );
    }
  };

  const onInvalid = (formErrors: any) => {
    console.log("Form Validation Errors:", formErrors);
    const firstKey = Object.keys(formErrors)[0];
    const firstError = formErrors[firstKey]?.message || "Please ensure all required fields are filled out correctly.";
    statusModal.showError("Validation Error", firstError);
  };

  const handleModalAction = () => {
    statusModal.close();
    if (statusModal.type === "success") {
      reset();
      router.push(config.backPath);
      router.refresh();
    }
  };
  console.log("config", config);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="min-h-screen bg-[#F9FAFB] pb-28"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10 shadow-xs">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">
            {config.title}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto pb-16 pt-6 px-4 space-y-6">
        {/* Request Details Section / Header */}
        {config.renderHeader ? (
          config.renderHeader()
        ) : (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-sm font-medium text-[#3B7CED] mb-2">
              Request Details
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-900">
                  Request ID
                </Label>
                <Input
                  readOnly
                  disabled
                  value={config.requestId || "LR00001"}
                  className="w-full bg-white border-gray-300 text-gray-700 font-normal h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-900">
                  Date
                </Label>
                <Input
                  readOnly
                  disabled
                  value={config.date}
                  className="w-full bg-white border-gray-300 text-gray-700 font-normal h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-900">
                  Requested by
                </Label>
                <Input
                  readOnly
                  disabled
                  value={
                    (config.requesterName &&
                    config.requesterName !== "Firstname Lastname" &&
                    config.requesterName !== "Current User" &&
                    config.requesterName !== "John Doe" &&
                    config.requesterName !== "Requester"
                      ? config.requesterName
                      : currentUserName) || "Current User"
                  }
                  className="w-full bg-white border-gray-300 text-gray-700 font-normal h-10"
                />
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Sections */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {config.sections.map((section, sIndex) => (
            <div key={sIndex} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              {section.title && (
                <h2 className="text-sm font-medium text-[#3B7CED] mb-4">
                  {section.title}
                </h2>
              )}

              {/* Budget Indicator (if configured for this section) */}
              {config.budgetConfig && sIndex === 0 && (
                <BudgetIndicator
                  config={config.budgetConfig}
                  values={currentValues}
                />
              )}

              {/* Custom section top renderer */}
              {section.renderTop &&
                section.renderTop(currentValues, {
                  availableBudget: availableBudgetAmount,
                  costCode: selectedCostCode,
                  projectedCost: projectedCost || 0,
                })}

              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                {section.fields.map((field) => {
                  // Handle visibility logic
                  if (field.visibleIf) {
                    const actualValue = currentValues[field.visibleIf.field];
                    if (actualValue !== field.visibleIf.value) return null;
                  }

                  const dynamicLabel = field.getDynamicLabel
                    ? field.getDynamicLabel(currentValues)
                    : field.name === "dailyRate" &&
                        currentValues["durationUnit"] === "weeks"
                      ? "Estimated Weekly Rate"
                      : field.name === "dailyRate" &&
                          currentValues["durationUnit"] === "months"
                        ? "Estimated Monthly Rate"
                        : field.label;

                  const dynamicPlaceholder = field.getDynamicPlaceholder
                    ? field.getDynamicPlaceholder(currentValues)
                    : field.name === "dailyRate" &&
                        currentValues["durationUnit"] === "weeks"
                      ? "Enter weekly rate"
                      : field.name === "dailyRate" &&
                          currentValues["durationUnit"] === "months"
                        ? "Enter monthly rate"
                        : field.placeholder;

                  return (
                    <div
                      key={field.name}
                      className={`space-y-2 ${field.halfWidth ? "col-span-1" : "col-span-2"}`}
                    >
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={field.name}
                          className="text-sm font-semibold text-gray-900"
                        >
                          {dynamicLabel}
                        </Label>
                        {field.action}
                      </div>
                      <Controller
                        name={field.name as any}
                        control={control}
                        render={({ field: controllerField }) => {
                          if (field.type === "select") {
                            let options = field.options || [];

                            if (field.name === "project") {
                              const base = projectSelectOptions.length > 0 ? projectSelectOptions : (field.options || []);
                              options = [...base];
                              if (controllerField.value && !options.some((o: any) => String(o.value) === String(controllerField.value))) {
                                const fallback = (field.options || []).find((o: any) => String(o.value) === String(controllerField.value));
                                if (fallback) {
                                  options = [fallback, ...options];
                                }
                              }
                            }

                            if (field.name === "phase") {
                              const base = phaseSelectOptions.length > 0 ? phaseSelectOptions : (field.options || []);
                              options = [...base];
                              if (controllerField.value && !options.some((o: any) => String(o.value) === String(controllerField.value))) {
                                const fallback = (field.options || []).find((o: any) => String(o.value) === String(controllerField.value));
                                if (fallback) {
                                  options = [fallback, ...options];
                                }
                              }
                            }

                            if (field.name === "task" || field.name === "wbsElement" || field.name === "activity") {
                              const base = activitySelectOptions.length > 0 ? activitySelectOptions : (field.options || []);
                              options = [...base];
                              if (controllerField.value && !options.some((o: any) => String(o.value) === String(controllerField.value))) {
                                const fallback = (field.options || []).find((o: any) => String(o.value) === String(controllerField.value));
                                if (fallback) {
                                  options = [fallback, ...options];
                                }
                              }
                            }

                            if (field.name === "vendor") {
                              if (controllerField.value && !options.some((o: any) => String(o.value) === String(controllerField.value))) {
                                const fallback = (field.options || []).find((o: any) => String(o.value) === String(controllerField.value));
                                if (fallback) {
                                  options = [fallback, ...options];
                                }
                              }
                            }

                            const isFieldDisabled =
                              field.disabled ||
                              (field.name === "phase" && !projectVal && !controllerField.value) ||
                              ((field.name === "task" || field.name === "wbsElement" || field.name === "activity") && !phaseVal && !controllerField.value);

                            const computedPlaceholder =
                              field.name === "phase" && !projectVal && !controllerField.value
                                ? "Select a project first"
                                : (field.name === "task" || field.name === "wbsElement" || field.name === "activity") && !phaseVal && !controllerField.value
                                ? "Select a phase first"
                                : dynamicPlaceholder;

                            return (
                              <Select
                                onValueChange={controllerField.onChange}
                                value={controllerField.value}
                                disabled={isFieldDisabled}
                              >
                                <SelectTrigger
                                  id={field.name}
                                  className={cn(
                                    "w-full [&>span]:w-full",
                                    isFieldDisabled && "bg-gray-50 text-gray-400 cursor-not-allowed opacity-75"
                                  )}
                                >
                                  <SelectValue
                                    placeholder={computedPlaceholder}
                                  />
                                </SelectTrigger>
                                <SelectContent className="max-h-72">
                                  {options.length === 0 ? (
                                    <div className="p-3 text-center text-xs text-gray-500">
                                      {field.emptyMessage || "No options available."}
                                    </div>
                                  ) : (
                                    options.map((opt) => (
                                      <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                        className="py-2.5 cursor-pointer [&>span:last-child]:w-full [&>span:last-child]:min-w-0"
                                      >
                                        {opt.amount !== undefined ? (
                                          <span className="flex items-center justify-between gap-3 w-full min-w-0">
                                            <span className="font-medium text-gray-800 truncate min-w-0">
                                              {opt.label}
                                            </span>
                                            <span className="font-semibold text-xs text-[#3B7CED] bg-blue-50 px-2 py-0.5 rounded border border-blue-100 shrink-0 ml-auto">
                                              ₦{Number(opt.amount || 0).toLocaleString("en-NG", {
                                                minimumFractionDigits: 2,
                                              })}
                                            </span>
                                          </span>
                                        ) : (
                                          opt.label
                                        )}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            );
                          }
                          if (field.type === "textarea") {
                            return (
                              <Textarea
                                id={field.name}
                                placeholder={dynamicPlaceholder}
                                rows={field.rows || 4}
                                disabled={field.disabled}
                                className="resize-none"
                                {...controllerField}
                              />
                            );
                          }
                          if (field.type === "milestones") {
                            return (
                              <MilestonesField
                                control={control}
                                name={field.name}
                                errors={errors}
                              />
                            );
                          }
                          if (field.type === "checkbox") {
                            return (
                              <div className="flex items-center space-x-2 py-2">
                                <Checkbox
                                  id={field.name}
                                  checked={controllerField.value}
                                  disabled={field.disabled}
                                  onCheckedChange={controllerField.onChange}
                                />
                                <Label
                                  htmlFor={field.name}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {dynamicPlaceholder || dynamicLabel}
                                </Label>
                              </div>
                            );
                          }
                          return (
                            <Input
                              id={field.name}
                              type={field.type as any}
                              placeholder={dynamicPlaceholder}
                              disabled={field.disabled}
                              {...controllerField}
                              aria-invalid={!!errors[field.name]}
                              className={
                                errors[field.name]
                                  ? "border-red-500 focus-visible:ring-red-500/40"
                                  : ""
                              }
                            />
                          );
                        }}
                      />
                      {field.hintNode}
                      {errors[field.name] && (
                        <p className="text-sm text-red-500">
                          {(errors[field.name] as any).message}
                        </p>
                      )}
                      {!errors[field.name] && !field.hintNode && field.hintText && (
                        <p className="text-xs text-gray-500 mt-1">
                          {field.hintText}
                        </p>
                      )}
                    </div>
                  );
                })}

                {/* Projected Cost (only shown in the last section for now, or based on logic) */}
                {sIndex === config.sections.length - 1 &&
                  projectedCost !== null && !section.renderTop && (
                    <div className="pt-5 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-900">
                          Projected Cost
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          ₦
                          {projectedCost.toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  )}
              </div>

              {/* WBS section budget & cost code summary right below task */}
              {!section.renderBottom &&
                !section.hideCostSummary &&
                (section.title === "WBS" ||
                  section.fields.some(
                    (f) => f.name === "task" || f.name === "wbsElement",
                  )) && (
                  <div className="pt-4 mt-4 border-t border-gray-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">
                        Cost Code
                      </span>
                      <span className="text-sm text-gray-600 font-medium">
                        {selectedCostCode}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">
                        Available Budget
                      </span>
                      <span className="text-sm font-bold text-[#3B7CED]">
                        ₦
                        {availableBudgetAmount.toLocaleString("en-NG", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                )}

              {/* Custom section bottom renderer */}
              {section.renderBottom && section.renderBottom(currentValues)}

              {/* Submit Button placed cleanly inside/below the last card */}
              {sIndex === config.sections.length - 1 && (
                <PermissionGuard module="project_request" entitlement="create">
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="contained"
                      className="w-full h-12 text-base font-medium flex items-center justify-center bg-[#3B7CED] hover:bg-[#2d63c7] text-white rounded-lg"
                      onClick={handleSubmit(onSubmit, onInvalid)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Submit request"}
                    </Button>
                  </div>
                </PermissionGuard>
              )}
            </div>
          ))}
        </form>
      </div>

      {/* Status Modal */}
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={statusModal.close}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        actionText={statusModal.type === "success" ? "Done" : "Try again"}
        onAction={handleModalAction}
        showCloseButton={false}
      />
    </motion.div>
  );
}

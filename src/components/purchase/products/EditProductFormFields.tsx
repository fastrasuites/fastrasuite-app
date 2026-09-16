import React from "react";
import { motion } from "framer-motion";
import {
  UseFormRegisterReturn,
  UseFormSetValue,
  FieldErrors,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductFormData } from "@/schemas/productSchema";

type Option = { value: string; label: string };

// Backward compatible props interface
interface ReactHookFormProps {
  register: (name: keyof ProductFormData) => UseFormRegisterReturn;
  errors: FieldErrors<ProductFormData>;
  setValue: UseFormSetValue<ProductFormData>;
  categoryOptions: Option[];
  unitOptions: Option[];
  isLoadingUnits?: boolean;
}

interface SimpleProps {
  formData: {
    name: string;
    description: string;
    available: number | "";
    totalPurchased: number | "";
    category: string;
    unit: string;
  };
  onChange: (field: string, value: string | number | "") => void;
  categoryOptions: Option[];
  unitOptions: Option[];
  isLoadingUnits?: boolean;
}

type ProductFormFieldsProps = ReactHookFormProps | SimpleProps;

export function EditProductFormFields(props: ProductFormFieldsProps) {
  // Check if we're using react-hook-form props or simple props
  const isReactHookForm = "register" in props;

  // Type guards
  const reactHookFormProps = props as ReactHookFormProps;
  const simpleProps = props as SimpleProps;

  // Helper function to get field value
  const getFieldValue = (field: string): string | number | "" | undefined => {
    if (isReactHookForm) {
      // For react-hook-form, we'll use the register function approach
      return undefined;
    }
    return simpleProps.formData[field as keyof typeof simpleProps.formData];
  };

  // Helper function to handle field changes
  const handleFieldChange = (field: string, value: string | number | "") => {
    if (isReactHookForm) {
      reactHookFormProps.setValue(field as keyof ProductFormData, value);
    } else {
      simpleProps.onChange(field, value);
    }
  };

  // Helper function to handle select changes
  const handleSelectChange = (field: string, value: string) => {
    if (isReactHookForm) {
      reactHookFormProps.setValue(field as keyof ProductFormData, value);
    } else {
      simpleProps.onChange(field, value);
    }
  };

  return (
    <motion.div
      className="md:flex md:items-start md:gap-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Grid inputs */}
      <div className="flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Product Name */}
          <motion.div
            className="col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
          >
            <Label
              htmlFor="name"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Product Name *
            </Label>
            <motion.div
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Input
                id="name"
                placeholder="Enter product name"
                {...(isReactHookForm
                  ? reactHookFormProps.register("name")
                  : {
                      value: getFieldValue("name"),
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFieldChange("name", e.target.value),
                    })}
                className="h-11 bg-white border border-gray-400 rounded shadow-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
              />
              {isReactHookForm && reactHookFormProps.errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {reactHookFormProps.errors.name.message}
                </p>
              )}
            </motion.div>
          </motion.div>

          {/* Product Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
          >
            <Label
              htmlFor="description"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Product Description *
            </Label>
            <div className="relative">
              <motion.div
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Input
                  id="description"
                  placeholder="Enter product description"
                  {...(isReactHookForm
                    ? reactHookFormProps.register("description")
                    : {
                        value: getFieldValue("description"),
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                          handleFieldChange("description", e.target.value),
                      })}
                  className="h-11 pr-10 bg-white border border-gray-400 rounded shadow-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                />
                {isReactHookForm && reactHookFormProps.errors.description && (
                  <p className="text-sm text-red-600 mt-1">
                    {reactHookFormProps.errors.description.message}
                  </p>
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* Available Product Quantity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
          >
            <Label
              htmlFor="available"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Available Product Quantity
            </Label>
            <motion.div
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Input
                id="available"
                type="number"
                min={0}
                {...(isReactHookForm
                  ? reactHookFormProps.register("available")
                  : {
                      value: getFieldValue("available"),
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFieldChange(
                          "available",
                          e.target.value === ""
                            ? ""
                            : parseInt(e.target.value) || 0
                        ),
                    })}
                className="h-11 bg-white border border-gray-400 rounded shadow-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
              />
              {isReactHookForm && reactHookFormProps.errors.available && (
                <p className="text-sm text-red-600 mt-1">
                  {reactHookFormProps.errors.available.message}
                </p>
              )}
            </motion.div>
          </motion.div>

          {/* Total Quantity Purchased */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.4 }}
          >
            <Label
              htmlFor="totalPurchased"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Total Quantity Purchased
            </Label>
            <motion.div
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Input
                id="totalPurchased"
                type="number"
                min={0}
                {...(isReactHookForm
                  ? reactHookFormProps.register("totalPurchased")
                  : {
                      value: getFieldValue("totalPurchased"),
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFieldChange(
                          "totalPurchased",
                          e.target.value === ""
                            ? ""
                            : parseInt(e.target.value) || 0
                        ),
                    })}
                className="h-11 bg-white border border-gray-400 rounded shadow-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
              />
              {isReactHookForm && reactHookFormProps.errors.totalPurchased && (
                <p className="text-sm text-red-600 mt-1">
                  {reactHookFormProps.errors.totalPurchased.message}
                </p>
              )}
            </motion.div>
          </motion.div>

          {/* Product Category (select) */}
          <motion.div
            className="flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.5 }}
          >
            <Label
              htmlFor="category"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Product Category *
            </Label>
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="flex-1 h-full w-full border border-gray-400 rounded transition-all duration-200 hover:border-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <Select
                {...(isReactHookForm
                  ? {
                      onValueChange: (val) =>
                        handleSelectChange("category", val),
                    }
                  : {
                      value: String(getFieldValue("category") || ""),
                      onValueChange: (val) =>
                        handleSelectChange("category", val),
                    })}
              >
                <SelectTrigger
                  aria-labelledby="category"
                  className="border-none w-full shadow-none"
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {props.categoryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isReactHookForm && reactHookFormProps.errors.category && (
                <p className="text-sm text-red-600 mt-1">
                  {reactHookFormProps.errors.category.message}
                </p>
              )}
            </motion.div>
          </motion.div>

          {/* Unit of Measure (select) */}
          <motion.div
            className="flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.6 }}
          >
            <Label
              htmlFor="unit"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Unit of Measure *
            </Label>
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="flex-1 h-full w-full border border-gray-400 rounded transition-all duration-200 hover:border-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <Select
                {...(isReactHookForm
                  ? { onValueChange: (val) => handleSelectChange("unit", val) }
                  : {
                      value: String(getFieldValue("unit") || ""),
                      onValueChange: (val) => handleSelectChange("unit", val),
                    })}
                disabled={props.isLoadingUnits}
              >
                <SelectTrigger
                  aria-labelledby="unit"
                  className="border-none w-full shadow-none"
                >
                  <SelectValue
                    placeholder={
                      props.isLoadingUnits
                        ? "Loading units..."
                        : "Select a unit of measure"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {props.unitOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isReactHookForm && reactHookFormProps.errors.unit && (
                <p className="text-sm text-red-600 mt-1">
                  {reactHookFormProps.errors.unit.message}
                </p>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

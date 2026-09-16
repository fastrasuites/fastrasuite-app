// Error handling utilities for form validation and API responses

export interface ApiError {
  status: number;
  data: {
    errors?: {
      currency?: {
        name?: string;
        code?: string;
        symbol?: string;
      };
      unit_of_measure?: {
        name?: string;
        symbol?: string;
        category?: string;
      };
      currency_name?: string[];
      currency_code?: string[];
      currency_symbol?: string[];
      unit_name?: string[];
      unit_symbol?: string[];
      unit_category?: string[];
    };
    detail?: string;
    [key: string]: unknown;
  };
}

export interface FormErrors {
  currency_name?: string;
  currency_code?: string;
  currency_symbol?: string;
  unit_name?: string;
  unit_symbol?: string;
  unit_category?: string;
  general?: string;
}

/**
 * Parse API error response and extract field-specific errors
 */
export function parseApiError(
  error: ApiError | { status: number; data?: Record<string, unknown> },
): FormErrors {
  const formErrors: FormErrors = {};

  if (error.data?.errors) {
    // Handle nested error structure
    const errors = error.data.errors as any; // Type assertion for error handling
    if (errors.currency) {
      if (errors.currency.name) {
        formErrors.currency_name = errors.currency.name;
      }
      if (errors.currency.code) {
        formErrors.currency_code = errors.currency.code;
      }
    }

    // Handle flat error structure
    if (errors.currency_name) {
      formErrors.currency_name = errors.currency_name[0];
    }
    if (errors.currency_code) {
      formErrors.currency_code = errors.currency_code[0];
    }
    if (errors.currency_symbol) {
      formErrors.currency_symbol = errors.currency_symbol[0];
    }
    if (errors.unit_name) {
      formErrors.unit_name = errors.unit_name[0];
    }
    if (errors.unit_symbol) {
      formErrors.unit_symbol = errors.unit_symbol[0];
    }
    if (errors.unit_category) {
      formErrors.unit_category = errors.unit_category[0];
    }
  }

  // Handle general error messages
  if (error.data?.detail) {
    formErrors.general = error.data.detail as string;
  }

  return formErrors;
}

/**
 * Check if an error is a duplicate entry error
 */
export function isDuplicateError(error: ApiError): boolean {
  const errorMessage = error.data?.detail || "";
  const errorCode = error.status;

  // Common duplicate error indicators
  return (
    errorCode === 400 &&
    (errorMessage.includes("already exists") ||
      errorMessage.includes("duplicate") ||
      errorMessage.includes("unique"))
  );
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: ApiError): string {
  const errors = parseApiError(error);

  if (errors.currency_name) {
    return errors.currency_name;
  }

  if (errors.currency_code) {
    return errors.currency_code;
  }

  if (errors.general) {
    return errors.general;
  }

  // Default fallback message
  return "An error occurred. Please try again.";
}

/**
 * Validate currency data for duplicates before submission
 */
export interface CurrencyValidationResult {
  isValid: boolean;
  errors: FormErrors;
  hasDuplicates: boolean;
}

export function validateCurrencyDuplicates(
  newCurrency: { name: string; code: string; symbol: string },
  existingCurrencies: Array<{
    currency_name: string;
    currency_code: string;
    currency_symbol: string;
  }>,
): CurrencyValidationResult {
  const errors: FormErrors = {};
  const hasDuplicates = {
    name: false,
    code: false,
    symbol: false,
  };

  // Check for duplicates
  existingCurrencies.forEach((existing) => {
    if (
      existing.currency_name.toLowerCase() === newCurrency.name.toLowerCase()
    ) {
      hasDuplicates.name = true;
    }
    if (
      existing.currency_code.toLowerCase() === newCurrency.code.toLowerCase()
    ) {
      hasDuplicates.code = true;
    }
    if (
      existing.currency_symbol.toLowerCase() ===
      newCurrency.symbol.toLowerCase()
    ) {
      hasDuplicates.symbol = true;
    }
  });

  // Set error messages
  if (hasDuplicates.name) {
    errors.currency_name =
      "A currency with this name already exists in the system.";
  }

  if (hasDuplicates.code) {
    errors.currency_code =
      "A currency with this code already exists in the system.";
  }

  return {
    isValid: !hasDuplicates.name && !hasDuplicates.code,
    errors,
    hasDuplicates: hasDuplicates.name || hasDuplicates.code,
  };
}

/**
 * Validate unit of measure data for duplicates before submission
 */
export interface UnitOfMeasureValidationResult {
  isValid: boolean;
  errors: FormErrors;
  hasDuplicates: boolean;
}

export function validateUnitOfMeasureDuplicates(
  newUnit: { name: string; symbol: string; category: string },
  existingUnits: Array<{
    unit_name: string;
    unit_symbol: string;
    unit_category: string;
  }>,
): UnitOfMeasureValidationResult {
  const errors: FormErrors = {};
  const hasDuplicates = {
    name: false,
    symbol: false,
    category: false,
  };

  // Check for duplicates
  existingUnits.forEach((existing) => {
    if (
      existing.unit_name &&
      existing.unit_name.toLowerCase() === newUnit.name.toLowerCase()
    ) {
      hasDuplicates.name = true;
    }
    if (
      existing.unit_symbol &&
      existing.unit_symbol.toLowerCase() === newUnit.symbol.toLowerCase()
    ) {
      hasDuplicates.symbol = true;
    }
    if (
      existing.unit_category &&
      existing.unit_category.toLowerCase() === newUnit.category.toLowerCase()
    ) {
      hasDuplicates.category = true;
    }
  });

  // Set error messages
  if (hasDuplicates.name) {
    errors.unit_name =
      "A unit of measure with this name already exists in the system.";
  }

  if (hasDuplicates.symbol) {
    errors.unit_symbol =
      "A unit of measure with this symbol already exists in the system.";
  }

  if (hasDuplicates.category) {
    errors.unit_category =
      "A unit of measure with this category already exists in the system.";
  }

  return {
    isValid:
      !hasDuplicates.name && !hasDuplicates.symbol && !hasDuplicates.category,
    errors,
    hasDuplicates:
      hasDuplicates.name || hasDuplicates.symbol || hasDuplicates.category,
  };
}

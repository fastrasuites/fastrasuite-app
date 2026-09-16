const extractErrorMessage = (error: any): string => {
  // Handle RTK Query error structure
  console.log("error", error);
  if (error?.data?.error) {
    if (Array.isArray(error.data.error)) {
      // Your current API format: {"error": [{"detail": "..."}]}
      return error.data.error[0]?.detail || "An error occurred";
    }
    return error.data.error;
  }

  // Common DRF / REST API formats
  if (error?.data?.detail) {
    return error.data.detail;
  }

  if (error?.data?.message) {
    return error.data.message;
  }

  if (error?.data?.errors) {
    if (Array.isArray(error.data.errors)) {
      return error.data.errors[0]?.detail || error.data.errors[0];
    }
    return JSON.stringify(error.data.errors);
  }

  // Fallback based on status
  if (error?.status === 403) {
    return "You do not have permission to perform this action.";
  }
  if (error?.status === 400) {
    return "Please check your input and try again.";
  }
  if (error?.status === 401) {
    return "Your session has expired. Please log in again.";
  }
  if (error?.status === 500) {
    return "Server error. Our team has been notified.";
  }

  // Generic fallback
  return error?.message || "Failed! Please try again.";
};

export default extractErrorMessage;

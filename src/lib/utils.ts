import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanPythonErrorDetail(rawStr: string): string {
  if (typeof rawStr !== "string") return rawStr;
  let str = rawStr.trim();

  // Strip Python DRF ErrorDetail(...) wrappers:
  // e.g. ErrorDetail(string='location with this location name already exists.', code='unique')
  // -> 'location with this location name already exists.'
  if (str.includes("ErrorDetail")) {
    str = str.replace(
      /ErrorDetail\s*\(\s*string=(['"])([\s\S]*?)\1(?:\s*,\s*code=(['"]).*?\3)?\s*\)/g,
      "$2"
    );
  }

  return str;
}

export function parseFormattedDictOrJson(errStr: string): string {
  const str = cleanPythonErrorDetail(errStr).trim();

  // If it's a bracketed list of strings/items: e.g. ['something'] or [ErrorDetail(...)]
  if (str.startsWith("[") && str.endsWith("]")) {
    const inner = str.slice(1, -1).trim();
    const unquoted = inner.replace(/^['"]|['"]$/g, "").trim();
    if (unquoted) {
      return unquoted.charAt(0).toUpperCase() + unquoted.slice(1);
    }
  }

  // If it's a dict-like structure: e.g. {'location_name': ['...']} or {'key': 'val'}
  if (str.startsWith("{") && str.endsWith("}")) {
    // 1. Try parsing as standard JSON (if valid or if replacing single quotes works)
    try {
      const jsonCandidate = str.replace(/'/g, '"');
      const parsed = JSON.parse(jsonCandidate);
      if (parsed && typeof parsed === "object") {
        // Check if it's the budget variance structure
        if (
          parsed.error &&
          (parsed.activity_budget || parsed.available || parsed.requested)
        ) {
          const lines: string[] = [];
          if (parsed.error) lines.push(parsed.error);
          if (parsed.activity_budget) {
            const val = parseFloat(parsed.activity_budget);
            lines.push(
              `Activity Budget: ₦${isNaN(val) ? parsed.activity_budget : val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
            );
          }
          if (parsed.available) {
            const val = parseFloat(parsed.available);
            lines.push(
              `Available: ₦${isNaN(val) ? parsed.available : val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
            );
          }
          if (parsed.requested) {
            const val = parseFloat(parsed.requested);
            lines.push(
              `Requested: ₦${isNaN(val) ? parsed.requested : val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
            );
          }
          return lines.join("\n");
        }

        // Generic object parsing
        const lines: string[] = [];
        for (const [key, val] of Object.entries(parsed)) {
          if (val === null || val === undefined) continue;
          let valText = "";
          if (Array.isArray(val)) {
            valText = val
              .map((v) =>
                cleanPythonErrorDetail(
                  typeof v === "object" ? JSON.stringify(v) : String(v)
                )
              )
              .join(", ");
          } else if (typeof val === "object") {
            valText = JSON.stringify(val);
          } else {
            valText = cleanPythonErrorDetail(String(val));
          }
          valText = valText.trim();
          if (!valText) continue;

          valText = valText.charAt(0).toUpperCase() + valText.slice(1);

          if (
            key === "non_field_errors" ||
            key === "__all__" ||
            key === "detail" ||
            key === "message" ||
            key === "error"
          ) {
            lines.push(valText);
          } else {
            const formattedKey = key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
            lines.push(`${formattedKey}: ${valText}`);
          }
        }
        if (lines.length > 0) return lines.join("\n");
      }
    } catch {
      // JSON.parse failed, fallback to regex
    }

    // Regex fallback for Python dict pattern: 'field_name': ['message'] or 'field_name': 'message'
    const dictRegex =
      /['"]?([a-zA-Z0-9_-]+)['"]?\s*:\s*(?:\[\s*)?['"]?([^\[\]{}':,]+?)['"]?(?:\s*\])?(?=[,}])/g;
    const lines: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = dictRegex.exec(str)) !== null) {
      const key = match[1].trim();
      let val = match[2].trim();
      if (!val) continue;
      val = val.charAt(0).toUpperCase() + val.slice(1);

      if (
        key === "non_field_errors" ||
        key === "__all__" ||
        key === "detail" ||
        key === "message" ||
        key === "error"
      ) {
        lines.push(val);
      } else {
        const formattedKey = key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        lines.push(`${formattedKey}: ${val}`);
      }
    }
    if (lines.length > 0) return lines.join("\n");
  }

  return cleanPythonErrorDetail(str);
}

export function extractErrorMessage(
  error: any,
  defaultMessage: string = "An unexpected error occurred",
): string {
  if (!error) return defaultMessage;

  if (typeof error === "string") {
    return parseFormattedDictOrJson(error);
  }

  // Resolve payload: check error.data or error.error or error itself
  const data =
    error.data !== undefined
      ? error.data
      : error.error !== undefined && typeof error.error !== "string"
      ? error.error
      : error;

  if (typeof data === "string") {
    return parseFormattedDictOrJson(data);
  }

  if (typeof data === "object" && data !== null) {
    // 1. Direct string error key (e.g. { "error": "{'location_name': [ErrorDetail(...)]}" } or { "error": "Insufficient budget..." })
    if (typeof data.error === "string") {
      return parseFormattedDictOrJson(data.error);
    }

    // 2. Direct string detail or message
    if (typeof data.detail === "string") {
      return parseFormattedDictOrJson(data.detail);
    }
    if (typeof data.message === "string") {
      return parseFormattedDictOrJson(data.message);
    }
    if (typeof data.non_field_errors === "string") {
      return parseFormattedDictOrJson(data.non_field_errors);
    }
    if (
      Array.isArray(data.non_field_errors) &&
      data.non_field_errors.length > 0
    ) {
      return parseFormattedDictOrJson(String(data.non_field_errors[0]));
    }

    // 3. Nested error array (e.g. {"error": [{"error": "Insufficient budget.", "available": "...", ...}]})
    if (Array.isArray(data.error) && data.error.length > 0) {
      const messages = data.error.map((errItem: any) => {
        if (typeof errItem === "string") return parseFormattedDictOrJson(errItem);
        if (typeof errItem === "object" && errItem !== null) {
          if (errItem.error || errItem.detail || errItem.message) {
            const mainMsg = cleanPythonErrorDetail(
              String(errItem.error || errItem.detail || errItem.message)
            );
            const extraDetails: string[] = [];
            if (errItem.available !== undefined && errItem.available !== null) {
              const val = parseFloat(errItem.available);
              extraDetails.push(
                `Available: ₦${isNaN(val) ? errItem.available : val.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
              );
            }
            if (errItem.requested !== undefined && errItem.requested !== null) {
              const val = parseFloat(errItem.requested);
              extraDetails.push(
                `Requested: ₦${isNaN(val) ? errItem.requested : val.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
              );
            }
            if (
              errItem.activity_budget !== undefined &&
              errItem.activity_budget !== null
            ) {
              const val = parseFloat(errItem.activity_budget);
              extraDetails.push(
                `Activity Budget: ₦${isNaN(val) ? errItem.activity_budget : val.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
              );
            }
            if (extraDetails.length > 0) {
              return `${mainMsg} (${extraDetails.join(", ")})`;
            }
            return mainMsg;
          }
          if (typeof errItem.non_field_errors === "string")
            return parseFormattedDictOrJson(errItem.non_field_errors);
          if (
            Array.isArray(errItem.non_field_errors) &&
            errItem.non_field_errors.length > 0
          ) {
            return parseFormattedDictOrJson(String(errItem.non_field_errors[0]));
          }

          const entries = Object.entries(errItem);
          if (entries.length > 0) {
            const parts = entries.map(([key, val]) => {
              const rawVal = Array.isArray(val)
                ? String(val[0])
                : typeof val === "object"
                ? JSON.stringify(val)
                : String(val);
              const errorText = cleanPythonErrorDetail(rawVal.trim());
              const formattedKey = key
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase());
              return `${formattedKey}: ${errorText}`;
            });
            return parts.join("\n");
          }
        }
        return cleanPythonErrorDetail(JSON.stringify(errItem));
      });
      if (messages.length > 0) return messages.join("\n");
    }

    // 4. Handle error as an object (standard DRF errors: e.g. { location_name: ["..."] })
    const entries = Object.entries(data);
    const validEntries = entries.filter(
      ([key]) => key !== "status" && key !== "statusText"
    );
    if (validEntries.length > 0) {
      const parts = validEntries.map(([key, val]) => {
        const rawVal = Array.isArray(val)
          ? String(val[0])
          : typeof val === "object"
          ? JSON.stringify(val)
          : String(val);
        const errorText = cleanPythonErrorDetail(rawVal.trim());
        const capitalized =
          errorText.charAt(0).toUpperCase() + errorText.slice(1);
        if (
          key === "non_field_errors" ||
          key === "__all__" ||
          key === "detail" ||
          key === "message" ||
          key === "error"
        ) {
          return capitalized;
        }
        const formattedKey = key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        return `${formattedKey}: ${capitalized}`;
      });
      if (parts.length > 0) return parts.join("\n");
    }
  }

  // Fallback check top-level error.error if it was a string
  if (typeof error.error === "string") {
    return parseFormattedDictOrJson(error.error);
  }

  return error.message ? error.message.trim() : defaultMessage;
}


/**
 * Normalizes and formats a website URL:
 * - If empty or whitespace, returns ""
 * - If the URL already contains https://, http://, or malformed protocol variants
 *   (e.g. https//, https:/, repeated https://https://), cleans it and ensures it uses a single https:// prefix
 * - If no protocol is present (e.g. "example.com", "www.example.com"), prepends "https://"
 * - Cleans up extra leading slashes/colons/spaces
 */
export function formatWebsiteUrl(input: string): string {
  if (!input || typeof input !== "string") return "";
  let val = input.trim();
  if (!val) return "";

  // 1. Strip repeated/nested protocols (e.g. https://https://, http://https://, etc.)
  // We match (https?|ftp|ftps) followed by at least one delimiter (: or /)
  // This preserves domain names starting with "http" (e.g. httpwatch.com, https-proxy.net)
  while (/^(https?|ftp|ftps)[:\/]+/i.test(val)) {
    val = val.replace(/^(https?|ftp|ftps)[:\/]+/i, "");
  }

  // 2. Strip any remaining leading slashes, colons, or whitespace
  val = val.replace(/^[:\/\s]+/, "");

  // 3. If there is remaining domain/path text, prefix with https://
  if (val.length > 0) {
    return `https://${val}`;
  }

  return "";
}

/**
 * Validates whether a given string is a valid website URL with https:// scheme and a valid domain name.
 */
export function isValidWebsiteUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== "string") return false;
  const trimmed = urlStr.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);

    // Protocol must be https:
    if (parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname;
    if (!hostname) return false;

    // Allow localhost or IPv4 addresses for local development/testing
    if (hostname === "localhost" || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      return true;
    }

    // Must have at least one dot, valid domain labels (1-63 chars), and valid TLD (>=2 alpha chars)
    // Labels cannot start or end with a hyphen
    const domainRegex =
      /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

    return domainRegex.test(hostname);
  } catch {
    return false;
  }
}

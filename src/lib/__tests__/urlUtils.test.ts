import { formatWebsiteUrl, isValidWebsiteUrl } from "../urlUtils";

describe("urlUtils", () => {
  describe("formatWebsiteUrl", () => {
    it("returns empty string for empty or whitespace inputs", () => {
      expect(formatWebsiteUrl("")).toBe("");
      expect(formatWebsiteUrl("   ")).toBe("");
    });

    it("adds https:// prefix if missing", () => {
      expect(formatWebsiteUrl("example.com")).toBe("https://example.com");
      expect(formatWebsiteUrl("www.example.com")).toBe("https://www.example.com");
      expect(formatWebsiteUrl("sub.domain.co.uk")).toBe("https://sub.domain.co.uk");
    });

    it("keeps existing https:// intact without doubling", () => {
      expect(formatWebsiteUrl("https://example.com")).toBe("https://example.com");
      expect(formatWebsiteUrl("https://www.example.com/about")).toBe("https://www.example.com/about");
    });

    it("converts http:// to https://", () => {
      expect(formatWebsiteUrl("http://example.com")).toBe("https://example.com");
      expect(formatWebsiteUrl("http://www.example.com")).toBe("https://www.example.com");
    });

    it("fixes duplicated protocols (https://https://, http://https://, etc.)", () => {
      expect(formatWebsiteUrl("https://https://example.com")).toBe("https://example.com");
      expect(formatWebsiteUrl("https://http://example.com")).toBe("https://example.com");
      expect(formatWebsiteUrl("http://https://example.com")).toBe("https://example.com");
    });

    it("fixes malformed protocols (https//, http//, https:/, https:, https///)", () => {
      expect(formatWebsiteUrl("https//example.com")).toBe("https://example.com");
      expect(formatWebsiteUrl("http//example.com")).toBe("https://example.com");
      expect(formatWebsiteUrl("https:/example.com")).toBe("https://example.com");
      expect(formatWebsiteUrl("http:/example.com")).toBe("https://example.com");
      expect(formatWebsiteUrl("https:example.com")).toBe("https://example.com");
      expect(formatWebsiteUrl("https:///example.com")).toBe("https://example.com");
    });

    it("preserves domains starting with 'http' or 'https'", () => {
      expect(formatWebsiteUrl("httpwatch.com")).toBe("https://httpwatch.com");
      expect(formatWebsiteUrl("https://httpwatch.com")).toBe("https://httpwatch.com");
      expect(formatWebsiteUrl("https-proxy.net")).toBe("https://https-proxy.net");
    });

    it("returns empty string if user typed only protocol with no host", () => {
      expect(formatWebsiteUrl("https://")).toBe("");
      expect(formatWebsiteUrl("http://")).toBe("");
      expect(formatWebsiteUrl("https://///")).toBe("");
    });
  });

  describe("isValidWebsiteUrl", () => {
    it("validates well-formed https URLs", () => {
      expect(isValidWebsiteUrl("https://example.com")).toBe(true);
      expect(isValidWebsiteUrl("https://www.example.com")).toBe(true);
      expect(isValidWebsiteUrl("https://fastra-suite.com.ng")).toBe(true);
      expect(isValidWebsiteUrl("https://sub.domain.co.uk/careers")).toBe(true);
      expect(isValidWebsiteUrl("https://example.com:8080/dashboard?tab=1#sec")).toBe(true);
    });

    it("allows localhost for development/testing", () => {
      expect(isValidWebsiteUrl("https://localhost")).toBe(true);
      expect(isValidWebsiteUrl("https://localhost:3000")).toBe(true);
    });

    it("rejects non-https protocols", () => {
      expect(isValidWebsiteUrl("http://example.com")).toBe(false);
      expect(isValidWebsiteUrl("ftp://example.com")).toBe(false);
    });

    it("rejects invalid domains or malformed URLs", () => {
      expect(isValidWebsiteUrl("")).toBe(false);
      expect(isValidWebsiteUrl("   ")).toBe(false);
      expect(isValidWebsiteUrl("https://")).toBe(false);
      expect(isValidWebsiteUrl("https://example")).toBe(false); // No TLD
      expect(isValidWebsiteUrl("https://example.c")).toBe(false); // TLD too short
      expect(isValidWebsiteUrl("https://example..com")).toBe(false); // Double dot
      expect(isValidWebsiteUrl("https://-example.com")).toBe(false); // Leading hyphen
      expect(isValidWebsiteUrl("https://not a url.com")).toBe(false); // Spaces
    });
  });
});

const { z } = require("zod");

try {
  console.log("Testing z.coerce.number() with undefined...");
  
  const schema = z.object({
    company_role: z.coerce.number({
      required_error: "Role is required",
      invalid_type_error: "Role is required",
    }),
  });
  
  const data = {
    // company_role: undefined
  };
  
  console.log("Parsing data (missing field)...");
  const result = schema.safeParse(data);
  console.log("Result success:", result.success);
  if (!result.success) {
      console.log("Errors:", JSON.stringify(result.error.format(), null, 2));
  }

  console.log("\nParsing data (explicitly undefined)...");
  const result2 = schema.safeParse({ company_role: undefined });
  console.log("Result success:", result2.success);
  if (!result2.success) {
      console.log("Errors:", JSON.stringify(result2.error.format(), null, 2));
  }

  console.log("\nParsing data (empty string)...");
  const result3 = schema.safeParse({ company_role: "" });
  console.log("Result success:", result3.success);
  if (!result3.success) {
      console.log("Errors:", JSON.stringify(result3.error.format(), null, 2));
  } else {
      console.log("Value:", result3.data.company_role);
  }

} catch (err) {
  console.error("Caught error stack:", err.stack);
}

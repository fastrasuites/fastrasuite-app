const XLSX = require("xlsx");
const fs = require("fs");

const data = [
  { Phase: "Phase 1: Foundation", Subphase: "Site Preparation", Activity: "Clearing & Grubbing", Quantity: 1, Rate: 5000 },
  { Phase: "Phase 1: Foundation", Subphase: "Site Preparation", Activity: "Soil Testing", Quantity: 2, Rate: 1200 },
  { Phase: "Phase 1: Foundation", Subphase: "Excavation", Activity: "Trenching", Quantity: 50, Rate: 150 },
  { Phase: "Phase 1: Foundation", Subphase: "Excavation", Activity: "Backfilling", Quantity: 50, Rate: 80 },
  { Phase: "Phase 1: Foundation", Subphase: "Concrete Work", Activity: "Pouring Footers", Quantity: 10, Rate: 2000 },
  { Phase: "Phase 1: Foundation", Subphase: "Concrete Work", Activity: "Curing", Quantity: 1, Rate: 500 },
  { Phase: "Phase 2: Framing", Subphase: "Ground Floor", Activity: "Wall Framing", Quantity: 20, Rate: 300 },
  { Phase: "Phase 2: Framing", Subphase: "Ground Floor", Activity: "Ceiling Joists", Quantity: 15, Rate: 250 },
  { Phase: "Phase 2: Framing", Subphase: "First Floor", Activity: "Wall Framing", Quantity: 20, Rate: 320 },
  { Phase: "Phase 2: Framing", Subphase: "Roofing", Activity: "Truss Installation", Quantity: 1, Rate: 8000 },
  { Phase: "Phase 2: Framing", Subphase: "Roofing", Activity: "Shingling", Quantity: 40, Rate: 120 },
  { Phase: "Phase 3: Interiors", Subphase: "", Activity: "Drywall Installation", Quantity: 100, Rate: 45 },
  { Phase: "Phase 3: Interiors", Subphase: "", Activity: "Painting", Quantity: 100, Rate: 30 },
  { Phase: "Phase 4: Plumbing & Electrical", Subphase: "Plumbing", Activity: "Rough-in Pipes", Quantity: 1, Rate: 4500 },
  { Phase: "Phase 4: Plumbing & Electrical", Subphase: "Electrical", Activity: "Wiring", Quantity: 1, Rate: 6000 },
  { Phase: "Phase 4: Plumbing & Electrical", Subphase: "Electrical", Activity: "Panel Installation", Quantity: 2, Rate: 1500 },
];

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "WBS Data");

XLSX.writeFile(workbook, "WBS_Test_Data.xlsx");
console.log("Successfully generated WBS_Test_Data.xlsx");

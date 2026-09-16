const XLSX = require('xlsx');

const products = [
  {
    "Product Name": "Premium Printer Paper A4",
    "Description": "500 sheets per ream, 80gsm",
    "Category Name": "Office Supplies",
    "Unit Symbol": "box",
    "Standard Cost": 4500,
    "Reorder Point": 20
  },
  {
    "Product Name": "Ergonomic Office Chair",
    "Description": "Mesh back, adjustable armrests",
    "Category Name": "Furniture",
    "Unit Symbol": "unit",
    "Standard Cost": 85000,
    "Reorder Point": 5
  },
  {
    "Product Name": "Blue Ballpoint Pens",
    "Description": "Pack of 50",
    "Category Name": "Office Supplies",
    "Unit Symbol": "box",
    "Standard Cost": 2500,
    "Reorder Point": 10
  },
  {
    "Product Name": "Dell Latitude 5420",
    "Description": "Intel i5, 16GB RAM, 512GB SSD",
    "Category Name": "Electronics",
    "Unit Symbol": "unit",
    "Standard Cost": 450000,
    "Reorder Point": 2
  },
  {
    "Product Name": "Wireless Mouse",
    "Description": "Bluetooth, 10m range",
    "Category Name": "Electronics",
    "Unit Symbol": "pcs",
    "Standard Cost": 7500,
    "Reorder Point": 15
  },
  {
    "Product Name": "Safety Boots",
    "Description": "Steel toe, size 42",
    "Category Name": "Consumable",
    "Unit Symbol": "pr",
    "Standard Cost": 15000,
    "Reorder Point": 8
  },
  {
    "Product Name": "Cement Bag 50kg",
    "Description": "Portland cement",
    "Category Name": "Stockable",
    "Unit Symbol": "bag",
    "Standard Cost": 5200,
    "Reorder Point": 100
  },
  {
    "Product Name": "Machine Maintenance Service",
    "Description": "Monthly routine check",
    "Category Name": "Service Product",
    "Unit Symbol": "unit",
    "Standard Cost": 50000,
    "Reorder Point": 0
  },
  {
    "Product Name": "Engine Oil 5W-30",
    "Description": "Synthetic motor oil",
    "Category Name": "Consumable",
    "Unit Symbol": "L",
    "Standard Cost": 6000,
    "Reorder Point": 50
  },
  {
    "Product Name": "Wooden Desk",
    "Description": "120x60cm, oak finish",
    "Category Name": "Furniture",
    "Unit Symbol": "unit",
    "Standard Cost": 65000,
    "Reorder Point": 3
  }
];

const ws = XLSX.utils.json_to_sheet(products);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Products");
XLSX.writeFile(wb, "Test_Products_Bulk_Import.xlsx");
console.log("Successfully created Test_Products_Bulk_Import.xlsx in the root directory!");

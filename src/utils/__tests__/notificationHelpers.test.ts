import { resolveNotificationUrl } from "../notificationHelpers";

describe("resolveNotificationUrl", () => {
  it("resolves vendor bills to /invoice/payment-queue/:id", () => {
    const result = resolveNotificationUrl({
      module: "invoice",
      event: "vendor_bill_approved",
      title: "Vendor Bill Approved",
      action_url: "/invoicing/vendor-bills/11",
      object_id: "11",
    });
    expect(result).toBe("/invoice/payment-queue/11");
  });

  it("resolves disbursements to /invoice/payment-queue/disbursement/:id", () => {
    const result = resolveNotificationUrl({
      module: "invoice",
      event: "disbursement_paid",
      title: "Disbursement Paid",
      action_url: "/invoicing/disbursements/3",
      object_id: "3",
    });
    expect(result).toBe("/invoice/payment-queue/disbursement/3");
  });

  it("resolves stock adjustments to /inventory/stocks/adjustment/:id", () => {
    const result = resolveNotificationUrl({
      module: "inventory",
      event: "stock_adjustment_created",
      title: "Stock Adjustment Created",
      action_url: "/inventory/stock-adjustments/STJ0001/",
      object_id: "STJ0001",
    });
    expect(result).toBe("/inventory/stocks/adjustment/STJ0001");
  });

  it("resolves purchase orders to /invoice/purchase-order/:id", () => {
    const result = resolveNotificationUrl({
      module: "invoice",
      event: "purchase_order_issued",
      title: "Purchase Order Issued",
      action_url: "/invoicing/purchase-orders/9",
      object_id: "9",
    });
    expect(result).toBe("/invoice/purchase-order/9");
  });

  it("resolves project costing to /project-costing/:id", () => {
    const result = resolveNotificationUrl({
      module: "project_costing",
      event: "budget_approved",
      title: "Budget Adjustment Approved",
      action_url: "/project-costing/projects/1/budget-adjustments/d8f1ff19-2bb4-4e3b-b4da-1c864b43d74e",
      object_id: "d8f1ff19-2bb4-4e3b-b4da-1c864b43d74e",
    });
    expect(result).toBe("/project-costing/1");
  });

  it("resolves approved project requests to /project-request/approve/:masterId", () => {
    const result = resolveNotificationUrl({
      module: "project_requests",
      event: "request_approved",
      title: "Project Request Approved",
      action_url: "/project-requests/61",
      object_id: "61",
    });
    expect(result).toBe("/project-request/approve/61");
  });

  it("resolves submitted project requests to /project-request/approve/:masterId", () => {
    const result = resolveNotificationUrl({
      module: "project_requests",
      event: "request_submitted",
      title: "Project Request Submitted",
      action_url: "/project-requests/60",
      object_id: "60",
    });
    expect(result).toBe("/project-request/approve/60");
  });

  it("resolves rejected project requests to /project-request/approve/:masterId", () => {
    const result = resolveNotificationUrl({
      module: "project_requests",
      event: "request_rejected",
      title: "Project Request Rejected",
      action_url: "/project-requests/20",
      object_id: "20",
    });
    expect(result).toBe("/project-request/approve/20");
  });

  it("resolves created purchase request with object_id to /project-request/purchase-request/:objectId", () => {
    const result = resolveNotificationUrl({
      module: "project_requests",
      event: "request_created",
      title: "Project Purchase Request Created",
      action_url: "/project-requests/62",
      object_id: "25",
    });
    expect(result).toBe("/project-request/purchase-request/25");
  });

  it("resolves created petty cash request with object_id to /project-request/petty-cash-request/:objectId", () => {
    const result = resolveNotificationUrl({
      module: "project_requests",
      event: "request_created",
      title: "Petty cash Request Created",
      action_url: "/project-requests/61",
      object_id: "8",
    });
    expect(result).toBe("/project-request/petty-cash-request/8");
  });

  it("resolves created plant & equipment request with object_id to /project-request/plant-equipment-request/:objectId", () => {
    const result = resolveNotificationUrl({
      module: "project_requests",
      event: "request_created",
      title: "Plant & Equipment Request Created",
      action_url: "/project-requests/60",
      object_id: "9",
    });
    expect(result).toBe("/project-request/plant-equipment-request/9");
  });

  it("resolves updated subcontractor request with object_id to /project-request/subcontractor-request/:objectId", () => {
    const result = resolveNotificationUrl({
      module: "project_requests",
      event: "request_edited",
      title: "Subcontractor Request Updated",
      action_url: "/project-requests/17",
      object_id: "3",
    });
    expect(result).toBe("/project-request/subcontractor-request/3");
  });

  it("resolves created labour request with object_id to /project-request/labour-request/:objectId", () => {
    const result = resolveNotificationUrl({
      module: "project_requests",
      event: "request_created",
      title: "Labour Request Created",
      action_url: "/project-requests/42",
      object_id: "4",
    });
    expect(result).toBe("/project-request/labour-request/4");
  });

  it("resolves material consumption created with object_id to /project-request/material-consumption-request/:objectId", () => {
    const result = resolveNotificationUrl({
      module: "project_requests",
      event: "request_created",
      title: "Material Consumption created",
      action_url: "/project-requests/51",
      object_id: "8",
    });
    expect(result).toBe("/project-request/material-consumption-request/8");
  });
});

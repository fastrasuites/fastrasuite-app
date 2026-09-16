Permission Rules 

PROJECT_REQUEST_ACTIONS = {


    "view": [
            "requester",
            "reviewer",
            "approver",
            "manager",
            "administrator"
        ],


        "create": [
            "requester",
            "administrator"
        ],


        "approve": [
            "approver",
            "administrator"
        ],


        "reject": [
            "approver",
            "administrator"
        ],


        "submit": [
            "requester",
            "manager",
            "administrator"
        ],


        "edit": [
            "requester",
            "manager",
            "administrator"
        ],


        "delete": [
            "requester",
            "administrator"
        ],
}




PROJECT_REQUEST_PERMISSION_DETAILS = {


    # -----------------------------
    # Requester
    # -----------------------------
    "requester": [
        "view",
        "create",
        "submit",
        "edit",
        "delete"
    ],




    # -----------------------------
    # Reviewer
    # -----------------------------
    "reviewer": [
        "view"
    ],




    # -----------------------------
    # Approver
    # -----------------------------
    "approver": [
        "view",
        "approve",
        "reject"
    ],




    # -----------------------------
    # Manager
    # -----------------------------
    "manager": [
        "view",
        "submit",
        "edit"
    ],




    # -----------------------------
    # Administrator
    # -----------------------------
    "administrator": [
        "view",
        "create",
        "approve",
        "reject",
        "submit",
        "edit",
        "delete"
    ]
}


For project costing 

PROJECT_COSTING_ACTIONS = {


    # Viewing
    "view_project": [
        "reviewer",
        "approver",
        "manager",
        "administrator"
    ],




    "view_reports": [
        "reviewer",
        "approver",
        "manager",
        "administrator"
    ],


    "export_reports": [
        "manager",
        "administrator"
    ],




    # Project creation and setup
    "create_project": [
        "manager",
        "administrator"
    ],


    "edit_project": [
        "manager",
        "administrator"
    ],


    "delete_project": [
        "administrator"
    ],




    # WBS / Structure
    "create_wbs": [
        "manager",
        "administrator"
    ],


    "edit_wbs": [
        "manager",
        "administrator"
    ],


    "delete_wbs": [
        "manager",
        "administrator"
    ],




    # Budget
    "configure_budget": [
        "manager",
        "administrator"
    ],


    "submit_budget_adjustment": [
        "manager",
        "administrator"
    ],


    "approve_budget": [
        "approver",
        "administrator"
    ],


    "reject_budget": [
        "approver",
        "administrator"
    ],




    "archive_project": [
        "administrator"
    ],




    # Configuration
    "configure_project_alerts": [
        "manager",
        "administrator"
    ],


    "manage_cost_codes": [
        "administrator"
    ],


    "submit_project": [
        "manager",
        "administrator"
    ],


    "approve_project": [
        "approver",
        "administrator"
    ],


    "reject_project": [
        "approver",
        "administrator"
    ],


    "close_project": [
        "administrator"
    ],




    # -----------------------------
    # Financial visibility
    # -----------------------------
    "view_financials": [
        "reviewer",
        "manager",
        "approver",
        "administrator"
    ],


    "view_dashboard": [
        "reviewer",
        "manager",
        "approver",
        "administrator"
    ],


    "view_transactions": [
        "manager",
        "approver",
        "administrator"
    ],




    # -----------------------------
    # Budget adjustments (reads)
    # -----------------------------
    "view_budget_adjustments": [
        "reviewer",
        "manager",
        "approver",
        "administrator"
    ],


    "view_budget_adjustment_detail": [
        "reviewer",
        "manager",
        "approver",
        "administrator"
    ],


}


PROJECT_COSTING_PERMISSION_DETAILS = {


    # -----------------------------
    # Reviewer
    # -----------------------------
    "reviewer": [
        "view_project",
        "view_reports",
        "view_financials",
        "view_dashboard",
        "view_budget_adjustments",
        "view_budget_adjustment_detail"
    ],




    # -----------------------------
    # Approver
    # -----------------------------
    "approver": [
        "view_project",
        "view_reports",
        "view_financials",
        "view_dashboard",
        "view_transactions",
        "view_budget_adjustments",
        "view_budget_adjustment_detail",
        "approve_budget",
        "reject_budget",
        "approve_project",
        "reject_project"
    ],




    # -----------------------------
    # Manager
    # -----------------------------
    "manager": [
        "view_project",
        "view_reports",
        "export_reports",
        "create_project",
        "edit_project",
        "create_wbs",
        "edit_wbs",
        "delete_wbs",
        "configure_budget",
        "submit_budget_adjustment",
        "configure_project_alerts",
        "submit_project",
        "view_financials",
        "view_dashboard",
        "view_transactions",
        "view_budget_adjustments",
        "view_budget_adjustment_detail"
    ],




    # -----------------------------
    # Administrator
    # -----------------------------
    "administrator": [
        "view_project",
        "view_reports",
        "export_reports",
        "create_project",
        "edit_project",
        "delete_project",
        "create_wbs",
        "edit_wbs",
        "delete_wbs",
        "configure_budget",
        "submit_budget_adjustment",
        "approve_budget",
        "reject_budget",
        "archive_project",
        "configure_project_alerts",
        "manage_cost_codes",
        "submit_project",
        "approve_project",
        "reject_project",
        "close_project",
        "view_financials",
        "view_dashboard",
        "view_transactions",
        "view_budget_adjustments",
        "view_budget_adjustment_detail"
    ]
}

For invoicing INVOICE_ACTIONS = {


    "view": [
        "reviewer",
        "approver",
        "processor",
        "payer",
        "administrator"
    ],




    "approve": [
        "approver",
        "administrator"
    ],




    "reject": [
        "approver",
        "payer",
        "administrator"
    ],




    "process": [
        "processor",
        "administrator"
    ],




    "pay": [
        "payer",
        "administrator"
    ],




    "edit": [
        "processor",
        "administrator"
    ],




    "cancel": [
        "processor",
        "administrator"
    ],




    "delete": [
        "administrator"
    ],




    # Vendor management


    "view_vendor": [
        "processor",
        "administrator"
    ],




    "create_vendor": [
        "processor",
        "administrator"
    ],




    "edit_vendor": [
        "processor",
        "administrator"
    ],




    "deactivate_vendor": [
        "administrator"
    ],




    "manage_vendor_bank_details": [
        "administrator"
    ],




    # Accounting


    "manage_chart_of_accounts": [
        "administrator"
    ],




    "manage_account_mapping": [
        "administrator"
    ],




    "manage_bank_accounts": [
        "administrator"
    ],




    "view_account_ledger": [
        "reviewer",
        "payer",
        "administrator"
    ],




    # Equipment


    "manage_equipment_hire": [
        "processor",
        "administrator"
    ],


}


INVOICE_PERMISSION_DETAILS = {


    "reviewer": [
        "view_approved_requests",
        "view_purchase_orders",
        "view_accounts_payable_queue",
        "view_cash_flow"
    ],




    "approver": [
        "view_invoices",
        "approve_invoice_for_payment_processing"
    ],




    "processor": [
        "view_invoices",
        "convert_approved_requests_to_purchase_orders",
        "manage_accounts_payable_queue",
        "edit_invoice"
    ],




    "payer": [
        "view_accounts_payable_queue",
        "execute_payment"
    ],




    "administrator": [
        "view_approved_requests",
        "view_purchase_orders",
        "view_accounts_payable_queue",
        "view_cash_flow",
        "approve_invoice_for_payment_processing",
        "convert_approved_requests_to_purchase_orders",
        "manage_accounts_payable_queue",
        "edit_invoice",
        "execute_payment",
        "configure_two_point_match_tolerance",
        "delete_invoice"
    ]


}


For inventory 


INVENTORY_ACTIONS = {


    # View stock and inventory ledger
    "view_inventory": [
        "reviewer",
        "approver",
        "manager",
        "administrator"
    ],




    # Submit material consumption requests
    "create_material_consumption": [
        "requester",
        "administrator"
    ],




    # Confirm material receipts
    "confirm_material_receipt": [
        "approver",
        "administrator"
    ],




    # Approve material consumption requests
    "approve_material_consumption": [
        "approver",
        "administrator"
    ],




    # =========================
    # PRODUCT MANAGEMENT
    # =========================


    "create_product": [
        "manager",
        "administrator"
    ],




    "edit_product": [
        "manager",
        "administrator"
    ],




    "delete_product": [
        "administrator"
    ],




    "view_product": [
        "reviewer",
        "approver",
        "manager",
        "administrator"
    ],






    # =========================
    # UNIT OF MEASURE MANAGEMENT
    # =========================


    "create_unit_of_measure": [
        "manager",
        "administrator"
    ],




    "edit_unit_of_measure": [
        "manager",
        "administrator"
    ],




    "delete_unit_of_measure": [
        "administrator"
    ],




    "view_unit_of_measure": [
        "reviewer",
        "approver",
        "manager",
        "administrator"
    ],




    # Configure low stock alert thresholds
    "configure_stock_alert": [
        "manager",
        "administrator"
    ],




    # Manual stock adjustments
    "adjust_stock": [
        "administrator"
    ],


    "manage_locations": [
        "administrator"
    ],




    "manual_stock_adjustment": [
        "administrator"
    ],
    "create_delivery_return": [
        "administrator"
    ],


    "edit_delivery_return": [
        "administrator"
    ],


    "delete_delivery_return": [
        "administrator"
    ],


    "create_delivery_order": [
        "administrator"
    ],


    "edit_delivery_order": [
        "administrator"
    ],


    "delete_delivery_order": [
        "administrator"
    ],


    "approve_material_receipt": [
        "approver",
        "administrator"
    ],


     "create_stock_move": [
        "administrator"
    ],




}


INVENTORY_PERMISSION_DETAILS = {




    "reviewer": [


        "view_stock_on_hand",


        "view_inventory_ledger",


        "view_products",


        "view_unit_of_measure"


    ],




    "approver": [


        "confirm_material_receipts",


        "approve_material_consumption_requests",


        "view_products",


        "view_unit_of_measure"


    ],




    "manager": [


        "configure_low_stock_alert_thresholds",


        "view_products",


        "view_unit_of_measure",


        "create_products",


        "edit_products",


        "create_unit_of_measure",


        "edit_unit_of_measure"


    ],




    "administrator": [


        "view_stock_on_hand",


        "view_inventory_ledger",


        "view_products",


        "view_unit_of_measure",


        "create_products",


        "edit_products",


        "delete_products",


        "create_unit_of_measure",


        "edit_unit_of_measure",


        "delete_unit_of_measure",


        "submit_material_consumption",


        "confirm_material_receipts",


        "approve_material_consumption_requests",


        "configure_low_stock_alert_thresholds",


        "perform_manual_stock_adjustment",


        "manage_locations",


        "create_delivery_order",


        "edit_delivery_order",


        "delete_delivery_order",


        "create_delivery_return",


        "edit_delivery_return",


        "delete_delivery_return",


        "create_stock_move"


    ]


}


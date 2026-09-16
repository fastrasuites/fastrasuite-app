# FastraSuite System Mapping & Data Flow

This document provides a comprehensive mapping of the FastraSuite ecosystem based on the PRD Addendum (v1.1), detailing the interactions between user roles, modules, request types, and the financial costing engine.

## 1. High-Level Architecture & User Layers

FastraSuite separates operational responsibilities across four distinct layers, each interacting with specific modules.

```mermaid
flowchart TD
    subgraph "Field (Mobile)"
        SW[Site Workers / Site Managers]
        PRM[Project Request Module]
        SW -- Initiate Requests --> PRM
    end

    subgraph "Office (Operations)"
        PROC[Procurement & Inventory]
        BOM[Purchase & Inventory Modules]
        PROC -- Process Requests --> BOM
    end

    subgraph "Finance"
        FIN[Accounts / Finance Officers]
        INV[Invoice Module & Finance Ledger]
        FIN -- 3-Way Match & Pay --> INV
    end

    subgraph "Management"
        PM[Project Managers / Directors]
        PCM[Project Costing Module]
        PM -- Monitor & Approve --> PCM
    end

    PRM -. Validates against & Routes to .-> PCM
    PRM -. Auto-creates drafts .-> BOM
    PRM -. Auto-creates drafts .-> INV
    BOM -. Feeds into .-> INV
    INV -. Updates Actuals .-> PCM
```

## 2. Request Types & Routing

All spending and material requests originate from the **Project Request Module** and are routed to back-office modules upon approval. Every request must be tagged with a **WBS Element** and a **Cost Code**.

```mermaid
flowchart LR
    subgraph "Project Request Module (Initiation)"
        PR["Purchase Request"]
        LAB["Labour Request"]
        PC["Petty Cash Request"]
        SR["Subcontractor Request"]
        PE["Plant & Equipment Request"]
        MC["Material Consumption Request"]
    end

    subgraph "Back-Office Modules (Processing)"
        PUR["Purchase Module (Core: Invoice Module)"]
        INV_MOD["Invoice Module"]
        INVENT["Inventory Module"]
    end

    PR -->|Converted to PO| PUR
    LAB -->|Payment Processed| INV_MOD
    PC -->|Payment Processed| INV_MOD
    SR -->|Converted to PO| PUR
    PE -->|Converted to PO| PUR
    MC -->|Stock Deducted| INVENT
```

## 3. End-to-End Financial Data Flow

This diagram illustrates the lifecycle of a request from submission to final payment, highlighting how the **Budget Validation Gate** and the **Costing Engine** track Committed and Actual amounts.

```mermaid
sequenceDiagram
    actor SW as Site Worker
    participant PRM as Project Request Module
    participant PCM as Project Costing Engine
    actor PM as Project Manager
    participant INV as Invoice Module
    actor FIN as Finance Team

    SW->>PRM: Select WBS & Cost Code
    PRM->>PCM: Check Budget
    PCM-->>SW: Display "Available Budget"
    SW->>PRM: Submit Request
    
    PRM->>PCM: Run Budget Validation Gate
    alt Over Budget
        PCM-->>PM: Hold in Overrun Queue & Notify PM
        PM->>PCM: Approve with Override / Reallocate
    else Within Budget
        PCM-->>PM: Route to PM Approval Queue
        PM->>PCM: Approve Request
    end
    
    PCM-->>PCM: Increase "Committed Amount"
    PRM->>INV: Create Draft Back-Office Record
    
    INV->>FIN: 3-Way Match (PO vs Receipt vs Invoice)
    FIN->>INV: Approve Payment
    
    INV->>PCM: Payment Confirmed
    PCM-->>PCM: Release "Committed Amount"
    PCM-->>PCM: Increase "Actual Amount"
    PCM-->>PCM: Update BvA Dashboard
```

## 4. The 3-Way Match & Inventory Flow

Before any vendor payment is processed in the Invoice Module, the system enforces a strict 3-Way Match to prevent overpayment and ensure materials were actually received on-site.

```mermaid
flowchart TD
    PO["1. Purchase Order (Agreed Price & Qty)"] --> Match{"3-Way Match Logic"}
    MR["2. Material Receipt Logging (Actual Qty Received by Site Sup)"] --> Match
    VI["3. Vendor Invoice (Billed Amount)"] --> Match

    Match -- "Full Match (Within Tolerance)" --> AP[Accounts Payable Queue]
    Match -- "Mismatch" --> Hold[Held / Finance Notified]

    MR -.->|Updates| SOH[Stock On Hand in Inventory]
    AP --> PA[Payment Approval Workflow]
    PA -->|Approved| Actual[Updates Actual Cost in Project Costing]
```

## 5. Costing Engine Budget Formula

The core formula governing the Budget Validation Gate is calculated in real-time for every specific WBS Element + Cost Code combination:

> **Available Budget = Budgeted Amount − Actual Amount − Committed Amount**

*   **Budgeted Amount**: Approved project budget.
*   **Actual Amount**: Confirmed payments (Invoice Module) + Validated Material Consumption (Inventory Module).
*   **Committed Amount**: Approved, but unpaid requests/POs. *(Note: Material Consumption skips this stage and goes directly to Actual).*

## 6. Project & WBS Hierarchy

```mermaid
mindmap
  root((Project))
    WBS_Level_1("Level 1: Phase")
      WBS_Level_2("Level 2: Sub-Phase")
        WBS_Level_3("Level 3: Task (Leaf Element)")
          BudgetLine("Budget Line")
            CostCode("Cost Code e.g., Labour")
            CostCode2("Cost Code e.g., Materials")
          Requests("Transactions")
```
*Budget lines and transactions can **only** be attached to Leaf Elements (the lowest level of the WBS hierarchy).*

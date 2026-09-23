# Product Requirements Document (PRD) & System Design
# AbvFoods Tracker - Cold Drink Manufacturer & Wholesaler Management System

**Document Version:** 1.1.0  
**Date:** 2026-09-23  
**Status:** Approved Specification  
**Target Platform:** Responsive Web Application (Desktop & Mobile PWA)

---

# 1. Executive Summary & Intent

## 1.1 Purpose
AbvFoods Tracker is a simple business management system designed for cold drink manufacturers operating in a B2B wholesale model.

The system manages:
* Production
* Raw material inventory
* Finished goods inventory
* Suppliers and purchases
* Wholesale sales
* Customer payments and outstanding balances
* Returnable crates
* Factory expenses
* Employee salary and advances
* Cash and bank transactions
* Loans and EMIs
* Sales targets
* Business dashboard and reports

The objective is to provide the owner with a clear view of:
* How much was produced
* How much was sold
* Current stock
* Customer outstanding payments
* Supplier payments
* Factory expenses
* Employee payments
* Available cash/bank balance
* Loan obligations
* Monthly sales performance

---

# 2. Technology Stack

## Frontend
* React
* TypeScript
* Vite
* Tailwind CSS
* Shadcn UI
* TanStack Query
* React Hook Form
* Zod

## PWA
* Service Worker
* IndexedDB
* Offline entry support for selected operations

## Backend
* Node.js
* TypeScript
* Fastify
* REST APIs
* Zod Validation

## Database
* PostgreSQL
* Prisma ORM

## Authentication
* JWT
* HTTP-only Cookies
* Role-Based Access Control (RBAC)

## Deployment
* Docker
* Cloud/VPS deployment

---

# 3. System Architecture

```text
RESPONSIVE WEB APPLICATION / PWA
React + TypeScript + Tailwind
              |
              | HTTPS REST API
              ↓
NODE.JS BACKEND
Fastify + Zod + RBAC
              |
              | Prisma ORM
              ↓
POSTGRESQL DATABASE
```

The application will use a modular architecture with the following business domains:

```text
Dashboard
Products
Suppliers
Purchases
Production
Inventory
Sales
Wholesalers
Payments
Crates
Expenses
Employees
Payroll
Cash & Bank
Loans & EMI
Targets
Reports
Users
```

Important multi-step operations must use database transactions so partial updates cannot corrupt stock or financial records.

---

# 4. Dashboard

The Owner Dashboard provides a quick overview of business performance.

## Today's Summary
Display:
* Production Cases
* Cases Sold
* Sales Amount
* Payment Collected
* Expenses
* Cash/Bank Outflow

## Monthly Summary
Display:
* Total Production
* Total Cases Sold
* Sales Revenue
* Payment Collected
* Customer Outstanding
* Purchase Amount
* Factory Expenses
* Payroll
* EMI Payments

## Inventory Alerts
Display:
* Low Raw Materials
* Low Finished Goods
* Out-of-stock Products

## Financial Summary
Display:
* Cash Balance
* Bank Balance
* Customer Receivables
* Supplier Payables
* Total Loan Outstanding
* EMI Due in Next 30 Days

## Sales Target
Display:
* Monthly Target
* Cases Sold
* Revenue Target
* Revenue Achieved
* Percentage Achieved
* Required Daily Sales

---

# 5. Product / SKU Master

Products represent finished cold drink products.

Example:
```text
Product: Jeera Masala
Volume: 160ml
MRP: ₹10
Bottles Per Case: 30
```

## Product Fields
* Product ID
* Product Name
* Flavor
* Bottle Size
* Bottles Per Case
* MRP Per Bottle
* Default Selling Price Per Case
* Active / Inactive

Example SKU: `JEERA-160-30`

Products can include Jeera, Cola, Orange, Lemon, and different bottle sizes.

---

# 6. Supplier & Purchase Management

## Supplier Master
Store:
* Supplier Name
* Contact Person
* Phone
* Address
* GST Number (optional)
* Current Outstanding

Suppliers provide: Sugar, Flavor, Preforms, Caps, Labels, Shrink Film, Packaging Material, etc.

## Purchase Entry
User selects: Supplier, Material, Quantity, Rate, Total Amount, Paid Amount, Payment Mode, Purchase Date, Invoice Number.

When material is received:
```text
Purchase Entry → Raw Material Stock + → Supplier Outstanding +
```
If payment is made:
```text
Cash/Bank - → Supplier Outstanding -
```

## Supplier Ledger
Show Purchases, Payments, and Outstanding Balance.

---

# 7. Raw Material Inventory

Track raw materials such as Sugar, Flavor Concentrate, Citric Acid, CO2, PET Preforms, Caps, Labels, Shrink Film.

## Raw Material Fields
* Material Name
* Current Quantity
* Unit (`KG`, `LITER`, `PCS`, `ROLL`, `BOX`)
* Reorder Level
* Last Purchase Rate

## Low Stock Alert
If `Current Stock <= Reorder Level`, show a low-stock warning on dashboard.

---

# 8. Recipe / BOM Management

Each product has a standard production recipe.

Example:
```text
Jeera 160ml (Standard Batch: 1,000 Liters)
Sugar: 95 KG
Flavor: 5 L
Citric Acid: 2 KG
CO2: 12 KG
Preforms: XXXX PCS
Caps: XXXX PCS
Labels: XXXX PCS
Shrink Film: XX Rolls
```
Production batches store the recipe used during production so previous history remains unchanged.

---

# 9. Production Management

## Create & Complete Production Batch
User selects Product, Production Date, Batch Size, Actual Cases Produced.
System calculates required raw materials using the recipe and validates stock.

Atomic operation:
```text
Check Raw Material → Deduct Raw Material → Create Production Batch → Add Finished Goods
```

Each batch stores Batch Number, Product, MFG Date, EXP Date, Cases Produced (e.g. Batch `J26092301`).

---

# 10. Production Loss / Rejection

Categories: Bottle Burst, Cap Defect, Liquid Spillage, Label Defect, Other.
Fields: Batch, Loss Type, Quantity, Notes.
System calculates `Production Yield %`.

---

# 11. Finished Goods Inventory

Tracked by Product, Batch, MFG Date, EXP Date, Available Cases.
Older batches are dispatched first (FIFO).

---

# 12. Inventory Transaction History

Complete ledger of all stock movements:
`PURCHASE`, `PRODUCTION_CONSUMPTION`, `PRODUCTION_OUTPUT`, `SALE`, `SALE_RETURN`, `DAMAGE`, `STOCK_ADJUSTMENT`.

---

# 13. Wholesaler Management

Store Business Name, Contact Person, Mobile, Address, Credit Limit, Current Outstanding, Crates Held, Pricing Tier.
Displays Total Sales, Total Payments, Outstanding Balance, Crates Outstanding, Recent Orders.

---

# 14. Sales & Billing

Create Sales Order $\rightarrow$ Check Finished Goods Stock $\rightarrow$ Confirm:
```text
Finished Goods - → Sales Invoice Created → Customer Outstanding + → Crates Issued +
```
Invoice statuses: `PAID`, `PARTIAL`, `UNPAID`.

---

# 15. Wholesaler Ledger

Every financial transaction appears in the customer ledger:
Types: Invoice, Payment, Credit Note, Cheque Bounce, Bounce Charge, Adjustment.

---

# 16. Payment Collection

Supported modes: `CASH`, `UPI`, `NEFT_RTGS`, `CHEQUE`, `PDC`, `CREDIT_NOTE`.
Store Customer, Amount, Payment Mode, Reference Number, Date, Bank Account.

---

# 17. Cheque / PDC Management

Statuses: `PENDING`, `CLEARED`, `BOUNCED`.
When cleared: Customer Outstanding - , Bank Balance +.
When bounced: Payment reversed, Customer outstanding restored, optional bounce charge added.

---

# 18. Crate Management

Crate transaction history: `ISSUED`, `RETURNED`, `DAMAGED`, `LOST`, `ADJUSTMENT`.
Tracks crate outstanding per wholesaler.

---

# 19. Sales Targets

Horizons: Monthly, Quarterly, Yearly. Metrics: Cases & Revenue.
Calculates % Target Achieved, % Time Elapsed, Remaining Cases/Revenue, Required Daily Cases/Revenue.

---

# 20. Factory Expenses

Fields: Date, Category, Amount, Payment Mode, Cash/Bank Account, Reference Number, Notes.
Categories: Electricity, Diesel/Generator, Freight/Transport, Factory Maintenance, Factory Supplies, Loan Interest, Miscellaneous.

---

# 21. Employee Management

Fields: Name, Phone, Designation, Wage Type (`MONTHLY_FIXED`, `DAILY_WAGE`), Base Salary/Rate, Joining Date, Status.

---

# 22. Salary Advance

Record advance given $\rightarrow$ Employee profile shows current advance balance.

---

# 23. Payroll

Monthly calculation:
$$\text{Gross Salary} - \text{Advance Deduction} = \text{Net Salary Payable}$$
Salary payment automatically creates a cash/bank transaction.

---

# 24. Cash & Bank Management

Accounts: `Factory Cash`, `Current Bank Account`, `UPI Account`.
Money In (Sales, Owner Funds) & Money Out (Supplies, Expenses, Salaries, EMIs, Advances).
Displays Cash Balance, Bank Balance, Total Available Balance.

---

# 25. Loans & EMI Management

Lender Master: Name, Type, Loan Account #, Principal Amount, Outstanding, Interest Rate, EMI, Tenure, Start Date.
EMI Schedule: Installment #, Due Date, EMI Amount, Principal, Interest, Status (`UPCOMING`, `PAID`, `OVERDUE`).
Payment: Cash/Bank - , Principal Outstanding - , Interest $\rightarrow$ Expense, EMI $\rightarrow$ `PAID`.

---

# 26. Reports

V1 simple reports: Sales, Collection, Production, Inventory, Expense, Payroll, Finance.
Supports Date filtering, Search, Export to Excel/CSV.

---

# 27. Users & Role-Based Access

Roles: `OWNER` (Full access), `FACTORY_MANAGER` (Production, Recipe, Raw & Finished Stock, Rejections, Expenses), `DISPATCH_SALES` (Wholesalers, Sales Orders, Payments, Crates, Stock Read-only), `ACCOUNTANT` (Sales, Payments, Suppliers, Purchases, Expenses, Payroll, Loans/EMI, Cash/Bank, Reports).

---

# 28. Audit History

Records User, Action, Record, Previous Value, New Value, Date & Time for sensitive operations.

---

# 29. Offline PWA

Supported offline: Production Entry Draft, Expense Entry, Crate Return, Dispatch Draft, Physical Stock Count.
IndexedDB storage with auto-sync. Sensitive financial actions require active connection.

---

# 30. Core API Structure

```text
/api/v1/auth
/api/v1/dashboard
/api/v1/products
/api/v1/suppliers
/api/v1/purchases
/api/v1/raw-materials
/api/v1/inventory
/api/v1/recipes
/api/v1/production
/api/v1/wholesalers
/api/v1/sales
/api/v1/payments
/api/v1/crates
/api/v1/targets
/api/v1/expenses
/api/v1/employees
/api/v1/payroll
/api/v1/accounts
/api/v1/finance
/api/v1/reports
/api/v1/users
```

---

# 31. Important Business Transactions

* **Production:** Raw Material - , Finished Goods + , Production Batch +
* **Purchase:** Raw Material + , Supplier Outstanding +
* **Supplier Payment:** Cash/Bank - , Supplier Outstanding -
* **Sale:** Finished Goods - , Customer Outstanding + , Crates Outstanding +
* **Customer Payment:** Cash/Bank + , Customer Outstanding -
* **Expense:** Cash/Bank - , Expense +
* **Salary Advance:** Cash/Bank - , Employee Advance +
* **Payroll:** Salary Expense + , Employee Advance - , Cash/Bank -
* **EMI:** Cash/Bank - , Loan Principal - , Interest Expense +

---

# 32. Main Database Entities

`users`, `products`, `suppliers`, `supplier_ledger`, `raw_materials`, `purchases`, `purchase_items`, `recipes`, `recipe_ingredients`, `production_batches`, `production_losses`, `inventory_transactions`, `wholesalers`, `sales_orders`, `sales_order_items`, `wholesaler_ledger`, `wholesaler_payments`, `crate_transactions`, `sales_targets`, `factory_expenses`, `employees`, `salary_advances`, `payroll_records`, `accounts`, `account_transactions`, `lenders`, `emi_schedules`, `audit_logs`.

---

# 33. V1 Scope & Success Criteria

V1 prioritizes: **Simple Data Entry + Accurate Stock + Accurate Outstanding + Clear Cash Flow + Useful Dashboard**

The owner can open the app and instantly know:
* Today's Production, Sales, Collections, Expenses
* Current Stock & Low-Stock Warnings
* Cash & Bank Balances, Customer Receivables, Supplier Payables
* Loans & Upcoming EMIs
* Monthly Sales Target Achievement %

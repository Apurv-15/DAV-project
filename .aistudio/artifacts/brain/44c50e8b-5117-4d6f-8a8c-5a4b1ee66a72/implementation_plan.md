# GLOBAL INSIGHT — Production-Readiness & Architectural Hardening Plan

This action plan resolves all four architectural loopholes identified during our full-stack codebase audit, upgrading **GLOBAL INSIGHT** from an interactive prototype into a resilient, production-grade analytical platform where custom file uploads, schema remapping, non-destructive row cleaning, client–server persistence, and multi-turn AI Analyst threads operate seamlessly end-to-end.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions incorporate your confirmed Phase 1 choices to close every production loophole without breaking the existing Monochrome Swiss Editorial design or cinematic video hero.

- **Confirmed Decision 1 — Hybrid Real-Row Aggregation with Automatic Benchmark Fallback**: When a user uploads a custom CSV or XLSX dataset, all 10 dashboard charts and 6 KPIs (`revenueByCountry`, `revenueByCategory`, `paymentMethodDist`, `revenueOverTime`, `monthlySalesTrends`, `topProducts`, `discountVsRevenue`, `customerBehavior`, and `rfmSegments`) will be computed directly from the uploaded rows whenever the corresponding semantic columns are present, and gracefully fall back to scaled benchmark distributions only for unmapped dimensions.
- **Confirmed Decision 2 — Full Client–Server API Sync + Browser Storage Persistence**: Uploaded datasets, cleaning configurations, schema role changes, and per-dataset AI Analyst chat histories will synchronize with the Express `/api/datasets` backend registry and persist in browser storage (`localStorage` with quota-safe compression) so refreshing the page or querying `/api/datasets/:id/ask` always targets the exact active dataset.
- **Confirmed Decision 3 — Live Row-Level Cleaning, Dynamic Schema Re-Indexing & Production Guardrails**:
  1. **Live Row-Level Transformation**: Toggling cleaning rules (deduplication, median/mode imputation, ISO-8601 date standardization, negative amount reconciliation, and category normalization) will transform the actual `cleanedPreviewRows` in the side-by-side inspector table.
  2. **Dynamic Dashboard & SKU Re-Indexing on Schema Remap**: Changing a column's semantic role in the Schema Audit table will immediately recompute `baseAggregations`, `aiInsights`, `chartRecommendations`, and the `entityIndex` SKU catalog.
  3. **Global Error Boundary & API Validation Guardrails**: A React Error Boundary with recovery controls and server-side request validation/sanitization on all `/api/*` endpoints will prevent unhandled crashes.

---

## 1. Overview & Core Concept

- **What It Does**: Eliminates every disconnect between the UI controls and the underlying data engine so that every user action—uploading a custom file, remapping a column, toggling a cleaning rule, switching datasets, or refreshing the browser—produces mathematically consistent, persistent results across all 8 views and the server-side Gemini AI Analyst.
- **Target Audience / Persona**: Enterprise data analysts, e-commerce merchandising directors, and executive stakeholders auditing real CSV/XLSX exports alongside 1.5M-row benchmark repositories.
- **Key Value**: 100% end-to-end data integrity—no silent fallback to stale datasets on the backend, no static preview rows during cleaning, and no lost work on page reload.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Custom Upload → Real Dashboard Aggregation**: A user drops a custom CSV/XLSX file. The engine parses up to 50,000 rows, aggregates real country, category, date, payment, and product totals (scaling proportionally if the file exceeds the chunk), syncs the dataset to `POST /api/datasets/upload`, persists metadata locally, and opens the dashboard with real charts.
  2. **Interactive Schema Remapping → Instant Re-Aggregation**: In **Page 3 (Data Profiling)**, if a user reassigns a column to `Product Category`, `Total Revenue`, or `Product Name / SKU`, the platform immediately recalculates the 10 dashboard charts, automated insights, and the AI Analyst's `entityIndex`.
  3. **Configurable Cleaning → Live Row Inspector**: In **Page 4 (Cleaning Engine)**, toggling rules and clicking **Apply Cleaning Rules & Update Parquet** mutates the actual `cleanedPreviewRows` shown in the bottom inspector table (e.g., removing duplicate `order_id` rows, replacing `NULL` ratings with the median, converting `DD/MM/YYYY` dates to `YYYY-MM-DD`, and fixing negative revenues) and syncs with `POST /api/datasets/:id/clean`.
  4. **Dataset-Scoped AI Analyst Thread**: Navigating to **AI Analyst** loads the conversation history specific to `activeDataset.id`, auto-scrolls to new responses, and ensures `/api/datasets/:id/ask` has the exact dataset synchronized on the server.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Strictly preserves the **Pure Monochrome Swiss Editorial** system (`#09090B` Obsidian, `#FFFFFF` Pure White, `#F4F4F5` Alabaster, `#52525B` Slate, `#71717A` Muted Silver) and the **Editorial Cinematic Video Hero** (`Instrument Serif` 80px display + `Inter` / `Plus Jakarta Sans` UI + `JetBrains Mono` tabular numerals).
  - *Single-Elevation & Zero-Slop Discipline*: Clean 1px hairline borders (`border-black/10`), tabular numerals (`font-mono-tabular`) across all tables and KPIs, and zero decorative pulsing dots or colored badges.
- **Interactive Feedback & Motion**:
  - Smooth GSAP page reveals, magnetic button physics, auto-scrolling chat container on new AI messages, and a clean monochrome **Production Error Boundary** fallback screen with a 1-click state reset if a corrupted file or unexpected runtime exception occurs.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Hybrid Real-Row OLAP Aggregation Engine**
  - *Chosen Approach*: Build a dedicated `buildHybridAggregationsFromRows` pipeline that groups uploaded rows by mapped `country`, `category`, `date`, `payment_method`, `discount`, `customer_id`, and `product`, and merges them with benchmark fallback series only for any unmapped semantic roles.
  - *Why*: Real-world CSV uploads often have 5–8 columns rather than all 12 canonical e-commerce columns. A hybrid aggregator guarantees 100% real numbers for every column present in the user's file while preventing empty/broken dashboard sections when optional columns (like payment method or discount) are omitted.
  - *Alternatives Considered*: Requiring all 12 columns strictly (rejected because it rejects valid partial datasets) or using purely synthetic numbers for uploaded files (rejected because it is a major analytical loophole).
- **Decision 2: Dual-Layer Persistence (Backend Express Registry + Quota-Safe Browser Storage)**
  - *Chosen Approach*: Hydrate initial state from `GET /api/datasets` merged with `localStorage` (`global_insight_datasets_v1` and `global_insight_chats_v1`), and push all creates/updates/deletes to the Express server.
  - *Why*: Browser `localStorage` has a ~5MB cap. By storing compact dataset profiles + 150 preview rows in `localStorage` while syncing the full dataset object to the Express server's memory store, the app survives browser refreshes without hitting `QuotaExceededError`.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & End-to-End Synchronization Diagram

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                   PRODUCTION CLIENT WORKSPACE (React + GSAP)                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │ Global Production Error Boundary (Crash Recovery & State Reset Guard)       │  │
│  └──────────────────────────────────────┬──────────────────────────────────────┘  │
│                                         ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │ Unified Dataset & Chat State Manager (Hydrated from API + LocalStorage)     │  │
│  ├──────────────────────┬───────────────────────────┬──────────────────────────┤  │
│  │ Hybrid Row OLAP      │ Live Row-Level Cleaner &  │ Dataset-Scoped AI Chat   │  │
│  │ Aggregator           │ Dynamic Schema Re-Indexer │ Thread & Auto-Scroll     │  │
│  └──────────┬───────────┴─────────────┬─────────────┴─────────────┬────────────┘  │
└─────────────┼─────────────────────────┼───────────────────────────┼───────────────┘
              │ POST /api/datasets      │ POST /api/datasets/:id    │ POST /api/datasets/:id/ask
              │ /upload & DELETE /:id   │ /clean & /remap           │ (Grounded OLAP Context)
              ▼                         ▼                           ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                     EXPRESS ANALYTICAL BACKEND (server.ts)                        │
│  ┌────────────────────────────────────┐   ┌────────────────────────────────────┐  │
│  │ Synchronized Datasets Registry     │   │ @google/genai (gemini-3.8-flash)   │  │
│  │ (GET/POST/PUT/DELETE /api/datasets)│◄─►│ Request Validator & Grounded Proxy │  │
│  └────────────────────────────────────┘   └────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State Synchronization

1. **Hybrid Real-Row Aggregation (`buildHybridAggregationsFromRows`)**:
   - Scans `sampleRows` using `schemaMapping`:
     - **Countries**: Groups net revenue and order counts by mapped `country` column; maps ISO codes and coordinates via `COUNTRY_COORDINATES` (with deterministic coordinates for additional sovereign markets).
     - **Categories**: Groups revenue, orders, units, average rating, and discount by mapped `category` column.
     - **Time Series**: Parses `date` column into monthly buckets (`Jan`–`Dec`) to build real `revenueOverTime` and `monthlySalesTrends`.
     - **Payment Methods & Top Products**: Groups by `payment_method` and `product` to populate the donut chart and top ranked SKUs table.
     - **Proportional Scaling**: Multiplies sample sums by `cleanedRowCount / sampleRows.length` so full-dataset KPIs match the total file scale.
2. **Real Row-Level Cleaning (`cleanRowsWithConfig`)**:
   - Transforms `rawPreviewRows` into `cleanedPreviewRows` according to the active `CleaningConfig`:
     - Removes duplicate composite/order keys when `removeDuplicates` is enabled.
     - Drops or imputes null cells (using column median/mode) based on `missingValueStrategy`.
     - Normalizes `DD/MM/YYYY` or slash-delimited dates to strict `YYYY-MM-DD` when `standardizeDates` is enabled.
     - Converts negative revenue/price values via formulaic recalculation or row exclusion based on `handleInvalidAmounts`.
     - Trims whitespace and title-cases category labels when `normalizeCategories` is enabled.
3. **Dynamic Schema Remapping (`recomputeDatasetOnSchemaChange`)**:
   - Whenever a user changes a column's `SemanticFieldRole` in the Profiling table, recomputes `schemaMapping`, `chartRecommendations`, `baseAggregations`, `aiInsights`, and `entityIndex`, then persists the updated dataset to both client storage and the backend server.
4. **Client–Server Sync & Per-Dataset AI Chat Persistence**:
   - Adds `GET /api/datasets`, `PUT /api/datasets/:id`, and `DELETE /api/datasets/:id` on the Express server alongside `POST /api/datasets/upload` and `POST /api/datasets/:id/clean`.
   - Stores AI Analyst chat threads keyed by `dataset.id` so switching between datasets preserves each dataset's analytical conversation and automatically initializes a fresh executive welcome summary for newly uploaded datasets.

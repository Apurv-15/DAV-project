# Lumora — Universal Autonomous Data & Document Analytics Platform

Rebrand the platform to **Lumora** and transform the landing experience into a domain-agnostic "Analyse Anything" intelligence studio featuring an interactive **Power BI-Style Complete Automation Pipeline Bento Grid** that showcases how any dataset or document (Agriculture, Finance, Healthcare, Logistics, or E-Commerce) moves from raw upload to blueprint-drafted dashboards and grounded AI insights with zero manual setup.

## User Review & Critical Decisions

> [!IMPORTANT]
> All core branding, Bento Grid capabilities, and dataset scope choices have been confirmed from your selections:

- **Confirmed Brand Identity**: **Lumora** — *Autonomous Universal Data & Document Intelligence*. Applied across the navigation wordmark, hero statement, footer, and page metadata.
- **Confirmed Homepage Bento Grid Scope**: A 4-module asymmetric **Complete Automation Pipeline Bento Grid** combining:
  1. **End-to-End 5-Stage Automation Pipeline vs. Manual Power BI Comparison** (`col-span-2` marquee card with interactive stage inspector).
  2. **Universal Multi-Format Ingestion Engine** (`col-span-1` tile showcasing CSV, XLSX, Parquet, JSON, PDF, DOCX, and TXT universal parsing).
  3. **Live Blueprint Sketch-to-Chart (`#2e6fff`) & 10-View Auto-BI Studio** (`col-span-1` tile with interactive blueprint curve preview and direct launch to the Analytics Studio).
  4. **Multi-Domain Schema Auto-Mapper & Grounded Hybrid AI Analyst** (`col-span-2` tile allowing users to preview how Lumora auto-maps columns across *Agriculture*, *Healthcare*, *Finance*, and *Global Commerce* alongside a live AI query preview).
- **Confirmed Dataset Repository Scope**: Preserve the existing verified benchmark datasets in the repository while highlighting universal multi-domain schema mapping across the Homepage Bento Grid and the Upload workspace.

---

## 1. Overview & Core Concept

- **What It Does**: Positions **Lumora** as a zero-configuration alternative to traditional manual BI tools (like Power BI or Tableau). Instead of spending hours writing DAX formulas, cleaning columns by hand, and dragging fields onto blank canvases, users drop any spreadsheet or formal document into Lumora and receive automated schema mapping, non-destructive cleaning, blueprint-sketched visual dashboards, and grounded AI answers.
- **Target Audience / Persona**: Data analysts, researchers, operations leads, and academic/enterprise teams working across diverse domains (agricultural yield records, financial ledgers, clinical cohorts, or global retail transactions).
- **Key Value**: Replaces manual ETL and manual chart building with an autonomous 5-stage pipeline while maintaining 100% mathematical transparency and auditability.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Universal Hero Experience**: Users land on the **Lumora** hero section featuring the headline *"Analyse anything. From raw files to living intelligence."* with direct actions to **Upload Any Dataset or Document** or **Launch Live Studio (1.48M Rows)**.
  2. **Interactive Automation Bento Grid**: Below the hero, users explore the 4-card asymmetric Bento Grid:
     - Click through the **Manual BI vs. Lumora Autonomous Pipeline** comparison toggle to see how 5 manual workflow bottlenecks become 0-click automated stages.
     - Switch between domain presets (**Agriculture & Crop Yield**, **Clinical & Healthcare**, **Financial Ledgers**, **Global Commerce**) inside the **Multi-Domain Schema Auto-Mapper** Bento tile to inspect live column-to-role bindings.
     - Click any Bento card's action link to jump directly to the corresponding workspace (`Upload`, `Cleaning & Profiling`, `Analytics Studio`, or `AI Analyst`).
  3. **Multi-Domain Upload Hints**: The Upload workspace displays clear domain examples (Agricultural yields, Financial reports, PDF/DOCX tables, CSV/Parquet logs) so users know any file format or topic is supported.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: **Monochrome Swiss Editorial & Architectural Blueprint Precision**.
  - *Color Palette & Mood*:
    - Dominant Canvas (60%): Cool Alabaster (`#F4F4F5`) and high-contrast Obsidian (`#09090B`) feature band.
    - Structural Surfaces (30%): Pure architectural white cards (`#FFFFFF`) and dark studio slate (`#101014`) with crisp `1px solid` hairline borders (`border-black/10` / `border-white/10`).
    - Accent Budget (10%): Blueprint drafting cobalt (`#2e6fff`) for architectural sketch curves and active pipeline indicators, paired with emerald (`#16A34A`) for verified data quality states.
  - *Typography & Hierarchy*: Editorial serif display headlines (`clamp(2.5rem, 4.5vw, 4.25rem)`, `text-wrap: balance`) paired with clean geometric sans body copy and strict tabular monospace numerals (`JetBrains Mono`, `tabular-nums`) for all counters, row counts, and latency metrics.
  - *Component Styling & Layout*: Full 1440px desktop presence with a 12-column asymmetric Bento Grid (`gap-6`, `rounded-[24px]` outer containers, single-elevation depth, zero nested card clutter, and unboxed metadata with `·` separators).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Interactive Domain Switcher Inside the Bento Grid (Without Cluttering the Dataset Registry)**
  - *Chosen Approach*: Embed an interactive 4-domain schema inspector (*Agriculture*, *Finance*, *Healthcare*, *E-Commerce*) directly inside the Bento Grid while keeping the active repository focused on the existing datasets.
  - *Why*: Immediately proves to evaluators and users that Lumora's engine understands agricultural columns (`Crop_Variety`, `Yield_Tonnes`, `Rainfall_mm`, `Soil_pH`), financial metrics, and clinical records without adding synthetic datasets to the user's storage table.
- **Decision 2: Power BI Comparison Framed Around Workflow Automation**
  - *Chosen Approach*: Contrast traditional BI (manual CSV cleaning, manual relationship modeling, manual DAX formulas, static charts) directly against Lumora's 5-stage autonomous pipeline inside the lead Bento card.
  - *Why*: Communicates the core engineering differentiator—complete pipeline automation—in a scannable, visual format.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     LUMORA UNIVERSAL ANALYTICS PLATFORM                    │
├────────────────────────────────────────────────────────────────────────────┤
│  Top Navigation Bar (3-Zone Contract)                                      │
│  [Lumora Wordmark] ── [Overview · Upload · Analytics · AI Analyst] ── [CTA]│
└───────────────┬────────────────────────────────────────────┬───────────────┘
                │                                            │
                ▼                                            ▼
┌───────────────────────────────────────┐    ┌───────────────────────────────┐
│     HOMEPAGE (OverviewPage)           │    │  UNIVERSAL UPLOAD WORKSPACE   │
│  • Universal "Analyse Anything" Hero  │    │  • Any Format: CSV, XLSX,     │
│  • 4-Metric Live Telemetry Strip      │    │    Parquet, JSON, PDF, DOCX   │
│  • Asymmetric 4-Card Bento Grid:      │    │  • Multi-Domain Schema Hints  │
│    [1] 5-Stage Pipeline vs Manual BI  │    │    (Agriculture, Finance,     │
│    [2] Universal Format Ingestion     │    │     Healthcare, Commerce)     │
│    [3] #2e6fff Blueprint Auto-BI Tile │    └───────────────┬───────────────┘
│    [4] Multi-Domain Mapper + AI Tile  │                    │
└───────────────┬───────────────────────┘                    ▼
                │                            ┌───────────────────────────────┐
                └───────────────────────────►│  AUTONOMOUS ANALYTICAL CORE   │
                                             │  • Multi-Domain Schema Mapper │
                                             │  • Non-Destructive Cleaning   │
                                             │  • 10-View Blueprint Studio   │
                                             │  • 3-Layer Hybrid AI Analyst  │
                                             └───────────────────────────────┘
```

- **Interactive Component & State Mapping**:
  - **Bento Card 1 (Pipeline vs. Manual BI)**: Interactive toggle switching between `Lumora Autonomous Pipeline (0 Manual Steps)` and `Traditional Manual BI (Power BI / Tableau Workflow)` with stage-by-stage time and accuracy comparisons.
  - **Bento Card 2 (Universal Format Ingestion)**: Interactive format selector highlighting how tabular files (`CSV`, `XLSX`, `Parquet`) and unstructured documents (`PDF`, `DOCX`, `JSON`, `TXT`) are parsed into canonical records, with a direct `"Upload Any File"` trigger.
  - **Bento Card 3 (Blueprint Sketch-to-Chart Studio)**: Live SVG cubic-bezier curve preview in `#2e6fff` demonstrating the 8-rule Automated Chart Recommender and `PlotReveal` drafting engine, wired to launch the `Analytics` workspace.
  - **Bento Card 4 (Multi-Domain Schema Auto-Mapper & AI Analyst)**: Interactive domain tab bar (`Agriculture`, `Finance`, `Healthcare`, `Commerce`) showing real-time column-to-semantic-role mappings and a sample grounded AI query for each domain, wired to open the `AI Analyst` or `Profiling` view.

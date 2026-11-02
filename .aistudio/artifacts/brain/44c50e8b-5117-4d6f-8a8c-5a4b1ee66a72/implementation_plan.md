# Blueprint Sketch-to-Reality Analytics Reveal & Custom SVG Revenue Over Time Engine

This plan introduces a one-time **8–10 second Blueprint Pencil-Sketch-to-Reality (`PlotReveal`) live inspection sequence** whenever a user starts or enters the Analytics workspace for a dataset, alongside a complete overhaul of the **01 · Revenue Over Time** visualization using a custom smooth cubic-bezier SVG engine with prior-period comparison, sketch-to-data morphing, and high-contrast interactive tooltips.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> All core design and interaction choices have been confirmed during Phase 1 clarification:

- **Confirmed Decision 1 — 8–10s Live Inspection & Sketch-to-Reality Sequence**: Entering the Analytics workspace runs a one-time (per dataset analysis session, with an on-demand *Replay Inspection* trigger) **8–10 second** orchestrated sequence combining a **Real-Time Data Inspection & Live Fetching Telemetry Banner** with the staggered **PlotReveal** pencil-sketch-and-morph animation across the dashboard.
- **Confirmed Decision 2 — Blueprint Draft Ink Color**: The drafting layer uses **Technical Blueprint Blue Pencil (`#2e6fff`)** with organic SVG fractal-noise displacement grain, diagonal hatching, crop marks, and dimension callouts before morphing and erasing into the crisp **Monochrome Swiss Editorial (`#09090B` / `#FFFFFF`)** cards.
- **Confirmed Decision 3 — Custom SVG Revenue Over Time Visualization**: Replaces the basic Recharts line chart (and fixes the unreadable dark tooltip box) with a **Custom Smooth Cubic-Bezier SVG Trend Engine** featuring sketch-phase flat-line morphing, a dashed prior-period benchmark curve, soft vertical area gradient, headline KPI + YoY growth readout, and a high-contrast interactive crosshair tooltip.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **One-Time Real-Time Inspection & Blueprint Drafting Sequence (8–10s)**: When clicking **Start Analysis** (from Upload, Overview, or Navbar) to enter the Analytics workspace for a dataset, the workspace initiates a live 3-stage inspection pipeline (*01. Inspecting Real-Time Schema & Columnar Blocks* → *02. Fetching Live Telemetry & Drafting Blueprint Geometry* → *03. Morphing Sketch Curves to Verified Aggregations*). While this live status progresses, the header, KPI row, Hero Revenue Over Time panel, and primary analytical tiles draw themselves in textured blue pencil (`#2e6fff`), morph their placeholder lines/bars and zeroed figures (`$0.00M`) to the real dataset numbers, and resolve into the final interactive UI over ~9 seconds.
  2. **One-Time Session Memory + Replay Control**: Once a dataset's live inspection animation has completed, switching between pages (e.g., to AI Analyst or Reports and back to Analytics) opens the dashboard immediately without forcing the user to wait again—while a floating/header **"Replay Live Inspection"** button lets the user re-run the 8–10s blueprint reveal anytime.
  3. **Custom SVG Revenue Over Time Hero Panel**: Upgrades Chart `01 · Revenue Over Time` into a flagship analytical canvas with smooth cubic-bezier path interpolation, a dashed previous-period comparison trajectory, live number count-up during morphing, mode switching (`Smooth Curve`, `Area Gradient`, `Column Bars`), and a crystal-clear interactive crosshair tooltip displaying Monthly Revenue, YoY Growth %, Prior Period Revenue, Orders, and AOV.
- **Target Audience / Persona**: Executive analysts and e-commerce operators who want tangible visual confirmation that their dataset is being actively inspected and plotted from raw telemetry into boardroom-ready charts.
- **Key Value**: Transforms static dashboard mounting into a memorable "draft-to-reality" engineering experience while making the flagship Revenue Over Time chart significantly more informative and legible.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Triggering Start Analysis**: User clicks *Start Analysis*, *Explore 1.48M Live Dataset*, or navigates to *Analytics* on an un-inspected dataset.
  2. **Real-Time Inspection Banner (0.0s – 9.0s)**: A sleek telemetry banner at the top of the Analytics workspace displays a live progress bar (`0% → 100%`), elapsed timer, active stage description (*"Inspecting real-time records & fetching live aggregations..."*), and live row counter counting up to `dataset.cleanedRowCount`.
  3. **Staggered Blueprint Sketch & Morph (0.0s – 9.0s)**:
     - `0.0s – 1.8s`: Workspace header & Global Filter Bar sketch in blueprint blue pencil (`#2e6fff`) with corner crop marks and dimension notes, then resolve.
     - `1.2s – 4.8s`: **01 · Revenue Over Time** hero panel sketches its outer frame, diagonal hatching, and a flat baseline curve with `$0.00M` headline figures; at `~2.8s` the pencil path smoothly morphs into the real 12-month cubic-bezier curve while the headline figure counts up from `$0.00M` to the verified total (e.g., `$148.42M`), then erases the blue pencil strokes to reveal the crisp monochrome chart.
     - `3.0s – 9.0s`: The 6 KPI cards and the adjacent Payment Method & Category/Geographic analytical panels stagger their blueprint sketch-to-reality reveals in sequence, completing the full dashboard transition at ~9.0 seconds.
  4. **Interactive Exploration**: Hovering across the **Revenue Over Time** SVG canvas tracks the nearest month (`Jan 2025` – `Dec 2025`) with a vertical guide line, glowing data node, and a high-contrast floating tooltip (`#09090B` card with crisp `#FFFFFF` & `#A1A1AA` tabular text).
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Technical Blueprint Draft (`#2e6fff` pencil grain with SVG `feTurbulence` + `feDisplacementMap`) resolving into Pure Monochrome Swiss Editorial (`#09090B` Obsidian, `#FFFFFF` Pure White, `#F4F4F5` Alabaster, `#71717A` Slate).
  - *Typography & Hierarchy*: `Plus Jakarta Sans` / `Inter` for UI headers, `Instrument Serif` for editorial accents, and `JetBrains Mono` (`tabular-nums`) for all counting metrics, axis labels, and blueprint dimension tags.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Responsive DOM Measurement for `PlotReveal` inside Fluid Grid Layouts**:
  - *Chosen Approach*: Adapt the reference `PlotReveal` measurement and SVG overlay engine (`measure.ts`, `details.ts`, `plot-layer.tsx`, `timeline.ts`, `grain.tsx`) so it works seamlessly with responsive full-width (`w-full`) dashboard grid cards rather than requiring a fixed `1312px` scaled viewport wrapper.
  - *Why*: Preserves the exact organic pencil grain, diagonal hatching, cubic-bezier path morphing, and geometric number count-up from the prompt while keeping the existing 10-chart Analytics Dashboard responsive across all screen sizes.
- **Decision 2 — One-Time Per-Dataset Execution with Explicit Replay**:
  - *Chosen Approach*: Track `inspectedDatasetIds: Set<string>` in application state (and trigger immediately whenever `onDatasetCreated` or *Start Analysis* is clicked). Once the 9-second inspection completes for a dataset, subsequent tab switches within the same session render instantly, while a **"Replay Live Inspection"** button in the Analytics header allows re-running the animation at any time.
  - *Why*: Honors the user's requirement for a *"one time process whenever clicked start analytics"* without frustrating users during rapid tab switching.
- **Decision 3 — Custom SVG Cubic-Bezier Revenue Engine with Prior-Period Benchmark**:
  - *Chosen Approach*: Build a dedicated `RevenueOverTimeChart` component using native SVG cubic-bezier path generation (`smoothPath`), `usePlotPhase()` integration (flat average line during `"sketch"`, real 12-month trajectory during `"real"`), a dashed prior-year comparison curve, and a custom React state-driven floating tooltip.
  - *Why*: Eliminates the Recharts black-box tooltip legibility bug shown in the screenshot and enables true SVG path morphing during the pencil sketch phase.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           App.tsx (Session State)                          │
│  • inspectedDatasetIds: Record<string, boolean>                            │
│  • Marks dataset for fresh live inspection on "Start Analysis" / Upload    │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                        AnalyticsDashboardPage.tsx                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Live Real-Time Inspection Telemetry Banner (8–10s Sequence)          │  │
│  │ • Progress (0% → 100%), Stage Ticker, Live Row Counter, Replay Btn   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                      │                                     │
│                                      ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ PlotReveal Blueprint Sketch-to-Reality Engine (src/components/plot)  │  │
│  │ • measure.ts & details.ts: Scans [data-plot] boxes, SVG paths, text  │  │
│  │ • timeline.ts: Schedules construction guides, hatching & hi-fi erase │  │
│  │ • plot-layer.tsx: Animates #2e6fff pencil strokes, morphs & counts   │  │
│  │ • grain.tsx: SVG feTurbulence + feDisplacementMap pencil texture     │  │
│  └──────────────────┬───────────────────────────────────┬───────────────┘  │
│                     │                                   │                  │
│                     ▼                                   ▼                  │
│  ┌─────────────────────────────────────┐ ┌──────────────────────────────┐  │
│  │ 01 · RevenueOverTimeHeroChart.tsx   │ │ Staggered KPI & Chart Cards  │  │
│  │ • Headline Revenue + YoY Growth     │ │ • 6 KPI Cards (data-plot)    │  │
│  │ • Smooth Cubic-Bezier SVG Curve     │ │ • Payment Donut & Category   │  │
│  │ • Dashed Prior-Period Benchmark     │ │   Charts with staggered      │  │
│  │ • High-Contrast Crosshair Tooltip   │ │   blueprint reveal delays    │  │
│  └─────────────────────────────────────┘ └──────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

### Interactive Component & State Mapping

1. **PlotReveal Blueprint Engine (`src/components/plot-reveal/*`)**:
   - Implements `PlotReveal`, `usePlotPhase`, `PlotLayer`, `Grain`, `measure`, `collectDetails`, and `schedule` with `--plot: #2e6fff` blueprint pencil color and `.hatch` diagonal stripe utility in `src/index.css`.
   - Configures stagger delays (`HEADER_LEAD`, `STAGGER`) and `TEMPO` so the complete dashboard draft-to-reality reveal spans **8.5 to 9.5 seconds** while syncing with the top Live Inspection status bar.
2. **Real-Time Data Inspection Banner**:
   - Displays a live status bar when a dataset is being inspected for the first time (or when *Replay Live Inspection* is clicked), stepping through real-time inspection phases over 9 seconds with a live transaction counter (`0 → dataset.cleanedRowCount`) and automatic completion transition.
3. **Upgraded `RevenueOverTimeHeroChart` Component**:
   - Reads `usePlotPhase()` so during the `"sketch"` phase it plots a flat average line and `$0.00M` figures, then morphs the SVG cubic-bezier path (`d` attribute) to the real 12-month revenue series (`Jan 2025` – `Dec 2025`) and counts up the headline revenue and YoY growth badge.
   - Supports interactive switching between **Smooth Curve (Line)**, **Gradient Area**, and **Column Bars**, and renders a high-contrast custom hover tooltip showing the exact month, Net Revenue, Prior Period Revenue, YoY Growth %, Order Count, and Average Order Value.

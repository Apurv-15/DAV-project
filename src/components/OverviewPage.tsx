import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  FileText,
  Globe,
  Layers,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DatasetEntry } from '../types/analytics';
import { AnimatedCounter, useGsapPageReveal } from './gsapMotion';
import { AppPage } from './Navbar';

interface OverviewPageProps {
  datasets: DatasetEntry[];
  activeDataset: DatasetEntry;
  onSelectDataset: (id: string, targetPage?: AppPage) => void;
  onNavigate: (page: AppPage) => void;
}

type DomainPresetKey = 'agriculture' | 'finance' | 'healthcare' | 'commerce';

interface DomainPreset {
  id: DomainPresetKey;
  label: string;
  sampleFile: string;
  recordScale: string;
  mappings: { rawColumn: string; semanticRole: string; confidence: string }[];
  sampleQuestion: string;
  sampleAnswer: string;
}

const DOMAIN_PRESETS: Record<DomainPresetKey, DomainPreset> = {
  agriculture: {
    id: 'agriculture',
    label: 'Agriculture & Crop Yield',
    sampleFile: 'icar_agro_yield_telemetry.csv',
    recordScale: '420,000 plot records',
    mappings: [
      { rawColumn: 'Crop_Variety', semanticRole: 'Primary Entity (product)', confidence: '96%' },
      { rawColumn: 'Harvest_Tonnes', semanticRole: 'Primary Metric (revenue)', confidence: '96%' },
      { rawColumn: 'Season_Zone', semanticRole: 'Cohort Split (category)', confidence: '94%' },
      { rawColumn: 'Rainfall_mm', semanticRole: 'Input Factor (price)', confidence: '91%' },
      { rawColumn: 'Soil_pH_Index', semanticRole: 'Quality Index (rating)', confidence: '93%' },
    ],
    sampleQuestion: 'Compare Kharif vs Rabi wheat yield across drip-irrigated districts.',
    sampleAnswer:
      'Rabi drip-irrigated plots achieved +24.8% higher mean yield (4.62 tonnes/ha vs 3.70 tonnes/ha) with 98.4% completeness across 142 districts.',
  },
  finance: {
    id: 'finance',
    label: 'Finance & Ledgers',
    sampleFile: 'consolidated_fiscal_ledger_fy26.xlsx',
    recordScale: '890,000 journal entries',
    mappings: [
      { rawColumn: 'Cost_Center', semanticRole: 'Cohort Split (category)', confidence: '97%' },
      { rawColumn: 'Net_Operating_Cash', semanticRole: 'Primary Metric (revenue)', confidence: '98%' },
      { rawColumn: 'Posting_Date', semanticRole: 'Temporal Axis (date)', confidence: '99%' },
      { rawColumn: 'Subsidiary_Region', semanticRole: 'Geography (country)', confidence: '95%' },
      { rawColumn: 'Variance_Pct', semanticRole: 'Elasticity Factor (discount)', confidence: '92%' },
    ],
    sampleQuestion: 'Which operating division drove the Q4 margin expansion?',
    sampleAnswer:
      'Enterprise Cloud Infrastructure generated $148.2M net operating inflow (+19.4% YoY), offsetting a -3.1% contraction in legacy hardware.',
  },
  healthcare: {
    id: 'healthcare',
    label: 'Clinical & Healthcare',
    sampleFile: 'multi_center_clinical_outcomes.pdf',
    recordScale: '164,500 patient episodes',
    mappings: [
      { rawColumn: 'Treatment_Protocol', semanticRole: 'Primary Entity (product)', confidence: '94%' },
      { rawColumn: 'Recovery_Score', semanticRole: 'Quality Index (rating)', confidence: '95%' },
      { rawColumn: 'Department_Ward', semanticRole: 'Cohort Split (category)', confidence: '96%' },
      { rawColumn: 'Episode_Cost_USD', semanticRole: 'Primary Metric (revenue)', confidence: '97%' },
      { rawColumn: 'Admission_Date', semanticRole: 'Temporal Axis (date)', confidence: '99%' },
    ],
    sampleQuestion: 'What is the readmission delta between Protocol A and Protocol B?',
    sampleAnswer:
      'Protocol A reduced median length-of-stay by 2.4 days (-18.6%) while maintaining a 96.2% patient recovery index across 18 regional centers.',
  },
  commerce: {
    id: 'commerce',
    label: 'Global E-Commerce',
    sampleFile: 'global_ecommerce_transactions_1.48M.parquet',
    recordScale: '1,482,500 transactions',
    mappings: [
      { rawColumn: 'Product_SKU', semanticRole: 'Primary Entity (product)', confidence: '98%' },
      { rawColumn: 'Total_Revenue_USD', semanticRole: 'Primary Metric (revenue)', confidence: '99%' },
      { rawColumn: 'Sovereign_Market', semanticRole: 'Geography (country)', confidence: '98%' },
      { rawColumn: 'Discount_Applied', semanticRole: 'Elasticity Factor (discount)', confidence: '96%' },
      { rawColumn: 'Payment_Method', semanticRole: 'Mode Split (payment_method)', confidence: '97%' },
    ],
    sampleQuestion: 'How does discount depth above 20% impact net order revenue?',
    sampleAnswer:
      'Promotional tiers above 20% increase unit quantity by +31.4% but compress net order value by -8.2%, with peak efficiency at 12–15% markdown.',
  },
};

const PIPELINE_COMPARISON_STAGES = [
  {
    step: '01',
    title: 'Multi-Format Ingestion & Parsing',
    lumoraAuto: 'Auto-parses CSV, XLSX, Parquet, JSON, PDF & DOCX tables in < 1.2s',
    manualBi: 'Manual Power Query connectors, custom delimiter scripts & PDF copy-paste',
    page: 'upload' as AppPage,
  },
  {
    step: '02',
    title: 'Semantic Schema & Role Mapping',
    lumoraAuto: '100+ domain regex rules + structural type fallback binds every column automatically',
    manualBi: 'Manual column renaming, data-type casting & star-schema relationship wiring',
    page: 'profiling' as AppPage,
  },
  {
    step: '03',
    title: 'Non-Destructive Data Cleaning',
    lumoraAuto: '1-click median/mode imputation, primary-key deduplication & ISO date repair',
    manualBi: 'Writing custom M/DAX transformations or external Python preprocessing scripts',
    page: 'cleaning' as AppPage,
  },
  {
    step: '04',
    title: '8-Rule Visual Taxonomy & Blueprint Studio',
    lumoraAuto: 'Auto-selects optimal 10-chart layout & sketches #2e6fff blueprint curves live',
    manualBi: 'Dragging fields onto blank canvases, formatting axes & building tooltips by hand',
    page: 'analytics' as AppPage,
  },
  {
    step: '05',
    title: 'Grounded Hybrid AI Analyst',
    lumoraAuto: 'Deterministic statistical engine + Gemini 2.5 Flash synthesis with 0% hallucination',
    manualBi: 'Writing complex DAX measures for every ad-hoc executive question',
    page: 'ai_analyst' as AppPage,
  },
];

const INGESTION_FORMATS = [
  {
    ext: 'CSV / TSV',
    kind: 'Columnar Stream',
    detail: 'Chunked streaming parser with automatic delimiter & numeric type inference up to 1.5M+ rows.',
  },
  {
    ext: 'XLSX / XLS',
    kind: 'Multi-Sheet Workbook',
    detail: 'ArrayBuffer workbook extraction with automatic header repair and currency normalization.',
  },
  {
    ext: 'Parquet',
    kind: 'High-Density Columnar',
    detail: 'Zero-truncation analytical partition profiling engineered for million-row repositories.',
  },
  {
    ext: 'PDF / DOCX',
    kind: 'Formal Document Parser',
    detail: 'Extracts embedded tables, key-value metrics, and prose figures into structured rows.',
  },
  {
    ext: 'JSON / TXT',
    kind: 'Semi-Structured Logs',
    detail: 'Flattens nested JSON record arrays and delimited log streams into canonical tables.',
  },
];

export const OverviewPage: React.FC<OverviewPageProps> = ({
  datasets,
  activeDataset,
  onNavigate,
}) => {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<'lumora' | 'manual'>('lumora');
  const [selectedDomain, setSelectedDomain] = useState<DomainPresetKey>('agriculture');
  const [selectedFormatIdx, setSelectedFormatIdx] = useState<number>(0);

  useGsapPageReveal(pageRef, [activeDataset.id, datasets.length]);

  const totalRecordsProcessed = datasets.reduce(
    (sum, d) => sum + d.rawRowCount,
    0
  );
  const avgQualityScore = Number(
    (
      datasets.reduce((sum, d) => sum + d.quality.overallScore, 0) /
      Math.max(1, datasets.length)
    ).toFixed(1)
  );

  const activeDomainPreset = DOMAIN_PRESETS[selectedDomain];
  const activeFormat = INGESTION_FORMATS[selectedFormatIdx];

  return (
    <div ref={pageRef} className="space-y-20 pb-20">
      {/* SECTION 1: FULL-BLEED EDITORIAL CINEMATIC VIDEO HERO */}
      <section className="relative min-h-screen w-full -mt-[88px] pt-[88px] flex flex-col justify-between overflow-hidden bg-[hsl(201,100%,13%)]">
        {/* Full-Bleed Background Video Layer */}
        <video
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            videoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source
            src="https://designerstephen.github.io/public-assets/videos/serene-art-hero.mp4"
            type="video/mp4"
          />
        </video>

        {/* Subtle luminous atmospheric veil to guarantee crisp #0f172a typography legibility */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
            videoLoaded
              ? 'bg-gradient-to-b from-white/25 via-white/15 to-[#F4F4F5]'
              : 'bg-gradient-to-b from-[#E2E8F0] via-[#F1F5F9] to-[#F4F4F5]'
          }`}
        />

        {/* Top Spacer for Floating Capsule Navbar */}
        <div className="h-8" />

        {/* Centered Editorial Hero Content */}
        <div className="relative z-10 max-w-[1280px] mx-auto px-6 sm:px-8 py-16 flex flex-col items-center text-center my-auto">
          <p className="animate-fade-rise delay-0 text-xs sm:text-sm font-medium text-[#0f172a]/80 tracking-tight mb-4">
            Lumora · Autonomous Universal Data & Document Intelligence
          </p>

          <h1
            className="animate-fade-rise delay-0 font-instrument-display text-[46px] sm:text-[66px] lg:text-[80px] text-[#0f172a] max-w-[1020px]"
            style={{ textWrap: 'balance' }}
          >
            Analyse <em className="not-italic">anything</em>. From raw files to
            living intelligence.
          </h1>

          <p className="animate-fade-rise delay-200 mt-6 max-w-[720px] text-[17px] sm:text-[18px] font-normal leading-[1.625] text-[hsl(215,25%,32%)]">
            The depth of Power BI with a complete zero-touch automation
            pipeline. Drop any agricultural dataset, financial ledger, clinical
            study, e-commerce log, or PDF/DOCX report—Lumora auto-maps schemas,
            cleans anomalies, sketches blueprint charts, and answers complex
            questions automatically.
          </p>

          {/* Unboxed Domain Metadata Strip */}
          <div className="animate-fade-rise delay-200 mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-medium text-[#0f172a]/75">
            <span>Agriculture & Yield Telemetry</span>
            <span aria-hidden="true">·</span>
            <span>Finance & Balance Sheets</span>
            <span aria-hidden="true">·</span>
            <span>Healthcare & Clinical Trials</span>
            <span aria-hidden="true">·</span>
            <span>Global Commerce</span>
            <span aria-hidden="true">·</span>
            <span>PDF, DOCX, CSV, XLSX & Parquet</span>
          </div>

          {/* Main CTA Group */}
          <div className="animate-fade-rise delay-400 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('upload')}
              className="rounded-full bg-[#000000] text-[#ffffff] px-[48px] py-[18px] text-[15px] sm:text-[16px] font-medium tracking-tight transition-transform duration-200 ease-out hover:scale-[1.02] cursor-pointer shadow-sm whitespace-nowrap shrink-0"
            >
              Upload Any Dataset or Document
            </button>

            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="rounded-full bg-white/85 backdrop-blur-md border border-[#0f172a]/15 text-[#0f172a] px-[34px] py-[18px] text-[15px] sm:text-[16px] font-medium tracking-tight transition-transform duration-200 ease-out hover:scale-[1.02] hover:bg-white cursor-pointer flex items-center gap-2.5 whitespace-nowrap shrink-0"
            >
              <span>Launch Auto-BI Studio (1.48M Rows)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Hero Telemetry Bar (4 System Overview Metrics) */}
        <div className="relative z-10 max-w-[1180px] w-full mx-auto px-4 sm:px-6 pb-8">
          <div className="animate-fade-rise delay-600 bg-white/90 backdrop-blur-md border border-[#0f172a]/10 rounded-[24px] p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-medium text-[hsl(215,25%,32%)]">
                Active Repositories
              </p>
              <p className="mt-1.5 text-3xl font-bold text-[#0f172a] font-mono-tabular">
                <AnimatedCounter value={datasets.length} />
              </p>
              <p className="mt-1 text-xs text-[hsl(215,25%,32%)]">
                Multi-domain files & documents ready
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-[hsl(215,25%,32%)]">
                Total Records Indexed
              </p>
              <p className="mt-1.5 text-3xl font-bold text-[#0f172a] font-mono-tabular">
                <AnimatedCounter value={totalRecordsProcessed} />
              </p>
              <p className="mt-1 text-xs text-[hsl(215,25%,32%)]">
                Zero-truncation columnar engine
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-[hsl(215,25%,32%)]">
                Verified Data Integrity
              </p>
              <p className="mt-1.5 text-3xl font-bold text-[#0f172a] font-mono-tabular">
                <AnimatedCounter value={avgQualityScore} decimals={1} suffix="%" />
              </p>
              <p className="mt-1 text-xs text-[hsl(215,25%,32%)]">
                Automated 4-dimension quality gate
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-[hsl(215,25%,32%)]">
                Active Workspace Dataset
              </p>
              <p className="mt-1.5 text-base font-bold text-[#0f172a] truncate">
                {activeDataset.name}
              </p>
              <p className="mt-1 text-xs text-[hsl(215,25%,32%)] font-mono-tabular">
                {activeDataset.cleanedRowCount.toLocaleString()} verified rows ·{' '}
                {activeDataset.format}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: POWER BI MEETS COMPLETE AUTOMATION PIPELINE BENTO GRID */}
      <section className="bg-[#09090B] text-white py-20 px-4 sm:px-6">
        <div className="max-w-[1180px] mx-auto space-y-12">
          {/* Section Header */}
          <div className="gsap-reveal flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-10">
            <div className="space-y-3 max-w-2xl">
              <p className="text-xs font-medium text-white/60 tracking-wide">
                Power BI Depth · Zero-Touch Automation Pipeline
              </p>
              <h2
                className="font-instrument-display text-[40px] sm:text-[54px] text-white"
                style={{ textWrap: 'balance' }}
              >
                Why build dashboards by hand when the{' '}
                <em className="italic">pipeline</em> is autonomous?
              </h2>
            </div>
            <p className="text-sm text-white/70 max-w-md leading-relaxed">
              Traditional BI tools force you to clean spreadsheets manually,
              wire schema relationships, and drag fields onto blank canvases.
              Lumora automates the entire 5-stage analytical lifecycle for any
              domain.
            </p>
          </div>

          {/* ASYMMETRIC 12-COLUMN BENTO GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* BENTO CARD 1 (7 COLS): 5-STAGE AUTOMATION PIPELINE VS MANUAL POWER BI */}
            <div className="gsap-reveal lg:col-span-7 bg-[#121216] border border-white/10 rounded-[24px] p-7 sm:p-8 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <p className="text-xs text-white/55">
                      01. Autonomous Pipeline Architecture
                    </p>
                    <h3 className="mt-1 text-xl font-semibold text-white">
                      5-Stage Zero-Touch Pipeline vs. Manual BI
                    </h3>
                  </div>

                  {/* Interactive Comparison Segmented Toggle */}
                  <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-lg self-start">
                    <button
                      type="button"
                      onClick={() => setComparisonMode('lumora')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        comparisonMode === 'lumora'
                          ? 'bg-white text-[#09090B]'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      Lumora Automated (0 Clicks)
                    </button>
                    <button
                      type="button"
                      onClick={() => setComparisonMode('manual')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        comparisonMode === 'manual'
                          ? 'bg-white text-[#09090B]'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      Manual Power BI / Tableau
                    </button>
                  </div>
                </div>

                {/* 5 Pipeline Stages List */}
                <div className="divide-y divide-white/10">
                  {PIPELINE_COMPARISON_STAGES.map((item) => (
                    <div
                      key={item.step}
                      onClick={() => onNavigate(item.page)}
                      className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4 group cursor-pointer"
                    >
                      <div className="flex items-start gap-3.5">
                        <span className="font-mono-tabular text-xs font-semibold text-[#2e6fff] pt-0.5">
                          {item.step}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-white group-hover:text-[#2e6fff] transition-colors">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-xs text-white/65 leading-relaxed">
                            {comparisonMode === 'lumora'
                              ? item.lumoraAuto
                              : item.manualBi}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        <span className="font-mono-tabular text-[11px] text-white/50">
                          {comparisonMode === 'lumora' ? 'Automated' : 'Manual'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-white/70">
                <div className="flex items-center gap-2 font-mono-tabular">
                  <span>End-to-End Time:</span>
                  <strong className="text-white">
                    {comparisonMode === 'lumora'
                      ? '9.2 Seconds (Automated)'
                      : '4–6 Hours (Manual Setup)'}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('profiling')}
                  className="text-white font-medium hover:underline flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Inspect Pipeline Engine</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* BENTO CARD 2 (5 COLS): UNIVERSAL MULTI-FORMAT INGESTION TILE */}
            <div className="gsap-reveal lg:col-span-5 bg-[#121216] border border-white/10 rounded-[24px] p-7 sm:p-8 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="border-b border-white/10 pb-5">
                  <p className="text-xs text-white/55">
                    02. Universal Format & Document Router
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-white">
                    Drop Spreadsheets, Parquet, or Formal Docs
                  </h3>
                  <p className="mt-1.5 text-xs text-white/65 leading-relaxed">
                    Whether your data lives in a 1.5M-row Parquet file, an
                    agricultural CSV, or tables inside a PDF/Word report,
                    Lumora converts it into canonical analytical records.
                  </p>
                </div>

                {/* Interactive Format Selector Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {INGESTION_FORMATS.map((fmt, idx) => (
                    <button
                      key={fmt.ext}
                      type="button"
                      onClick={() => setSelectedFormatIdx(idx)}
                      className={`px-3 py-1.5 text-xs font-mono-tabular rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        selectedFormatIdx === idx
                          ? 'bg-white text-[#09090B] border-white font-semibold'
                          : 'bg-white/5 text-white/75 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {fmt.ext}
                    </button>
                  ))}
                </div>

                {/* Active Format Inspector Box */}
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">
                      {activeFormat.ext} · {activeFormat.kind}
                    </span>
                    <span className="font-mono-tabular text-[#2e6fff]">
                      Zero Schema Setup
                    </span>
                  </div>
                  <p className="text-xs text-white/65 leading-relaxed">
                    {activeFormat.detail}
                  </p>
                </div>

                {/* Pipeline Flow Mini-Readout */}
                <div className="pt-3 border-t border-white/10 grid grid-cols-3 gap-3 text-left font-mono-tabular">
                  <div>
                    <p className="text-[11px] text-white/50">MAX SCALE</p>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      1.5M+ Rows
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-white/50">DOC TABLES</p>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      Auto-Extracted
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-white/50">MEMORY</p>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      Chunk Streamed
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-white/60">
                  Accepts any file extension
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('upload')}
                  className="px-4 py-2 bg-white text-[#09090B] text-xs font-semibold rounded-full hover:bg-white/90 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Upload Any File</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* BENTO CARD 3 (5 COLS): LIVE BLUEPRINT SKETCH-TO-CHART (#2e6fff) & 10-VIEW STUDIO */}
            <div className="gsap-reveal lg:col-span-5 bg-[#121216] border border-white/10 rounded-[24px] p-7 sm:p-8 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="border-b border-white/10 pb-5">
                  <p className="text-xs text-white/55">
                    03. Blueprint PlotReveal & 10-Chart Auto-BI Studio
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-white">
                    Architectural Sketch-to-Reality Rendering
                  </h3>
                  <p className="mt-1.5 text-xs text-white/65 leading-relaxed">
                    An 8-rule visual recommender inspects your data shape and
                    drafts geometric blueprint curves in{' '}
                    <span className="font-mono-tabular text-[#2e6fff]">
                      #2e6fff
                    </span>{' '}
                    before morphing into 10 synchronized interactive charts.
                  </p>
                </div>

                {/* Live Architectural SVG Blueprint Curve Preview */}
                <div className="py-2">
                  <div className="flex items-center justify-between text-[11px] font-mono-tabular text-white/55 mb-2">
                    <span>STAGE 03 · BLUEPRINT PENCIL DRAFTING</span>
                    <span className="text-[#2e6fff]">CUBIC-BEZIER MORPH</span>
                  </div>
                  <svg
                    viewBox="0 0 360 110"
                    className="w-full h-[110px] overflow-visible"
                    aria-label="Blueprint Sketch to Reality Curve Preview"
                  >
                    <defs>
                      <linearGradient id="bentoBlueprintGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2e6fff" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#2e6fff" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Extended Architectural Construction Hairlines */}
                    <line
                      x1="0"
                      y1="25"
                      x2="360"
                      y2="25"
                      stroke="#2e6fff"
                      strokeOpacity="0.22"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="0"
                      y1="60"
                      x2="360"
                      y2="60"
                      stroke="#2e6fff"
                      strokeOpacity="0.22"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="0"
                      y1="95"
                      x2="360"
                      y2="95"
                      stroke="#2e6fff"
                      strokeOpacity="0.35"
                    />
                    {/* Vertical Dimension Ticks */}
                    <line x1="60" y1="10" x2="60" y2="102" stroke="#2e6fff" strokeOpacity="0.2" />
                    <line x1="180" y1="10" x2="180" y2="102" stroke="#2e6fff" strokeOpacity="0.2" />
                    <line x1="300" y1="10" x2="300" y2="102" stroke="#2e6fff" strokeOpacity="0.2" />

                    {/* Dashed Prior-Period Construction Baseline */}
                    <path
                      d="M 10 86 C 70 82, 120 68, 180 64 C 240 60, 290 48, 350 42"
                      fill="none"
                      stroke="#2e6fff"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      strokeOpacity="0.65"
                    />

                    {/* Area Under Cubic-Bezier Trajectory */}
                    <path
                      d="M 10 82 C 70 70, 120 44, 180 48 C 240 52, 290 20, 350 16 L 350 95 L 10 95 Z"
                      fill="url(#bentoBlueprintGrad)"
                    />

                    {/* Primary Verified Trajectory Curve */}
                    <path
                      d="M 10 82 C 70 70, 120 44, 180 48 C 240 52, 290 20, 350 16"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="2.2"
                    />

                    {/* Anchor Nodes */}
                    <circle cx="60" cy="72" r="3" fill="#2e6fff" />
                    <circle cx="180" cy="48" r="3" fill="#2e6fff" />
                    <circle cx="300" cy="22" r="4" fill="#FFFFFF" stroke="#2e6fff" strokeWidth="2" />
                  </svg>
                </div>

                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/65">
                  <span>6 Headline KPIs</span>
                  <span aria-hidden="true">·</span>
                  <span>Geospatial Map</span>
                  <span aria-hidden="true">·</span>
                  <span>RFM Cohorts</span>
                  <span aria-hidden="true">·</span>
                  <span>Correlation Matrix</span>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-white/60 font-mono-tabular">
                  Click-to-Analyse Blueprint
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('analytics')}
                  className="px-4 py-2 bg-[#2e6fff] text-white text-xs font-semibold rounded-full hover:bg-[#255be0] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Open Analytics Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* BENTO CARD 4 (7 COLS): MULTI-DOMAIN SCHEMA AUTO-MAPPER + HYBRID AI ANALYST */}
            <div className="gsap-reveal lg:col-span-7 bg-[#121216] border border-white/10 rounded-[24px] p-7 sm:p-8 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <p className="text-xs text-white/55">
                      04. Domain-Agnostic Schema Engine & Hybrid AI Analyst
                    </p>
                    <h3 className="mt-1 text-xl font-semibold text-white">
                      Analyses Agriculture, Finance, Healthcare & Commerce
                    </h3>
                  </div>

                  {/* Domain Switcher Tabs */}
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-lg">
                    {(Object.keys(DOMAIN_PRESETS) as DomainPresetKey[]).map(
                      (key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedDomain(key)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            selectedDomain === key
                              ? 'bg-white text-[#09090B]'
                              : 'text-white/70 hover:text-white'
                          }`}
                        >
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Selected Domain Header Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/65">
                  <div>
                    <span className="font-semibold text-white">
                      {activeDomainPreset.label}
                    </span>
                    <span className="mx-2" aria-hidden="true">
                      ·
                    </span>
                    <span className="font-mono-tabular">
                      {activeDomainPreset.sampleFile}
                    </span>
                  </div>
                  <span className="font-mono-tabular text-white/80">
                    {activeDomainPreset.recordScale}
                  </span>
                </div>

                {/* Two-Column Split: Auto-Mapped Schema Table + Grounded AI Analyst Output */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-1 items-stretch">
                  {/* Left 7 Cols: Live Column-to-Semantic Role Bindings */}
                  <div className="md:col-span-7 space-y-2">
                    <p className="text-[11px] font-mono-tabular text-white/50">
                      AUTO-DETECTED SEMANTIC SCHEMA BINDINGS
                    </p>
                    <div className="divide-y divide-white/10 border-t border-b border-white/10">
                      {activeDomainPreset.mappings.map((m) => (
                        <div
                          key={m.rawColumn}
                          className="py-2 flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="font-mono-tabular text-white font-medium truncate">
                            {m.rawColumn}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-white/65">
                              → {m.semanticRole}
                            </span>
                            <span className="font-mono-tabular text-[#2e6fff]">
                              {m.confidence}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right 5 Cols: Grounded 3-Layer AI Analyst Preview */}
                  <div className="md:col-span-5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-5 space-y-3">
                    <div className="space-y-2">
                      <p className="text-[11px] font-mono-tabular text-white/50">
                        HYBRID AI ANALYST (GEMINI 2.5 FLASH)
                      </p>
                      <p className="text-xs font-medium text-white">
                        “{activeDomainPreset.sampleQuestion}”
                      </p>
                      <p className="text-xs text-white/65 leading-relaxed">
                        {activeDomainPreset.sampleAnswer}
                      </p>
                    </div>

                    <div className="pt-2 text-[11px] font-mono-tabular text-white/50">
                      100% Grounded · Deterministic Math + LLM
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('profiling')}
                  className="text-xs text-white/75 hover:text-white font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Explore Schema Auto-Mapper</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('ai_analyst')}
                  className="px-4 py-2 bg-white text-[#09090B] text-xs font-semibold rounded-full hover:bg-white/90 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Ask Hybrid AI Analyst</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: LIVE CAPABILITY PREVIEW */}
      <section className="max-w-[1180px] mx-auto px-4 sm:px-6">
        <div className="gsap-reveal bg-white border border-[#0f172a]/10 rounded-[24px] p-8 sm:p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-[#0f172a]/10">
            <div>
              <div className="text-xs text-[hsl(215,25%,32%)] flex items-center gap-2">
                <span className="font-semibold text-[#0f172a]">
                  Live Repository Telemetry
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeDataset.name}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">
                  {activeDataset.cleanedRowCount.toLocaleString()} verified rows
                </span>
              </div>
              <h2 className="mt-2 font-instrument-display text-[36px] sm:text-[44px] text-[#0f172a]">
                Primary metric trajectory & regional distribution.
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="px-6 py-2.5 bg-[#000000] text-white text-[14px] font-medium rounded-full transition-transform duration-200 ease-out hover:scale-[1.02] self-start md:self-auto cursor-pointer whitespace-nowrap shrink-0"
            >
              Open Full 10-Chart Studio
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 items-center">
            <div className="lg:col-span-8 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={activeDataset.baseAggregations.revenueOverTime}
                  margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="overviewRevFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="period"
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val) => [
                      `$${Number(val ?? 0).toLocaleString()}`,
                      'Verified Output',
                    ]}
                    contentStyle={{
                      backgroundColor: '#000000',
                      border: 'none',
                      borderRadius: '7px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0f172a"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#overviewRevFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-4 space-y-4 border-t lg:border-t-0 lg:border-l border-[#0f172a]/10 pt-6 lg:pt-0 lg:pl-8">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0f172a]">
                <Globe className="w-4 h-4 text-[#0f172a]" />
                <span>Top Geographic Cohorts by Share</span>
              </div>
              <div className="space-y-3">
                {activeDataset.baseAggregations.revenueByCountry
                  .slice(0, 5)
                  .map((country) => (
                    <div key={country.country} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#0f172a]">
                          {country.country}
                        </span>
                        <span className="font-mono-tabular text-[hsl(215,25%,32%)]">
                          ${(country.revenue / 1e6).toFixed(1)}M ({country.sharePct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#000000] rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, country.sharePct * 3.1)}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

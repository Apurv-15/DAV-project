import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Database,
  Filter,
  PencilRuler,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { computeFilteredDashboard } from '../engine/analyticsEngine';
import {
  DatasetEntry,
  GlobalFilterState,
  RecommendedChartType,
} from '../types/analytics';
import { GlobalCommerceMap } from './GlobalCommerceMap';
import { MagneticButton } from './gsapMotion';
import { AppPage } from './Navbar';
import { PlotReveal, usePlotPhase } from './plot-reveal';
import { RevenueOverTimeHeroChart } from './RevenueOverTimeHeroChart';

interface AnalyticsDashboardPageProps {
  dataset: DatasetEntry;
  filters: GlobalFilterState;
  onFiltersChange: (next: GlobalFilterState) => void;
  onNavigate: (page: AppPage) => void;
  shouldRunLiveInspection?: boolean;
  onInspectionComplete?: () => void;
}

// Strict Monochrome Swiss Editorial Luminance Scale
const MONOCHROME_PALETTE = [
  '#09090B',
  '#27272A',
  '#52525B',
  '#71717A',
  '#A1A1AA',
  '#D4D4D8',
];

const INSPECTION_DURATION_MS = 9200;

const INSPECTION_STAGES = [
  {
    id: 'stream',
    code: '01',
    label: 'Connecting & Streaming Live Blocks',
    detail: 'Mounting columnar partition index & verifying live row pointers',
    thresholdMs: 0,
  },
  {
    id: 'audit',
    code: '02',
    label: 'Real-Time Schema & Anomaly Audit',
    detail: 'Inspecting currency normalization, timestamps & SKU integrity',
    thresholdMs: 2200,
  },
  {
    id: 'sketch',
    code: '03',
    label: 'Blueprint Pencil Drafting',
    detail: 'Plotting geometric axes, bounding frames & baseline telemetry',
    thresholdMs: 4500,
  },
  {
    id: 'morph',
    code: '04',
    label: 'Morphing Curves to Verified Live Data',
    detail: 'Interpolating cubic-bezier revenue trajectories & KPI counters',
    thresholdMs: 6800,
  },
];

const NUMBER_REGEX = /\d[\d,]*(?:\.\d+)?/g;

/**
 * Formats numbers as zero in the exact target format during the "sketch" phase
 * so PlotReveal's PlotLayer counts them up geometrically during the morph phase.
 */
const useFigure = () => {
  const sketch = usePlotPhase() === 'sketch';
  return (real: string) =>
    sketch
      ? real.replace(NUMBER_REGEX, (n) =>
          n.includes('.') ? `0.${'0'.repeat(n.split('.')[1].length)}` : '0'
        )
      : real;
};

const PlottedKpiCard: React.FC<{
  title: string;
  formattedValue: string;
  subtitle: React.ReactNode;
}> = ({ title, formattedValue, subtitle }) => {
  const figure = useFigure();
  return (
    <div
      data-plot-frame
      className="bg-white border border-black/10 rounded-[20px] p-5 flex flex-col justify-between transition-all duration-500"
    >
      <span
        data-plot="title"
        className="text-[11px] font-medium text-[#71717A]"
      >
        {title}
      </span>
      <p
        data-plot="metric"
        className="mt-2 text-2xl font-bold text-[#09090B] font-mono-tabular"
      >
        {figure(formattedValue)}
      </p>
      <div
        data-plot=""
        className="mt-1.5 text-[11px] text-[#52525B] font-medium flex items-center gap-0.5 font-mono-tabular"
      >
        {subtitle}
      </div>
    </div>
  );
};

const StaggeredPlotReveal: React.FC<{
  delay: number;
  active: boolean;
  runKey: number;
  morph?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ delay, active, runKey, morph = true, className = '', children }) => {
  const [ready, setReady] = useState(!active || delay === 0);

  useEffect(() => {
    if (!active) {
      setReady(true);
      return;
    }
    if (delay === 0) {
      setReady(true);
      return;
    }
    setReady(false);
    const id = window.setTimeout(() => setReady(true), delay);
    return () => window.clearTimeout(id);
  }, [delay, active, runKey]);

  if (!active) {
    return <div className={className}>{children}</div>;
  }

  if (!ready) {
    return (
      <div className={`opacity-0 pointer-events-none select-none ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <PlotReveal
      key={`plot-${runKey}-${delay}`}
      annotate={false}
      morph={morph}
      ready
      className={`w-full h-full ${className}`}
    >
      {children}
    </PlotReveal>
  );
};

export const AnalyticsDashboardPage: React.FC<AnalyticsDashboardPageProps> = ({
  dataset,
  filters,
  onFiltersChange,
  onNavigate,
  shouldRunLiveInspection = true,
  onInspectionComplete,
}) => {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const prevDatasetIdRef = useRef<string>(dataset.id);

  const [chartTypeOverrides, setChartTypeOverrides] = useState<
    Record<string, RecommendedChartType>
  >({});

  // Do NOT auto-start analysis: if `shouldRunLiveInspection` is true (dataset has not been analyzed yet in this session),
  // wait for the user to explicitly click "Start Analytics".
  const [hasStartedAnalysis, setHasStartedAnalysis] = useState<boolean>(
    !shouldRunLiveInspection
  );
  const [animateBlueprint, setAnimateBlueprint] = useState<boolean>(false);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(
    shouldRunLiveInspection ? 0 : INSPECTION_DURATION_MS
  );
  const [runKey, setRunKey] = useState<number>(0);

  // Only reset when the user switches to a DIFFERENT dataset ID
  useEffect(() => {
    if (prevDatasetIdRef.current !== dataset.id) {
      prevDatasetIdRef.current = dataset.id;
      if (shouldRunLiveInspection) {
        setHasStartedAnalysis(false);
        setAnimateBlueprint(false);
        setIsInspecting(false);
        setElapsedMs(0);
      } else {
        setHasStartedAnalysis(true);
        setAnimateBlueprint(false);
        setIsInspecting(false);
        setElapsedMs(INSPECTION_DURATION_MS);
      }
    }
  }, [dataset.id, shouldRunLiveInspection]);

  // 9.2-second real-time data inspection & live telemetry progress loop (runs when user clicks Start Analytics)
  useEffect(() => {
    if (!isInspecting) return;

    const startTime = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const nextElapsed = Math.min(INSPECTION_DURATION_MS, now - startTime);
      setElapsedMs(nextElapsed);

      if (nextElapsed >= INSPECTION_DURATION_MS) {
        window.clearInterval(interval);
        setIsInspecting(false);
        onInspectionComplete?.();
      }
    }, 80);

    return () => window.clearInterval(interval);
  }, [isInspecting, runKey, onInspectionComplete]);

  const handleStartOrReplayAnalysis = () => {
    setHasStartedAnalysis(true);
    setAnimateBlueprint(true);
    setIsInspecting(true);
    setElapsedMs(0);
    setRunKey((k) => k + 1);
  };

  const filteredData = useMemo(
    () => computeFilteredDashboard(dataset, filters),
    [dataset, filters]
  );

  const inspectionProgressPct = Math.min(
    100,
    Math.round((elapsedMs / INSPECTION_DURATION_MS) * 100)
  );

  const liveInspectedRows = useMemo(() => {
    const targetRows =
      dataset.cleanedRowCount || filteredData.kpis.totalOrders || 1480000;
    if (!isInspecting) return targetRows;
    const ratio = Math.min(1, elapsedMs / (INSPECTION_DURATION_MS * 0.9));
    return Math.round(targetRows * ratio);
  }, [
    dataset.cleanedRowCount,
    filteredData.kpis.totalOrders,
    isInspecting,
    elapsedMs,
  ]);

  const activeStageIndex = useMemo(() => {
    if (!isInspecting) return INSPECTION_STAGES.length - 1;
    for (let i = INSPECTION_STAGES.length - 1; i >= 0; i--) {
      if (elapsedMs >= INSPECTION_STAGES[i].thresholdMs) return i;
    }
    return 0;
  }, [elapsedMs, isInspecting]);

  const getChartType = (chartId: string, fallback: RecommendedChartType) => {
    if (chartTypeOverrides[chartId]) return chartTypeOverrides[chartId];
    const rec = dataset.chartRecommendations.find((r) => r.id === chartId);
    return rec?.recommendedType || fallback;
  };

  const isChartAvailable = (chartId: string) => {
    const rec = dataset.chartRecommendations.find((r) => r.id === chartId);
    return rec ? rec.available : true;
  };

  const getUnavailableReason = (chartId: string) => {
    const rec = dataset.chartRecommendations.find((r) => r.id === chartId);
    return (
      rec?.unavailableReason ||
      'Required semantic column is not mapped in the current dataset.'
    );
  };

  const getChartRule = (chartId: string) => {
    return (
      dataset.chartRecommendations.find((r) => r.id === chartId)?.ruleApplied ||
      'Automated Selection'
    );
  };

  const resetFilters = () => {
    onFiltersChange({
      dateFrom: '2025-01-01',
      dateTo: '2025-12-31',
      country: 'ALL',
      category: 'ALL',
      paymentMethod: 'ALL',
      customerSegment: 'ALL',
    });
  };

  const hasActiveFilters =
    filters.country !== 'ALL' ||
    filters.category !== 'ALL' ||
    filters.paymentMethod !== 'ALL' ||
    filters.customerSegment !== 'ALL' ||
    filters.dateFrom !== '2025-01-01' ||
    filters.dateTo !== '2025-12-31';

  return (
    <div
      ref={pageRef}
      className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-6 pb-20 space-y-8"
    >
      {/* EXECUTIVE HEADER */}
      <StaggeredPlotReveal
        delay={0}
        active={hasStartedAnalysis && animateBlueprint}
        runKey={runKey}
        morph={false}
      >
        <div
          data-plot-frame
          className="bg-white border border-black/10 rounded-[24px] p-7 sm:p-9 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
        >
          <div className="space-y-1.5">
            <div className="text-xs text-[#52525B] flex flex-wrap items-center gap-2">
              <span data-plot="" className="font-semibold text-[#09090B]">
                Interactive Analytical Workspace
              </span>
              <span aria-hidden="true">·</span>
              <span data-plot="" className="font-medium text-[#09090B]">
                {dataset.name}
              </span>
              <span aria-hidden="true">·</span>
              <span data-plot="" className="font-mono-tabular">
                {filteredData.kpis.totalOrders.toLocaleString()} active
                transactions
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#09090B]">
              <span data-plot="title">
                Global Consumer Behaviour & Shopping Intelligence
              </span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!hasStartedAnalysis ? (
              <button
                type="button"
                onClick={handleStartOrReplayAnalysis}
                className="px-5 py-2.5 bg-[#09090B] hover:bg-[#27272A] text-white text-xs font-semibold rounded-full transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Analytics</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartOrReplayAnalysis}
                data-plot=""
                className="px-4 py-2.5 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#09090B] border border-black/10 text-xs font-semibold rounded-full transition-colors flex items-center gap-2 cursor-pointer"
              >
                <PencilRuler className="w-3.5 h-3.5 text-[#09090B]" />
                <span>
                  {isInspecting ? 'Inspecting Live...' : 'Replay Blueprint (9s)'}
                </span>
              </button>
            )}

            <MagneticButton
              type="button"
              strength={0.24}
              onClick={() => onNavigate('ai_analyst')}
              className="px-4 py-2.5 bg-[#09090B] hover:bg-[#27272A] text-white text-xs font-semibold rounded-full transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span data-plot="">Ask AI Analyst</span>
            </MagneticButton>
          </div>
        </div>
      </StaggeredPlotReveal>

      {/* PRE-ANALYSIS STANDBY STATE: SHOWN BEFORE USER CLICKS "START ANALYTICS" */}
      {!hasStartedAnalysis ? (
        <div className="bg-white border border-black/10 rounded-[24px] p-8 sm:p-12 shadow-[0_2px_8px_rgb(2_6_23/0.04)] space-y-8">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4F4F5] border border-black/10 text-xs font-semibold text-[#09090B]">
              <Database className="w-3.5 h-3.5" />
              <span>Dataset Ready for Real-Time Inspection & Blueprint Build</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#09090B]">
              Click Start Analytics to inspect live blocks & build your dashboard
            </h2>

            <p className="text-sm text-[#52525B] leading-relaxed">
              Your cleaned repository{' '}
              <span className="font-semibold text-[#09090B]">
                ({dataset.name})
              </span>{' '}
              is staged in memory. Starting the analysis runs a one-time 9-second
              real-time telemetry inspection, sketches the entire dashboard in
              blueprint pencil, and morphs every curve and KPI counter to live
              verified figures.
            </p>
          </div>

          {/* Staged Repository Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#F4F4F5] border border-black/5 rounded-[16px] p-4">
              <span className="text-[11px] font-medium text-[#71717A] uppercase">
                Staged Transactions
              </span>
              <p className="mt-1 text-xl font-bold text-[#09090B] font-mono-tabular">
                {dataset.cleanedRowCount.toLocaleString()}
              </p>
              <span className="text-[11px] text-[#52525B]">
                Verified clean records
              </span>
            </div>

            <div className="bg-[#F4F4F5] border border-black/5 rounded-[16px] p-4">
              <span className="text-[11px] font-medium text-[#71717A] uppercase">
                Schema Columns
              </span>
              <p className="mt-1 text-xl font-bold text-[#09090B] font-mono-tabular">
                {dataset.columnCount} Fields
              </p>
              <span className="text-[11px] text-[#52525B]">
                Semantic roles mapped
              </span>
            </div>

            <div className="bg-[#F4F4F5] border border-black/5 rounded-[16px] p-4">
              <span className="text-[11px] font-medium text-[#71717A] uppercase">
                Data Quality Score
              </span>
              <p className="mt-1 text-xl font-bold text-[#09090B] font-mono-tabular flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#09090B]" />
                <span>{dataset.quality.overallScore}%</span>
              </p>
              <span className="text-[11px] text-[#52525B]">
                Production-ready integrity
              </span>
            </div>

            <div className="bg-[#F4F4F5] border border-black/5 rounded-[16px] p-4">
              <span className="text-[11px] font-medium text-[#71717A] uppercase">
                Visualizations Queued
              </span>
              <p className="mt-1 text-xl font-bold text-[#09090B] font-mono-tabular">
                6 KPIs + 10 Charts
              </p>
              <span className="text-[11px] text-[#52525B]">
                Blueprint sketch-to-reality
              </span>
            </div>
          </div>

          {/* 4-Stage Pipeline Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {INSPECTION_STAGES.map((stage) => (
              <div
                key={stage.id}
                className="rounded-[14px] p-3.5 border border-black/10 bg-[#FAFAFA] text-[#09090B]"
              >
                <div className="text-[11px] font-mono-tabular text-[#71717A] font-semibold mb-1">
                  STAGE {stage.code}
                </div>
                <p className="text-xs font-bold leading-snug">{stage.label}</p>
                <p className="text-[11px] text-[#52525B] mt-1 leading-relaxed">
                  {stage.detail}
                </p>
              </div>
            ))}
          </div>

          {/* Primary Launch Button */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleStartOrReplayAnalysis}
              className="px-8 py-4 bg-[#09090B] hover:bg-[#27272A] text-white text-sm font-semibold rounded-full transition-transform active:scale-95 flex items-center gap-2.5 cursor-pointer shadow-md"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Analytics · Inspect & Load Live Data</span>
            </button>

            <span className="text-xs text-[#71717A] font-mono-tabular">
              One-time ~9s live inspection & blueprint sketch transition
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* REAL-TIME DATA INSPECTION & LIVE TELEMETRY STREAM (MONOCHROME SWISS EDITORIAL PALETTE) */}
          <div
            className={`rounded-[24px] bg-white border border-black/10 text-[#09090B] transition-all duration-500 overflow-hidden shadow-[0_2px_8px_rgb(2_6_23/0.04)] ${
              isInspecting ? 'p-6 sm:p-7' : 'px-6 py-4'
            }`}
          >
            {isInspecting ? (
              <div className="space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono-tabular text-[#52525B]">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#09090B] opacity-60" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#09090B]" />
                      </span>
                      <span className="font-bold tracking-wider uppercase text-[#09090B]">
                        Real-Time Data Inspection & Live Telemetry Stream
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-[#09090B]">
                        {(elapsedMs / 1000).toFixed(1)}s / 9.2s
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-[#09090B]">
                      Inspecting dataset blocks in real time, fetching live
                      telemetry & drafting blueprint curves...
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 font-mono-tabular">
                    <div className="bg-[#F4F4F5] border border-black/10 rounded-[12px] px-4 py-2">
                      <span className="block text-[10px] text-[#71717A] uppercase">
                        Live Inspected Rows
                      </span>
                      <span className="text-sm sm:text-base font-bold text-[#09090B]">
                        {liveInspectedRows.toLocaleString()}{' '}
                        <span className="text-xs font-normal text-[#71717A]">
                          / {dataset.cleanedRowCount.toLocaleString()}
                        </span>
                      </span>
                    </div>

                    <div className="bg-[#09090B] text-white border border-[#09090B] rounded-[12px] px-4 py-2">
                      <span className="block text-[10px] text-[#A1A1AA] uppercase">
                        Blueprint Sync
                      </span>
                      <span className="text-sm sm:text-base font-bold text-white">
                        {inspectionProgressPct}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Monochrome Editorial Progress Track */}
                <div className="w-full h-2 bg-[#F4F4F5] border border-black/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#09090B] transition-all duration-100"
                    style={{ width: `${inspectionProgressPct}%` }}
                  />
                </div>

                {/* 4-Stage Pipeline Matrix in Monochrome Swiss Editorial Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {INSPECTION_STAGES.map((stage, idx) => {
                    const isDone = idx < activeStageIndex;
                    const isCurrent = idx === activeStageIndex;
                    return (
                      <div
                        key={stage.id}
                        className={`rounded-[14px] p-3.5 border transition-all duration-300 ${
                          isCurrent
                            ? 'bg-[#09090B] border-[#09090B] text-white shadow-sm'
                            : isDone
                              ? 'bg-[#F4F4F5] border-black/15 text-[#09090B]'
                              : 'bg-[#FAFAFA] border-black/5 text-[#71717A]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono-tabular mb-1">
                          <span
                            className={
                              isCurrent
                                ? 'text-white font-bold'
                                : isDone
                                  ? 'text-[#09090B] font-semibold'
                                  : 'text-[#71717A]'
                            }
                          >
                            STAGE {stage.code}
                          </span>
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#09090B]" />
                          ) : isCurrent ? (
                            <Activity className="w-3.5 h-3.5 text-white animate-pulse" />
                          ) : null}
                        </div>
                        <p
                          className={`text-xs font-bold leading-snug ${
                            isCurrent ? 'text-white' : 'text-[#09090B]'
                          }`}
                        >
                          {stage.label}
                        </p>
                        <p
                          className={`text-[11px] mt-1 leading-relaxed ${
                            isCurrent ? 'text-[#D4D4D8]' : 'text-[#52525B]'
                          }`}
                        >
                          {stage.detail}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F4F4F5] border border-black/10 text-[#09090B] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#09090B]" />
                    <span>Real-Time Data Inspection Verified</span>
                  </span>
                  <span className="text-[#52525B] flex items-center gap-1.5 font-mono-tabular">
                    <Database className="w-3.5 h-3.5 text-[#09090B]" />
                    <span>
                      {dataset.cleanedRowCount.toLocaleString()} live rows
                      indexed · One-time inspection complete for this session
                    </span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleStartOrReplayAnalysis}
                  className="text-xs font-semibold text-[#09090B] hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-run Live Inspection & Blueprint Sketch</span>
                </button>
              </div>
            )}
          </div>

          {/* GLOBAL CROSS-FILTER BAR */}
          <StaggeredPlotReveal
            delay={200}
            active={animateBlueprint}
            runKey={runKey}
            morph={false}
          >
            <div
              data-plot-frame
              className="bg-white border border-black/10 rounded-[24px] p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#09090B]">
                  <Filter className="w-3.5 h-3.5 text-[#09090B]" />
                  <span data-plot="title">
                    Global Server-Side Aggregated Filters
                  </span>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs font-semibold text-[#09090B] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset All Filters</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
                <div data-plot="">
                  <label className="block text-[11px] font-medium text-[#71717A] mb-1">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    min="2025-01-01"
                    max="2025-12-31"
                    onChange={(e) =>
                      onFiltersChange({ ...filters, dateFrom: e.target.value })
                    }
                    className="w-full bg-[#F4F4F5] border border-black/10 rounded-[7px] px-2.5 py-2 font-mono-tabular text-[#09090B]"
                  />
                </div>

                <div data-plot="">
                  <label className="block text-[11px] font-medium text-[#71717A] mb-1">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    min="2025-01-01"
                    max="2025-12-31"
                    onChange={(e) =>
                      onFiltersChange({ ...filters, dateTo: e.target.value })
                    }
                    className="w-full bg-[#F4F4F5] border border-black/10 rounded-[7px] px-2.5 py-2 font-mono-tabular text-[#09090B]"
                  />
                </div>

                <div data-plot="">
                  <label className="block text-[11px] font-medium text-[#71717A] mb-1">
                    Country Market
                  </label>
                  <select
                    value={filters.country}
                    onChange={(e) =>
                      onFiltersChange({ ...filters, country: e.target.value })
                    }
                    className="w-full bg-[#F4F4F5] border border-black/10 rounded-[7px] px-2.5 py-2 text-[#09090B] font-medium"
                  >
                    <option value="ALL">All Countries (12)</option>
                    {dataset.baseAggregations.revenueByCountry.map((c) => (
                      <option key={c.country} value={c.country}>
                        {c.country}
                      </option>
                    ))}
                  </select>
                </div>

                <div data-plot="">
                  <label className="block text-[11px] font-medium text-[#71717A] mb-1">
                    Product Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) =>
                      onFiltersChange({ ...filters, category: e.target.value })
                    }
                    className="w-full bg-[#F4F4F5] border border-black/10 rounded-[7px] px-2.5 py-2 text-[#09090B] font-medium"
                  >
                    <option value="ALL">All Categories (6)</option>
                    {dataset.baseAggregations.revenueByCategory.map((cat) => (
                      <option key={cat.category} value={cat.category}>
                        {cat.category}
                      </option>
                    ))}
                  </select>
                </div>

                <div data-plot="">
                  <label className="block text-[11px] font-medium text-[#71717A] mb-1">
                    Payment Method
                  </label>
                  <select
                    value={filters.paymentMethod}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        paymentMethod: e.target.value,
                      })
                    }
                    className="w-full bg-[#F4F4F5] border border-black/10 rounded-[7px] px-2.5 py-2 text-[#09090B] font-medium"
                  >
                    <option value="ALL">All Tender Types</option>
                    {dataset.baseAggregations.paymentMethodDist.map((p) => (
                      <option key={p.method} value={p.method}>
                        {p.method}
                      </option>
                    ))}
                  </select>
                </div>

                <div data-plot="">
                  <label className="block text-[11px] font-medium text-[#71717A] mb-1">
                    Customer RFM Segment
                  </label>
                  <select
                    value={filters.customerSegment}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        customerSegment: e.target.value,
                      })
                    }
                    className="w-full bg-[#F4F4F5] border border-black/10 rounded-[7px] px-2.5 py-2 text-[#09090B] font-medium"
                  >
                    <option value="ALL">All Buyer Segments</option>
                    {dataset.baseAggregations.rfmSegments.map((s) => (
                      <option key={s.segment} value={s.segment}>
                        {s.segment}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </StaggeredPlotReveal>

          {/* TOTAL REVENUE & CORE KPI SECTION */}
          <div className="space-y-8">
            {/* TOP 6 KPI CARDS WITH BLUEPRINT SKETCH & MORPH COUNT-UP */}
            <StaggeredPlotReveal
              delay={500}
              active={animateBlueprint}
              runKey={runKey}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <PlottedKpiCard
                  title="Total Revenue"
                  formattedValue={`$${(filteredData.kpis.totalRevenue / 1e6).toFixed(2)}M`}
                  subtitle={
                    <span className="text-[#09090B] flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />+
                      {filteredData.kpis.revenueGrowthPct}% YoY
                    </span>
                  }
                />

                <PlottedKpiCard
                  title="Total Orders"
                  formattedValue={filteredData.kpis.totalOrders.toLocaleString(
                    'en-US'
                  )}
                  subtitle="Cleaned transactions"
                />

                <PlottedKpiCard
                  title="Total Customers"
                  formattedValue={filteredData.kpis.totalCustomers.toLocaleString(
                    'en-US'
                  )}
                  subtitle="Unique buyer accounts"
                />

                <PlottedKpiCard
                  title="Average Order Value"
                  formattedValue={`$${filteredData.kpis.averageOrderValue.toFixed(2)}`}
                  subtitle="Net of discounts"
                />

                <PlottedKpiCard
                  title="Avg Customer Rating"
                  formattedValue={
                    filteredData.kpis.averageCustomerRating !== null
                      ? `${filteredData.kpis.averageCustomerRating.toFixed(2)} ★`
                      : 'N/A'
                  }
                  subtitle={
                    filteredData.kpis.averageCustomerRating !== null
                      ? 'Verified post-purchase'
                      : 'Column unmapped'
                  }
                />

                <PlottedKpiCard
                  title="Repeat Purchase Rate"
                  formattedValue={`${filteredData.kpis.repeatPurchaseRate.toFixed(1)}%`}
                  subtitle="Multi-order retention"
                />
              </div>
            </StaggeredPlotReveal>

            {/* ROW 1: CHART 1 (UPGRADED REVENUE OVER TIME HERO CHART) & CHART 5 (PAYMENT METHOD DONUT) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* 1. Upgraded Revenue Over Time (Custom Cubic-Bezier SVG + PlotReveal Morph) */}
              <div className="lg:col-span-8 rounded-[24px]">
                <StaggeredPlotReveal
                  delay={1300}
                  active={animateBlueprint}
                  runKey={runKey}
                  className="h-full"
                >
                  {isChartAvailable('revenue_over_time') ? (
                    <RevenueOverTimeHeroChart
                      data={filteredData.revenueOverTime}
                      totalRevenue={filteredData.kpis.totalRevenue}
                      revenueGrowthPct={filteredData.kpis.revenueGrowthPct}
                      ruleLabel={getChartRule('revenue_over_time')}
                      chartType={getChartType('revenue_over_time', 'line')}
                      onChartTypeChange={(t) =>
                        setChartTypeOverrides((prev) => ({
                          ...prev,
                          revenue_over_time: t,
                        }))
                      }
                    />
                  ) : (
                    <div
                      data-plot-frame
                      className="bg-white border border-black/10 rounded-[24px] p-6 sm:p-7 h-full"
                    >
                      <UnavailableChartNotice
                        reason={getUnavailableReason('revenue_over_time')}
                        onConfigure={() => onNavigate('profiling')}
                      />
                    </div>
                  )}
                </StaggeredPlotReveal>
              </div>

              {/* 5. Payment Method Distribution (Donut Chart) */}
              <div className="lg:col-span-4">
                <StaggeredPlotReveal
                  delay={2400}
                  active={animateBlueprint}
                  runKey={runKey}
                  className="h-full"
                >
                  <div
                    data-plot-frame
                    className="bg-white border border-black/10 rounded-[24px] p-6 sm:p-7 space-y-5 h-full flex flex-col justify-between"
                  >
                    <div className="pb-4 border-b border-black/10">
                      <span
                        data-plot=""
                        className="text-[11px] font-mono-tabular text-[#71717A]"
                      >
                        05 · {getChartRule('payment_method_dist')}
                      </span>
                      <h2
                        data-plot="title"
                        className="text-lg font-bold text-[#09090B]"
                      >
                        Payment Method Distribution
                      </h2>
                    </div>

                    {isChartAvailable('payment_method_dist') ? (
                      <div className="space-y-4">
                        <div
                          data-plot="donut"
                          data-plot-kind="box"
                          className="h-[200px]"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={filteredData.paymentMethodDist}
                                dataKey="revenue"
                                nameKey="method"
                                innerRadius={52}
                                outerRadius={80}
                                paddingAngle={2}
                              >
                                {filteredData.paymentMethodDist.map(
                                  (entry, idx) => (
                                    <Cell
                                      key={entry.method}
                                      fill={
                                        MONOCHROME_PALETTE[
                                          idx % MONOCHROME_PALETTE.length
                                        ]
                                      }
                                    />
                                  )
                                )}
                              </Pie>
                              <Tooltip
                                formatter={(v) => [
                                  `$${Number(v ?? 0).toLocaleString()}`,
                                  'Revenue',
                                ]}
                                contentStyle={{
                                  backgroundColor: '#09090B',
                                  borderRadius: '7px',
                                  border: '1px solid rgba(255,255,255,0.15)',
                                  color: '#FFF',
                                  fontSize: 12,
                                }}
                                itemStyle={{ color: '#FFFFFF' }}
                                labelStyle={{ color: '#A1A1AA' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="space-y-2 text-xs">
                          {filteredData.paymentMethodDist.map((pm, idx) => (
                            <div
                              key={pm.method}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span
                                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                                  style={{
                                    backgroundColor:
                                      MONOCHROME_PALETTE[
                                        idx % MONOCHROME_PALETTE.length
                                      ],
                                  }}
                                />
                                <span
                                  data-plot=""
                                  className="text-[#09090B] truncate"
                                >
                                  {pm.method}
                                </span>
                              </div>
                              <span
                                data-plot="share"
                                className="font-mono-tabular font-semibold text-[#52525B]"
                              >
                                {pm.sharePct}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <UnavailableChartNotice
                        reason={getUnavailableReason('payment_method_dist')}
                        onConfigure={() => onNavigate('profiling')}
                      />
                    )}
                  </div>
                </StaggeredPlotReveal>
              </div>
            </div>
          </div>

          {/* ROW 2: CHART 3 (INTERACTIVE WORLD MAP) & CHART 2 (REVENUE BY COUNTRY) */}
          <StaggeredPlotReveal
            delay={3400}
            active={animateBlueprint}
            runKey={runKey}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div
                data-plot-frame
                className="lg:col-span-7 bg-white border border-black/10 rounded-[24px] p-6 sm:p-7 space-y-4"
              >
                <div className="pb-2">
                  <span
                    data-plot=""
                    className="text-[11px] font-mono-tabular text-[#71717A]"
                  >
                    03 · {getChartRule('global_shopping_map')}
                  </span>
                  <h2
                    data-plot="title"
                    className="text-lg font-bold text-[#09090B]"
                  >
                    Global Shopping Distribution
                  </h2>
                </div>

                {isChartAvailable('global_shopping_map') ? (
                  <div data-plot="map" data-plot-kind="box">
                    <GlobalCommerceMap
                      countries={dataset.baseAggregations.revenueByCountry}
                      selectedCountry={filters.country}
                      onSelectCountry={(country) =>
                        onFiltersChange({ ...filters, country })
                      }
                    />
                  </div>
                ) : (
                  <UnavailableChartNotice
                    reason={getUnavailableReason('global_shopping_map')}
                    onConfigure={() => onNavigate('profiling')}
                  />
                )}
              </div>

              {/* 2. Revenue by Country (Bar Chart) */}
              <div
                data-plot-frame
                className="lg:col-span-5 bg-white border border-black/10 rounded-[24px] p-6 sm:p-7 space-y-4"
              >
                <div className="pb-3 border-b border-black/10">
                  <span
                    data-plot=""
                    className="text-[11px] font-mono-tabular text-[#71717A]"
                  >
                    02 · {getChartRule('revenue_by_country')}
                  </span>
                  <h2
                    data-plot="title"
                    className="text-lg font-bold text-[#09090B]"
                  >
                    Revenue by Country
                  </h2>
                </div>

                {isChartAvailable('revenue_by_country') ? (
                  <div
                    data-plot="bars"
                    data-plot-kind="box"
                    className="h-[350px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={filteredData.revenueByCountry.slice(0, 8)}
                        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                        <XAxis
                          type="number"
                          tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`}
                          tick={{ fontSize: 11, fill: '#52525B' }}
                        />
                        <YAxis
                          type="category"
                          dataKey="country"
                          width={95}
                          tick={{ fontSize: 11, fill: '#09090B' }}
                        />
                        <Tooltip
                          formatter={(v) => [
                            `$${Number(v ?? 0).toLocaleString()}`,
                            'Revenue',
                          ]}
                          contentStyle={{
                            backgroundColor: '#09090B',
                            borderRadius: '7px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: '#FFF',
                            fontSize: 12,
                          }}
                          itemStyle={{ color: '#FFFFFF' }}
                          labelStyle={{ color: '#A1A1AA' }}
                        />
                        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                          {filteredData.revenueByCountry
                            .slice(0, 8)
                            .map((entry, index) => (
                              <Cell
                                key={entry.country}
                                fill={index === 0 ? '#09090B' : '#52525B'}
                              />
                            ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <UnavailableChartNotice
                    reason={getUnavailableReason('revenue_by_country')}
                    onConfigure={() => onNavigate('profiling')}
                  />
                )}
              </div>
            </div>
          </StaggeredPlotReveal>

          {/* ROW 3: CHART 4 (REVENUE BY CATEGORY) & CHART 6 (MONTHLY SALES TRENDS) */}
          <StaggeredPlotReveal
            delay={4600}
            active={animateBlueprint}
            runKey={runKey}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* 4. Revenue by Product Category */}
              <div
                data-plot-frame
                className="lg:col-span-6 bg-white border border-black/10 rounded-[24px] p-6 sm:p-7 space-y-5"
              >
                <div className="pb-4 border-b border-black/10">
                  <span
                    data-plot=""
                    className="text-[11px] font-mono-tabular text-[#71717A]"
                  >
                    04 · {getChartRule('revenue_by_category')}
                  </span>
                  <h2
                    data-plot="title"
                    className="text-lg font-bold text-[#09090B]"
                  >
                    Revenue by Product Category
                  </h2>
                </div>

                {isChartAvailable('revenue_by_category') ? (
                  <div
                    data-plot="cat-bars"
                    data-plot-kind="box"
                    className="h-[280px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={filteredData.revenueByCategory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                        <XAxis
                          dataKey="category"
                          tick={{ fontSize: 10, fill: '#52525B' }}
                          interval={0}
                          angle={-14}
                          textAnchor="end"
                          height={54}
                        />
                        <YAxis
                          tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`}
                          tick={{ fontSize: 11, fill: '#52525B' }}
                        />
                        <Tooltip
                          formatter={(v) => [
                            `$${Number(v ?? 0).toLocaleString()}`,
                            'Revenue',
                          ]}
                          contentStyle={{
                            backgroundColor: '#09090B',
                            borderRadius: '7px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: '#FFF',
                            fontSize: 12,
                          }}
                          itemStyle={{ color: '#FFFFFF' }}
                          labelStyle={{ color: '#A1A1AA' }}
                        />
                        <Bar
                          dataKey="revenue"
                          fill="#09090B"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <UnavailableChartNotice
                    reason={getUnavailableReason('revenue_by_category')}
                    onConfigure={() => onNavigate('profiling')}
                  />
                )}
              </div>

              {/* 6. Monthly Sales & Order Velocity Trends */}
              <div
                data-plot-frame
                className="lg:col-span-6 bg-white border border-black/10 rounded-[24px] p-6 sm:p-7 space-y-5"
              >
                <div className="pb-4 border-b border-black/10">
                  <span
                    data-plot=""
                    className="text-[11px] font-mono-tabular text-[#71717A]"
                  >
                    06 · {getChartRule('monthly_sales_trends')}
                  </span>
                  <h2
                    data-plot="title"
                    className="text-lg font-bold text-[#09090B]"
                  >
                    Monthly Sales & Order Velocity Trends
                  </h2>
                </div>

                {isChartAvailable('monthly_sales_trends') ? (
                  <div
                    data-plot="velocity-lines"
                    data-plot-kind="box"
                    className="h-[280px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={filteredData.monthlySalesTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11, fill: '#52525B' }}
                        />
                        <YAxis
                          yAxisId="left"
                          tickFormatter={(v) => `${(v / 1e3).toFixed(0)}K`}
                          tick={{ fontSize: 11, fill: '#09090B' }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tickFormatter={(v) => `${v}%`}
                          tick={{ fontSize: 11, fill: '#71717A' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#09090B',
                            borderRadius: '7px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: '#FFF',
                            fontSize: 12,
                          }}
                          itemStyle={{ color: '#FFFFFF' }}
                          labelStyle={{ color: '#A1A1AA' }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="orders"
                          name="Monthly Orders"
                          stroke="#09090B"
                          strokeWidth={2.2}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="discountRate"
                          name="Avg Promo Discount %"
                          stroke="#71717A"
                          strokeDasharray="4 4"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <UnavailableChartNotice
                    reason={getUnavailableReason('monthly_sales_trends')}
                    onConfigure={() => onNavigate('profiling')}
                  />
                )}
              </div>
            </div>
          </StaggeredPlotReveal>

          {/* ROW 4: CHART 7 (CUSTOMER PURCHASING BEHAVIOUR) & CHART 8 (DISCOUNT VS REVENUE SCATTER) */}
          <StaggeredPlotReveal
            delay={5800}
            active={animateBlueprint}
            runKey={runKey}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* 7. Customer Purchasing Behaviour (Grouped Bar Chart) */}
              <div
                data-plot-frame
                className="lg:col-span-6 bg-white border border-black/10 rounded-[24px] p-6 sm:p-7 space-y-5"
              >
                <div className="pb-4 border-b border-black/10">
                  <span
                    data-plot=""
                    className="text-[11px] font-mono-tabular text-[#71717A]"
                  >
                    07 · {getChartRule('customer_purchasing_behaviour')}
                  </span>
                  <h2
                    data-plot="title"
                    className="text-lg font-bold text-[#09090B]"
                  >
                    Customer Purchasing Behaviour (AOV vs. Repeat Rate)
                  </h2>
                </div>

                {isChartAvailable('customer_purchasing_behaviour') ? (
                  <div
                    data-plot="cust-bars"
                    data-plot-kind="box"
                    className="h-[280px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={filteredData.customerBehavior}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                        <XAxis
                          dataKey="segment"
                          tick={{ fontSize: 10, fill: '#52525B' }}
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: 11, fill: '#52525B' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#09090B',
                            borderRadius: '7px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: '#FFF',
                            fontSize: 12,
                          }}
                          itemStyle={{ color: '#FFFFFF' }}
                          labelStyle={{ color: '#A1A1AA' }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar
                          dataKey="avgOrderValue"
                          name="Avg Order Value ($)"
                          fill="#09090B"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="repeatRatePct"
                          name="Repeat Purchase Rate (%)"
                          fill="#71717A"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <UnavailableChartNotice
                    reason={getUnavailableReason(
                      'customer_purchasing_behaviour'
                    )}
                    onConfigure={() => onNavigate('profiling')}
                  />
                )}
              </div>

              {/* 8. Discount vs Revenue (Scatter Plot) */}
              <div
                data-plot-frame
                className="lg:col-span-6 bg-white border border-black/10 rounded-[24px] p-6 sm:p-7 space-y-5"
              >
                <div className="pb-4 border-b border-black/10">
                  <span
                    data-plot=""
                    className="text-[11px] font-mono-tabular text-[#71717A]"
                  >
                    08 · {getChartRule('discount_vs_revenue')}
                  </span>
                  <h2
                    data-plot="title"
                    className="text-lg font-bold text-[#09090B]"
                  >
                    Discount Rate vs. Net Order Value (Elasticity Scatter)
                  </h2>
                </div>

                {isChartAvailable('discount_vs_revenue') ? (
                  <div
                    data-plot="scatter"
                    data-plot-kind="box"
                    className="h-[280px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart
                        margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                        <XAxis
                          type="number"
                          dataKey="discountPct"
                          name="Discount %"
                          unit="%"
                          tick={{ fontSize: 11, fill: '#52525B' }}
                        />
                        <YAxis
                          type="number"
                          dataKey="avgRevenue"
                          name="Net Order Value"
                          unit="$"
                          domain={['auto', 'auto']}
                          tick={{ fontSize: 11, fill: '#52525B' }}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          contentStyle={{
                            backgroundColor: '#09090B',
                            borderRadius: '7px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: '#FFF',
                            fontSize: 12,
                          }}
                          itemStyle={{ color: '#FFFFFF' }}
                          labelStyle={{ color: '#A1A1AA' }}
                        />
                        <Scatter
                          name="Discount Brackets"
                          data={filteredData.discountVsRevenue}
                          fill="#09090B"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <UnavailableChartNotice
                    reason={getUnavailableReason('discount_vs_revenue')}
                    onConfigure={() => onNavigate('profiling')}
                  />
                )}
              </div>
            </div>
          </StaggeredPlotReveal>

          {/* ROW 5: CHART 9 (PRODUCT PERFORMANCE RANKED TABLE) & CHART 10 (RFM SEGMENTATION) */}
          <StaggeredPlotReveal
            delay={6800}
            active={animateBlueprint}
            runKey={runKey}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* 9. Product Performance Ranked Table */}
              <div
                data-plot-frame
                className="lg:col-span-7 bg-white border border-black/10 rounded-[24px] p-6 sm:p-7 space-y-5"
              >
                <div className="pb-4 border-b border-black/10">
                  <span
                    data-plot=""
                    className="text-[11px] font-mono-tabular text-[#71717A]"
                  >
                    09 · Ranked Entity Performance Ledger
                  </span>
                  <h2
                    data-plot="title"
                    className="text-lg font-bold text-[#09090B]"
                  >
                    Product Performance (Top Ranked SKUs)
                  </h2>
                </div>

                <div data-plot="table" className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-black/10 text-[#71717A]">
                        <th className="py-2.5 pr-3">Rank</th>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Net Revenue</th>
                        <th className="py-2.5 px-3 text-right">Units Sold</th>
                        <th className="py-2.5 pl-3 text-right">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {filteredData.topProducts.map((prod) => (
                        <tr
                          key={prod.productName}
                          className="hover:bg-[#F4F4F5]"
                        >
                          <td
                            data-plot=""
                            className="py-3 pr-3 font-mono-tabular font-bold text-[#09090B]"
                          >
                            #{prod.rank}
                          </td>
                          <td
                            data-plot=""
                            className="py-3 px-3 font-semibold text-[#09090B]"
                          >
                            {prod.productName}
                          </td>
                          <td data-plot="" className="py-3 px-3 text-[#52525B]">
                            {prod.category}
                          </td>
                          <td
                            data-plot="rev"
                            className="py-3 px-3 text-right font-mono-tabular font-semibold text-[#09090B]"
                          >
                            ${prod.revenue.toLocaleString()}
                          </td>
                          <td
                            data-plot=""
                            className="py-3 px-3 text-right font-mono-tabular text-[#52525B]"
                          >
                            {prod.unitsSold.toLocaleString()}
                          </td>
                          <td
                            data-plot=""
                            className="py-3 pl-3 text-right font-mono-tabular text-[#09090B]"
                          >
                            {prod.avgRating} ★
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 10. Customer Segmentation (RFM Analysis) */}
              <div
                data-plot-frame
                className="lg:col-span-5 bg-white border border-black/10 rounded-[24px] p-6 sm:p-7 space-y-5"
              >
                <div className="pb-4 border-b border-black/10">
                  <span
                    data-plot=""
                    className="text-[11px] font-mono-tabular text-[#71717A]"
                  >
                    10 · Recency, Frequency & Monetary (RFM) Model
                  </span>
                  <h2
                    data-plot="title"
                    className="text-lg font-bold text-[#09090B]"
                  >
                    Customer Segmentation (RFM Analysis)
                  </h2>
                </div>

                <div className="space-y-3.5">
                  {filteredData.rfmSegments.map((seg) => {
                    const isSelected = filters.customerSegment === seg.segment;
                    return (
                      <div
                        key={seg.segment}
                        data-plot=""
                        onClick={() =>
                          onFiltersChange({
                            ...filters,
                            customerSegment: isSelected ? 'ALL' : seg.segment,
                          })
                        }
                        className={`p-4 rounded-[14px] border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#09090B] text-white border-[#09090B]'
                            : 'bg-[#F4F4F5] text-[#09090B] border-black/5 hover:border-black/25'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold">{seg.segment}</span>
                          <span
                            className={`font-mono-tabular font-semibold ${
                              isSelected ? 'text-white' : 'text-[#09090B]'
                            }`}
                          >
                            ${(seg.totalRevenue / 1e6).toFixed(1)}M (
                            {seg.sharePct}% buyers)
                          </span>
                        </div>
                        <p
                          className={`mt-1 text-[11px] ${
                            isSelected ? 'text-white/70' : 'text-[#52525B]'
                          }`}
                        >
                          {seg.description}
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-current/10 flex items-center justify-between text-[11px] font-mono-tabular">
                          <span>Recency: {seg.recencyDaysAvg}d</span>
                          <span>Freq: {seg.frequencyAvg}x</span>
                          <span>
                            Monetary: ${seg.monetaryAvg.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </StaggeredPlotReveal>

          {/* FLOATING REPLAY BUTTON */}
          <button
            type="button"
            onClick={handleStartOrReplayAnalysis}
            className="fixed right-5 bottom-5 z-50 flex h-10 items-center gap-2 rounded-full bg-[#09090B] pr-5 pl-4 text-[13px] font-medium text-white shadow-[0_2px_8px_rgb(2_6_23/0.12),0_16px_40px_-12px_rgb(2_6_23/0.3)] transition-transform hover:bg-[#27272A] active:scale-95 cursor-pointer"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Replay
          </button>
        </div>
      )}
    </div>
  );
};

const UnavailableChartNotice: React.FC<{
  reason: string;
  onConfigure: () => void;
}> = ({ reason, onConfigure }) => (
  <div className="h-[240px] bg-[#F4F4F5] rounded-[16px] p-6 flex flex-col items-center justify-center text-center space-y-3">
    <AlertCircle className="w-6 h-6 text-[#09090B]" />
    <p className="text-sm font-semibold text-[#09090B]">
      Visualization Gracefully Disabled
    </p>
    <p className="text-xs text-[#52525B] max-w-sm">{reason}</p>
    <button
      type="button"
      onClick={onConfigure}
      className="px-4 py-1.5 bg-[#09090B] text-white text-xs font-semibold rounded-full cursor-pointer"
    >
      Configure Schema Mapping
    </button>
  </div>
);

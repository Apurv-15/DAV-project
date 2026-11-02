import React, { useMemo, useState } from "react";
import { RecommendedChartType, TimeSeriesPoint } from "../types/analytics";
import { usePlotPhase } from "./plot-reveal";
import { cn } from "../lib/cn";

interface RevenueOverTimeHeroChartProps {
  data: TimeSeriesPoint[];
  totalRevenue: number;
  revenueGrowthPct: number;
  ruleLabel: string;
  chartType: RecommendedChartType;
  onChartTypeChange: (type: RecommendedChartType) => void;
}

const CHART_W = 740;
const CHART_H = 195;
const PAD_TOP = 18;
const PAD_BOTTOM = 16;
const USABLE_H = CHART_H - PAD_TOP - PAD_BOTTOM;

const NUMBER_REGEX = /\d[\d,]*(?:\.\d+)?/g;

/**
 * While the chart is in the "sketch" phase of PlotReveal, every number reads zero in its exact format
 * ("$0.00M", "0.0%") so PlotLayer counts it up geometrically during the morph phase.
 */
const useFigure = () => {
  const sketch = usePlotPhase() === "sketch";
  return (real: string) =>
    sketch
      ? real.replace(NUMBER_REGEX, (n) =>
          n.includes(".") ? `0.${"0".repeat(n.split(".")[1].length)}` : "0"
        )
      : real;
};

/**
 * Generates a smooth cubic-bezier SVG path through evenly spaced points.
 * Each segment eases out of one point and into the next.
 */
const buildSmoothPath = (ys: number[]) => {
  if (ys.length === 0) return "";
  if (ys.length === 1) return `M0 ${ys[0].toFixed(1)} H${CHART_W}`;
  const step = CHART_W / (ys.length - 1);
  return ys.reduce((d, y, i) => {
    const yCoord = Number(y.toFixed(1));
    if (i === 0) return `M0 ${yCoord}`;
    const x = Number((i * step).toFixed(1));
    const mid = Number((x - step / 2).toFixed(1));
    const prevY = Number(ys[i - 1].toFixed(1));
    return `${d} C${mid} ${prevY} ${mid} ${yCoord} ${x} ${yCoord}`;
  }, "");
};

const averageArray = (ys: number[]) => {
  if (ys.length === 0) return [];
  const avg = ys.reduce((a, b) => a + b, 0) / ys.length;
  return ys.map(() => avg);
};

const formatCurrencyCompact = (val: number) => {
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
  return `$${val.toFixed(0)}`;
};

export const RevenueOverTimeHeroChart: React.FC<RevenueOverTimeHeroChartProps> = ({
  data,
  totalRevenue,
  revenueGrowthPct,
  ruleLabel,
  chartType,
  onChartTypeChange,
}) => {
  const sketch = usePlotPhase() === "sketch";
  const figure = useFigure();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const safeData = useMemo(
    () =>
      data && data.length > 0
        ? data
        : [
            {
              period: "Jan 2025",
              revenue: 510000,
              orders: 4100,
              aov: 124.39,
              customers: 3200,
            },
          ],
    [data]
  );

  const previousTotalRevenue = useMemo(() => {
    const factor = 1 + Math.max(-0.5, revenueGrowthPct / 100);
    return totalRevenue / factor;
  }, [totalRevenue, revenueGrowthPct]);

  const {
    maxRev,
    realCurrentYs,
    realPrevYs,
    previousRevenues,
  } = useMemo(() => {
    const revs = safeData.map((d) => d.revenue);
    const prevRevs = safeData.map((d, idx) => {
      const seasonalOffset = ((idx * 5) % 9) * 0.008 - 0.025;
      const ratio = 1 / (1 + Math.max(0.05, revenueGrowthPct / 100) + seasonalOffset);
      return Math.round(d.revenue * ratio);
    });

    const highest = Math.max(...revs, ...prevRevs, 1);
    const niceMax = highest * 1.12;

    const toY = (val: number) =>
      PAD_TOP + USABLE_H * (1 - Math.max(0, Math.min(1, val / niceMax)));

    return {
      maxRev: niceMax,
      realCurrentYs: revs.map(toY),
      realPrevYs: prevRevs.map(toY),
      previousRevenues: prevRevs,
    };
  }, [safeData, revenueGrowthPct]);

  const currentYs = sketch ? averageArray(realCurrentYs) : realCurrentYs;
  const prevYs = sketch ? averageArray(realPrevYs) : realPrevYs;

  const thisPath = buildSmoothPath(currentYs);
  const prevPath = buildSmoothPath(prevYs);
  const stepX = safeData.length > 1 ? CHART_W / (safeData.length - 1) : CHART_W;
  const lastY = currentYs[currentYs.length - 1] ?? CHART_H / 2;

  const activePoint = hoveredIdx !== null ? safeData[hoveredIdx] : null;
  const activePrevRev = hoveredIdx !== null ? previousRevenues[hoveredIdx] : 0;
  const activeDeltaPct =
    activePoint && activePrevRev > 0
      ? (((activePoint.revenue - activePrevRev) / activePrevRev) * 100).toFixed(1)
      : revenueGrowthPct.toFixed(1);

  return (
    <article
      data-plot-frame
      className="flex flex-col justify-between bg-white border border-black/10 rounded-[24px] p-6 sm:p-7 shadow-[0_2px_8px_rgb(2_6_23/0.04)] h-full"
    >
      {/* Top Header: Title, Legend, Headline Metric & Mode Switcher */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-black/10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              data-plot=""
              className="text-[11px] font-mono-tabular text-[#71717A]"
            >
              01 · {ruleLabel}
            </span>
          </div>

          <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-[#09090B]">
            <span data-plot="title">Revenue Over Time</span>
            <span
              data-plot=""
              data-plot-kind="image"
              title="Smooth cubic-bezier trajectory with prior-period benchmark"
              className="grid size-4 place-items-center rounded-full border border-[#71717A] text-[10px] leading-none font-semibold text-[#71717A]"
            >
              i
            </span>
          </h2>

          <p className="flex flex-wrap items-center gap-4 text-[12px] leading-5 text-[#52525B] pt-0.5">
            <span data-plot="">Across all active channels</span>
            <span data-plot="" className="flex items-center gap-1.5 font-medium text-[#09090B]">
              <span className="size-2 rounded-full bg-[#09090B]" />
              Current period
            </span>
            <span data-plot="" className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#94A3B8]" />
              Previous period
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-5 ml-auto">
          {/* Headline Revenue + Growth Chip + Previous Period */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span
                data-plot="metric"
                className="text-[26px] sm:text-[30px] leading-none font-bold tracking-[-0.02em] text-[#09090B] font-mono-tabular"
              >
                {figure(formatCurrencyCompact(totalRevenue))}
              </span>
              <span
                data-plot="change"
                className="rounded-md bg-[#F4F4F5] border border-black/10 px-2 py-0.5 text-[12px] leading-4 font-semibold text-[#09090B] font-mono-tabular"
              >
                {figure(`↗ +${revenueGrowthPct.toFixed(1)}%`)}
              </span>
            </div>
            <p
              data-plot="previous"
              className="mt-1 text-[12px] leading-4 text-[#52525B] font-mono-tabular"
            >
              {figure(`${formatCurrencyCompact(previousTotalRevenue)} previous period`)}
            </p>
          </div>

          {/* Line / Area / Bar Switcher */}
          <div className="flex items-center gap-1 bg-[#E4E4E7] p-1 rounded-[7px] text-xs">
            {(["line", "area", "bar"] as RecommendedChartType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onChartTypeChange(t)}
                className={cn(
                  "px-2.5 py-1 rounded-[5px] font-medium capitalize cursor-pointer transition-colors",
                  chartType === t
                    ? "bg-white text-[#09090B] shadow-xs"
                    : "text-[#52525B] hover:text-[#09090B]"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Custom SVG Curve / Area / Column Canvas */}
      <div className="relative mt-5 pt-2 select-none">
        {/* Y-Axis Scale Labels */}
        <div className="pointer-events-none absolute left-0 top-2 bottom-7 flex flex-col justify-between text-[10px] font-mono-tabular text-[#71717A] z-10">
          <span>{formatCurrencyCompact(maxRev * 0.85)}</span>
          <span>{formatCurrencyCompact(maxRev * 0.55)}</span>
          <span>{formatCurrencyCompact(maxRev * 0.25)}</span>
          <span>$0.0M</span>
        </div>

        <div className="pl-11">
          {chartType === "bar" ? (
            <div
              data-plot="columns"
              className="flex h-[195px] items-end gap-2 pt-4 pb-1 border-b border-[#e7e9ef]"
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {safeData.map((pt, i) => {
                const pct = Math.max(12, Math.min(98, Math.round((pt.revenue / maxRev) * 100)));
                const isPeak =
                  pt.revenue === Math.max(...safeData.map((d) => d.revenue));
                const isHovered = hoveredIdx === i;
                return (
                  <div
                    key={pt.period}
                    onMouseEnter={() => setHoveredIdx(i)}
                    className="relative flex h-full flex-1 items-end rounded-[8px] bg-[#f3f4f6] cursor-pointer group"
                  >
                    <div
                      data-plot=""
                      className={cn(
                        "hatch w-full rounded-[8px] transition-all duration-300",
                        isPeak || isHovered ? "bg-[#09090B]" : "bg-[#52525B]"
                      )}
                      style={{ height: `${sketch ? 52 : pct}%` }}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="relative">
              <svg
                data-plot="trend"
                data-plot-kind="box"
                viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                className="block w-full h-[195px] overflow-visible"
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <defs>
                  <linearGradient id="rev-trend-fade" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0"
                      stopColor="#09090B"
                      stopOpacity={chartType === "area" ? "0.24" : "0.12"}
                    />
                    <stop offset="1" stopColor="#09090B" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Reference Hairlines */}
                {[0.2, 0.5, 0.8].map((f) => (
                  <line
                    key={f}
                    x1="0"
                    x2={CHART_W}
                    y1={CHART_H * f}
                    y2={CHART_H * f}
                    stroke="#e7e9ef"
                    strokeDasharray="3 3"
                  />
                ))}

                {/* Baseline */}
                <line
                  x1="0"
                  x2={CHART_W}
                  y1={CHART_H - 2}
                  y2={CHART_H - 2}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />

                {/* Previous Period Dashed Benchmark Curve */}
                <path
                  d={prevPath}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.6"
                  strokeDasharray="4 4"
                />

                {/* Gradient Area Fill Under Current Curve */}
                <path
                  d={`${thisPath} V${CHART_H - 2} H0 Z`}
                  fill="url(#rev-trend-fade)"
                />

                {/* Main Smooth Cubic-Bezier Revenue Curve */}
                <path
                  d={thisPath}
                  fill="none"
                  stroke="#09090B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Active Hover Vertical Crosshair */}
                {hoveredIdx !== null && (
                  <line
                    x1={hoveredIdx * stepX}
                    x2={hoveredIdx * stepX}
                    y1={0}
                    y2={CHART_H - 2}
                    stroke="#09090B"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    strokeOpacity="0.45"
                  />
                )}

                {/* Data Nodes along the curve */}
                {currentYs.map((y, idx) => {
                  const cx = idx * stepX;
                  const isActive = hoveredIdx === idx;
                  const isLast = idx === currentYs.length - 1;
                  return (
                    <g key={safeData[idx]?.period || idx}>
                      {(isActive || isLast || chartType === "line") && (
                        <circle
                          cx={cx}
                          cy={y}
                          r={isActive ? 5.5 : 3.5}
                          fill="#09090B"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                      )}
                      {/* Invisible wide hit column for effortless hover */}
                      <rect
                        x={cx - stepX / 2}
                        y={0}
                        width={stepX}
                        height={CHART_H}
                        fill="transparent"
                        className="cursor-crosshair"
                        onMouseEnter={() => setHoveredIdx(idx)}
                      />
                    </g>
                  );
                })}

                {/* Terminal Pulse Node */}
                <circle
                  cx={CHART_W}
                  cy={lastY}
                  r="4.5"
                  fill="#09090B"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </svg>
            </div>
          )}

          {/* High-Contrast Floating Telemetry Tooltip */}
          {activePoint && hoveredIdx !== null && !sketch && (
            <div
              className="pointer-events-none absolute z-30 top-2 bg-[#09090B] text-white border border-white/15 rounded-[12px] px-4 py-3 shadow-xl min-w-[215px] transition-all duration-150"
              style={{
                left: `calc(2.75rem + ${Math.min(
                  74,
                  Math.max(4, (hoveredIdx / Math.max(1, safeData.length - 1)) * 74)
                )}%)`,
              }}
            >
              <div className="flex items-center justify-between gap-3 pb-1.5 mb-1.5 border-b border-white/15">
                <span className="text-xs font-bold text-white">
                  {activePoint.period}
                </span>
                <span className="text-[11px] font-mono-tabular font-semibold text-[#D4D4D8]">
                  +{activeDeltaPct}% YoY
                </span>
              </div>
              <div className="space-y-1 text-[11px] font-mono-tabular">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#A1A1AA] font-sans">Net Revenue</span>
                  <span className="font-bold text-white">
                    ${activePoint.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#A1A1AA] font-sans">Previous Period</span>
                  <span className="text-[#D4D4D8]">
                    ${activePrevRev.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#A1A1AA] font-sans">Orders / AOV</span>
                  <span className="text-white">
                    {activePoint.orders.toLocaleString()} · $
                    {(activePoint.aov ?? activePoint.revenue / Math.max(1, activePoint.orders)).toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* X-Axis Month Labels */}
          <div className="mt-2.5 flex justify-between text-[11px] leading-4 text-[#52525B] font-mono-tabular">
            {safeData.map((d, idx) => {
              const showOnMobile = idx % 2 === 0 || idx === safeData.length - 1;
              return (
                <span
                  key={d.period}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  className={cn(
                    "cursor-pointer transition-colors",
                    !showOnMobile && "hidden sm:inline",
                    hoveredIdx === idx
                      ? "text-[#09090B] font-bold"
                      : "text-[#52525B]"
                  )}
                >
                  {d.period.replace(" 2025", "")}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </article>
  );
};

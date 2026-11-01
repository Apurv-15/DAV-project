import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Download,
  Filter,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  Area,
  AreaChart,
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
import {
  AnimatedCounter,
  MagneticButton,
  useGsapPageReveal,
} from './gsapMotion';
import { AppPage } from './Navbar';

interface AnalyticsDashboardPageProps {
  dataset: DatasetEntry;
  filters: GlobalFilterState;
  onFiltersChange: (next: GlobalFilterState) => void;
  onNavigate: (page: AppPage) => void;
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

export const AnalyticsDashboardPage: React.FC<AnalyticsDashboardPageProps> = ({
  dataset,
  filters,
  onFiltersChange,
  onNavigate,
}) => {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [chartTypeOverrides, setChartTypeOverrides] = useState<
    Record<string, RecommendedChartType>
  >({});

  useGsapPageReveal(pageRef, [dataset.id]);

  const filteredData = useMemo(
    () => computeFilteredDashboard(dataset, filters),
    [dataset, filters]
  );

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
      <div className="gsap-reveal bg-white border border-black/10 rounded-[24px] p-7 sm:p-9 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="text-xs text-[#52525B] flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#09090B]">
              Interactive Analytical Workspace
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-[#09090B]">{dataset.name}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">
              {filteredData.kpis.totalOrders.toLocaleString()} active transactions
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#09090B]">
            Global Consumer Behaviour & Shopping Intelligence
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <MagneticButton
            type="button"
            strength={0.24}
            onClick={() => onNavigate('ai_analyst')}
            className="px-4 py-2.5 bg-[#09090B] hover:bg-[#27272A] text-white text-xs font-semibold rounded-full transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Ask AI Analyst</span>
          </MagneticButton>

          <MagneticButton
            type="button"
            strength={0.22}
            onClick={() => onNavigate('reports')}
            className="px-4 py-2.5 bg-[#E4E4E7] hover:bg-black/15 text-[#09090B] text-xs font-semibold rounded-full transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </MagneticButton>
        </div>
      </div>

      {/* GLOBAL CROSS-FILTER BAR */}
      <div className="gsap-reveal bg-white border border-black/10 rounded-[24px] p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#09090B]">
            <Filter className="w-3.5 h-3.5 text-[#09090B]" />
            <span>Global Server-Side Aggregated Filters</span>
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
          <div>
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

          <div>
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

          <div>
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

          <div>
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

          <div>
            <label className="block text-[11px] font-medium text-[#71717A] mb-1">
              Payment Method
            </label>
            <select
              value={filters.paymentMethod}
              onChange={(e) =>
                onFiltersChange({ ...filters, paymentMethod: e.target.value })
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

          <div>
            <label className="block text-[11px] font-medium text-[#71717A] mb-1">
              Customer RFM Segment
            </label>
            <select
              value={filters.customerSegment}
              onChange={(e) =>
                onFiltersChange({ ...filters, customerSegment: e.target.value })
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

      {/* TOP 6 KPI CARDS WITH GSAP ANIMATED COUNTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="gsap-reveal bg-white border border-black/10 rounded-[20px] p-5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-[#71717A]">
            Total Revenue
          </span>
          <p className="mt-2 text-2xl font-bold text-[#09090B] font-mono-tabular">
            <AnimatedCounter
              value={filteredData.kpis.totalRevenue / 1e6}
              decimals={2}
              prefix="$"
              suffix="M"
            />
          </p>
          <span className="mt-1.5 text-[11px] text-[#09090B] font-medium flex items-center gap-0.5 font-mono-tabular">
            <ArrowUpRight className="w-3 h-3" />+{filteredData.kpis.revenueGrowthPct}% YoY
          </span>
        </div>

        <div className="gsap-reveal bg-white border border-black/10 rounded-[20px] p-5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-[#71717A]">
            Total Orders
          </span>
          <p className="mt-2 text-2xl font-bold text-[#09090B] font-mono-tabular">
            <AnimatedCounter value={filteredData.kpis.totalOrders} />
          </p>
          <span className="mt-1.5 text-[11px] text-[#52525B]">
            Cleaned transactions
          </span>
        </div>

        <div className="gsap-reveal bg-white border border-black/10 rounded-[20px] p-5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-[#71717A]">
            Total Customers
          </span>
          <p className="mt-2 text-2xl font-bold text-[#09090B] font-mono-tabular">
            <AnimatedCounter value={filteredData.kpis.totalCustomers} />
          </p>
          <span className="mt-1.5 text-[11px] text-[#52525B]">
            Unique buyer accounts
          </span>
        </div>

        <div className="gsap-reveal bg-white border border-black/10 rounded-[20px] p-5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-[#71717A]">
            Average Order Value
          </span>
          <p className="mt-2 text-2xl font-bold text-[#09090B] font-mono-tabular">
            <AnimatedCounter
              value={filteredData.kpis.averageOrderValue}
              decimals={2}
              prefix="$"
            />
          </p>
          <span className="mt-1.5 text-[11px] text-[#52525B]">
            Net of discounts
          </span>
        </div>

        <div className="gsap-reveal bg-white border border-black/10 rounded-[20px] p-5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-[#71717A]">
            Avg Customer Rating
          </span>
          <p className="mt-2 text-2xl font-bold text-[#09090B] font-mono-tabular">
            {filteredData.kpis.averageCustomerRating !== null ? (
              <AnimatedCounter
                value={filteredData.kpis.averageCustomerRating}
                decimals={2}
                suffix=" ★"
              />
            ) : (
              'N/A'
            )}
          </p>
          <span className="mt-1.5 text-[11px] text-[#52525B]">
            {filteredData.kpis.averageCustomerRating !== null
              ? 'Verified post-purchase'
              : 'Column unmapped'}
          </span>
        </div>

        <div className="gsap-reveal bg-white border border-black/10 rounded-[20px] p-5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-[#71717A]">
            Repeat Purchase Rate
          </span>
          <p className="mt-2 text-2xl font-bold text-[#09090B] font-mono-tabular">
            <AnimatedCounter
              value={filteredData.kpis.repeatPurchaseRate}
              decimals={1}
              suffix="%"
            />
          </p>
          <span className="mt-1.5 text-[11px] text-[#52525B]">
            Multi-order retention
          </span>
        </div>
      </div>

      {/* ROW 1: CHART 1 (REVENUE OVER TIME) & CHART 5 (PAYMENT METHOD DONUT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. Revenue Over Time */}
        <div className="gsap-reveal lg:col-span-8 bg-white border border-black/10 rounded-[24px] p-6 sm:p-7 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-black/10">
            <div>
              <span className="text-[11px] font-mono-tabular text-[#71717A]">
                01 · {getChartRule('revenue_over_time')}
              </span>
              <h2 className="text-lg font-bold text-[#09090B]">
                Revenue Over Time
              </h2>
            </div>

            <div className="flex items-center gap-1 bg-[#E4E4E7] p-1 rounded-[7px] text-xs">
              {(['line', 'area', 'bar'] as RecommendedChartType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    setChartTypeOverrides((prev) => ({
                      ...prev,
                      revenue_over_time: t,
                    }))
                  }
                  className={`px-2.5 py-1 rounded-[5px] font-medium capitalize cursor-pointer ${
                    getChartType('revenue_over_time', 'line') === t
                      ? 'bg-white text-[#09090B]'
                      : 'text-[#52525B]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {isChartAvailable('revenue_over_time') ? (
            <div className="h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                {getChartType('revenue_over_time', 'line') === 'bar' ? (
                  <BarChart data={filteredData.revenueOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#52525B' }} />
                    <YAxis
                      tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`}
                      tick={{ fontSize: 11, fill: '#52525B' }}
                    />
                    <Tooltip
                      formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, 'Revenue']}
                      contentStyle={{
                        backgroundColor: '#09090B',
                        borderRadius: '7px',
                        border: 'none',
                        color: '#FFF',
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="revenue" fill="#09090B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : getChartType('revenue_over_time', 'line') === 'area' ? (
                  <AreaChart data={filteredData.revenueOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#52525B' }} />
                    <YAxis
                      tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`}
                      tick={{ fontSize: 11, fill: '#52525B' }}
                    />
                    <Tooltip
                      formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, 'Revenue']}
                      contentStyle={{
                        backgroundColor: '#09090B',
                        borderRadius: '7px',
                        border: 'none',
                        color: '#FFF',
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#09090B"
                      fill="#09090B"
                      fillOpacity={0.14}
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                ) : (
                  <LineChart data={filteredData.revenueOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#52525B' }} />
                    <YAxis
                      tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`}
                      tick={{ fontSize: 11, fill: '#52525B' }}
                    />
                    <Tooltip
                      formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, 'Revenue']}
                      contentStyle={{
                        backgroundColor: '#09090B',
                        borderRadius: '7px',
                        border: 'none',
                        color: '#FFF',
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#09090B"
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: '#09090B' }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <UnavailableChartNotice
              reason={getUnavailableReason('revenue_over_time')}
              onConfigure={() => onNavigate('profiling')}
            />
          )}
        </div>

        {/* 5. Payment Method Distribution (Donut Chart) */}
        <div className="gsap-reveal lg:col-span-4 bg-white border border-black/10 rounded-[24px] p-6 sm:p-7 space-y-5">
          <div className="pb-4 border-b border-black/10">
            <span className="text-[11px] font-mono-tabular text-[#71717A]">
              05 · {getChartRule('payment_method_dist')}
            </span>
            <h2 className="text-lg font-bold text-[#09090B]">
              Payment Method Distribution
            </h2>
          </div>

          {isChartAvailable('payment_method_dist') ? (
            <div className="space-y-4">
              <div className="h-[200px]">
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
                      {filteredData.paymentMethodDist.map((entry, idx) => (
                        <Cell
                          key={entry.method}
                          fill={
                            MONOCHROME_PALETTE[idx % MONOCHROME_PALETTE.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => `$${Number(v ?? 0).toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: '#09090B',
                        borderRadius: '7px',
                        border: 'none',
                        color: '#FFF',
                        fontSize: 12,
                      }}
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
                            MONOCHROME_PALETTE[idx % MONOCHROME_PALETTE.length],
                        }}
                      />
                      <span className="text-[#09090B] truncate">{pm.method}</span>
                    </div>
                    <span className="font-mono-tabular font-semibold text-[#52525B]">
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
      </div>

      {/* ROW 2: CHART 3 (INTERACTIVE WORLD MAP) & CHART 2 (REVENUE BY COUNTRY) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="gsap-reveal lg:col-span-7 bg-white border border-black/10 rounded-[24px] p-6 sm:p-7 space-y-4">
          <div className="pb-2">
            <span className="text-[11px] font-mono-tabular text-[#71717A]">
              03 · {getChartRule('global_shopping_map')}
            </span>
            <h2 className="text-lg font-bold text-[#09090B]">
              Global Shopping Distribution
            </h2>
          </div>

          {isChartAvailable('global_shopping_map') ? (
            <GlobalCommerceMap
              countries={dataset.baseAggregations.revenueByCountry}
              selectedCountry={filters.country}
              onSelectCountry={(country) =>
                onFiltersChange({ ...filters, country })
              }
            />
          ) : (
            <UnavailableChartNotice
              reason={getUnavailableReason('global_shopping_map')}
              onConfigure={() => onNavigate('profiling')}
            />
          )}
        </div>

        {/* 2. Revenue by Country (Bar Chart) */}
        <div className="gsap-reveal lg:col-span-5 bg-white border border-black/10 rounded-[24px] p-6 sm:p-7 space-y-4">
          <div className="pb-3 border-b border-black/10">
            <span className="text-[11px] font-mono-tabular text-[#71717A]">
              02 · {getChartRule('revenue_by_country')}
            </span>
            <h2 className="text-lg font-bold text-[#09090B]">
              Revenue by Country
            </h2>
          </div>

          {isChartAvailable('revenue_by_country') ? (
            <div className="h-[350px]">
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
                    formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#09090B',
                      borderRadius: '7px',
                      border: 'none',
                      color: '#FFF',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {filteredData.revenueByCountry.slice(0, 8).map((entry, index) => (
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

      {/* ROW 3: CHART 4 (REVENUE BY CATEGORY) & CHART 6 (MONTHLY SALES TRENDS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 4. Revenue by Product Category */}
        <div className="gsap-reveal lg:col-span-6 bg-white border border-black/10 rounded-[24px] p-6 sm:p-7 space-y-5">
          <div className="pb-4 border-b border-black/10">
            <span className="text-[11px] font-mono-tabular text-[#71717A]">
              04 · {getChartRule('revenue_by_category')}
            </span>
            <h2 className="text-lg font-bold text-[#09090B]">
              Revenue by Product Category
            </h2>
          </div>

          {isChartAvailable('revenue_by_category') ? (
            <div className="h-[280px]">
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
                    formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#09090B',
                      borderRadius: '7px',
                      border: 'none',
                      color: '#FFF',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="revenue" fill="#09090B" radius={[4, 4, 0, 0]} />
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
        <div className="gsap-reveal lg:col-span-6 bg-white border border-black/10 rounded-[24px] p-6 sm:p-7 space-y-5">
          <div className="pb-4 border-b border-black/10">
            <span className="text-[11px] font-mono-tabular text-[#71717A]">
              06 · {getChartRule('monthly_sales_trends')}
            </span>
            <h2 className="text-lg font-bold text-[#09090B]">
              Monthly Sales & Order Velocity Trends
            </h2>
          </div>

          {isChartAvailable('monthly_sales_trends') ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData.monthlySalesTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#52525B' }} />
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
                      border: 'none',
                      color: '#FFF',
                      fontSize: 12,
                    }}
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

      {/* ROW 4: CHART 7 (CUSTOMER PURCHASING BEHAVIOUR) & CHART 8 (DISCOUNT VS REVENUE SCATTER) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7. Customer Purchasing Behaviour (Grouped Bar Chart) */}
        <div className="gsap-reveal lg:col-span-6 bg-white border border-black/10 rounded-[24px] p-6 sm:p-7 space-y-5">
          <div className="pb-4 border-b border-black/10">
            <span className="text-[11px] font-mono-tabular text-[#71717A]">
              07 · {getChartRule('customer_purchasing_behaviour')}
            </span>
            <h2 className="text-lg font-bold text-[#09090B]">
              Customer Purchasing Behaviour (AOV vs. Repeat Rate)
            </h2>
          </div>

          {isChartAvailable('customer_purchasing_behaviour') ? (
            <div className="h-[280px]">
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
                      border: 'none',
                      color: '#FFF',
                      fontSize: 12,
                    }}
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
              reason={getUnavailableReason('customer_purchasing_behaviour')}
              onConfigure={() => onNavigate('profiling')}
            />
          )}
        </div>

        {/* 8. Discount vs Revenue (Scatter Plot) */}
        <div className="gsap-reveal lg:col-span-6 bg-white border border-black/10 rounded-[24px] p-6 sm:p-7 space-y-5">
          <div className="pb-4 border-b border-black/10">
            <span className="text-[11px] font-mono-tabular text-[#71717A]">
              08 · {getChartRule('discount_vs_revenue')}
            </span>
            <h2 className="text-lg font-bold text-[#09090B]">
              Discount Rate vs. Net Order Value (Elasticity Scatter)
            </h2>
          </div>

          {isChartAvailable('discount_vs_revenue') ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
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
                      border: 'none',
                      color: '#FFF',
                      fontSize: 12,
                    }}
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

      {/* ROW 5: CHART 9 (PRODUCT PERFORMANCE RANKED TABLE) & CHART 10 (RFM SEGMENTATION) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 9. Product Performance Ranked Table */}
        <div className="gsap-reveal lg:col-span-7 bg-white border border-black/10 rounded-[24px] p-6 sm:p-7 space-y-5">
          <div className="pb-4 border-b border-black/10">
            <span className="text-[11px] font-mono-tabular text-[#71717A]">
              09 · Ranked Entity Performance Ledger
            </span>
            <h2 className="text-lg font-bold text-[#09090B]">
              Product Performance (Top Ranked SKUs)
            </h2>
          </div>

          <div className="overflow-x-auto">
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
                  <tr key={prod.productName} className="hover:bg-[#F4F4F5]">
                    <td className="py-3 pr-3 font-mono-tabular font-bold text-[#09090B]">
                      #{prod.rank}
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#09090B]">
                      {prod.productName}
                    </td>
                    <td className="py-3 px-3 text-[#52525B]">{prod.category}</td>
                    <td className="py-3 px-3 text-right font-mono-tabular font-semibold text-[#09090B]">
                      ${prod.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-tabular text-[#52525B]">
                      {prod.unitsSold.toLocaleString()}
                    </td>
                    <td className="py-3 pl-3 text-right font-mono-tabular text-[#09090B]">
                      {prod.avgRating} ★
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 10. Customer Segmentation (RFM Analysis) */}
        <div className="gsap-reveal lg:col-span-5 bg-white border border-black/10 rounded-[24px] p-6 sm:p-7 space-y-5">
          <div className="pb-4 border-b border-black/10">
            <span className="text-[11px] font-mono-tabular text-[#71717A]">
              10 · Recency, Frequency & Monetary (RFM) Model
            </span>
            <h2 className="text-lg font-bold text-[#09090B]">
              Customer Segmentation (RFM Analysis)
            </h2>
          </div>

          <div className="space-y-3.5">
            {filteredData.rfmSegments.map((seg) => {
              const isSelected = filters.customerSegment === seg.segment;
              return (
                <div
                  key={seg.segment}
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
                      ${(seg.totalRevenue / 1e6).toFixed(1)}M ({seg.sharePct}% buyers)
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
                    <span>Monetary: ${seg.monetaryAvg.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
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

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import {
  executeConfigurableCleaning,
  recomputeDatasetOnSchemaChange,
} from '../engine/analyticsEngine';
import {
  CleaningConfig,
  DatasetEntry,
  SemanticFieldRole,
} from '../types/analytics';
import {
  AnimatedCounter,
  MagneticButton,
  useGsapPageReveal,
} from './gsapMotion';
import { AppPage } from './Navbar';

interface ProfilingAndCleaningPageProps {
  dataset: DatasetEntry;
  activeTab: 'profiling' | 'cleaning';
  onTabChange: (tab: 'profiling' | 'cleaning') => void;
  onUpdateDataset: (updated: DatasetEntry) => void;
  onNavigate: (page: AppPage) => void;
}

const SEMANTIC_ROLE_LABELS: { value: SemanticFieldRole; label: string }[] = [
  { value: 'order_id', label: 'Order ID' },
  { value: 'customer_id', label: 'Customer ID' },
  { value: 'date', label: 'Order Date' },
  { value: 'country', label: 'Country / Region' },
  { value: 'category', label: 'Product Category' },
  { value: 'product', label: 'Product Name / SKU' },
  { value: 'quantity', label: 'Quantity' },
  { value: 'price', label: 'Unit Price' },
  { value: 'discount', label: 'Discount %' },
  { value: 'revenue', label: 'Total Revenue' },
  { value: 'payment_method', label: 'Payment Method' },
  { value: 'rating', label: 'Customer Rating' },
  { value: 'unmapped', label: 'Unmapped / Auxiliary' },
];

export const ProfilingAndCleaningPage: React.FC<
  ProfilingAndCleaningPageProps
> = ({ dataset, activeTab, onTabChange, onUpdateDataset, onNavigate }) => {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [cleaningConfig, setCleaningConfig] = useState<CleaningConfig>(
    dataset.cleaningConfig
  );
  const [inspectMode, setInspectMode] = useState<'raw' | 'cleaned'>('cleaned');
  const [page, setPage] = useState(1);
  const [isApplyingClean, setIsApplyingClean] = useState(false);

  useEffect(() => {
    setCleaningConfig(dataset.cleaningConfig);
    setPage(1);
  }, [dataset.id, dataset.cleaningConfig]);

  useGsapPageReveal(pageRef, [activeTab, dataset.id]);

  const handleRoleChange = (colName: string, newRole: SemanticFieldRole) => {
    const updatedCols = dataset.columns.map((c) =>
      c.name === colName
        ? { ...c, semanticRole: newRole, isAmbiguous: false }
        : c
    );
    const newMapping: Record<SemanticFieldRole, string | null> = {
      order_id: null,
      customer_id: null,
      product: null,
      category: null,
      date: null,
      country: null,
      quantity: null,
      price: null,
      revenue: null,
      discount: null,
      payment_method: null,
      rating: null,
      unmapped: null,
    };
    for (const col of updatedCols) {
      if (col.semanticRole !== 'unmapped' && !newMapping[col.semanticRole]) {
        newMapping[col.semanticRole] = col.name;
      }
    }
    const recomputed = recomputeDatasetOnSchemaChange(
      dataset,
      updatedCols,
      newMapping
    );
    onUpdateDataset(recomputed);
  };

  const handleRunCleaning = async () => {
    setIsApplyingClean(true);
    await new Promise((r) => setTimeout(r, 250));
    const cleaned = executeConfigurableCleaning(dataset, cleaningConfig);
    onUpdateDataset(cleaned);
    try {
      await fetch(`/api/datasets/${dataset.id}/clean`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: cleaningConfig }),
      });
    } catch {
      // client state is already updated
    }
    setIsApplyingClean(false);
  };

  const rowsSource =
    inspectMode === 'raw' ? dataset.rawPreviewRows : dataset.cleanedPreviewRows;
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(rowsSource.length / pageSize));
  const sliceRows = rowsSource.slice((page - 1) * pageSize, page * pageSize);
  const rowKeys = Object.keys(rowsSource[0] || {});

  return (
    <div
      ref={pageRef}
      className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-8 pb-20 space-y-10"
    >
      {/* HEADER & STAGE SWITCHER */}
      <div className="gsap-reveal bg-white border border-black/10 rounded-[24px] p-8 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs text-[#52525B] flex items-center gap-2">
            <span className="font-semibold text-[#09090B]">
              Automated Schema & Hygiene Engine
            </span>
            <span aria-hidden="true">·</span>
            <span>{dataset.fileName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">
              {dataset.rawRowCount.toLocaleString()} raw rows
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#09090B]">
            {activeTab === 'profiling'
              ? 'Automated Data Profiling & Schema Audit'
              : 'Configurable Non-Destructive Cleaning Engine'}
          </h1>
          <p className="text-sm text-[#52525B]">
            {activeTab === 'profiling'
              ? 'Inspect detected data types, semantic field mappings, missing values, numerical quartiles, and outlier counts across every column.'
              : 'Configure cleaning heuristics while preserving the original uploaded dataset untouched. Inspect the before-and-after impact and audit log.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#E4E4E7] p-1 rounded-[7px] flex items-center gap-1">
            <button
              type="button"
              onClick={() => onTabChange('profiling')}
              className={`px-4 py-2 text-xs font-semibold rounded-[5px] transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'profiling'
                  ? 'bg-white text-[#09090B]'
                  : 'text-[#52525B] hover:text-[#09090B]'
              }`}
            >
              Page 3: Data Profiling
            </button>
            <button
              type="button"
              onClick={() => onTabChange('cleaning')}
              className={`px-4 py-2 text-xs font-semibold rounded-[5px] transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'cleaning'
                  ? 'bg-white text-[#09090B]'
                  : 'text-[#52525B] hover:text-[#09090B]'
              }`}
            >
              Page 4: Cleaning Engine
            </button>
          </div>

          <MagneticButton
            type="button"
            strength={0.25}
            onClick={() => onNavigate('analytics')}
            className="px-5 py-2.5 bg-[#09090B] hover:bg-[#27272A] text-white text-xs font-semibold rounded-full transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <span>Open Analytics Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </MagneticButton>
        </div>
      </div>

      {/* 4 DATA QUALITY SCORE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            label: 'Completeness',
            score: dataset.quality.completeness,
            sub: `${dataset.quality.missingCellsCount.toLocaleString()} raw missing cells detected`,
          },
          {
            label: 'Validity',
            score: dataset.quality.validity,
            sub: `${dataset.quality.invalidDatesCount.toLocaleString()} non-ISO dates · ${dataset.quality.invalidAmountsCount.toLocaleString()} negative amounts`,
          },
          {
            label: 'Uniqueness',
            score: dataset.quality.uniqueness,
            sub: `${dataset.quality.duplicateRowsCount.toLocaleString()} duplicate order records isolated`,
          },
          {
            label: 'Consistency',
            score: dataset.quality.consistency,
            sub: `${dataset.quality.inconsistentCategoriesCount.toLocaleString()} category casing variants`,
          },
        ].map((dim) => (
          <div
            key={dim.label}
            className="gsap-reveal bg-white border border-black/10 rounded-[24px] p-6 space-y-3"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#52525B]">{dim.label}</span>
              <span className="font-mono-tabular font-bold text-[#09090B]">
                <AnimatedCounter value={dim.score} decimals={1} suffix="%" />
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#E4E4E7] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#09090B] rounded-full transition-all duration-500"
                style={{ width: `${dim.score}%` }}
              />
            </div>
            <p className="text-xs text-[#71717A]">{dim.sub}</p>
          </div>
        ))}
      </div>

      {activeTab === 'profiling' ? (
        <div className="gsap-reveal bg-white border border-black/10 rounded-[24px] p-8 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/10">
            <div>
              <h2 className="text-xl font-bold text-[#09090B]">
                Column-Level Schema Profile & Semantic Mapping
              </h2>
              <p className="text-xs text-[#52525B] mt-1">
                Column Name | Data Type | Semantic Role | Missing Values |
                Unique Values | Distribution & Outliers | Status
              </p>
            </div>
            <div className="text-xs font-mono-tabular text-[#52525B]">
              Overall Quality Index:{' '}
              <strong className="text-[#09090B]">
                {dataset.quality.overallScore}%
              </strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-black/10 text-[#71717A]">
                  <th className="py-3 pr-4">Column Name</th>
                  <th className="py-3 px-3">Data Type</th>
                  <th className="py-3 px-3">Mapped Semantic Field</th>
                  <th className="py-3 px-3 text-right">Missing Values</th>
                  <th className="py-3 px-3 text-right">Unique Values</th>
                  <th className="py-3 px-3">Distribution / Range / Outliers</th>
                  <th className="py-3 pl-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {dataset.columns.map((col) => (
                  <tr key={col.name} className="hover:bg-[#F4F4F5]/70">
                    <td className="py-3.5 pr-4 font-mono-tabular font-semibold text-[#09090B]">
                      {col.name}
                    </td>
                    <td className="py-3.5 px-3 font-mono-tabular text-[#52525B]">
                      {col.dataType}
                    </td>
                    <td className="py-3.5 px-3">
                      <select
                        aria-label={`Semantic role for ${col.name}`}
                        value={col.semanticRole}
                        onChange={(e) =>
                          handleRoleChange(
                            col.name,
                            e.target.value as SemanticFieldRole
                          )
                        }
                        className="bg-[#E4E4E7]/70 text-[#09090B] text-xs font-medium px-2.5 py-1.5 rounded-[7px] border border-transparent focus:border-[#09090B] focus:outline-none cursor-pointer"
                      >
                        {SEMANTIC_ROLE_LABELS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono-tabular text-[#52525B]">
                      {col.missingCount.toLocaleString()} ({col.missingPercentage}%)
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono-tabular text-[#09090B]">
                      {col.uniqueCount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-[#52525B] font-mono-tabular">
                      {col.numericStats ? (
                        <span>
                          Min {col.numericStats.min} · Med{' '}
                          {col.numericStats.median} · Max {col.numericStats.max}{' '}
                          · {col.numericStats.outlierCount.toLocaleString()}{' '}
                          outliers
                        </span>
                      ) : col.dateStats ? (
                        <span>
                          {col.dateStats.minDate} → {col.dateStats.maxDate}
                        </span>
                      ) : col.categoricalStats?.topValues.length ? (
                        <span>
                          Top: {col.categoricalStats.topValues[0].label} (
                          {col.categoricalStats.topValues[0].percentage}%)
                        </span>
                      ) : (
                        <span>Sample: {col.sampleValues.slice(0, 2).join(', ')}</span>
                      )}
                    </td>
                    <td className="py-3.5 pl-3">
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#09090B]">
                        {col.status === 'Healthy' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#09090B]" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-[#52525B]" />
                        )}
                        <span>{col.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Configurable Cleaning Rules */}
          <div className="gsap-reveal lg:col-span-5 bg-white border border-black/10 rounded-[24px] p-8 space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-black/10">
              <Sliders className="w-4 h-4 text-[#09090B]" />
              <h2 className="text-lg font-bold text-[#09090B]">
                Configurable Cleaning Rules
              </h2>
            </div>

            <div className="space-y-5 text-xs">
              <div>
                <label className="block font-semibold text-[#09090B] mb-1.5">
                  1. Missing Values Strategy ({dataset.quality.missingCellsCount.toLocaleString()} cells)
                </label>
                <select
                  value={cleaningConfig.missingValueStrategy}
                  onChange={(e) =>
                    setCleaningConfig({
                      ...cleaningConfig,
                      missingValueStrategy: e.target
                        .value as CleaningConfig['missingValueStrategy'],
                    })
                  }
                  className="w-full bg-[#F4F4F5] border border-black/10 rounded-[7px] px-3 py-2 text-[#09090B] font-medium"
                >
                  <option value="impute_median_mode">
                    Impute Numerical with Category Median & Categorical with Mode
                  </option>
                  <option value="drop_rows">
                    Exclude Incomplete Rows from Cleaned Parquet Output
                  </option>
                  <option value="keep">
                    Preserve Null Values Without Imputation
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#09090B] mb-1.5">
                  2. Invalid / Negative Transaction Amounts ({dataset.quality.invalidAmountsCount.toLocaleString()} rows)
                </label>
                <select
                  value={cleaningConfig.handleInvalidAmounts}
                  onChange={(e) =>
                    setCleaningConfig({
                      ...cleaningConfig,
                      handleInvalidAmounts: e.target
                        .value as CleaningConfig['handleInvalidAmounts'],
                    })
                  }
                  className="w-full bg-[#F4F4F5] border border-black/10 rounded-[7px] px-3 py-2 text-[#09090B] font-medium"
                >
                  <option value="abs_or_recalc">
                    Recalculate from (Unit Price × Quantity × Discount)
                  </option>
                  <option value="drop_invalid">
                    Isolate & Exclude Negative Transaction Rows
                  </option>
                  <option value="keep">Keep Raw Amounts Unmodified</option>
                </select>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  {
                    key: 'removeDuplicates' as const,
                    label: `Deduplicate Exact & Composite Order Keys (${dataset.quality.duplicateRowsCount.toLocaleString()} rows)`,
                  },
                  {
                    key: 'standardizeDates' as const,
                    label: `Standardize Heterogeneous Timestamps to ISO-8601 (${dataset.quality.invalidDatesCount.toLocaleString()} rows)`,
                  },
                  {
                    key: 'normalizeCategories' as const,
                    label: `Normalize Category Whitespace & Casing (${dataset.quality.inconsistentCategoriesCount.toLocaleString()} rows)`,
                  },
                ].map((toggle) => (
                  <label
                    key={toggle.key}
                    className="flex items-start gap-3 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={cleaningConfig[toggle.key]}
                      onChange={(e) =>
                        setCleaningConfig({
                          ...cleaningConfig,
                          [toggle.key]: e.target.checked,
                        })
                      }
                      className="mt-0.5 accent-[#09090B] w-4 h-4 rounded"
                    />
                    <span className="text-[#09090B] font-medium leading-snug">
                      {toggle.label}
                    </span>
                  </label>
                ))}
              </div>

              <div className="pt-4 border-t border-black/10">
                <MagneticButton
                  type="button"
                  strength={0.22}
                  onClick={handleRunCleaning}
                  disabled={isApplyingClean}
                  className="w-full py-3 bg-[#09090B] hover:bg-[#27272A] text-white font-semibold rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isApplyingClean ? 'animate-spin' : ''}`}
                  />
                  <span>
                    {isApplyingClean
                      ? 'Executing Cleaning Pipeline...'
                      : 'Apply Cleaning Rules & Update Parquet'}
                  </span>
                </MagneticButton>
                <p className="mt-2 text-[11px] text-[#71717A] text-center">
                  Raw uploaded dataset is strictly preserved in read-only storage.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Before vs. After Comparison Summary */}
          <div className="gsap-reveal lg:col-span-7 bg-white border border-black/10 rounded-[24px] p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-black/10">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#09090B]" />
                <h2 className="text-lg font-bold text-[#09090B]">
                  Before vs. After Cleaning Summary
                </h2>
              </div>
              <span className="text-xs font-mono-tabular text-[#52525B]">
                Quality Lift: {dataset.beforeAfter.rawQualityScore}% →{' '}
                <strong className="text-[#09090B]">
                  {dataset.beforeAfter.cleanedQualityScore}%
                </strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-black/10 text-[#71717A]">
                    <th className="py-3 pr-4">Audit Dimension</th>
                    <th className="py-3 px-4 text-right">
                      Before (Raw Upload)
                    </th>
                    <th className="py-3 px-4 text-right">
                      After (Cleaned Parquet)
                    </th>
                    <th className="py-3 pl-4 text-right">Net Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 font-mono-tabular">
                  <tr>
                    <td className="py-3.5 pr-4 font-sans font-semibold text-[#09090B]">
                      Total Record Count
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#52525B]">
                      {dataset.beforeAfter.rawRowCount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#09090B]">
                      {dataset.beforeAfter.cleanedRowCount.toLocaleString()}
                    </td>
                    <td className="py-3.5 pl-4 text-right text-[#09090B] font-semibold">
                      -
                      {(
                        dataset.beforeAfter.rawRowCount -
                        dataset.beforeAfter.cleanedRowCount
                      ).toLocaleString()}{' '}
                      dups
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 font-sans font-semibold text-[#09090B]">
                      Missing / Null Values
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#52525B]">
                      {dataset.beforeAfter.rawMissingCount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#09090B]">
                      {dataset.beforeAfter.cleanedMissingCount.toLocaleString()}
                    </td>
                    <td className="py-3.5 pl-4 text-right text-[#09090B]">
                      {dataset.beforeAfter.cleanedMissingCount === 0
                        ? '100% Resolved'
                        : 'Retained'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 font-sans font-semibold text-[#09090B]">
                      Duplicate Transactions
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#52525B]">
                      {dataset.beforeAfter.rawDuplicatesCount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#09090B]">
                      {dataset.beforeAfter.cleanedDuplicatesCount.toLocaleString()}
                    </td>
                    <td className="py-3.5 pl-4 text-right text-[#09090B]">
                      {dataset.beforeAfter.cleanedDuplicatesCount === 0
                        ? '100% Deduplicated'
                        : 'Retained'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 font-sans font-semibold text-[#09090B]">
                      Non-Standard Dates
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#52525B]">
                      {dataset.beforeAfter.rawInvalidDatesCount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#09090B]">
                      {dataset.beforeAfter.cleanedInvalidDatesCount.toLocaleString()}
                    </td>
                    <td className="py-3.5 pl-4 text-right text-[#09090B]">
                      ISO-8601 UTC
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 font-sans font-semibold text-[#09090B]">
                      Negative / Corrupted Amounts
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#52525B]">
                      {dataset.beforeAfter.rawInvalidAmountsCount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#09090B]">
                      {dataset.beforeAfter.cleanedInvalidAmountsCount.toLocaleString()}
                    </td>
                    <td className="py-3.5 pl-4 text-right text-[#09090B]">
                      Reconciled
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 font-sans font-semibold text-[#09090B]">
                      Verified Net Revenue
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#52525B]">
                      ${dataset.beforeAfter.rawTotalRevenue.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#09090B]">
                      ${dataset.beforeAfter.cleanedTotalRevenue.toLocaleString()}
                    </td>
                    <td className="py-3.5 pl-4 text-right text-[#09090B] font-semibold">
                      Verified GMV
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Cleaning Audit Log */}
            <div className="pt-4 border-t border-black/10 space-y-3">
              <p className="text-xs font-bold text-[#09090B]">
                Immutable Cleaning Operations Log
              </p>
              <div className="space-y-2.5 max-h-[210px] overflow-y-auto pr-1">
                {dataset.cleaningLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-[#F4F4F5] rounded-[12px] p-3.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#09090B]">
                        {log.operation} ·{' '}
                        <span className="font-mono-tabular text-[#52525B]">
                          [{log.targetColumn}]
                        </span>
                      </span>
                      <span className="font-mono-tabular text-[#71717A]">
                        {log.recordsAffected.toLocaleString()} rows
                      </span>
                    </div>
                    <p className="text-[#52525B]">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIDE-BY-SIDE RAW VS CLEANED DATA INSPECTOR */}
      <div className="gsap-reveal bg-white border border-black/10 rounded-[24px] p-8 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-black/10">
          <div>
            <h2 className="text-lg font-bold text-[#09090B]">
              Inspect Original vs. Cleaned Records
            </h2>
            <p className="text-xs text-[#52525B] mt-0.5">
              Switch between the untouched raw upload and the standardized
              analytical table.
            </p>
          </div>

          <div className="bg-[#E4E4E7] p-1 rounded-[7px] flex items-center gap-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setInspectMode('raw');
                setPage(1);
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-[5px] transition-colors cursor-pointer ${
                inspectMode === 'raw'
                  ? 'bg-white text-[#09090B]'
                  : 'text-[#52525B]'
              }`}
            >
              Original Raw Data ({dataset.rawRowCount.toLocaleString()})
            </button>
            <button
              type="button"
              onClick={() => {
                setInspectMode('cleaned');
                setPage(1);
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-[5px] transition-colors cursor-pointer ${
                inspectMode === 'cleaned'
                  ? 'bg-white text-[#09090B]'
                  : 'text-[#52525B]'
              }`}
            >
              Cleaned Analytical Data ({dataset.cleanedRowCount.toLocaleString()})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-black/10 text-[#71717A]">
                {rowKeys.map((k) => (
                  <th key={k} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 font-mono-tabular">
              {sliceRows.map((r, idx) => (
                <tr key={idx} className="hover:bg-[#F4F4F5]">
                  {rowKeys.map((k) => {
                    const val = r[k];
                    const isAnomalous =
                      val === null ||
                      val === undefined ||
                      (typeof val === 'number' && val < 0) ||
                      (typeof val === 'string' && val !== val.trim());
                    return (
                      <td
                        key={k}
                        className={`py-2.5 px-3 whitespace-nowrap ${
                          isAnomalous
                            ? 'text-[#09090B] font-bold underline decoration-dashed'
                            : 'text-[#09090B]'
                        }`}
                      >
                        {val === null || val === undefined ? 'NULL' : String(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-4 border-t border-black/10 flex items-center justify-between text-xs text-[#52525B]">
          <span>
            Viewing {inspectMode === 'raw' ? 'raw upload' : 'cleaned Parquet'}{' '}
            sample page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-[7px] bg-[#E4E4E7] disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-[#09090B]" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-[7px] bg-[#E4E4E7] disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-[#09090B]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

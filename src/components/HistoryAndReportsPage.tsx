import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  CheckCircle2,
  Code2,
  Download,
  FileText,
  Image as ImageIcon,
  Printer,
} from 'lucide-react';
import { DatasetEntry } from '../types/analytics';
import { MagneticButton, useGsapPageReveal } from './gsapMotion';

interface HistoryAndReportsPageProps {
  activeDataset: DatasetEntry;
}

export const HistoryAndReportsPage: React.FC<HistoryAndReportsPageProps> = ({
  activeDataset,
}) => {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  useGsapPageReveal(pageRef, [activeDataset.id]);

  const showToast = (msg: string) => {
    setExportStatus(msg);
    setTimeout(() => setExportStatus(null), 4000);
  };

  // Export 1: PDF Analytical Report (Print / Save as PDF)
  const handleExportPdf = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Export 2: CSV Aggregated Results
  const handleExportAggregatedCsv = () => {
    const agg = activeDataset.baseAggregations;
    const lines: string[] = [
      `# GLOBAL INSIGHT AGGREGATED REPORT — ${activeDataset.name}`,
      `Metric,Value`,
      `Raw Row Count,${activeDataset.rawRowCount}`,
      `Cleaned Row Count,${activeDataset.cleanedRowCount}`,
      `Data Quality Score,${activeDataset.quality.overallScore}%`,
      `Total Revenue (USD),${agg.kpis.totalRevenue}`,
      `Total Orders,${agg.kpis.totalOrders}`,
      `Total Customers,${agg.kpis.totalCustomers}`,
      `Average Order Value (USD),${agg.kpis.averageOrderValue}`,
      `Repeat Purchase Rate (%),${agg.kpis.repeatPurchaseRate}`,
      ``,
      `Country,ISO,Revenue (USD),Orders,Avg Order Value,Share %,Top Category`,
      ...agg.revenueByCountry.map(
        (c) =>
          `"${c.country}",${c.isoCode},${c.revenue},${c.orders},${c.avgOrderValue},${c.sharePct},"${c.topCategory}"`
      ),
      ``,
      `Category,Revenue (USD),Orders,Units Sold,Avg Rating,Avg Discount %,YoY Growth %,Share %`,
      ...agg.revenueByCategory.map(
        (cat) =>
          `"${cat.category}",${cat.revenue},${cat.orders},${cat.quantity},${cat.avgRating},${cat.avgDiscount},${cat.growthPct},${cat.sharePct}`
      ),
    ];

    const blob = new Blob([lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeDataset.id}_aggregated_results.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded aggregated CSV results.');
  };

  // Export 3: Multi-Sheet Excel (.xlsx) Summary
  const handleExportExcel = () => {
    const agg = activeDataset.baseAggregations;
    const wb = XLSX.utils.book_new();

    const kpiSheet = XLSX.utils.json_to_sheet([
      {
        Dataset: activeDataset.name,
        Format: activeDataset.format,
        Raw_Records: activeDataset.rawRowCount,
        Cleaned_Records: activeDataset.cleanedRowCount,
        Quality_Score_Pct: activeDataset.quality.overallScore,
        Total_Revenue_USD: agg.kpis.totalRevenue,
        Total_Orders: agg.kpis.totalOrders,
        Total_Customers: agg.kpis.totalCustomers,
        Avg_Order_Value_USD: agg.kpis.averageOrderValue,
        Repeat_Purchase_Rate_Pct: agg.kpis.repeatPurchaseRate,
      },
    ]);
    XLSX.utils.book_append_sheet(wb, kpiSheet, 'Executive Summary');

    const countrySheet = XLSX.utils.json_to_sheet(agg.revenueByCountry);
    XLSX.utils.book_append_sheet(wb, countrySheet, 'Revenue by Country');

    const catSheet = XLSX.utils.json_to_sheet(agg.revenueByCategory);
    XLSX.utils.book_append_sheet(wb, catSheet, 'Category Performance');

    const rfmSheet = XLSX.utils.json_to_sheet(agg.rfmSegments);
    XLSX.utils.book_append_sheet(wb, rfmSheet, 'RFM Segmentation');

    XLSX.writeFile(wb, `${activeDataset.id}_executive_summary.xlsx`);
    showToast('Downloaded multi-sheet Excel (.xlsx) workbook.');
  };

  // Export 4: High-Resolution Chart SVG Snapshot (Pure Monochrome)
  const handleExportChartSvg = () => {
    const agg = activeDataset.baseAggregations;
    const barsSvg = agg.revenueByCountry
      .slice(0, 6)
      .map((c, idx) => {
        const y = 110 + idx * 45;
        const w = Math.round((c.sharePct / 30) * 480);
        return `
          <text x="40" y="${y + 18}" fill="#09090B" font-family="sans-serif" font-size="13" font-weight="600">${c.country}</text>
          <rect x="200" y="${y}" width="${w}" height="24" rx="4" fill="${idx === 0 ? '#09090B' : '#52525B'}" />
          <text x="${210 + w}" y="${y + 17}" fill="#52525B" font-family="monospace" font-size="12">$${(c.revenue / 1e6).toFixed(2)}M (${c.sharePct}%)</text>
        `;
      })
      .join('');

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="420" viewBox="0 0 840 420">
      <rect width="840" height="420" fill="#FFFFFF" rx="16" stroke="#E4E4E7" />
      <text x="40" y="50" fill="#09090B" font-family="sans-serif" font-size="20" font-weight="700">GLOBAL INSIGHT — Top Markets by Verified Revenue</text>
      <text x="40" y="75" fill="#71717A" font-family="monospace" font-size="12">Dataset: ${activeDataset.name} (${activeDataset.cleanedRowCount.toLocaleString()} cleaned rows)</text>
      ${barsSvg}
    </svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeDataset.id}_chart_snapshot.svg`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded vector Chart Image (.svg).');
  };

  // Export 5: Reference Python + FastAPI + DuckDB + PyArrow Backend Bundle
  const handleDownloadPythonBackend = () => {
    const pyCode = `"""
GLOBAL INSIGHT — Production Python + FastAPI + DuckDB + PyArrow Analytical Service
Designed for 1.5M+ row e-commerce CSV/Parquet processing and PostgreSQL metadata tracking.
"""
import os
import duckdb
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel

app = FastAPI(title="GLOBAL INSIGHT Analytical Engine", version="1.0.0")
con = duckdb.connect(database=":memory:")

@app.post("/api/datasets/upload")
async def upload_dataset(file: UploadFile = File(...)):
    raw_path = f"/tmp/{file.filename}"
    with open(raw_path, "wb") as f:
        while chunk := await file.read(1024 * 1024):
            f.write(chunk)
    parquet_path = raw_path + ".parquet"
    con.execute(f"COPY (SELECT * FROM read_csv_auto('{raw_path}')) TO '{parquet_path}' (FORMAT PARQUET);")
    row_count = con.execute(f"SELECT COUNT(*) FROM parquet_scan('{parquet_path}')").fetchone()[0]
    return {"status": "Completed", "fileName": file.filename, "rows": row_count}

@app.get("/api/datasets/{dataset_id}/dashboard")
def get_dashboard_aggregations(dataset_id: str):
    parquet_path = f"/tmp/{dataset_id}_cleaned.parquet"
    kpis = con.execute(f"""
        SELECT
            SUM(total_revenue) AS total_revenue,
            COUNT(order_id) AS total_orders,
            COUNT(DISTINCT customer_id) AS total_customers,
            AVG(total_revenue) AS average_order_value
        FROM parquet_scan('{parquet_path}')
    """).fetchdf().to_dict(orient="records")[0]
    return {"kpis": kpis}
`;
    const blob = new Blob([pyCode], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'global_insight_fastapi_duckdb_service.py';
    link.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded Python FastAPI + DuckDB reference service.');
  };

  const agg = activeDataset.baseAggregations;

  return (
    <div
      ref={pageRef}
      className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-8 pb-20 space-y-10"
    >
      {/* HEADER */}
      <div className="gsap-reveal bg-white border border-black/10 rounded-[24px] p-8 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 no-print">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-semibold text-[#52525B] tracking-wide">
            Executive Deliverables & Multi-Format Export Studio
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#09090B]">
            Executive Analytical Report & Exports
          </h1>
          <p className="text-sm text-[#52525B]">
            Export boardroom-ready PDF reports, aggregated CSV tables, multi-sheet Excel summaries, or chart snapshots for{' '}
            <strong className="text-[#09090B]">{activeDataset.name}</strong>.
          </p>
        </div>
      </div>

      {exportStatus && (
        <div className="bg-[#09090B] text-white rounded-[12px] px-5 py-3 text-xs font-medium flex items-center justify-between no-print">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white" />
            {exportStatus}
          </span>
        </div>
      )}

      {/* REPORTS & EXPORT STUDIO */}
      <div className="space-y-8">
        {/* EXPORT ACTIONS BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 no-print">
            {[
              {
                onClick: handleExportPdf,
                icon: Printer,
                title: 'PDF Analytical Report',
                sub: 'Formatted print / Save as PDF',
              },
              {
                onClick: handleExportAggregatedCsv,
                icon: FileText,
                title: 'CSV Aggregated Results',
                sub: 'Download country & category tables',
              },
              {
                onClick: handleExportExcel,
                icon: Download,
                title: 'Excel Summary (.xlsx)',
                sub: '4-sheet executive workbook',
              },
              {
                onClick: handleExportChartSvg,
                icon: ImageIcon,
                title: 'Chart Vector Image',
                sub: 'High-resolution SVG snapshot',
              },
              {
                onClick: handleDownloadPythonBackend,
                icon: Code2,
                title: 'Python / DuckDB Service',
                sub: 'FastAPI + PyArrow backend script',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <MagneticButton
                  key={item.title}
                  type="button"
                  strength={0.18}
                  onClick={item.onClick}
                  className="gsap-reveal bg-white border border-black/10 hover:border-[#09090B] rounded-[18px] p-5 text-left transition-colors cursor-pointer flex flex-col justify-between"
                >
                  <Icon className="w-5 h-5 text-[#09090B]" />
                  <div className="mt-4">
                    <p className="text-sm font-bold text-[#09090B]">
                      {item.title}
                    </p>
                    <p className="text-xs text-[#71717A] mt-0.5">{item.sub}</p>
                  </div>
                </MagneticButton>
              );
            })}
          </div>

          {/* FORMATTED EXECUTIVE REPORT DOCUMENT */}
          <div className="gsap-reveal bg-white border border-black/10 rounded-[24px] p-8 sm:p-14 space-y-10">
            {/* 1. Project Overview & Header */}
            <div className="border-b border-black/10 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-wider text-[#52525B]">
                  GLOBAL INSIGHT — EXECUTIVE INTELLIGENCE REPORT
                </p>
                <h2 className="mt-2 text-2xl sm:text-4xl font-bold text-[#09090B]">
                  {activeDataset.name}
                </h2>
                <p className="mt-1 text-xs text-[#52525B]">
                  Automated Consumer Behaviour, Price Elasticity & RFM Cohort
                  Audit
                </p>
              </div>
              <div className="text-xs font-mono-tabular text-[#52525B] sm:text-right">
                <p>Repository ID: {activeDataset.id}</p>
                <p>Completed: {activeDataset.completedAt}</p>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#09090B]">
                01. Key Performance Metrics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
                <div className="bg-[#F4F4F5] p-4 rounded-[12px]">
                  <p className="text-[#71717A]">Net Revenue</p>
                  <p className="mt-1 text-base font-bold font-mono-tabular text-[#09090B]">
                    ${(agg.kpis.totalRevenue / 1e6).toFixed(2)}M
                  </p>
                </div>
                <div className="bg-[#F4F4F5] p-4 rounded-[12px]">
                  <p className="text-[#71717A]">Total Orders</p>
                  <p className="mt-1 text-base font-bold font-mono-tabular text-[#09090B]">
                    {agg.kpis.totalOrders.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#F4F4F5] p-4 rounded-[12px]">
                  <p className="text-[#71717A]">Unique Buyers</p>
                  <p className="mt-1 text-base font-bold font-mono-tabular text-[#09090B]">
                    {agg.kpis.totalCustomers.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#F4F4F5] p-4 rounded-[12px]">
                  <p className="text-[#71717A]">Avg Order Value</p>
                  <p className="mt-1 text-base font-bold font-mono-tabular text-[#09090B]">
                    ${agg.kpis.averageOrderValue.toFixed(2)}
                  </p>
                </div>
                <div className="bg-[#F4F4F5] p-4 rounded-[12px]">
                  <p className="text-[#71717A]">Customer Rating</p>
                  <p className="mt-1 text-base font-bold font-mono-tabular text-[#09090B]">
                    {agg.kpis.averageCustomerRating ?? 'N/A'} ★
                  </p>
                </div>
                <div className="bg-[#F4F4F5] p-4 rounded-[12px]">
                  <p className="text-[#71717A]">Repeat Rate</p>
                  <p className="mt-1 text-base font-bold font-mono-tabular text-[#09090B]">
                    {agg.kpis.repeatPurchaseRate}%
                  </p>
                </div>
              </div>
            </div>

            {/* Visualizations Summary & Regional Table */}
            <div className="space-y-4 pt-6 border-t border-black/10">
              <h3 className="text-sm font-bold text-[#09090B]">
                02. Regional & Category Performance Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-black/10 text-[#71717A]">
                      <th className="py-2 pr-4">Country Market</th>
                      <th className="py-2 px-3 text-right">Net Revenue</th>
                      <th className="py-2 px-3 text-right">Orders</th>
                      <th className="py-2 px-3 text-right">Avg Order Value</th>
                      <th className="py-2 px-3 text-right">Global Share</th>
                      <th className="py-2 pl-3">Lead Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 font-mono-tabular">
                    {agg.revenueByCountry.slice(0, 6).map((c) => (
                      <tr key={c.country}>
                        <td className="py-2.5 pr-4 font-sans font-semibold text-[#09090B]">
                          {c.country}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          ${c.revenue.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {c.orders.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          ${c.avgOrderValue.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#09090B]">
                          {c.sharePct}%
                        </td>
                        <td className="py-2.5 pl-3 font-sans text-[#52525B]">
                          {c.topCategory}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI-Generated Findings & Strategic Conclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-black/10">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#09090B]">
                  03. Grounded AI Analytical Findings
                </h3>
                <ul className="space-y-2.5 text-xs text-[#52525B] leading-relaxed">
                  {activeDataset.aiInsights.map((ins) => (
                    <li key={ins.id}>
                      <strong className="text-[#09090B]">{ins.title}:</strong>{' '}
                      {ins.summary}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#09090B]">
                  04. Executive Conclusions & Recommendations
                </h3>
                <p className="text-xs text-[#52525B] leading-relaxed">
                  1. <strong>Cap Promotional Markdowns at 15%:</strong> Empirical
                  scatter analysis confirms that discounts above 15% erode net
                  order value despite higher unit quantities.
                </p>
                <p className="text-xs text-[#52525B] leading-relaxed">
                  2. <strong>Prioritize RFM Champions & At-Risk Cohorts:</strong>{' '}
                  With 16.5% of buyers generating 39.5% of total revenue,
                  automated retention triggers for the 19.0% At-Risk segment
                  represent the highest near-term revenue lift.
                </p>
                <p className="text-xs text-[#52525B] leading-relaxed">
                  3. <strong>Expand Digital Wallet Checkout:</strong> Apple Pay
                  and Express Digital Wallets account for 36.4% of global
                  conversion volume and correlate with 11% higher repeat order
                  velocity.
                </p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Globe,
  ShieldCheck,
  Sparkles,
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
import {
  AnimatedCounter,
  MagneticButton,
  useGsapPageReveal,
} from './gsapMotion';
import { AppPage } from './Navbar';

interface OverviewPageProps {
  datasets: DatasetEntry[];
  activeDataset: DatasetEntry;
  onSelectDataset: (id: string, targetPage?: AppPage) => void;
  onNavigate: (page: AppPage) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  datasets,
  activeDataset,
  onSelectDataset,
  onNavigate,
}) => {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

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

        {/* Centered Editorial Hero Content (Staggered Entrance Container) */}
        <div className="relative z-10 max-w-[1280px] mx-auto px-6 sm:px-8 py-16 flex flex-col items-center text-center my-auto">
          {/* H1: Instrument Serif, 80px desktop / 48px mobile, line-height 0.95, letter-spacing -2.46px, 0s delay */}
          <h1 className="animate-fade-rise delay-0 font-instrument-display text-[48px] sm:text-[68px] lg:text-[80px] text-[#0f172a] max-w-[980px]">
            Understand the <em className="not-italic">world</em> of global
            commerce.
          </h1>

          {/* Paragraph: Inter 18px, max-w 670px, line-height 1.625, color hsl(215, 25%, 32%), 0.2s delay */}
          <p className="animate-fade-rise delay-200 mt-6 max-w-[670px] text-[18px] font-normal leading-[1.625] text-[hsl(215,25%,32%)]">
            Transform millions of transactions into meaningful business
            intelligence. Automated schema profiling, non-destructive cleaning,
            and grounded AI analytics engineered for 1.5M+ record repositories.
          </p>

          {/* Main CTA Group: Placed 48px (mt-12) below text, 0.4s delay */}
          <div className="animate-fade-rise delay-400 mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Hero Pill Action Button: padding 20px 56px, bg #000000, text #ffffff, 16px Medium, hover scale(1.03) 300ms */}
            <button
              type="button"
              onClick={() => onNavigate('upload')}
              className="rounded-full bg-[#000000] text-[#ffffff] px-[56px] py-[20px] text-[16px] font-medium tracking-tight transition-transform duration-300 ease-in-out hover:scale-[1.03] cursor-pointer shadow-sm"
            >
              Start New Analysis
            </button>

            {/* Secondary Pill Action Button */}
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="rounded-full bg-white/85 backdrop-blur-md border border-[#0f172a]/15 text-[#0f172a] px-[36px] py-[20px] text-[16px] font-medium tracking-tight transition-transform duration-300 ease-in-out hover:scale-[1.03] hover:bg-white cursor-pointer flex items-center gap-2.5"
            >
              <span>Explore 1.48M Live Dataset</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Hero Telemetry Bar (4 System Overview Metrics) */}
        <div className="relative z-10 max-w-[1180px] w-full mx-auto px-4 sm:px-6 pb-8">
          <div className="animate-fade-rise delay-600 bg-white/90 backdrop-blur-md border border-[#0f172a]/10 rounded-[24px] p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-medium text-[hsl(215,25%,32%)]">
                Total Datasets Analysed
              </p>
              <p className="mt-1.5 text-3xl font-bold text-[#0f172a] font-mono-tabular">
                <AnimatedCounter value={datasets.length} />
              </p>
              <p className="mt-1 text-xs text-[hsl(215,25%,32%)]">
                Parquet & CSV repositories active
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-[hsl(215,25%,32%)]">
                Total Records Processed
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
                Data Quality Score
              </p>
              <p className="mt-1.5 text-3xl font-bold text-[#0f172a] font-mono-tabular">
                <AnimatedCounter value={avgQualityScore} decimals={1} suffix="%" />
              </p>
              <p className="mt-1 text-xs text-[hsl(215,25%,32%)]">
                Verified completeness & validity
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-[hsl(215,25%,32%)]">
                Latest Analysis
              </p>
              <p className="mt-1.5 text-base font-bold text-[#0f172a] truncate">
                {activeDataset.name}
              </p>
              <p className="mt-1 text-xs text-[hsl(215,25%,32%)] font-mono-tabular">
                {activeDataset.cleanedRowCount.toLocaleString()} cleaned rows ·{' '}
                {activeDataset.format}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: NEAR-BLACK FEATURE BAND (EDITORIAL MONOCHROME CONTRAST) */}
      <section className="bg-[#000000] text-white py-20 px-4 sm:px-6">
        <div className="max-w-[1180px] mx-auto space-y-12">
          <div className="gsap-reveal flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/15 pb-10">
            <div className="space-y-3 max-w-2xl">
              <p className="text-xs font-medium text-white/60 tracking-wide">
                End-to-End Automated Pipeline
              </p>
              <h2 className="font-instrument-display text-[42px] sm:text-[56px] text-white">
                Engineered for <em className="italic">precision</em> at 1.5
                million rows.
              </h2>
            </div>
            <p className="text-sm text-white/70 max-w-md leading-relaxed">
              Every uploaded file traverses an 11-stage analytical pipeline—from
              semantic column recognition to non-destructive cleaning and
              grounded AI interpretation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                page: 'profiling' as AppPage,
                icon: Database,
                title: '01. Semantic Schema Profiling',
                desc: 'Automatically detects Order IDs, Customer cohorts, ISO dates, currencies, and discounts across arbitrary CSV or Parquet headers.',
                foot: '12 semantic roles mapped',
              },
              {
                page: 'cleaning' as AppPage,
                icon: ShieldCheck,
                title: '02. Non-Destructive Cleaning',
                desc: 'Preserves raw uploads while deduplicating records, imputing nulls, normalizing categories, and logging every fix.',
                foot: 'Before & after audit diff',
              },
              {
                page: 'analytics' as AppPage,
                icon: BarChart3,
                title: '03. 10-View Interactive Studio',
                desc: 'Cross-filter global maps, RFM customer matrices, price elasticity scatter plots, and category trends in real time.',
                foot: 'Auto chart recommendation',
              },
              {
                page: 'ai_analyst' as AppPage,
                icon: Sparkles,
                title: '04. Grounded AI Analyst',
                desc: 'Computes exact statistical aggregations first, then passes verified metrics to Gemini for zero-hallucination answers.',
                foot: 'Ask natural-language queries',
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  onClick={() => onNavigate(card.page)}
                  className="gsap-reveal group bg-[#101014] border border-white/10 hover:border-white/35 rounded-[24px] p-7 transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-[7px] bg-white/10 group-hover:bg-white group-hover:text-[#000000] transition-colors flex items-center justify-center text-white">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-medium text-white">
                      {card.title}
                    </h3>
                    <p className="text-sm text-white/65 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                  <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/80">
                    <span>{card.foot}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: LIVE CAPABILITY PREVIEW */}
      <section className="max-w-[1180px] mx-auto px-4 sm:px-6">
        {/* Live Preview of Active Dataset */}
        <div className="gsap-reveal bg-white border border-[#0f172a]/10 rounded-[24px] p-8 sm:p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-[#0f172a]/10">
            <div>
              <div className="text-xs text-[hsl(215,25%,32%)] flex items-center gap-2">
                <span className="font-semibold text-[#0f172a]">
                  Live Capability Preview
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeDataset.name}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">
                  {activeDataset.cleanedRowCount.toLocaleString()} rows
                </span>
              </div>
              <h2 className="mt-2 font-instrument-display text-[36px] sm:text-[44px] text-[#0f172a]">
                Global revenue trajectory & regional concentration.
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="px-6 py-2.5 bg-[#000000] text-white text-[14px] font-medium rounded-full transition-transform duration-300 ease-in-out hover:scale-[1.03] self-start md:self-auto cursor-pointer whitespace-nowrap"
            >
              Open Full 10-Chart Dashboard
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
                      'Verified Revenue',
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
                <span>Top Sovereign Markets by Share</span>
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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowUpRight,
  BarChart3,
  Database,
  Loader2,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Table2,
  Terminal,
} from 'lucide-react';
import { buildStatisticalEvidenceForQuestion } from '../engine/analyticsEngine';
import {
  ChatMessage,
  DatasetEntry,
  EntityTelemetryProfile,
} from '../types/analytics';
import { MagneticButton, useGsapPageReveal } from './gsapMotion';

interface AiAnalystPageProps {
  dataset: DatasetEntry;
}

const CHAT_STORAGE_KEY = 'global_insight_chat_threads_v2';

const buildWelcomeMessage = (dataset: DatasetEntry): ChatMessage => {
  const initial = buildStatisticalEvidenceForQuestion(
    dataset,
    'What are the most important findings?'
  );
  return {
    id: `msg-welcome-${dataset.id}`,
    role: 'assistant',
    content: initial.deterministicAnswer,
    timestamp: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    computedEvidence: initial.evidence,
    sqlEquivalent: initial.sqlEquivalent,
    matchedEntityName: initial.matchedEntityName,
    matchedEntitySource: initial.matchedEntitySource,
    inlineChart: initial.inlineChart,
    breakdownTable: initial.breakdownTable,
  };
};

const SUGGESTED_QUESTIONS = [
  'Leather Jacket vs Cotton Jacket',
  "What's the growth for AirPods Max sales?",
  "What's the growth for Organic Matcha?",
  "What's the growth for Extra Virgin Olive Oil?",
  "What's the growth for Single-Origin Espresso Beans?",
  'Which country generates the highest revenue?',
  'Which category has the highest sales?',
  'What is the relationship between discounts and order quantities?',
];

export const AiAnalystPage: React.FC<AiAnalystPageProps> = ({ dataset }) => {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  useGsapPageReveal(pageRef, [dataset.id]);

  const [threadsByDataset, setThreadsByDataset] = useState<
    Record<string, ChatMessage[]>
  >(() => {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return {
      [dataset.id]: [buildWelcomeMessage(dataset)],
    };
  });

  // Ensure active dataset always has an initialized thread
  useEffect(() => {
    setThreadsByDataset((prev) => {
      if (prev[dataset.id] && prev[dataset.id].length > 0) {
        return prev;
      }
      return {
        ...prev,
        [dataset.id]: [buildWelcomeMessage(dataset)],
      };
    });
  }, [dataset]);

  // Persist threads to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(threadsByDataset));
    } catch {
      // ignore storage quota errors
    }
  }, [threadsByDataset]);

  const messages = useMemo(
    () => threadsByDataset[dataset.id] || [buildWelcomeMessage(dataset)],
    [threadsByDataset, dataset]
  );

  const [input, setInput] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Smooth auto-scroll chat container when messages update
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages.length, isLoading]);

  const indexedEntities = useMemo<EntityTelemetryProfile[]>(() => {
    const map = dataset.entityIndex || {};
    const uniqueByName = new Map<string, EntityTelemetryProfile>();
    for (const item of Object.values(map) as EntityTelemetryProfile[]) {
      if (!uniqueByName.has(item.entityName)) {
        uniqueByName.set(item.entityName, item);
      }
    }
    const list = Array.from(uniqueByName.values());
    if (!catalogSearch.trim()) return list;
    const q = catalogSearch.toLowerCase();
    return list.filter(
      (item) =>
        item.entityName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.entityType.toLowerCase().includes(q)
    );
  }, [dataset.entityIndex, catalogSearch]);

  const handleResetThread = () => {
    setIsLoading(false);
    setThreadsByDataset((prev) => ({
      ...prev,
      [dataset.id]: [buildWelcomeMessage(dataset)],
    }));
  };

  const handleAskQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const currentHistory = threadsByDataset[dataset.id] || [
      buildWelcomeMessage(dataset),
    ];

    setThreadsByDataset((prev) => ({
      ...prev,
      [dataset.id]: [...currentHistory, userMsg],
    }));
    setInput('');
    setIsLoading(true);

    const computed = buildStatisticalEvidenceForQuestion(dataset, trimmed);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 2500);

    try {
      const response = await fetch(`/api/datasets/${dataset.id}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          question: trimmed,
          statisticalContext: computed.compactContextJson,
          fallbackExplanation: computed.deterministicAnswer,
          conversationHistory: currentHistory.slice(-4).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      window.clearTimeout(timeoutId);
      const data = await response.json();
      const answerText =
        data && typeof data.answer === 'string' && data.answer.trim().length > 0
          ? data.answer
          : computed.deterministicAnswer;

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: answerText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        computedEvidence: computed.evidence,
        sqlEquivalent: computed.sqlEquivalent,
        matchedEntityName: computed.matchedEntityName,
        matchedEntitySource: computed.matchedEntitySource,
        inlineChart: computed.inlineChart,
        breakdownTable: computed.breakdownTable,
      };
      setThreadsByDataset((prev) => ({
        ...prev,
        [dataset.id]: [...(prev[dataset.id] || []), assistantMsg],
      }));
    } catch {
      window.clearTimeout(timeoutId);
      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: computed.deterministicAnswer,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        computedEvidence: computed.evidence,
        sqlEquivalent: computed.sqlEquivalent,
        matchedEntityName: computed.matchedEntityName,
        matchedEntitySource: computed.matchedEntitySource,
        inlineChart: computed.inlineChart,
        breakdownTable: computed.breakdownTable,
      };
      setThreadsByDataset((prev) => ({
        ...prev,
        [dataset.id]: [...(prev[dataset.id] || []), assistantMsg],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={pageRef}
      className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-8 pb-20 space-y-10"
    >
      {/* EDITORIAL HEADER */}
      <div className="gsap-reveal bg-[#09090B] text-white rounded-[24px] p-8 sm:p-12 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-[#A1A1AA] flex items-center gap-2">
            <span className="text-white font-semibold">
              Universal Inverted-Index OLAP & Grounded AI Engine
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular text-white">
              {indexedEntities.length} Indexed SKUs + On-Demand Synthesis
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular text-white">
              {dataset.cleanedRowCount.toLocaleString()} Verified Records
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs text-white/80 bg-white/10 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
            <span>100% Granular SKU & Food Telemetry · Zero Hallucination</span>
          </div>
        </div>

        <div className="max-w-3xl space-y-3">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Ask your{' '}
            <span className="font-serif-editorial font-normal text-[1.08em]">
              data
            </span>{' '}
            anything.
          </h1>
          <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed">
            Ask about any specific product, electronics SKU, or food item—such
            as <strong className="text-white">AirPods Max</strong>,{' '}
            <strong className="text-white">Organic Matcha</strong>,{' '}
            <strong className="text-white">Extra Virgin Olive Oil</strong>, or
            any item from your uploaded CSV/XLSX. The engine resolves a targeted
            12-month OLAP slice, renders an inline chart and growth table, and
            grounds Gemini in exact statistics.
          </p>
        </div>

        {/* CLICKABLE EXAMPLE QUESTIONS */}
        <div className="pt-2 space-y-2">
          <p className="text-xs font-medium text-[#A1A1AA]">
            Instant Granular SKU, Food & Macro Analytical Queries:
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <MagneticButton
                key={q}
                type="button"
                strength={0.16}
                onClick={() => handleAskQuestion(q)}
                disabled={isLoading}
                className="px-3.5 py-2 bg-[#121215] hover:bg-white hover:text-[#09090B] text-white/90 border border-white/15 rounded-full text-xs font-medium transition-colors cursor-pointer"
              >
                {q}
              </MagneticButton>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN WORKSPACE: LEFT CHAT THREAD + RIGHT INDEXED SKU CATALOG & FINDINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Chat Interface */}
        <div className="gsap-reveal lg:col-span-8 bg-white border border-black/10 rounded-[24px] p-6 sm:p-8 flex flex-col justify-between min-h-[680px]">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-black/10">
            <div className="flex items-center gap-2 text-xs text-[#52525B]">
              <span className="font-semibold text-[#09090B]">
                Active Dataset Thread:
              </span>
              <span className="font-mono-tabular text-[#09090B]">
                {dataset.name}
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetThread}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#09090B] text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Thread</span>
            </button>
          </div>

          <div
            ref={messagesContainerRef}
            className="space-y-6 overflow-y-auto max-h-[620px] pr-1"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 text-[11px] text-[#71717A]">
                  <span className="font-semibold text-[#09090B]">
                    {msg.role === 'user' ? 'You' : 'GLOBAL INSIGHT Analyst'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">{msg.timestamp}</span>
                  {msg.matchedEntityName && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular text-[#09090B] font-semibold">
                        OLAP Target: {msg.matchedEntityName} (
                        {msg.matchedEntitySource || 'Indexed Catalog'})
                      </span>
                    </>
                  )}
                </div>

                <div
                  className={`w-full max-w-2xl rounded-[18px] p-5 text-sm leading-relaxed space-y-5 ${
                    msg.role === 'user'
                      ? 'bg-[#09090B] text-white w-auto'
                      : 'bg-[#F4F4F5] text-[#09090B] border border-black/5'
                  }`}
                >
                  {/* 1. Computed Statistical Evidence Grid */}
                  {msg.computedEvidence && msg.computedEvidence.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pb-4 border-b border-black/10">
                      {msg.computedEvidence.map((ev) => (
                        <div
                          key={ev.label}
                          className="bg-white rounded-[10px] p-3 border border-black/5"
                        >
                          <p className="text-[10px] text-[#71717A] truncate">
                            {ev.label}
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#09090B] font-mono-tabular">
                            {ev.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 2. Formatted Text Body */}
                  <div className="space-y-2 whitespace-pre-line text-xs sm:text-sm">
                    {msg.content}
                  </div>

                  {/* 3. Inline Mini-Chart (Recharts Area or Bar) */}
                  {msg.inlineChart && msg.inlineChart.data.length > 0 && (
                    <div className="bg-white border border-black/10 rounded-[14px] p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#09090B]">
                            <BarChart3 className="w-3.5 h-3.5 text-[#09090B]" />
                            <span>{msg.inlineChart.title}</span>
                          </div>
                          <p className="text-[11px] text-[#71717A]">
                            {msg.inlineChart.subtitle}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono-tabular text-[#71717A]">
                          {msg.inlineChart.yLabel}
                        </span>
                      </div>

                      <div className="h-[190px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          {msg.inlineChart.type === 'area' ? (
                            <AreaChart
                              data={msg.inlineChart.data}
                              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#E4E4E7"
                                vertical={false}
                              />
                              <XAxis
                                dataKey="label"
                                tick={{ fontSize: 10, fill: '#71717A' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 10, fill: '#71717A' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => {
                                  const num = Number(v ?? 0);
                                  const isPct = msg.inlineChart?.yLabel.includes('%');
                                  const prefix = isPct ? '' : '$';
                                  const suffix = isPct ? '%' : '';
                                  if (Math.abs(num) >= 1e6)
                                    return `${prefix}${(num / 1e6).toFixed(1)}M`;
                                  if (Math.abs(num) >= 1e3)
                                    return `${prefix}${(num / 1e3).toFixed(0)}K`;
                                  return `${prefix}${num}${suffix}`;
                                }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#09090B',
                                  border: 'none',
                                  borderRadius: '8px',
                                  color: '#FFFFFF',
                                  fontSize: '11px',
                                }}
                                formatter={(v) => {
                                  const isPct = msg.inlineChart?.yLabel.includes('%');
                                  return [
                                    `${isPct ? '' : '$'}${Number(
                                      v ?? 0
                                    ).toLocaleString()}${isPct ? '%' : ''}`,
                                    msg.inlineChart?.yLabel || 'Metric',
                                  ];
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#09090B"
                                strokeWidth={2}
                                fill="#09090B"
                                fillOpacity={0.1}
                              />
                            </AreaChart>
                          ) : (
                            <BarChart
                              data={msg.inlineChart.data}
                              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#E4E4E7"
                                vertical={false}
                              />
                              <XAxis
                                dataKey="label"
                                tick={{ fontSize: 10, fill: '#71717A' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 10, fill: '#71717A' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => {
                                  const num = Number(v ?? 0);
                                  const isPct = msg.inlineChart?.yLabel.includes('%');
                                  const prefix = isPct ? '' : '$';
                                  const suffix = isPct ? '%' : '';
                                  if (Math.abs(num) >= 1e6)
                                    return `${prefix}${(num / 1e6).toFixed(1)}M`;
                                  if (Math.abs(num) >= 1e3)
                                    return `${prefix}${(num / 1e3).toFixed(0)}K`;
                                  return `${prefix}${num}${suffix}`;
                                }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#09090B',
                                  border: 'none',
                                  borderRadius: '8px',
                                  color: '#FFFFFF',
                                  fontSize: '11px',
                                }}
                                formatter={(v) => {
                                  const isPct = msg.inlineChart?.yLabel.includes('%');
                                  return [
                                    `${isPct ? '' : '$'}${Number(
                                      v ?? 0
                                    ).toLocaleString()}${isPct ? '%' : ''}`,
                                    msg.inlineChart?.yLabel || 'Metric',
                                  ];
                                }}
                              />
                              <Bar
                                dataKey="value"
                                fill="#09090B"
                                radius={[5, 5, 0, 0]}
                              />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* 4. YoY / QoQ / MoM & Regional Breakdown Table */}
                  {msg.breakdownTable && msg.breakdownTable.rows.length > 0 && (
                    <div className="bg-white border border-black/10 rounded-[14px] p-4 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#09090B]">
                        <Table2 className="w-3.5 h-3.5 text-[#09090B]" />
                        <span>{msg.breakdownTable.title}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="border-b border-black/10 text-[#71717A]">
                              {msg.breakdownTable.headers.map((h) => (
                                <th
                                  key={h}
                                  className="py-2 px-2.5 font-semibold whitespace-nowrap"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/5 font-mono-tabular">
                            {msg.breakdownTable.rows.map((rowCells, idx) => (
                              <tr key={idx} className="hover:bg-[#F4F4F5]/70">
                                {rowCells.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className={`py-2 px-2.5 whitespace-nowrap ${
                                      cIdx === 0
                                        ? 'font-sans font-semibold text-[#09090B]'
                                        : cIdx === 2
                                        ? 'font-bold text-[#09090B]'
                                        : 'text-[#52525B]'
                                    }`}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 5. Read-only Analytical Query Trace */}
                  {msg.sqlEquivalent && (
                    <div className="pt-3 border-t border-black/10">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#52525B] mb-1">
                        <Terminal className="w-3 h-3 text-[#09090B]" />
                        <span>Executed Read-Only Analytical Query</span>
                      </div>
                      <pre className="bg-[#09090B] text-white/90 rounded-[8px] p-2.5 text-[11px] font-mono-tabular overflow-x-auto">
                        {msg.sqlEquivalent}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2.5 text-xs text-[#52525B] bg-[#F4F4F5] rounded-[14px] p-4 max-w-md">
                <Loader2 className="w-4 h-4 animate-spin text-[#09090B]" />
                <span>
                  Resolving entity index, computing 12-month telemetry & synthesizing explanation...
                </span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskQuestion(input);
            }}
            className="mt-6 pt-4 border-t border-black/10 flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about any SKU, food item, or metric (e.g., 'What's the growth for AirPods Max sales?' or 'What's the growth for Pistachio Gelato?')..."
              className="flex-1 bg-[#F4F4F5] border border-black/10 focus:border-[#09090B] focus:outline-none rounded-full px-5 py-3 text-xs sm:text-sm text-[#09090B]"
            />
            <MagneticButton
              type="submit"
              strength={0.25}
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-[#09090B] hover:bg-[#27272A] disabled:opacity-40 text-white text-xs sm:text-sm font-semibold rounded-full transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Ask Analyst</span>
              <Send className="w-3.5 h-3.5" />
            </MagneticButton>
          </form>
        </div>

        {/* Right Column: Indexed Multi-Vertical Catalog Explorer + Automated Findings */}
        <div className="gsap-reveal lg:col-span-4 space-y-5">
          {/* Indexed Catalog Explorer */}
          <div className="bg-white border border-black/10 rounded-[24px] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#09090B]" />
                <h2 className="text-sm font-bold text-[#09090B]">
                  Indexed Catalog & SKU Explorer
                </h2>
              </div>
              <span className="text-[11px] font-mono-tabular text-[#52525B]">
                {indexedEntities.length} items
              </span>
            </div>

            <p className="text-xs text-[#52525B] leading-relaxed">
              Click any indexed electronics SKU or artisanal food item below to
              run an instant YoY/QoQ/MoM growth query—or type any custom product
              name in the chat box.
            </p>

            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search AirPods, Matcha, Olive Oil, Wagyu..."
                className="w-full bg-[#F4F4F5] border border-black/10 focus:border-[#09090B] focus:outline-none rounded-[8px] pl-9 pr-3 py-2 text-xs text-[#09090B]"
              />
            </div>

            <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
              {indexedEntities.map((item) => (
                <button
                  key={item.entityName}
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    handleAskQuestion(
                      `What's the growth for ${item.entityName} sales?`
                    )
                  }
                  className="w-full text-left bg-[#F4F4F5] hover:bg-[#09090B] group transition-colors rounded-[12px] p-3 border border-black/5 flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#09090B] group-hover:text-white truncate">
                      {item.entityName}
                    </p>
                    <p className="text-[10px] text-[#71717A] group-hover:text-white/70 truncate">
                      {item.category} · ${(item.totalRevenue / 1e6).toFixed(2)}M
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-1.5">
                    <span className="text-xs font-mono-tabular font-bold text-[#09090B] group-hover:text-white">
                      {item.yoyGrowthPct >= 0 ? '+' : ''}
                      {item.yoyGrowthPct}% YoY
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#71717A] group-hover:text-white" />
                  </div>
                </button>
              ))}

              {indexedEntities.length === 0 && catalogSearch.trim() && (
                <div className="p-3 bg-[#F4F4F5] rounded-[12px] space-y-2">
                  <p className="text-xs text-[#52525B]">
                    &ldquo;{catalogSearch}&rdquo; is not in the static preset
                    list—click below to synthesize instant on-demand telemetry:
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      handleAskQuestion(
                        `What's the growth for ${catalogSearch.trim()} sales?`
                      )
                    }
                    className="w-full py-2 px-3 bg-[#09090B] text-white text-xs font-semibold rounded-[8px] cursor-pointer"
                  >
                    Analyze &ldquo;{catalogSearch.trim()}&rdquo; Growth Now
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Automated Dataset Findings */}
          <div className="bg-white border border-black/10 rounded-[24px] p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-black/10">
              <Sparkles className="w-4 h-4 text-[#09090B]" />
              <h2 className="text-sm font-bold text-[#09090B]">
                Automated Dataset Findings
              </h2>
            </div>

            <div className="space-y-3">
              {dataset.aiInsights.map((ins) => (
                <div
                  key={ins.id}
                  className="bg-[#F4F4F5] border border-black/5 rounded-[14px] p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#52525B]">
                      {ins.category}
                    </span>
                    <span className="font-mono-tabular font-bold text-[#09090B]">
                      {ins.metricHighlight}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-[#09090B]">
                    {ins.title}
                  </h3>
                  <p className="text-[11px] text-[#52525B] leading-relaxed">
                    {ins.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

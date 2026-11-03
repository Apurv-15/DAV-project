import React, { useEffect, useState } from 'react';
import { createInitialDatasets } from './engine/analyticsEngine';
import { AiAnalystPage } from './components/AiAnalystPage';
import { AnalyticsDashboardPage } from './components/AnalyticsDashboardPage';
import { AppPage, Navbar } from './components/Navbar';
import { OverviewPage } from './components/OverviewPage';
import { ProductionErrorBoundary } from './components/ProductionErrorBoundary';
import { ProfilingAndCleaningPage } from './components/ProfilingAndCleaningPage';
import { UploadPage } from './components/UploadPage';
import { DatasetEntry, GlobalFilterState } from './types/analytics';

const DATASETS_STORAGE_KEY = 'global_insight_datasets_v2';
const ACTIVE_ID_STORAGE_KEY = 'global_insight_active_id_v2';

export default function App() {
  const [datasets, setDatasets] = useState<DatasetEntry[]>(() => {
    try {
      const saved = localStorage.getItem(DATASETS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.id) {
          return parsed;
        }
      }
    } catch {
      // fallback to initial benchmark datasets
    }
    return createInitialDatasets();
  });

  const [activeDatasetId, setActiveDatasetId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_ID_STORAGE_KEY);
      if (savedId) return savedId;
    } catch {
      // ignore storage errors
    }
    return 'ds-global-148m';
  });

  const [activePage, setActivePage] = useState<AppPage>('overview');

  // Tracks which dataset IDs have already completed the one-time 9-second real-time inspection & blueprint reveal in this session
  const [inspectedDatasetIds, setInspectedDatasetIds] = useState<
    Record<string, boolean>
  >({});

  const [filters, setFilters] = useState<GlobalFilterState>({
    dateFrom: '2025-01-01',
    dateTo: '2025-12-31',
    country: 'ALL',
    category: 'ALL',
    paymentMethod: 'ALL',
    customerSegment: 'ALL',
  });

  // Persist datasets and activeDatasetId to localStorage safely
  useEffect(() => {
    try {
      localStorage.setItem(DATASETS_STORAGE_KEY, JSON.stringify(datasets));
    } catch {
      // guard against storage quota exceeded
    }
  }, [datasets]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_ID_STORAGE_KEY, activeDatasetId);
    } catch {
      // ignore storage errors
    }
  }, [activeDatasetId]);

  // Ensure any custom datasets hydrated from localStorage are registered on the Express server
  useEffect(() => {
    const syncCustomDatasets = async () => {
      for (const ds of datasets) {
        if (!ds.isSampleDataset) {
          try {
            await fetch('/api/datasets/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dataset: ds }),
            });
          } catch {
            // ignore transient network errors
          }
        }
      }
    };
    syncCustomDatasets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeDataset =
    datasets.find((d) => d.id === activeDatasetId) || datasets[0];

  const sanitizeFiltersForDataset = (targetDataset: DatasetEntry) => {
    setFilters((prev) => {
      const validCountries = new Set(
        targetDataset.baseAggregations.revenueByCountry.map((c) => c.country)
      );
      const validCategories = new Set(
        targetDataset.baseAggregations.revenueByCategory.map((c) => c.category)
      );
      const validPayments = new Set(
        targetDataset.baseAggregations.paymentMethodDist.map((p) => p.method)
      );
      return {
        ...prev,
        country:
          prev.country !== 'ALL' && !validCountries.has(prev.country)
            ? 'ALL'
            : prev.country,
        category:
          prev.category !== 'ALL' && !validCategories.has(prev.category)
            ? 'ALL'
            : prev.category,
        paymentMethod:
          prev.paymentMethod !== 'ALL' && !validPayments.has(prev.paymentMethod)
            ? 'ALL'
            : prev.paymentMethod,
      };
    });
  };

  const handleSelectDataset = (id: string, targetPage?: AppPage) => {
    setActiveDatasetId(id);
    const target = datasets.find((d) => d.id === id);
    if (target) {
      sanitizeFiltersForDataset(target);
    }
    if (targetPage) {
      setActivePage(targetPage);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDatasetCreated = (newDataset: DatasetEntry, nextPage: AppPage) => {
    setDatasets((prev) => [
      newDataset,
      ...prev.filter((d) => d.id !== newDataset.id),
    ]);
    setActiveDatasetId(newDataset.id);
    setInspectedDatasetIds((prev) => ({ ...prev, [newDataset.id]: false }));
    sanitizeFiltersForDataset(newDataset);
    setActivePage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetch('/api/datasets/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset: newDataset }),
    }).catch(() => {});
  };

  const handleUpdateDataset = (updated: DatasetEntry) => {
    setDatasets((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d))
    );
    sanitizeFiltersForDataset(updated);

    fetch(`/api/datasets/${updated.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset: updated }),
    }).catch(() => {});
  };

  const handleNavigate = (page: AppPage) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ProductionErrorBoundary>
      <div className="min-h-screen flex flex-col justify-between bg-[#F4F4F5] text-[#09090B]">
        {/* FLOATING ISLAND CAPSULE NAVIGATION WITH GSAP MORPHING */}
        <Navbar
          activePage={activePage}
          onNavigate={handleNavigate}
          activeDatasetName={activeDataset.name}
        />

        {/* MAIN VIEWPORT */}
        <main className="flex-1">
          {activePage === 'overview' && (
            <OverviewPage
              datasets={datasets}
              activeDataset={activeDataset}
              onSelectDataset={handleSelectDataset}
              onNavigate={handleNavigate}
            />
          )}

          {activePage === 'upload' && (
            <UploadPage onDatasetCreated={handleDatasetCreated} />
          )}

          {(activePage === 'profiling' || activePage === 'cleaning') && (
            <ProfilingAndCleaningPage
              dataset={activeDataset}
              activeTab={activePage}
              onTabChange={(tab) => setActivePage(tab)}
              onUpdateDataset={handleUpdateDataset}
              onNavigate={handleNavigate}
            />
          )}

          {activePage === 'analytics' && (
            <AnalyticsDashboardPage
              dataset={activeDataset}
              filters={filters}
              onFiltersChange={setFilters}
              onNavigate={handleNavigate}
              shouldRunLiveInspection={!inspectedDatasetIds[activeDataset.id]}
              onInspectionComplete={() =>
                setInspectedDatasetIds((prev) => ({
                  ...prev,
                  [activeDataset.id]: true,
                }))
              }
            />
          )}

          {activePage === 'ai_analyst' && (
            <AiAnalystPage dataset={activeDataset} />
          )}
        </main>

        {/* SECTION 4: BLACK EDITORIAL FOOTER */}
        <footer className="bg-[#09090B] text-white py-14 px-4 sm:px-6 no-print">
          <div className="max-w-[1180px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 border-b border-white/15 pb-10">
            <div className="space-y-2">
              <span className="text-base font-bold tracking-tight text-white">
                GLOBAL INSIGHT
              </span>
              <p className="text-xs text-[#A1A1AA] max-w-md">
                Automated Global E-Commerce Consumer Behaviour & Shopping Trends
                Analytics Platform. Engineered for 1.5M+ transaction repositories.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-[#A1A1AA]">
              <button
                type="button"
                onClick={() => handleNavigate('overview')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('upload')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Upload Dataset
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('profiling')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Schema Profiling
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('cleaning')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Cleaning Engine
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('analytics')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Analytics Workspace
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('ai_analyst')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                AI Analyst
              </button>
            </div>
          </div>

          <div className="max-w-[1180px] mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A1A1AA]">
            <span>
              © {new Date().getFullYear()} GLOBAL INSIGHT. Monochrome Swiss
              Editorial System.
            </span>
            <span>
              Columnar Parquet Architecture · Grounded Statistical AI · GSAP
              Motion
            </span>
          </div>
        </footer>
      </div>
    </ProductionErrorBoundary>
  );
}

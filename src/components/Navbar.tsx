import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { MagneticButton } from './gsapMotion';

export type AppPage =
  | 'overview'
  | 'upload'
  | 'profiling'
  | 'cleaning'
  | 'analytics'
  | 'ai_analyst'
  | 'history'
  | 'reports';

interface NavbarProps {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
  activeDatasetName: string;
}

const NAV_ITEMS: { id: AppPage; label: string; matchPages: AppPage[] }[] = [
  { id: 'overview', label: 'Overview', matchPages: ['overview'] },
  { id: 'upload', label: 'Upload Dataset', matchPages: ['upload'] },
  {
    id: 'analytics',
    label: 'Analytics',
    matchPages: ['analytics', 'profiling', 'cleaning'],
  },
  { id: 'ai_analyst', label: 'AI Analyst', matchPages: ['ai_analyst'] },
  { id: 'history', label: 'History', matchPages: ['history', 'reports'] },
];

const PIPELINE_STEPS: { id: AppPage; label: string }[] = [
  { id: 'profiling', label: '01. Data Profiling' },
  { id: 'cleaning', label: '02. Cleaning Engine' },
  { id: 'analytics', label: '03. Analytics Dashboard' },
  { id: 'ai_analyst', label: '04. AI Analyst' },
  { id: 'reports', label: '05. Export Reports' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onNavigate,
  activeDatasetName,
}) => {
  const navContainerRef = useRef<HTMLElement | null>(null);
  const activePillRef = useRef<HTMLDivElement | null>(null);
  const hoverPillRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const subNavRef = useRef<HTMLDivElement | null>(null);
  const subPillRef = useRef<HTMLDivElement | null>(null);
  const subItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [hoveredNavId, setHoveredNavId] = useState<string | null>(null);

  const activeNavItem =
    NAV_ITEMS.find((item) => item.matchPages.includes(activePage)) ||
    NAV_ITEMS[0];

  const isWorkspacePage = [
    'profiling',
    'cleaning',
    'analytics',
    'ai_analyst',
    'reports',
  ].includes(activePage);

  // GSAP Active Pill Morphing in Main Capsule Navbar
  useEffect(() => {
    const updateActivePill = () => {
      const activeBtn = itemRefs.current[activeNavItem.id];
      const pill = activePillRef.current;
      if (activeBtn && pill) {
        gsap.to(pill, {
          x: activeBtn.offsetLeft,
          width: activeBtn.offsetWidth,
          height: activeBtn.offsetHeight,
          opacity: 1,
          duration: 0.5,
          ease: 'expo.out',
          overwrite: 'auto',
        });
      }
    };

    updateActivePill();
    window.addEventListener('resize', updateActivePill);
    return () => window.removeEventListener('resize', updateActivePill);
  }, [activeNavItem.id]);

  // GSAP Hover Pill Morphing in Main Capsule Navbar
  useEffect(() => {
    const hoverPill = hoverPillRef.current;
    if (!hoverPill) return;

    if (!hoveredNavId || hoveredNavId === activeNavItem.id) {
      gsap.to(hoverPill, {
        opacity: 0,
        scale: 0.94,
        duration: 0.25,
        ease: 'power2.out',
      });
      return;
    }

    const hoveredBtn = itemRefs.current[hoveredNavId];
    if (hoveredBtn) {
      gsap.to(hoverPill, {
        x: hoveredBtn.offsetLeft,
        width: hoveredBtn.offsetWidth,
        height: hoveredBtn.offsetHeight,
        opacity: 1,
        scale: 1,
        duration: 0.35,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    }
  }, [hoveredNavId, activeNavItem.id]);

  // GSAP Sub-Bar Active Pill Morphing
  useEffect(() => {
    if (!isWorkspacePage) return;
    const activeStepBtn = subItemRefs.current[activePage];
    const subPill = subPillRef.current;
    if (activeStepBtn && subPill) {
      gsap.to(subPill, {
        x: activeStepBtn.offsetLeft,
        width: activeStepBtn.offsetWidth,
        height: activeStepBtn.offsetHeight,
        opacity: 1,
        duration: 0.45,
        ease: 'expo.out',
        overwrite: 'auto',
      });
    }
  }, [activePage, isWorkspacePage]);

  return (
    <div className="sticky top-0 z-50 pt-4 pb-2 px-4 sm:px-6 no-print pointer-events-none">
      <div className="max-w-[1180px] mx-auto flex flex-col items-center gap-2">
        {/* Main Floating White Capsule Navigation Bar (Strict 3-Zone Contract) */}
        <header className="w-full pointer-events-auto bg-white/95 backdrop-blur-md border border-black/10 rounded-full px-6 py-2.5 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark with subtle magnetic pull */}
          <MagneticButton
            type="button"
            strength={0.2}
            onClick={() => onNavigate('overview')}
            className="text-sm sm:text-base font-bold tracking-tight text-[#09090B] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#09090B]"
          >
            GLOBAL INSIGHT
          </MagneticButton>

          {/* Zone 2: 5 Single-Line Navigation Links with GSAP Morphing Pill */}
          <nav
            ref={navContainerRef}
            onMouseLeave={() => setHoveredNavId(null)}
            className="relative hidden md:flex items-center gap-1 p-1 bg-[#F4F4F5] rounded-full border border-black/5"
          >
            {/* Hover Preview Pill */}
            <div
              ref={hoverPillRef}
              className="absolute top-1 left-0 bg-[#E4E4E7] rounded-full pointer-events-none opacity-0"
            />
            {/* Active Obsidian Morphing Pill */}
            <div
              ref={activePillRef}
              className="absolute top-1 left-0 bg-[#09090B] rounded-full pointer-events-none opacity-0"
            />

            {NAV_ITEMS.map((item) => {
              const isActive = item.id === activeNavItem.id;
              return (
                <MagneticButton
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[item.id] = el;
                  }}
                  type="button"
                  strength={0.22}
                  onMouseEnter={() => setHoveredNavId(item.id)}
                  onClick={() => onNavigate(item.id)}
                  className={`relative z-10 px-4 py-1.5 text-xs sm:text-sm rounded-full whitespace-nowrap shrink-0 transition-colors duration-200 cursor-pointer ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-[#52525B] hover:text-[#09090B] font-medium'
                  }`}
                >
                  {item.label}
                </MagneticButton>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action Button with GSAP Magnetic Pull */}
          <MagneticButton
            type="button"
            strength={0.32}
            onClick={() => onNavigate('upload')}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#09090B] hover:bg-[#27272A] rounded-full transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
          >
            New Analysis
          </MagneticButton>
        </header>

        {/* Mobile Quick Switcher */}
        <div className="flex md:hidden pointer-events-auto w-full overflow-x-auto bg-white/95 border border-black/10 rounded-full px-3 py-1.5 justify-between gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = item.matchPages.includes(activePage);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#09090B] text-white font-semibold'
                    : 'text-[#52525B]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Contextual Pipeline Sub-Bar with GSAP Sliding Pill */}
        {isWorkspacePage && (
          <div className="pointer-events-auto w-full bg-white/90 backdrop-blur-sm border border-black/10 rounded-full px-4 py-1.5 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-[#52525B] truncate max-w-[340px]">
              <span className="font-semibold text-[#09090B]">
                Active Repository:
              </span>
              <span className="truncate">{activeDatasetName}</span>
            </div>

            <div
              ref={subNavRef}
              className="relative flex items-center gap-1 overflow-x-auto p-0.5 bg-[#F4F4F5] rounded-full"
            >
              <div
                ref={subPillRef}
                className="absolute top-0.5 left-0 bg-[#09090B] rounded-full pointer-events-none opacity-0"
              />
              {PIPELINE_STEPS.map((step) => {
                const isStepActive = activePage === step.id;
                return (
                  <MagneticButton
                    key={step.id}
                    ref={(el) => {
                      subItemRefs.current[step.id] = el;
                    }}
                    type="button"
                    strength={0.18}
                    onClick={() => onNavigate(step.id)}
                    className={`relative z-10 px-3 py-1 rounded-full transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                      isStepActive
                        ? 'text-white font-semibold'
                        : 'text-[#52525B] hover:text-[#09090B] font-medium'
                    }`}
                  >
                    {step.label}
                  </MagneticButton>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Globe, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { CountryMetric } from '../types/analytics';

interface GlobalCommerceMapProps {
  countries: CountryMetric[];
  selectedCountry: string;
  onSelectCountry: (country: string) => void;
}

export const GlobalCommerceMap: React.FC<GlobalCommerceMapProps> = ({
  countries,
  selectedCountry,
  onSelectCountry,
}) => {
  const [zoom, setZoom] = useState(1);
  const [hovered, setHovered] = useState<CountryMetric | null>(null);

  const projectPoint = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 900;
    const y = ((90 - lat) / 180) * 440;
    return { x, y };
  };

  const maxRevenue = Math.max(1, ...countries.map((c) => c.revenue));

  return (
    <div className="relative bg-[#09090B] text-white rounded-[18px] p-5 overflow-hidden border border-black/10">
      {/* Top Map Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-white" />
          <span className="font-semibold">
            Interactive Spatial Projection (Click Market Node to Cross-Filter)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectedCountry !== 'ALL' && (
            <button
              type="button"
              onClick={() => onSelectCountry('ALL')}
              className="px-2.5 py-1 bg-white text-[#09090B] rounded-[5px] text-[11px] font-semibold cursor-pointer"
            >
              Active: {selectedCountry} ×
            </button>
          )}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.2).toFixed(1))))}
            title="Zoom in"
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-[5px] cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, Number((z - 0.2).toFixed(1))))}
            title="Zoom out"
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-[5px] cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              onSelectCountry('ALL');
            }}
            title="Reset map"
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-[5px] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG World Map Canvas */}
      <div className="relative h-[300px] sm:h-[340px] w-full flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 900 440"
          className="w-full h-full transition-transform duration-300"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Subtle Graticule Grid Lines */}
          {[90, 180, 270, 360].map((y) => (
            <line
              key={`lat-${y}`}
              x1={0}
              y1={y}
              x2={900}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="3 3"
            />
          ))}
          {[150, 300, 450, 600, 750].map((x) => (
            <line
              key={`lng-${x}`}
              x1={x}
              y1={0}
              x2={x}
              y2={440}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="3 3"
            />
          ))}

          {/* Stylized Minimalist Continental Landmasses */}
          <g fill="#18181B" stroke="rgba(255,255,255,0.14)" strokeWidth="1">
            <path d="M 95,60 L 245,55 L 285,120 L 235,185 L 185,210 L 135,165 L 85,110 Z" />
            <path d="M 235,230 L 315,245 L 335,315 L 285,395 L 250,360 L 225,275 Z" />
            <path d="M 415,65 L 535,55 L 555,125 L 495,155 L 425,145 L 405,105 Z" />
            <path d="M 415,165 L 535,165 L 575,245 L 535,355 L 475,355 L 425,245 Z" />
            <path d="M 555,60 L 795,65 L 825,165 L 745,225 L 635,215 L 565,155 Z" />
            <path d="M 715,285 L 825,280 L 835,365 L 735,370 Z" />
          </g>

          {/* Trade Corridor Arcs from Top Hub */}
          {countries.length > 1 &&
            countries.slice(1, 7).map((target) => {
              const originPt = projectPoint(
                countries[0].lat,
                countries[0].lng
              );
              const targetPt = projectPoint(target.lat, target.lng);
              const midX = (originPt.x + targetPt.x) / 2;
              const midY = Math.min(originPt.y, targetPt.y) - 35;
              return (
                <path
                  key={`arc-${target.isoCode}`}
                  d={`M ${originPt.x},${originPt.y} Q ${midX},${midY} ${targetPt.x},${targetPt.y}`}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.28)"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                />
              );
            })}

          {/* Country Proportional Revenue Nodes */}
          {countries.map((c) => {
            const { x, y } = projectPoint(c.lat, c.lng);
            const ratio = c.revenue / maxRevenue;
            const radius = 6 + ratio * 16;
            const isSelected =
              selectedCountry === c.country ||
              (selectedCountry === 'ALL' && c.country === countries[0]?.country);

            return (
              <g
                key={c.country}
                className="cursor-pointer"
                onMouseEnter={() => setHovered(c)}
                onMouseLeave={() => setHovered(null)}
                onClick={() =>
                  onSelectCountry(
                    selectedCountry === c.country ? 'ALL' : c.country
                  )
                }
              >
                <circle
                  cx={x}
                  cy={y}
                  r={radius + 5}
                  fill={
                    isSelected
                      ? 'rgba(255, 255, 255, 0.25)'
                      : 'rgba(255, 255, 255, 0.08)'
                  }
                />
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={
                    isSelected || hovered?.country === c.country
                      ? '#FFFFFF'
                      : '#A1A1AA'
                  }
                  stroke="#09090B"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={y - radius - 6}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="10"
                  fontWeight="600"
                  className="pointer-events-none select-none"
                >
                  {c.isoCode}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Hover Telemetry Panel */}
        {hovered && (
          <div className="absolute bottom-3 left-3 bg-[#09090B]/95 border border-white/20 rounded-[10px] p-3.5 text-xs space-y-1.5 pointer-events-none max-w-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="font-bold text-white">{hovered.country}</span>
              <span className="font-mono-tabular text-[#D4D4D8] font-semibold">
                {hovered.sharePct}% Global Share
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-[#A1A1AA] font-mono-tabular">
              <span>Net Revenue:</span>
              <span className="text-white text-right">
                ${hovered.revenue.toLocaleString()}
              </span>
              <span>Total Orders:</span>
              <span className="text-white text-right">
                {hovered.orders.toLocaleString()}
              </span>
              <span>Avg Order Value:</span>
              <span className="text-white text-right">
                ${hovered.avgOrderValue.toFixed(2)}
              </span>
              <span>Lead Category:</span>
              <span className="text-white text-right font-sans truncate">
                {hovered.topCategory}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

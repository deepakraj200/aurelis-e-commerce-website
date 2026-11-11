import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { formatMoney } from '@/utils/format';
import type { DashboardData } from '@/types';

const WIDTH = 800;
const HEIGHT = 260;
const PAD_X = 10;
const PAD_TOP = 24;
const PAD_BOTTOM = 28;

const compact = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${Math.round(value)}`;
};

export const RevenueChart = ({ data }: { data: DashboardData['monthlyRevenue'] }) => {
  const reduced = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(Math.max(0, data.length - 1));

  const { linePath, areaPath, points, maxRevenue } = useMemo(() => {
    const max = Math.max(...data.map((entry) => entry.revenue), 1);
    const innerWidth = WIDTH - PAD_X * 2;
    const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
    const pts = data.map((entry, index) => ({
      x: PAD_X + (data.length === 1 ? innerWidth / 2 : (index / (data.length - 1)) * innerWidth),
      y: PAD_TOP + innerHeight - (entry.revenue / max) * innerHeight,
    }));

    const line = pts.reduce((acc, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const prev = pts[index - 1];
      const mid = (prev.x + point.x) / 2;
      return `${acc} C ${mid} ${prev.y}, ${mid} ${point.y}, ${point.x} ${point.y}`;
    }, '');

    const area =
      pts.length > 0
        ? `${line} L ${pts[pts.length - 1].x} ${HEIGHT - PAD_BOTTOM} L ${pts[0].x} ${HEIGHT - PAD_BOTTOM} Z`
        : '';

    return { linePath: line, areaPath: area, points: pts, maxRevenue: max };
  }, [data]);

  if (!data.length) {
    return (
      <div className="flex h-[260px] items-center justify-center text-[11px] text-white/25">
        No revenue data yet.
      </div>
    );
  }

  const active = data[activeIndex];
  const activePoint = points[activeIndex];
  const activeXPercent = (activePoint.x / WIDTH) * 100;
  const activeYPercent = (activePoint.y / HEIGHT) * 100;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-white/25">Monthly revenue</p>
          <div className="mt-1.5 flex items-baseline gap-3">
            <p className="text-[28px] font-medium tracking-[-0.04em] tabular-nums text-pearl">
              {formatMoney(active.revenue, 'USD', false)}
            </p>
            <span className="text-[10px] text-white/30">{active.label} · {active.orders} orders</span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.02] px-3 py-1.5 text-[9px] text-white/30">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Verified revenue
        </div>
      </div>

      <div className="relative">
        <div
          className="pointer-events-none absolute z-10 hidden -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-xl border border-white/10 bg-[#151517]/95 px-3 py-2 text-center shadow-xl backdrop-blur-xl sm:block"
          style={{ left: `${activeXPercent}%`, top: `${activeYPercent}%` }}
        >
          <p className="text-[9px] uppercase tracking-[0.14em] text-white/30">{active.label}</p>
          <p className="mt-1 text-[11px] tabular-nums text-pearl">{formatMoney(active.revenue, 'USD', false)}</p>
          <p className="mt-0.5 text-[9px] text-white/30">{active.orders} orders</p>
        </div>

        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-[230px] w-full overflow-visible sm:h-[260px]" role="img" aria-label="Monthly revenue chart">
          <defs>
            <linearGradient id="revenue-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C7A17A" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#C7A17A" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="revenue-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8A6A48" />
              <stop offset="55%" stopColor="#C7A17A" />
              <stop offset="100%" stopColor="#E7CFAE" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={PAD_X}
              x2={WIDTH - PAD_X}
              y1={PAD_TOP + (HEIGHT - PAD_TOP - PAD_BOTTOM) * (1 - ratio)}
              y2={PAD_TOP + (HEIGHT - PAD_TOP - PAD_BOTTOM) * (1 - ratio)}
              stroke="rgba(255,255,255,0.05)"
              strokeDasharray="4 6"
            />
          ))}

          <motion.path
            d={areaPath}
            fill="url(#revenue-area)"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          />
          <motion.path
            d={linePath}
            fill="none"
            stroke="url(#revenue-line)"
            strokeWidth={2}
            strokeLinecap="round"
            initial={reduced ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />

          {points.map((point, index) => (
            <g key={data[index].month}>
              <circle
                cx={point.x}
                cy={point.y}
                r={index === activeIndex ? 4 : 2}
                fill={index === activeIndex ? '#E7CFAE' : '#7D6448'}
                stroke={index === activeIndex ? '#141210' : 'none'}
                strokeWidth={2}
              />
              <rect
                x={point.x - 18}
                y={PAD_TOP - 10}
                width={36}
                height={HEIGHT - PAD_TOP - PAD_BOTTOM + 20}
                fill="transparent"
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                tabIndex={0}
                role="button"
                aria-label={`${data[index].label}: ${formatMoney(data[index].revenue, 'USD', false)}`}
                className="cursor-pointer outline-none"
              />
            </g>
          ))}

          <text x={PAD_X} y={12} fill="rgba(255,255,255,0.2)" fontSize="9" letterSpacing="1">
            {compact(maxRevenue)}
          </text>
          <text x={PAD_X} y={HEIGHT - 6} fill="rgba(255,255,255,0.2)" fontSize="9" letterSpacing="1">
            $0
          </text>
        </svg>

        <div className="mt-1 grid grid-cols-12 gap-1">
          {data.map((entry, index) => (
            <button
              key={entry.month}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`rounded-md py-1 text-[9px] transition ${
                index === activeIndex ? 'bg-white/[0.06] text-white/80' : 'text-white/20 hover:text-white/50'
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

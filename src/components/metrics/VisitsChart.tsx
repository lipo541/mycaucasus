"use client";
import React, { useMemo } from 'react';
import { useVisitsData } from './useVisitsData';

interface Props { days?: number; height?: number; }

export function VisitsChart({ days = 30, height = 140 }: Props) {
  const { data, loading, error } = useVisitsData({ days });
  const { path, dArea, dLine, ticks, maxY, points } = useMemo(() => {
    if (!data || !data.points.length) return { path:'', dArea:'', dLine:'', ticks:[], maxY:0, points:[] as any[] };
    const values = data.points.map(p => p.visits);
    const maxY = Math.max(1, ...values);
    const w = 600; // svg internal width
    const h = height - 24; // padding for labels
    const stepX = w / Math.max(1, data.points.length - 1);
    const pts = data.points.map((p,i)=>({
      x: i * stepX,
      y: h - (p.visits / maxY) * h,
      v: p.visits,
      date: p.date
    }));
    const dLine = pts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    const dArea = dLine + ` L ${pts[pts.length-1].x.toFixed(2)},${h} L 0,${h} Z`;
    const tickEvery = Math.ceil(data.points.length / 6);
    const ticks = data.points.map((p,i)=> i % tickEvery === 0 ? { x: i*stepX, label: p.date.slice(5) } : null).filter(Boolean) as any[];
    return { path:dLine, dArea, dLine, ticks, maxY, points: pts };
  }, [data, height]);

  if (loading) return <div style={{height}} className="chartSkeleton">Loading visits...</div>;
  if (error) return <div style={{height}} className="chartError">Failed to load visits</div>;
  if (!data) return null;

  return (
    <div className="visitsChart" style={{ fontSize: 12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <strong>Visits (last {data.range.days}d)</strong>
        <span style={{opacity:.7}}>Total {data.totals.visits} / Unique {data.totals.unique}</span>
      </div>
      <svg viewBox={`0 0 600 ${height}`} role="img" aria-label="Visits chart" style={{ width:'100%', height }}>
        <defs>
          <linearGradient id="vcGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <g transform="translate(0,12)">
          <path d={dArea} fill="url(#vcGrad)" stroke="none" />
          <path d={dLine} fill="none" stroke="#2563eb" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p,i)=> (
            <circle key={i} cx={p.x} cy={p.y} r={2} fill="#1d4ed8">
              <title>{p.date}: {p.v} visits</title>
            </circle>
          ))}
          {ticks.map(t=> (
            <g key={t.x} transform={`translate(${t.x},0)`}>
              <line y1={0} y2={height-24} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="2,4" />
              <text y={height-10} textAnchor="middle" fill="#555" fontSize={10}>{t.label}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
export default VisitsChart;

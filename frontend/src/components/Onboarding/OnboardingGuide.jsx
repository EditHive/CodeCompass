import React, { useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { getOnboarding } from '../../services/api';
import { HiOutlineMap, HiOutlineArrowRight, HiOutlineFolder, HiOutlineFlag } from 'react-icons/hi';

const PHASE_COLORS = { 'Entry Point': '#f87171', 'Core Module': '#7c5cfc', 'Utility': '#34d399' };
const PHASE_ICONS = { 'Entry Point': '🚀', 'Core Module': '⭐', 'Utility': '🔧' };

export default function OnboardingGuide({ onSelectNode }) {
  const { data, loading, error, execute } = useApi(getOnboarding);

  useEffect(() => { execute(); }, []);

  if (loading) return <div className="flex items-center justify-center h-full text-prism-text-dim text-xs">Loading onboarding guide...</div>;
  if (error) return <div className="flex items-center justify-center h-full text-prism-red text-xs">{error}</div>;
  if (!data) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-prism-border">
        <div className="flex items-center gap-2 mb-2">
          <HiOutlineMap className="w-5 h-5 text-prism-pink" />
          <h2 className="text-sm font-bold text-prism-text">Onboarding Guide</h2>
        </div>
        <p className="text-xs text-prism-text-dim">Recommended path to explore this codebase ({data.total_files} files).</p>
      </div>

      {/* Exploration Path */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-0">
          {data.exploration_order?.map((step, i) => {
            const color = PHASE_COLORS[step.phase] || '#7c5cfc';
            return (
              <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <button
                  onClick={() => onSelectNode?.(step.node_id)}
                  className="w-full flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-prism-surface-2/50 transition text-left cursor-pointer group"
                >
                  {/* Step indicator */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                      {PHASE_ICONS[step.phase] || '📄'}
                    </div>
                    {i < data.exploration_order.length - 1 && (
                      <div className="w-px h-6 mt-1" style={{ background: `${color}30` }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-prism-text">Step {step.step}: {step.label}</span>
                      <span className="badge text-[9px]" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                        {step.phase}
                      </span>
                    </div>
                    <p className="text-[11px] text-prism-text-dim leading-relaxed">{step.reason}</p>
                    {step.docstring && (
                      <p className="text-[10px] text-prism-text-dim/60 mt-0.5 italic">"{step.docstring.slice(0, 100)}"</p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-prism-accent opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Explore</span>
                      <HiOutlineArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Summary cards */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-[#f8717115] border border-[#f8717130] p-3 text-center">
            <p className="text-lg font-bold text-prism-red">{data.entry_points?.length || 0}</p>
            <p className="text-[10px] text-prism-text-dim">Entry Points</p>
          </div>
          <div className="rounded-xl bg-[#7c5cfc15] border border-[#7c5cfc30] p-3 text-center">
            <p className="text-lg font-bold text-prism-accent">{data.core_modules?.length || 0}</p>
            <p className="text-[10px] text-prism-text-dim">Core Modules</p>
          </div>
          <div className="rounded-xl bg-[#34d39915] border border-[#34d39930] p-3 text-center">
            <p className="text-lg font-bold text-prism-green">{data.utility_modules?.length || 0}</p>
            <p className="text-[10px] text-prism-text-dim">Utilities</p>
          </div>
        </div>
      </div>
    </div>
  );
}

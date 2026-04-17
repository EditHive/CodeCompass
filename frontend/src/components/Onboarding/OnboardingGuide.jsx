import React, { useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { getOnboarding } from '../../services/api';
import { HiOutlineArrowRight } from 'react-icons/hi';

const PHASE_COLORS = { 'Entry Point': '#f43f5e', 'Core Module': '#6366f1', 'Utility': '#10b981' };
const PHASE_ICONS = { 'Entry Point': '🚀', 'Core Module': '⭐', 'Utility': '🔧' };

export default function OnboardingGuide({ onSelectNode }) {
  const { data, loading, error, execute } = useApi(getOnboarding);

  useEffect(() => { execute(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center animate-fade-in">
        <div className="w-8 h-8 border-2 border-prism-border border-t-prism-accent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-prism-text-dim text-[12px]">Building onboarding guide...</p>
      </div>
    </div>
  );
  if (error) return <div className="flex items-center justify-center h-full text-prism-rose text-[12px] px-4 text-center">{error}</div>;
  if (!data) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-prism-border">
        <p className="text-[12px] text-prism-text-dim leading-relaxed">
          Recommended path to explore this codebase ({data.total_files} files).
        </p>
      </div>

      {/* Exploration Path */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-0">
          {data.exploration_order?.map((step, i) => {
            const color = PHASE_COLORS[step.phase] || '#6366f1';
            return (
              <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                <button
                  onClick={() => onSelectNode?.(step.node_id)}
                  className="w-full flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-prism-surface-2/40 transition-all text-left cursor-pointer group"
                >
                  {/* Step indicator */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                      style={{ background: `${color}10`, border: `1px solid ${color}20` }}
                    >
                      {PHASE_ICONS[step.phase] || '📄'}
                    </div>
                    {i < data.exploration_order.length - 1 && (
                      <div className="w-px h-5 mt-1" style={{ background: `${color}20` }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-[12px] font-semibold text-prism-text">Step {step.step}: {step.label}</span>
                      <span className="badge" style={{ background: `${color}10`, color, border: `1px solid ${color}20` }}>
                        {step.phase}
                      </span>
                    </div>
                    <p className="text-[11px] text-prism-text-dim leading-relaxed mt-0.5">{step.reason}</p>
                    {step.docstring && (
                      <p className="text-[10px] text-prism-text-muted mt-1 italic leading-relaxed">"{step.docstring.slice(0, 100)}"</p>
                    )}
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-prism-accent opacity-0 group-hover:opacity-100 transition-opacity font-medium">
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
          <SummaryCard label="Entry Points" value={data.entry_points?.length || 0} color="#f43f5e" />
          <SummaryCard label="Core Modules" value={data.core_modules?.length || 0} color="#6366f1" />
          <SummaryCard label="Utilities" value={data.utility_modules?.length || 0} color="#10b981" />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="rounded-lg p-3 text-center border" style={{ background: `${color}06`, borderColor: `${color}18` }}>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] text-prism-text-muted font-medium mt-0.5">{label}</p>
    </div>
  );
}

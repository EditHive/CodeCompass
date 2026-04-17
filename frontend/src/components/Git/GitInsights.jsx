import React, { useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { getGitAnalysis } from '../../services/api';
import { HiOutlineClock, HiOutlineFire, HiOutlineLink, HiOutlineTrendingUp } from 'react-icons/hi';

export default function GitInsights() {
  const { data, loading, error, execute } = useApi(getGitAnalysis);

  useEffect(() => { execute(); }, []);

  if (loading) return <div className="flex items-center justify-center h-full text-prism-text-dim text-xs">Analyzing git history...</div>;
  if (error) return <div className="flex items-center justify-center h-full text-prism-red text-xs">{error}</div>;
  if (!data) return null;

  const churnColors = { very_high: '#f87171', high: '#fb923c', medium: '#fbbf24', low: '#34d399' };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-prism-border">
        <div className="flex items-center gap-2 mb-2">
          <HiOutlineClock className="w-5 h-5 text-prism-accent-2" />
          <h2 className="text-sm font-bold text-prism-text">Change History Intelligence</h2>
        </div>
        <p className="text-xs text-prism-text-dim">
          {data.is_git_repo ? 'Analyzing actual git history' : 'Showing simulated data (non-git repo)'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Hotspots */}
        {data.hotspots?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-prism-text mb-2 flex items-center gap-1.5">
              <HiOutlineFire className="w-4 h-4 text-prism-red" /> Hotspot Files
            </h3>
            <div className="space-y-1.5">
              {data.hotspots.map((h, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-prism-surface-2/50">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: h.risk === 'high' ? '#f87171' : '#fbbf24' }} />
                  <span className="text-xs text-prism-text flex-1 truncate font-mono">{h.file}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: h.risk === 'high' ? '#f8717115' : '#fbbf2415', color: h.risk === 'high' ? '#f87171' : '#fbbf24' }}>
                    {h.churn} changes
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* File Churn */}
        {data.churn?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-prism-text mb-2 flex items-center gap-1.5">
              <HiOutlineTrendingUp className="w-4 h-4 text-prism-amber" /> File Churn
            </h3>
            <div className="space-y-1">
              {data.churn.slice(0, 10).map((item, i) => {
                const maxChanges = data.churn[0]?.changes || 1;
                const pct = (item.changes / maxChanges) * 100;
                const color = churnColors[item.category] || '#34d399';
                return (
                  <div key={i} className="relative">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg relative z-10">
                      <span className="text-xs text-prism-text flex-1 truncate font-mono">{item.file.split('/').pop()}</span>
                      <span className="text-[10px] font-medium" style={{ color }}>{item.changes}</span>
                    </div>
                    <div
                      className="absolute inset-0 rounded-lg opacity-10"
                      style={{ background: color, width: `${pct}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Co-Changes */}
        {data.co_changes?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-prism-text mb-2 flex items-center gap-1.5">
              <HiOutlineLink className="w-4 h-4 text-prism-cyan" /> Co-Change Coupling
            </h3>
            <p className="text-[10px] text-prism-text-dim mb-2">Files that frequently change together</p>
            <div className="space-y-1.5">
              {data.co_changes.slice(0, 8).map((pair, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-prism-surface-2/50 text-xs">
                  <span className="text-prism-text truncate font-mono">{pair.file1.split('/').pop()}</span>
                  <span className="text-prism-text-dim">↔</span>
                  <span className="text-prism-text truncate font-mono">{pair.file2.split('/').pop()}</span>
                  <span className="ml-auto text-[10px] text-prism-cyan font-medium">{pair.count}×</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Activity */}
        {data.recent_activity?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-prism-text mb-2 flex items-center gap-1.5">
              <HiOutlineClock className="w-4 h-4 text-prism-text-dim" /> Recent Commits
            </h3>
            <div className="space-y-1">
              {data.recent_activity.slice(0, 6).map((commit, i) => (
                <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-prism-surface-2/30 text-xs">
                  <code className="text-prism-accent text-[10px] font-mono flex-shrink-0">{commit.hash}</code>
                  <span className="text-prism-text truncate flex-1">{commit.message}</span>
                  <span className="text-[10px] text-prism-text-dim flex-shrink-0">{commit.date?.split('T')[0] || commit.date}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

import React, { useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { getGitAnalysis } from '../../services/api';
import { HiOutlineFire, HiOutlineLink, HiOutlineTrendingUp, HiOutlineClock } from 'react-icons/hi';

export default function GitInsights() {
  const { data, loading, error, execute } = useApi(getGitAnalysis);

  useEffect(() => { execute(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center animate-fade-in">
        <div className="w-8 h-8 border-2 border-prism-border border-t-prism-violet rounded-full animate-spin mx-auto mb-3" />
        <p className="text-prism-text-dim text-[12px]">Analyzing git history...</p>
      </div>
    </div>
  );
  if (error) return <div className="flex items-center justify-center h-full text-prism-rose text-[12px] px-4 text-center">{error}</div>;
  if (!data) return null;

  const churnColors = { very_high: '#f43f5e', high: '#f97316', medium: '#eab308', low: '#10b981' };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-prism-border">
        <p className="text-[12px] text-prism-text-dim leading-relaxed">
          {data.is_git_repo ? 'Insights from your git commit history.' : 'Showing simulated data (non-git repository).'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        {/* Hotspots */}
        {data.hotspots?.length > 0 && (
          <section className="animate-fade-in">
            <h3 className="text-[12px] font-semibold text-prism-text mb-2.5 flex items-center gap-2">
              <HiOutlineFire className="w-4 h-4 text-prism-rose" /> Hotspot Files
            </h3>
            <div className="space-y-1.5">
              {data.hotspots.map((h, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-prism-surface-2/30 border border-prism-border/30 hover:border-prism-border transition-colors">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: h.risk === 'high' ? '#f43f5e' : '#eab308' }} />
                  <span className="text-[12px] text-prism-text flex-1 truncate font-mono">{h.file}</span>
                  <span className="badge" style={{
                    background: h.risk === 'high' ? '#f43f5e10' : '#eab30810',
                    color: h.risk === 'high' ? '#f43f5e' : '#eab308',
                    border: `1px solid ${h.risk === 'high' ? '#f43f5e' : '#eab308'}20`
                  }}>
                    {h.churn} changes
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* File Churn */}
        {data.churn?.length > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <h3 className="text-[12px] font-semibold text-prism-text mb-2.5 flex items-center gap-2">
              <HiOutlineTrendingUp className="w-4 h-4 text-prism-amber" /> File Churn
            </h3>
            <div className="space-y-1">
              {data.churn.slice(0, 10).map((item, i) => {
                const maxChanges = data.churn[0]?.changes || 1;
                const pct = (item.changes / maxChanges) * 100;
                const color = churnColors[item.category] || '#10b981';
                return (
                  <div key={i} className="relative rounded-lg overflow-hidden">
                    {/* Bar background */}
                    <div
                      className="absolute inset-0 rounded-lg"
                      style={{ background: `${color}08`, width: `${pct}%` }}
                    />
                    <div className="flex items-center gap-2 px-3 py-2 relative z-10">
                      <span className="text-[12px] text-prism-text flex-1 truncate font-mono">{item.file.split('/').pop()}</span>
                      <span className="text-[11px] font-semibold" style={{ color }}>{item.changes}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Co-Changes */}
        {data.co_changes?.length > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <h3 className="text-[12px] font-semibold text-prism-text mb-2.5 flex items-center gap-2">
              <HiOutlineLink className="w-4 h-4 text-prism-cyan" /> Co-Change Coupling
            </h3>
            <p className="text-[10px] text-prism-text-muted mb-2">Files that frequently change together</p>
            <div className="space-y-1.5">
              {data.co_changes.slice(0, 8).map((pair, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-prism-surface-2/30 border border-prism-border/30 text-[12px]">
                  <span className="text-prism-text truncate font-mono">{pair.file1.split('/').pop()}</span>
                  <span className="text-prism-border-2 flex-shrink-0">↔</span>
                  <span className="text-prism-text truncate font-mono">{pair.file2.split('/').pop()}</span>
                  <span className="ml-auto text-[10px] text-prism-cyan font-bold flex-shrink-0">{pair.count}×</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Activity */}
        {data.recent_activity?.length > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <h3 className="text-[12px] font-semibold text-prism-text mb-2.5 flex items-center gap-2">
              <HiOutlineClock className="w-4 h-4 text-prism-text-dim" /> Recent Commits
            </h3>
            <div className="space-y-1.5">
              {data.recent_activity.slice(0, 6).map((commit, i) => (
                <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-prism-surface-2/20 border border-prism-border/20 text-[12px]">
                  <code className="text-prism-accent text-[10px] font-mono flex-shrink-0 mt-0.5">{commit.hash}</code>
                  <span className="text-prism-text truncate flex-1">{commit.message}</span>
                  <span className="text-[10px] text-prism-text-muted flex-shrink-0">{commit.date?.split('T')[0] || commit.date}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

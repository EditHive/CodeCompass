import React, { useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { getSmells } from '../../services/api';
import { HiOutlineShieldCheck, HiOutlineExclamationCircle } from 'react-icons/hi';

const CATEGORY_INFO = {
  complexity: { label: 'Complexity', color: '#f43f5e', icon: '🔴' },
  coupling: { label: 'Coupling', color: '#f97316', icon: '🔗' },
  design: { label: 'Design', color: '#eab308', icon: '🏗️' },
  architecture: { label: 'Architecture', color: '#ec4899', icon: '🏛️' },
};

const SEVERITY_STYLES = {
  error: { color: '#f43f5e', label: 'Critical' },
  warning: { color: '#f59e0b', label: 'Warning' },
  info: { color: '#22d3ee', label: 'Info' },
};

export default function SmellsPanel() {
  const { data, loading, error, execute } = useApi(getSmells);

  useEffect(() => { execute(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center animate-fade-in">
        <div className="w-8 h-8 border-2 border-prism-border border-t-prism-amber rounded-full animate-spin mx-auto mb-3" />
        <p className="text-prism-text-dim text-[12px]">Detecting code smells...</p>
      </div>
    </div>
  );
  if (error) return <div className="flex items-center justify-center h-full text-prism-rose text-[12px] px-4 text-center">{error}</div>;
  if (!data) return null;

  const healthColor = data.health_score >= 80 ? '#10b981' : data.health_score >= 50 ? '#eab308' : '#f43f5e';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-prism-border">
        <p className="text-[12px] text-prism-text-dim leading-relaxed">
          Automated detection of code quality issues and anti-patterns.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Health Score */}
        <div className="rounded-xl p-5 text-center border animate-fade-in" style={{ background: `${healthColor}05`, borderColor: `${healthColor}18` }}>
          <div className="flex items-center justify-center gap-2.5 mb-1.5">
            <HiOutlineShieldCheck className="w-6 h-6" style={{ color: healthColor }} />
            <span className="text-3xl font-bold tracking-tight" style={{ color: healthColor }}>{data.health_score}%</span>
          </div>
          <p className="text-[12px] text-prism-text-dim font-medium">Code Health Score</p>
          <p className="text-[10px] text-prism-text-muted mt-1">{data.total_smells} issues detected</p>
        </div>

        {/* Summary by severity */}
        {data.summary && (
          <div className="grid grid-cols-3 gap-2 animate-fade-in" style={{ animationDelay: '80ms' }}>
            {Object.entries(data.summary.by_severity || {}).map(([sev, count]) => {
              const style = SEVERITY_STYLES[sev] || SEVERITY_STYLES.info;
              return (
                <div key={sev} className="rounded-lg px-2 py-2.5 text-center border" style={{ background: `${style.color}06`, borderColor: `${style.color}18` }}>
                  <p className="font-bold text-base" style={{ color: style.color }}>{count}</p>
                  <p className="text-[10px] text-prism-text-muted font-medium mt-0.5">{style.label}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Smells by category */}
        {Object.entries(data.categories || {}).map(([category, smells], catIdx) => {
          const catInfo = CATEGORY_INFO[category] || { label: category, color: '#71717a', icon: '⚠️' };
          return (
            <section key={category} className="animate-fade-in" style={{ animationDelay: `${(catIdx + 2) * 80}ms` }}>
              <h3 className="text-[12px] font-semibold text-prism-text mb-2.5 flex items-center gap-2">
                <span>{catInfo.icon}</span>
                <span>{catInfo.label}</span>
                <span className="text-prism-text-muted font-normal">({smells.length})</span>
              </h3>
              <div className="space-y-1.5">
                {smells.map((smell, i) => {
                  const sevStyle = SEVERITY_STYLES[smell.severity] || SEVERITY_STYLES.info;
                  return (
                    <div key={i} className="rounded-lg px-3 py-3 border" style={{ background: `${sevStyle.color}04`, borderColor: `${sevStyle.color}15` }}>
                      <div className="flex items-start gap-2.5">
                        <HiOutlineExclamationCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: sevStyle.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-prism-text leading-relaxed">{smell.message}</p>
                          <p className="text-[10px] text-prism-text-muted mt-1 font-mono">
                            {smell.file || smell.files?.join(' → ')}
                          </p>
                          <p className="text-[10px] text-prism-text-dim mt-1.5 flex items-start gap-1">
                            <span className="flex-shrink-0">💡</span>
                            <span>{smell.suggestion}</span>
                          </p>
                        </div>
                        <span className="badge flex-shrink-0" style={{ background: `${sevStyle.color}10`, color: sevStyle.color, border: `1px solid ${sevStyle.color}20` }}>
                          {smell.severity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Most affected files */}
        {data.summary?.most_affected_files?.length > 0 && (
          <section className="animate-fade-in">
            <h3 className="text-[12px] font-semibold text-prism-text mb-2.5 flex items-center gap-2">
              📊 Most Affected Files
            </h3>
            <div className="space-y-1">
              {data.summary.most_affected_files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-prism-surface-2/30 border border-prism-border/30 text-[12px]">
                  <span className="text-prism-text flex-1 truncate font-mono">{f.file.split('/').pop()}</span>
                  <span className="text-prism-rose font-semibold">{f.smell_count} issues</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

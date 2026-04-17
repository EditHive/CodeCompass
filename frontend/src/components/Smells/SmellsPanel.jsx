import React, { useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { getSmells } from '../../services/api';
import { HiOutlineExclamation, HiOutlineShieldCheck, HiOutlineExclamationCircle } from 'react-icons/hi';

const CATEGORY_INFO = {
  complexity: { label: 'Complexity', color: '#f87171', icon: '🔴' },
  coupling: { label: 'Coupling', color: '#fb923c', icon: '🔗' },
  design: { label: 'Design', color: '#fbbf24', icon: '🏗️' },
  architecture: { label: 'Architecture', color: '#f472b6', icon: '🏛️' },
};

const SEVERITY_STYLES = {
  error: { bg: 'bg-prism-red/10', border: 'border-prism-red/30', text: 'text-prism-red', label: 'Critical' },
  warning: { bg: 'bg-prism-amber/10', border: 'border-prism-amber/30', text: 'text-prism-amber', label: 'Warning' },
  info: { bg: 'bg-prism-cyan/10', border: 'border-prism-cyan/30', text: 'text-prism-cyan', label: 'Info' },
};

export default function SmellsPanel() {
  const { data, loading, error, execute } = useApi(getSmells);

  useEffect(() => { execute(); }, []);

  if (loading) return <div className="flex items-center justify-center h-full text-prism-text-dim text-xs">Detecting code smells...</div>;
  if (error) return <div className="flex items-center justify-center h-full text-prism-red text-xs">{error}</div>;
  if (!data) return null;

  const healthColor = data.health_score >= 80 ? '#34d399' : data.health_score >= 50 ? '#fbbf24' : '#f87171';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-prism-border">
        <div className="flex items-center gap-2 mb-2">
          <HiOutlineExclamation className="w-5 h-5 text-[#fb923c]" />
          <h2 className="text-sm font-bold text-prism-text">Code Smell Detection</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Health Score */}
        <div className="rounded-xl p-4 text-center" style={{ background: `${healthColor}08`, border: `1px solid ${healthColor}25` }}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <HiOutlineShieldCheck className="w-5 h-5" style={{ color: healthColor }} />
            <span className="text-2xl font-bold" style={{ color: healthColor }}>{data.health_score}%</span>
          </div>
          <p className="text-xs text-prism-text-dim">Code Health Score</p>
          <p className="text-[10px] text-prism-text-dim mt-1">{data.total_smells} issues detected</p>
        </div>

        {/* Summary by severity */}
        {data.summary && (
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(data.summary.by_severity || {}).map(([sev, count]) => {
              const style = SEVERITY_STYLES[sev] || SEVERITY_STYLES.info;
              return (
                <div key={sev} className={`rounded-lg px-2 py-2 text-center ${style.bg} border ${style.border}`}>
                  <p className={`font-bold text-lg ${style.text}`}>{count}</p>
                  <p className="text-[10px] text-prism-text-dim">{style.label}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Smells by category */}
        {Object.entries(data.categories || {}).map(([category, smells]) => {
          const catInfo = CATEGORY_INFO[category] || { label: category, color: '#8b8ca7', icon: '⚠️' };
          return (
            <section key={category}>
              <h3 className="text-xs font-bold text-prism-text mb-2 flex items-center gap-1.5">
                <span>{catInfo.icon}</span>
                <span>{catInfo.label}</span>
                <span className="text-prism-text-dim font-normal">({smells.length})</span>
              </h3>
              <div className="space-y-1.5">
                {smells.map((smell, i) => {
                  const sevStyle = SEVERITY_STYLES[smell.severity] || SEVERITY_STYLES.info;
                  return (
                    <div key={i} className={`rounded-lg px-3 py-2.5 ${sevStyle.bg} border ${sevStyle.border}`}>
                      <div className="flex items-start gap-2">
                        <HiOutlineExclamationCircle className={`w-4 h-4 ${sevStyle.text} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-prism-text">{smell.message}</p>
                          <p className="text-[10px] text-prism-text-dim mt-0.5 font-mono">
                            {smell.file || smell.files?.join(' → ')}
                          </p>
                          <p className="text-[10px] text-prism-text-dim/80 mt-1">💡 {smell.suggestion}</p>
                        </div>
                        <span className={`badge ${sevStyle.text === 'text-prism-red' ? 'badge-error' : sevStyle.text === 'text-prism-amber' ? 'badge-warning' : 'badge-info'} text-[9px] flex-shrink-0`}>
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
          <section>
            <h3 className="text-xs font-bold text-prism-text mb-2">📊 Most Affected Files</h3>
            <div className="space-y-1">
              {data.summary.most_affected_files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-prism-surface-2/50 text-xs">
                  <span className="text-prism-text flex-1 truncate font-mono">{f.file.split('/').pop()}</span>
                  <span className="text-prism-red font-medium">{f.smell_count} issues</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

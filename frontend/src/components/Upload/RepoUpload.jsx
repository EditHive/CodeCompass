import React, { useState } from 'react';
import { HiOutlineFolder, HiOutlinePlay, HiOutlineGlobeAlt } from 'react-icons/hi';

export default function RepoUpload({ onAnalyze, loading, error }) {
  const [path, setPath] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (path.trim()) {
      onAnalyze(path.trim());
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-prism-bg/80 backdrop-blur-xl">
      <div className="glass-strong rounded-2xl w-[440px] p-8 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center animate-pulse-glow" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <span className="text-2xl font-black text-white">P</span>
          </div>
          <h1 className="text-xl font-bold text-prism-text mb-1 tracking-tight">PRISM-CODE</h1>
          <p className="text-[13px] text-prism-text-dim">AI-Powered Codebase Intelligence</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-prism-text-dim uppercase tracking-wider mb-2 block">
              Repository Path or Git URL
            </label>
            <div className="relative">
              <HiOutlineFolder className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-prism-text-muted" />
              <input
                type="text"
                value={path}
                onChange={e => setPath(e.target.value)}
                placeholder="https://github.com/user/repo"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-prism-surface-2 border border-prism-border text-[13px] text-prism-text placeholder-prism-text-muted focus:outline-none focus:border-prism-accent focus:ring-2 focus:ring-prism-accent/10 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-prism-rose/8 border border-prism-rose/20 rounded-xl text-prism-rose text-xs font-medium text-center animate-fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!path.trim() || loading}
            className="w-full py-3 rounded-xl text-[13px] font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg hover:shadow-prism-accent/20 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Analyzing Repository...
              </>
            ) : (
              <>
                <HiOutlinePlay className="w-4 h-4" />
                Analyze Repository
              </>
            )}
          </button>

          <p className="text-[11px] text-prism-text-muted text-center">
            Supports GitHub URLs and local repository paths
          </p>
        </form>

        {/* Features preview */}
        <div className="mt-7 pt-6 border-t border-prism-border/50">
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: '🕸️', label: 'Dependency Graph' },
              { icon: '⚡', label: 'Impact Analysis' },
              { icon: '🔍', label: 'Smart Search' },
              { icon: '🗺️', label: 'Onboarding' },
            ].map((f, i) => (
              <div key={i} className="text-center py-2.5 px-1 rounded-xl bg-prism-surface-2/50 border border-prism-border/30 hover:border-prism-border transition-colors">
                <p className="text-base mb-1">{f.icon}</p>
                <p className="text-[9px] text-prism-text-dim font-medium">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

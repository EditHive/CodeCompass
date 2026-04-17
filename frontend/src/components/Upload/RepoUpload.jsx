import React, { useState } from 'react';
import { HiOutlineFolder, HiOutlineUpload, HiOutlinePlay } from 'react-icons/hi';

export default function RepoUpload({ onAnalyze, loading }) {
  const [path, setPath] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (path.trim()) {
      onAnalyze(path.trim());
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 bg-prism-bg/80 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl w-[480px] p-8 animate-fade-in glow-accent">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c5cfc, #22d3ee)' }}>
            <span className="text-3xl">🔷</span>
          </div>
          <h1 className="text-2xl font-bold gradient-text mb-1">PRISM-CODE</h1>
          <p className="text-sm text-prism-text-dim">AI-Powered Codebase Intelligence</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-prism-text-dim mb-1.5 block">Repository Path or Git URL</label>
            <div className="relative">
              <HiOutlineFolder className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-prism-text-dim" />
              <input
                type="text"
                value={path}
                onChange={e => setPath(e.target.value)}
                placeholder="/path/to/local/repo OR https://github.com/user/repo"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-prism-surface-2 border border-prism-border text-sm text-prism-text placeholder-prism-text-dim focus:outline-none focus:border-prism-accent transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!path.trim() || loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #7c5cfc, #5b8def)' }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <HiOutlinePlay className="w-4 h-4" />
                Analyze Repository
              </>
            )}
          </button>

          <p className="text-[10px] text-prism-text-dim text-center">
            Or use the pre-loaded sample repository to explore features
          </p>
        </form>

        {/* Features preview */}
        <div className="mt-6 grid grid-cols-4 gap-2">
          {[
            { emoji: '🕸️', label: 'Dependency Graph' },
            { emoji: '⚡', label: 'Impact Analysis' },
            { emoji: '🔍', label: 'Smart Search' },
            { emoji: '🗺️', label: 'Onboarding' },
          ].map((f, i) => (
            <div key={i} className="text-center py-2 px-1 rounded-lg bg-prism-surface-2/30">
              <p className="text-lg mb-0.5">{f.emoji}</p>
              <p className="text-[9px] text-prism-text-dim">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

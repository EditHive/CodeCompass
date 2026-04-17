import React from 'react';
import {
  HiOutlineLightningBolt,
  HiOutlineSearch,
  HiOutlineCode,
  HiOutlineMap,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineFolder,
} from 'react-icons/hi';

const NAV_ITEMS = [
  { id: 'impact', label: 'Impact', icon: HiOutlineLightningBolt, color: '#f43f5e' },
  { id: 'flow', label: 'Flow', icon: HiOutlineClock, color: '#22d3ee' },
  { id: 'search', label: 'Search', icon: HiOutlineSearch, color: '#10b981' },
  { id: 'explain', label: 'Explain', icon: HiOutlineCode, color: '#f59e0b' },
  { id: 'git', label: 'Git Intel', icon: HiOutlineClock, color: '#8b5cf6' },
  { id: 'smells', label: 'Smells', icon: HiOutlineExclamation, color: '#f97316' },
  { id: 'onboarding', label: 'Onboard', icon: HiOutlineMap, color: '#ec4899' },
];

export default function TopNav({ activeTab, onTabChange, isAnalyzed, repoPath, stats, onUploadClick }) {
  return (
    <header className="h-[52px] border-b border-prism-border flex items-center justify-between px-5 bg-prism-surface/80 backdrop-blur-md z-50 relative shrink-0">

      {/* Left: Logo + Repo */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3 pr-5 border-r border-prism-border/60 h-5">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <span className="text-white text-xs font-bold">P</span>
          </div>
          <span className="font-bold tracking-tight text-[14px] text-prism-text">PRISM</span>
          {repoPath && (
            <div className="flex items-center gap-1.5 text-prism-text-dim text-xs">
              <span className="text-prism-border-2">/</span>
              <span className="text-prism-text font-medium">{repoPath.split('/').pop()}</span>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                disabled={!isAnalyzed}
                onClick={() => {
                  if (isActive) onTabChange('graph');
                  else onTabChange(item.id);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 ${
                  !isAnalyzed ? 'opacity-25 cursor-not-allowed' :
                  isActive
                    ? 'text-white'
                    : 'text-prism-text-dim hover:text-prism-text hover:bg-prism-surface-2'
                }`}
                style={isActive ? { background: `${item.color}18`, color: item.color } : {}}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right: Stats + Upload */}
      <div className="flex items-center gap-3">
        {stats && (
          <div className="flex items-center gap-2 text-[11px] font-mono text-prism-text-dim mr-1 bg-prism-surface-2 px-3 py-1 rounded-lg">
            <span>{stats.total_files}<span className="text-prism-text-muted ml-0.5">files</span></span>
            <span className="text-prism-border-2">·</span>
            <span>{stats.total_functions}<span className="text-prism-text-muted ml-0.5">fn</span></span>
            <span className="text-prism-border-2">·</span>
            <span>{stats.total_classes}<span className="text-prism-text-muted ml-0.5">cls</span></span>
          </div>
        )}
        <button
          onClick={onUploadClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-prism-border text-prism-text-dim hover:text-prism-text hover:bg-prism-surface-2 hover:border-prism-border-2 transition-all duration-150"
        >
          <HiOutlineFolder className="w-3.5 h-3.5" />
          {repoPath ? 'Change Repo' : 'Load Repo'}
        </button>
      </div>
    </header>
  );
}

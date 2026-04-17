import React from 'react';
import { HiOutlineShare, HiOutlineLightningBolt, HiOutlineSearch, HiOutlineCode, HiOutlineMap, HiOutlineClock, HiOutlineExclamation, HiOutlineFolder } from 'react-icons/hi';

const NAV_ITEMS = [
  { id: 'impact', label: 'Impact', icon: HiOutlineLightningBolt },
  { id: 'flow', label: 'Flow', icon: HiOutlineClock },
  { id: 'search', label: 'Search', icon: HiOutlineSearch },
  { id: 'explain', label: 'Explain', icon: HiOutlineCode },
  { id: 'git', label: 'Git Intel', icon: HiOutlineClock },
  { id: 'smells', label: 'Smells', icon: HiOutlineExclamation },
  { id: 'onboarding', label: 'Onboard', icon: HiOutlineMap },
];

export default function TopNav({ activeTab, onTabChange, isAnalyzed, repoPath, stats, onUploadClick }) {
  return (
    <header className="h-[48px] border-b border-prism-border flex items-center justify-between px-6 bg-prism-surface z-50 relative shrink-0">
      
      {/* Logos & Context */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 pr-6 border-r border-prism-border h-4">
          <span className="font-bold tracking-tight text-[14px]">PRISM</span>
          {repoPath && (
            <div className="flex items-center gap-2 text-prism-text-dim text-xs font-mono">
              <span>/</span>
              <span className="text-prism-text font-medium">{repoPath.split('/').pop()}</span>
            </div>
          )}
        </div>

        {/* Global Toolbar */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                disabled={!isAnalyzed}
                onClick={() => {
                  if (isActive) onTabChange('graph'); // Toggle off
                  else onTabChange(item.id);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-xs font-medium transition-colors ${
                  !isAnalyzed ? 'opacity-30 cursor-not-allowed' :
                  isActive ? 'bg-[#222] text-white' : 'text-[#888] hover:text-white hover:bg-[#111]'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-4">
        {stats && (
           <div className="flex items-center gap-3 text-[11px] font-mono text-[#888] mr-2">
             <span>{stats.total_files} files</span>
             <span>{stats.total_functions} fn</span>
             <span>{stats.total_classes} cls</span>
           </div>
        )}
        <button
          onClick={onUploadClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-xs font-medium border border-prism-border hover:bg-[#222] transition-colors"
        >
          <HiOutlineFolder className="w-3.5 h-3.5" />
          {repoPath ? 'Change Repo' : 'Load Repo'}
        </button>
      </div>
    </header>
  );
}

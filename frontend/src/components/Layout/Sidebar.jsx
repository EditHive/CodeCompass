import React, { useState } from 'react';
import { HiOutlineShare, HiOutlineLightningBolt, HiOutlineSearch, HiOutlineCode, HiOutlineMap, HiOutlineClock, HiOutlineExclamation, HiOutlineUpload, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';

const NAV_ITEMS = [
  { id: 'graph', label: 'Graph', icon: HiOutlineShare, color: 'prism-accent' },
  { id: 'impact', label: 'Impact', icon: HiOutlineLightningBolt, color: 'red-400' },
  { id: 'flow', label: 'Flow', icon: HiOutlineClock, color: 'cyan-400' },
  { id: 'search', label: 'Search', icon: HiOutlineSearch, color: 'emerald-400' },
  { id: 'explain', label: 'Explain', icon: HiOutlineCode, color: 'amber-400' },
  { id: 'onboarding', label: 'Onboard', icon: HiOutlineMap, color: 'pink-400' },

  { id: 'smells', label: 'Smells', icon: HiOutlineExclamation, color: 'orange-400' },
];

export default function Sidebar({ activeTab, onTabChange, isAnalyzed }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`glass border-r border-prism-border flex flex-col transition-all duration-300 relative z-20 ${
        isCollapsed ? 'w-[70px]' : 'w-[240px]'
      }`}
    >
      <div className="h-[60px] flex items-center px-4 border-b border-prism-border/50 relative">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-prism-accent to-prism-cyan flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
          <span className="text-white font-bold text-sm tracking-wider">P</span>
        </div>
        {!isCollapsed && (
          <div className="ml-3 mt-1 overflow-hidden animate-fade-in flex-1">
            <h1 className="text-sm font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-prism-text-dim">
              PRISM<span className="font-light">-CODE</span>
            </h1>
            <p className="text-[9px] uppercase tracking-widest text-prism-accent font-semibold mt-0.5 opacity-80">Intelligence Engine</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-6 overflow-y-auto px-3 space-y-1 scrollbar-hide">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center rounded-xl transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-prism-surface-hover shadow-[0_4px_10px_rgba(0,0,0,0.1)] border border-prism-border/40' 
                  : 'hover:bg-prism-surface border border-transparent'}
                ${isCollapsed ? 'h-11 justify-center' : 'px-3 py-2.5'}
              `}
              title={isCollapsed ? item.label : ''}
            >
              {isActive && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-${item.color}`} />
              )}
              
              <item.icon className={`
                ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} 
                ${isActive ? `text-${item.color} drop-shadow-[0_0_8px_rgba(var(--color-${item.color}),0.5)]` : 'text-prism-text-dim group-hover:text-prism-text'}
                transition-colors
              `} />
              
              {!isCollapsed && (
                <span className={`ml-3 text-[13px] font-medium tracking-wide ${isActive ? 'text-white' : 'text-prism-text-dim group-hover:text-prism-text'}`}>
                  {item.label}
                </span>
              )}
              
              {!isCollapsed && isActive && (
                <div className={`absolute right-3 w-1.5 h-1.5 rounded-full bg-${item.color} shadow-[0_0_8px_rgba(var(--color-${item.color}),0.8)]`} />
              )}
            </button>
          );
        })}
      </nav>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="h-12 border-t border-prism-border/50 flex items-center justify-center text-prism-text-dim hover:text-white hover:bg-prism-surface transition-colors"
      >
        {isCollapsed ? <HiOutlineChevronRight className="w-4 h-4" /> : <HiOutlineChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}

import React from 'react';
import { HiOutlineFolder, HiOutlineCube, HiOutlineCode, HiOutlineLink } from 'react-icons/hi';

export default function Header({ stats, repoPath, onUploadClick }) {
  return (
    <header className="h-[60px] flex items-center justify-between px-6 glass-strong border-b border-prism-border/50 relative z-10 w-full shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
      <div className="flex items-center gap-6">
        {repoPath ? (
          <>
            <div className="flex items-center gap-2.5 bg-prism-surface-hover px-4 py-2 rounded-xl border border-prism-border shadow-inner">
              <HiOutlineFolder className="w-5 h-5 text-prism-accent" />
              <span className="text-[11px] uppercase tracking-wider text-prism-text-dim font-bold">Analyzing</span>
              <div className="w-1 h-1 rounded-full bg-prism-border mx-1" />
              <span className="font-semibold text-[14px] text-white tracking-wide">{repoPath.split('/').pop()}</span>
            </div>
            
            {stats && (
              <div className="flex items-center gap-1.5 ml-2">
                <Stat icon={HiOutlineFolder} value={stats.total_files} label="Files" color="text-prism-accent glow-accent" bg="bg-prism-accent/10" />
                <Stat icon={HiOutlineCode} value={stats.total_functions} label="Functions" color="text-prism-cyan glow-cyan" bg="bg-prism-cyan/10" />
                <Stat icon={HiOutlineCube} value={stats.total_classes} label="Classes" color="text-prism-emerald glow-emerald" bg="bg-prism-emerald/10" />
                <Stat icon={HiOutlineLink} value={stats.import_relationships} label="Imports" color="text-prism-amber glow-amber" bg="bg-prism-amber/10" />
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-prism-surface border border-prism-border border-dashed">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-prism-amber opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-prism-amber"></span>
            </span>
            <span className="text-sm font-medium text-prism-text-dim">Waiting for repository...</span>
          </div>
        )}
      </div>

      <button
        onClick={onUploadClick}
        className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase shadow-lg"
      >
        <HiOutlineFolder className="w-4 h-4 opacity-80" />
        {repoPath ? 'Change Framework' : 'Load Repository'}
      </button>
    </header>
  );
}

function Stat({ icon: Icon, value, label, color, bg }) {
  return (
    <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-prism-border/40 ${bg} hover:bg-prism-surface-hover transition-colors cursor-default`}>
      <Icon className={`w-4 h-4 ${color.split(' ')[0]}`} />
      <span className={`font-bold ${color}`}>{value ?? '-'}</span>
      <span className="text-[10px] uppercase font-semibold tracking-wider text-prism-text-dim pt-0.5">{label}</span>
    </div>
  );
}

import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { traceFlow } from '../../services/api';
import { HiOutlineClock, HiOutlinePlay, HiOutlineArrowNarrowDown } from 'react-icons/hi';

const OP_ICONS = {
  authentication: '🔐', database: '💾', api_call: '🌐', validation: '✅',
  logging: '📝', initialization: '🚀', payment: '💳', notification: '📧',
  computation: '⚙️',
};
const OP_COLORS = {
  authentication: '#f472b6', database: '#34d399', api_call: '#5b8def',
  validation: '#22d3ee', logging: '#8b8ca7', initialization: '#7c5cfc',
  payment: '#fbbf24', notification: '#fb923c', computation: '#a78bfa',
};

export default function FlowViewer({ onHighlightFlow }) {
  const [funcName, setFuncName] = useState('');
  const { data: flowData, loading, error, execute: runTrace } = useApi(traceFlow);
  const [expandedStep, setExpandedStep] = useState(null);

  const handleTrace = async () => {
    if (!funcName.trim()) return;
    const result = await runTrace(funcName.trim());
    if (result?.steps) {
      onHighlightFlow?.(result.steps.map(s => s.node_id));
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-prism-border">
        <div className="flex items-center gap-2 mb-2">
          <HiOutlineClock className="w-5 h-5 text-prism-cyan" />
          <h2 className="text-sm font-bold text-prism-text">Execution Flow Tracker</h2>
        </div>
        <p className="text-xs text-prism-text-dim">Ask: "What happens when X function runs?"</p>
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-b border-prism-border">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. process_payment, login, register..."
            value={funcName}
            onChange={e => setFuncName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTrace()}
            className="flex-1 px-3 py-1.5 rounded-lg bg-prism-surface-2 border border-prism-border text-xs text-prism-text placeholder-prism-text-dim focus:outline-none focus:border-prism-cyan transition-colors"
          />
          <button
            onClick={handleTrace}
            disabled={!funcName.trim() || loading}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-prism-cyan/15 text-prism-cyan border border-prism-cyan/30 hover:bg-prism-cyan/25 disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
          >
            <HiOutlinePlay className="w-3 h-3" />
            {loading ? '...' : 'Trace'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {error && <div className="text-xs text-prism-red bg-prism-red/10 rounded-lg px-3 py-2 mb-3">{error}</div>}

        {flowData && flowData.steps?.length > 0 && (
          <div className="animate-fade-in">
            {/* Summary */}
            <div className="mb-4 rounded-lg bg-prism-cyan/5 border border-prism-cyan/20 px-3 py-2.5">
              <p className="text-xs font-medium text-prism-cyan mb-1">
                {flowData.entry_point.name}() → {flowData.total_steps} steps across {flowData.files_involved.length} files
              </p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {flowData.files_involved.map((f, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-prism-surface-2 text-prism-text-dim">
                    {f.split('/').pop()}
                  </span>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-0">
              {flowData.steps.map((step, i) => {
                const isExpanded = expandedStep === i;
                const opColor = OP_COLORS[step.operation] || '#8b8ca7';
                return (
                  <div key={i}>
                    <button
                      onClick={() => setExpandedStep(isExpanded ? null : i)}
                      className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg hover:bg-prism-surface-2/50 transition text-left cursor-pointer"
                    >
                      {/* Step number */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: `${opColor}20`, color: opColor, border: `1px solid ${opColor}40` }}>
                          {step.step}
                        </div>
                        {i < flowData.steps.length - 1 && (
                          <div className="w-px h-4 bg-prism-border mt-1" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{OP_ICONS[step.operation] || '⚙️'}</span>
                          <span className="text-xs font-semibold text-prism-text">{step.function}()</span>
                          <span className="badge text-[9px]" style={{ background: `${opColor}15`, color: opColor, border: `1px solid ${opColor}30` }}>
                            {step.operation}
                          </span>
                        </div>
                        <p className="text-[11px] text-prism-text-dim mt-0.5 truncate">{step.description}</p>
                        <p className="text-[10px] text-prism-text-dim/60 font-mono">{step.file}:{step.line_start}</p>

                        {/* Expanded code */}
                        {isExpanded && step.code_snippet && (
                          <div className="mt-2 code-block text-[11px] max-h-[200px] overflow-y-auto animate-fade-in">
                            {step.code_snippet}
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Connector arrow */}
                    {i < flowData.steps.length - 1 && (
                      <div className="flex items-center justify-start pl-[21px] py-0">
                        <HiOutlineArrowNarrowDown className="w-3 h-3 text-prism-border" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {flowData && flowData.steps?.length === 0 && (
          <div className="text-center py-8 text-prism-text-dim text-xs">No execution steps found for this function.</div>
        )}
      </div>
    </div>
  );
}

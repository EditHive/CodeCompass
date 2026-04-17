import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { traceFlow } from '../../services/api';
import { HiOutlinePlay, HiOutlineArrowNarrowDown } from 'react-icons/hi';

const OP_COLORS = {
  authentication: '#ec4899', database: '#10b981', api_call: '#6366f1',
  validation: '#22d3ee', logging: '#71717a', initialization: '#8b5cf6',
  payment: '#eab308', notification: '#f97316', computation: '#a78bfa',
};

const OP_ICONS = {
  authentication: '🔐', database: '💾', api_call: '🌐', validation: '✅',
  logging: '📝', initialization: '🚀', payment: '💳', notification: '📧',
  computation: '⚙️',
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
      <div className="px-4 py-4 border-b border-prism-border">
        <p className="text-[12px] text-prism-text-dim leading-relaxed">
          Trace what happens when a function executes, step by step.
        </p>
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
            className="flex-1 px-3 py-2 rounded-lg bg-prism-surface-2 border border-prism-border text-[12px] text-prism-text placeholder-prism-text-muted focus:outline-none focus:border-prism-cyan focus:ring-2 focus:ring-prism-cyan/10 transition-all"
          />
          <button
            onClick={handleTrace}
            disabled={!funcName.trim() || loading}
            className="px-4 py-2 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            style={{ background: 'linear-gradient(135deg, #22d3ee, #06b6d4)', color: '#fff' }}
          >
            <HiOutlinePlay className="w-3 h-3" />
            {loading ? '...' : 'Trace'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {error && <div className="text-[12px] text-prism-rose bg-prism-rose/8 border border-prism-rose/20 rounded-lg px-3 py-2.5 mb-3">{error}</div>}

        {flowData && flowData.steps?.length > 0 && (
          <div className="animate-fade-in">
            {/* Summary */}
            <div className="mb-4 rounded-lg bg-prism-cyan/5 border border-prism-cyan/15 px-3.5 py-3">
              <p className="text-[12px] font-semibold text-prism-cyan mb-1.5">
                {flowData.entry_point.name}() → {flowData.total_steps} steps
              </p>
              <div className="flex flex-wrap gap-1.5">
                {flowData.files_involved.map((f, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-prism-surface-2 text-prism-text-dim border border-prism-border/30 font-mono">
                    {f.split('/').pop()}
                  </span>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-0">
              {flowData.steps.map((step, i) => {
                const isExpanded = expandedStep === i;
                const opColor = OP_COLORS[step.operation] || '#71717a';
                return (
                  <div key={i}>
                    <button
                      onClick={() => setExpandedStep(isExpanded ? null : i)}
                      className="w-full flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-prism-surface-2/40 transition-all text-left cursor-pointer group"
                    >
                      {/* Step indicator */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold"
                          style={{ background: `${opColor}12`, color: opColor, border: `1px solid ${opColor}25` }}
                        >
                          {step.step}
                        </div>
                        {i < flowData.steps.length - 1 && (
                          <div className="w-px h-5 mt-1" style={{ background: `${opColor}20` }} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm">{OP_ICONS[step.operation] || '⚙️'}</span>
                          <span className="text-[12px] font-semibold text-prism-text">{step.function}()</span>
                          <span className="badge" style={{ background: `${opColor}10`, color: opColor, border: `1px solid ${opColor}20` }}>
                            {step.operation}
                          </span>
                        </div>
                        <p className="text-[11px] text-prism-text-dim mt-1 leading-relaxed">{step.description}</p>
                        <p className="text-[10px] text-prism-text-muted font-mono mt-0.5">{step.file}:{step.line_start}</p>

                        {/* Expanded code */}
                        {isExpanded && step.code_snippet && (
                          <div className="mt-2.5 code-block text-[11px] max-h-[180px] overflow-y-auto animate-fade-in">
                            {step.code_snippet}
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Connector */}
                    {i < flowData.steps.length - 1 && (
                      <div className="flex items-center justify-start pl-[23px] py-0">
                        <HiOutlineArrowNarrowDown className="w-3 h-3 text-prism-border-2" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {flowData && flowData.steps?.length === 0 && (
          <div className="text-center py-10 text-prism-text-muted text-[12px]">No execution steps found for this function.</div>
        )}
      </div>
    </div>
  );
}

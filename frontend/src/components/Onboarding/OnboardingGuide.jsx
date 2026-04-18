import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { getOnboarding } from '../../services/api';

const PHASE_COLORS = {
  'Entry Point': '#f43f5e',
  'Core Module': '#94a3b8',
  'Utility':     '#10b981',
};

const PHASE_ICONS = {
  'Entry Point': '▶️',
  'Core Module': '◈',
  'Utility':     '⚙',
};

/* ─── Styles ────────────────────────────────────────────────────────────── */
const s = {
  panel: {
    background: '#0d0e1a',
    borderRadius: 16,
    border: '1px solid rgba(148, 163, 184,0.18)',
    overflow: 'hidden',
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    maxWidth: 560,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  /* ── header removed ── */
  subHeader: {
    padding: '24px 20px 16px',
    background: '#0d0e1a',
  },
  subHeaderText: {
    fontSize: 11, color: '#7b7fa8', lineHeight: 1.6,
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px 24px',
  },
  sectionLabel: {
    fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
    textTransform: 'uppercase', color: '#4b4f72',
    marginBottom: 12,
  },
  stepList: { display: 'flex', flexDirection: 'column' },
  stepRow: {
    display: 'flex',
    alignItems: 'stretch',
    gap: 12,
    cursor: 'pointer',
    borderRadius: 10,
    padding: '8px 10px',
    transition: 'background 0.15s',
    border: '1px solid transparent',
    width: '100%',
    background: 'none',
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  stepLeft: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0,
  },
  stepIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, flexShrink: 0,
  },
  connector: {
    width: 1, flex: 1, minHeight: 12, marginTop: 4, marginBottom: 2,
    alignSelf: 'stretch',
  },
  stepContent: { flex: 1, minWidth: 0, paddingBottom: 4 },
  stepTopRow: {
    display: 'flex', alignItems: 'center', gap: 6,
    flexWrap: 'wrap', marginBottom: 3,
  },
  stepNum: { fontSize: 9, color: '#4b4f72', letterSpacing: '0.06em', fontWeight: 700 },
  stepLabel: { fontSize: 12, fontWeight: 700, color: '#e2e4f0' },
  phaseBadge: {
    fontSize: 9, fontWeight: 700,
    padding: '2px 7px', borderRadius: 20,
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  stepReason: {
    fontSize: 10, color: '#9396b8', lineHeight: 1.6,
  },
  stepDocstring: {
    fontSize: 10, color: '#94a3b8', fontStyle: 'italic',
    lineHeight: 1.5, marginTop: 4,
    paddingLeft: 8,
    borderLeft: '2px solid rgba(148, 163, 184,0.3)',
  },
  exploreRow: {
    display: 'flex', alignItems: 'center', gap: 4,
    fontSize: 10, color: '#10b981', fontWeight: 700,
    marginTop: 6, letterSpacing: '0.04em',
    opacity: 0, transition: 'opacity 0.15s',
  },
  divider: {
    height: 1, background: 'rgba(148, 163, 184,0.1)', margin: '20px 0',
  },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
    marginTop: 4,
  },
  statCard: {
    borderRadius: 10,
    padding: '12px 8px',
    textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
  },
  statVal: { fontSize: 20, fontWeight: 700, lineHeight: 1 },
  statLabel: {
    fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: '#7b7fa8', marginTop: 2,
  },
  centerBox: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100%', padding: 24,
  },
  spinner: {
    width: 28, height: 28,
    border: '2px solid rgba(148, 163, 184,0.2)',
    borderTop: '2px solid #94a3b8',
    borderRadius: '50%',
    animation: 'prism-spin 0.8s linear infinite',
    marginBottom: 10,
  },
  loadingText: { fontSize: 11, color: '#7b7fa8', marginTop: 8 },
  errorText: { fontSize: 11, color: '#f87171', textAlign: 'center' },
};

/* ─── Mock data for standalone preview ─────────────────────────────────── */
const MOCK_DATA = {
  total_files: 142,
  entry_points:    [1, 2, 3],
  core_modules:    [1, 2, 3, 4, 5],
  utility_modules: [1, 2, 3, 4, 5, 6, 7, 8],
  exploration_order: [
    { step: 1, node_id: 'main-ts',      label: 'main.ts',              phase: 'Entry Point', reason: 'Application bootstrap — registers global pipes, middleware, and starts the HTTP server.',         docstring: 'Bootstraps the NestJS application, configures Swagger, and binds to PORT env variable.' },
    { step: 2, node_id: 'app-module',   label: 'AppModule',            phase: 'Core Module', reason: 'Root module that wires together every feature module and global providers.',                    docstring: 'Root module importing AuthModule, UserModule, PaymentModule, and DatabaseModule.' },
    { step: 3, node_id: 'auth-mid',     label: 'auth.middleware.ts',   phase: 'Entry Point', reason: 'All requests pass through JWT verification here before reaching any controller.',              docstring: 'Verifies bearer tokens, attaches decoded payload to request context.' },
    { step: 4, node_id: 'user-ctrl',    label: 'UserController',       phase: 'Core Module', reason: 'Primary CRUD surface for user resources — good example of the controller pattern used throughout.', docstring: 'Handles GET /users, POST /users, PATCH /users/:id, DELETE /users/:id endpoints.' },
    { step: 5, node_id: 'payment-svc',  label: 'PaymentService',       phase: 'Core Module', reason: 'Encapsulates Stripe integration; shows service-layer pattern and error handling conventions.',  docstring: 'Manages charge creation, subscription lifecycle, and refund processing via Stripe SDK.' },
    { step: 6, node_id: 'db-conn',      label: 'connection.ts',        phase: 'Utility',     reason: 'Shared database connection pool — referenced by every repository class.',                      docstring: 'Creates and exports a TypeORM DataSource with connection-pool and retry configuration.' },
    { step: 7, node_id: 'validators',   label: 'validators/index.ts',  phase: 'Utility',     reason: 'Custom class-validator decorators reused across all DTOs — understand these early.',           docstring: 'Exports IsStrongPassword, IsSlug, IsFutureDate, and IsE164Phone validators.' },
  ],
};

/* ─── SummaryCard ───────────────────────────────────────────────────────── */
function SummaryCard({ label, value, color }) {
  return (
    <div style={{ ...s.statCard, background: `${color}08`, border: `1px solid ${color}20` }}>
      <span style={{ ...s.statVal, color }}>{value}</span>
      <span style={s.statLabel}>{label}</span>
    </div>
  );
}

/* ─── StepRow ───────────────────────────────────────────────────────────── */
function StepRow({ step, isLast, onSelectNode }) {
  const [hovered, setHovered] = useState(false);
  const color = PHASE_COLORS[step.phase] || '#94a3b8';
  const icon  = PHASE_ICONS[step.phase]  || '◇';

  return (
    <div>
      <button
        style={{
          ...s.stepRow,
          background: hovered ? 'rgba(148, 163, 184,0.06)' : 'transparent',
          borderColor: hovered ? 'rgba(148, 163, 184,0.18)' : 'transparent',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onSelectNode?.(step.node_id)}
      >
        {/* Left: icon + connector */}
        <div style={s.stepLeft}>
          <div style={{ ...s.stepIconWrap, background: `${color}12`, border: `1px solid ${color}25`, color }}>
            {icon}
          </div>
          {!isLast && (
            <div style={{ ...s.connector, background: `${color}25` }} />
          )}
        </div>

        {/* Right: content */}
        <div style={s.stepContent}>
          <div style={s.stepTopRow}>
            <span style={s.stepNum}>STEP {step.step}</span>
            <span style={s.stepLabel}>{step.label}</span>
            <span style={{ ...s.phaseBadge, background: `${color}12`, color, border: `1px solid ${color}25` }}>
              {step.phase}
            </span>
          </div>
          <p style={s.stepReason}>{step.reason}</p>
          {step.docstring && (
            <p style={s.stepDocstring}>
              "{step.docstring.length > 100 ? step.docstring.slice(0, 100) + '…' : step.docstring}"
            </p>
          )}
          <div style={{ ...s.exploreRow, opacity: hovered ? 1 : 0 }}>
            <span>Explore</span>
            <span style={{ fontSize: 11 }}>→</span>
          </div>
        </div>
      </button>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────────────── */
export default function OnboardingGuide({ onSelectNode }) {
  const { data, loading, error, execute } = useApi(getOnboarding);

  useEffect(() => { execute(); }, []);

  // Uncomment below and remove MOCK_DATA usage to use real API:
  // const displayData = data;
  const displayData = data || MOCK_DATA;

  return (
    <div style={s.panel}>


      {/* Sub-header / Title */}
      {displayData && !loading && (
        <div style={s.subHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 38, height: 38,
              background: 'linear-gradient(135deg, #3b82f6 0%, #475569 100%)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(71, 85, 105,0.25)',
              fontSize: 18, color: '#fff',
            }}>
              🗺️
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f1f7', letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif' }}>
                Onboarding Guide
              </div>
              <p style={s.subHeaderText} style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                Recommended exploration path &nbsp;·&nbsp;
                <span style={{ color: '#475569', fontWeight: 700 }}>{displayData.total_files}</span> files
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      {loading && (
        <div style={s.centerBox}>
          <div style={{ textAlign: 'center' }}>
            <div style={s.spinner} />
            <p style={s.loadingText}>Building onboarding guide…</p>
          </div>
          <style>{`@keyframes prism-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {error && !loading && (
        <div style={s.centerBox}>
          <p style={s.errorText}>{error}</p>
        </div>
      )}

      {!loading && displayData && (
        <div style={s.scrollArea}>
          <p style={s.sectionLabel}>Exploration order</p>

          <div style={s.stepList}>
            {displayData.exploration_order?.map((step, i) => (
              <StepRow
                key={step.node_id || i}
                step={step}
                isLast={i === displayData.exploration_order.length - 1}
                onSelectNode={onSelectNode}
              />
            ))}
          </div>

          <div style={s.divider} />

          <p style={s.sectionLabel}>Codebase breakdown</p>
          <div style={s.statsGrid}>
            <SummaryCard label="Entry Points" value={displayData.entry_points?.length  || 0} color="#f43f5e" />
            <SummaryCard label="Core Modules" value={displayData.core_modules?.length  || 0} color="#94a3b8" />
            <SummaryCard label="Utilities"    value={displayData.utility_modules?.length || 0} color="#10b981" />
          </div>
        </div>
      )}
    </div>
  );
}
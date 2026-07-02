import React, { useEffect, useState } from 'react';
import DetailModal from './DetailModal';
import { customViewsTrialTimeline } from '../services/api';

/**
 * VIZ - trial timeline. Renders per-trial bars (months since start) grouped
 * by phase, plus an aggregate "average months by phase" mini-chart.
 */
function TrialTimelineView() {
  const [data, setData] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    customViewsTrialTimeline().then(setData).catch(e => setError(e.message));
  }, []);

  if (error) return <div className="ai-error">Failed to load timeline: {error}</div>;
  if (!data) return <div style={{ padding: 12 }}>Loading timeline...</div>;

  const maxMonths = Math.max(1, ...data.rows.map(r => r.duration_months));
  const maxAvg = Math.max(1, ...data.by_phase.map(p => p.avg_months));

  return (
    <div data-testid="trial-timeline-view" style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16,
    }}>
      <h3 style={{ margin: '0 0 4px' }}>Trial Timeline (phase x duration)</h3>
      <p style={{ margin: '0 0 14px', color: '#6b7280', fontSize: 13 }}>
        Months elapsed since trial start_date, grouped by phase.
      </p>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          Average duration by phase
        </div>
        {data.by_phase.map(p => (
          <div
            key={p.phase}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, cursor: 'pointer' }}
            onClick={() => setDetail({ title: `Phase ${p.phase} average duration`, data: p })}
          >
            <div style={{ width: 60, fontSize: 12, color: '#374151' }}>Phase {p.phase}</div>
            <div style={{ flex: 1, background: '#f3f4f6', height: 14, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                width: `${(p.avg_months / maxAvg) * 100}%`,
                background: '#8b5cf6', height: '100%',
              }} />
            </div>
            <div style={{ width: 80, fontSize: 12, textAlign: 'right', color: '#6b7280' }}>
              {p.avg_months} mo · {p.trials}t
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        Per-trial duration
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {data.rows.map(r => (
          <div
            key={r.trial_id}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, cursor: 'pointer' }}
            onClick={() => setDetail({ title: `Trial duration — ${r.trial_id}`, data: r })}
          >
            <div style={{ width: 130, fontSize: 11, color: '#111827', fontFamily: 'monospace' }}>
              {r.trial_id}
            </div>
            <div style={{ width: 50, fontSize: 11, color: '#6b7280' }}>Ph {r.phase}</div>
            <div style={{ flex: 1, background: '#f3f4f6', height: 10, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                width: `${(r.duration_months / maxMonths) * 100}%`,
                background: r.status === 'completed' ? '#10b981'
                  : r.status === 'halted' ? '#ef4444'
                  : '#3b82f6',
                height: '100%',
              }} />
            </div>
            <div style={{ width: 60, fontSize: 11, textAlign: 'right', color: '#6b7280' }}>
              {r.duration_months}mo
            </div>
          </div>
        ))}
      </div>
      {detail && <DetailModal title={detail.title} data={detail.data} onClose={() => setDetail(null)} />}
    </div>
  );
}

export default TrialTimelineView;

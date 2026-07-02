import React, { useEffect, useState } from 'react';
import DetailModal from './DetailModal';
import { customViewsEndpointCoverage } from '../services/api';

/**
 * VIZ - endpoint coverage heatmap. Cells are trial x endpoint-type counts,
 * shaded by intensity (0..max). Hover tooltip shows the raw count.
 */
function EndpointCoverageHeatmap() {
  const [data, setData] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    customViewsEndpointCoverage().then(setData).catch(e => setError(e.message));
  }, []);

  if (error) return <div className="ai-error">Failed to load coverage: {error}</div>;
  if (!data) return <div style={{ padding: 12 }}>Loading heatmap...</div>;

  const max = Math.max(1, ...data.cells.map(c => c.count));
  const cellAt = (trial, type) =>
    data.cells.find(c => c.trial === trial && c.type === type) || { count: 0 };

  const shade = (n) => {
    if (n === 0) return '#f9fafb';
    const a = 0.15 + (n / max) * 0.75;
    return `rgba(20,184,166,${a.toFixed(2)})`;
  };

  return (
    <div data-testid="endpoint-coverage-heatmap" style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16,
    }}>
      <h3 style={{ margin: '0 0 4px' }}>Endpoint Coverage Heatmap</h3>
      <p style={{ margin: '0 0 14px', color: '#6b7280', fontSize: 13 }}>
        Endpoint-type counts per trial. Darker = more endpoints of that type.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 2, fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 4, color: '#6b7280', fontWeight: 600 }}>Trial</th>
              {data.types.map(t => (
                <th key={t} style={{ padding: 4, color: '#6b7280', fontWeight: 600, textTransform: 'capitalize' }}>
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.trials.map(tr => (
              <tr
                key={tr.trial_id}
                style={{ cursor: 'pointer' }}
                onClick={() => setDetail({ title: `Endpoint coverage — ${tr.trial_id}`, data: tr })}
              >
                <td style={{
                  padding: '4px 8px', fontFamily: 'monospace', color: '#111827',
                  whiteSpace: 'nowrap',
                }}>{tr.trial_id}</td>
                {data.types.map(type => {
                  const cell = cellAt(tr.trial_id, type);
                  return (
                    <td
                      key={type}
                      title={`${tr.trial_id} / ${type}: ${cell.count}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetail({
                          title: `${tr.trial_id} / ${type}`,
                          data: { trial: tr.trial_id, type, count: cell.count, max_count: max },
                        });
                      }}
                      style={{
                        background: shade(cell.count),
                        color: cell.count > max * 0.5 ? '#fff' : '#111827',
                        textAlign: 'center',
                        padding: '6px 12px',
                        minWidth: 50,
                        borderRadius: 3,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {cell.count}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {detail && <DetailModal title={detail.title} data={detail.data} onClose={() => setDetail(null)} />}
    </div>
  );
}

export default EndpointCoverageHeatmap;

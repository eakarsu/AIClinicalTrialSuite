import React, { useEffect, useState } from 'react';
import { aiHistory } from '../services/api';
import AIResultDisplay from './AIResultDisplay';

/*
  AIHistory modal: shows past ai_results for one feature.
  Props:
    feature: string (matches ai_results.feature, e.g. 'draft-protocol')
    open:    bool
    onClose: () => void
*/
function AIHistory({ feature, open, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    aiHistory(feature)
      .then(res => { if (!cancelled) setItems(res.data || []); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, feature]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content history-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>History · {feature}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {loading && <div className="loading">Loading history...</div>}
          {error && <div className="ai-error">Error: {error}</div>}
          {!loading && !error && items.length === 0 && (
            <div className="loading">No previous runs.</div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="history-list">
              {items.map(it => (
                <div key={it.id} className="history-item">
                  <div className="history-row" onClick={() => setSelected(selected === it.id ? null : it.id)}>
                    <div>
                      <div className="history-time">{new Date(it.created_at).toLocaleString()}</div>
                      <div className="history-model">{it.model}</div>
                    </div>
                    <button className="btn btn-secondary">{selected === it.id ? 'Hide' : 'View'}</button>
                  </div>
                  {selected === it.id && (
                    <div className="history-detail">
                      {it.input && Object.keys(it.input || {}).length > 0 && (
                        <>
                          <h5>Input</h5>
                          <pre className="ai-raw-pre">{JSON.stringify(it.input, null, 2)}</pre>
                        </>
                      )}
                      <div style={{ marginTop: 10 }}>
                        <AIResultDisplay result={it.output} loading={false} error={null} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default AIHistory;

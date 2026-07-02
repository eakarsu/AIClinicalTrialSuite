import React, { useEffect, useState } from 'react';
import DetailModal from './DetailModal';
import {
  customViewsListRules,
  customViewsCreateRule,
  customViewsUpdateRule,
  customViewsDeleteRule,
  getTrials,
} from '../services/api';

/**
 * NON-VIZ - CRUD editor for trial-design rules (inclusion / exclusion criteria).
 * Backed by /api/custom-views/design-rules (in-memory store, demo-only).
 */
function DesignRulesEditor() {
  const [rules, setRules] = useState([]);
  const [trials, setTrials] = useState([]);
  const [form, setForm] = useState({ trial: '', kind: 'inclusion', text: '' });
  const [editingId, setEditingId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    try {
      const data = await customViewsListRules();
      setRules(data.rules || []);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    refresh();
    getTrials()
      .then(rows => {
        setTrials(rows);
        setForm(f => f.trial ? f : { ...f, trial: rows[0]?.trial_id || '' });
      })
      .catch(e => setError(e.message));
  }, []);

  const submit = async () => {
    if (!form.trial || !form.text.trim()) {
      setError('Trial and rule text are required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (editingId) {
        await customViewsUpdateRule(editingId, form);
      } else {
        await customViewsCreateRule(form);
      }
      setForm({ trial: form.trial, kind: 'inclusion', text: '' });
      setEditingId(null);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setForm({ trial: r.trial, kind: r.kind, text: r.text });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ trial: form.trial, kind: 'inclusion', text: '' });
  };

  const remove = async (id) => {
    setLoading(true);
    try {
      await customViewsDeleteRule(id);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="design-rules-editor" style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16,
    }}>
      <h3 style={{ margin: '0 0 4px' }}>Trial Design Rules Editor</h3>
      <p style={{ margin: '0 0 12px', color: '#6b7280', fontSize: 13 }}>
        Manage inclusion / exclusion criteria. Used by the Protocol PDF view above.
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: 8,
        marginBottom: 10, alignItems: 'center',
      }}>
        <select
          value={form.trial}
          onChange={e => setForm({ ...form, trial: e.target.value })}
          style={{ padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6 }}
        >
          <option value="">Select trial...</option>
          {trials.map(t => <option key={t.trial_id} value={t.trial_id}>{t.trial_id}</option>)}
        </select>
        <select
          value={form.kind}
          onChange={e => setForm({ ...form, kind: e.target.value })}
          style={{ padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6 }}
        >
          <option value="inclusion">inclusion</option>
          <option value="exclusion">exclusion</option>
        </select>
        <input
          placeholder="Rule text (e.g. ECOG performance status 0-1)"
          value={form.text}
          onChange={e => setForm({ ...form, text: e.target.value })}
          style={{ padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6 }}
        />
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {editingId ? 'Update' : 'Add'}
          </button>
          {editingId && (
            <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
          )}
        </div>
      </div>

      {error && <div className="ai-error" style={{ marginBottom: 8 }}>{error}</div>}

      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
              <th style={{ padding: '6px 8px' }}>ID</th>
              <th style={{ padding: '6px 8px' }}>Trial</th>
              <th style={{ padding: '6px 8px' }}>Kind</th>
              <th style={{ padding: '6px 8px' }}>Text</th>
              <th style={{ padding: '6px 8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(r => (
              <tr
                key={r.id}
                style={{ borderTop: '1px solid #e5e7eb', cursor: 'pointer' }}
                onClick={() => setDetail({ title: `Design rule — ${r.trial}`, data: r })}
              >
                <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{r.id}</td>
                <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{r.trial}</td>
                <td style={{ padding: '6px 8px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 10, fontSize: 11,
                    background: r.kind === 'inclusion' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    color: r.kind === 'inclusion' ? '#047857' : '#b91c1c',
                  }}>{r.kind}</span>
                </td>
                <td style={{ padding: '6px 8px' }}>{r.text}</td>
                <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
                  <button className="btn btn-secondary" style={{ marginRight: 4, padding: '2px 8px', fontSize: 11 }} onClick={(e) => { e.stopPropagation(); startEdit(r); }}>Edit</button>
                  <button className="btn btn-danger" style={{ padding: '2px 8px', fontSize: 11 }} onClick={(e) => { e.stopPropagation(); remove(r.id); }}>Del</button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>
                No rules yet. Add one above.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      {detail && (
        <DetailModal
          title={detail.title}
          data={detail.data}
          onClose={() => setDetail(null)}
          onEdit={(row) => {
            startEdit(row);
            setDetail(null);
          }}
          onDelete={async (row) => {
            await remove(row.id);
            setDetail(null);
          }}
        />
      )}
    </div>
  );
}

export default DesignRulesEditor;

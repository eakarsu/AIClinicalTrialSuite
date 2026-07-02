import React, { useEffect, useState } from 'react';
import {
  listWebhooks, createWebhook, updateWebhook, deleteWebhook,
  listWebhookDeliveries, fireWebhookTest,
} from '../services/api';

const EVENTS = ['deviation.created', 'ae.serious', 'amendment.approved'];

export default function WebhooksPage() {
  const [hooks, setHooks] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [form, setForm] = useState({ name: '', url: '', event: EVENTS[0], secret: 'whsec_demo_2026', active: true });
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  async function load() {
    try {
      setHooks(await listWebhooks());
      setDeliveries(await listWebhookDeliveries());
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  const onCreate = async () => {
    setError(null); setInfo(null);
    try { await createWebhook(form); setInfo('Webhook created.'); load(); }
    catch (e) { setError(e.message); }
  };
  const onToggle = async (h) => {
    try { await updateWebhook(h.id, { ...h, active: !h.active }); load(); }
    catch (e) { setError(e.message); }
  };
  const onDelete = async (id) => {
    if (!window.confirm('Delete webhook?')) return;
    try { await deleteWebhook(id); load(); } catch (e) { setError(e.message); }
  };
  const onFire = async (event) => {
    setError(null); setInfo(null);
    try {
      await fireWebhookTest(event, { test: true, ts: Date.now() });
      setInfo(`Fired test event: ${event}`);
      load();
    } catch (e) { setError(e.message); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Webhooks</h2><p>Subscribe external systems to deviation/SAE/amendment events with HMAC-signed delivery.</p></div>
      </div>

      {error && <div className="ai-error">{error}</div>}
      {info && <div className="card" style={{ background:'#0f172a', color:'#a7f3d0', marginBottom:12 }}>{info}</div>}

      <div className="card">
        <h3>Subscriptions</h3>
        <div className="form-grid">
          <div className="form-group"><label>Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-group full"><label>URL</label><input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="http://localhost:3051/api/webhooks/test-receiver" /></div>
          <div className="form-group"><label>Event</label>
            <select value={form.event} onChange={e => setForm({ ...form, event: e.target.value })}>
              {EVENTS.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Secret</label><input value={form.secret} onChange={e => setForm({ ...form, secret: e.target.value })} /></div>
        </div>
        <div style={{ marginTop:12, display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-primary" onClick={onCreate}>+ Add Webhook</button>
        </div>

        <div className="data-table-container" style={{ marginTop:16 }}>
          <table className="data-table">
            <thead><tr><th>Name</th><th>URL</th><th>Event</th><th>Active</th><th>Actions</th></tr></thead>
            <tbody>
              {hooks.map(h => (
                <tr key={h.id}>
                  <td>{h.name}</td>
                  <td>{h.url}</td>
                  <td>{h.event}</td>
                  <td><span className={`status-badge status-${h.active ? 'active' : 'inactive'}`}>{h.active ? 'yes' : 'no'}</span></td>
                  <td>
                    <button className="btn btn-secondary" onClick={() => onToggle(h)}>{h.active ? 'Disable' : 'Enable'}</button>{' '}
                    <button className="btn btn-danger" onClick={() => onDelete(h.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {hooks.length === 0 && <tr><td colSpan="5" style={{ textAlign:'center', color:'#64748b', padding:20 }}>No webhooks.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop:16 }}>
        <h3>Fire test event</h3>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {EVENTS.map(e => <button key={e} className="btn btn-secondary" onClick={() => onFire(e)}>Fire {e}</button>)}
        </div>
      </div>

      <div className="card" style={{ marginTop:16 }}>
        <h3>Recent deliveries</h3>
        <div className="data-table-container">
          <table className="data-table">
            <thead><tr><th>Time</th><th>Event</th><th>Webhook</th><th>Status</th><th>Signature</th><th>Body</th></tr></thead>
            <tbody>
              {deliveries.map(d => (
                <tr key={d.id}>
                  <td>{new Date(d.delivered_at).toLocaleString()}</td>
                  <td>{d.event}</td>
                  <td>{d.webhook_name || `#${d.webhook_id}`}</td>
                  <td><span className={`status-badge status-${d.success ? 'active' : 'halted'}`}>{d.response_status || 'err'}</span></td>
                  <td style={{ fontSize:11, fontFamily:'monospace' }}>{d.signature ? d.signature.slice(0, 16) + '...' : '-'}</td>
                  <td style={{ fontSize:11, fontFamily:'monospace' }}>{(d.response_body || '').slice(0, 60)}</td>
                </tr>
              ))}
              {deliveries.length === 0 && <tr><td colSpan="6" style={{ textAlign:'center', color:'#64748b', padding:20 }}>No deliveries yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

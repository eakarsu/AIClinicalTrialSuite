import React, { useMemo, useState } from 'react';
import DetailModal from '../components/DetailModal';

const initialItems = [
  { id: 1, owner: 'Ops', priority: 'High', status: 'Ready', task: 'Review exception queue' },
  { id: 2, owner: 'AI', priority: 'Medium', status: 'In progress', task: 'Draft recommended next actions' },
  { id: 3, owner: 'Compliance', priority: 'Low', status: 'Queued', task: 'Attach audit evidence' },
];

export default function CodexOperationsFeature() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState(initialItems);
  const [detail, setDetail] = useState(null);
  const [task, setTask] = useState('');
  const [editingId, setEditingId] = useState(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => Object.values(item).join(' ').toLowerCase().includes(normalized));
  }, [items, query]);

  function addTask(event) {
    event.preventDefault();
    if (!task.trim()) return;
    if (editingId) {
      setItems((current) => current.map((item) => (
        item.id === editingId ? { ...item, task: task.trim(), status: 'Updated' } : item
      )));
      setEditingId(null);
      setTask('');
      return;
    }
    setItems((current) => [
      { id: Date.now(), owner: 'User', priority: 'Medium', status: 'Queued', task: task.trim() },
      ...current,
    ]);
    setTask('');
  }

  function deleteTask(row) {
    setItems((current) => current.filter((item) => item.id !== row.id));
    setDetail(null);
  }

  function editTask(row) {
    setEditingId(row.id);
    setTask(row.task);
    setDetail(null);
  }

  return (
    <section style={{ padding: 24, color: '#172033' }}>
      <p style={{ margin: 0, color: '#64748b', fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>Non-visual workflow</p>
      <h1 style={{ margin: '6px 0 18px', fontSize: 30 }}>AI Clinical Trial Suite Operations Desk</h1>

      <form onSubmit={addTask} style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) auto', gap: 10, marginBottom: 16 }}>
        <input value={task} onChange={(event) => setTask(event.target.value)} placeholder="Add an operational follow-up" style={{ padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: 8 }} />
        <button type="submit" style={{ padding: '12px 16px', border: 0, borderRadius: 8, background: '#172033', color: '#ffffff', fontWeight: 700 }}>{editingId ? 'Update task' : 'Add task'}</button>
      </form>
      {editingId && (
        <button
          type="button"
          onClick={() => { setEditingId(null); setTask(''); }}
          style={{ marginBottom: 12, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, background: '#ffffff', color: '#172033', fontWeight: 700 }}
        >
          Cancel edit
        </button>
      )}

      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search owner, priority, status, or task" style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: 8, marginBottom: 16 }} />

      <div style={{ border: '1px solid #d7dde8', borderRadius: 8, overflow: 'hidden', background: '#ffffff' }}>
        {filtered.map((item) => (
          <div
            key={item.id}
            style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px', gap: 12, padding: 14, borderBottom: '1px solid #e2e8f0', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setDetail({ title: `Workflow item — ${item.task}`, data: item })}
          >
            <strong>{item.task}</strong>
            <span>{item.owner}</span>
            <span>{item.priority}</span>
            <span>{item.status}</span>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: 18, color: '#64748b' }}>No matching workflow items.</div>}
      </div>
      {detail && (
        <DetailModal
          title={detail.title}
          data={detail.data}
          onClose={() => setDetail(null)}
          onEdit={editTask}
          onDelete={deleteTask}
        />
      )}
    </section>
  );
}

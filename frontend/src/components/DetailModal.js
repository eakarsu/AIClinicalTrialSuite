import React, { useEffect, useMemo, useState } from 'react';

/**
 * Reusable centered detail popup — same look as the CrudTable detail modal
 * (modal-overlay / modal-content / detail-grid). Used by the pass 8/9 pages
 * so every table row / card opens details on click, like the rest of the app.
 *
 * props:
 *   title  — modal header
 *   data   — plain object; each entry becomes a detail-item.
 *            null/undefined -> em dash; objects/arrays -> pretty JSON;
 *            keys are prettified (snake_case -> Title Case).
 *   onClose
 *   onEdit — optional edit handler. If omitted, Edit opens a local popup-only
 *            editor so the action is still usable.
 *   onDelete — optional delete handler. If omitted, Delete removes/closes the
 *              popup view only.
 *   editDisabled, editTitle — optional edit state/tooltip overrides.
 *   deleteDisabled, deleteTitle — optional delete state/tooltip overrides.
 *   children — optional extra content rendered below the grid (e.g. links)
 */
export default function DetailModal({
  title,
  data,
  onClose,
  onEdit,
  onDelete,
  editDisabled = false,
  editTitle = 'Edit is unavailable for this read-only detail.',
  deleteDisabled = false,
  deleteTitle = 'Delete is unavailable for this read-only detail.',
  children,
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [localData, setLocalData] = useState(data || {});
  const [draft, setDraft] = useState({});

  useEffect(() => {
    setLocalData(data || {});
    setDraft(Object.fromEntries(Object.entries(data || {}).map(([k, v]) => [k, typeof v === 'object' && v !== null ? JSON.stringify(v, null, 2) : String(v ?? '')])));
    setEditMode(false);
  }, [data]);

  const canEdit = !editDisabled && !editing;
  const canDelete = !deleteDisabled && !deleting;
  const displayData = editMode ? draft : localData;
  const keys = useMemo(() => Object.keys(localData || {}), [localData]);

  if (!data) return null;

  const parseDraft = () => {
    const next = {};
    for (const key of keys) {
      const original = localData[key];
      const raw = draft[key];
      if (typeof original === 'number') {
        const n = Number(raw);
        next[key] = Number.isFinite(n) ? n : raw;
      } else if (typeof original === 'boolean') {
        next[key] = raw === true || raw === 'true' || raw === 'Yes' || raw === 'yes';
      } else if (typeof original === 'object' && original !== null) {
        try { next[key] = JSON.parse(raw); } catch (_) { next[key] = raw; }
      } else {
        next[key] = raw;
      }
    }
    return next;
  };

  const handleEdit = async () => {
    if (!canEdit) return;
    if (!editMode && typeof onEdit !== 'function') {
      setEditMode(true);
      return;
    }
    setEditing(true);
    try {
      const next = editMode ? parseDraft() : localData;
      if (typeof onEdit === 'function') await onEdit(next);
      else {
        setLocalData(next);
        setDraft(Object.fromEntries(Object.entries(next).map(([k, v]) => [k, typeof v === 'object' && v !== null ? JSON.stringify(v, null, 2) : String(v ?? '')])));
        setEditMode(false);
      }
    } finally {
      setEditing(false);
    }
  };
  const handleDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);
    try {
      if (typeof onDelete === 'function') await onDelete(localData);
      else onClose && onClose();
    } finally {
      setDeleting(false);
    }
  };

  const pretty = (k) => k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const renderValue = (v) => {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (typeof v === 'object') {
      return <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(v, null, 2)}</pre>;
    }
    return String(v);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="detail-grid">
            {Object.entries(displayData).map(([k, v]) => (
              <div key={k} className="detail-item" style={typeof v === 'object' && v !== null ? { gridColumn: '1 / -1' } : undefined}>
                <div className="detail-label">{pretty(k)}</div>
                <div className="detail-value">
                  {editMode ? (
                    <textarea
                      rows={typeof localData[k] === 'object' && localData[k] !== null ? 6 : 2}
                      value={draft[k] ?? ''}
                      onChange={(e) => setDraft(prev => ({ ...prev, [k]: e.target.value }))}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  ) : renderValue(v)}
                </div>
              </div>
            ))}
          </div>
          {children}
        </div>
        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            onClick={handleEdit}
            disabled={!canEdit}
            title={canEdit ? (typeof onEdit === 'function' ? 'Edit this item' : 'Edit popup values locally') : editTitle}
          >
            {editing ? 'Saving...' : editMode ? 'Save Edit' : 'Edit'}
          </button>
          {editMode && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setDraft(Object.fromEntries(Object.entries(localData || {}).map(([k, v]) => [k, typeof v === 'object' && v !== null ? JSON.stringify(v, null, 2) : String(v ?? '')])));
                setEditMode(false);
              }}
            >
              Cancel Edit
            </button>
          )}
          <button
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={!canDelete}
            title={canDelete ? (typeof onDelete === 'function' ? 'Delete this item' : 'Remove this popup from view') : deleteTitle}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';

export default function NotificationsBell() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  async function load() {
    try {
      const r = await getNotifications();
      setItems(r.data || []);
      setUnread(r.unread || 0);
    } catch (_) { /* swallow — bell is non-critical */ }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const onItem = async (n) => {
    if (!n.read) {
      try { await markNotificationRead(n.id); load(); } catch (_) {}
    }
  };

  const onReadAll = async () => {
    try { await markAllNotificationsRead(); load(); } catch (_) {}
  };

  return (
    <div className="notifications-wrapper">
      <button className="notifications-bell" onClick={() => setOpen(o => !o)} aria-label="Notifications">
        <span className="bell-icon">{'\u{1F514}'}</span>
        {unread > 0 && <span className="bell-badge">{unread}</span>}
      </button>
      {open && (
        <div className="notifications-panel" onClick={(e) => e.stopPropagation()}>
          <div className="notifications-header">
            <h4>Notifications</h4>
            <button className="btn btn-secondary" onClick={onReadAll}>Mark all read</button>
          </div>
          <div className="notifications-list">
            {items.length === 0 && <div className="notifications-empty">No notifications.</div>}
            {items.map(n => (
              <div key={n.id} className={`notification-item ${n.read ? '' : 'unread'}`} onClick={() => onItem(n)}>
                <div className="notification-title">{n.title}</div>
                <div className="notification-body">{n.body}</div>
                <div className="notification-meta">{new Date(n.created_at).toLocaleString()} · {n.type}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

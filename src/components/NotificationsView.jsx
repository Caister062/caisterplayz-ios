import React from 'react';
import { Bell, Heart, MessageCircle, UserPlus, Trash2, CheckCircle2, Sparkles, MessageSquare } from 'lucide-react';
import { notificationService } from '../lib/notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const NotificationsView = ({ notifications = [], onSelectNotification }) => {
  const triggerHaptic = async (style = ImpactStyle.Light) => {
    try {
      await Haptics.impact({ style });
    } catch (e) {}
  };

  const handleClearAll = async () => {
    triggerHaptic(ImpactStyle.Medium);
    if (confirm('Clear all notifications?')) {
      await notificationService.clearAll();
    }
  };

  const handleNotificationClick = async (notif) => {
    triggerHaptic();
    await notificationService.markAsRead(notif.id);
    if (onSelectNotification) {
      onSelectNotification(notif);
    }
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart size={16} color="#ff3b30" fill="#ff3b30" />;
      case 'comment':
        return <MessageCircle size={16} color="#00d2ff" fill="#00d2ff" />;
      case 'follow':
        return <UserPlus size={16} color="#10b981" />;
      default:
        return <Sparkles size={16} color="#ffd60a" />;
    }
  };

  const renderText = (n) => {
    switch (n.type) {
      case 'like':
        return 'liked your gaming post.';
      case 'comment':
        return n.message ? `commented: "${n.message}"` : 'commented on your post.';
      case 'follow':
        return 'started following your gaming profile.';
      default:
        return n.message || 'interacted with your content.';
    }
  };

  return (
    <main className="main-content animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={20} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: '900' }}>Live Alerts & Activity</h2>
          {notifications.length > 0 && (
            <span style={{ fontSize: '0.75rem', fontWeight: '800', background: 'var(--accent-cyan)', color: '#000', padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
              {notifications.length}
            </span>
          )}
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleClearAll}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', gap: '0.3rem' }}
          >
            <Trash2 size={14} /> Clear All
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
          <Bell size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3, color: 'var(--accent-cyan)' }} />
          <h3 style={{ fontSize: '1rem', color: '#fff', fontWeight: '800', marginBottom: '0.25rem' }}>No Alerts Yet</h3>
          <p style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
            When players like your posts, comment on your clips, or follow you, real-time alerts will appear here instantly.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                gap: '0.75rem',
                background: n.read ? 'var(--bg-card)' : 'rgba(28, 28, 60, 0.85)',
                border: n.read ? 'var(--border-subtle)' : '1px solid rgba(0, 210, 255, 0.35)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img
                    src={n.actor_avatar || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${n.actor_id}`}
                    alt=""
                    className="avatar sm"
                    style={{ width: '38px', height: '38px', borderRadius: '50%' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      background: 'var(--bg-main)',
                      borderRadius: '50%',
                      padding: '2px',
                      display: 'flex',
                    }}
                  >
                    {renderIcon(n.type)}
                  </span>
                </div>

                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '0.85rem', color: '#fff', lineHeight: '1.3', wordBreak: 'break-word' }}>
                    <strong style={{ color: 'var(--accent-cyan)' }}>{n.actor_name || 'A player'}</strong>{' '}
                    {renderText(n)}
                  </p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {new Date(n.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                    {new Date(n.created).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {!n.read && (
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--accent-cyan)',
                    boxShadow: '0 0 8px var(--accent-cyan)',
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

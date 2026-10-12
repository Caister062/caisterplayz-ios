import { supabase, isSupabaseConfigured } from './supabase';
import { getDatabase } from './pocketbase';

/**
 * Real-Time Notifications Service
 * Listens to live socket channels across devices/tabs, broadcasts notifications
 * in real-time without mock/simulated data, and stores/fetches persistent notifications.
 */
class NotificationService {
  constructor() {
    this.channel = null;
    this.userId = null;
    this.listeners = new Set();
    this.notifications = [];
    this.bc = null;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.notifications);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach((cb) => cb([...this.notifications]));
  }

  async init(userId) {
    if (!userId) return;
    this.userId = userId;

    // 1. Fetch initial real notifications from persistent DB
    try {
      const db = await getDatabase();
      const stored = await db.getAllFromIndex('notifications', 'recipient', userId);
      if (stored && stored.length > 0) {
        this.notifications = stored.sort((a, b) => new Date(b.created) - new Date(a.created));
      } else {
        this.notifications = [];
      }
      this.notify();
    } catch (err) {
      console.warn('Error fetching real notifications:', err);
      this.notifications = [];
      this.notify();
    }

    // 2. Set up cross-tab / cross-webview BroadcastChannel for real local peer sync
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      if (this.bc) this.bc.close();
      this.bc = new BroadcastChannel(`caister_notifications_${userId}`);
      this.bc.onmessage = (event) => {
        if (event.data?.type === 'new_notification') {
          this.addIncomingNotification(event.data.payload);
        } else if (event.data?.type === 'clear_notifications') {
          this.notifications = [];
          this.notify();
        }
      };
    }

    // 3. Set up Supabase Realtime Broadcast & DB listen if configured
    if (isSupabaseConfigured() && supabase) {
      if (this.channel) {
        supabase.removeChannel(this.channel);
      }

      this.channel = supabase.channel(`notifications:${userId}`, {
        config: { broadcast: { self: false } },
      });

      this.channel
        .on('broadcast', { event: 'new_notification' }, ({ payload }) => {
          this.addIncomingNotification(payload);
        })
        .subscribe();
    }
  }

  addIncomingNotification(notif) {
    if (!notif || !notif.id) return;
    // Prevent duplicate entries
    if (this.notifications.some((n) => n.id === notif.id)) return;

    this.notifications = [notif, ...this.notifications];
    this.notify();
  }

  async sendNotification(notifData) {
    const { recipient, type, actor_id, actor_name, actor_avatar, post_id, message } = notifData;
    if (!recipient || recipient === actor_id) return; // Do not notify yourself

    const notifObj = {
      id: `notif_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipient,
      type, // 'like' | 'comment' | 'follow' | 'mention' | 'hangout'
      actor_id,
      actor_name: actor_name || 'A player',
      actor_avatar: actor_avatar || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${actor_id}`,
      post_id: post_id || null,
      message: message || '',
      read: false,
      created: new Date().toISOString(),
    };

    // Save to persistent database
    try {
      const db = await getDatabase();
      await db.put('notifications', notifObj);
    } catch (e) {
      console.warn('Failed to save notification:', e);
    }

    // Broadcast to peer sockets / tabs
    if (this.channel && isSupabaseConfigured()) {
      try {
        await this.channel.send({
          type: 'broadcast',
          event: 'new_notification',
          payload: notifObj,
        });
      } catch (e) {}
    }

    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      const targetBc = new BroadcastChannel(`caister_notifications_${recipient}`);
      targetBc.postMessage({ type: 'new_notification', payload: notifObj });
      setTimeout(() => targetBc.close(), 1000);
    }
  }

  async markAsRead(notificationId) {
    this.notifications = this.notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.notify();

    try {
      const db = await getDatabase();
      const existing = await db.get('notifications', notificationId);
      if (existing) {
        existing.read = true;
        await db.put('notifications', existing);
      }
    } catch (e) {}
  }

  async clearAll() {
    if (!this.userId) return;
    this.notifications = [];
    this.notify();

    try {
      const db = await getDatabase();
      const all = await db.getAllFromIndex('notifications', 'recipient', this.userId);
      for (const item of all) {
        await db.delete('notifications', item.id);
      }
    } catch (e) {}

    if (this.bc) {
      this.bc.postMessage({ type: 'clear_notifications' });
    }
  }

  cleanup() {
    if (this.channel && supabase) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    if (this.bc) {
      this.bc.close();
      this.bc = null;
    }
    this.userId = null;
  }
}

export const notificationService = new NotificationService();

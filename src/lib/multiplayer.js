import { supabase, isSupabaseConfigured } from './supabase';
import { getDatabase } from './pocketbase';

/**
 * Real-Time Multiplayer Room & Lobby Manager
 * Supports true multi-client peer synchronization, matchmaking, live chat,
 * audio party rooms, live reaction barrages, and competitive minigames (Reflex Duel, Tap Showdown).
 */

class MultiplayerManager {
  constructor() {
    this.channel = null;
    this.currentRoomId = null;
    this.subscribers = new Set();
    this.localUser = null;
    this.roomState = {
      id: null,
      title: 'Community Lounge',
      description: 'Hangout, chat, post about anything, and be nice!',
      host: null,
      players: [],
      messages: [],
      gameState: null,
      reactions: [],
      voiceParticipants: [],
    };
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.roomState);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    this.subscribers.forEach((cb) => cb({ ...this.roomState }));
  }

  async joinRoom(roomId, user, roomMeta = {}) {
    this.currentRoomId = roomId;
    this.localUser = user;

    // Reset room state
    this.roomState = {
      ...this.roomState,
      id: roomId,
      title: roomMeta.title || this.roomState.title,
      description: roomMeta.description || this.roomState.description,
      host: roomMeta.host || user,
      players: [{ ...user, online: true, joinedAt: Date.now(), score: 0 }],
      messages: [],
      gameState: null,
      reactions: [],
    };
    this.notify();

    // Check if Supabase Realtime is configured for true WebSocket multi-client sync
    if (isSupabaseConfigured() && supabase) {
      if (this.channel) {
        supabase.removeChannel(this.channel);
      }

      this.channel = supabase.channel(`room:${roomId}`, {
        config: {
          presence: {
            key: user.id,
          },
          broadcast: {
            self: true,
          },
        },
      });

      // 1. Presence Sync (Real online players)
      this.channel
        .on('presence', { event: 'sync' }, () => {
          const state = this.channel.presenceState();
          const presentUsers = [];
          Object.values(state).forEach((presences) => {
            presences.forEach((p) => {
              if (p.user) presentUsers.push(p.user);
            });
          });
          if (presentUsers.length > 0) {
            this.roomState.players = presentUsers;
            this.notify();
          }
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          // Player joined
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          // Player left
        });

      // 2. Broadcast Events (Chat, Reactions, Game Moves)
      this.channel
        .on('broadcast', { event: 'chat' }, ({ payload }) => {
          this.roomState.messages = [...this.roomState.messages.slice(-100), payload];
          this.notify();
        })
        .on('broadcast', { event: 'reaction' }, ({ payload }) => {
          this.roomState.reactions = [...this.roomState.reactions.slice(-30), payload];
          this.notify();
        })
        .on('broadcast', { event: 'game_update' }, ({ payload }) => {
          this.roomState.gameState = payload;
          this.notify();
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await this.channel.track({
              user: {
                id: user.id,
                name: user.name || user.username || 'Gamer',
                username: user.username || 'gamer',
                avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${user.id}`,
                score: 0,
              },
            });
          }
        });
    } else {
      // Local Database & BroadcastChannel fallback (syncs across open browser tabs / webviews)
      this.setupBroadcastChannel(roomId, user);
    }

    // Load persisted chat history for this room from local DB
    try {
      const db = await getDatabase();
      const stored = await db.getAllFromIndex('messages', 'conversation_id', `room_${roomId}`);
      if (stored && stored.length > 0) {
        this.roomState.messages = stored.sort((a, b) => new Date(a.created) - new Date(b.created));
        this.notify();
      }
    } catch (e) {
      console.warn('Could not load room chat history:', e);
    }

    return this.roomState;
  }

  setupBroadcastChannel(roomId, user) {
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      if (this.bc) this.bc.close();
      this.bc = new BroadcastChannel(`caister_room_${roomId}`);
      this.bc.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'chat') {
          this.roomState.messages = [...this.roomState.messages.slice(-100), payload];
          this.notify();
        } else if (type === 'reaction') {
          this.roomState.reactions = [...this.roomState.reactions.slice(-30), payload];
          this.notify();
        } else if (type === 'game_update') {
          this.roomState.gameState = payload;
          this.notify();
        } else if (type === 'presence_ping') {
          // Reply with local presence
          if (this.bc && this.localUser) {
            this.bc.postMessage({ type: 'presence_pong', payload: this.localUser });
          }
        } else if (type === 'presence_pong') {
          if (!this.roomState.players.some((p) => p.id === payload.id)) {
            this.roomState.players = [...this.roomState.players, payload];
            this.notify();
          }
        }
      };
      // Send ping to discover peers
      this.bc.postMessage({ type: 'presence_ping', payload: user });
    }
  }

  async sendChatMessage(text) {
    if (!text.trim() || !this.localUser) return;

    const messageObj = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      room_id: this.currentRoomId,
      conversation_id: `room_${this.currentRoomId}`,
      sender_id: this.localUser.id,
      sender_name: this.localUser.name || this.localUser.username || 'Gamer',
      sender_avatar: this.localUser.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${this.localUser.id}`,
      text: text.trim(),
      created: new Date().toISOString(),
    };

    // Save locally
    try {
      const db = await getDatabase();
      await db.put('messages', messageObj);
    } catch (e) {}

    // Broadcast
    if (this.channel) {
      await this.channel.send({
        type: 'broadcast',
        event: 'chat',
        payload: messageObj,
      });
    } else {
      this.roomState.messages = [...this.roomState.messages, messageObj];
      this.notify();
      if (this.bc) {
        this.bc.postMessage({ type: 'chat', payload: messageObj });
      }
    }
  }

  async sendReaction(emoji) {
    const reactionObj = {
      id: 'rx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      emoji,
      sender_id: this.localUser?.id,
      x: 20 + Math.random() * 60, // random percentage for floating animation
    };

    if (this.channel) {
      await this.channel.send({
        type: 'broadcast',
        event: 'reaction',
        payload: reactionObj,
      });
    } else {
      this.roomState.reactions = [...this.roomState.reactions, reactionObj];
      this.notify();
      if (this.bc) {
        this.bc.postMessage({ type: 'reaction', payload: reactionObj });
      }
    }
  }

  async updateGameState(gameState) {
    this.roomState.gameState = gameState;
    this.notify();

    if (this.channel) {
      await this.channel.send({
        type: 'broadcast',
        event: 'game_update',
        payload: gameState,
      });
    } else if (this.bc) {
      this.bc.postMessage({ type: 'game_update', payload: gameState });
    }
  }

  leaveRoom() {
    if (this.channel && supabase) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    if (this.bc) {
      this.bc.close();
      this.bc = null;
    }
    this.currentRoomId = null;
  }
}

export const multiplayerManager = new MultiplayerManager();

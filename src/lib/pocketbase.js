import { openDB } from 'idb';
import PocketBase from 'pocketbase';

const DB_NAME = 'CaisterPlayz_LocalDB';
const DB_VERSION = 1;

// Initialize IndexedDB with all relational stores
export const getDatabase = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'id' });
        userStore.createIndex('email', 'email', { unique: true });
        userStore.createIndex('username', 'username', { unique: true });
      }
      if (!db.objectStoreNames.contains('posts')) {
        const postStore = db.createObjectStore('posts', { keyPath: 'id' });
        postStore.createIndex('created', 'created');
        postStore.createIndex('user', 'user');
      }
      if (!db.objectStoreNames.contains('comments')) {
        const commStore = db.createObjectStore('comments', { keyPath: 'id' });
        commStore.createIndex('post', 'post');
      }
      if (!db.objectStoreNames.contains('likes')) {
        const likeStore = db.createObjectStore('likes', { keyPath: 'id' });
        likeStore.createIndex('post_user', ['post', 'user'], { unique: true });
      }
      if (!db.objectStoreNames.contains('follows')) {
        const followStore = db.createObjectStore('follows', { keyPath: 'id' });
        followStore.createIndex('follower_following', ['follower', 'following'], { unique: true });
      }
      if (!db.objectStoreNames.contains('blocks')) {
        const blockStore = db.createObjectStore('blocks', { keyPath: 'id' });
        blockStore.createIndex('blocker_blocked', ['blocker', 'blocked'], { unique: true });
      }
      if (!db.objectStoreNames.contains('messages')) {
        const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
        msgStore.createIndex('conversation_id', 'conversation_id');
      }
      if (!db.objectStoreNames.contains('conversations')) {
        db.createObjectStore('conversations', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('reports')) {
        db.createObjectStore('reports', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('notifications')) {
        const notifStore = db.createObjectStore('notifications', { keyPath: 'id' });
        notifStore.createIndex('recipient', 'recipient');
      }
      if (!db.objectStoreNames.contains('user_achievements')) {
        db.createObjectStore('user_achievements', { keyPath: 'id' });
      }
    },
  });
};

export const getStoredPocketBaseUrl = () => {
  return localStorage.getItem('caisterplayz_pb_url') || import.meta.env.VITE_POCKETBASE_URL || '';
};

export const setStoredPocketBaseUrl = (url) => {
  if (url) localStorage.setItem('caisterplayz_pb_url', url.trim());
};

const customUrl = getStoredPocketBaseUrl();
export let pb = customUrl ? new PocketBase(customUrl) : null;
if (pb) pb.autoCancellation(false);

export const reinitializePocketBase = (url) => {
  if (!url || !url.trim()) {
    pb = null;
    localStorage.removeItem('caisterplayz_pb_url');
    return null;
  }
  setStoredPocketBaseUrl(url);
  pb = new PocketBase(url.trim());
  pb.autoCancellation(false);
  return pb;
};

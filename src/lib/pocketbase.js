import PocketBase from 'pocketbase';

export const getStoredPocketBaseUrl = () => {
  return localStorage.getItem('caisterplayz_pb_url') || import.meta.env.VITE_POCKETBASE_URL || 'https://caisterplayz.pockethost.io';
};

export const setStoredPocketBaseUrl = (url) => {
  if (url) localStorage.setItem('caisterplayz_pb_url', url.trim());
};

const initialUrl = getStoredPocketBaseUrl();

export let pb = new PocketBase(initialUrl);

// Automatically enable persistence via local storage
pb.autoCancellation(false);

export const reinitializePocketBase = (url) => {
  setStoredPocketBaseUrl(url);
  pb = new PocketBase(url.trim());
  pb.autoCancellation(false);
  return pb;
};

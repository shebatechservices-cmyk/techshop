import { Capacitor } from '@capacitor/core';

export const CLOUD_SERVER_URL = 'https://sdb.shebatechnologybd.com/api';
export const LOCAL_LAN_SERVER_URL = 'http://192.168.1.23:3000/api';

export const isNativeApp = () => {
  if (typeof window === 'undefined') return false;
  try {
    if (Capacitor && typeof Capacitor.isNativePlatform === 'function' && Capacitor.isNativePlatform()) {
      return true;
    }
  } catch {
    // ignore
  }
  if (Boolean(window.androidBridge) || Boolean(window.Capacitor)) {
    return true;
  }
  if (window.location) {
    if (window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:') {
      return true;
    }
    if (window.location.hostname === 'localhost' && !window.location.port) {
      return true;
    }
  }
  return false;
};

export const getApiBase = () => {
  let base = '';

  if (typeof window !== 'undefined' && window.localStorage) {
    const savedServer = window.localStorage.getItem('sheba_pos_server_url');
    if (savedServer) {
      base = String(savedServer).trim();
    }
  }

  if (!base && import.meta.env && import.meta.env.VITE_API_URL) {
    base = String(import.meta.env.VITE_API_URL).trim();
  }

  if (!base && isNativeApp()) {
    return CLOUD_SERVER_URL;
  }

  if (!base && typeof window !== 'undefined' && window.location) {
    const { protocol, hostname, port } = window.location;
    if (['5173', '5174', '5175', '5176'].includes(port) || (port && port !== '3000' && (hostname === 'localhost' || hostname === '127.0.0.1'))) {
      return `${protocol}//${hostname}:3000/api`;
    }
    return '/api';
  } else if (!base) {
    base = '/api';
  }

  base = base.replace(/\/+$/, '');
  if (!base.endsWith('/api')) {
    base = `${base}/api`;
  }
  return base;
};

export const API_BASE = getApiBase();

export const getCurrentServerUrl = () => API_BASE;

export const setCustomServerUrl = (url) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (!url) {
      window.localStorage.removeItem('sheba_pos_server_url');
    } else {
      let clean = String(url).trim().replace(/\/+$/, '');
      if (!clean.endsWith('/api')) clean = `${clean}/api`;
      window.localStorage.setItem('sheba_pos_server_url', clean);
    }
    window.location.reload();
  }
};

export default API_BASE;

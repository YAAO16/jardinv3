/**
 * offlineDB.js — Utilidades IndexedDB para JBV3/JARBOTA
 * Uso:
 *   import { guardarArbolOffline, obtenerArbolesOffline, limpiarOffline } from '../utils/offlineDB';
 */

const DB_NAME = 'jarbota-offline';
const STORE_ARBOLES = 'arboles-pendientes';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_ARBOLES)) {
        db.createObjectStore(STORE_ARBOLES, { keyPath: 'uuid' });
      }
      if (!db.objectStoreNames.contains('sync-queue')) {
        db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
}

export async function guardarArbolOffline(arbol) {
  const db = await openDB();
  const registro = { ...arbol, uuid: arbol.uuid || uuid(), ts: Date.now() };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ARBOLES, 'readwrite');
    tx.objectStore(STORE_ARBOLES).put(registro);
    tx.oncomplete = () => resolve(registro);
    tx.onerror = () => reject(tx.error);
  });
}

export async function obtenerArbolesOffline() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ARBOLES, 'readonly');
    const req = tx.objectStore(STORE_ARBOLES).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function eliminarArbolOffline(uuid) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ARBOLES, 'readwrite');
    tx.objectStore(STORE_ARBOLES).delete(uuid);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function limpiarOffline() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ARBOLES, 'readwrite');
    tx.objectStore(STORE_ARBOLES).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
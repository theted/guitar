// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Node 22+ defines its own global `localStorage`, which is a bare object unless
// Node is started with --localstorage-file, and it shadows jsdom's. The store
// persists through it, so give tests a working in-memory Storage when that happens.
if (typeof globalThis.localStorage?.setItem !== 'function') {
  const data = new Map<string, string>();
  const storage: Storage = {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => Array.from(data.keys())[index] ?? null,
    removeItem: (key) => { data.delete(key); },
    setItem: (key, value) => { data.set(key, String(value)); },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
}

// Test environment setup
const storageMock = {};
globalThis.localStorage = {
  getItem: (key) => storageMock[key] || null,
  setItem: (key, value) => { storageMock[key] = String(value); },
  removeItem: (key) => { delete storageMock[key]; },
  clear: () => { Object.keys(storageMock).forEach(k => delete storageMock[k]); }
};

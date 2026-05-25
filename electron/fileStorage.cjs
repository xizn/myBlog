const fs = require('node:fs');
const path = require('node:path');

/** @param {string} userDataRoot app.getPath('userData') */
function createFileStorage(userDataRoot) {
  const dataDir = path.join(userDataRoot, 'data');

  function ensureDir() {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  /** 存储键 -> 文件名（仅保留安全字符） */
  function keyToFileName(key) {
    const safe = String(key).replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${safe}.json`;
  }

  function keyToPath(key) {
    return path.join(dataDir, keyToFileName(key));
  }

  function getItem(key) {
    const filePath = keyToPath(key);
    if (!fs.existsSync(filePath)) return null;
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch {
      return null;
    }
  }

  function setItem(key, value) {
    ensureDir();
    const filePath = keyToPath(key);
    const tmpPath = `${filePath}.tmp`;
    fs.writeFileSync(tmpPath, value, 'utf8');
    fs.renameSync(tmpPath, filePath);
  }

  function removeItem(key) {
    const filePath = keyToPath(key);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  function listKeys() {
    if (!fs.existsSync(dataDir)) return [];
    return fs
      .readdirSync(dataDir)
      .filter((name) => name.endsWith('.json') && !name.endsWith('.tmp.json'))
      .map((name) => name.slice(0, -'.json'.length));
  }

  function loadAll() {
    const entries = {};
    for (const key of listKeys()) {
      const value = getItem(key);
      if (value !== null) entries[key] = value;
    }
    return entries;
  }

  return {
    getDataDir: () => dataDir,
    getItem,
    setItem,
    removeItem,
    listKeys,
    loadAll,
  };
}

module.exports = { createFileStorage };

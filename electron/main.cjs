const { app, BrowserWindow, ipcMain, shell } = require('electron');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { createFileStorage } = require('./fileStorage.cjs');

/** @type {ReturnType<createFileStorage> | null} */
let fileStorage = null;

function getFileStorage() {
  if (!fileStorage) {
    fileStorage = createFileStorage(app.getPath('userData'));
  }
  return fileStorage;
}

function registerStorageIpc() {
  ipcMain.on('storage:get-item', (event, key) => {
    try {
      event.returnValue = getFileStorage().getItem(key);
    } catch {
      event.returnValue = null;
    }
  });

  ipcMain.on('storage:set-item', (event, key, value) => {
    try {
      getFileStorage().setItem(key, value);
      event.returnValue = { ok: true };
    } catch (err) {
      event.returnValue = {
        ok: false,
        error: err instanceof Error ? err.message : '无法写入本地文件',
      };
    }
  });

  ipcMain.on('storage:remove-item', (event, key) => {
    try {
      getFileStorage().removeItem(key);
      event.returnValue = { ok: true };
    } catch (err) {
      event.returnValue = {
        ok: false,
        error: err instanceof Error ? err.message : '无法删除本地文件',
      };
    }
  });

  ipcMain.on('storage:list-keys', (event) => {
    try {
      event.returnValue = getFileStorage().listKeys();
    } catch {
      event.returnValue = [];
    }
  });

  ipcMain.on('storage:get-data-dir', (event) => {
    event.returnValue = getFileStorage().getDataDir();
  });
}

function registerShellIpc() {
  ipcMain.handle('shell:open-external', async (_event, url) => {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      return { ok: false, error: '无效的链接' };
    }
    await shell.openExternal(url);
    return { ok: true };
  });
}

function registerAiIpc() {
  ipcMain.handle('ai:fetch', async (_event, { url, method, headers, body }) => {
    try {
      const res = await fetch(url, {
        method: method || 'POST',
        headers: headers || {},
        body,
      });
      const text = await res.text();
      return { ok: res.ok, status: res.status, text };
    } catch (err) {
      return {
        ok: false,
        status: 0,
        text: '',
        error: err instanceof Error ? err.message : '请求失败',
      };
    }
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
};

/** 打包后 dist 与开发时路径 */
function getDistDir() {
  return path.join(__dirname, '..', 'dist');
}

/** 本地静态服务，支持 React Router 的 SPA 回退 */
function createStaticServer(root) {
  return http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url || '/', 'http://local').pathname);
    let filePath = path.join(root, urlPath === '/' ? 'index.html' : urlPath);

    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(root, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    fs.createReadStream(filePath)
      .on('error', () => {
        res.writeHead(500);
        res.end('Internal Server Error');
      })
      .pipe(res);
  });
}

/** 固定端口：localStorage 按 origin 隔离，随机端口会导致每次启动读不到上次数据 */
const STATIC_SERVER_HOST = '127.0.0.1';
const STATIC_SERVER_PORT = 1688;

let mainWindow = null;
let server = null;
let appUrl = `http://${STATIC_SERVER_HOST}:${STATIC_SERVER_PORT}`;

function startServer() {
  return new Promise((resolve, reject) => {
    const distDir = getDistDir();
    if (!fs.existsSync(path.join(distDir, 'index.html'))) {
      reject(new Error(`未找到构建产物，请先在项目根目录执行: npm run build\n路径: ${distDir}`));
      return;
    }

    const staticServer = createStaticServer(distDir);
    staticServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(
          new Error(
            `端口 ${STATIC_SERVER_PORT} 已被占用，请关闭占用该端口的程序后重试 Studio Blog。`
          )
        );
        return;
      }
      reject(err);
    });
    staticServer.listen(STATIC_SERVER_PORT, STATIC_SERVER_HOST, () => {
      server = staticServer;
      resolve(appUrl);
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    title: 'Studio — Agent & Learning',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  mainWindow.loadURL(appUrl);

  const appOrigin = new URL(appUrl).origin;
  const isAppUrl = (url) => {
    try {
      return new URL(url).origin === appOrigin;
    } catch {
      return false;
    }
  };

  const blockExternalNavigation = (event, url) => {
    if (isAppUrl(url)) return;
    event.preventDefault();
    if (/^https?:\/\//i.test(url)) {
      void shell.openExternal(url);
    }
  };

  mainWindow.webContents.on('will-navigate', blockExternalNavigation);
  mainWindow.webContents.on('will-redirect', blockExternalNavigation);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      registerStorageIpc();
      registerShellIpc();
      registerAiIpc();
      await startServer();
      createWindow();
    } catch (err) {
      console.error(err.message || err);
      app.quit();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('before-quit', () => {
    if (server) server.close();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && appUrl) createWindow();
  });
}

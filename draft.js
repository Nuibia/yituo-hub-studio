/* Md2GZH 草稿与排版历史：
 * - 草稿：编辑器内容 + 当前排版配置，输入防抖自动保存，刷新不丢
 * - 历史：最近一次复制/下载成功的排版记录（Markdown + 配置，不存 HTML，
 *   避免内联 base64 图片撑爆存储配额），上限 HISTORY_LIMIT 条
 * - 存储优先 IndexedDB；环境不支持时降级为内存（会话内有效）
 */
(function (global, factory) {
  var api = factory(typeof indexedDB !== 'undefined' ? indexedDB : null);
  global.Md2GZHDraft = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function (idb) {
  'use strict';

  var DB_NAME = 'yth-studio';
  var DB_VERSION = 1;
  var HISTORY_LIMIT = 20;
  var dbPromise = null;
  var memory = { draft: null, history: [] };
  var degraded = false;
  var idSeq = 0;

  /* 同毫秒内多次保存也要保证 id 唯一（历史删除按 id 精确匹配） */
  function nextId() {
    idSeq = (idSeq + 1) % 1000;
    return Date.now() * 1000 + idSeq;
  }

  function open() {
    if (!idb) return Promise.resolve(null);
    if (!dbPromise) {
      dbPromise = new Promise(function (resolve) {
        var request = idb.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = function () {
          var db = request.result;
          if (!db.objectStoreNames.contains('draft')) db.createObjectStore('draft');
          if (!db.objectStoreNames.contains('history')) db.createObjectStore('history', { keyPath: 'id' });
        };
        request.onsuccess = function () { resolve(request.result); };
        request.onerror = function () {
          if (!degraded) { degraded = true; console.warn('[yituo-studio] IndexedDB 不可用，草稿仅保存在内存中'); }
          resolve(null);
        };
      });
    }
    return dbPromise;
  }

  function withStore(name, mode, run) {
    return open().then(function (db) {
      if (!db) return run(memory[name], null);
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(name, mode);
        var store = tx.objectStore(name);
        var request = run(store, 'idb');
        tx.oncomplete = function () { resolve(request ? request.result : undefined); };
        tx.onerror = function () { reject(tx.error); };
        tx.onabort = function () { reject(tx.error || new Error('事务中止')); };
      });
    });
  }

  function saveDraft(payload) {
    var record = { ts: Date.now(), markdown: String(payload && payload.markdown || ''), config: payload && payload.config || {} };
    return withStore('draft', 'readwrite', function (store, backend) {
      if (backend === 'idb') return store.put(record, 'current');
      memory.draft = record;
    }).then(function () { return record; });
  }

  function loadDraft() {
    return withStore('draft', 'readonly', function (store, backend) {
      if (backend === 'idb') return store.get('current');
      return memory.draft;
    }).then(function (record) { return record || null; });
  }

  function saveHistory(entry) {
    var record = {
      id: nextId(),
      ts: Date.now(),
      markdown: String(entry && entry.markdown || ''),
      chars: entry && entry.chars || 0,
      config: entry && entry.config || {}
    };
    return withStore('history', 'readwrite', function (store, backend) {
      if (backend === 'idb') store.put(record);
      else memory.history.unshift(record);
    }).then(function () { return trimHistory(); }).then(function () { return record; });
  }

  function trimHistory() {
    return withStore('history', 'readonly', function (store, backend) {
      if (backend === 'idb') return store.getAllKeys();
      return memory.history.map(function (item) { return item.id; });
    }).then(function (keys) {
      var sorted = (keys || []).sort(function (a, b) { return b - a; });
      var stale = sorted.slice(HISTORY_LIMIT);
      if (!stale.length) return 0;
      return withStore('history', 'readwrite', function (store, backend) {
        stale.forEach(function (id) {
          if (backend === 'idb') store.delete(id);
          else memory.history = memory.history.filter(function (item) { return item.id !== id; });
        });
      }).then(function () { return stale.length; });
    });
  }

  function listHistory() {
    return withStore('history', 'readonly', function (store, backend) {
      if (backend === 'idb') return store.getAll();
      return memory.history.slice();
    }).then(function (items) {
      return (items || []).filter(function (item) { return item && item.markdown; })
        .sort(function (a, b) { return b.ts - a.ts; }).slice(0, HISTORY_LIMIT);
    });
  }

  function removeHistory(id) {
    return withStore('history', 'readwrite', function (store, backend) {
      if (backend === 'idb') store.delete(id);
      else memory.history = memory.history.filter(function (item) { return item.id !== id; });
    });
  }

  function clearHistory() {
    return withStore('history', 'readwrite', function (store, backend) {
      if (backend === 'idb') store.clear();
      else memory.history = [];
    });
  }

  return {
    HISTORY_LIMIT: HISTORY_LIMIT,
    saveDraft: saveDraft,
    loadDraft: loadDraft,
    saveHistory: saveHistory,
    listHistory: listHistory,
    removeHistory: removeHistory,
    clearHistory: clearHistory
  };
});

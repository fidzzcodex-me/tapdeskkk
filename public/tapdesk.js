/*
 * tapdesk.js — panel developer mengambang untuk halaman yang sedang diuji.
 * Vanilla JS, tanpa dependency, tanpa React. Dibuat supaya ringan saat
 * di-inject ke website siapa pun.
 *
 * Yang dilakukan:
 *  - Menangkap window.fetch dan XMLHttpRequest (request asli tetap jalan)
 *  - Menangkap console.log/warn/error/info
 *  - Menampilkan tombol bulat + panel bawah/kanan (mirip Eruda)
 *  - Opsional: mengirim salinan event ke dashboard (data-sync="true")
 *
 * Batas: hanya melihat fetch/XHR di halaman tempat script ini dipasang.
 * Tidak melihat semua trafik network perangkat.
 */
(function () {
  "use strict";

  if (window.__tapdesk) return; // cegah double-inject
  window.__tapdesk = true;

  var scriptEl = document.currentScript;
  var config = {
    sessionId: (scriptEl && scriptEl.getAttribute("data-session")) || "local",
    sync: scriptEl ? scriptEl.getAttribute("data-sync") === "true" : false,
    host: scriptEl ? new URL(scriptEl.src).origin : "",
  };

  var state = {
    events: [], // {id,type,method,url,status,duration,ts,requestHeaders,requestBody,responseBody}
    logs: [], // {id,level,args,ts}
    open: false,
    minimized: false,
    activeTab: "network",
    dark: window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches,
    selected: null,
  };

  var origFetch = window.fetch;
  var origXHROpen = XMLHttpRequest.prototype.open;
  var origXHRSend = XMLHttpRequest.prototype.send;
  var origConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
  };

  function uid() {
    return Math.random().toString(36).slice(2, 10);
  }

  function safeStringify(val) {
    try {
      if (typeof val === "string") return val;
      return JSON.stringify(val, null, 2);
    } catch (e) {
      return String(val);
    }
  }

  function pushEvent(ev) {
    ev.id = uid();
    ev.ts = Date.now();
    state.events.push(ev);
    if (state.events.length > 200) state.events.shift();
    renderList();
    if (config.sync) sendToServer(ev);
  }

  function pushLog(level, args) {
    var entry = { id: uid(), level: level, args: args.map(safeStringify), ts: Date.now() };
    state.logs.push(entry);
    if (state.logs.length > 300) state.logs.shift();
    renderList();
    if (config.sync) sendToServer({ type: "console", level: level, args: entry.args });
  }

  function sendToServer(payload) {
    if (!config.host || !config.sessionId) return;
    try {
      origFetch.call(
        window,
        config.host + "/api/tap/" + config.sessionId,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.assign({ type: payload.type || "fetch" }, payload)),
          keepalive: true,
        }
      ).catch(function () {});
    } catch (e) {}
  }

  // ---------- Patch fetch ----------
  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : input && input.url;
    var method = (init && init.method) || (input && input.method) || "GET";
    var start = performance.now();
    var reqBody = init && init.body ? safeStringify(init.body) : undefined;

    return origFetch.apply(this, arguments).then(
      function (res) {
        var duration = Math.round(performance.now() - start);
        var clone = res.clone();
        clone
          .text()
          .then(function (text) {
            pushEvent({
              type: "fetch",
              method: method,
              url: url,
              status: res.status,
              duration: duration,
              requestBody: reqBody,
              responseBody: text.slice(0, 4000),
            });
          })
          .catch(function () {
            pushEvent({ type: "fetch", method: method, url: url, status: res.status, duration: duration, requestBody: reqBody });
          });
        return res;
      },
      function (err) {
        var duration = Math.round(performance.now() - start);
        pushEvent({ type: "fetch", method: method, url: url, status: 0, duration: duration, requestBody: reqBody, responseBody: "Error: " + err.message });
        throw err;
      }
    );
  };

  // ---------- Patch XHR ----------
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__tapdesk = { method: method, url: url, start: 0 };
    return origXHROpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    var xhr = this;
    if (xhr.__tapdesk) {
      xhr.__tapdesk.start = performance.now();
      xhr.__tapdesk.body = body ? safeStringify(body) : undefined;
      xhr.addEventListener("loadend", function () {
        var duration = Math.round(performance.now() - xhr.__tapdesk.start);
        pushEvent({
          type: "xhr",
          method: xhr.__tapdesk.method,
          url: xhr.__tapdesk.url,
          status: xhr.status,
          duration: duration,
          requestBody: xhr.__tapdesk.body,
          responseBody: (xhr.responseText || "").slice(0, 4000),
        });
      });
    }
    return origXHRSend.apply(this, arguments);
  };

  // ---------- Patch console ----------
  ["log", "warn", "error", "info"].forEach(function (level) {
    console[level] = function () {
      pushLog(level, Array.prototype.slice.call(arguments));
      origConsole[level].apply(console, arguments);
    };
  });

  window.addEventListener("error", function (e) {
    pushLog("error", [e.message + " (" + e.filename + ":" + e.lineno + ")"]);
  });

  // ---------- UI ----------
  var css = "\
    #tapdesk-root{position:fixed;z-index:2147483647;font-family:ui-monospace,'SF Mono',Consolas,monospace;font-size:12px;}\
    #tapdesk-bubble{position:fixed;bottom:20px;right:20px;width:44px;height:44px;border-radius:50%;background:#2f6fed;box-shadow:0 2px 10px rgba(0,0,0,.25);cursor:grab;display:flex;align-items:center;justify-content:center;color:#fff;user-select:none;transition:transform .15s ease;}\
    #tapdesk-bubble:active{cursor:grabbing;transform:scale(0.94);}\
    #tapdesk-panel{position:fixed;bottom:76px;right:20px;width:360px;max-width:92vw;height:420px;max-height:70vh;background:#f7f7f5;color:#141414;border:1px solid #e4e2dd;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.2);display:flex;flex-direction:column;overflow:hidden;opacity:0;transform:translateY(8px);pointer-events:none;transition:opacity .18s ease,transform .18s ease;}\
    #tapdesk-panel.tapdesk-open{opacity:1;transform:translateY(0);pointer-events:auto;}\
    #tapdesk-panel.tapdesk-dark{background:#141414;color:#f2f2f0;border-color:#2a2a2a;}\
    .tapdesk-tabs{display:flex;border-bottom:1px solid #e4e2dd;flex-shrink:0;}\
    .tapdesk-dark .tapdesk-tabs{border-color:#2a2a2a;}\
    .tapdesk-tab{flex:1;padding:9px 0;text-align:center;cursor:pointer;color:#8a8a86;border-bottom:2px solid transparent;}\
    .tapdesk-tab.active{color:#2f6fed;border-color:#2f6fed;font-weight:600;}\
    .tapdesk-body{flex:1;overflow-y:auto;padding:6px;}\
    .tapdesk-row{padding:6px 8px;border-bottom:1px solid #eceae5;cursor:pointer;display:flex;justify-content:space-between;gap:6px;}\
    .tapdesk-dark .tapdesk-row{border-color:#232323;}\
    .tapdesk-row:hover{background:rgba(47,111,237,.08);}\
    .tapdesk-url{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;}\
    .tapdesk-status{color:#2f6fed;flex-shrink:0;}\
    .tapdesk-status.err{color:#e0483e;}\
    .tapdesk-log-error{color:#e0483e;}\
    .tapdesk-log-warn{color:#c8871e;}\
    .tapdesk-header{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-bottom:1px solid #e4e2dd;flex-shrink:0;}\
    .tapdesk-dark .tapdesk-header{border-color:#2a2a2a;}\
    .tapdesk-btn{border:1px solid #e4e2dd;background:transparent;color:inherit;border-radius:4px;padding:3px 8px;cursor:pointer;font-family:inherit;font-size:11px;}\
    .tapdesk-dark .tapdesk-btn{border-color:#2a2a2a;}\
    .tapdesk-detail{position:absolute;inset:0;background:inherit;overflow-y:auto;padding:10px;}\
    .tapdesk-detail pre{white-space:pre-wrap;word-break:break-word;background:rgba(0,0,0,.04);padding:8px;border-radius:4px;}\
    .tapdesk-dark .tapdesk-detail pre{background:rgba(255,255,255,.06);}\
    .tapdesk-setting-row{display:flex;justify-content:space-between;align-items:center;padding:8px 4px;border-bottom:1px solid #eceae5;}\
    .tapdesk-dark .tapdesk-setting-row{border-color:#232323;}\
    .tapdesk-empty{color:#9a9a95;padding:16px 8px;text-align:center;}\
  ";
  var styleTag = document.createElement("style");
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  var root = document.createElement("div");
  root.id = "tapdesk-root";
  root.innerHTML =
    '<div id="tapdesk-bubble" title="tapdesk">' + bubbleSVG() + "</div>" +
    '<div id="tapdesk-panel">' +
      '<div class="tapdesk-header">' +
        '<strong>tapdesk</strong>' +
        '<div><button class="tapdesk-btn" id="tapdesk-min">_</button></div>' +
      "</div>" +
      '<div class="tapdesk-tabs">' +
        '<div class="tapdesk-tab" data-tab="network">Network</div>' +
        '<div class="tapdesk-tab" data-tab="console">Console</div>' +
        '<div class="tapdesk-tab" data-tab="info">Info</div>' +
        '<div class="tapdesk-tab" data-tab="setting">Setting</div>' +
      "</div>" +
      '<div class="tapdesk-body" id="tapdesk-body" style="position:relative;"></div>' +
    "</div>";
  document.body.appendChild(root);

  function bubbleSVG() {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>';
  }

  var bubble = root.querySelector("#tapdesk-bubble");
  var panel = root.querySelector("#tapdesk-panel");
  var body = root.querySelector("#tapdesk-body");
  var tabs = root.querySelectorAll(".tapdesk-tab");
  var minBtn = root.querySelector("#tapdesk-min");

  function applyTheme() {
    panel.classList.toggle("tapdesk-dark", state.dark);
  }
  applyTheme();

  function setTab(tab) {
    state.activeTab = tab;
    state.selected = null;
    tabs.forEach(function (t) {
      t.classList.toggle("active", t.getAttribute("data-tab") === tab);
    });
    renderList();
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      setTab(t.getAttribute("data-tab"));
    });
  });
  setTab("network");

  function togglePanel(open) {
    state.open = open;
    panel.classList.toggle("tapdesk-open", open);
  }

  bubble.addEventListener("click", function () {
    if (!dragged) togglePanel(!state.open);
  });
  minBtn.addEventListener("click", function () {
    togglePanel(false);
  });

  // drag bubble
  var dragged = false;
  (function makeDraggable(el) {
    var offsetX, offsetY, dragging = false;
    el.addEventListener("mousedown", function (e) {
      dragging = true;
      dragged = false;
      offsetX = e.clientX - el.getBoundingClientRect().left;
      offsetY = e.clientY - el.getBoundingClientRect().top;
    });
    window.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      dragged = true;
      el.style.left = e.clientX - offsetX + "px";
      el.style.top = e.clientY - offsetY + "px";
      el.style.right = "auto";
      el.style.bottom = "auto";
    });
    window.addEventListener("mouseup", function () {
      dragging = false;
    });
    // touch
    el.addEventListener("touchstart", function (e) {
      dragging = true;
      dragged = false;
      var t = e.touches[0];
      offsetX = t.clientX - el.getBoundingClientRect().left;
      offsetY = t.clientY - el.getBoundingClientRect().top;
    });
    window.addEventListener("touchmove", function (e) {
      if (!dragging) return;
      dragged = true;
      var t = e.touches[0];
      el.style.left = t.clientX - offsetX + "px";
      el.style.top = t.clientY - offsetY + "px";
      el.style.right = "auto";
      el.style.bottom = "auto";
    });
    window.addEventListener("touchend", function () {
      dragging = false;
    });
  })(bubble);

  function fmtTime(ts) {
    var d = new Date(ts);
    return d.toLocaleTimeString();
  }

  function renderList() {
    if (state.selected) return renderDetail(state.selected);
    if (state.activeTab === "network") return renderNetwork();
    if (state.activeTab === "console") return renderConsole();
    if (state.activeTab === "info") return renderInfo();
    if (state.activeTab === "setting") return renderSetting();
  }

  function renderNetwork() {
    if (state.events.length === 0) {
      body.innerHTML = '<div class="tapdesk-empty">Belum ada request. Coba muat ulang atau klik sesuatu di halaman.</div>';
      return;
    }
    body.innerHTML = state.events
      .slice()
      .reverse()
      .map(function (ev) {
        var err = !ev.status || ev.status >= 400;
        return (
          '<div class="tapdesk-row" data-id="' + ev.id + '">' +
            '<span class="tapdesk-url">' + (ev.method || "") + " " + escapeHtml(ev.url || "") + "</span>" +
            '<span class="tapdesk-status ' + (err ? "err" : "") + '">' + (ev.status || "ERR") + " · " + ev.duration + "ms</span>" +
          "</div>"
        );
      })
      .join("");
    body.querySelectorAll(".tapdesk-row").forEach(function (row) {
      row.addEventListener("click", function () {
        state.selected = { kind: "network", id: row.getAttribute("data-id") };
        renderDetail(state.selected);
      });
    });
  }

  function renderConsole() {
    if (state.logs.length === 0) {
      body.innerHTML = '<div class="tapdesk-empty">Belum ada log console.</div>';
      return;
    }
    body.innerHTML = state.logs
      .slice()
      .reverse()
      .map(function (l) {
        return (
          '<div class="tapdesk-row tapdesk-log-' + l.level + '" style="cursor:default;">' +
            "<span>[" + fmtTime(l.ts) + "] " + escapeHtml(l.args.join(" ")) + "</span>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderInfo() {
    var info = {
      URL: location.href,
      "User Agent": navigator.userAgent,
      Viewport: window.innerWidth + " x " + window.innerHeight,
      Waktu: new Date().toString(),
      Session: config.sessionId,
      Sync: config.sync ? "aktif" : "nonaktif",
    };
    body.innerHTML = Object.keys(info)
      .map(function (k) {
        return '<div class="tapdesk-row" style="cursor:default;"><span>' + k + "</span><span style=\"color:#8a8a86;max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;\">" + escapeHtml(String(info[k])) + "</span></div>";
      })
      .join("");
  }

  function renderSetting() {
    body.innerHTML =
      '<div class="tapdesk-setting-row"><span>Dark mode panel</span><button class="tapdesk-btn" id="tapdesk-toggle-dark">' + (state.dark ? "Matikan" : "Nyalakan") + "</button></div>" +
      '<div class="tapdesk-setting-row"><span>Posisi tombol</span><button class="tapdesk-btn" id="tapdesk-reset-pos">Reset ke pojok</button></div>' +
      '<div class="tapdesk-setting-row"><span>Bersihkan log</span><button class="tapdesk-btn" id="tapdesk-clear">Clear</button></div>' +
      '<div class="tapdesk-setting-row"><span>Matikan tapdesk</span><button class="tapdesk-btn" id="tapdesk-destroy" style="color:#e0483e;">Destroy</button></div>';

    body.querySelector("#tapdesk-toggle-dark").addEventListener("click", function () {
      state.dark = !state.dark;
      applyTheme();
      renderSetting();
    });
    body.querySelector("#tapdesk-reset-pos").addEventListener("click", function () {
      bubble.style.left = "";
      bubble.style.top = "";
      bubble.style.right = "20px";
      bubble.style.bottom = "20px";
    });
    body.querySelector("#tapdesk-clear").addEventListener("click", function () {
      state.events = [];
      state.logs = [];
      renderSetting();
    });
    body.querySelector("#tapdesk-destroy").addEventListener("click", destroy);
  }

  function renderDetail(sel) {
    var ev = state.events.filter(function (e) { return e.id === sel.id; })[0];
    if (!ev) { state.selected = null; return renderList(); }
    body.innerHTML =
      '<div class="tapdesk-detail">' +
        '<button class="tapdesk-btn" id="tapdesk-back">&larr; Kembali</button>' +
        "<div style=\"margin-top:8px;\"><strong>" + escapeHtml(ev.method || "") + " " + escapeHtml(ev.url || "") + "</strong></div>" +
        "<div>Status: " + (ev.status || "ERR") + " · " + ev.duration + "ms</div>" +
        "<div style=\"margin-top:8px;\">Request body</div>" +
        "<pre>" + escapeHtml(ev.requestBody || "(kosong)") + "</pre>" +
        "<div>Response</div>" +
        "<pre>" + escapeHtml(ev.responseBody || "(kosong)") + "</pre>" +
      "</div>";
    body.querySelector("#tapdesk-back").addEventListener("click", function () {
      state.selected = null;
      renderList();
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function destroy() {
    window.fetch = origFetch;
    XMLHttpRequest.prototype.open = origXHROpen;
    XMLHttpRequest.prototype.send = origXHRSend;
    console.log = origConsole.log;
    console.warn = origConsole.warn;
    console.error = origConsole.error;
    console.info = origConsole.info;
    root.remove();
    styleTag.remove();
    window.__tapdesk = false;
  }

  window.__tapdeskDestroy = destroy;
})();

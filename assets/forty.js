// Shared helpers for the stage 2 pages. Talks to the forty-tassie Supabase
// project through security-definer RPC functions only — the tables themselves
// are closed to the public key.
(function () {
  const SB_URL = 'https://vmhzsgcnohhhsxskahvt.supabase.co';
  const SB_KEY = 'sb_publishable_0onnEg_GFdbik4f5cjGdcg_N_wy5ouO';

  async function rpc(fn, args) {
    const res = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: SB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(args || {})
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error((data && (data.message || data.hint)) || `Request failed (${res.status})`);
    return data;
  }

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  // Personal link token: ?k=… wins, otherwise whatever this browser remembered.
  function token(storeKey) {
    const fromUrl = new URLSearchParams(location.search).get('k');
    if (fromUrl) { store.set(storeKey, fromUrl); return fromUrl; }
    return store.get(storeKey);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  // Read/write a form whose inputs are named after record fields.
  // Names like "events.lunch" map into nested objects.
  function fillForm(form, rec) {
    $$('[name]', form).forEach(el => {
      const path = el.name.split('.');
      let v = rec;
      for (const p of path) v = v == null ? undefined : v[p];
      if (el.type === 'radio') el.checked = v != null && String(v) === el.value;
      else if (el.type === 'checkbox') el.checked = v === true;
      else el.value = v == null ? '' : v;
    });
  }
  function readForm(form) {
    const out = {};
    $$('[name]', form).forEach(el => {
      const path = el.name.split('.');
      let v;
      if (el.type === 'radio') { if (!el.checked) { ensure(out, path); return; } v = el.value; }
      else if (el.type === 'checkbox') v = el.checked;
      else v = el.value.trim();
      if (el.dataset.bool !== undefined) v = v === '' ? null : v === 'true';
      if (el.type === 'number') v = v === '' ? null : Number(v);
      set(out, path, v);
    });
    return out;
    function ensure(o, p) { if (p.length > 1) { o[p[0]] = o[p[0]] || {}; ensure(o[p[0]], p.slice(1)); } else if (!(p[0] in o)) o[p[0]] = undefined; }
    function set(o, p, v) { if (p.length > 1) { o[p[0]] = o[p[0]] || {}; set(o[p[0]], p.slice(1), v); } else o[p[0]] = v; }
  }
  // Strip undefined radio groups (nothing chosen) but keep explicit blanks.
  function clean(o) {
    if (o && typeof o === 'object' && !Array.isArray(o)) {
      const r = {};
      for (const [k, v] of Object.entries(o)) if (v !== undefined) r[k] = clean(v);
      return r;
    }
    return o;
  }

  let toastTimer;
  function toast(msg) {
    let el = $('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast('Copied'); }
    catch (e) { prompt('Copy this:', text); }
  }

  // Fill any [data-config="key"] element with the matching config value.
  function applyConfig(cfg) {
    $$('[data-config]').forEach(el => {
      const v = cfg[el.dataset.config];
      if (v) el.textContent = v;
    });
    const banner = $('#banner');
    if (banner) { banner.textContent = cfg.announcement || ''; banner.hidden = !cfg.announcement; }
  }

  function firstName(n) { return (n || '').trim().split(/\s+/)[0] || ''; }

  window.Forty = { rpc, store, token, esc, $, $$, fillForm, readForm, clean, toast, copy, applyConfig, firstName };
})();

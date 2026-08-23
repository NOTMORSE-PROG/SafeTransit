import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  if (req.method !== "GET") return res.status(405).end();

  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SafeTransit Admin</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;color:#1e293b;min-height:100vh}
#app{display:flex;min-height:100vh}
/* Sidebar */
#sidebar{width:220px;background:#fff;border-right:1px solid #e2e8f0;display:flex;flex-direction:column;flex-shrink:0}
#sidebar .logo{display:flex;align-items:center;gap:8px;padding:20px 16px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:15px;color:#1e293b}
#sidebar .logo span{color:#2563eb;font-size:20px}
#sidebar nav{flex:1;padding:12px 8px}
#sidebar nav a{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:6px;text-decoration:none;color:#64748b;font-size:14px;font-weight:500;cursor:pointer;margin-bottom:2px;transition:all .15s}
#sidebar nav a:hover{background:#f8fafc;color:#1e293b}
#sidebar nav a.active{background:#eff6ff;color:#2563eb}
#sidebar .logout{padding:16px;border-top:1px solid #e2e8f0}
#sidebar .logout button{width:100%;padding:8px;background:none;border:1px solid #e2e8f0;border-radius:6px;color:#64748b;font-size:13px;cursor:pointer;transition:all .15s}
#sidebar .logout button:hover{border-color:#ef4444;color:#ef4444}
/* Main */
#main{flex:1;overflow:auto}
#view{padding:32px}
/* Login */
#login-wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f1f5f9}
.login-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:40px;width:100%;max-width:380px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.login-card h1{display:flex;align-items:center;gap:8px;font-size:18px;margin-bottom:28px;color:#1e293b}
.login-card h1 span{color:#2563eb;font-size:22px}
/* Forms */
.field{margin-bottom:16px}
.field label{display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:5px}
.field input,.field textarea,.field select{width:100%;border:1px solid #d1d5db;border-radius:6px;padding:9px 12px;font-size:14px;outline:none;transition:border .15s;font-family:inherit}
.field input:focus,.field textarea:focus,.field select:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.08)}
.field textarea{resize:vertical}
.char-count{text-align:right;font-size:11px;color:#94a3b8;margin-top:3px}
/* Buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 16px;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;border:none;transition:all .15s}
.btn-primary{background:#2563eb;color:#fff}.btn-primary:hover{background:#1d4ed8}
.btn-primary:disabled{opacity:.6;cursor:not-allowed}
.btn-sm{padding:5px 10px;font-size:12px}
.btn-green{background:#dcfce7;color:#166534}.btn-green:hover{background:#bbf7d0}
.btn-red{background:#fee2e2;color:#991b1b}.btn-red:hover{background:#fecaca}
.btn-blue{background:#dbeafe;color:#1e40af}.btn-blue:hover{background:#bfdbfe}
.btn-gray{background:#f1f5f9;color:#374151;border:1px solid #e2e8f0}.btn-gray:hover{background:#e2e8f0}
.btn-outline{background:#fff;color:#374151;border:1px solid #d1d5db}.btn-outline:hover{background:#f9fafb}
/* Cards */
.card{background:#fff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
.card-body{padding:20px}
/* Stats */
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:28px}
.stat-card{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:20px;display:flex;align-items:center;gap:14px}
.stat-icon{width:44px;height:44px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.stat-icon.blue{background:#eff6ff;color:#2563eb}
.stat-icon.yellow{background:#fefce8;color:#b45309}
.stat-icon.red{background:#fef2f2;color:#dc2626}
.stat-icon.green{background:#f0fdf4;color:#16a34a}
.stat-val{font-size:26px;font-weight:700;color:#1e293b}
.stat-lbl{font-size:12px;color:#64748b;margin-top:1px}
/* Table */
.table-wrap{background:#fff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
table{width:100%;border-collapse:collapse;font-size:13px}
thead{background:#f8fafc;border-bottom:1px solid #e2e8f0}
th{padding:11px 14px;text-align:left;font-weight:600;color:#475569;white-space:nowrap}
td{padding:11px 14px;border-bottom:1px solid #f1f5f9;color:#374151;vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:#f8fafc}
/* Badge */
.badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;text-transform:capitalize}
.badge-pending{background:#fef9c3;color:#92400e}
.badge-approved{background:#dcfce7;color:#166534}
.badge-rejected{background:#fee2e2;color:#991b1b}
.badge-expired{background:#f1f5f9;color:#64748b}
.badge-visible{background:#dcfce7;color:#166534}
.badge-hidden{background:#f1f5f9;color:#64748b}
.badge-flagged{background:#fee2e2;color:#991b1b}
.badge-admin{background:#f3e8ff;color:#6b21a8}
/* Filters */
.filters{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:center}
.filters select,.filters input{border:1px solid #d1d5db;border-radius:6px;padding:7px 10px;font-size:13px;outline:none;background:#fff}
.filters select:focus,.filters input:focus{border-color:#2563eb}
/* Pagination */
.pagination{display:flex;align-items:center;justify-content:space-between;margin-top:14px;font-size:13px;color:#64748b}
.pagination .pages{display:flex;gap:6px}
/* Alert / Error */
.alert{padding:10px 14px;border-radius:6px;font-size:13px;margin-bottom:14px}
.alert-error{background:#fef2f2;border:1px solid #fecaca;color:#dc2626}
.alert-success{background:#f0fdf4;border:1px solid #bbf7d0;color:#166534}
/* Modal */
.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px}
.modal{background:#fff;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,.15);max-width:520px;width:100%;padding:24px;max-height:90vh;overflow-y:auto}
.modal h2{font-size:16px;font-weight:700;margin-bottom:4px}
.modal-sub{font-size:13px;color:#64748b;margin-bottom:16px}
.modal-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:20px;padding-top:16px;border-top:1px solid #f1f5f9}
.detail-row{display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid #f8fafc}
.detail-row:last-child{border-bottom:none}
.detail-label{color:#64748b}
/* Inline expanded row */
.expanded-row td{background:#f8fafc;padding:16px 14px;font-size:13px;color:#374151}
/* Notification preview */
.notif-preview{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-top:10px}
.notif-preview .notif-title{font-weight:600;font-size:14px;color:#1e293b}
.notif-preview .notif-body{font-size:12px;color:#64748b;margin-top:3px}
/* Page heading */
.page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}
.page-header h1{font-size:22px;font-weight:700}
/* Checkbox */
input[type=checkbox]{cursor:pointer;accent-color:#2563eb}
/* Radio */
.radio-group{display:flex;flex-direction:column;gap:8px}
.radio-group label{display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;color:#374151}
input[type=radio]{accent-color:#2563eb}
/* Bulk bar */
.bulk-bar{background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:8px 14px;display:flex;align-items:center;gap:10px;margin-bottom:12px;font-size:13px;color:#1e40af}
.bulk-bar .selected-count{font-weight:600}
</style>
</head>
<body>
<div id="app"></div>

<script>
// ─── State ────────────────────────────────────────────────────────────────────
const BASE = '';  // same origin
let state = {
  view: 'loading',
  admin: null,
  // tips
  tipsFilters: { status: 'pending', category: '', page: 1 },
  tips: [], tipsPagination: null, tipsSelected: new Set(),
  // forum
  forumFilters: { status: 'flagged', flair: '', page: 1 },
  posts: [], postsPagination: null,
  expandedPostId: null,
  // users
  userSearch: '', userPage: 1,
  users: [], usersPagination: null,
  userDetail: null,
  // notifications
  notifTitle: '', notifBody: '', notifAudience: 'all', notifUserIds: '',
  notifResult: null,
};

// ─── API ──────────────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('admin_token'); }
function setToken(t) { localStorage.setItem('admin_token', t); }
function clearToken() { localStorage.removeItem('admin_token'); }

async function apiFetch(path, opts = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(BASE + path, { ...opts, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// ─── Router / Render ──────────────────────────────────────────────────────────
function render(view, extra = {}) {
  Object.assign(state, extra);
  state.view = view;
  const app = document.getElementById('app');
  if (!getToken() || view === 'login') {
    app.innerHTML = renderLogin();
    bindLogin();
    return;
  }
  app.innerHTML = '<div id="sidebar">' + renderSidebar(view) + '</div><div id="main"><div id="view">' + renderView(view) + '</div></div>';
  bindView(view);
}

function renderSidebar(active) {
  const links = [
    ['dashboard','📊','Dashboard'],
    ['tips','💡','Tips'],
    ['forum','💬','Forum'],
    ['users','👥','Users'],
    ['notifications','🔔','Notifications'],
  ];
  return \`
    <div class="logo"><span>🛡️</span> SafeTransit Admin</div>
    <nav>\${links.map(([v,ic,lbl]) =>
      \`<a onclick="render('\${v}')" class="\${active===v?'active':''}">\${ic} \${lbl}</a>\`
    ).join('')}</nav>
    <div class="logout"><button onclick="logout()">↩ Logout</button></div>
  \`;
}

function renderView(view) {
  switch(view) {
    case 'dashboard': return renderDashboard();
    case 'tips': return renderTips();
    case 'forum': return renderForum();
    case 'users': return renderUsers();
    case 'notifications': return renderNotifications();
    default: return '<p>Loading…</p>';
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────
function renderLogin() {
  return \`
    <div id="login-wrap">
      <div class="login-card">
        <h1><span>🛡️</span> SafeTransit Admin</h1>
        <div id="login-err"></div>
        <div class="field"><label>Email</label><input id="li-email" type="email" autocomplete="email" placeholder="admin@safetransit.app"></div>
        <div class="field"><label>Password</label><input id="li-pass" type="password" autocomplete="current-password"></div>
        <button class="btn btn-primary" style="width:100%" id="li-btn" onclick="doLogin()">Sign in</button>
      </div>
    </div>
  \`;
}

function bindLogin() {
  document.getElementById('li-pass')?.addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
}

async function doLogin() {
  const email = document.getElementById('li-email').value.trim();
  const pass = document.getElementById('li-pass').value;
  const btn = document.getElementById('li-btn');
  const errEl = document.getElementById('login-err');
  errEl.innerHTML = '';
  btn.disabled = true; btn.textContent = 'Signing in…';
  try {
    const { token, admin } = await apiFetch('/api/admin/auth', { method: 'POST', body: JSON.stringify({ email, password: pass }) });
    setToken(token);
    state.admin = admin;
    loadDashboard();
  } catch(e) {
    errEl.innerHTML = \`<div class="alert alert-error">\${e.message}</div>\`;
    btn.disabled = false; btn.textContent = 'Sign in';
  }
}

function logout() { clearToken(); state.admin = null; render('login'); }

// ─── Dashboard ────────────────────────────────────────────────────────────────
async function loadDashboard() {
  render('dashboard');
  try {
    const data = await apiFetch('/api/admin/dashboard');
    const el = document.getElementById('dashboard-content');
    if (!el) return;
    el.innerHTML = \`
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-icon blue">👥</div><div><div class="stat-val">\${data.totalUsers}</div><div class="stat-lbl">Total Users</div></div></div>
        <div class="stat-card"><div class="stat-icon yellow">⏳</div><div><div class="stat-val">\${data.pendingTips}</div><div class="stat-lbl">Pending Tips</div></div></div>
        <div class="stat-card"><div class="stat-icon red">🚩</div><div><div class="stat-val">\${data.flaggedPosts}</div><div class="stat-lbl">Flagged Posts</div></div></div>
        <div class="stat-card"><div class="stat-icon green">🆕</div><div><div class="stat-val">\${data.newUsersLast7Days}</div><div class="stat-lbl">New Users (7d)</div></div></div>
      </div>
      <h2 style="margin-bottom:12px;font-size:15px;color:#475569">Tips by Status & Category</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Status</th><th>Category</th><th style="text-align:right">Count</th></tr></thead>
          <tbody>\${data.tipsByStatusAndCategory.map(r=>\`
            <tr><td>\${badge(r.status)}</td><td style="text-transform:capitalize">\${r.category||'—'}</td><td style="text-align:right;font-weight:600">\${r.count}</td></tr>
          \`).join('')}</tbody>
        </table>
      </div>
    \`;
  } catch(e) {
    const el = document.getElementById('dashboard-content');
    if(el) el.innerHTML = \`<div class="alert alert-error">Failed to load dashboard: \${e.message}</div>\`;
  }
}

function renderDashboard() {
  return \`
    <div class="page-header"><h1>Dashboard</h1></div>
    <div id="dashboard-content"><p style="color:#94a3b8">Loading stats…</p></div>
  \`;
}

// ─── Tips ─────────────────────────────────────────────────────────────────────
function renderTips() {
  const f = state.tipsFilters;
  const selected = state.tipsSelected;
  const hasSel = selected.size > 0;
  return \`
    <div class="page-header">
      <h1>Tips Moderation</h1>
      \${hasSel ? \`<div style="display:flex;gap:8px;align-items:center">
        <span style="font-size:13px;color:#64748b">\${selected.size} selected</span>
        <button class="btn btn-sm btn-green" onclick="bulkTips('approved')">Approve all</button>
        <button class="btn btn-sm btn-red" onclick="bulkTips('rejected')">Reject all</button>
      </div>\` : ''}
    </div>
    <div class="filters">
      <select onchange="setTipFilter('status',this.value)">
        <option value="" \${!f.status?'selected':''}>All statuses</option>
        \${['pending','approved','rejected','expired'].map(s=>\`<option value="\${s}" \${f.status===s?'selected':''}>\${s}</option>\`).join('')}
      </select>
      <select onchange="setTipFilter('category',this.value)">
        <option value="" \${!f.category?'selected':''}>All categories</option>
        \${['lighting','safety','transit','harassment','safe_haven','construction'].map(c=>\`<option value="\${c}" \${f.category===c?'selected':''}>\${c.replace('_',' ')}</option>\`).join('')}
      </select>
    </div>
    <div id="tips-table"><p style="color:#94a3b8">Loading…</p></div>
  \`;
}

async function loadTips() {
  const f = state.tipsFilters;
  const params = new URLSearchParams();
  if(f.status) params.set('status',f.status);
  if(f.category) params.set('category',f.category);
  params.set('page', String(f.page));
  try {
    const data = await apiFetch('/api/admin/tips?' + params);
    state.tips = data.tips; state.tipsPagination = data.pagination;
    const el = document.getElementById('tips-table');
    if(!el) return;
    el.innerHTML = renderTipsTable(data.tips, data.pagination);
    bindTipsTable();
  } catch(e) {
    const el = document.getElementById('tips-table');
    if(el) el.innerHTML = \`<div class="alert alert-error">\${e.message}</div>\`;
  }
}

function renderTipsTable(tips, p) {
  const sel = state.tipsSelected;
  const allChecked = tips.length > 0 && tips.every(t => sel.has(t.id));
  return \`
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th><input type="checkbox" id="chk-all" \${allChecked?'checked':''} onchange="toggleAllTips()"></th>
          <th>Title</th><th>Category</th><th>Status</th><th>Author</th><th>Date</th><th style="text-align:right">Actions</th>
        </tr></thead>
        <tbody>\${tips.map(t => \`
          <tr>
            <td><input type="checkbox" class="tip-chk" data-id="\${t.id}" \${sel.has(t.id)?'checked':''} onchange="toggleTip('\${t.id}')"></td>
            <td style="max-width:220px"><div style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">\${esc(t.title)}</div>
              <div style="font-size:11px;color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">\${esc(t.message||'')}</div>
            </td>
            <td style="text-transform:capitalize">\${t.category||'—'}</td>
            <td>\${badge(t.status)}</td>
            <td style="font-size:12px;color:#64748b">\${esc(t.author_name||'')}</td>
            <td style="font-size:12px;color:#94a3b8">\${fmtDate(t.created_at)}</td>
            <td style="text-align:right;white-space:nowrap">
              \${t.status!=='approved'?\`<button class="btn btn-sm btn-green" onclick="updateTip('\${t.id}',{status:'approved'})">Approve</button> \`:''}
              \${t.status!=='rejected'?\`<button class="btn btn-sm btn-red" onclick="updateTip('\${t.id}',{status:'rejected'})">Reject</button> \`:''}
              \${!t.verified?\`<button class="btn btn-sm btn-blue" onclick="updateTip('\${t.id}',{verified:true,verification_source:'authority'})">Verify</button> \`:''}
              <button class="btn btn-sm btn-gray" onclick="deleteTip('\${t.id}')">Delete</button>
            </td>
          </tr>
        \`).join('')}</tbody>
      </table>
    </div>
    \${renderPagination(p, 'tipPage')}
  \`;
}

function bindTipsTable() {
  document.getElementById('chk-all')?.addEventListener('change', toggleAllTips);
}

function bindView(view) {
  if(view === 'dashboard') loadDashboard();
  if(view === 'tips') loadTips();
  if(view === 'forum') loadForum();
  if(view === 'users') { setTimeout(loadUsers, 0); bindUserSearch(); }
  // notifications has no initial load
}

function setTipFilter(key, val) {
  state.tipsFilters[key] = val; state.tipsFilters.page = 1;
  state.tipsSelected.clear();
  render('tips'); loadTips();
}

function tipPage(p) { state.tipsFilters.page = p; loadTips(); }

function toggleAllTips() {
  const tips = state.tips;
  if(state.tipsSelected.size === tips.length) state.tipsSelected.clear();
  else tips.forEach(t => state.tipsSelected.add(t.id));
  document.querySelectorAll('.tip-chk').forEach(c => { c.checked = state.tipsSelected.has(c.dataset.id); });
  document.getElementById('chk-all').checked = state.tipsSelected.size === tips.length;
  // re-render header for bulk bar
  render('tips'); loadTips();
}

function toggleTip(id) {
  if(state.tipsSelected.has(id)) state.tipsSelected.delete(id); else state.tipsSelected.add(id);
}

async function updateTip(id, updates) {
  try {
    await apiFetch('/api/admin/tips/' + id, { method: 'PUT', body: JSON.stringify(updates) });
    loadTips();
  } catch(e) { alert('Error: ' + e.message); }
}

async function deleteTip(id) {
  if(!confirm('Delete this tip permanently?')) return;
  try { await apiFetch('/api/admin/tips/' + id, { method: 'DELETE' }); loadTips(); }
  catch(e) { alert('Error: ' + e.message); }
}

async function bulkTips(status) {
  const ids = Array.from(state.tipsSelected);
  if(!ids.length) return;
  try {
    const r = await apiFetch('/api/admin/tips/bulk', { method: 'POST', body: JSON.stringify({ ids, status }) });
    state.tipsSelected.clear();
    render('tips'); loadTips();
    showToast('✓ Updated ' + r.updated + ' tips');
  } catch(e) { alert('Error: ' + e.message); }
}

// ─── Forum ────────────────────────────────────────────────────────────────────
function renderForum() {
  const f = state.forumFilters;
  return \`
    <div class="page-header"><h1>Forum Moderation</h1></div>
    <div class="filters">
      <select onchange="setForumFilter('status',this.value)">
        <option value="" \${!f.status?'selected':''}>All statuses</option>
        \${['visible','hidden','flagged'].map(s=>\`<option value="\${s}" \${f.status===s?'selected':''}>\${s}</option>\`).join('')}
      </select>
      <select onchange="setForumFilter('flair',this.value)">
        <option value="">All flairs</option>
        \${['general','routes','questions','experiences','tips_advice'].map(fl=>\`<option value="\${fl}" \${f.flair===fl?'selected':''}>\${fl.replace('_',' ')}</option>\`).join('')}
      </select>
    </div>
    <div id="forum-table"><p style="color:#94a3b8">Loading…</p></div>
  \`;
}

async function loadForum() {
  const f = state.forumFilters;
  const params = new URLSearchParams();
  if(f.status) params.set('status',f.status);
  if(f.flair) params.set('flair',f.flair);
  params.set('page', String(f.page));
  try {
    const data = await apiFetch('/api/admin/forum?' + params);
    state.posts = data.posts; state.postsPagination = data.pagination;
    const el = document.getElementById('forum-table');
    if(el) el.innerHTML = renderForumTable(data.posts, data.pagination);
  } catch(e) {
    const el = document.getElementById('forum-table');
    if(el) el.innerHTML = \`<div class="alert alert-error">\${e.message}</div>\`;
  }
}

function renderForumTable(posts, p) {
  return \`
    <div class="table-wrap">
      <table>
        <thead><tr><th>Title</th><th>Flair</th><th>Status</th><th>Reports</th><th>Author</th><th style="text-align:right">Actions</th></tr></thead>
        <tbody>\${posts.map(post => {
          const expanded = state.expandedPostId === post.id;
          return \`
            <tr>
              <td style="max-width:260px">
                <div class="link" style="color:#2563eb;cursor:pointer;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" onclick="togglePost('\${post.id}')">\${esc(post.title)}</div>
              </td>
              <td style="text-transform:capitalize">\${(post.flair||'').replace('_',' ')}</td>
              <td>\${badge(post.status)}</td>
              <td>\${post.report_count||0}</td>
              <td style="font-size:12px;color:#64748b">\${esc(post.author_name||'')}</td>
              <td style="text-align:right;white-space:nowrap">
                \${post.status!=='hidden'?\`<button class="btn btn-sm btn-gray" onclick="updatePost('\${post.id}','hidden')">Hide</button> \`:''}
                \${post.status!=='visible'?\`<button class="btn btn-sm btn-green" onclick="updatePost('\${post.id}','visible')">Unhide</button> \`:''}
                <button class="btn btn-sm btn-red" onclick="deletePost('\${post.id}')">Delete</button>
              </td>
            </tr>
            \${expanded ? \`<tr class="expanded-row"><td colspan="6"><strong>Post body:</strong><br><span style="white-space:pre-wrap">\${esc(post.body||'')}</span></td></tr>\` : ''}
          \`;
        }).join('')}</tbody>
      </table>
    </div>
    \${renderPagination(p, 'forumPage')}
  \`;
}

function setForumFilter(key, val) { state.forumFilters[key] = val; state.forumFilters.page = 1; render('forum'); loadForum(); }
function forumPage(p) { state.forumFilters.page = p; loadForum(); }
function togglePost(id) { state.expandedPostId = state.expandedPostId===id ? null : id; loadForum(); }

async function updatePost(id, status) {
  try { await apiFetch('/api/admin/forum/' + id, { method: 'PUT', body: JSON.stringify({ status }) }); loadForum(); }
  catch(e) { alert('Error: ' + e.message); }
}

async function deletePost(id) {
  if(!confirm('Delete this post permanently?')) return;
  try { await apiFetch('/api/admin/forum/' + id, { method: 'DELETE' }); loadForum(); }
  catch(e) { alert('Error: ' + e.message); }
}

// ─── Users ────────────────────────────────────────────────────────────────────
function renderUsers() {
  const p = state.usersPagination;
  return \`
    <div class="page-header"><h1>Users</h1></div>
    <div class="filters">
      <input id="user-search" type="search" placeholder="Search name or email…" value="\${esc(state.userSearch)}" style="width:260px">
    </div>
    <div id="users-table"><p style="color:#94a3b8">Loading…</p></div>
    \${state.userDetail ? renderUserModal() : ''}
  \`;
}

function bindUserSearch() {
  let timer;
  document.getElementById('user-search')?.addEventListener('input', e => {
    clearTimeout(timer);
    timer = setTimeout(() => { state.userSearch = e.target.value; state.userPage = 1; loadUsers(); }, 300);
  });
}

async function loadUsers() {
  const params = new URLSearchParams({ page: String(state.userPage) });
  if(state.userSearch) params.set('search', state.userSearch);
  try {
    const data = await apiFetch('/api/admin/users?' + params);
    state.users = data.users; state.usersPagination = data.pagination;
    const el = document.getElementById('users-table');
    if(el) el.innerHTML = renderUsersTable(data.users, data.pagination);
  } catch(e) {
    const el = document.getElementById('users-table');
    if(el) el.innerHTML = \`<div class="alert alert-error">\${e.message}</div>\`;
  }
}

function renderUsersTable(users, p) {
  return \`
    <div class="table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Consented</th><th>Joined</th><th style="text-align:right">Actions</th></tr></thead>
        <tbody>\${users.map(u => \`
          <tr>
            <td style="font-weight:500">\${esc(u.full_name)}</td>
            <td style="color:#64748b">\${esc(u.email)}</td>
            <td>\${u.is_admin ? '<span class="badge badge-admin">Admin</span>' : '<span style="font-size:12px;color:#94a3b8">User</span>'}</td>
            <td>\${u.accepted_terms_at ? '<span style="color:#16a34a;font-weight:600">✓</span>' : '<span style="color:#d1d5db">—</span>'}</td>
            <td style="font-size:12px;color:#94a3b8">\${fmtDate(u.created_at)}</td>
            <td style="text-align:right"><button class="btn btn-sm btn-outline" onclick="openUser('\${u.id}')">View</button></td>
          </tr>
        \`).join('')}</tbody>
      </table>
    </div>
    \${renderPagination(p, 'userPage')}
  \`;
}

function userPage(p) { state.userPage = p; loadUsers(); }

async function openUser(id) {
  try {
    const data = await apiFetch('/api/admin/users/' + id);
    state.userDetail = data;
    render('users');
    document.getElementById('user-search').value = state.userSearch;
    loadUsers();
  } catch(e) { alert('Error: ' + e.message); }
}

function closeUserModal() { state.userDetail = null; render('users'); document.getElementById('user-search').value = state.userSearch; loadUsers(); }

function renderUserModal() {
  const { user, consents } = state.userDetail;
  return \`
    <div class="modal-backdrop" onclick="closeUserModal()">
      <div class="modal" onclick="event.stopPropagation()">
        <h2>\${esc(user.full_name)}</h2>
        <div class="modal-sub">\${esc(user.email)}</div>
        <div>
          \${[
            ['Joined', fmtDate(user.created_at)],
            ['Onboarding', user.onboarding_completed ? 'Complete' : 'Pending'],
            ['Terms accepted', user.accepted_terms_at ? fmtDate(user.accepted_terms_at) : '—'],
            ['Privacy accepted', user.accepted_privacy_at ? fmtDate(user.accepted_privacy_at) : '—'],
            ['Admin', user.is_admin ? 'Yes' : 'No'],
          ].map(([l,v]) => \`<div class="detail-row"><span class="detail-label">\${l}</span><span>\${v}</span></div>\`).join('')}
        </div>
        \${consents.length ? \`
          <p style="font-size:12px;font-weight:600;color:#64748b;margin-top:14px;margin-bottom:6px">Consent history</p>
          \${consents.map(c=>\`<div style="font-size:12px;color:#64748b;padding:3px 0">\${esc(c.consent_type)} · \${fmtDateTime(c.accepted_at)}</div>\`).join('')}
        \` : ''}
        <div class="modal-footer">
          <button class="btn \${user.is_admin?'btn-red':'btn-blue'}" onclick="toggleAdmin('\${user.id}',\${!user.is_admin})">
            \${user.is_admin ? 'Revoke Admin' : 'Grant Admin'}
          </button>
          <button class="btn btn-outline" onclick="closeUserModal()">Close</button>
        </div>
      </div>
    </div>
  \`;
}

async function toggleAdmin(id, isAdmin) {
  try {
    const { data } = await apiFetch('/api/admin/users/' + id, { method: 'PUT', body: JSON.stringify({ is_admin: isAdmin }) });
    state.userDetail.user.is_admin = data.is_admin;
    render('users');
    document.getElementById('user-search').value = state.userSearch;
    loadUsers();
    showToast('User updated');
  } catch(e) { alert('Error: ' + e.message); }
}

// ─── Notifications ────────────────────────────────────────────────────────────
function renderNotifications() {
  const r = state.notifResult;
  return \`
    <div class="page-header"><h1>Send Notification</h1></div>
    <div style="max-width:500px">
      <div class="card">
        <div class="card-body">
          \${r ? \`<div class="alert alert-success">✓ Sent to \${r.sentTo} device(s) in \${r.batches} batch(es).</div>\` : ''}
          <div class="field">
            <label>Title <span class="char-count" id="title-count">\${state.notifTitle.length}/50</span></label>
            <input id="notif-title" type="text" maxlength="50" value="\${esc(state.notifTitle)}" oninput="state.notifTitle=this.value;updateNotifPreview();document.getElementById('title-count').textContent=this.value.length+'/50'" placeholder="e.g. Safety Alert in Makati">
          </div>
          <div class="field">
            <label>Message <span class="char-count" id="body-count">\${state.notifBody.length}/200</span></label>
            <textarea id="notif-body" maxlength="200" rows="4" oninput="state.notifBody=this.value;updateNotifPreview();document.getElementById('body-count').textContent=this.value.length+'/200'" placeholder="Notification message…">\${esc(state.notifBody)}</textarea>
          </div>
          <div class="field">
            <label>Audience</label>
            <div class="radio-group">
              \${[['all','All users'],['users_with_tips','Users who submitted tips'],['specific_users','Specific user IDs']].map(([v,l])=>\`
                <label><input type="radio" name="audience" value="\${v}" \${state.notifAudience===v?'checked':''} onchange="state.notifAudience='\${v}';render('notifications')"> \${l}</label>
              \`).join('')}
            </div>
          </div>
          \${state.notifAudience==='specific_users' ? \`
            <div class="field">
              <label>User IDs (comma or newline separated)</label>
              <textarea id="notif-userids" rows="3" style="font-family:monospace;font-size:12px" placeholder="uuid1, uuid2, ...">\${esc(state.notifUserIds)}</textarea>
            </div>
          \` : ''}
          \${(state.notifTitle||state.notifBody) ? \`
            <div class="notif-preview">
              <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:6px">Preview</div>
              <div class="notif-title" id="prev-title">\${esc(state.notifTitle)||'Title'}</div>
              <div class="notif-body" id="prev-body">\${esc(state.notifBody)||'Message'}</div>
            </div>
          \` : ''}
          <button class="btn btn-primary" style="width:100%;margin-top:16px" id="notif-btn" onclick="sendNotif()">Send notification</button>
        </div>
      </div>
    </div>
  \`;
}

function updateNotifPreview() {
  const t = document.getElementById('prev-title');
  const b = document.getElementById('prev-body');
  if(t) t.textContent = state.notifTitle || 'Title';
  if(b) b.textContent = state.notifBody || 'Message';
}

async function sendNotif() {
  const title = state.notifTitle.trim();
  const body = state.notifBody.trim();
  if(!title || !body) { alert('Title and message are required'); return; }
  const btn = document.getElementById('notif-btn');
  btn.disabled = true; btn.textContent = 'Sending…';
  const userIds = state.notifAudience === 'specific_users'
    ? (document.getElementById('notif-userids')?.value || '').split(/[\\n,]+/).map(s=>s.trim()).filter(Boolean)
    : undefined;
  try {
    const r = await apiFetch('/api/admin/notifications', {
      method: 'POST',
      body: JSON.stringify({ title, body, audience: state.notifAudience, userIds }),
    });
    state.notifResult = r;
    render('notifications');
  } catch(e) {
    alert('Error: ' + e.message);
    btn.disabled = false; btn.textContent = 'Send notification';
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function badge(status) {
  return \`<span class="badge badge-\${status}">\${status}</span>\`;
}

function esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '—'; }
function fmtDateTime(d) { return d ? new Date(d).toLocaleString() : '—'; }

function renderPagination(p, fn) {
  if(!p || p.totalPages <= 1) return '';
  return \`
    <div class="pagination">
      <span>\${p.total} total · page \${p.page} of \${p.totalPages}</span>
      <div class="pages">
        <button class="btn btn-sm btn-outline" onclick="\${fn}(\${p.page-1})" \${p.page<=1?'disabled':''}>← Prev</button>
        <button class="btn btn-sm btn-outline" onclick="\${fn}(\${p.page+1})" \${p.page>=p.totalPages?'disabled':''}>Next →</button>
      </div>
    </div>
  \`;
}

let toastTimer;
function showToast(msg) {
  let t = document.getElementById('toast');
  if(!t) { t = document.createElement('div'); t.id='toast'; t.style.cssText='position:fixed;bottom:20px;right:20px;background:#1e293b;color:#fff;padding:10px 16px;border-radius:6px;font-size:13px;z-index:200;opacity:0;transition:opacity .2s'; document.body.appendChild(t); }
  t.textContent = msg; t.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.opacity = '0'; }, 3000);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
if(getToken()) {
  render('dashboard');
} else {
  render('login');
}
</script>
</body>
</html>`);
}

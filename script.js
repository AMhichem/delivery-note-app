/* ═══════════════════════════════════════════════════════════════
   DeliverPro — script.js
   Complete delivery note management app
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── STATE ── */
let currentUser  = null;
let productsDB   = [];
let currentBL    = null;   // BL currently being edited
let rowIndex     = 0;
let unsaved      = false;
let modalResolve = null;

/* ── STORAGE HELPERS ── */
const sk = k => `dp_${currentUser}_${k}`;
const load = k  => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const save = (k,v) => localStorage.setItem(k, JSON.stringify(v));

function getUsers()   { return load('dp_users') || {}; }
function saveUsers(u) { save('dp_users', u); }

function getProducts()  { return load(sk('products')) || []; }
function saveProducts(p){ save(sk('products'), p); productsDB = p; }

function getBLs()   { return load(sk('bls'))   || []; }
function saveBLs(b) { save(sk('bls'), b); }

function getSettings() {
  return load(sk('settings')) || {
    company: '', address: '', phone: '', email: '', rc: '',
    prefix: 'BL', tva: 19, currency: 'DA', footer: ''
  };
}
function saveSettings(s) { save(sk('settings'), s); }

/* ── SCREEN SWITCHING ── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

/* ── VIEW SWITCHING ── */
function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  const el = document.getElementById('view-' + name);
  if (el) el.classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.view === name);
  });
  closeSidebar();
}

/* ── AUTH ── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
    document.getElementById('authMessage').textContent = '';
  });
});

document.getElementById('loginBtn').addEventListener('click', () => {
  const u = document.getElementById('loginUsername').value.trim();
  const p = document.getElementById('loginPassword').value;
  const users = getUsers();
  if (users[u] && users[u] === p) {
    currentUser = u;
    localStorage.setItem('dp_session', u);
    initApp();
  } else {
    showAuthMsg('Identifiant ou mot de passe incorrect.', 'error');
  }
});

document.getElementById('signupBtn').addEventListener('click', () => {
  const u = document.getElementById('signupUsername').value.trim();
  const p = document.getElementById('signupPassword').value;
  const c = document.getElementById('signupConfirm').value;
  if (!u || !p) return showAuthMsg('Veuillez remplir tous les champs.', 'error');
  if (p.length < 6) return showAuthMsg('Mot de passe trop court (min 6 caractères).', 'error');
  if (p !== c) return showAuthMsg('Les mots de passe ne correspondent pas.', 'error');
  const users = getUsers();
  if (users[u]) return showAuthMsg('Cet identifiant est déjà pris.', 'error');
  users[u] = p;
  saveUsers(users);
  currentUser = u;
  localStorage.setItem('dp_session', u);
  initApp();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('dp_session');
  currentUser = null;
  showScreen('authScreen');
});

function showAuthMsg(msg, type='error') {
  const el = document.getElementById('authMessage');
  el.textContent = msg;
  el.className = 'auth-msg ' + type;
}

/* ── MOBILE SIDEBAR ── */
document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('hidden');
});
document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.add('hidden');
}

/* ── NAV ── */
document.querySelectorAll('.nav-item, [data-view]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    const v = el.dataset.view;
    if (!v) return;
    navigateTo(v);
  });
});

function navigateTo(view) {
  if (view === 'new-bl') {
    startNewBL();
  } else if (view === 'dashboard') {
    renderDashboard();
  } else if (view === 'history') {
    renderHistory();
  } else if (view === 'products') {
    renderProducts();
  } else if (view === 'settings') {
    renderSettings();
  }
  switchView(view);
}

/* ══════════════════════════════════════════════
   INIT APP
══════════════════════════════════════════════ */
/* ── PRODUITS DE DÉMONSTRATION (chargés une seule fois si la base est vide) ── */
const DEMO_PRODUCTS = [
  { desc: 'Eau minérale 1.5L (caisse 12)',      price: 480  },
  { desc: 'Huile de table 5L',                  price: 1250 },
  { desc: 'Sucre blanc 50kg',                   price: 4500 },
  { desc: 'Farine type 55 – 50kg',              price: 3200 },
  { desc: 'Lait UHT 1L (caisse 12)',            price: 1080 },
  { desc: 'Café moulu 250g',                    price: 580  },
  { desc: 'Couscous 5kg',                       price: 980  },
  { desc: 'Pâtes alimentaires 500g (carton 20)',price: 1600 },
  { desc: 'Tomates pelées 800g (caisse 12)',    price: 1440 },
  { desc: 'Concentré de tomates 70g (carton 24)',price: 1200},
  { desc: 'Sardines en boîte 125g (carton 50)', price: 3750 },
  { desc: 'Savon de ménage 400g (carton 24)',   price: 1920 },
  { desc: 'Détergent 1kg',                      price: 420  },
  { desc: 'Papier hygiénique (pack 12)',         price: 720  },
  { desc: 'Sel de cuisine 1kg',                 price: 80   },
  { desc: 'Levure chimique 100g',               price: 120  },
  { desc: 'Chips 80g (carton 24)',              price: 1680 },
  { desc: 'Biscuits 200g (carton 12)',          price: 960  },
  { desc: 'Jus de fruits 1L (carton 12)',       price: 1560 },
  { desc: 'Eau de Javel 1L (carton 12)',        price: 840  },
];

function loadDemoProducts() {
  if (getProducts().length > 0) return;   // déjà des produits → ne rien faire
  const withIds = DEMO_PRODUCTS.map(p => ({
    id:    Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    desc:  p.desc,
    price: p.price
  }));
  saveProducts(withIds);
}

function initApp() {
  loadDemoProducts();
  productsDB = getProducts();
  showScreen('appScreen');
  const u = currentUser;
  document.getElementById('userLabel').textContent = u;
  document.getElementById('userAvatar').textContent = u.charAt(0).toUpperCase();

  const now = new Date();
  const h = now.getHours();
  const greet = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  document.getElementById('dashGreeting').textContent = `${greet}, ${u} !`;

  renderDashboard();
  switchView('dashboard');
}

/* ══════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════ */
function renderDashboard() {
  const bls = getBLs();
  const now = new Date();
  const thisMonth = bls.filter(b => {
    const d = new Date(b.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const revenue = thisMonth.reduce((s, b) => s + (b.totalTTC || 0), 0);
  const clients = [...new Set(bls.map(b => b.client).filter(Boolean))];

  document.getElementById('statMonth').textContent    = thisMonth.length;
  document.getElementById('statRevenue').textContent  = fmtNum(revenue);
  document.getElementById('statProducts').textContent = productsDB.length;
  document.getElementById('statClients').textContent  = clients.length;

  const recent = bls.slice(-10).reverse();
  const container = document.getElementById('recentBLs');
  if (!recent.length) {
    container.innerHTML = `<div class="empty-state">Aucun bon de livraison. <a href="#" data-view="new-bl">Créer le premier →</a></div>`;
    container.querySelector('[data-view]')?.addEventListener('click', e => { e.preventDefault(); navigateTo('new-bl'); });
    return;
  }
  container.innerHTML = recent.map(bl => blCard(bl)).join('');
  attachBLCardEvents(container);
}

function blCard(bl) {
  return `<div class="bl-card" data-id="${bl.id}">
    <div class="bl-card-left">
      <div class="bl-card-num">${bl.number || bl.id}</div>
      <div class="bl-card-client">${bl.client || '—'}</div>
      <div class="bl-card-date">${fmtDate(bl.date)}</div>
    </div>
    <div class="bl-card-right">
      <div class="bl-card-total">${fmtNum(bl.totalTTC || 0)} DA</div>
      <div class="bl-card-actions">
        <button class="btn-sm btn-icon" data-action="edit" data-id="${bl.id}" title="Modifier">✏️</button>
        <button class="btn-sm btn-icon" data-action="print" data-id="${bl.id}" title="Imprimer">🖨️</button>
        <button class="btn-sm btn-icon btn-danger-icon" data-action="delete" data-id="${bl.id}" title="Supprimer">🗑️</button>
      </div>
    </div>
  </div>`;
}

function attachBLCardEvents(container) {
  container.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id  = btn.dataset.id;
      const act = btn.dataset.action;
      if (act === 'edit')   loadBLForEdit(id);
      if (act === 'delete') confirmDeleteBL(id);
      if (act === 'print')  printBL(id);
    });
  });
  container.querySelectorAll('.bl-card').forEach(card => {
    card.addEventListener('click', () => loadBLForEdit(card.dataset.id));
  });
}

/* ══════════════════════════════════════════════
   NEW / EDIT BL
══════════════════════════════════════════════ */
function startNewBL() {
  const s = getSettings();
  rowIndex  = 0;
  unsaved   = false;
  currentBL = null;

  document.getElementById('blFormTitle').textContent   = 'Nouveau Bon de Livraison';
  document.getElementById('blFormSubtitle').textContent = 'Remplissez les informations ci-dessous';
  document.getElementById('blRows').innerHTML = '';
  document.getElementById('blNumber').value  = generateBLNumber();
  document.getElementById('blDate').value    = today();
  document.getElementById('blClient').value  = '';
  document.getElementById('blAddress').value = '';
  document.getElementById('blNotes').value   = s.footer || '';
  document.getElementById('tvaSelect').value = String(s.tva ?? 19);
  document.getElementById('blSaveStatus').textContent = '';

  updateTotals();
  updateClientSuggestions();
  updatePrintHeader();
}

function loadBLForEdit(id) {
  const bl = getBLs().find(b => b.id === id);
  if (!bl) return;
  currentBL = bl;
  rowIndex  = 0;
  unsaved   = false;

  document.getElementById('blFormTitle').textContent   = `Modifier — ${bl.number}`;
  document.getElementById('blFormSubtitle').textContent = bl.client || '';
  document.getElementById('blNumber').value  = bl.number  || '';
  document.getElementById('blDate').value    = bl.date    || today();
  document.getElementById('blClient').value  = bl.client  || '';
  document.getElementById('blAddress').value = bl.address || '';
  document.getElementById('blNotes').value   = bl.notes   || '';
  document.getElementById('tvaSelect').value = String(bl.tva ?? 19);
  document.getElementById('blRows').innerHTML = '';

  (bl.rows || []).forEach(row => addRow(row));
  updateTotals();
  updateClientSuggestions();
  updatePrintHeader();
  switchView('new-bl');
}

function generateBLNumber() {
  const s    = getSettings();
  const bls  = getBLs();
  const prefix = s.prefix || 'BL';
  const year = new Date().getFullYear();
  const nums = bls
    .map(b => b.number || '')
    .filter(n => n.startsWith(`${prefix}-${year}`))
    .map(n => parseInt(n.split('-').pop(), 10))
    .filter(n => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${year}-${String(next).padStart(3, '0')}`;
}

/* ── ADD ROW ── */
function addRow(data = {}) {
  rowIndex++;
  const tr = document.createElement('tr');
  tr.dataset.ri = rowIndex;
  tr.innerHTML = `
    <td class="row-num">${rowIndex}</td>
    <td class="desc-cell">
      <select class="descSel">
        <option value="">— rechercher ou saisir —</option>
        ${productsDB.map(p => `<option value="${escHtml(p.desc)}" data-price="${p.price}">${escHtml(p.desc)}</option>`).join('')}
      </select>
    </td>
    <td><input type="number" class="qty-in cell-input" min="1" value="${data.qty ?? 1}"></td>
    <td><input type="number" class="pu-in cell-input" min="0" step="0.01" value="${data.price ?? ''}"></td>
    <td class="sub-cell">0,00</td>
    <td class="no-print"><button class="del-row-btn" title="Supprimer">×</button></td>`;

  const tbody = document.getElementById('blRows');
  tbody.appendChild(tr);

  const sel  = tr.querySelector('.descSel');
  const qty  = tr.querySelector('.qty-in');
  const pu   = tr.querySelector('.pu-in');
  const sub  = tr.querySelector('.sub-cell');
  const del  = tr.querySelector('.del-row-btn');

  // Init Select2
  $(sel).select2({
    placeholder: '— rechercher ou saisir —',
    width: '100%',
    tags: true,
    createTag: p => { const t = $.trim(p.term); return t ? { id: t, text: t, newOption: true } : null; },
    templateResult: d => d.newOption ? $(`<span>➕ <strong>Ajouter:</strong> ${d.text}</span>`) : d.text
  });

  // Pre-fill if editing
  if (data.desc) {
    // Check if option exists
    if (!$(sel).find(`option[value="${data.desc}"]`).length) {
      $(sel).append(new Option(data.desc, data.desc, true, true));
    }
    $(sel).val(data.desc).trigger('change.select2');
  }

  $(sel).on('select2:select', e => {
    const val   = e.params.data.id || e.params.data.text;
    const found = productsDB.find(p => p.desc === val);
    if (found) pu.value = found.price;
    calcSub();
    markUnsaved();
  });

  function calcSub() {
    const total = (parseFloat(qty.value) || 0) * (parseFloat(pu.value) || 0);
    sub.textContent = fmtNum(total);
    updateTotals();
  }

  qty.addEventListener('input', () => { calcSub(); markUnsaved(); });
  pu.addEventListener('input',  () => { calcSub(); markUnsaved(); });

  del.addEventListener('click', () => {
    tr.remove();
    renumberRows();
    updateTotals();
    markUnsaved();
  });

  calcSub();
  return tr;
}

function renumberRows() {
  document.querySelectorAll('#blRows tr').forEach((tr, i) => {
    const n = tr.querySelector('.row-num');
    if (n) n.textContent = i + 1;
  });
  rowIndex = document.querySelectorAll('#blRows tr').length;
}

/* ── TOTALS ── */
function updateTotals() {
  let ht = 0;
  document.querySelectorAll('#blRows .sub-cell').forEach(td => {
    ht += parseFloat(td.textContent.replace(',', '.')) || 0;
  });
  const tvaRate = parseFloat(document.getElementById('tvaSelect').value) || 0;
  const tva     = ht * tvaRate / 100;
  const ttc     = ht + tva;

  document.getElementById('subtotalHT').textContent   = fmtNum(ht);
  document.getElementById('tvaAmount').textContent     = fmtNum(tva);
  document.getElementById('grandTotalTTC').innerHTML   = `<strong>${fmtNum(ttc)}</strong>`;
  document.getElementById('tvaRatePrint').textContent  = tvaRate + '%';
}

document.getElementById('tvaSelect').addEventListener('change', () => { updateTotals(); markUnsaved(); });

/* ── SAVE / LOAD ── */
function collectBL() {
  const rows = [];
  document.querySelectorAll('#blRows tr').forEach(tr => {
    const sel  = tr.querySelector('.descSel');
    const qty  = tr.querySelector('.qty-in');
    const pu   = tr.querySelector('.pu-in');
    const sub  = tr.querySelector('.sub-cell');
    const desc = $(sel).val() || '';
    if (desc) {
      rows.push({
        desc,
        qty:   parseFloat(qty?.value)  || 0,
        price: parseFloat(pu?.value)   || 0,
        sub:   parseFloat(sub?.textContent.replace(',','.')) || 0
      });
    }
  });

  const tvaRate = parseFloat(document.getElementById('tvaSelect').value) || 0;
  const ht      = rows.reduce((s, r) => s + r.sub, 0);
  const tva     = ht * tvaRate / 100;
  const ttc     = ht + tva;

  return {
    id:       currentBL?.id || Date.now().toString(36) + Math.random().toString(36).slice(2,6),
    number:   document.getElementById('blNumber').value.trim()  || generateBLNumber(),
    date:     document.getElementById('blDate').value           || today(),
    client:   document.getElementById('blClient').value.trim()  || '',
    address:  document.getElementById('blAddress').value.trim() || '',
    notes:    document.getElementById('blNotes').value.trim()   || '',
    tva:      tvaRate,
    rows,
    subtotalHT: ht,
    tvaAmount:  tva,
    totalTTC:   ttc,
    savedAt:  new Date().toISOString()
  };
}

function saveBL() {
  const bl    = collectBL();
  const bls   = getBLs();
  const idx   = bls.findIndex(b => b.id === bl.id);
  if (idx >= 0) bls[idx] = bl;
  else bls.push(bl);
  saveBLs(bls);
  currentBL = bl;
  unsaved   = false;

  const status = document.getElementById('blSaveStatus');
  status.textContent = `✓ Sauvegardé à ${new Date().toLocaleTimeString('fr-DZ')}`;
  status.className   = 'save-status ok';
  setTimeout(() => { if (status.textContent.startsWith('✓')) status.textContent = ''; }, 3000);
}

function markUnsaved() {
  unsaved = true;
  const status = document.getElementById('blSaveStatus');
  status.textContent = '● Non sauvegardé';
  status.className   = 'save-status pending';
}

document.getElementById('saveDraftBtn').addEventListener('click', saveBL);

/* ── PRINT ── */
function updatePrintHeader() {
  const s = getSettings();
  document.getElementById('printCompanyName').textContent = s.company || 'Votre Entreprise';
  const det = [s.address, s.phone, s.email, s.rc].filter(Boolean).join(' | ');
  document.getElementById('printCompanyDetails').textContent = det;
}

document.getElementById('printBtn').addEventListener('click', () => {
  syncPrintFields();
  window.print();
});

document.getElementById('exportPdfBtn').addEventListener('click', () => {
  syncPrintFields();
  window.print();
});

function syncPrintFields() {
  document.getElementById('printBLNumber').textContent = document.getElementById('blNumber').value  || '—';
  document.getElementById('printBLDate').textContent   = fmtDate(document.getElementById('blDate').value || today());
  document.getElementById('printClient').textContent   = document.getElementById('blClient').value  || '—';
  document.getElementById('printAddress').textContent  = document.getElementById('blAddress').value || '—';
  document.getElementById('blNotesPrint').textContent  = document.getElementById('blNotes').value   || '';
  updatePrintHeader();
}

function printBL(id) {
  loadBLForEdit(id);
  setTimeout(() => { syncPrintFields(); window.print(); }, 200);
}

document.getElementById('addRowBtn').addEventListener('click', () => { addRow(); markUnsaved(); });

/* ── KEYBOARD ADD ROW ── */
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.target.classList.contains('cell-input'))) {
    e.preventDefault();
    addRow(); markUnsaved();
  }
});

/* ── CLIENT SUGGESTIONS ── */
function updateClientSuggestions() {
  const clients = [...new Set(getBLs().map(b => b.client).filter(Boolean))];
  const dl = document.getElementById('clientSuggestions');
  dl.innerHTML = clients.map(c => `<option value="${escHtml(c)}">`).join('');
}

['blNumber','blDate','blClient','blAddress'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', markUnsaved);
});

/* ══════════════════════════════════════════════
   HISTORY
══════════════════════════════════════════════ */
function renderHistory() {
  const bls  = getBLs().slice().reverse();
  const months = [...new Set(bls.map(b => b.date?.slice(0,7)).filter(Boolean))].sort().reverse();
  const filter = document.getElementById('historyFilter');
  filter.innerHTML = `<option value="all">Tous les mois</option>` +
    months.map(m => `<option value="${m}">${fmtMonth(m)}</option>`).join('');

  renderHistoryList(bls);
}

function renderHistoryList(bls) {
  const container = document.getElementById('historyList');
  if (!bls.length) { container.innerHTML = '<div class="empty-state">Aucun résultat.</div>'; return; }
  container.innerHTML = bls.map(bl => blCard(bl)).join('');
  attachBLCardEvents(container);
}

document.getElementById('historySearch').addEventListener('input', filterHistory);
document.getElementById('historyFilter').addEventListener('change', filterHistory);

function filterHistory() {
  const q   = document.getElementById('historySearch').value.toLowerCase();
  const mon = document.getElementById('historyFilter').value;
  let bls   = getBLs().slice().reverse();
  if (mon !== 'all') bls = bls.filter(b => b.date?.startsWith(mon));
  if (q) bls = bls.filter(b =>
    (b.number||'').toLowerCase().includes(q) ||
    (b.client||'').toLowerCase().includes(q)
  );
  renderHistoryList(bls);
}

async function confirmDeleteBL(id) {
  const bl  = getBLs().find(b => b.id === id);
  const yes = await showModal(`Supprimer le BL <strong>${bl?.number || id}</strong> ?<br>Cette action est irréversible.`);
  if (!yes) return;
  const bls = getBLs().filter(b => b.id !== id);
  saveBLs(bls);
  renderDashboard();
  renderHistory();
}

/* ══════════════════════════════════════════════
   PRODUCTS
══════════════════════════════════════════════ */

/* Garantit que chaque produit a un id unique (migration des anciens produits sans id) */
function ensureProductIds(prods) {
  let changed = false;
  prods.forEach(p => {
    if (!p.id) { p.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6); changed = true; }
  });
  if (changed) saveProducts(prods);
  return prods;
}

/* Mode d'édition courant : null = ajout, string = id du produit en cours d'édition */
let editingProductId = null;

function renderProducts() {
  const prods = ensureProductIds(getProducts());
  document.getElementById('statProducts').textContent = prods.length;
  renderProductsTable(prods);
  setupProductForm();
}

function renderProductsTable(visibleProds) {
  const tbody = document.getElementById('productsTbody');
  if (!visibleProds.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="empty-cell">Aucun produit. Importez un fichier Excel ou ajoutez manuellement.</td></tr>`;
    return;
  }
  /* On stocke l'id du produit dans data-prod-id — jamais l'index du tableau filtré */
  tbody.innerHTML = visibleProds.map(p => `
    <tr>
      <td>${escHtml(p.desc)}</td>
      <td>${fmtNum(p.price)}</td>
      <td class="td-actions">
        <button class="btn-icon" data-prod-edit="${escHtml(p.id)}" title="Modifier">✏️</button>
        <button class="btn-icon btn-danger-icon" data-prod-del="${escHtml(p.id)}" title="Supprimer">🗑️</button>
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('[data-prod-del]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id  = btn.dataset.prodDel;
      /* Toujours lire la liste complète depuis le stockage — pas le tableau filtré */
      const all = getProducts();
      const prod = all.find(p => p.id === id);
      if (!prod) return;
      const yes = await showModal(`Supprimer <strong>${escHtml(prod.desc)}</strong> ?`);
      if (!yes) return;
      saveProducts(all.filter(p => p.id !== id));
      /* Conserver le filtre de recherche actif après suppression */
      applyProductSearch();
      document.getElementById('statProducts').textContent = getProducts().length;
    });
  });

  tbody.querySelectorAll('[data-prod-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id  = btn.dataset.prodEdit;
      const all = getProducts();
      const prod = all.find(p => p.id === id);
      if (!prod) return;
      openEditProduct(prod);
    });
  });
}

function openEditProduct(prod) {
  editingProductId = prod.id;
  document.getElementById('newProdName').value  = prod.desc;
  document.getElementById('newProdPrice').value = prod.price;
  document.getElementById('saveProductBtn').textContent = 'Modifier';
  document.getElementById('addProductForm').classList.remove('hidden');
}

function resetProductForm() {
  editingProductId = null;
  document.getElementById('newProdName').value  = '';
  document.getElementById('newProdPrice').value = '';
  document.getElementById('saveProductBtn').textContent = 'Ajouter';
  document.getElementById('addProductForm').classList.add('hidden');
}

/* Un seul listener sur le bouton Sauvegarder — pas de cloneNode */
function setupProductForm() {
  const btn = document.getElementById('saveProductBtn');
  /* Remplacer une seule fois pour repartir d'un bouton sans listeners accumulés */
  if (btn.dataset.initialized) return;
  btn.dataset.initialized = 'true';

  btn.addEventListener('click', () => {
    const name  = document.getElementById('newProdName').value.trim();
    const price = parseFloat(document.getElementById('newProdPrice').value) || 0;
    if (!name) return;

    const all = getProducts();

    if (editingProductId) {
      /* Modification : on retrouve le produit par son id dans la liste complète */
      const idx = all.findIndex(p => p.id === editingProductId);
      if (idx >= 0) all[idx] = { ...all[idx], desc: name, price };
      saveProducts(all);
    } else {
      /* Ajout d'un nouveau produit */
      all.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), desc: name, price });
      saveProducts(all);
    }

    resetProductForm();
    /* Conserver le filtre de recherche actif après ajout/modification */
    applyProductSearch();
    document.getElementById('statProducts').textContent = getProducts().length;
  });
}

function applyProductSearch() {
  const q = document.getElementById('productSearch').value.toLowerCase();
  const all = getProducts();
  const visible = q ? all.filter(p => p.desc.toLowerCase().includes(q)) : all;
  renderProductsTable(visible);
}

document.getElementById('productSearch').addEventListener('input', applyProductSearch);

/* Excel upload */
document.getElementById('excelUpload').addEventListener('change', function() {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const wb  = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
    const ws  = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(ws);
    const prods = raw.map(r => ({
      desc:  r['Désignation'] || r['Description'] || r['desc'] || r['Designation'] || '',
      price: parseFloat(r['Prix'] || r['Price'] || r['price'] || r['PU'] || 0) || 0
    })).filter(p => p.desc);
    saveProducts(prods);
    document.getElementById('uploadMsg').textContent = `✓ ${prods.length} produits importés avec succès.`;
    document.getElementById('uploadMsg').className   = 'upload-msg ok';
    renderProducts();
    setTimeout(() => { document.getElementById('uploadMsg').textContent = ''; }, 4000);
  };
  reader.readAsArrayBuffer(file);
  this.value = '';
});

/* Manual add */
document.getElementById('addProductBtn').addEventListener('click', () => {
  resetProductForm();
  document.getElementById('addProductForm').classList.remove('hidden');
});
document.getElementById('cancelProductBtn').addEventListener('click', resetProductForm);

/* ══════════════════════════════════════════════
   SETTINGS
══════════════════════════════════════════════ */
function renderSettings() {
  const s = getSettings();
  document.getElementById('settingCompany').value  = s.company  || '';
  document.getElementById('settingAddress').value  = s.address  || '';
  document.getElementById('settingPhone').value    = s.phone    || '';
  document.getElementById('settingEmail').value    = s.email    || '';
  document.getElementById('settingRC').value       = s.rc       || '';
  document.getElementById('settingPrefix').value   = s.prefix   || 'BL';
  document.getElementById('settingTva').value      = String(s.tva ?? 19);
  document.getElementById('settingCurrency').value = s.currency || 'DA';
  document.getElementById('settingFooter').value   = s.footer   || '';
}

document.getElementById('saveSettingsBtn').addEventListener('click', () => {
  saveSettings({
    company:  document.getElementById('settingCompany').value.trim(),
    address:  document.getElementById('settingAddress').value.trim(),
    phone:    document.getElementById('settingPhone').value.trim(),
    email:    document.getElementById('settingEmail').value.trim(),
    rc:       document.getElementById('settingRC').value.trim(),
    prefix:   document.getElementById('settingPrefix').value.trim() || 'BL',
    tva:      parseFloat(document.getElementById('settingTva').value) || 0,
    currency: document.getElementById('settingCurrency').value.trim() || 'DA',
    footer:   document.getElementById('settingFooter').value.trim()
  });
  const msg = document.getElementById('settingsSaved');
  msg.textContent = '✓ Paramètres sauvegardés !';
  msg.className   = 'save-status ok';
  setTimeout(() => { msg.textContent = ''; }, 3000);
});

/* ══════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════ */
function showModal(html) {
  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modal').classList.remove('hidden');
  return new Promise(res => { modalResolve = res; });
}
document.getElementById('modalConfirm').addEventListener('click', () => {
  document.getElementById('modal').classList.add('hidden');
  if (modalResolve) { modalResolve(true); modalResolve = null; }
});
document.getElementById('modalCancel').addEventListener('click', () => {
  document.getElementById('modal').classList.add('hidden');
  if (modalResolve) { modalResolve(false); modalResolve = null; }
});

/* ══════════════════════════════════════════════
   PRINT EVENTS
══════════════════════════════════════════════ */
window.addEventListener('beforeprint', () => {
  syncPrintFields();
  document.querySelectorAll('#blRows tr').forEach(tr => {
    const val = $(tr.querySelector('.descSel')).val();
    tr.style.display = val ? '' : 'none';
  });
  renumberRows();
});
window.addEventListener('afterprint', () => {
  document.querySelectorAll('#blRows tr').forEach(tr => tr.style.display = '');
  renumberRows();
});

/* ══════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════ */
function today() { return new Date().toISOString().split('T')[0]; }
function fmtNum(n) { return Number(n || 0).toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('fr-DZ', { day: '2-digit', month: 'long', year: 'numeric' });
}
function fmtMonth(m) {
  const [y, mo] = m.split('-');
  const d = new Date(+y, +mo - 1, 1);
  return d.toLocaleDateString('fr-DZ', { month: 'long', year: 'numeric' });
}
function escHtml(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ══════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  const session = localStorage.getItem('dp_session');
  if (session) {
    const users = getUsers();
    if (users[session]) {
      currentUser = session;
      initApp();
      return;
    }
  }
  showScreen('authScreen');
});

/* script.js — Enhanced with user accounts, Excel upload, and delivery note calculation */

let rowCount = 0;
let productsDB = [];
let currentUser = null;

const authContainer = document.getElementById('authContainer');
const mainApp = document.getElementById('mainApp');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const authMessage = document.getElementById('authMessage');
const uploadBtn = document.getElementById('uploadBtn');
const excelFileInput = document.getElementById('excelFile');
const uploadMessage = document.getElementById('uploadMessage');
const logoutBtn = document.getElementById('logoutBtn');

const addRowBtn = document.getElementById('addRow');
const productRows = document.getElementById('productRows');
const grandTotalCell = document.getElementById('grandTotal');
const printBtn = document.getElementById('printBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

// Load products for the logged-in user or fallback to the static local JSON file.
function loadProducts() {
  if (currentUser) {
    const userProducts = localStorage.getItem(`products_${currentUser}`);
    if (userProducts) {
      productsDB = JSON.parse(userProducts);
      populateAllSelects();
      if (loadingOverlay) loadingOverlay.classList.add('hidden');
      return;
    }
  }
  fetchProductsFromStatic();
}

async function fetchProductsFromStatic() {
  try {
    const res = await fetch('products.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    productsDB = await res.json();
    populateAllSelects();
  } catch (err) {
    console.error('Failed to load products:', err);
    if (loadingOverlay) {
      loadingOverlay.innerHTML = '<p style="color:red;">Error loading products. Please upload an Excel file.</p>';
    }
  } finally {
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
  }
}

// Authenticate an existing user from localStorage.
function login(username, password) {
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  if (users[username] && users[username] === password) {
    currentUser = username;
    showMainApp();
    loadProducts();
    return true;
  }
  return false;
}

// Create a new user account and save credentials locally.
function signup(username, password) {
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  if (users[username]) {
    return false;
  }
  users[username] = password;
  localStorage.setItem('users', JSON.stringify(users));
  currentUser = username;
  showMainApp();
  loadProducts();
  return true;
}

function logout() {
  currentUser = null;
  showAuth();
}

function showAuth() {
  authContainer.style.display = 'flex';
  mainApp.style.display = 'none';
}

function showMainApp() {
  authContainer.style.display = 'none';
  mainApp.style.display = 'block';
}

// Read the uploaded Excel file, parse rows, and store them per user.
function uploadExcel(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, {type: 'array'});
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet);

    productsDB = json.map(row => ({
      desc: row['Désignation'] || row['Description'] || row['desc'],
      price: parseFloat(row['Prix'] || row['Price'] || row['price'] || 0)
    })).filter(p => p.desc && !isNaN(p.price));

    if (currentUser) {
      localStorage.setItem(`products_${currentUser}`, JSON.stringify(productsDB));
    }
    populateAllSelects();
    uploadMessage.textContent = `Uploaded ${productsDB.length} products successfully!`;
    uploadMessage.style.color = 'green';
  };
  reader.readAsArrayBuffer(file);
}

// Populate a product dropdown and initialize Select2 with tagging support.
function populateSelectOptions(select) {
  while (select.options.length > 1) select.remove(1);

  productsDB.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.desc;
    opt.textContent = p.desc;
    opt.dataset.price = p.price;
    select.appendChild(opt);
  });

  if ($(select).data('select2')) $(select).select2('destroy');

  $(select).select2({
    placeholder: ' recherche ou ajouter ...',
    width: 'resolve',
    tags: true,
    createTag: params => {
      const term = $.trim(params.term);
      if (term === '') return null;
      return { id: term, text: term, newOption: true };
    },
    templateResult: data => {
      if (data.newOption) {
        return $('<span><strong>➕ Add new:</strong> ' + data.text + '</span>');
      }
      return data.text;
    }
  });
}

function populateAllSelects() {
  document.querySelectorAll('.descSelect').forEach(sel => populateSelectOptions(sel));
}

// Add a new row to the delivery note and attach events for price/quantity changes.
function addRow() {
  rowCount++;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="row-number">${rowCount}</td>
    <td>
      <select class="descSelect">
        <option value="">-- sélectionner --</option>
      </select>
    </td>
    <td><input type="number" min="1" value="1" class="qty product-input"></td>
    <td><input type="number" min="0" step="0.01" class="price product-input"></td>
    <td class="subtotal">0.00</td>
    <td><button type="button" class="deleteBtn">X</button></td>
  `;
  productRows.appendChild(tr);

  const select = tr.querySelector('.descSelect');
  const qtyInput = tr.querySelector('.qty');
  const priceInput = tr.querySelector('.price');
  const subtotalCell = tr.querySelector('.subtotal');
  const deleteBtn = tr.querySelector('.deleteBtn');

  populateSelectOptions(select);

  $(select).on('select2:select', function (e) {
    const selectedText = e.params.data.text;
    const found = productsDB.find(p => p.desc === selectedText);
    priceInput.value = found ? found.price : '';
    updateSubtotal();
  });

  select.addEventListener('change', () => {
    const opt = Array.from(select.options).find(o => o.value === select.value);
    const dataPrice = opt ? (opt.dataset.price || '') : '';
    if (dataPrice !== '') {
      const num = parseFloat(String(dataPrice).replace(/[^0-9.\-]/g, ''));
      priceInput.value = isNaN(num) ? '' : num;
    } else {
      priceInput.value = '';
    }
    updateSubtotal();
  });

  function updateSubtotal() {
    const qty = parseFloat(qtyInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    subtotalCell.textContent = (qty * price).toFixed(2);
    updateGrandTotal();
  }

  qtyInput.addEventListener('input', updateSubtotal);
  priceInput.addEventListener('input', updateSubtotal);

  deleteBtn.addEventListener('click', () => {
    tr.remove();
    updateGrandTotal();
    renumberRows();
  });

  updateSubtotal();
}

function updateGrandTotal() {
  let total = 0;
  document.querySelectorAll('.subtotal').forEach(td => {
    total += parseFloat(td.textContent) || 0;
  });
  grandTotalCell.textContent = total.toFixed(2);
}

function renumberRows() {
  let n = 1;
  document.querySelectorAll('#productRows tr').forEach(tr => {
    if (tr.style.display !== 'none') {
      tr.querySelector('.row-number').textContent = n++;
    }
  });
  rowCount = n - 1;
}

window.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = savedUser;
    showMainApp();
    loadProducts();
  } else {
    showAuth();
  }

  const dateField = document.getElementById('dateField');
  if (dateField) dateField.value = new Date().toISOString().split('T')[0];
});

loginBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  if (login(username, password)) {
    localStorage.setItem('currentUser', username);
    authMessage.textContent = '';
  } else {
    authMessage.textContent = 'Invalid username or password';
  }
});

signupBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  if (username && password) {
    if (signup(username, password)) {
      localStorage.setItem('currentUser', username);
      authMessage.textContent = '';
    } else {
      authMessage.textContent = 'Username already exists';
    }
  } else {
    authMessage.textContent = 'Please enter username and password';
  }
});

uploadBtn.addEventListener('click', () => {
  const file = excelFileInput.files[0];
  if (file) {
    uploadExcel(file);
  } else {
    uploadMessage.textContent = 'Please select a file';
    uploadMessage.style.color = 'red';
  }
});

logoutBtn.addEventListener('click', logout);
addRowBtn.addEventListener('click', addRow);

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.classList.contains('product-input')) {
    e.preventDefault();
    addRow();
  }
});

printBtn.addEventListener('click', () => window.print());

window.addEventListener('beforeprint', () => {
  document.querySelectorAll('#productRows tr').forEach(row => {
    const sel = row.querySelector('.descSelect');
    if (sel && (!sel.value || sel.value === '')) row.style.display = 'none';
  });
  renumberRows();
});

window.addEventListener('afterprint', () => {
  document.querySelectorAll('#productRows tr').forEach(row => row.style.display = '');
  renumberRows();
});

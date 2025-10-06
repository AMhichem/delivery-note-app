/* script.js — Final Version with JSON Database + Custom Products + Working Prices */

let rowCount = 0;
let productsDB = [];

const addRowBtn = document.getElementById('addRow');
const productRows = document.getElementById('productRows');
const grandTotalCell = document.getElementById('grandTotal');
const printBtn = document.getElementById('printBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

// ==================== LOAD PRODUCTS.JSON ====================
async function loadProducts() {
  try {
    const res = await fetch('products.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    productsDB = await res.json();
    console.log('✅ Loaded', productsDB.length, 'products');
    populateAllSelects();
  } catch (err) {
    console.error('❌ Failed to load products.json:', err);
    if (loadingOverlay)
      loadingOverlay.innerHTML = '<p style="color:red;">❌ Error loading products.json</p>';
  } finally {
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
  }
}

// ==================== POPULATE SELECT ====================
function populateSelectOptions(select) {
  while (select.options.length > 1) select.remove(1);

  productsDB.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.desc;
    opt.textContent = p.desc;
    opt.dataset.price = p.price;
    select.appendChild(opt);
  });

  // Re-initialize Select2 with tag support
  if ($(select).data('select2')) $(select).select2('destroy');

  $(select).select2({
    placeholder: "recherche...              ",
    width: 'resolve',
    tags: true,
    createTag: params => {
      const term = $.trim(params.term);
      if (term === '') return null;
      return { id: term, text: term, newOption: true };
    },
    templateResult: data => {
      if (data.newOption)
        return $('<span><strong>➕ Add new:</strong> ' + data.text + '</span>');
      return data.text;
    }
  });
}

function populateAllSelects() {
  document.querySelectorAll('.descSelect').forEach(sel => populateSelectOptions(sel));
}

// ==================== ADD ROW ====================
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

  // ============= PRICE AUTO-FILL =============
  // Handle Select2 selection
  $(select).on('select2:select', function (e) {
    const selectedText = e.params.data.text;
    const found = productsDB.find(p => p.desc === selectedText);
    if (found) {
      priceInput.value = found.price;
    } else {
      // new custom product → let user type price
      priceInput.value = '';
    }
    updateSubtotal();
  });

  // Handle normal dropdown change
  select.addEventListener('change', () => {
    const val = select.value;
    const opt = Array.from(select.options).find(o => o.value === val);
    const dataPrice = opt ? (opt.dataset.price || '') : '';
    if (dataPrice !== '') {
      const num = parseFloat(String(dataPrice).replace(/[^0-9.\-]/g, ''));
      priceInput.value = isNaN(num) ? '' : num;
    } else {
      priceInput.value = '';
    }
    updateSubtotal();
  });

  // ============= CALCULATIONS =============
  function updateSubtotal() {
    const qty = parseFloat(qtyInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    subtotalCell.textContent = (qty * price).toFixed(2);
    updateGrandTotal();
  }

  qtyInput.addEventListener('input', updateSubtotal);
  priceInput.addEventListener('input', updateSubtotal);

  // ============= DELETE ROW =============
  deleteBtn.addEventListener('click', () => {
    tr.remove();
    updateGrandTotal();
    renumberRows();
  });

  updateSubtotal();
}

// ==================== TOTALS ====================
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
    if (tr.style.display !== "none") {
      tr.querySelector('.row-number').textContent = n++;
    }
  });
  rowCount = n - 1;
}

// ==================== INITIALIZATION ====================
window.addEventListener('DOMContentLoaded', () => {
  const dateField = document.getElementById("dateField");
  if (dateField) dateField.value = new Date().toISOString().split("T")[0];
  loadProducts();
});

addRowBtn.addEventListener('click', addRow);

document.addEventListener('keydown', e => {
  if (e.key === "Enter" && e.target.classList.contains("product-input")) {
    e.preventDefault();
    addRow();
  }
});

printBtn.addEventListener('click', () => window.print());

// Hide empty rows before print, restore after
window.addEventListener('beforeprint', () => {
  document.querySelectorAll('#productRows tr').forEach(row => {
    const sel = row.querySelector('.descSelect');
    if (sel && (!sel.value || sel.value === "")) row.style.display = "none";
  });
  renumberRows();
});

window.addEventListener('afterprint', () => {
  document.querySelectorAll('#productRows tr').forEach(row => row.style.display = "");
  renumberRows();
});



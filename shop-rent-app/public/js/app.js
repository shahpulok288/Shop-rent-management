import { supabase } from './supabase.js';

// ---------- State ----------
let shops = [];
let currentPage = 'dashboard';
let currentUser = null;

// ---------- Helpers ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function formatMoney(n) {
  return '৳' + Number(n || 0).toLocaleString('en-BD', { maximumFractionDigits: 0 });
}

function monthStart(monthStr) {
  // "2026-11" → "2026-11-01"
  return monthStr + '-01';
}

function currentMonthInput() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function showPage(page) {
  currentPage = page;
  $$('.page').forEach(p => p.classList.add('hidden'));
  $(`#page-${page}`).classList.remove('hidden');
  $$('nav button').forEach(b => {
    b.classList.toggle('active', b.dataset.page === page);
  });

  if (page === 'dashboard') loadDashboard();
  if (page === 'shops') loadShopsTable();
  if (page === 'rent') {
    populateShopSelects();
    loadRecentRent();
  }
  if (page === 'electricity') {
    populateShopSelects();
    loadRecentElectricity();
  }
  if (page === 'reports') {
    $('#report-month').value = currentMonthInput();
  }
}

// ---------- Auth ----------
function showApp() {
  $('#login-screen').classList.add('hidden');
  $('#app').classList.remove('hidden');
}

function showLogin() {
  $('#login-screen').classList.remove('hidden');
  $('#app').classList.add('hidden');
}

async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    showApp();
    return true;
  }
  showLogin();
  return false;
}

$('#login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('#login-email').value.trim();
  const password = $('#login-password').value;
  const errorEl = $('#login-error');

  errorEl.classList.add('hidden');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    errorEl.textContent = error.message;
    errorEl.classList.remove('hidden');
    return;
  }

  currentUser = data.user;
  showApp();
  initAppData();
});

$('#btn-logout')?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  currentUser = null;
  showLogin();
});

// Listen for auth changes (e.g. token refresh / sign out from another tab)
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    currentUser = null;
    showLogin();
  } else if (event === 'SIGNED_IN' && session) {
    currentUser = session.user;
    showApp();
  }
});

// ---------- Data Loading ----------
async function loadShops() {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .order('shop_number');
  if (error) {
    console.error(error);
    alert('Error loading shops. Check your Supabase config.');
    return [];
  }
  shops = data || [];
  return shops;
}

async function loadDashboard() {
  await loadShops();
  const month = currentMonthInput();
  const monthStartDate = monthStart(month);

  // Expected = sum of monthly_rent for active shops
  const expected = shops
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + Number(s.monthly_rent), 0);

  // Collected this month
  const { data: rents } = await supabase
    .from('rent_payments')
    .select('amount, shop_id')
    .eq('rent_month', monthStartDate);

  const collected = (rents || []).reduce((sum, r) => sum + Number(r.amount), 0);
  const outstanding = Math.max(0, expected - collected);

  $('#stat-expected').textContent = formatMoney(expected);
  $('#stat-collected').textContent = formatMoney(collected);
  $('#stat-outstanding').textContent = formatMoney(outstanding);

  // Per-shop status
  const paidShopIds = new Set((rents || []).map(r => r.shop_id));
  const tbody = $('#dashboard-shops-body');
  tbody.innerHTML = shops.map(s => {
    const paid = paidShopIds.has(s.id);
    return `
      <tr>
        <td><strong>${s.shop_number}</strong></td>
        <td>${s.tenant_name || '—'}</td>
        <td>${formatMoney(s.monthly_rent)}</td>
        <td><span class="badge badge-${s.status}">${s.status}</span></td>
        <td>${paid ? '<span class="badge badge-paid">Paid</span>' : '<span class="badge badge-unpaid">Due</span>'}</td>
      </tr>`;
  }).join('');
}

async function loadShopsTable() {
  await loadShops();
  const tbody = $('#shops-body');
  tbody.innerHTML = shops.map(s => `
    <tr>
      <td><input type="radio" name="selected-shop" value="${s.id}" /></td>
      <td><strong>${s.shop_number}</strong></td>
      <td>${s.tenant_name || '—'}</td>
      <td>${s.tenant_phone || '—'}</td>
      <td>${formatMoney(s.monthly_rent)}</td>
      <td>${s.electricity_meter || '—'}</td>
      <td><span class="badge badge-${s.status}">${s.status}</span></td>
    </tr>
  `).join('');
}

function populateShopSelects() {
  const options = shops
    .map(s => `<option value="${s.id}">${s.shop_number}${s.tenant_name ? ' – ' + s.tenant_name : ''}</option>`)
    .join('');
  $('#rent-shop').innerHTML = options;
  $('#elec-shop').innerHTML = options;
}

async function loadRecentRent() {
  const { data } = await supabase
    .from('rent_payments')
    .select('*, shops(shop_number)')
    .order('collection_date', { ascending: false })
    .limit(15);

  const tbody = $('#recent-rent-body');
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="muted">No payments yet</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(r => `
    <tr>
      <td>${r.collection_date}</td>
      <td>${r.shops?.shop_number || '—'}</td>
      <td>${r.rent_month?.slice(0, 7)}</td>
      <td>${formatMoney(r.amount)}</td>
      <td>${r.payment_method}</td>
    </tr>
  `).join('');
}

async function loadRecentElectricity() {
  const { data } = await supabase
    .from('electricity_bills')
    .select('*, shops(shop_number)')
    .order('created_at', { ascending: false })
    .limit(15);

  const tbody = $('#recent-elec-body');
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="muted">No bills yet</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(e => `
    <tr>
      <td>${e.shops?.shop_number || '—'}</td>
      <td>${e.bill_month?.slice(0, 7)}</td>
      <td>${e.units ?? '—'}</td>
      <td>${formatMoney(e.bill_amount)}</td>
      <td>
        <span class="badge ${e.is_paid ? 'badge-paid' : 'badge-unpaid'}">
          ${e.is_paid ? 'Paid' : 'Unpaid'}
        </span>
      </td>
    </tr>
  `).join('');
}

// ---------- Forms ----------
$('#shop-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('#shop-id').value;
  const payload = {
    tenant_name: $('#tenant-name').value || null,
    tenant_phone: $('#tenant-phone').value || null,
    monthly_rent: Number($('#monthly-rent').value) || 0,
    electricity_meter: $('#electricity-meter').value || null,
    security_deposit: Number($('#security-deposit').value) || 0,
    status: $('#shop-status').value,
    notes: $('#shop-notes').value || null
  };

  const { error } = await supabase.from('shops').update(payload).eq('id', id);
  if (error) {
    alert('Error saving shop: ' + error.message);
    return;
  }
  alert('Shop updated');
  $('#shop-form-card').classList.add('hidden');
  loadShopsTable();
  loadDashboard();
});

$('#btn-edit-shop')?.addEventListener('click', () => {
  const selected = document.querySelector('input[name="selected-shop"]:checked');
  if (!selected) {
    alert('Select a shop first');
    return;
  }
  const shop = shops.find(s => s.id === selected.value);
  if (!shop) return;

  $('#shop-id').value = shop.id;
  $('#shop-number').value = shop.shop_number;
  $('#tenant-name').value = shop.tenant_name || '';
  $('#tenant-phone').value = shop.tenant_phone || '';
  $('#monthly-rent').value = shop.monthly_rent;
  $('#electricity-meter').value = shop.electricity_meter || '';
  $('#security-deposit').value = shop.security_deposit || 0;
  $('#shop-status').value = shop.status;
  $('#shop-notes').value = shop.notes || '';
  $('#shop-form-card').classList.remove('hidden');
});

$('#btn-cancel-shop')?.addEventListener('click', () => {
  $('#shop-form-card').classList.add('hidden');
});

$('#rent-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    shop_id: $('#rent-shop').value,
    amount: Number($('#rent-amount').value),
    collection_date: $('#rent-date').value,
    payment_method: $('#rent-method').value,
    rent_month: monthStart($('#rent-month').value),
    notes: $('#rent-notes').value || null
  };

  const { error } = await supabase.from('rent_payments').insert(payload);
  if (error) {
    alert('Error saving payment: ' + error.message);
    return;
  }
  alert('Rent payment saved');
  e.target.reset();
  $('#rent-date').valueAsDate = new Date();
  $('#rent-month').value = currentMonthInput();
  loadRecentRent();
  loadDashboard();
});

$('#elec-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const isPaid = $('#elec-paid').value === 'true';
  const payload = {
    shop_id: $('#elec-shop').value,
    previous_reading: Number($('#elec-prev').value),
    current_reading: Number($('#elec-curr').value),
    bill_amount: Number($('#elec-amount').value),
    bill_month: monthStart($('#elec-month').value),
    is_paid: isPaid,
    payment_date: isPaid ? ($('#elec-pay-date').value || null) : null,
    payment_method: isPaid ? ($('#elec-method').value || null) : null
  };

  const { error } = await supabase.from('electricity_bills').insert(payload);
  if (error) {
    alert('Error saving bill: ' + error.message);
    return;
  }
  alert('Electricity bill saved');
  e.target.reset();
  $('#elec-month').value = currentMonthInput();
  loadRecentElectricity();
});

// Report
$('#btn-generate-report')?.addEventListener('click', async () => {
  const month = $('#report-month').value;
  if (!month) return alert('Select a month');
  const monthStartDate = monthStart(month);

  await loadShops();

  const { data: rents } = await supabase
    .from('rent_payments')
    .select('shop_id, amount')
    .eq('rent_month', monthStartDate);

  const { data: elecs } = await supabase
    .from('electricity_bills')
    .select('shop_id, bill_amount')
    .eq('bill_month', monthStartDate);

  const rentMap = {};
  (rents || []).forEach(r => {
    rentMap[r.shop_id] = (rentMap[r.shop_id] || 0) + Number(r.amount);
  });

  const elecMap = {};
  (elecs || []).forEach(e => {
    elecMap[e.shop_id] = (elecMap[e.shop_id] || 0) + Number(e.bill_amount);
  });

  let totalExpected = 0;
  let totalCollected = 0;
  let totalElec = 0;

  const rows = shops.map(s => {
    const expected = s.status === 'active' ? Number(s.monthly_rent) : 0;
    const collected = rentMap[s.id] || 0;
    const outstanding = Math.max(0, expected - collected);
    const elec = elecMap[s.id] || 0;

    totalExpected += expected;
    totalCollected += collected;
    totalElec += elec;

    return `
      <tr>
        <td>${s.shop_number}</td>
        <td>${formatMoney(expected)}</td>
        <td>${formatMoney(collected)}</td>
        <td>${formatMoney(outstanding)}</td>
        <td>${formatMoney(elec)}</td>
      </tr>`;
  }).join('');

  $('#report-expected').textContent = formatMoney(totalExpected);
  $('#report-collected').textContent = formatMoney(totalCollected);
  $('#report-elec').textContent = formatMoney(totalElec);
  $('#report-body').innerHTML = rows;
  $('#report-content').classList.remove('hidden');
});

// ---------- Navigation ----------
$$('nav button').forEach(btn => {
  btn.addEventListener('click', () => showPage(btn.dataset.page));
});

// ---------- Init ----------
async function initAppData() {
  // Set default dates
  const today = new Date().toISOString().slice(0, 10);
  if ($('#rent-date')) $('#rent-date').value = today;
  if ($('#rent-month')) $('#rent-month').value = currentMonthInput();
  if ($('#elec-month')) $('#elec-month').value = currentMonthInput();
  if ($('#report-month')) $('#report-month').value = currentMonthInput();

  await loadShops();
  showPage('dashboard');
}

async function init() {
  const isLoggedIn = await checkSession();
  if (isLoggedIn) {
    await initAppData();
  }
}

init();
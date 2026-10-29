/* =========================================================
   Little Ledger — script.js
   Vanilla JavaScript. All data lives in your browser's
   localStorage (it does not sync between devices).
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     1. Constants & small helpers
     --------------------------------------------------------- */
  const STORAGE_KEY = 'littleLedger.v1';
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MAX_AMOUNT = 1e12;

  const moneyFmt = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  function $(id) { return document.getElementById(id); }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function pad2(n) { return n < 10 ? '0' + n : String(n); }
  function round2(n) { return Math.round(n * 100) / 100; }
  function fmt(n) { return moneyFmt.format(n); }

  function shortMoney(v) {
    const trim = function (x) { return String(Math.round(x * 100) / 100); };
    if (v === 0) return '₹0';
    if (v >= 1e7) return '₹' + trim(v / 1e7) + 'Cr';
    if (v >= 1e5) return '₹' + trim(v / 1e5) + 'L';
    if (v >= 1e3) return '₹' + trim(v / 1e3) + 'k';
    return '₹' + trim(v);
  }

  function niceMax(v) {
    if (!(v > 0)) return 100;
    const exp = Math.pow(10, Math.floor(Math.log10(v)));
    const f = v / exp;
    let nf;
    if (f <= 1) nf = 1;
    else if (f <= 2) nf = 2;
    else if (f <= 5) nf = 5;
    else nf = 10;
    return nf * exp;
  }

  /* ----- dates (always built from local time, never UTC) ----- */
  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function currentMonthKey() { return todayStr().slice(0, 7); }

  function isMonthKey(k) { return typeof k === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(k); }

  function isValidDate(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const y = parseInt(s.slice(0, 4), 10);
    const m = parseInt(s.slice(5, 7), 10);
    const d = parseInt(s.slice(8, 10), 10);
    if (y < 1900 || y > 2100) return false;
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }

  function parseMonthKey(key) {
    return { y: parseInt(key.slice(0, 4), 10), m: parseInt(key.slice(5, 7), 10) };
  }

  function daysInMonth(key) {
    const p = parseMonthKey(key);
    return new Date(p.y, p.m, 0).getDate();
  }

  function addMonths(key, n) {
  const p = parseMonthKey(key);
  const total = p.y * 12 + (p.m - 1) + n;
  const year = Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12 + 1;
  return year + '-' + pad2(month);

  }

  function monthLabel(key) {
    const p = parseMonthKey(key);
    return MONTH_NAMES[p.m - 1] + ' ' + p.y;
  }

  function monthShortLabel(key) {
    const p = parseMonthKey(key);
    return MONTH_SHORT[p.m - 1] + ' \u2019' + String(p.y).slice(2);
  }

  function formatDate(s) {
    return parseInt(s.slice(8, 10), 10) + ' ' + MONTH_SHORT[parseInt(s.slice(5, 7), 10) - 1] + ' ' + s.slice(0, 4);
  }

  function formatDateLong(s) {
    const y = parseInt(s.slice(0, 4), 10);
    const m = parseInt(s.slice(5, 7), 10);
    const d = parseInt(s.slice(8, 10), 10);
    return DAY_SHORT[new Date(y, m - 1, d).getDay()] + ', ' + d + ' ' + MONTH_SHORT[m - 1] + ' ' + y;
  }

  /* ---------------------------------------------------------
     2. Data: load, clean and save
     --------------------------------------------------------- */
  function emptyStore() {
    return { expenses: [], incomes: [], months: {}, ui: { range: '6' } };
  }

  function numOrNull(v) {
    return (typeof v === 'number' && isFinite(v)) ? v : null;
  }

  function cleanTxns(list) {
    if (!Array.isArray(list)) return [];
    const out = [];
    list.forEach(function (t) {
      if (!t || typeof t !== 'object') return;
      const amount = Number(t.amount);
      if (typeof t.id !== 'string' || typeof t.name !== 'string') return;
      if (!isFinite(amount) || amount <= 0) return;
      if (!isValidDate(t.date)) return;
      out.push({
        id: t.id,
        name: t.name.slice(0, 60),
        amount: round2(amount),
        date: t.date,
        createdAt: Number(t.createdAt) || 0
      });
    });
    return out;
  }

  function loadStore() {
    let raw = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return emptyStore();
    }
    if (!raw) return emptyStore();

    try {
      const parsed = JSON.parse(raw);
      const s = emptyStore();
      s.expenses = cleanTxns(parsed.expenses);
      s.incomes = cleanTxns(parsed.incomes);
      if (parsed.months && typeof parsed.months === 'object') {
        Object.keys(parsed.months).forEach(function (k) {
          if (!isMonthKey(k)) return;
          const m = parsed.months[k] || {};
          s.months[k] = {
            manualIncome: numOrNull(m.manualIncome),
            savings: numOrNull(m.savings),
            startingBalance: numOrNull(m.startingBalance),
            incomeBasis: (m.incomeBasis === 'manual' || m.incomeBasis === 'transactions') ? m.incomeBasis : null
          };
        });
      }
      if (parsed.ui && ['6', '12', 'all'].indexOf(parsed.ui.range) !== -1) {
        s.ui.range = parsed.ui.range;
      }
      return s;
    } catch (e) {
      // Keep a copy of unreadable data instead of overwriting it.
      try { localStorage.setItem(STORAGE_KEY + '.corrupt-backup', raw); } catch (_) { /* ignore */ }
      return emptyStore();
    }
  }

  let store = loadStore();

  function saveStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      return true;
    } catch (e) {
      showToast('Could not save \u2014 your browser blocked storage.', true);
      return false;
    }
  }

  function getMonthData(key) {
    const m = store.months[key];
    return {
      manualIncome: m ? m.manualIncome : null,
      savings: m ? m.savings : null,
      startingBalance: m ? m.startingBalance : null,
      incomeBasis: m ? m.incomeBasis : null
    };
  }

  function setMonthField(key, field, value) {
    if (!store.months[key]) {
      store.months[key] = { manualIncome: null, savings: null, startingBalance: null, incomeBasis: null };
    }
    store.months[key][field] = value;
  }

  function sumForMonth(list, key) {
    let total = 0;
    list.forEach(function (t) {
      if (t.date.slice(0, 7) === key) total += t.amount;
    });
    return round2(total);
  }

  // Everything the screens need for one month.
  function summary(key) {
    const md = getMonthData(key);
    const expTotal = sumForMonth(store.expenses, key);
    const txnIncome = sumForMonth(store.incomes, key);
    const basis = md.incomeBasis || (md.manualIncome !== null ? 'manual' : 'transactions');
    const income = basis === 'manual' ? (md.manualIncome || 0) : txnIncome;
    const start = md.startingBalance || 0;
    return {
      key: key,
      manual: md.manualIncome,
      savings: md.savings,
      startRaw: md.startingBalance,
      start: start,
      basis: basis,
      txnIncome: txnIncome,
      income: income,
      expTotal: expTotal,
      remaining: round2(start + income - expTotal)
    };
  }

  /* ---------------------------------------------------------
     3. App state
     --------------------------------------------------------- */
  const state = { view: 'dashboard', month: currentMonthKey() };

  const VIEW_TEXT = {
    dashboard: ['Dashboard', 'Your money at a glance'],
    expenses: ['Expenses', 'Write down what you spent'],
    income: ['Income', 'Write down money coming in']
  };

  /* ---------------------------------------------------------
     4. Toast (small save confirmation)
     --------------------------------------------------------- */
  let toastTimer = null;

  function showToast(message, isError) {
    const toast = $('toast');
    toast.textContent = message;
    toast.classList.toggle('error', !!isError);
    toast.hidden = false;
    toast.style.animation = 'none';
    void toast.offsetWidth; // restart the animation
    toast.style.animation = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, isError ? 3500 : 2200);
  }

  /* ---------------------------------------------------------
     5. Chart tooltip + bar chart builder
     --------------------------------------------------------- */
  let activeRef = null; // { col, item } — a bar the user clicked/tapped

  function positionTip(col) {
    const tip = $('tooltip');
    const bar = col.querySelector('.bar');
    const rect = bar.getBoundingClientRect();
    const colRect = col.getBoundingClientRect();
    const left = Math.min(Math.max(colRect.left + colRect.width / 2, 80), window.innerWidth - 80);
    const top = Math.max(rect.top - 8, 56);
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }

  function showTip(col, item) {
    const tip = $('tooltip');
    tip.textContent = '';
    tip.appendChild(el('strong', '', item.title));
    tip.appendChild(document.createTextNode(fmt(item.value)));
    tip.hidden = false;
    positionTip(col);
  }

  function hideTip() { $('tooltip').hidden = true; }

  function clearActiveBar() {
    if (activeRef) activeRef.col.classList.remove('active');
    activeRef = null;
  }

  function buildChart(container, items, colWidth) {
    clearActiveBar();
    hideTip();
    container.textContent = '';

    const values = items.map(function (i) { return i.value; });
    const max = niceMax(Math.max.apply(null, values.concat([0])));

    container.style.minWidth = (items.length * colWidth + 56) + 'px';

    const body = el('div', 'chart-body');

    const yAxis = el('div', 'y-axis');
    for (let i = 0; i <= 4; i++) {
      yAxis.appendChild(el('span', '', shortMoney((max * i) / 4)));
    }
    body.appendChild(yAxis);

    const plot = el('div', 'plot');
    const bars = el('div', 'bars');
    const labels = el('div', 'x-labels');

    items.forEach(function (item) {
      const col = el('button', 'bar-col');
      col.type = 'button';
      col.setAttribute('aria-label', item.title + ': ' + fmt(item.value));
      if (item.value <= 0) col.classList.add('zero');
      if (item.current) col.classList.add('current');

      const bar = el('div', 'bar');
      bar.style.height = (item.value / max * 100) + '%';
      col.appendChild(bar);

      col.addEventListener('mouseenter', function () { showTip(col, item); });
      col.addEventListener('focus', function () { showTip(col, item); });
      col.addEventListener('mouseleave', function () {
        if (activeRef) showTip(activeRef.col, activeRef.item);
        else hideTip();
      });
      col.addEventListener('blur', function () {
        if (activeRef) showTip(activeRef.col, activeRef.item);
        else hideTip();
      });
      col.addEventListener('click', function () {
        if (activeRef && activeRef.col === col) {
          clearActiveBar();
          hideTip();
        } else {
          clearActiveBar();
          col.classList.add('active');
          activeRef = { col: col, item: item };
          showTip(col, item);
        }
      });

      bars.appendChild(col);
      labels.appendChild(el('div', 'x-label' + (item.current ? ' selected' : ''), item.label));
    });

    plot.appendChild(bars);
    plot.appendChild(labels);
    body.appendChild(plot);
    container.appendChild(body);
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.bar-col')) {
      clearActiveBar();
      hideTip();
    }
  });
  window.addEventListener('scroll', hideTip, true);
  window.addEventListener('resize', hideTip);

  /* ---------------------------------------------------------
     6. Rendering: Dashboard
     --------------------------------------------------------- */
  function setInputValue(input, value) {
    if (document.activeElement === input) return; // don't overwrite while typing
    input.value = (value === null || value === undefined) ? '' : String(value);
  }

  function renderIncomeAndSavings(s) {
    // --- Total income card ---
    setInputValue($('monthlyIncomeInput'), s.manual);
    $('manualIncomeText').textContent = s.manual === null ? 'Not entered' : fmt(s.manual);
    $('txnIncomeText').textContent = fmt(s.txnIncome);

    const incomeBar = $('incomeBar');
    const incomeCaption = $('incomeBarCaption');
    const basisWord = s.basis === 'manual' ? 'your monthly total' : 'recorded income';
    if (s.income > 0) {
      const pct = Math.min(100, Math.max(0, (s.income - s.expTotal) / s.income * 100));
      incomeBar.style.width = pct + '%';
      incomeCaption.textContent = s.expTotal > s.income
        ? 'Spending is higher than ' + basisWord + ' this month.'
        : Math.round(pct) + '% of ' + basisWord + ' is still unspent.';
    } else {
      incomeBar.style.width = '0%';
      incomeCaption.textContent = 'Add your income to see how much is still unspent.';
    }

    // --- Savings card ---
    setInputValue($('savingsInput'), s.savings);
    $('savingsText').textContent = s.savings === null ? 'Not entered' : fmt(s.savings);

    const savingsBar = $('savingsBar');
    if (s.savings !== null && s.income > 0) {
      const share = s.savings / s.income * 100;
      $('savingsShareText').textContent = (Math.round(share * 10) / 10) + '%';
      savingsBar.style.width = Math.min(100, share) + '%';
    } else {
      $('savingsShareText').textContent = '\u2013';
      savingsBar.style.width = '0%';
    }
  }

  function renderDailyChart() {
    const key = state.month;
    const n = daysInMonth(key);
    const totals = [];
    for (let i = 0; i < n; i++) totals.push(0);

    store.expenses.forEach(function (e) {
      if (e.date.slice(0, 7) === key) {
        totals[parseInt(e.date.slice(8, 10), 10) - 1] += e.amount;
      }
    });

    const today = todayStr();
    let monthTotal = 0;
    const items = totals.map(function (v, i) {
      const dateStr = key + '-' + pad2(i + 1);
      monthTotal += v;
      return {
        label: String(i + 1),
        value: round2(v),
        title: formatDateLong(dateStr),
        current: dateStr === today
      };
    });

    buildChart($('dailyChart'), items, 22);
    $('dailyEmpty').hidden = monthTotal > 0;
    $('dailyTotalChip').textContent = fmt(round2(monthTotal));
  }

  function monthRange() {
    const sel = state.month;
    const range = store.ui.range;
    const out = [];

    if (range === 'all') {
      let first = sel;
      let last = sel;
      store.expenses.forEach(function (e) {
        const k = e.date.slice(0, 7);
        if (k < first) first = k;
        if (k > last) last = k;
      });
      let k = first;
      while (k <= last) { out.push(k); k = addMonths(k, 1); }
      return out;
    }

    const count = parseInt(range, 10);
    for (let i = count - 1; i >= 0; i--) out.push(addMonths(sel, -i));
    return out;
  }

  function renderMonthlyChart() {
    const totals = {};
    store.expenses.forEach(function (e) {
      const k = e.date.slice(0, 7);
      totals[k] = (totals[k] || 0) + e.amount;
    });

    const keys = monthRange();
    const items = keys.map(function (k) {
      return {
        label: monthShortLabel(k),
        value: round2(totals[k] || 0),
        title: monthLabel(k),
        current: k === state.month
      };
    });

    buildChart($('monthlyChart'), items, 48);
    $('monthlyEmpty').hidden = store.expenses.length > 0;

    document.querySelectorAll('.range-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.range === store.ui.range);
    });
  }

  function renderRemaining(s) {
    setInputValue($('startingBalanceInput'), s.startRaw);
    $('incomeBasis').value = s.basis;

    $('remStart').textContent = fmt(s.start);
    $('remIncome').textContent = fmt(s.income);
    $('remExpenses').textContent = fmt(s.expTotal);

    const total = $('remTotal');
    total.textContent = fmt(s.remaining);
    total.classList.toggle('is-negative', s.remaining < 0);

    const notes = [];
    if (s.basis === 'manual' && s.manual === null) {
      notes.push('No monthly income total has been entered, so \u20B90.00 income is counted. Enter a total above or switch to recorded income transactions.');
    }
    if (s.manual !== null && s.txnIncome > 0) {
      notes.push('Your manual total (' + fmt(s.manual) + ') and recorded income transactions (' + fmt(s.txnIncome) +
        ') are separate figures. Only the one selected above is counted, so nothing is added twice.');
    }
    if (s.savings !== null && s.savings > 0) {
      notes.push('You set aside ' + fmt(s.savings) + ' as savings this month. It is shown separately and is not deducted from remaining money a second time.');
    }

    const noteEl = $('remSavingsNote');
    noteEl.textContent = notes.join(' ');
    noteEl.hidden = notes.length === 0;
  }

  function renderDashboard() {
    const s = summary(state.month);
    renderIncomeAndSavings(s);
    renderDailyChart();
    renderMonthlyChart();
    renderRemaining(s);
  }

  /* ---------------------------------------------------------
     7. Rendering: Expense & Income tables
     --------------------------------------------------------- */
  const EXPENSE_CFG = {
    p: 'expense', listKey: 'expenses', word: 'expense',
    nameLabel: 'Expense Name', nameHint: 'expense name',
    addTitle: 'Add Expense', editTitle: 'Edit Expense',
    addBtn: 'Save Expense', editBtn: 'Update Expense',
    amountClass: ''
  };

  const INCOME_CFG = {
    p: 'income', listKey: 'incomes', word: 'income',
    nameLabel: 'Income Name / Source', nameHint: 'income name or source',
    addTitle: 'Add Income', editTitle: 'Edit Income',
    addBtn: 'Save Income', editBtn: 'Update Income',
    amountClass: 'positive'
  };

  function makeCell(text, label, className) {
    const td = el('td', className || '', text);
    td.setAttribute('data-label', label);
    return td;
  }

  function renderTxnTable(cfg) {
    const key = state.month;
    const rows = store[cfg.listKey]
      .filter(function (t) { return t.date.slice(0, 7) === key; })
      .sort(function (a, b) {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1; // newest date first
        return b.createdAt - a.createdAt;                       // then newest entry first
      });

    const body = $(cfg.p + 'Body');
    body.textContent = '';
    const editId = $(cfg.p + 'EditId').value;

    rows.forEach(function (t) {
      const tr = document.createElement('tr');
      tr.dataset.id = t.id;
      if (t.id === editId) tr.className = 'editing';

      tr.appendChild(makeCell(t.name, cfg.nameLabel));
      tr.appendChild(makeCell(fmt(t.amount), 'Amount', ('num ' + cfg.amountClass).trim()));
      tr.appendChild(makeCell(formatDate(t.date), 'Date'));

      const actionCell = el('td');
      actionCell.setAttribute('data-label', 'Action');
      const wrap = el('div', 'row-actions');

      const editBtn = el('button', 'action-btn action-edit', 'Edit');
      editBtn.type = 'button';
      editBtn.dataset.action = 'edit';
      editBtn.setAttribute('aria-label', 'Edit ' + t.name);

      const delBtn = el('button', 'action-btn action-delete', 'Delete');
      delBtn.type = 'button';
      delBtn.dataset.action = 'delete';
      delBtn.setAttribute('aria-label', 'Delete ' + t.name);

      wrap.appendChild(editBtn);
      wrap.appendChild(delBtn);
      actionCell.appendChild(wrap);
      tr.appendChild(actionCell);

      body.appendChild(tr);
    });

    $(cfg.p + 'Empty').hidden = rows.length > 0;
    $(cfg.p + 'Count').textContent = rows.length + (rows.length === 1 ? ' entry' : ' entries');
  }

  function renderExpenses() {
    const s = summary(state.month);
    renderTxnTable(EXPENSE_CFG);
    $('expenseTotal').textContent = fmt(s.expTotal);
    const rem = $('expenseRemaining');
    rem.textContent = fmt(s.remaining);
    rem.classList.toggle('negative', s.remaining < 0);
  }

  function renderIncome() {
    const s = summary(state.month);
    renderTxnTable(INCOME_CFG);
    $('incomeTotalCell').textContent = fmt(s.txnIncome);
  }

  function renderAll() {
    $('monthPicker').value = state.month;
    renderDashboard();
    renderExpenses();
    renderIncome();
  }

  /* ---------------------------------------------------------
     8. Expense & Income forms (add / edit / delete)
     --------------------------------------------------------- */
  function setFieldError(cfg, field, message) {
    $(cfg.p + field + 'Error').textContent = message;
    $(cfg.p + field).classList.add('invalid');
  }

  function clearFormErrors(cfg) {
    ['Name', 'Amount', 'Date'].forEach(function (f) {
      $(cfg.p + f + 'Error').textContent = '';
      $(cfg.p + f).classList.remove('invalid');
    });
  }

  function resetTxnForm(cfg) {
    $(cfg.p + 'Form').reset();
    $(cfg.p + 'EditId').value = '';
    $(cfg.p + 'Date').value = todayStr();
    $(cfg.p + 'FormTitle').textContent = cfg.addTitle;
    $(cfg.p + 'Submit').textContent = cfg.addBtn;
    $(cfg.p + 'Cancel').hidden = true;
    clearFormErrors(cfg);
  }

  function handleTxnSubmit(cfg, ev) {
    ev.preventDefault();
    clearFormErrors(cfg);

    const name = $(cfg.p + 'Name').value.trim();
    const amountRaw = $(cfg.p + 'Amount').value;
    const amount = parseFloat(amountRaw);
    const date = $(cfg.p + 'Date').value;
    let firstBad = null;

    function fail(field, message) {
      setFieldError(cfg, field, message);
      if (!firstBad) firstBad = $(cfg.p + field);
    }

    if (!name) fail('Name', 'Please enter the ' + cfg.nameHint + '.');
    else if (name.length > 60) fail('Name', 'Please keep it under 60 characters.');

    if (amountRaw === '' || !isFinite(amount)) fail('Amount', 'Please enter an amount.');
    else if (amount <= 0) fail('Amount', 'Amount must be more than \u20B90.');
    else if (amount > MAX_AMOUNT) fail('Amount', 'That amount is too large.');

    if (!isValidDate(date)) fail('Date', 'Please choose a valid date.');

    if (firstBad) {
      firstBad.focus();
      return;
    }

    const list = store[cfg.listKey];
    const editId = $(cfg.p + 'EditId').value;
    const existing = editId ? list.find(function (t) { return t.id === editId; }) : null;
    const wasEdit = !!existing;

    if (existing) {
      existing.name = name;
      existing.amount = round2(amount);
      existing.date = date;
    } else {
      list.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        name: name,
        amount: round2(amount),
        date: date,
        createdAt: Date.now()
      });
    }

    // If the date belongs to another month, jump there so the entry is visible.
    const entryMonth = date.slice(0, 7);
    let suffix = '';
    if (entryMonth !== state.month) {
      state.month = entryMonth;
      suffix = ' (showing ' + monthLabel(entryMonth) + ')';
    }

    const saved = saveStore();
    resetTxnForm(cfg);
    renderAll();
    $(cfg.p + 'Name').focus();

    if (saved) {
      const word = cfg.word.charAt(0).toUpperCase() + cfg.word.slice(1);
      showToast('\u2713 ' + word + (wasEdit ? ' updated' : ' saved') + suffix);
    }
  }

  function startEdit(cfg, id) {
    const t = store[cfg.listKey].find(function (x) { return x.id === id; });
    if (!t) return;

    $(cfg.p + 'EditId').value = t.id;
    $(cfg.p + 'Name').value = t.name;
    $(cfg.p + 'Amount').value = t.amount;
    $(cfg.p + 'Date').value = t.date;
    $(cfg.p + 'FormTitle').textContent = cfg.editTitle;
    $(cfg.p + 'Submit').textContent = cfg.editBtn;
    $(cfg.p + 'Cancel').hidden = false;
    clearFormErrors(cfg);
    renderTxnTable(cfg); // highlight the row being edited

    if (window.innerWidth <= 900) {
      $(cfg.p + 'Form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    $(cfg.p + 'Name').focus();
  }

  function deleteTxn(cfg, id) {
    const list = store[cfg.listKey];
    const index = list.findIndex(function (x) { return x.id === id; });
    if (index === -1) return;
    const t = list[index];

    if (!window.confirm('Delete "' + t.name + '" (' + fmt(t.amount) + ')? This cannot be undone.')) return;

    list.splice(index, 1);
    if ($(cfg.p + 'EditId').value === id) resetTxnForm(cfg);

    const saved = saveStore();
    renderAll();
    if (saved) showToast('\u2713 Deleted');
  }

  function setupTxnForm(cfg) {
    $(cfg.p + 'Form').addEventListener('submit', function (ev) { handleTxnSubmit(cfg, ev); });
    $(cfg.p + 'Cancel').addEventListener('click', function () {
      resetTxnForm(cfg);
      renderTxnTable(cfg);
    });

    ['Name', 'Amount', 'Date'].forEach(function (f) {
      $(cfg.p + f).addEventListener('input', function () {
        $(cfg.p + f + 'Error').textContent = '';
        $(cfg.p + f).classList.remove('invalid');
      });
    });

    $(cfg.p + 'Body').addEventListener('click', function (ev) {
      const btn = ev.target.closest('button[data-action]');
      if (!btn) return;
      const row = btn.closest('tr');
      if (!row) return;
      if (btn.dataset.action === 'edit') startEdit(cfg, row.dataset.id);
      else if (btn.dataset.action === 'delete') deleteTxn(cfg, row.dataset.id);
    });

    resetTxnForm(cfg);
  }

  /* ---------------------------------------------------------
     9. Dashboard inputs (monthly income, savings, starting balance)
     --------------------------------------------------------- */
  function setupMonthlyField(formId, inputId, field, label, allowNegative) {
    $(formId).addEventListener('submit', function (ev) {
      ev.preventDefault();
      const input = $(inputId);
      const raw = input.value.trim();

      let value = null;
      if (raw !== '') {
        value = parseFloat(raw);
        if (!isFinite(value)) {
          showToast('Please enter a valid number.', true);
          return;
        }
        if (!allowNegative && value < 0) {
          showToast(label + ' cannot be negative.', true);
          return;
        }
        if (Math.abs(value) > MAX_AMOUNT) {
          showToast('That amount is too large.', true);
          return;
        }
        value = round2(value);
      }

      setMonthField(state.month, field, value);
      const saved = saveStore();
      input.blur();
      renderAll();
      if (saved) {
        showToast(value === null
          ? '\u2713 ' + label + ' cleared for ' + monthLabel(state.month)
          : '\u2713 ' + label + ' saved for ' + monthLabel(state.month));
      }
    });
  }

  function setupBasisSelect() {
    $('incomeBasis').addEventListener('change', function (ev) {
      setMonthField(state.month, 'incomeBasis', ev.target.value);
      const saved = saveStore();
      renderAll();
      if (saved) showToast('\u2713 Income used for remaining money updated');
    });
  }

  function setupRangeButtons() {
    document.querySelectorAll('.range-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        store.ui.range = btn.dataset.range;
        saveStore();
        renderMonthlyChart();
      });
    });
  }

  /* ---------------------------------------------------------
     10. Navigation & month picker
     --------------------------------------------------------- */
  function setView(view) {
    if (!VIEW_TEXT[view]) return;
    state.view = view;

    document.querySelectorAll('.nav-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    document.querySelectorAll('.view').forEach(function (section) {
      section.classList.toggle('active', section.id === 'view-' + view);
    });

    $('pageTitle').textContent = VIEW_TEXT[view][0];
    $('pageSubtitle').textContent = VIEW_TEXT[view][1];

    clearActiveBar();
    hideTip();
    window.scrollTo(0, 0);
    if (view === 'dashboard') renderDashboard(); // charts need to be visible to position tooltips
  }

  function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { setView(btn.dataset.view); });
    });
  }

  function setupMonthPicker() {
    const picker = $('monthPicker');
    picker.value = state.month;
    picker.addEventListener('change', function () {
      if (!isMonthKey(picker.value)) {
        picker.value = state.month; // ignore cleared / invalid input
        return;
      }
      state.month = picker.value;
      renderAll();
    });
  }

  /* ---------------------------------------------------------
     11. Start the app
     --------------------------------------------------------- */
  function init() {
    setupNavigation();
    setupMonthPicker();
    setupTxnForm(EXPENSE_CFG);
    setupTxnForm(INCOME_CFG);
    setupMonthlyField('monthlyIncomeForm', 'monthlyIncomeInput', 'manualIncome', 'Monthly income', false);
    setupMonthlyField('savingsForm', 'savingsInput', 'savings', 'Savings', false);
    setupMonthlyField('startingBalanceForm', 'startingBalanceInput', 'startingBalance', 'Starting balance', true);
    setupBasisSelect();
    setupRangeButtons();
    renderAll();

    // Keep several open tabs of the same browser in step with each other.
    window.addEventListener('storage', function (e) {
      if (e.key === STORAGE_KEY) {
        store = loadStore();
        renderAll();
      }
    });
  }

  init();
})();
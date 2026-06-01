/* ================================================================
   budget.js — 預算管理
   ================================================================ */

function saveExpense() {
  if (!$('ename')?.value) return toast('請輸入費用項目');
  const item = {
    source:    '額外費用',
    type:      $('etype')?.value    || '其他',
    name:      $('ename').value,
    payer:     $('epayer')?.value   || '未定',
    payMethod: $('epm')?.value      || '未定',
    day:       $('eday')?.value     || '',
    mode:      'foreign',
    foreign:   Number($('eforeign')?.value || 0),
    twd:       Number($('etwd')?.value     || 0),
    memo:      $('ememo')?.value    || ''
  };
  if (editingExpenseId) {
    Object.assign(data.expenses.find(e => e.id === editingExpenseId), item);
    editingExpenseId = null;
  } else {
    data.expenses.push({ id: uid(), ...item });
  }
  save();
  toast('已記好這筆費用');
}

function editExpense(id) {
  editingExpenseId = id;
  renderBudget();
  scrollTo(0, 0);
}

function deleteExpense(id) {
  if (!confirm('確定刪除這筆費用？')) return;
  data.expenses = data.expenses.filter(e => e.id !== id);
  if (editingExpenseId === id) editingExpenseId = null;
  save();
}

function clearExpenseForm() {
  editingExpenseId = null;
  renderBudget();
  scrollTo(0, 0);
}

function fillExpenseForm(id) {
  const e = data.expenses.find(x => x.id === id);
  if (!e) return;
  if ($('etype'))    $('etype').value    = e.type       || '其他';
  if ($('ename'))    $('ename').value    = e.name       || '';
  if ($('epayer'))   $('epayer').value   = e.payer      || '未定';
  if ($('eforeign')) $('eforeign').value = moneyForeign(e) || 0;
  if ($('etwd'))     $('etwd').value     = moneyTwd(e)     || 0;
  if ($('epm'))      $('epm').value      = e.payMethod  || '未定';
  if ($('eday'))     $('eday').value     = e.day        || '';
  if ($('ememo'))    $('ememo').value    = e.memo       || '';
}

function syncExpenseMoney(src) {
  const rate = Number(data.trip.rate || 1);
  if (src === 'f') {
    if ($('etwd')) $('etwd').value = Math.round(Number($('eforeign')?.value || 0) * rate);
  } else {
    if ($('eforeign')) $('eforeign').value = Math.round(Number($('etwd')?.value || 0) / rate);
  }
}

function syncPlanMoney(src) {
  const rate = Number(data.trip.rate || 1);
  if (src === 'f') {
    if ($('ptwd')) $('ptwd').value = Math.round(Number($('pforeign')?.value || 0) * rate);
  } else {
    if ($('pforeign')) $('pforeign').value = Math.round(Number($('ptwd')?.value || 0) / rate);
  }
}

/* ── 統計 ── */
function allBudgetItems() {
  const items = [];
  data.expenses.forEach(e => items.push({
    id: e.id, kind: 'expense', editable: true,
    source: e.source || '額外費用', day: e.day || '', type: e.type || '其他',
    name: e.name || '未命名', payer: e.payer || '未定',
    payMethod: e.payMethod || '未定',
    foreign: moneyForeign(e), twd: moneyTwd(e), memo: e.memo || ''
  }));
  data.conns.filter(c => Number(c.fareTwd || 0) > 0 || Number(c.fareForeign || 0) > 0)
    .forEach((c, i) => items.push({
      id: 'conn-' + i, kind: 'conn', editable: false,
      source: '交通', day: '', type: c.mode || '交通',
      name: '行程間交通', payer: c.payer || '未定',
      payMethod: c.payMethod || '未定',
      foreign: Number(c.fareForeign || 0), twd: Number(c.fareTwd || 0), memo: ''
    }));
  return items;
}

function budgetSummaryHtml(items) {
  const total = items.reduce((s, x) => s + (x.twd || 0), 0);
  const byType = {};
  items.forEach(x => {
    if ((x.twd || 0) <= 0) return;
    byType[x.type] = (byType[x.type] || 0) + x.twd;
  });
  const typeCards = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .map(([type, amt]) => `
      <div class="budgetSummaryCard">
        <b>${esc(type)}</b>
        <strong>TWD ${fmt(amt)}</strong>
      </div>`).join('');
  return `
    <div class="budgetSummaryGrid">
      <div class="budgetSummaryCard total">
        <b>總費用</b>
        <strong>TWD ${fmt(total)}</strong>
      </div>
      ${typeCards || '<div class="budgetSummaryCard"><b>尚未有費用</b><strong>TWD 0</strong></div>'}
    </div>`;
}

function budgetListHtml(items) {
  if (!items.length) return '<div class="empty">尚未新增預算</div>';
  return `<div class="budgetList">${items.map(x => `
    <details class="budgetItem">
      <summary>
        <div class="budgetItemTitle">
          <b>${esc(x.name)}</b>
          <span>${esc(x.type)}｜${x.day ? esc(x.day) : '未指定'}｜${esc(x.source)}</span>
        </div>
        <div class="budgetAmount">TWD ${fmt(x.twd)}</div>
      </summary>
      <div class="budgetItemBody">
        <div class="budgetMetaGrid">
          <div><span>付款人</span><b>${esc(travelerName(x.payer))}</b></div>
          <div><span>方式</span><b>${esc(payMethodLabel(x.payMethod))}</b></div>
          <div><span>${esc(data.trip.currency)}</span><b>${fmt(x.foreign)}</b></div>
          <div><span>備註</span><b>${esc(x.memo || '—')}</b></div>
        </div>
        ${x.editable ? `<div class="btns">
          <button class="small" onclick="editExpense('${x.id}')">編輯</button>
          <button class="small" onclick="deleteExpense('${x.id}')">刪除</button>
        </div>` : ''}
      </div>
    </details>`).join('')}</div>`;
}

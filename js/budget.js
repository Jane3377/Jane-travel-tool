/* ================================================================
   budget.js — 費用管理
   ================================================================ */

let _budgetSort       = 'date';
let _budgetFilterType = '';
let _budgetFilterDay  = '';

function saveExpense() {
  if (!$form('ename')?.value) return toast('請輸入費用項目');
  const item = {
    source:    '自訂',
    type:      $form('etype')?.value    || '其他',
    name:      $form('ename').value,
    payer:     $form('epayer')?.value   || '未定',
    payMethod: $form('epm')?.value      || '未定',
    day:       $form('eday')?.value     || '',
    mode:      'foreign',
    foreign:   Number($form('eforeign')?.value || 0),
    twd:       Number($form('etwd')?.value     || 0),
    memo:      $form('ememo')?.value    || ''
  };
  if (editingExpenseId) {
    Object.assign(data.expenses.find(e => e.id === editingExpenseId), item);
    editingExpenseId = null;
  } else {
    data.expenses.push({ id: uid(), ...item });
  }
  save();
  closeAddSheet();
  renderBudget();
  toast('已記好這筆費用');
}

function editExpense(id) {
  openEditSheet('expense', id);
}

function deleteExpense(id) {
  if (!confirm('確定刪除這筆費用？')) return;
  data.expenses = data.expenses.filter(e => e.id !== id);
  if (editingExpenseId === id) editingExpenseId = null;
  save();
  renderBudget();
}

function clearExpenseForm() {
  closeAddSheet();
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
    source: e.source || '自訂', day: e.day || '', type: e.type || '其他',
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

/* ── 篩選排序列 ── */
function budgetFilterBarHtml(items) {
  if (!items.length) return '';
  const types = [...new Set(items.map(x => x.type).filter(Boolean))].sort();
  const days  = [...new Set(items.map(x => x.day).filter(Boolean))].sort();
  return `
    <div class="budgetFilterBar">
      <select class="budgetFilterSel" onchange="_budgetFilterType=this.value;renderBudget()">
        <option value="">全部類型</option>
        ${types.map(t => `<option value="${esc(t)}" ${t===_budgetFilterType?'selected':''}>${esc(t)}</option>`).join('')}
      </select>
      <select class="budgetFilterSel" onchange="_budgetFilterDay=this.value;renderBudget()">
        <option value="">全部日期</option>
        ${days.map(d => `<option value="${esc(d)}" ${d===_budgetFilterDay?'selected':''}>${esc(d)}</option>`).join('')}
      </select>
      <select class="budgetFilterSel" onchange="_budgetSort=this.value;renderBudget()">
        <option value="date"   ${_budgetSort==='date'  ?'selected':''}>依日期</option>
        <option value="amount" ${_budgetSort==='amount'?'selected':''}>金額大到小</option>
      </select>
    </div>`;
}

/* ── 費用明細卡片 ── */
function budgetListHtml(items) {
  let list = items.slice();
  if (_budgetFilterType) list = list.filter(x => x.type === _budgetFilterType);
  if (_budgetFilterDay)  list = list.filter(x => x.day  === _budgetFilterDay);
  if (_budgetSort === 'amount') {
    list.sort((a, b) => (b.twd || 0) - (a.twd || 0));
  } else {
    list.sort((a, b) => {
      const da = a.day || 'zzzz', db = b.day || 'zzzz';
      return da < db ? -1 : da > db ? 1 : 0;
    });
  }
  if (!list.length) return '<div class="empty">尚未新增費用</div>';
  const cur = esc(data.trip.currency || 'KRW');
  const cards = list.map(x => {
    const metaParts = [];
    if (x.day) metaParts.push(x.day);
    const pn = travelerName(x.payer);
    if (pn && pn !== '未定') metaParts.push(pn);
    const pm = payMethodLabel(x.payMethod);
    if (pm && pm !== '未定') metaParts.push(pm);
    const srcBadge = (x.source && x.source !== '自訂')
      ? `<span class="budgetSrcTag">${esc(x.source)}</span>` : '';
    return `
      <div class="budgetCard">
        <div class="budgetCardMain">
          <div class="budgetCardLeft">
            ${srcBadge}<span class="budgetTypeTag">${esc(x.type)}</span>
            <span class="budgetCardName">${esc(x.name)}</span>
            ${x.memo ? `<div class="budgetCardMemo">${esc(x.memo)}</div>` : ''}
          </div>
          <div class="budgetCardAmts">
            <div class="budgetCardTwd">TWD ${fmt(x.twd)}</div>
            ${x.foreign ? `<div class="budgetCardForeign">${cur} ${fmt(x.foreign)}</div>` : ''}
          </div>
        </div>
        ${metaParts.length ? `<div class="budgetCardMeta">${esc(metaParts.join(' · '))}</div>` : ''}
        <div class="budgetCardActions">
          ${x.editable
            ? `<button class="small" onclick="editExpense('${x.id}')">編輯</button>
               <button class="small" onclick="deleteExpense('${x.id}')">刪除</button>`
            : `<span class="budgetAutoTag">自動帶入</span>`}
        </div>
      </div>`;
  }).join('');
  return `<div class="budgetCardList">${cards}</div>`;
}

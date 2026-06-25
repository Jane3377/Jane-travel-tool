/* ================================================================
   budget.js — 費用管理
   ================================================================ */

let _budgetSort       = 'date';
let _budgetFilterType = '';
let _budgetFilterDay  = '';
let _quickExpenseType = '餐飲';

function saveExpense() {
  if (!$form('ename')?.value) return toast('請輸入費用項目');
  const payMode = document.querySelector('input[name="epaymode"]:checked')?.value || 'foreign';
  const item = {
    source:    '自訂',
    type:      $form('etype')?.value    || '其他',
    name:      $form('ename').value,
    payer:     $form('epayer')?.value   || '未定',
    payMethod: $form('epm')?.value      || '未定',
    day:       $form('eday')?.value     || '',
    mode:      payMode,
    foreign:   payMode === 'TWD' ? 0 : Number($form('eforeign')?.value || 0),
    twd:       Number($form('etwd')?.value     || 0),
    expRate:   payMode === 'TWD' ? 0 : Number(document.getElementById('eexprate')?.value || data.trip.rate || 0),
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
  if ($('eexprate')) $('eexprate').value = e.expRate != null ? e.expRate : (data.trip.rate || '');
  const mode = e.mode || (Number(e.foreign) > 0 ? 'foreign' : 'TWD');
  document.querySelectorAll('input[name="epaymode"]').forEach(r => { r.checked = (r.value === mode); });
  updatePayMode();
}

function updatePayMode() {
  const mode = document.querySelector('input[name="epaymode"]:checked')?.value || 'foreign';
  const fw = document.getElementById('foreignWrap');
  if (!fw) return;
  fw.hidden = (mode === 'TWD');
  if (mode === 'TWD') {
    const ef = document.getElementById('eforeign');
    if (ef) ef.value = '';
  }
}

function syncExpenseMoney(src) {
  const mode = document.querySelector('input[name="epaymode"]:checked')?.value || 'foreign';
  if (mode === 'TWD') return;
  const rate = Number(document.getElementById('eexprate')?.value || data.trip.rate || 1);
  const f    = Number($('eforeign')?.value || 0);
  const t    = Number($('etwd')?.value    || 0);
  if (src === 'f') {
    if ($('etwd')) $('etwd').value = Math.round(f * rate);
  } else {
    if (f > 0 && t > 0 && $('eexprate')) $('eexprate').value = (t / f).toFixed(4);
  }
}

function syncExpenseRate() {
  const rate = Number(document.getElementById('eexprate')?.value || 0);
  const f    = Number($('eforeign')?.value || 0);
  if (rate && f && $('etwd')) $('etwd').value = Math.round(f * rate);
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
  const byDay  = {};
  items.forEach(x => {
    if ((x.twd || 0) <= 0) return;
    byType[x.type] = (byType[x.type] || 0) + x.twd;
    if (x.day) byDay[x.day] = (byDay[x.day] || 0) + x.twd;
  });
  const typeCards = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .map(([type, amt]) => `
      <div class="budgetSummaryCard">
        <b>${esc(type)}</b>
        <strong>TWD ${fmt(amt)}</strong>
      </div>`).join('');
  const dayRows = Object.entries(byDay)
    .sort((a, b) => a[0] < b[0] ? -1 : 1)
    .map(([day, amt]) => `
      <div class="budgetDayRow">
        <span class="budgetDayLabel">${esc(day)}</span>
        <span class="budgetDayAmt">TWD ${fmt(amt)}</span>
      </div>`).join('');
  return `
    <div class="budgetSummaryGrid">
      <div class="budgetSummaryCard total">
        <b>總費用</b>
        <strong>TWD ${fmt(total)}</strong>
      </div>
      ${typeCards || '<div class="budgetSummaryCard"><b>尚未有費用</b><strong>TWD 0</strong></div>'}
    </div>
    ${dayRows ? `<div class="budgetDayBreakdown">
      <div class="budgetDayTitle">依日期</div>
      ${dayRows}
    </div>` : ''}`;
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
    // 日期語意標籤
    let dayLabel = '';
    if (x.day) {
      if (x.source === '住宿')    dayLabel = `付款日 ${x.day}`;
      else if (x.source === '行程') dayLabel = `行程日 ${x.day}`;
      else                          dayLabel = x.day;
    }
    const metaParts = [];
    if (dayLabel) metaParts.push(dayLabel);
    const pn = travelerName(x.payer);
    if (pn && pn !== '未定') metaParts.push(pn);
    const pm = payMethodLabel(x.payMethod);
    if (pm && pm !== '未定') metaParts.push(pm);

    // 來源標籤：自訂→自建（藍色），其他來源照顯示
    const srcLabel = x.source === '自訂' ? '自建' : (x.source || '');
    const srcBadge = srcLabel ? `<span class="budgetSrcTag">${esc(srcLabel)}</span>` : '';

    // 金額：行程自動建立且尚未填金額 → 待填金額
    const isUnfilled = x.source === '行程' && !x.twd && !x.foreign;
    const amtHtml = isUnfilled
      ? `<div class="budgetCardPending">待填金額</div>`
      : `<div class="budgetCardTwd">TWD ${fmt(x.twd)}</div>
         ${x.foreign ? `<div class="budgetCardForeign">${cur} ${fmt(x.foreign)}</div>` : ''}`;

    return `
      <div class="budgetCard">
        <div class="budgetCardMain">
          <div class="budgetCardLeft">
            ${srcBadge}<span class="budgetTypeTag">${esc(x.type)}</span>
            <span class="budgetCardName">${esc(x.name)}</span>
            ${x.memo ? `<div class="budgetCardMemo">${esc(x.memo)}</div>` : ''}
          </div>
          <div class="budgetCardAmts">
            ${amtHtml}
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

/* ── 快速記帳 ── */
const QUICK_TYPES = ['餐飲', '交通', '景點', '購物', '住宿', '其他'];

function selectQuickType(type) {
  _quickExpenseType = type;
  document.querySelectorAll('.quickTypeChip').forEach(el => {
    el.classList.toggle('active', el.dataset.type === type);
  });
}

function updateQuickTwdPreview() {
  const foreign = Number(document.getElementById('qforeign')?.value || 0);
  const rate    = Number(data.trip.rate || 0);
  const el      = document.getElementById('qtwdPreview');
  if (!el) return;
  if (!rate) { el.textContent = '（請先在旅遊地設定匯率）'; return; }
  el.textContent = foreign ? `≈ TWD ${fmt(Math.round(foreign * rate))}` : '';
}

function saveQuickExpense() {
  const name    = document.getElementById('qname')?.value?.trim();
  if (!name) return toast('請輸入費用項目');
  const day     = document.getElementById('qday')?.value || '';
  if (!day) return toast('請選擇日期');
  const foreign = Number(document.getElementById('qforeign')?.value || 0);
  const rate    = Number(data.trip.rate || 0);
  const twd     = Math.round(foreign * rate);
  data.expenses.push({
    id: uid(),
    source: '自訂',
    type: _quickExpenseType,
    name,
    payer: '未定',
    payMethod: '未定',
    day,
    mode: 'foreign',
    foreign,
    twd,
    expRate: rate,
    memo: ''
  });
  save();
  closeAddSheet();
  renderBudget();
  toast('已記帳 ✓');
}

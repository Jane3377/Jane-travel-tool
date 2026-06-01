/* ── budget.js ── */

function syncExpenseMoney(src){let rate=Number(data.trip.rate||1);if(src=="f")$("etwd").value=Math.round(Number($("eforeign").value||0)*rate);else $("eforeign").value=Math.round(Number($("etwd").value||0)/rate)}
function fillExpenseForm(id){const e=data.expenses.find(x=>x.id==id);if(!e)return;$("etype").value=e.type||"其他";$("ename").value=e.name||"";$("epayer").value=e.payer||"未定";$("eforeign").value=moneyForeign(e)||0;$("etwd").value=moneyTwd(e)||0;$("epm").value=e.payMethod||"未定";$("eday").value=e.day||"";$("ememo").value=e.memo||""}
function editExpense(id){editingExpenseId=id;renderBudget();scrollTo(0,0)}
function clearExpenseForm(){editingExpenseId=null;renderBudget();scrollTo(0,0)}
function delExpense(id){if(!confirm("確定刪除費用？"))return;data.expenses=data.expenses.filter(x=>x.id!=id);if(editingExpenseId==id)editingExpenseId=null;save()}

/* 預算統計 */
function budgetAllItems(){const items=[];(data.expenses||[]).forEach(x=>{items.push({id:x.id,source:x.source||"預算",day:x.day||"",type:x.type||"其他",name:x.name||"未命名費用",payer:x.payer||"未定",payMethod:x.payMethod||"未定",foreign:moneyForeign(x),twd:moneyTwd(x),memo:x.memo||"",editable:true,kind:"expense"})});(data.conns||[]).filter(c=>Number(c.fareTwd||0)>0||Number(c.fareForeign||0)>0).forEach((c,i)=>{items.push({id:"conn-"+i,source:"交通",day:"",type:c.mode||"交通",name:"行程間交通",payer:c.payer||"未定",payMethod:c.payMethod||"未定",foreign:Number(c.fareForeign||0),twd:Number(c.fareTwd||0),memo:"",editable:false,kind:"conn"})});return items}
function budgetTypeSummary(items){const map={};items.forEach(x=>{const amount=Number(x.twd||0);if(amount<=0)return;const type=x.type||"其他";map[type]=(map[type]||0)+amount});return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([type,total])=>({type,total}))}
function renderBudgetSummary(items){const groups=budgetTypeSummary(items);const total=items.reduce((s,x)=>s+Number(x.twd||0),0);const groupHtml=groups.map(g=>`<div class="budgetSummaryCard"><b>${esc(g.type)}</b><strong>TWD ${fmt(g.total)}</strong></div>`).join("");return`<div class="budgetSummaryGrid"><div class="budgetSummaryCard total"><b>總費用</b><strong>TWD ${fmt(total)}</strong></div>${groupHtml||'<div class="budgetSummaryCard"><b>尚未有費用</b><strong>TWD 0</strong></div>'}</div>`}
function budgetDetailsHtml(items){if(!items.length)return'<div class="empty">尚未新增預算</div>';return`<div class="budgetList">${items.map(x=>`<details class="budgetItem"><summary><div class="budgetItemTitle"><b>${esc(x.name)}</b><span>${esc(x.type)}｜${x.day?esc(x.day):"未指定日期"}｜${esc(x.source)}</span></div><div class="budgetAmount">TWD ${fmt(x.twd)}</div></summary><div class="budgetItemBody"><div class="budgetMetaGrid"><div class="budgetMeta"><span>付款人</span><b>${esc(travelerName(x.payer))}</b></div><div class="budgetMeta"><span>付款方式</span><b>${esc(payMethodLabel(x.payMethod))}</b></div><div class="budgetMeta"><span>${esc(data.trip.currency)}</span><b>${fmt(x.foreign)}</b></div><div class="budgetMeta"><span>備註</span><b>${esc(x.memo||"—")}</b></div></div>${x.editable?`<div class="btns"><button class="small" onclick="editExpense('${x.id}')">編輯</button><button class="small" onclick="delExpense('${x.id}')">刪除</button></div>`:""}</div></details>`).join("")}</div>`}

/* ── Cloudinary 上傳工具 ── */
function renderBudget(){const items=budgetAllItems();$("budgetView").innerHTML=`<div class="section"><div><h2>預算總覽</h2><div class="hint">依費用類型自動分類；新增行程時會自動建立一筆花費，可到這裡編輯金額與付款人。</div></div><button class="iconBtn smallIcon" onclick="clearExpenseForm()">＋</button></div>
${renderBudgetSummary(items)}
<div class="card">
  <div class="three compactMobile">
    <div><label>費用類型</label><select id="etype"><option>機票</option><option>住宿</option><option>網路</option><option>旅平險</option><option>交通票券</option><option>景點票券</option><option>餐飲</option><option>購物</option><option>其他</option></select></div>
    <div><label>項目</label><input id="ename"></div>
    <div><label>付款人</label><select id="epayer">${optsPayer("未定")}</select></div>
  </div>
  <div class="four compactMobile">
    <div><label>${esc(data.trip.currency)} 金額</label><input id="eforeign" type="number" oninput="syncExpenseMoney('f')"></div>
    <div><label>TWD</label><input id="etwd" type="number" oninput="syncExpenseMoney('t')"></div>
    <div><label>付款方式</label><select id="epm">${optsPayMethod("未定")}</select></div>
    <div><label>付款日</label><input id="eday" type="date"><div class="freeDateHint">付款日可留空，也可以早於出發日。</div></div>
  </div>
  <label>備註</label><input id="ememo">
  <div class="btns">
    <button class="btn dark" onclick="saveExpenseForm()">${editingExpenseId?"存好預算":"記一筆花費"}</button>
    ${editingExpenseId?'<button class="btn soft" onclick="clearExpenseForm()">取消編輯 / 新增</button>':""}
    <button class="btn blue" onclick="openRateSearch()">查一下匯率</button>
  </div>
</div>
${budgetDetailsHtml(items)}`;if(editingExpenseId)fillExpenseForm(editingExpenseId)}

/* ── renderPacking（最終版） ── */

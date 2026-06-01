/* ── budget.js：預算管理 ── */
function renderBudget(){let planTotal=data.plans.reduce((s,x)=>s+moneyTwd(x),0),expTotal=data.expenses.reduce((s,x)=>s+moneyTwd(x),0),taxiTotal=data.conns.reduce((s,x)=>s+Number(x.fareTwd||0),0);$("budgetView").innerHTML=`<div class="section"><div><h2>預算總覽</h2><div class="hint">所有費用與行程支出都整合在這裡。</div></div><button class="iconBtn smallIcon" onclick="clearExpenseForm()">＋</button></div><div class="card"><div class="three"><div><label>費用類型</label><select id="etype"><option>機票</option><option>住宿</option><option>網路</option><option>旅平險</option><option>交通票券</option><option>景點票券</option><option>餐飲</option><option>購物</option><option>其他</option></select></div><div><label>項目</label><input id="ename"></div><div><label>付款人</label><select id="epayer">${optsPayer("未定")}</select></div></div><div class="four"><div><label>${esc(data.trip.currency)} 金額</label><input id="eforeign" type="number" oninput="syncExpenseMoney('f')"></div><div><label>TWD</label><input id="etwd" type="number" oninput="syncExpenseMoney('t')"></div><div><label>付款方式</label><select id="epm">${optsPayMethod("未定")}</select></div><div><label>日期</label><select id="eday"><option value="">不指定日期</option>${optsDays()}</select></div></div><label>備註</label><input id="ememo"><div class="btns"><button class="btn dark" onclick="saveExpenseForm()">${editingExpenseId?"儲存預算":"新增費用"}</button>${editingExpenseId?'<button class="btn soft" onclick="clearExpenseForm()">取消編輯 / 新增</button>':""}<button class="btn blue" onclick="openRateSearch()">查看現在匯率</button></div></div><div class="stats"><div class="stat"><span>額外費用 TWD</span><strong>${fmt(expTotal)}</strong></div><div class="stat"><span>行程 TWD</span><strong>${fmt(planTotal)}</strong></div><div class="stat"><span>計程車 TWD</span><strong>${fmt(taxiTotal)}</strong></div><div class="stat"><span>總 TWD</span><strong>${fmt(expTotal+planTotal+taxiTotal)}</strong></div></div><div class="table"><table><thead><tr><th>來源</th><th>日期</th><th>類型</th><th>項目</th><th>付款人</th><th>付款方式</th><th>${esc(data.trip.currency)}</th><th>TWD</th><th></th></tr></thead><tbody>${budgetRows()}</tbody></table></div>`;if(editingExpenseId)fillExpenseForm(editingExpenseId)}
function budgetRows(){let rows=[];data.expenses.forEach(x=>rows.push(`<tr><td>${esc(x.source||"額外費用")}</td><td>${x.day?dayTitle(x.day):"—"}</td><td>${esc(x.type)}</td><td>${esc(x.name)}</td><td>${esc(travelerName(x.payer))}</td><td>${esc(payMethodLabel(x.payMethod))}</td><td>${fmt(moneyForeign(x))}</td><td>${fmt(moneyTwd(x))}</td><td><button class="small" onclick="editExpense('${x.id}')">編輯</button><button class="small" onclick="delExpense('${x.id}')">刪除</button></td></tr>`));data.plans.forEach(p=>rows.push(`<tr><td>行程</td><td>${dayTitle(p.day)}</td><td>${esc(p.type)}</td><td>${esc(p.name)}</td><td>${esc(travelerName(p.payer))}</td><td>${esc(payMethodLabel(p.payMethod))}</td><td>${fmt(moneyForeign(p))}</td><td>${fmt(moneyTwd(p))}</td><td><button class="small" onclick="editPlan('${p.id}')">編輯行程</button></td></tr>`));data.conns.filter(c=>Number(c.fareTwd||0)>0||Number(c.fareForeign||0)>0).forEach(c=>rows.push(`<tr><td>交通</td><td>—</td><td>${esc(c.mode)}</td><td>行程間交通</td><td>${esc(travelerName(c.payer))}</td><td>${esc(payMethodLabel(c.payMethod))}</td><td>${fmt(c.fareForeign||0)}</td><td>${fmt(c.fareTwd||0)}</td><td></td></tr>`));return rows.join("")||'<tr><td colspan="9">尚未新增預算</td></tr>'}function syncExpenseMoney(src){let rate=Number(data.trip.rate||1);if(src=="f")$("etwd").value=Math.round(Number($("eforeign").value||0)*rate);else $("eforeign").value=Math.round(Number($("etwd").value||0)/rate)}function saveExpenseForm(){if(!$("ename").value)return toast("請輸入項目");let item={source:"額外費用",type:$("etype").value,name:$("ename").value,payer:$("epayer").value,payMethod:$("epm").value,day:$("eday").value,mode:"foreign",foreign:Number($("eforeign").value||0),twd:Number($("etwd").value||0),memo:$("ememo").value};if(editingExpenseId){Object.assign(data.expenses.find(x=>x.id==editingExpenseId),item);editingExpenseId=null}else data.expenses.push({id:uid(),...item});save()}function fillExpenseForm(id){let x=data.expenses.find(e=>e.id==id);if(!x)return;$("etype").value=x.type;$("ename").value=x.name;$("epayer").value=x.payer;$("epm").value=x.payMethod||"未定";$("eday").value=x.day||"";$("eforeign").value=moneyForeign(x);$("etwd").value=moneyTwd(x);$("ememo").value=x.memo||""}function editExpense(id){editingExpenseId=id;renderBudget();scrollTo(0,0)}function clearExpenseForm(){editingExpenseId=null;renderBudget();scrollTo(0,0)}function delExpense(id){if(!confirm("確定刪除費用？"))return;data.expenses=data.expenses.filter(x=>x.id!=id);if(editingExpenseId==id)editingExpenseId=null;save()}
function budgetRows(){
  const rows=[];
  data.expenses.forEach(x=>rows.push(`<tr><td>${esc(x.source||"額外費用")}</td><td>${x.day?dayTitle(x.day):"—"}</td><td>${esc(x.type)}</td><td>${esc(x.name)}</td><td>${esc(travelerName(x.payer))}</td><td>${esc(payMethodLabel(x.payMethod))}</td><td>${fmt(moneyForeign(x))}</td><td>${fmt(moneyTwd(x))}</td><td><button class="small" onclick="editExpense('${x.id}')">編輯</button><button class="small" onclick="delExpense('${x.id}')">刪除</button></td></tr>`));

  data.plans
    .filter(p=>!(p.sourceType==="hotel" || p.hotelId || (p.type==="住宿" && p.memo==="由住宿資料帶入")))
    .forEach(p=>rows.push(`<tr><td>行程</td><td>${dayTitle(p.day)}</td><td>${esc(p.type)}</td><td>${esc(p.name)}</td><td>${esc(travelerName(p.payer))}</td><td>${esc(payMethodLabel(p.payMethod))}</td><td>${fmt(moneyForeign(p))}</td><td>${fmt(moneyTwd(p))}</td><td><button class="small" onclick="editPlan('${p.id}')">編輯行程</button></td></tr>`));

  data.conns.filter(c=>Number(c.fareTwd||0)>0||Number(c.fareForeign||0)>0).forEach(c=>rows.push(`<tr><td>交通</td><td>—</td><td>${esc(c.mode)}</td><td>行程間交通</td><td>${esc(travelerName(c.payer))}</td><td>${esc(payMethodLabel(c.payMethod))}</td><td>${fmt(c.fareForeign||0)}</td><td>${fmt(c.fareTwd||0)}</td><td></td></tr>`));
  return rows.join("")||'<tr><td colspan="9">尚未新增預算</td></tr>';
}

function renderBudget(){
  const planTotal=data.plans
    .filter(p=>!(p.sourceType==="hotel" || p.hotelId || (p.type==="住宿" && p.memo==="由住宿資料帶入")))
    .reduce((s,x)=>s+moneyTwd(x),0);
  const expTotal=data.expenses.reduce((s,x)=>s+moneyTwd(x),0);
  const taxiTotal=data.conns.reduce((s,x)=>s+Number(x.fareTwd||0),0);
  $("budgetView").innerHTML=`<div class="section"><div><h2>預算總覽</h2><div class="hint">住宿若已從住宿卡片帶入預算，住宿行程節點不會重複列入行程預算。</div></div><button class="iconBtn smallIcon" onclick="clearExpenseForm()">＋</button></div><div class="card"><div class="three"><div><label>費用類型</label><select id="etype"><option>機票</option><option>住宿</option><option>網路</option><option>旅平險</option><option>交通票券</option><option>景點票券</option><option>餐飲</option><option>購物</option><option>其他</option></select></div><div><label>項目</label><input id="ename"></div><div><label>付款人</label><select id="epayer">${optsPayer("未定")}</select></div></div><div class="four"><div><label>${esc(data.trip.currency)} 金額</label><input id="eforeign" type="number" oninput="syncExpenseMoney('f')"></div><div><label>TWD</label><input id="etwd" type="number" oninput="syncExpenseMoney('t')"></div><div><label>付款方式</label><select id="epm">${optsPayMethod("未定")}</select></div><div><label>日期</label><select id="eday"><option value="">不指定日期</option>${optsDays()}</select></div></div><label>備註</label><input id="ememo"><div class="btns"><button class="btn dark" onclick="saveExpenseForm()">${editingExpenseId?"儲存預算":"新增費用"}</button>${editingExpenseId?'<button class="btn soft" onclick="clearExpenseForm()">取消編輯 / 新增</button>':""}<button class="btn blue" onclick="openRateSearch()">查看現在匯率</button></div></div><div class="stats"><div class="stat"><span>額外費用 TWD</span><strong>${fmt(expTotal)}</strong></div><div class="stat"><span>行程 TWD</span><strong>${fmt(planTotal)}</strong></div><div class="stat"><span>計程車 TWD</span><strong>${fmt(taxiTotal)}</strong></div><div class="stat"><span>總 TWD</span><strong>${fmt(expTotal+planTotal+taxiTotal)}</strong></div></div><div class="table"><table><thead><tr><th>來源</th><th>日期</th><th>類型</th><th>項目</th><th>付款人</th><th>付款方式</th><th>${esc(data.trip.currency)}</th><th>TWD</th><th></th></tr></thead><tbody>${budgetRows()}</tbody></table></div>`;
  if(editingExpenseId)fillExpenseForm(editingExpenseId);
}
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDVmuktIzd29IqgOum2KOchgFZi0ofn4tY",
  authDomain: "travel-tool-50e41.firebaseapp.com",
  projectId: "travel-tool-50e41",
  storageBucket: "travel-tool-50e41.firebasestorage.app",
  messagingSenderId: "3477916876",
  appId: "1:3477916876:web:141919efd392b6b5a60669",
  measurementId: "G-FT2Y6WL5D5"
};

const ALLOWED_EMAIL = "jan33772001@gmail.com";
const CLOUD_TRIP_ID = "main";

let fbApp = null;
let fbAuth = null;
let fbDb = null;
let fbUser = null;
let cloudReady = false;
let cloudSaveTimer = null;
let suppressCloudSave = false;
let cloudUnsub = null;
let lastCloudUpdatedAt = 0;

function saveExpenseForm(){
  if(!$("ename").value)return toast("請輸入費用項目");
  const item={source:"額外費用",type:$("etype").value,name:$("ename").value,payer:$("epayer").value,payMethod:$("epm").value,day:$("eday").value,mode:"foreign",foreign:Number($("eforeign").value||0),twd:Number($("etwd").value||0),memo:$("ememo").value};
  if(editingExpenseId){
    Object.assign(data.expenses.find(e=>e.id==editingExpenseId),item);
    editingExpenseId=null;
  }else{
    data.expenses.push({id:uid(),...item});
  }
  save();
}

function fillExpenseForm(id){
  const e=data.expenses.find(x=>x.id==id);
  if(!e)return;
  $("etype").value=e.type||"其他";
  $("ename").value=e.name||"";
  $("epayer").value=e.payer||"未定";
  $("eforeign").value=moneyForeign(e)||0;
  $("etwd").value=moneyTwd(e)||0;
  $("epm").value=e.payMethod||"未定";
  $("eday").value=e.day||"";
  $("ememo").value=e.memo||"";
}

function renderBudget(){
  const planTotal=data.plans
    .filter(p=>!(p.sourceType==="hotel" || p.hotelId || (p.type==="住宿" && p.memo==="由住宿資料帶入")))
    .reduce((s,x)=>s+moneyTwd(x),0);
  const expTotal=data.expenses.reduce((s,x)=>s+moneyTwd(x),0);
  const taxiTotal=data.conns.reduce((s,x)=>s+Number(x.fareTwd||0),0);
  $("budgetView").innerHTML=`<div class="section"><div><h2>預算總覽</h2><div class="hint">預算付款日可早於出發日或晚於回程日；住宿行程節點不重複列入預算。</div></div><button class="iconBtn smallIcon" onclick="clearExpenseForm()">＋</button></div><div class="card"><div class="three"><div><label>費用類型</label><select id="etype"><option>機票</option><option>住宿</option><option>網路</option><option>旅平險</option><option>交通票券</option><option>景點票券</option><option>餐飲</option><option>購物</option><option>其他</option></select></div><div><label>項目</label><input id="ename"></div><div><label>付款人</label><select id="epayer">${optsPayer("未定")}</select></div></div><div class="four"><div><label>${esc(data.trip.currency)} 金額</label><input id="eforeign" type="number" oninput="syncExpenseMoney('f')"></div><div><label>TWD</label><input id="etwd" type="number" oninput="syncExpenseMoney('t')"></div><div><label>付款方式</label><select id="epm">${optsPayMethod("未定")}</select></div><div><label>付款日</label><input id="eday" type="date"><div class="freeDateHint">付款日不受旅程日期限制，可留空。</div></div></div><label>備註</label><input id="ememo"><div class="btns"><button class="btn dark" onclick="saveExpenseForm()">${editingExpenseId?"儲存預算":"新增費用"}</button>${editingExpenseId?'<button class="btn soft" onclick="clearExpenseForm()">取消編輯 / 新增</button>':""}<button class="btn blue" onclick="openRateSearch()">查看現在匯率</button></div></div><div class="stats"><div class="stat"><span>額外費用 TWD</span><strong>${fmt(expTotal)}</strong></div><div class="stat"><span>行程 TWD</span><strong>${fmt(planTotal)}</strong></div><div class="stat"><span>計程車 TWD</span><strong>${fmt(taxiTotal)}</strong></div><div class="stat"><span>總 TWD</span><strong>${fmt(expTotal+planTotal+taxiTotal)}</strong></div></div><div class="table"><table><thead><tr><th>來源</th><th>日期</th><th>類型</th><th>項目</th><th>付款人</th><th>付款方式</th><th>${esc(data.trip.currency)}</th><th>TWD</th><th></th></tr></thead><tbody>${budgetRows()}</tbody></table></div>`;
  if(editingExpenseId)fillExpenseForm(editingExpenseId);
}

function budgetRows(){
  const rows=[];
  data.expenses.forEach(x=>rows.push(`<tr><td>${esc(x.source||"額外費用")}</td><td>${x.day?esc(x.day):"—"}</td><td>${esc(x.type)}</td><td>${esc(x.name)}</td><td>${esc(travelerName(x.payer))}</td><td>${esc(payMethodLabel(x.payMethod))}</td><td>${fmt(moneyForeign(x))}</td><td>${fmt(moneyTwd(x))}</td><td><button class="small" onclick="editExpense('${x.id}')">編輯</button><button class="small" onclick="delExpense('${x.id}')">刪除</button></td></tr>`));

  data.plans
    .filter(p=>!(p.sourceType==="hotel" || p.hotelId || (p.type==="住宿" && p.memo==="由住宿資料帶入")))
    .forEach(p=>rows.push(`<tr><td>行程</td><td>${dayTitle(p.day)}</td><td>${esc(p.type)}</td><td>${esc(p.name)}</td><td>${esc(travelerName(p.payer))}</td><td>${esc(payMethodLabel(p.payMethod))}</td><td>${fmt(moneyForeign(p))}</td><td>${fmt(moneyTwd(p))}</td><td><button class="small" onclick="editPlan('${p.id}')">編輯行程</button></td></tr>`));

  data.conns.filter(c=>Number(c.fareTwd||0)>0||Number(c.fareForeign||0)>0).forEach(c=>rows.push(`<tr><td>交通</td><td>—</td><td>${esc(c.mode)}</td><td>行程間交通</td><td>${esc(travelerName(c.payer))}</td><td>${esc(payMethodLabel(c.payMethod))}</td><td>${fmt(c.fareForeign||0)}</td><td>${fmt(c.fareTwd||0)}</td><td></td></tr>`));
  return rows.join("")||'<tr><td colspan="9">尚未新增預算</td></tr>';
}
function saveExpenseForm(){
  if(!$("ename").value)return toast("請輸入費用項目");
  const item={source:"額外費用",type:$("etype").value,name:$("ename").value,payer:$("epayer").value,payMethod:$("epm").value,day:$("eday").value,mode:"foreign",foreign:Number($("eforeign").value||0),twd:Number($("etwd").value||0),memo:$("ememo").value};
  if(editingExpenseId){
    Object.assign(data.expenses.find(e=>e.id==editingExpenseId),item);
    editingExpenseId=null;
  }else{
    data.expenses.push({id:uid(),...item});
  }
  save();
  toast("已幫你記好這筆花費！");
}

function renderBudget(){
  const planTotal=data.plans
    .filter(p=>!(p.sourceType==="hotel" || p.hotelId || (p.type==="住宿" && p.memo==="由住宿資料帶入")))
    .reduce((s,x)=>s+moneyTwd(x),0);
  const expTotal=data.expenses.reduce((s,x)=>s+moneyTwd(x),0);
  const taxiTotal=data.conns.reduce((s,x)=>s+Number(x.fareTwd||0),0);
  $("budgetView").innerHTML=`<div class="section"><div><h2>預算總覽</h2><div class="hint">預算付款日可早於出發日或晚於回程日；住宿行程節點不重複列入預算。</div></div><button class="iconBtn smallIcon" onclick="clearExpenseForm()">＋</button></div><div class="card"><div class="three"><div><label>費用類型</label><select id="etype"><option>機票</option><option>住宿</option><option>網路</option><option>旅平險</option><option>交通票券</option><option>景點票券</option><option>餐飲</option><option>購物</option><option>其他</option></select></div><div><label>項目</label><input id="ename"></div><div><label>付款人</label><select id="epayer">${optsPayer("未定")}</select></div></div><div class="four"><div><label>${esc(data.trip.currency)} 金額</label><input id="eforeign" type="number" oninput="syncExpenseMoney('f')"></div><div><label>TWD</label><input id="etwd" type="number" oninput="syncExpenseMoney('t')"></div><div><label>付款方式</label><select id="epm">${optsPayMethod("未定")}</select></div><div><label>付款日</label><input id="eday" type="date"><div class="freeDateHint">付款日可留空，也可以早於出發日。</div></div></div><label>備註</label><input id="ememo"><div class="btns"><button class="btn dark" onclick="saveExpenseForm()">${editingExpenseId?"存好預算":"記一筆花費"}</button>${editingExpenseId?'<button class="btn soft" onclick="clearExpenseForm()">取消編輯 / 新增</button>':""}<button class="btn blue" onclick="openRateSearch()">查一下匯率</button></div></div><div class="stats"><div class="stat"><span>額外費用 TWD</span><strong>${fmt(expTotal)}</strong></div><div class="stat"><span>行程 TWD</span><strong>${fmt(planTotal)}</strong></div><div class="stat"><span>計程車 TWD</span><strong>${fmt(taxiTotal)}</strong></div><div class="stat"><span>總 TWD</span><strong>${fmt(expTotal+planTotal+taxiTotal)}</strong></div></div><div class="table"><table><thead><tr><th>來源</th><th>日期</th><th>類型</th><th>項目</th><th>付款人</th><th>付款方式</th><th>${esc(data.trip.currency)}</th><th>TWD</th><th></th></tr></thead><tbody>${budgetRows()}</tbody></table></div>`;
  if(editingExpenseId)fillExpenseForm(editingExpenseId);
}

function budgetRows(){
  const rows=[];
  data.expenses.forEach(x=>rows.push(`<tr><td>${esc(x.source||"額外費用")}</td><td>${x.day?esc(x.day):"—"}</td><td>${esc(x.type)}</td><td>${esc(x.name)}</td><td>${esc(travelerName(x.payer))}</td><td>${esc(payMethodLabel(x.payMethod))}</td><td>${fmt(moneyForeign(x))}</td><td>${fmt(moneyTwd(x))}</td><td><button class="small" onclick="editExpense('${x.id}')">編輯</button><button class="small" onclick="delExpense('${x.id}')">刪除</button></td></tr>`));

  data.conns.filter(c=>Number(c.fareTwd||0)>0||Number(c.fareForeign||0)>0).forEach(c=>rows.push(`<tr><td>交通</td><td>—</td><td>${esc(c.mode)}</td><td>行程間交通</td><td>${esc(travelerName(c.payer))}</td><td>${esc(payMethodLabel(c.payMethod))}</td><td>${fmt(c.fareForeign||0)}</td><td>${fmt(c.fareTwd||0)}</td><td></td></tr>`));
  return rows.join("")||'<tr><td colspan="9">尚未新增預算</td></tr>';
}

function renderBudget(){
  const expTotal=data.expenses.reduce((s,x)=>s+moneyTwd(x),0);
  const taxiTotal=data.conns.reduce((s,x)=>s+Number(x.fareTwd||0),0);
  $("budgetView").innerHTML=`<div class="section"><div><h2>預算總覽</h2><div class="hint">行程新增時會先幫你建立一筆預算；預算可獨立編輯或刪除，暫時不與行程連動。</div></div><button class="iconBtn smallIcon" onclick="clearExpenseForm()">＋</button></div><div class="card"><div class="three"><div><label>費用類型</label><select id="etype"><option>機票</option><option>住宿</option><option>網路</option><option>旅平險</option><option>交通票券</option><option>景點票券</option><option>餐飲</option><option>購物</option><option>其他</option></select></div><div><label>項目</label><input id="ename"></div><div><label>付款人</label><select id="epayer">${optsPayer("未定")}</select></div></div><div class="four"><div><label>${esc(data.trip.currency)} 金額</label><input id="eforeign" type="number" oninput="syncExpenseMoney('f')"></div><div><label>TWD</label><input id="etwd" type="number" oninput="syncExpenseMoney('t')"></div><div><label>付款方式</label><select id="epm">${optsPayMethod("未定")}</select></div><div><label>付款日</label><input id="eday" type="date"><div class="freeDateHint">付款日可留空，也可以早於出發日。</div></div></div><label>備註</label><input id="ememo"><div class="btns"><button class="btn dark" onclick="saveExpenseForm()">${editingExpenseId?"存好預算":"記一筆花費"}</button>${editingExpenseId?'<button class="btn soft" onclick="clearExpenseForm()">取消編輯 / 新增</button>':""}<button class="btn blue" onclick="openRateSearch()">查一下匯率</button></div></div><div class="stats"><div class="stat"><span>預算 TWD</span><strong>${fmt(expTotal)}</strong></div><div class="stat"><span>計程車 TWD</span><strong>${fmt(taxiTotal)}</strong></div><div class="stat"><span>總 TWD</span><strong>${fmt(expTotal+taxiTotal)}</strong></div></div><div class="table"><table><thead><tr><th>來源</th><th>日期</th><th>類型</th><th>項目</th><th>付款人</th><th>付款方式</th><th>${esc(data.trip.currency)}</th><th>TWD</th><th></th></tr></thead><tbody>${budgetRows()}</tbody></table></div>`;
  if(editingExpenseId)fillExpenseForm(editingExpenseId);
}

const __oldEnsureAccountMenuSyncLine_v26 = ensureAccountMenuSyncLine || function(){};
function budgetAllItems(){
  const items=[];
  (data.expenses||[]).forEach(x=>{
    items.push({
      id:x.id,
      source:x.source||"預算",
      day:x.day||"",
      type:x.type||"其他",
      name:x.name||"未命名費用",
      payer:x.payer||"未定",
      payMethod:x.payMethod||"未定",
      foreign:moneyForeign(x),
      twd:moneyTwd(x),
      memo:x.memo||"",
      editable:true,
      kind:"expense"
    });
  });
  (data.conns||[])
    .filter(c=>Number(c.fareTwd||0)>0||Number(c.fareForeign||0)>0)
    .forEach((c,i)=>{
      items.push({
        id:"conn-"+i,
        source:"交通",
        day:"",
        type:c.mode||"交通",
        name:"行程間交通",
        payer:c.payer||"未定",
        payMethod:c.payMethod||"未定",
        foreign:Number(c.fareForeign||0),
        twd:Number(c.fareTwd||0),
        memo:"",
        editable:false,
        kind:"conn"
      });
    });
  return items;
}

function budgetTypeSummary(items){
  const map={};
  items.forEach(x=>{
    const amount=Number(x.twd||0);
    if(amount<=0)return;
    const type=x.type||"其他";
    map[type]=(map[type]||0)+amount;
  });
  return Object.entries(map)
    .sort((a,b)=>b[1]-a[1])
    .map(([type,total])=>({type,total}));
}

function renderBudgetSummary(items){
  const groups=budgetTypeSummary(items);
  const total=items.reduce((s,x)=>s+Number(x.twd||0),0);
  const groupHtml=groups.map(g=>`<div class="budgetSummaryCard"><b>${esc(g.type)}</b><strong>TWD ${fmt(g.total)}</strong></div>`).join("");
  return `<div class="budgetSummaryGrid">
    <div class="budgetSummaryCard total"><b>總費用</b><strong>TWD ${fmt(total)}</strong></div>
    ${groupHtml || '<div class="budgetSummaryCard"><b>尚未有費用</b><strong>TWD 0</strong></div>'}
  </div>`;
}

function renderBudget(){
  const items=budgetAllItems();
  $("budgetView").innerHTML=`<div class="section"><div><h2>預算總覽</h2><div class="hint">依費用類型自動分類，只顯示已有金額的類別；清單改為卡片式，手機更好操作。</div></div><button class="iconBtn smallIcon" onclick="clearExpenseForm()">＋</button></div>
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
  ${budgetCardRows(items)}`;
  if(editingExpenseId)fillExpenseForm(editingExpenseId);
}

/* 航班段落改為可摺疊 details，並加密度 class */
function budgetAllItems(){
  const items=[];
  (data.expenses||[]).forEach(x=>{
    items.push({
      id:x.id,
      source:x.source||"預算",
      day:x.day||"",
      type:x.type||"其他",
      name:x.name||"未命名費用",
      payer:x.payer||"未定",
      payMethod:x.payMethod||"未定",
      foreign:moneyForeign(x),
      twd:moneyTwd(x),
      memo:x.memo||"",
      editable:true,
      kind:"expense"
    });
  });
  (data.conns||[])
    .filter(c=>Number(c.fareTwd||0)>0||Number(c.fareForeign||0)>0)
    .forEach((c,i)=>{
      items.push({
        id:"conn-"+i,
        source:"交通",
        day:"",
        type:c.mode||"交通",
        name:"行程間交通",
        payer:c.payer||"未定",
        payMethod:c.payMethod||"未定",
        foreign:Number(c.fareForeign||0),
        twd:Number(c.fareTwd||0),
        memo:"",
        editable:false,
        kind:"conn"
      });
    });
  return items;
}

function budgetTypeSummary(items){
  const map={};
  items.forEach(x=>{
    const amount=Number(x.twd||0);
    if(amount<=0)return;
    const type=x.type||"其他";
    map[type]=(map[type]||0)+amount;
  });
  return Object.entries(map)
    .sort((a,b)=>b[1]-a[1])
    .map(([type,total])=>({type,total}));
}

function renderBudgetSummary(items){
  const groups=budgetTypeSummary(items);
  const total=items.reduce((s,x)=>s+Number(x.twd||0),0);
  const groupHtml=groups.map(g=>`<div class="budgetSummaryCard"><b>${esc(g.type)}</b><strong>TWD ${fmt(g.total)}</strong></div>`).join("");
  return `<div class="budgetSummaryGrid">
    <div class="budgetSummaryCard total"><b>總費用</b><strong>TWD ${fmt(total)}</strong></div>
    ${groupHtml || '<div class="budgetSummaryCard"><b>尚未有費用</b><strong>TWD 0</strong></div>'}
  </div>`;
}

function budgetDetailsHtml(items){
  return `<div class="budgetDesktopTable table">
    <table class="budgetDetailTable">
      <thead><tr>
        <th>來源</th>
        <th>日期</th>
        <th>類型</th>
        <th>項目</th>
        <th>付款人</th>
        <th>付款方式</th>
        <th>${esc(data.trip.currency)}</th>
        <th>TWD</th>
        <th>操作</th>
      </tr></thead>
      <tbody>${budgetDesktopRows(items)}</tbody>
    </table>
  </div>
  <div class="budgetMobileCards">${budgetMobileCards(items)}</div>`;
}

function renderBudget(){
  const items=budgetAllItems();
  $("budgetView").innerHTML=`<div class="section"><div><h2>預算總覽</h2><div class="hint">桌機顯示表格，手機顯示對齊卡片；上方依費用類型自動統計。</div></div><button class="iconBtn smallIcon" onclick="clearExpenseForm()">＋</button></div>
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
  ${budgetDetailsHtml(items)}`;
  if(editingExpenseId)fillExpenseForm(editingExpenseId);
}
// 1) 航班 / 住宿來源行程不自動建立預算；口袋景點 / 手動行程仍會建立。
// 不改資料結構，只調整建立預算的小邏輯。
function delExpense(id){
  data.expenses=data.expenses.filter(x=>x.id!=id);
  if(editingExpenseId==id)editingExpenseId=null;
  save();
  toast("已刪除預算");
}

// 3) 新增中國到旅遊國家與城市對應；盡量相容既有 v15 的城市選單流程。
currencyMap["中國"]="CNY";
rateMap["CNY"]=4.35;


/* ── ai.js：AI 功能、行程分享 ── */
function showAIPrompt(){
  let modal=$("aiPromptModal");
  if(!modal){
    document.body.insertAdjacentHTML("beforeend",`<div class="aiPromptModal" id="aiPromptModal"><div class="aiPromptBox"><div class="section"><h3>AI 口袋景點提示詞</h3><button class="iconBtn" onclick="closeAIPrompt()">×</button></div><textarea id="aiPromptText"></textarea><div class="btns"><button class="btn dark" onclick="copyAIPrompt()">複製提示詞</button><button class="btn soft" onclick="closeAIPrompt()">關閉</button></div></div></div>`);
  }
  $("aiPromptText").value=buildSpotPrompt();
  $("aiPromptModal").classList.add("show");
}

function closeAIPrompt(){
  $("aiPromptModal")?.classList.remove("show");
}

function copyAIPrompt(){
  const el=$("aiPromptText");
  el.select();
  document.execCommand("copy");
  toast("已複製提示詞");
}

function v64SafeOpen(url){
  if(typeof openExternal === 'function') return openExternal(url);
  try{ window.open(String(url||''), '_blank', 'noopener,noreferrer'); }catch(e){}
}
function v64Copy(text, doneText='已複製'){
  const t=String(text||'');
  if(navigator.clipboard && window.isSecureContext){
    return navigator.clipboard.writeText(t).then(()=>toast(doneText)).catch(()=>v64FallbackCopy(t,doneText));
  }
  return Promise.resolve(v64FallbackCopy(t,doneText));
}
function v64FallbackCopy(text, doneText){
  const ta=document.createElement('textarea');
  ta.value=String(text||'');
  ta.style.position='fixed';
  ta.style.left='-9999px';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try{ document.execCommand('copy'); toast(doneText || '已複製'); }
  catch(e){ toast('複製失敗，請手動複製'); }
  ta.remove();
}
function v64Clean(v){ return String(v||'').replace(/\s+/g,' ').trim(); }
function v64JsonText(raw){
  if(typeof normalizeImportedJsonText === 'function') return normalizeImportedJsonText(raw);
  let t=String(raw||'').trim();
  if(t.startsWith('```')) t=t.replace(/^```json/i,'').replace(/^```/,'').replace(/```$/,'').trim();
  const first=t.indexOf('{'), last=t.lastIndexOf('}');
  if(first>=0 && last>first) t=t.slice(first,last+1);
  return t;
}
function v64TripContext(){
  const days=(data.days||[]).map(d=>`${d.key}（${d.title}｜${d.label}）`).join('\n') || '尚未設定日期';
  const hotels=(data.hotels||[]).map(h=>`${short(h.start)}~${short(h.end)} ${h.name}${h.addr?'｜'+h.addr:''}${h.note?'｜'+h.note:''}`).join('\n') || '尚未設定住宿';
  const plans=(data.plans||[]).sort((a,b)=>String(a.day).localeCompare(String(b.day))||String(a.start).localeCompare(String(b.start))).map(p=>`${p.day} ${p.start||''}-${p.end||''}｜${p.type||'行程'}｜${p.name}${p.address||p.addr?'｜地址：'+(p.address||p.addr):''}${p.note?'｜注意：'+p.note:''}`).join('\n') || '尚未建立行程';
  const spots=(data.spots||[]).map(s=>`${s.name}｜${s.type||'景點'}｜${s.day||'未排'}｜${s.addr||''}｜${s.memo||''}`).join('\n') || '尚未加入口袋景點';
  const expenses=(data.expenses||[]).map(x=>`${x.type||'費用'}｜${x.name||''}｜TWD ${moneyTwd(x)||0}｜${x.memo||''}`).join('\n') || '尚未新增額外費用';
  const packing=(data.packing||[]).map(x=>`${x.type==='out'?'離開飯店':'出國前'}｜${x.name}｜${x.note||''}`).join('\n') || '尚未建立行李清單';
  return {days,hotels,plans,spots,expenses,packing};
}
function v64BuildPrompt(type, spotId){
  const c=v64TripContext();
  const dest=data.trip?.dest||'未設定';
  const country=data.trip?.country||'未設定';
  const dates=`${data.trip?.start||''} ～ ${data.trip?.end||''}`;
  const travelers=(data.trip?.travelers||[]).join('、') || '未設定';
  const baseInfo=`旅行資料：
- 目的地：${dest}
- 國家 / 區域：${country}
- 日期：${dates}
- 旅伴：${travelers}
- 幣別：${data.trip?.currency||''}

旅行日期：
${c.days}

住宿：
${c.hotels}`;
  if(type==='spots'){
    return `${baseInfo}

請幫我推薦適合這趟旅程的口袋景點、餐廳、咖啡廳、購物點與雨天備案。請考慮交通順路性、旅遊節奏、熱門程度與是否適合第一次造訪。

請只輸出純 JSON，不要 Markdown，不要解釋文字。格式如下：
{
  "janeselect_import_type": "spots",
  "spots": [
    {
      "name": "景點或店名",
      "type": "景點/餐廳/咖啡廳/購物/雨天備案/其他",
      "day": "YYYY-MM-DD，可留空",
      "addr": "地址或區域",
      "memo": "推薦理由、玩法重點、適合時段或注意事項",
      "krName": "若為韓國景點可填韓文名稱，否則留空",
      "krAddress": "若為韓國景點可填韓文地址，否則留空"
    }
  ]
}`;
  }
  if(type==='itinerary'){
    return `${baseInfo}

目前行程：
${c.plans}

口袋景點：
${c.spots}

請幫我檢查這趟行程是否順路、是否太趕、是否有交通時間或安排順序不合理的地方。請提出實用調整建議，但不要替我寫旅遊日記，也不要要求我一定照做。

請輸出兩段：
1. 白話健檢摘要。
2. 純 JSON，格式如下：
{
  "janeselect_import_type": "itinerary_review",
  "summary": "整體建議摘要",
  "items": [
    {
      "day": "YYYY-MM-DD",
      "level": "提醒/建議/注意",
      "title": "建議標題",
      "memo": "具體調整建議"
    }
  ]
}`;
  }
  if(type==='packing'){
    return `${baseInfo}

目前行李清單：
${c.packing}

目前行程：
${c.plans}

請依據目的地、日期、天數、行程型態與住宿移動，補強行李清單。請避免太浮誇，優先列出真的會用到的東西。

請只輸出純 JSON，不要 Markdown，不要解釋文字。格式如下：
{
  "janeselect_import_type": "packing",
  "items": [
    {
      "type": "pre",
      "name": "物品名稱",
      "note": "為什麼建議帶，或使用提醒",
      "checked": false
    },
    {
      "type": "out",
      "name": "離開飯店前要檢查的物品",
      "note": "檢查提醒",
      "checked": false
    }
  ]
}`;
  }
  if(type==='budget'){
    return `${baseInfo}

目前行程：
${c.plans}

目前預算 / 額外費用：
${c.expenses}

請幫我檢查這趟旅程可能漏掉哪些預算項目，例如網卡、機場交通、市區交通、票券、保險、咖啡甜點、伴手禮、行李加購等。金額不要亂估，請預設 TWD 0，讓我匯入後自行調整。

請只輸出純 JSON，不要 Markdown，不要解釋文字。格式如下：
{
  "janeselect_import_type": "budget",
  "items": [
    {
      "type": "交通票券/景點票券/餐飲/購物/網路/旅平險/其他",
      "name": "建議補充的預算項目",
      "mode": "TWD",
      "twd": 0,
      "memo": "為什麼建議補這筆"
    }
  ]
}`;
  }
  if(type==='spot_summary'){
    const s=(data.spots||[]).find(x=>x.id===spotId)||{};
    const q=v64SpotQuery(s);
    return `我正在規劃 ${dest} 旅程，想快速了解這個景點是否值得排入行程。

景點：${s.name||''}
分類：${s.type||''}
地址 / 區域：${s.addr||''}
備註：${s.memo||''}

請幫我整理：
1. 這個景點大概長什麼樣、適合怎麼玩。
2. 建議停留時間。
3. 適合安排在早上、下午或晚上。
4. 附近可順遊的方向。
5. 可能要注意的排隊、交通、天氣或公休日問題。
6. 如果我貼上遊記或搜尋結果連結，請幫我整理重點，不要直接複製原文。

搜尋關鍵字參考：${q}`;
  }
  return '';
}
function v64EnsureAiPromptModal(){
  if($('v64AiPromptModal')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="v64AiModal noPrint" id="v64AiPromptModal" aria-hidden="true">
    <div class="v64AiBox">
      <div class="v64AiHead">
        <div><h3 id="v64AiPromptTitle">AI 輔助</h3><p id="v64AiPromptDesc">複製提示詞後，可貼到 ChatGPT 或 Gemini 使用。</p></div>
        <button type="button" class="iconBtn" onclick="v64CloseAiPrompt()">×</button>
      </div>
      <textarea id="v64AiPromptText"></textarea>
      <div class="btns">
        <button class="btn dark" type="button" onclick="v64OpenAiTarget('chatgpt')">ChatGPT</button>
        <button class="btn blue" type="button" onclick="v64OpenAiTarget('gemini')">Gemini</button>
        <button class="btn soft" type="button" onclick="v64CopyAiPrompt()">複製</button>
        <button class="btn" type="button" onclick="v64CloseAiPrompt()">關閉</button>
      </div>
    </div>
  </div>`);
}
function v64ShowPrompt(type, title, desc, spotId){
  v64EnsureAiPromptModal();
  $('v64AiPromptTitle').textContent=title||'AI 輔助';
  $('v64AiPromptDesc').textContent=desc||'複製提示詞後，可貼到 ChatGPT 或 Gemini 使用。';
  $('v64AiPromptText').value=v64BuildPrompt(type, spotId);
  $('v64AiPromptModal').classList.add('show');
  $('v64AiPromptModal').setAttribute('aria-hidden','false');
}
function v64CloseAiPrompt(){
  $('v64AiPromptModal')?.classList.remove('show');
  $('v64AiPromptModal')?.setAttribute('aria-hidden','true');
}
function v64CopyAiPrompt(){
  const t=$('v64AiPromptText')?.value || '';
  v64Copy(t,'已複製提示詞');
}
function v64OpenAiTarget(target){
  const t=$('v64AiPromptText')?.value || '';
  v64Copy(t,'已複製提示詞');
  v64SafeOpen(target==='gemini' ? 'https://gemini.google.com/app' : 'https://chatgpt.com/');
}

function v64EnsureImportModal(){
  if($('v64AiImportModal')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="v64AiModal noPrint" id="v64AiImportModal" aria-hidden="true">
    <div class="v64AiBox">
      <div class="v64AiHead">
        <div><h3>AI 匯入</h3><p>貼上 AI 回傳的 JSON，系統會先解析成可調整的資料，再新增到目前旅程。</p></div>
        <button type="button" class="iconBtn" onclick="v64CloseImportModal()">×</button>
      </div>
      <textarea id="v64AiImportText" placeholder="請貼上 AI 回傳的 JSON"></textarea>
      <div class="v64ImportPreview" id="v64AiImportPreview">支援：口袋景點、行李清單、預算草稿。AI 不會直接覆蓋既有資料。</div>
      <div class="btns">
        <button class="btn dark" type="button" onclick="v64ImportAiText()">匯入</button>
        <button class="btn soft" type="button" onclick="v64CloseImportModal()">關閉</button>
      </div>
    </div>
  </div>`);
}
function v64OpenImportModal(){
  v64EnsureImportModal();
  $('v64AiImportText').value='';
  $('v64AiImportPreview').textContent='支援：口袋景點、行李清單、預算草稿。AI 不會直接覆蓋既有資料。';
  $('v64AiImportModal').classList.add('show');
  $('v64AiImportModal').setAttribute('aria-hidden','false');
}
function v64CloseImportModal(){
  $('v64AiImportModal')?.classList.remove('show');
  $('v64AiImportModal')?.setAttribute('aria-hidden','true');
}
function v64ArrayFromImport(obj, fallbackKey){
  if(Array.isArray(obj)) return obj;
  if(Array.isArray(obj.items)) return obj.items;
  if(fallbackKey && Array.isArray(obj[fallbackKey])) return obj[fallbackKey];
  if(Array.isArray(obj.spots)) return obj.spots;
  return [];
}
function v64ImportAiObject(obj){
  const type=String(obj.janeselect_import_type || obj.type || '').trim();
  let count=0;
  if(type==='spots' || Array.isArray(obj.spots)){
    const items=v64ArrayFromImport(obj,'spots');
    items.forEach(s=>{
      if(!s || !s.name) return;
      data.spots.push({
        id:uid(),
        name:String(s.name||''),
        type:String(s.type||'景點'),
        day:String(s.day||''),
        addr:String(s.addr||s.address||''),
        memo:String(s.memo||s.note||s.reason||''),
        krName:String(s.krName||s.kr_name||''),
        krAddress:String(s.krAddress||s.kr_address||''),
        source:'ai'
      });
      count++;
    });
    if(count) return {count, label:'口袋景點'};
  }
  if(type==='packing'){
    const items=v64ArrayFromImport(obj,'items');
    items.forEach(x=>{
      if(!x || !x.name) return;
      data.packing.push({
        id:uid(),
        type:String(x.type||data.packView||'pre'),
        name:String(x.name||''),
        note:String(x.note||x.memo||'AI 建議'),
        checked:!!x.checked,
        source:'ai'
      });
      count++;
    });
    if(count) return {count, label:'行李項目'};
  }
  if(type==='budget'){
    const items=v64ArrayFromImport(obj,'items');
    items.forEach(x=>{
      if(!x || !x.name) return;
      data.expenses.push({
        id:uid(),
        source:'AI建議',
        type:String(x.type||'其他'),
        name:String(x.name||''),
        payer:'未定',
        payMethod:'未定',
        day:String(x.day||''),
        mode:String(x.mode||'TWD'),
        foreign:Number(x.foreign||0),
        twd:Number(x.twd||0),
        memo:String(x.memo||x.note||'AI 建議補充，請自行調整金額')
      });
      count++;
    });
    if(count) return {count, label:'預算草稿'};
  }
  if(type==='itinerary_review'){
    const summary = obj.summary || (Array.isArray(obj.items) ? obj.items.map(x=>`${x.day||''} ${x.title||''}：${x.memo||''}`).join('\n') : '');
    if(summary){
      v64ShowImportReview(summary);
      return {count:1, label:'行程健檢摘要'};
    }
  }
  return {count:0, label:'資料'};
}
function v64ShowImportReview(summary){
  v64EnsureImportModal();
  $('v64AiImportPreview').innerHTML = `<b>行程健檢結果</b><br>${esc(summary)}`;
}
function v64ImportAiText(){
  const raw=$('v64AiImportText')?.value || '';
  if(!raw.trim()) return toast('請先貼上 AI 回覆');
  try{
    const obj=JSON.parse(v64JsonText(raw));
    const result=v64ImportAiObject(obj);
    if(!result.count) throw new Error('no items');
    silentSave();
    render();
    v64CloseImportModal();
    toast(`已匯入 ${result.count} 筆${result.label}`);
  }catch(e){
    $('v64AiImportPreview').textContent='匯入失敗：請確認貼上的是純 JSON，且格式符合 AI 提示詞要求。';
  }
}

function v64SpotQuery(s){
  return v64Clean([s?.name, s?.addr, data.trip?.dest].filter(Boolean).join(' '));
}
function v64GoogleSearchUrl(q){
  return 'https://www.google.com/search?q=' + encodeURIComponent(v64Clean(q));
}
function v64YoutubeSearchUrl(q){
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(v64Clean(q));
}
function v64GoogleImageUrl(q){
  return 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(v64Clean(q));
}
function v64OfficialSearchUrl(q){
  return 'https://www.google.com/search?q=' + encodeURIComponent(v64Clean(q + ' official tourism'));
}
function v64OpenSpotExplore(id){
  const s=(data.spots||[]).find(x=>x.id===id);
  if(!s) return toast('找不到景點');
  if(!$('v64SpotExploreModal')){
    document.body.insertAdjacentHTML('beforeend', `<div class="v64AiModal noPrint" id="v64SpotExploreModal" aria-hidden="true">
      <div class="v64AiBox">
        <div class="v64AiHead">
          <div><h3 id="v64ExploreTitle">景點探索</h3><p id="v64ExploreDesc"></p></div>
          <button type="button" class="iconBtn" onclick="v64CloseSpotExplore()">×</button>
        </div>
        <div class="v64ExploreQuery" id="v64ExploreQuery"></div>
        <div class="v64ExploreGrid" id="v64ExploreActions"></div>
      </div>
    </div>`);
  }
  const q=v64SpotQuery(s);
  $('v64ExploreTitle').textContent=s.name || '景點探索';
  $('v64ExploreDesc').textContent=[s.type, s.addr].filter(Boolean).join('｜') || '快速查找遊記、影片、打卡與官方資料。';
  $('v64ExploreQuery').innerHTML=`搜尋關鍵字：<b>${esc(q)}</b>`;
  const actions=[
    ['遊記', v64GoogleSearchUrl(q + ' 遊記 怎麼玩')],
    ['影片', v64YoutubeSearchUrl(q + ' vlog')],
    ['打卡', v64GoogleImageUrl(q + ' 打卡 照片')],
    ['官方', v64OfficialSearchUrl(q)],
    ['AI 摘要', null]
  ];
  $('v64ExploreActions').innerHTML=actions.map((a,i)=>`<button class="btn ${i===0?'dark':i===4?'pink':'soft'}" type="button" data-v64-explore="${i}">${esc(a[0])}</button>`).join('');
  $('v64ExploreActions').querySelectorAll('[data-v64-explore]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const idx=Number(btn.dataset.v64Explore);
      if(idx===4) return v64ShowPrompt('spot_summary','AI 摘要','可把搜尋結果或遊記連結一起貼給 AI，整理成玩法重點。',id);
      v64SafeOpen(actions[idx][1]);
    });
  });
  $('v64SpotExploreModal').classList.add('show');
  $('v64SpotExploreModal').setAttribute('aria-hidden','false');
}
function v64CloseSpotExplore(){
  $('v64SpotExploreModal')?.classList.remove('show');
  $('v64SpotExploreModal')?.setAttribute('aria-hidden','true');
}

function v64AiBarHtml(kind){
  if(kind==='spots'){
    return `<div class="v64AiBar" id="v64AiBar-spots">
      <div class="v64AiBarHead"><div><b>AI 輔助</b><span>找景點、匯入 AI 回覆，或針對單一景點探索遊記與影片。</span></div></div>
      <div class="v64AiActions">
        <button class="btn pink compact" onclick="v64ShowPrompt('spots','AI 找景點','請 AI 依目前旅程推薦口袋景點，並回傳可匯入 JSON。')">AI 找景點</button>
        <button class="btn blue compact" onclick="v64OpenImportModal()">AI 匯入</button>
      </div>
    </div>`;
  }
  if(kind==='planner'){
    return `<div class="v64AiBar" id="v64AiBar-planner">
      <div class="v64AiBarHead"><div><b>AI 輔助</b><span>檢查行程順路性與節奏，不會自動改動你的行程。</span></div></div>
      <div class="v64AiActions">
        <button class="btn pink compact" onclick="v64ShowPrompt('itinerary','AI 健檢','請 AI 檢查行程順不順、會不會太趕。')">AI 健檢</button>
        <button class="btn blue compact" onclick="v64OpenImportModal()">AI 匯入</button>
      </div>
    </div>`;
  }
  if(kind==='packing'){
    return `<div class="v64AiBar" id="v64AiBar-packing">
      <div class="v64AiBarHead"><div><b>AI 輔助</b><span>依目的地、天數與行程補強行李清單。</span></div></div>
      <div class="v64AiActions">
        <button class="btn pink compact" onclick="v64ShowPrompt('packing','AI 行李','請 AI 產生可匯入的行李清單。')">AI 行李</button>
        <button class="btn blue compact" onclick="v64OpenImportModal()">AI 匯入</button>
      </div>
    </div>`;
  }
  if(kind==='budget'){
    return `<div class="v64AiBar" id="v64AiBar-budget">
      <div class="v64AiBarHead"><div><b>AI 輔助</b><span>檢查可能漏掉的預算項目，匯入後金額預設 0 讓你自行調整。</span></div></div>
      <div class="v64AiActions">
        <button class="btn pink compact" onclick="v64ShowPrompt('budget','AI 預算','請 AI 檢查可能漏掉的預算項目。')">AI 預算</button>
        <button class="btn blue compact" onclick="v64OpenImportModal()">AI 匯入</button>
      </div>
    </div>`;
  }
  return '';
}
function v64ReplaceOldSpotAiBar(){
  const root=$('spotsView');
  if(!root) return;
  root.querySelectorAll('#v64AiBar-spots').forEach(x=>x.remove());
  const old=[...root.querySelectorAll('.card')].find(card=>/AI 景點提示詞|匯入口袋景點/.test(card.textContent||''));
  if(old){
    old.outerHTML=v64AiBarHtml('spots');
  }else{
    const section=root.querySelector('.section');
    section?.insertAdjacentHTML('afterend', v64AiBarHtml('spots'));
  }
}
function v64AddSpotExploreButtons(){
  const root=$('spotsView');
  if(!root) return;
  root.querySelectorAll('.card').forEach(card=>{
    if(!card.querySelector('.place')) return;
    if(card.querySelector('[data-v64-spot-explore]')) return;
    const btns=card.querySelector('.btns');
    if(!btns) return;
    const m=(btns.innerHTML||'').match(/editSpot\('([^']+)'\)/) || (btns.innerHTML||'').match(/useSpot\('([^']+)'\)/);
    if(!m) return;
    const id=m[1];
    btns.insertAdjacentHTML('afterbegin', `<button class="btn soft compact v64SpotExploreBtn" data-v64-spot-explore="${id}" onclick="v64OpenSpotExplore('${id}')">探索</button>`);
  });
}
function v64PatchSpots(){
  v64ReplaceOldSpotAiBar();
  v64AddSpotExploreButtons();
}
function v64InsertAiBar(viewId, kind){
  const root=$(viewId);
  if(!root) return;
  root.querySelectorAll(`#v64AiBar-${kind}`).forEach(x=>x.remove());
  const section=root.querySelector('.section');
  if(section) section.insertAdjacentHTML('afterend', v64AiBarHtml(kind));
}
function v64UpdateFooterVersion(){
  document.querySelectorAll('footer strong,.siteFooterVersion').forEach(el=>el.textContent=V64_VERSION_SHORT);
  if(typeof v637EnsureFooter === 'function') v637EnsureFooter();
}
try{
  if(typeof v637FooterHtml === 'function'){
    v637FooterHtml = function(){
      return `<footer id="siteFooter" class="siteFooter noPrint">
        <div class="siteFooterBrand">貞選旅管家 <span>Janeselect Travel Manager</span></div>
        <div class="siteFooterVersion">${esc(V64_VERSION_SHORT)}</div>
        <div class="siteFooterLinks">
          <button type="button" onclick="v637PolicyToast('服務條款')">服務條款</button><span>・</span>
          <button type="button" onclick="v637PolicyToast('隱私權政策')">隱私權政策</button><span>・</span>
          <button type="button" onclick="v637PolicyToast('聯絡我們')">聯絡我們</button>
        </div>
        <div class="siteFooterCopy">© 2026 Janeselect Travel Manager. All rights reserved.</div>
      </footer>`;
    };
  }
  if(typeof v641UpdateFooterVersion === 'function'){
    v641UpdateFooterVersion = v64UpdateFooterVersion;
  }
}catch(e){}

const v64OriginalRenderSpots = typeof renderSpots === 'function' ? renderSpots : null;
if(v64OriginalRenderSpots && !v64OriginalRenderSpots.__v64AiWrapped){
  renderSpots = function(...args){
    const r=v64OriginalRenderSpots.apply(this,args);
    setTimeout(v64PatchSpots,0);
    return r;
  };
  renderSpots.__v64AiWrapped=true;
}
const v64OriginalRenderPlanner = typeof renderPlanner === 'function' ? renderPlanner : null;
if(v64OriginalRenderPlanner && !v64OriginalRenderPlanner.__v64AiWrapped){
  renderPlanner = function(...args){
    const r=v64OriginalRenderPlanner.apply(this,args);
    setTimeout(()=>v64InsertAiBar('plannerView','planner'),0);
    return r;
  };
  renderPlanner.__v64AiWrapped=true;
}
const v64OriginalRenderPacking = typeof renderPacking === 'function' ? renderPacking : null;
if(v64OriginalRenderPacking && !v64OriginalRenderPacking.__v64AiWrapped){
  renderPacking = function(...args){
    const r=v64OriginalRenderPacking.apply(this,args);
    setTimeout(()=>v64InsertAiBar('packingView','packing'),0);
    return r;
  };
  renderPacking.__v64AiWrapped=true;
}
const v64OriginalRenderBudget = typeof renderBudget === 'function' ? renderBudget : null;
if(v64OriginalRenderBudget && !v64OriginalRenderBudget.__v64AiWrapped){
  renderBudget = function(...args){
    const r=v64OriginalRenderBudget.apply(this,args);
    setTimeout(()=>v64InsertAiBar('budgetView','budget'),0);
    return r;
  };
  renderBudget.__v64AiWrapped=true;
}

/* 說明頁：最新更新紀錄只保留最新版，其他歷史更新移除。 */
renderHelp = function(){
  const allowed = (typeof ALLOWED_EMAIL !== 'undefined') ? ALLOWED_EMAIL : '';
  $('helpView').innerHTML=`<div class="section"><div><h2>說明與備份</h2><div class="hint">工具使用方式、AI 輔助、資料備份與還原放在這裡。</div></div></div>
  <div class="card" id="v64UpdateLog">
    <h3>最新更新紀錄</h3>
    <div class="box mint"><b>${esc(V64_VERSION_TEXT)}</b><br>AI 輔助整合到各功能頁：口袋景點可 AI 找景點與匯入，行程可 AI 健檢，行李與預算可由 AI 產生 JSON 後貼回匯入；口袋景點新增「探索」快速開啟遊記、影片、打卡、官方資料與 AI 摘要。旅遊書日記不交給 AI，保留個人回憶。</div>
  </div>
  <div class="card"><h3>AI 輔助使用方式</h3><div class="box blue">在口袋景點、行程、行李、預算頁使用 AI 按鈕。ChatGPT / Gemini 會先複製提示詞再開新分頁；AI 回覆 JSON 後可用「AI 匯入」貼回網站。匯入只新增資料，不會自動覆蓋既有內容。</div></div>
  <div class="card"><h3>Firebase 跨裝置同步</h3><div class="box mint">登入授權 Google 帳號後，旅遊資料會同步到 Firestore。照片本體仍存在 Cloudinary，Firestore 只保存圖片網址與旅行資料。</div><div class="btns"><button class="btn dark" onclick="saveToCloudNow()">立即同步到雲端</button><button class="btn blue" onclick="loadFromCloud()">載入雲端資料</button></div>${allowed?`<div class="cloudHint">目前授權 email：${esc(allowed)}</div>`:''}</div>
  <div class="card"><h3>備份資料</h3><div class="box blue">匯出備份會下載 JSON。匯入備份會覆蓋目前資料。若要修改國家或日期，建議先匯出備份。</div><div class="btns"><button class="btn dark" onclick="exportBackup()">匯出備份</button><label class="btn soft" style="display:inline-block">匯入備份<input type="file" accept=".json,application/json" onchange="importBackup(this.files[0])" style="display:none"></label></div></div>`;
  if(typeof v641PatchAnchorTargets === 'function') v641PatchAnchorTargets($('helpView'));
  v64UpdateFooterVersion();
};

function v64AfterRender(){
  v64PatchSpots();
  v64InsertAiBar('plannerView','planner');
  v64InsertAiBar('packingView','packing');
  v64InsertAiBar('budgetView','budget');
  v64UpdateFooterVersion();
  if(typeof v641PatchAnchorTargets === 'function') v641PatchAnchorTargets(document);
}
const v64OriginalRender = typeof render === 'function' ? render : null;
if(v64OriginalRender && !v64OriginalRender.__v64AiWrapped){
  render = function(...args){
    const r=v64OriginalRender.apply(this,args);
    setTimeout(v64AfterRender,0);
    return r;
  };
  render.__v64AiWrapped=true;
}
document.addEventListener('DOMContentLoaded',()=>{
  setTimeout(v64AfterRender,300);
  setTimeout(v64AfterRender,900);
});
setTimeout(()=>{
  v64AfterRender();
  try{ if(typeof render === 'function') render(); }catch(e){}
},500);

const V641_VERSION_SHORT = '版本：v64.1｜2026-05-31';
const V641_VERSION_TEXT = 'v64.1｜2026-05-31｜AI 健檢偏好與匯入顯示優化版';
const V641_PREF_KEY = 'janeselectAiPrefs_v1';

function v641LoadPrefs(){
  try{return JSON.parse(localStorage.getItem(V641_PREF_KEY)||'{}')||{};}catch(e){return {};}
}
function v641SavePrefsFromDom(){
  const prefs={
    style:$('v641TravelStyle')?.value||'',
    mbti:$('v641Mbti')?.value||'',
    zodiac:$('v641Zodiac')?.value||''
  };
  try{localStorage.setItem(V641_PREF_KEY,JSON.stringify(prefs));}catch(e){}
  return prefs;
}
function v641PrefsText(){
  const p=v641SavePrefsFromDom();
  const parts=[];
  if(p.style) parts.push('旅遊風格偏好：'+p.style);
  if(p.mbti) parts.push('MBTI：'+p.mbti);
  if(p.zodiac) parts.push('星座：'+p.zodiac);
  return parts.length ? parts.join('\n') : '未填寫，請以一般旅遊者需求判斷。';
}
function v641PrefsHtml(){
  const p=v641LoadPrefs();
  const styles=['','輕鬆慢旅','高效率踩點','美食咖啡優先','拍照打卡優先','親子友善','購物優先','文化歷史優先','自然風景優先','雨天備案優先'];
  const mbtis=['','INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];
  const zodiacs=['','牡羊座','金牛座','雙子座','巨蟹座','獅子座','處女座','天秤座','天蠍座','射手座','摩羯座','水瓶座','雙魚座'];
  const opts=(arr,val)=>arr.map(x=>`<option value="${esc(x)}" ${x===(val||'')?'selected':''}>${x?esc(x):'不指定'}</option>`).join('');
  return `<div class="v641Prefs">
    <div class="v641PrefsTitle">偏好參考（非必填）</div>
    <div class="v641PrefsGrid">
      <div><label>旅遊風格</label><select id="v641TravelStyle" onchange="v641SavePrefsFromDom()">${opts(styles,p.style)}</select></div>
      <div><label>MBTI</label><select id="v641Mbti" onchange="v641SavePrefsFromDom()">${opts(mbtis,p.mbti)}</select></div>
      <div><label>星座</label><select id="v641Zodiac" onchange="v641SavePrefsFromDom()">${opts(zodiacs,p.zodiac)}</select></div>
    </div>
  </div>`;
}
function v641EnsureAiReviews(){
  if(!data.aiReviews || typeof data.aiReviews!=='object') data.aiReviews={};
  if(!Array.isArray(data.aiReviews.itinerary)) data.aiReviews.itinerary=[];
  return data.aiReviews.itinerary;
}
function v641SaveItineraryReview(obj){
  const reviews=v641EnsureAiReviews();
  const review={
    id:uid(),
    createdAt:new Date().toISOString(),
    summary:String(obj.summary||''),
    items:Array.isArray(obj.items)?obj.items.map(x=>({
      day:String(x.day||''),
      level:String(x.level||'建議'),
      title:String(x.title||'AI 建議'),
      memo:String(x.memo||'')
    })).filter(x=>x.title||x.memo):[]
  };
  if(!review.summary && review.items.length){
    review.summary=review.items.map(x=>`${x.day||''} ${x.title}：${x.memo}`).join('\n');
  }
  reviews.unshift(review);
  data.aiReviews.itinerary=reviews.slice(0,5);
  return review;
}
function v641DeleteReview(id){
  if(!data.aiReviews?.itinerary) return;
  data.aiReviews.itinerary=data.aiReviews.itinerary.filter(x=>x.id!==id);
  save();
}
function v641ReviewHtml(){
  const reviews=(data.aiReviews?.itinerary||[]).slice(0,3);
  if(!reviews.length) return '';
  return `<div class="v641ReviewList">
    ${reviews.map(r=>`<div class="v641ReviewCard">
      <div class="v641ReviewHead"><div><b>AI 健檢建議</b><span>${esc((r.createdAt||'').slice(0,10))}｜只作為調整參考，不會自動覆蓋行程。</span></div><button class="small" onclick="v641DeleteReview('${r.id}')">刪除</button></div>
      ${r.summary?`<div class="box mint">${esc(r.summary)}</div>`:''}
      ${r.items?.length?`<div class="v641ReviewItems">${r.items.map(x=>`<div class="v641ReviewItem"><em>${esc(x.day||'全旅程')}｜${esc(x.level||'建議')}</em><strong>${esc(x.title||'AI 建議')}</strong>${esc(x.memo||'')}</div>`).join('')}</div>`:''}
    </div>`).join('')}
  </div>`;
}

/* 重新定義 AI prompt 內容：行程健檢不再包含口袋景點 */
const v641OriginalBuildPrompt = typeof v64BuildPrompt==='function' ? v64BuildPrompt : null;
v64BuildPrompt = function(type, spotId){
  if(type!=='itinerary') return v641OriginalBuildPrompt ? v641OriginalBuildPrompt(type, spotId) : '';
  const c=v64TripContext();
  const dest=data.trip?.dest||'未設定';
  const country=data.trip?.country||'未設定';
  const dates=`${data.trip?.start||''} ～ ${data.trip?.end||''}`;
  const travelers=(data.trip?.travelers||[]).join('、') || '未設定';
  return `旅行資料：
- 目的地：${dest}
- 國家 / 區域：${country}
- 日期：${dates}
- 旅伴：${travelers}
- 幣別：${data.trip?.currency||''}

使用者偏好（非必填，僅供調整口吻與建議方向）：
${v641PrefsText()}

旅行日期：
${c.days}

住宿：
${c.hotels}

已排入行程（只檢查這些，不要把口袋景點當成已排行程）：
${c.plans}

請幫我檢查「已排入行程」是否順路、是否太趕、是否有交通時間或安排順序不合理的地方。若行程看起來太空或使用者可能不知道怎麼排，請給我無腦可執行的安排原則，但不要自行加入未列入行程的口袋景點，也不要要求我一定照做。

請輸出兩段：
1. 白話健檢摘要。
2. 純 JSON，格式如下：
{
  "janeselect_import_type": "itinerary_review",
  "summary": "整體建議摘要",
  "items": [
    {
      "day": "YYYY-MM-DD",
      "level": "提醒/建議/注意",
      "title": "建議標題",
      "memo": "具體調整建議"
    }
  ]
}`;
};

/* 重設 AI 工具列：保留短按鈕，但在行程加偏好欄位 */
const v641OriginalAiBarHtml = typeof v64AiBarHtml==='function' ? v64AiBarHtml : null;
v64AiBarHtml = function(kind){
  if(kind==='planner'){
    return `<div class="v64AiBar" id="v64AiBar-planner">
      <div class="v64AiBarHead"><div><b>AI 輔助</b><span>只檢查已排入行程；偏好欄位可不填。</span></div></div>
      <div class="v64AiActions">
        <button class="btn pink compact" onclick="v64ShowPrompt('itinerary','AI 健檢','請 AI 檢查已排入行程的順路性與節奏。')">AI 健檢</button>
        <button class="btn blue compact" onclick="v64OpenImportModal('itinerary')">AI 匯入</button>
      </div>
      ${v641PrefsHtml()}
    </div>`;
  }
  return v641OriginalAiBarHtml ? v641OriginalAiBarHtml(kind) : '';
};

/* 匯入視窗支援指定目前期待的匯入類型，讓行程健檢不再無感 */
const v641OriginalOpenImportModal = typeof v64OpenImportModal==='function' ? v64OpenImportModal : null;
v64OpenImportModal = function(expectedType){
  v64EnsureImportModal();
  $('v64AiImportText').value='';
  const msg = expectedType==='itinerary'
    ? '請貼上 AI 健檢回傳的 JSON。匯入後會出現在行程頁的「AI 健檢建議」卡片，不會自動改時間或重排行程。'
    : '支援：口袋景點、行李清單、預算草稿。AI 不會直接覆蓋既有資料。';
  $('v64AiImportPreview').textContent=msg;
  $('v64AiImportModal').dataset.expectedType=expectedType||'';
  $('v64AiImportModal').classList.add('show');
  $('v64AiImportModal').setAttribute('aria-hidden','false');
};

const v641OriginalImportAiObject = typeof v64ImportAiObject==='function' ? v64ImportAiObject : null;
v64ImportAiObject = function(obj){
  const type=String(obj.janeselect_import_type || obj.type || '').trim();
  if(type==='itinerary_review'){
    const review=v641SaveItineraryReview(obj);
    return {count:1, label:'AI 健檢建議', reviewId:review.id, keepModal:false};
  }
  return v641OriginalImportAiObject ? v641OriginalImportAiObject(obj) : {count:0,label:'資料'};
};

v64ImportAiText = function(){
  const raw=$('v64AiImportText')?.value || '';
  if(!raw.trim()) return toast('請先貼上 AI 回覆');
  try{
    const obj=JSON.parse(v64JsonText(raw));
    const result=v64ImportAiObject(obj);
    if(!result.count) throw new Error('no items');
    silentSave();
    render();
    v64CloseImportModal();
    if(result.label==='AI 健檢建議'){
      setTimeout(()=>go('planner'),80);
      toast('已匯入 AI 健檢建議');
    }else{
      toast(`已匯入 ${result.count} 筆${result.label}`);
    }
  }catch(e){
    $('v64AiImportPreview').textContent='匯入失敗：請確認貼上的是純 JSON，且格式符合 AI 提示詞要求。';
  }
};

/* 將 AI 健檢建議卡片接在行程 AI 區塊下方 */
const v641OriginalInsertAiBar = typeof v64InsertAiBar==='function' ? v64InsertAiBar : null;
v64InsertAiBar = function(viewId, kind){
  const root=$(viewId);
  if(!root) return;
  if(v641OriginalInsertAiBar) v641OriginalInsertAiBar(viewId, kind);
  if(kind==='planner'){
    root.querySelectorAll('#v641ReviewBlock').forEach(x=>x.remove());
    const bar=root.querySelector('#v64AiBar-planner');
    const html=v641ReviewHtml();
    if(bar && html) bar.insertAdjacentHTML('afterend', `<div id="v641ReviewBlock">${html}</div>`);
  }
};

/* 修正探索中 AI 摘要彈窗層級；點 AI 摘要時提示詞一定在最上層 */
const v641OriginalShowPrompt = typeof v64ShowPrompt==='function' ? v64ShowPrompt : null;
v64ShowPrompt = function(type, title, desc, spotId){
  if(v641OriginalShowPrompt) v641OriginalShowPrompt(type,title,desc,spotId);
  const modal=$('v64AiPromptModal');
  if(modal){
    modal.style.zIndex='360';
    modal.classList.add('show');
  }
};

/* 更新說明頁與頁尾版本，只保留最新版紀錄 */
v64UpdateFooterVersion = function(){
  document.querySelectorAll('footer strong,.siteFooterVersion').forEach(el=>el.textContent=V641_VERSION_SHORT);
  if(typeof v637EnsureFooter === 'function') v637EnsureFooter();
};
renderHelp = function(){
  const allowed = (typeof ALLOWED_EMAIL !== 'undefined') ? ALLOWED_EMAIL : '';
  $('helpView').innerHTML=`<div class="section"><div><h2>說明與備份</h2><div class="hint">工具使用方式、AI 輔助、資料備份與還原放在這裡。</div></div></div>
  <div class="card" id="v64UpdateLog">
    <h3>最新更新紀錄</h3>
    <div class="box mint"><b>${esc(V641_VERSION_TEXT)}</b><br>AI 健檢改為只檢查已排入行程，不再把口袋景點視為正式行程；新增非必填的旅遊風格、MBTI、星座偏好；AI 健檢匯入後會顯示在行程頁建議卡片；修正口袋景點探索內 AI 摘要彈窗層級。</div>
  </div>
  <div class="card"><h3>AI 輔助使用方式</h3><div class="box blue">在口袋景點、行程、行李、預算頁使用 AI 按鈕。ChatGPT / Gemini 會先複製提示詞再開新分頁；AI 回覆 JSON 後可用「AI 匯入」貼回網站。匯入只新增資料，不會自動覆蓋既有內容。</div></div>
  <div class="card"><h3>Firebase 跨裝置同步</h3><div class="box mint">登入授權 Google 帳號後，旅遊資料會同步到 Firestore。照片本體仍存在 Cloudinary，Firestore 只保存圖片網址與旅行資料。</div><div class="btns"><button class="btn dark" onclick="saveToCloudNow()">立即同步到雲端</button><button class="btn blue" onclick="loadFromCloud()">載入雲端資料</button></div>${allowed?`<div class="cloudHint">目前授權 email：${esc(allowed)}</div>`:''}</div>
  <div class="card"><h3>備份資料</h3><div class="box blue">匯出備份會下載 JSON。匯入備份會覆蓋目前資料。若要修改國家或日期，建議先匯出備份。</div><div class="btns"><button class="btn dark" onclick="exportBackup()">匯出備份</button><label class="btn soft" style="display:inline-block">匯入備份<input type="file" accept=".json,application/json" onchange="importBackup(this.files[0])" style="display:none"></label></div></div>`;
  if(typeof v641PatchAnchorTargets === 'function') v641PatchAnchorTargets($('helpView'));
  v64UpdateFooterVersion();
};

setTimeout(()=>{
  try{v64AfterRender?.(); v64UpdateFooterVersion(); if(typeof render==='function')render();}catch(e){console.warn(e)}
},250);

function v64BrandRestoreMarkSvg(){
  return `<span class="brandMark" aria-hidden="true"><svg viewBox="0 0 64 64" focusable="false"><rect x="10" y="13" width="40" height="43" rx="10"></rect><path d="M22 13c1.7-5.4 13.9-5.4 15.6 0"></path><path d="M21 28h18M21 38h14"></path><circle cx="45" cy="18" r="6"></circle><path d="M45 14v4l3 2"></path></svg></span>`;
}
function v64BrandRestoreFavicon(){
  const fav=document.getElementById('janeselectFavicon');
  if(!fav)return;
  fav.href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='18' fill='%234A5D4E'/%3E%3Cpath d='M20 18h25a5 5 0 0 1 5 5v27a5 5 0 0 1-5 5H20a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6z' fill='%23FFFAF2'/%3E%3Cpath d='M22 16c2-7 17-7 19 0' fill='none' stroke='%23FFFAF2' stroke-width='4' stroke-linecap='round'/%3E%3Cpath d='M24 31h17M24 40h13' stroke='%234A5D4E' stroke-width='4' stroke-linecap='round'/%3E%3Ccircle cx='45' cy='19' r='7' fill='%23E5ECE9'/%3E%3Cpath d='M45 15v5l4 2' stroke='%234A5D4E' stroke-width='2.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E";
  fav.dataset.v64BrandRestored='1';
}
function v64BrandRestoreApply(){
  document.title = (data?.meta?.title ? data.meta.title + '｜' : '') + '貞選旅管家';
  document.querySelectorAll('.badge').forEach(el=>{
    el.innerHTML = `${v64BrandRestoreMarkSvg()}<span>貞選旅管家</span>`;
    el.dataset.v64BrandRestored='1';
  });
  document.querySelectorAll('.loginBrand').forEach(el=>{
    el.innerHTML = `${v64BrandRestoreMarkSvg()}<span><b>貞選旅管家</b><small>Janeselect Travel Manager</small></span>`;
    el.dataset.v64BrandRestored='1';
  });
  document.querySelectorAll('.siteFooterBrand').forEach(el=>{
    el.innerHTML='貞選旅管家 <span>Janeselect Travel Manager</span>';
  });
  v64BrandRestoreFavicon();
}
(function(){
  const prevRenderHead = typeof renderHead==='function' ? renderHead : null;
  if(prevRenderHead && !window.__v64BrandRestoreRenderHeadPatched){
    renderHead = function(...args){
      const r = prevRenderHead.apply(this,args);
      v64BrandRestoreApply();
      return r;
    };
    window.__v64BrandRestoreRenderHeadPatched=true;
  }
  const prevRenderLogin = typeof renderLoginView==='function' ? renderLoginView : null;
  if(prevRenderLogin && !window.__v64BrandRestoreLoginPatched){
    renderLoginView = function(...args){
      const r = prevRenderLogin.apply(this,args);
      v64BrandRestoreApply();
      return r;
    };
    window.__v64BrandRestoreLoginPatched=true;
  }
  const prevRenderList = typeof renderTripList==='function' ? renderTripList : null;
  if(prevRenderList && !window.__v64BrandRestoreListPatched){
    renderTripList = function(...args){
      const r = prevRenderList.apply(this,args);
      v64BrandRestoreApply();
      return r;
    };
    window.__v64BrandRestoreListPatched=true;
  }
  document.addEventListener('DOMContentLoaded',()=>{
    v64BrandRestoreApply();
    setTimeout(v64BrandRestoreApply,280);
    setTimeout(v64BrandRestoreApply,900);
  });
  setTimeout(v64BrandRestoreApply,120);
})();

const V643_VERSION_SHORT = "v64.3｜2026-05-31";
const V643_VERSION_TEXT = "v64.3｜日期調整保護與資料保留版";
let v643PendingBasic = null;

function v643ReadTripBasicFromForm(){
  const selectedCountry = $("country")?.value || data.trip.country || "";
  const cityEl = $("citySelect");
  let selectedCity = cityEl ? cityEl.value : (data.trip.city || "");
  let city = selectedCity;
  if(selectedCity === "自訂" && $("cityCustom")) city = $("cityCustom").value.trim();
  const dest = (typeof v15DestinationName === 'function')
    ? v15DestinationName(selectedCountry, city)
    : (($("dest")?.value || data.trip.dest || "").trim());
  const count = Number($("travelerCount")?.value || data.trip.travelerCount || 1);
  const travelers=[];
  for(let i=0;i<count;i++) travelers.push($("traveler"+i)?.value || data.trip.travelers?.[i] || String.fromCharCode(65+i));
  return {
    country:selectedCountry,
    city,
    dest,
    currency:($("currency")?.value || data.trip.currency || "").toUpperCase(),
    rate:Number($("rateSetup")?.value || data.trip.rate || 1),
    travelerCount:count,
    travelers,
    start:$("start")?.value || data.trip.start || "",
    end:$("end")?.value || data.trip.end || ""
  };
}
function v643ApplyBasicFields(basic){
  if(!basic) return;
  data.trip.country = basic.country;
  data.trip.city = basic.city;
  data.trip.dest = basic.dest;
  data.trip.currency = basic.currency;
  data.trip.rate = basic.rate;
  data.trip.travelerCount = basic.travelerCount;
  data.trip.travelers = basic.travelers;
}
function v643DaysBetween(a,b){
  if(!a || !b) return 0;
  const d1=parseLocalDate(a), d2=parseLocalDate(b);
  return Math.round((d2-d1)/86400000);
}
function v643ShiftDate(value, offset){
  if(!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return value;
  const d=parseLocalDate(value);
  d.setDate(d.getDate()+Number(offset||0));
  return formatLocalDate(d);
}
function v643ShiftDateTime(value, offset){
  if(!value || !/^\d{4}-\d{2}-\d{2}T/.test(String(value))) return value;
  return v643ShiftDate(value.slice(0,10), offset) + value.slice(10);
}
function v643WithinRange(day,start,end){
  if(!day || !start || !end) return true;
  return day >= start && day <= end;
}
function v643OutOfRangeCounts(start,end){
  const out={plans:0,spots:0,expenses:0,photos:0,covers:0,hotels:0,total:0};
  (data.plans||[]).forEach(x=>{ if(x.day && !v643WithinRange(x.day,start,end)) out.plans++; });
  (data.spots||[]).forEach(x=>{ if(x.day && !v643WithinRange(x.day,start,end)) out.spots++; });
  (data.expenses||[]).forEach(x=>{ if(x.day && !v643WithinRange(x.day,start,end)) out.expenses++; });
  (data.photos||[]).forEach(x=>{ if(x.day && !v643WithinRange(x.day,start,end)) out.photos++; });
  Object.keys(data.dayCovers||{}).forEach(k=>{ if(!v643WithinRange(k,start,end)) out.covers++; });
  (data.hotels||[]).forEach(h=>{ if((h.start && !v643WithinRange(h.start,start,end)) || (h.end && !v643WithinRange(h.end,start,end))) out.hotels++; });
  out.total=out.plans+out.spots+out.expenses+out.photos+out.covers+out.hotels;
  return out;
}
function v643EnsureDateModal(){
  let modal=$("dateResetModal");
  if(!modal){
    modal=document.createElement('div');
    modal.id='dateResetModal';
    modal.className='resetModal';
    document.body.appendChild(modal);
  }
  modal.className='resetModal v643DateModal';
  return modal;
}
function v643DateSummaryHtml(){
  const p=v643PendingBasic;
  if(!p) return '';
  const oldStart=data.trip.start || '';
  const oldEnd=data.trip.end || '';
  const oldDays=(data.days||mkDays(oldStart,oldEnd)||[]).length;
  const newDays=mkDays(p.start,p.end).length;
  const deltaStart=v643DaysBetween(oldStart,p.start);
  const out=v643OutOfRangeCounts(p.start,p.end);
  const moveText = deltaStart===0 ? '起始日沒有改變，通常選「增減天數」即可。' : `起始日變動 ${deltaStart>0?'往後':'往前'} ${Math.abs(deltaStart)} 天，可選「整趟平移」。`;
  const outText = out.total ? `新日期範圍外目前有 ${out.total} 筆資料，系統會保留，不會刪除。` : '目前看起來沒有資料落在新日期範圍外。';
  return `<div class="v643DateCompare">
    <div><span>原日期</span><b>${esc(oldStart||'未設定')} ～ ${esc(oldEnd||'未設定')}</b><small>${oldDays||0} 天</small></div>
    <div><span>新日期</span><b>${esc(p.start||'未設定')} ～ ${esc(p.end||'未設定')}</b><small>${newDays||0} 天</small></div>
  </div>
  <div class="box mint v643SafeNote"><b>這次不會清空資料。</b><br>${esc(outText)}<br>${esc(moveText)}</div>`;
}
function v643OpenDateAdjustModal(){
  const modal=v643EnsureDateModal();
  modal.innerHTML=`<div class="resetBox v643DateBox">
    <h3>調整旅遊日期</h3>
    <div class="hint">請選擇這次日期變更的情境。系統會保留你已輸入的行程、住宿、預算、照片書、行李與 AI 建議。</div>
    ${v643DateSummaryHtml()}
    <div class="v643DateChoices">
      <button class="v643DateChoice" onclick="v643ConfirmDateAdjust('range')">
        <b>增減天數</b>
        <span>適合：起始日正確，只是多一天或少一天。既有日期內資料保留；超出範圍資料只暫存保留。</span>
      </button>
      <button class="v643DateChoice" onclick="v643ConfirmDateAdjust('shift')">
        <b>整趟平移</b>
        <span>適合：整趟旅行日期錯一天或多天。行程、住宿、照片、預算日期會一起往前或往後移。</span>
      </button>
    </div>
    <div class="btns"><button class="btn soft" onclick="cancelDateReset()">取消</button></div>
  </div>`;
  modal.classList.add('show');
}
function v643ShiftTripDateData(offset){
  if(!offset) return;
  (data.plans||[]).forEach(x=>{ if(x.day) x.day=v643ShiftDate(x.day,offset); });
  (data.spots||[]).forEach(x=>{ if(x.day) x.day=v643ShiftDate(x.day,offset); });
  (data.expenses||[]).forEach(x=>{ if(x.day) x.day=v643ShiftDate(x.day,offset); });
  (data.photos||[]).forEach(x=>{ if(x.day) x.day=v643ShiftDate(x.day,offset); });
  (data.hotels||[]).forEach(h=>{ if(h.start) h.start=v643ShiftDate(h.start,offset); if(h.end) h.end=v643ShiftDate(h.end,offset); });
  if(data.dayCovers){
    const next={};
    Object.keys(data.dayCovers).forEach(k=>{ next[v643ShiftDate(k,offset)] = data.dayCovers[k]; });
    data.dayCovers=next;
  }
  if(data.dayCoverMeta){
    const next={};
    Object.keys(data.dayCoverMeta).forEach(k=>{ next[v643ShiftDate(k,offset)] = data.dayCoverMeta[k]; });
    data.dayCoverMeta=next;
  }
  if(data.flights){
    ['out','back'].forEach(k=>{
      if(data.flights[k]){
        data.flights[k].dep=v643ShiftDateTime(data.flights[k].dep,offset);
        data.flights[k].arr=v643ShiftDateTime(data.flights[k].arr,offset);
      }
    });
  }
  cur=v643ShiftDate(cur,offset);
  if(window.currentDay) currentDay=v643ShiftDate(currentDay,offset);
}
function v643AfterDateApplyToast(mode,outBefore){
  if(mode==='shift') return toast('已整趟平移日期，資料已保留');
  if(outBefore?.total) return toast(`已調整日期，${outBefore.total} 筆日期外資料已安全保留`);
  toast('已調整日期，資料已保留');
}
function v643ConfirmDateAdjust(mode){
  const basic=v643PendingBasic;
  if(!basic) return cancelDateReset();
  const oldStart=data.trip.start;
  const outBefore=v643OutOfRangeCounts(basic.start,basic.end);
  v643ApplyBasicFields(basic);
  if(mode==='shift'){
    const offset=v643DaysBetween(oldStart,basic.start);
    v643ShiftTripDateData(offset);
  }
  data.trip.start=basic.start;
  data.trip.end=basic.end;
  data.days=mkDays(data.trip.start,data.trip.end);
  if(!data.days.some(d=>d.key===cur)) cur=data.days[0]?.key || data.trip.start;
  if(window.currentDay && !data.days.some(d=>d.key===currentDay)) currentDay=cur;
  if(typeof v18SortHotels==='function') v18SortHotels();
  v643PendingBasic=null;
  v19PendingDates=null;
  $("dateResetModal")?.classList.remove("show");
  silentSave();
  render();
  if(typeof v63UpdateCurrentTripMeta==='function') setTimeout(()=>v63UpdateCurrentTripMeta(true),80);
  v643AfterDateApplyToast(mode,outBefore);
}
function v643SaveBasicNoDateChange(basic){
  v643ApplyBasicFields(basic);
  data.trip.start=basic.start;
  data.trip.end=basic.end;
  data.days=mkDays(data.trip.start,data.trip.end);
  if(!data.days.some(d=>d.key===cur)) cur=data.days[0]?.key || data.trip.start;
  if(typeof v18SortHotels==='function') v18SortHotels();
  silentSave();
  render();
  const d=document.querySelectorAll("#tripView details.card")[0];
  if(d) d.removeAttribute("open");
  if(typeof v63UpdateCurrentTripMeta==='function') setTimeout(()=>v63UpdateCurrentTripMeta(true),80);
  toast("已幫你存好囉！");
}
/* 最後覆寫 saveBasic：日期改變時不再清空。 */
saveBasic=function(){
  const basic=v643ReadTripBasicFromForm();
  if(basic.country !== data.trip.country){
    v18PendingCountry=basic.country;
    if($("country")) $("country").value=data.trip.country;
    $("countryResetModal")?.classList.add("show");
    return;
  }
  const dateChanged = basic.start !== data.trip.start || basic.end !== data.trip.end;
  if(dateChanged && data.days?.length){
    v643PendingBasic=basic;
    v19PendingDates={start:basic.start,end:basic.end};
    v643OpenDateAdjustModal();
    return;
  }
  v643SaveBasicNoDateChange(basic);
};
function v643OutOfRangeNoticeHtml(){
  if(!data?.trip?.start || !data?.trip?.end) return '';
  const out=v643OutOfRangeCounts(data.trip.start,data.trip.end);
  if(!out.total) return '';
  return `<div class="card v643OutNotice"><h3>日期外資料已保留</h3><div class="box pink">目前有 ${out.total} 筆資料不在旅遊日期範圍內，系統沒有刪除它們。若需要恢復，可再延長日期或把旅程日期平移回來。</div></div>`;
}
const v643PrevRenderTrip = typeof renderTrip==='function' ? renderTrip : null;
if(v643PrevRenderTrip && !window.__v643RenderTripPatched){
  renderTrip=function(...args){
    const r=v643PrevRenderTrip.apply(this,args);
    const root=$("tripView");
    if(root && !root.querySelector('.v643OutNotice')) root.insertAdjacentHTML('beforeend', v643OutOfRangeNoticeHtml());
    return r;
  };
  window.__v643RenderTripPatched=true;
}
const v643PrevRenderHelp = typeof renderHelp==='function' ? renderHelp : null;
if(v643PrevRenderHelp && !window.__v643HelpPatched){
  renderHelp=function(...args){
    const r=v643PrevRenderHelp.apply(this,args);
    const log=$("v64UpdateLog") || $("helpView")?.querySelector('.card');
    if(log){
      log.innerHTML=`<h3>最新更新紀錄</h3><div class="box mint"><b>${esc(V643_VERSION_TEXT)}</b><br>修改旅遊日期不再清空資料；新增「增減天數」與「整趟平移」兩種安全調整方式，行程、住宿、預算、照片書與行李會保留。</div>`;
    }
    v643UpdateFooterVersion();
    return r;
  };
  window.__v643HelpPatched=true;
}
function v643UpdateFooterVersion(){
  document.querySelectorAll('footer strong,.siteFooterVersion').forEach(el=>el.textContent=V643_VERSION_SHORT);
  document.querySelectorAll('footer').forEach(el=>{
    if(!el.innerHTML.includes('Janeselect Travel Manager')){
      el.innerHTML=`貞選旅管家 Janeselect Travel Manager<br><strong>${V643_VERSION_SHORT}</strong>`;
    }
  });
}
setTimeout(()=>{try{v643UpdateFooterVersion(); if(typeof render==='function') render();}catch(e){console.warn(e)}},300);

const V644_VERSION_SHORT = "v64.4｜2026-05-31";
const V644_VERSION_TEXT = "v64.4｜AI 找景點提示詞強化與介面收合版";

function v644FlightOne(label, f){
  if(!f) return `${label}：尚未填寫`;
  const segs = Array.isArray(f.segments) ? f.segments : [];
  if(segs.length){
    const lines = segs.map((s,i)=>`  第 ${i+1} 段：${s.no||s.flightNo||''}｜${s.from||''} → ${s.to||''}｜${s.dep||s.departure||''} → ${s.arr||s.arrival||''}`).join('\n');
    return `${label}：\n${lines}${f.transfer?'\n機場接送：'+f.transfer:''}`;
  }
  const core = [f.no||f.flightNo||'', `${f.from||''} → ${f.to||''}`, `${f.dep||f.departure||''} → ${f.arr||f.arrival||''}`].filter(x=>String(x).replace(/[→｜\s]/g,'')).join('｜');
  return `${label}：${core||'尚未填寫'}${f.transfer?'｜機場接送：'+f.transfer:''}`;
}
function v644FlightContext(){
  const fs=data.flights||{};
  return [v644FlightOne('去程航班',fs.out), v644FlightOne('回程航班',fs.back)].join('\n');
}
function v644PlannerByDayContext(){
  const days=data.days||[];
  if(!days.length) return '尚未設定旅行日期';
  return days.map(d=>{
    const hotel=typeof hotelFor==='function' ? hotelFor(d.key) : null;
    const ps=(data.plans||[]).filter(p=>p.day===d.key).sort((a,b)=>String(a.start).localeCompare(String(b.start))).map(p=>`  - ${p.start||''}-${p.end||''}｜${p.type||'行程'}｜${p.name||''}${p.addr||p.address?'｜地址：'+(p.addr||p.address):''}${p.note?'｜注意：'+p.note:''}`);
    return `${d.key}（${d.title||''}｜${d.label||''}）｜住宿：${hotel?hotel.name:'未設定'}\n${ps.length?ps.join('\n'):'  - 目前尚未排入行程'}`;
  }).join('\n');
}
function v644ExistingSpotContext(){
  const spots=data.spots||[];
  if(!spots.length) return '尚未加入口袋景點';
  return spots.map(s=>`${s.name||''}｜${s.type||'景點'}｜${s.day||'未排'}｜${s.addr||''}｜${s.memo||''}`).join('\n');
}
function v644PrefsText(){
  if(typeof v641SavePrefsFromDom==='function') return v641PrefsText();
  return '未填寫，請以一般旅遊者需求判斷。';
}
function v644SpotPrompt(){
  const c=typeof v64TripContext==='function' ? v64TripContext() : {days:'',hotels:'',plans:'',spots:''};
  const dest=data.trip?.dest||'未設定';
  const country=data.trip?.country||'未設定';
  const dates=`${data.trip?.start||''} ～ ${data.trip?.end||''}`;
  const travelers=(data.trip?.travelers||[]).join('、') || '未設定';
  return `旅行資料：
- 目的地：${dest}
- 國家 / 區域：${country}
- 日期：${dates}
- 旅伴：${travelers}
- 幣別：${data.trip?.currency||''}

使用者偏好（非必填，僅供推薦方向參考）：
${v644PrefsText()}

航班資訊：
${v644FlightContext()}

住宿資訊：
${c.hotels}

已排入行程（請避開已經很滿的時段，並依空檔推薦備選日期與時間）：
${v644PlannerByDayContext()}

目前口袋景點（請避免重複推薦）：
${v644ExistingSpotContext()}

請幫我推薦適合這趟旅程的口袋景點、餐廳、咖啡廳、購物點與雨天備案。請考慮：
1. 去程/回程航班時間，不要推薦不適合抵達日或離境日的安排。
2. 住宿位置與已排入行程，盡量推薦順路或可補空檔的點。
3. 使用者偏好、旅遊節奏、天氣備案與熱門程度。
4. 每個推薦都要給「備選日期 day」與「建議時間 start/end」。如果不確定可留空，但請在 memo 說明適合早上/下午/晚上。
5. 不要把已排入行程或已在口袋景點中的項目重複推薦。

請只輸出純 JSON，不要 Markdown，不要解釋文字。格式如下：
{
  "janeselect_import_type": "spots",
  "spots": [
    {
      "name": "景點或店名",
      "type": "景點/餐廳/咖啡廳/購物/雨天備案/其他",
      "day": "YYYY-MM-DD，可留空",
      "start": "HH:MM，可留空",
      "end": "HH:MM，可留空",
      "addr": "地址或區域",
      "memo": "推薦理由、玩法重點、為什麼適合這一天與這個時段、注意事項",
      "krName": "若為韓國景點可填韓文名稱，否則留空",
      "krAddress": "若為韓國景點可填韓文地址，否則留空"
    }
  ]
}`;
}

const v644PrevBuildPrompt = typeof v64BuildPrompt==='function' ? v64BuildPrompt : null;
v64BuildPrompt = function(type, spotId){
  if(type==='spots') return v644SpotPrompt();
  return v644PrevBuildPrompt ? v644PrevBuildPrompt(type, spotId) : '';
};

function v644EnsurePromptOptionsModal(){
  if($('v644PromptOptionsModal')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="v64AiModal v644OptionsModal noPrint" id="v644PromptOptionsModal" aria-hidden="true">
    <div class="v64AiBox v644OptionsBox">
      <div class="v64AiHead">
        <div><h3 id="v644OptionsTitle">AI 輔助</h3><p id="v644OptionsDesc">偏好可不填，會用來調整 AI 建議方向。</p></div>
        <button type="button" class="iconBtn" onclick="v644ClosePromptOptions()">×</button>
      </div>
      <div id="v644OptionsPrefs"></div>
      <div class="box mint v644OptionsNote" id="v644OptionsNote"></div>
      <div class="btns">
        <button class="btn dark" type="button" onclick="v644GeneratePromptFromOptions()">產生提示詞</button>
        <button class="btn soft" type="button" onclick="v644ClosePromptOptions()">取消</button>
      </div>
    </div>
  </div>`);
}
function v644OpenPromptOptions(kind){
  v644EnsurePromptOptionsModal();
  const isSpot = kind==='spots';
  $('v644PromptOptionsModal').dataset.kind=kind;
  $('v644OptionsTitle').textContent = isSpot ? 'AI 找景點' : 'AI 健檢';
  $('v644OptionsDesc').textContent = isSpot ? '加入偏好後，AI 會依航班、住宿與已排入行程推薦更適合的口袋景點。' : '加入偏好後，AI 會用更貼近你的旅行節奏檢查行程。';
  $('v644OptionsPrefs').innerHTML = (typeof v641PrefsHtml==='function') ? v641PrefsHtml() : '';
  $('v644OptionsNote').innerHTML = isSpot
    ? '提示詞會帶入航班、住宿、已排入行程與既有口袋景點，讓 AI 推薦備選日期與建議時間。'
    : 'AI 健檢只會檢查已排入行程，不會把口袋景點當成正式行程。';
  $('v644PromptOptionsModal').classList.add('show');
  $('v644PromptOptionsModal').setAttribute('aria-hidden','false');
}
function v644ClosePromptOptions(){
  $('v644PromptOptionsModal')?.classList.remove('show');
  $('v644PromptOptionsModal')?.setAttribute('aria-hidden','true');
}
function v644GeneratePromptFromOptions(){
  const kind=$('v644PromptOptionsModal')?.dataset.kind || 'spots';
  if(typeof v641SavePrefsFromDom==='function') v641SavePrefsFromDom();
  v644ClosePromptOptions();
  if(kind==='spots') return v64ShowPrompt('spots','AI 找景點','請 AI 依航班、住宿、已排入行程與偏好推薦口袋景點。');
  return v64ShowPrompt('itinerary','AI 健檢','請 AI 檢查已排入行程的順路性與節奏。');
}

const v644PrevAiBarHtml = typeof v64AiBarHtml==='function' ? v64AiBarHtml : null;
v64AiBarHtml = function(kind){
  if(kind==='spots'){
    return `<div class="v64AiBar v644AiBar" id="v64AiBar-spots">
      <div class="v64AiBarHead"><div><b>AI 輔助</b><span>依航班、住宿、已排入行程與偏好推薦口袋景點。</span></div></div>
      <div class="v64AiActions">
        <button class="btn pink compact" onclick="v644OpenPromptOptions('spots')">AI 找景點</button>
        <button class="btn blue compact" onclick="v64OpenImportModal()">AI 匯入</button>
      </div>
    </div>`;
  }
  if(kind==='planner'){
    return `<div class="v64AiBar v644AiBar" id="v64AiBar-planner">
      <div class="v64AiBarHead"><div><b>AI 輔助</b><span>只檢查已排入行程；偏好在產生提示詞時設定。</span></div></div>
      <div class="v64AiActions">
        <button class="btn pink compact" onclick="v644OpenPromptOptions('itinerary')">AI 健檢</button>
        <button class="btn blue compact" onclick="v64OpenImportModal('itinerary')">AI 匯入</button>
      </div>
    </div>`;
  }
  return v644PrevAiBarHtml ? v644PrevAiBarHtml(kind) : '';
};

function v644ValidDay(day){
  return !!day && (data.days||[]).some(d=>d.key===day);
}
function v644SpotMemo(s){
  const memo=String(s.memo||s.note||s.reason||'');
  const st=String(s.start||s.suggestedStart||s.recommendedStart||'');
  const en=String(s.end||s.suggestedEnd||s.recommendedEnd||'');
  const dur=String(s.duration||s.stay||s.stayTime||'');
  const parts=[];
  if(st || en) parts.push(`建議時段：${st||'未定'}${en?'－'+en:''}`);
  if(dur) parts.push(`建議停留：${dur}`);
  return [parts.join('｜'), memo].filter(Boolean).join('\n');
}
const v644PrevImportAiObject = typeof v64ImportAiObject==='function' ? v64ImportAiObject : null;
v64ImportAiObject = function(obj){
  const type=String(obj.janeselect_import_type || obj.type || '').trim();
  if(type==='spots' || Array.isArray(obj.spots)){
    const items = (typeof v64ArrayFromImport==='function') ? v64ArrayFromImport(obj,'spots') : (Array.isArray(obj.spots)?obj.spots:[]);
    let count=0;
    items.forEach(s=>{
      if(!s || !s.name) return;
      const day=String(s.day||'');
      data.spots.push({
        id:uid(),
        name:String(s.name||''),
        type:String(s.type||'景點'),
        day:v644ValidDay(day)?day:'',
        addr:String(s.addr||s.address||''),
        memo:v644SpotMemo(s),
        krName:String(s.krName||s.kr_name||''),
        krAddress:String(s.krAddress||s.kr_address||''),
        source:'ai'
      });
      count++;
    });
    if(count) return {count, label:'口袋景點'};
  }
  return v644PrevImportAiObject ? v644PrevImportAiObject(obj) : {count:0,label:'資料'};
};

const v644PrevRenderHelp = typeof renderHelp==='function' ? renderHelp : null;
renderHelp = function(...args){
  const r = v644PrevRenderHelp ? v644PrevRenderHelp.apply(this,args) : undefined;
  const log=$('v64UpdateLog') || $('helpView')?.querySelector('.card');
  if(log){
    log.innerHTML=`<h3>最新更新紀錄</h3><div class="box mint"><b>${esc(V644_VERSION_TEXT)}</b><br>AI 找景點提示詞加入航班、住宿、已排入行程與偏好參考，讓 AI 推薦的口袋景點備選日期與建議時間更符合實際旅程；行程 AI 偏好改為產生提示詞時設定，減少主畫面占用。</div>`;
  }
  v644UpdateFooterVersion();
  return r;
};
function v644UpdateFooterVersion(){
  document.querySelectorAll('footer strong,.siteFooterVersion').forEach(el=>el.textContent=V644_VERSION_SHORT);
}
setTimeout(()=>{try{v644UpdateFooterVersion(); if(typeof render==='function') render();}catch(e){console.warn(e)}},320);

const V645_VERSION_SHORT = "v64.5｜2026-05-31";
const V645_VERSION_TEXT = "v64.5｜AI 口袋景點時間欄位修正版";

function v646UpdateFooterVersion(){
  document.querySelectorAll('footer strong,.siteFooterVersion').forEach(el=>el.textContent=V646_VERSION_SHORT);
}
setTimeout(()=>{try{v646UpdateFooterVersion(); if(typeof render==='function') render();}catch(e){console.warn(e)}},380);
const V647_VERSION_SHORT = "v64.7｜2026-05-31";
const V647_VERSION_TEXT = "v64.7｜照片日記上傳與同步穩定修正版";

/* 同步：避免照片刪除/上傳後短時間連續 save 造成狀態卡在等待同步。 */
let v647CloudSaveInFlight = false;
let v647CloudSaveQueued = false;
let v647CloudSaveTimer = null;
let v647LastSaveReason = "";

function v648FormatSyncTime(at){
  const t = Number(at || 0);
  if(!t) return "";
  try{return new Date(t).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'});}catch(e){return "";}
}
function v648SyncLabelFromState(){
  const s = (typeof v632LastSyncState !== 'undefined' && v632LastSyncState) ? v632LastSyncState : null;
  if(s && s.title){
    const title = String(s.title || '');
    if(s.kind === 'on') return `已同步${v648FormatSyncTime(s.at) ? ' ' + v648FormatSyncTime(s.at) : ''}`;
    if(s.kind === 'warn'){
      if(title.includes('等待')) return '等待同步';
      if(title.includes('排隊')) return '同步排隊中';
      if(title.includes('載入')) return '載入中';
      return '同步中';
    }
    if(s.kind === 'off'){
      if(title.includes('尚未登入')) return '尚未登入';
      if(title.includes('尚未同步')) return '尚未同步';
      if(title.includes('無資料')) return '雲端無資料';
      if(title.includes('未授權')) return '帳號未授權';
      return title || '同步失敗';
    }
  }
  try{
    if(typeof syncStatusText === 'function') return syncStatusText();
  }catch(e){}
  return fbUser ? '尚未同步' : '尚未登入';
}
function v648SyncDotClassFromState(){
  const s = (typeof v632LastSyncState !== 'undefined' && v632LastSyncState) ? v632LastSyncState : null;
  if(s && s.kind){
    if(s.kind === 'on') return 'success';
    if(s.kind === 'warn') return 'syncing';
    if(s.kind === 'off') return 'error';
  }
  try{
    if(typeof syncStatus !== 'undefined') return syncStatus === 'syncing' ? 'syncing' : syncStatus === 'success' ? 'success' : syncStatus === 'error' ? 'error' : '';
  }catch(e){}
  return '';
}

/* 右上角帳號選單原本有自己的「尚未同步」狀態，與雲端 setSyncStatus 沒有完全連動。
   這裡只修顯示層：同步成功後，帳號選單也會改成已同步；不改 Firestore 寫入流程。 */
updateAccountSyncLine = function(){
  const el = document.getElementById('accountSyncLine');
  if(!el) return;
  const dotClass = v648SyncDotClassFromState();
  const label = v648SyncLabelFromState();
  el.innerHTML = `<span class="dot ${dotClass}"></span>${esc(label)}`;
};

const v648PreviousSetSyncStatus = typeof setSyncStatus === 'function' ? setSyncStatus : null;
setSyncStatus = function(kind,title,desc){
  if(typeof v632LastSyncState !== 'undefined'){
    v632LastSyncState = {kind:kind||'off', title:title||'', desc:desc||'', at:(typeof v632Now === 'function' ? v632Now() : Date.now())};
  }
  try{
    if(typeof syncStatus !== 'undefined'){
      const t = String(title || '');
      if(kind === 'warn') syncStatus = 'syncing';
      else if(kind === 'on'){
        syncStatus = 'success';
        if(typeof lastSyncTime !== 'undefined') lastSyncTime = new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'});
      }else if(kind === 'off') syncStatus = 'error';
    }
  }catch(e){}
  if(v648PreviousSetSyncStatus){
    v648PreviousSetSyncStatus(kind,title,desc);
  }else{
    const el=document.getElementById('syncStatus');
    if(el){
      const dotClass = kind==='on'?'on':kind==='warn'?'warn':'off';
      el.innerHTML = `<span class="syncDot ${dotClass}"></span><b>${esc(title||'')}</b>${desc?`<br>${esc(desc)}`:''}`;
    }
  }
  updateAccountSyncLine();
};

const v648PreviousToggleAccountMenu = typeof toggleAccountMenu === 'function' ? toggleAccountMenu : null;
toggleAccountMenu = function(){
  if(typeof ensureAccountMenuSyncLine === 'function') ensureAccountMenuSyncLine();
  updateAccountSyncLine();
  if(v648PreviousToggleAccountMenu) v648PreviousToggleAccountMenu();
};

const v648PreviousRenderAccountWidget = typeof renderAccountWidget === 'function' ? renderAccountWidget : null;
renderAccountWidget = function(user){
  const r = v648PreviousRenderAccountWidget ? v648PreviousRenderAccountWidget(user) : undefined;
  if(typeof ensureAccountMenuSyncLine === 'function') ensureAccountMenuSyncLine();
  updateAccountSyncLine();
  return r;
};

const v648PreviousSaveToCloudNow = typeof saveToCloudNow === 'function' ? saveToCloudNow : null;
saveToCloudNow = async function(options={}){
  const result = v648PreviousSaveToCloudNow ? await v648PreviousSaveToCloudNow(options) : false;
  if(result){
    const now = (typeof v632Now === 'function' ? v632Now() : Date.now());
    if(typeof v632LastSyncState !== 'undefined') v632LastSyncState = {kind:'on', title:'同步好了', desc:'', at:now};
    try{
      if(typeof syncStatus !== 'undefined') syncStatus='success';
      if(typeof lastSyncTime !== 'undefined') lastSyncTime = new Date(now).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'});
    }catch(e){}
    updateAccountSyncLine();
  }
  return result;
};

const v648PrevRenderHelp = typeof renderHelp === 'function' ? renderHelp : null;
renderHelp = function(...args){
  const r = v648PrevRenderHelp ? v648PrevRenderHelp.apply(this,args) : undefined;
  const log=document.getElementById('v64UpdateLog') || document.getElementById('helpView')?.querySelector('.card');
  if(log){
    log.innerHTML=`<h3>最新更新紀錄</h3><div class="box mint"><b>${esc(V648_VERSION_TEXT)}</b><br>修正右上角帳號選單的同步狀態未跟雲端同步結果連動的問題。手動同步成功後，狀態會正確顯示為已同步；照片書上傳與日記編輯流程維持 v64.7 的修正。</div>`;
  }
  v648UpdateFooterVersion();
  return r;
};
function v648UpdateFooterVersion(){
  document.querySelectorAll('footer strong,.siteFooterVersion').forEach(el=>el.textContent=V648_VERSION_SHORT);
}
setTimeout(()=>{try{v648UpdateFooterVersion(); updateAccountSyncLine();}catch(e){console.warn(e)}},480);

const V649_VERSION_SHORT = "v64.9｜2026-05-31";
const V649_VERSION_TEXT = "v64.9｜單一編輯裝置與同步防覆蓋版";
const V649_DEVICE_KEY = "janeselectTravelDeviceId";
const V649_LOCK_TTL = 2 * 60 * 1000;
const V649_HEARTBEAT_MS = 35 * 1000;
let v649DeviceId = localStorage.getItem(V649_DEVICE_KEY) || `dev_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
localStorage.setItem(V649_DEVICE_KEY, v649DeviceId);
let v649ReadOnly = false;
let v649LockOwner = null;
let v649HeartbeatTimer = null;
let v649LockUnsub = null;
let v649SelectingTrip = false;


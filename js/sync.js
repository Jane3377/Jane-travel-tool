/* ================================================================
   sync.js — 同步狀態顯示、鎖定 Banner、帳號 Widget
   ================================================================ */

/* ══════════════════════════════════════════
   同步狀態
   ══════════════════════════════════════════ */

function setSyncStatus(kind, title, desc = '') {
  // 裝置唯讀時，把「同步成功」降為警告
  if (deviceReadOnly && kind === 'on') {
    kind  = 'warn';
    title = '檢視模式';
    desc  = `由 ${lockOwnerText()} 編輯中`;
  }

  syncState = { kind, title, desc, at: Date.now() };

  // 主要同步狀態區塊
  const el = $('syncStatus');
  if (el) {
    const dotClass = kind === 'on' ? 'on' : kind === 'warn' ? 'warn' : 'off';
    el.innerHTML = `<span class="syncDot ${dotClass}"></span><b>${esc(title)}</b>${desc ? `<br>${esc(desc)}` : ''}`;
  }

  // 浮動小提示
  const mini = $('syncMini');
  if (mini) {
    mini.textContent = title + (desc ? '｜' + desc : '');
    mini.classList.add('show');
    clearTimeout(setSyncStatus._miniTimer);
    setSyncStatus._miniTimer = setTimeout(() => mini.classList.remove('show'), 1800);
  }

  updateSyncLine();
}

function syncLabel() {
  if (deviceReadOnly) return '檢視模式';
  const { kind, title, at } = syncState;
  if (kind === 'on') {
    const time = at ? new Date(at).toLocaleTimeString('zh-TW', { hour:'2-digit', minute:'2-digit' }) : '';
    return `已同步${time ? ' ' + time : ''}`;
  }
  if (kind === 'warn') return title.includes('等待') ? '等待同步' : '同步中';
  if (!fbUser) return '尚未登入';
  return title || '尚未同步';
}

function syncDotClass() {
  if (deviceReadOnly) return 'syncing';
  if (syncState.kind === 'on')   return 'success';
  if (syncState.kind === 'warn') return 'syncing';
  if (syncState.kind === 'off')  return 'error';
  return '';
}

function updateSyncLine() {
  const el = $('accountSyncLine');
  if (!el) return;
  el.innerHTML = `<span class="dot ${syncDotClass()}"></span>${esc(syncLabel())}`;
}

function syncBadge() {
  const { kind, at } = syncState;
  const label = kind === 'on' ? '雲端已同步' : kind === 'warn' ? '雲端同步中' : '雲端未確認';
  const time  = at ? new Date(at).toLocaleTimeString('zh-TW', { hour:'2-digit', minute:'2-digit' }) : '';
  return `<span class="syncCloudBadge ${kind}">${label}${time ? '｜' + time : ''}</span>`;
}

/* ══════════════════════════════════════════
   裝置鎖 Banner
   ══════════════════════════════════════════ */

function ensureLockBanner() {
  const header = document.querySelector('#mainApp header');
  if (!header || !currentTripId) return null;
  let el = $('lockBanner');
  if (!el) {
    el = document.createElement('div');
    el.id = 'lockBanner';
    header.appendChild(el);
  }
  return el;
}

function applyLockBanner() {
  if (!fbUser || !currentTripId || !deviceReadOnly) {
    $('lockBanner')?.remove();
    return;
  }
  const el = ensureLockBanner();
  if (!el) return;
  el.className = 'lockBanner viewOnly';
  el.innerHTML = `
    <div>
      <b>檢視模式</b>
      <span>由 ${esc(lockOwnerText())} 編輯中。可查看資料，但不會自動同步。</span>
    </div>
    <div class="btns">
      <button class="btn blue compact btn-allow" onclick="loadFromCloud({force:true})">載入最新</button>
      <button class="btn dark compact btn-allow" onclick="takeOverEdit()">接手編輯</button>
    </div>`;
}

/* ══════════════════════════════════════════
   旅程切換列（header 下方）
   ══════════════════════════════════════════ */

function renderTripSwitchBar() {
  const header = document.querySelector('#mainApp header');
  if (!header || !currentTripId) return;
  let bar = $('tripSwitchBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'tripSwitchBar';
    bar.className = 'tripSwitchBar noPrint';
    header.appendChild(bar);
  }
  bar.innerHTML = `
    <div class="miniTrip">
      <div class="tripMetaDest">${esc(data.trip.dest || '')}${data.trip.start && data.trip.end ? `｜${short(data.trip.start)}-${short(data.trip.end)}` : ''}</div>
      ${syncBadge()}
    </div>
    <div class="btns" style="margin:0">
      <button class="btn soft compact" onclick="backToTripList()">切換</button>
    </div>`;
}

/* ══════════════════════════════════════════
   帳號 Widget
   ══════════════════════════════════════════ */

function initials(user) {
  const name = user?.displayName || user?.email || '';
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || '?';
}

function renderAccountWidget(user) {
  const avatar = $('accountAvatar');
  const label  = $('accountLabel');
  const name   = $('accountName');
  const email  = $('accountEmail');
  if (!avatar) return;

  if (user) {
    avatar.innerHTML = user.photoURL
      ? `<img src="${user.photoURL}" alt="avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`
      : initials(user);
    if (label) label.textContent = '已登入';
    if (name)  name.textContent  = user.displayName || 'Google 帳號';
    if (email) email.textContent = user.email || '';
  } else {
    avatar.textContent = '登入';
    if (label) label.textContent = 'Google 登入';
    if (name)  name.textContent  = '尚未登入';
    if (email) email.textContent = '登入後可跨裝置同步';
  }

  // 控制按鈕顯示
  ['menuLoad','menuSave','menuLogout'].forEach(id => {
    const el = $(id);
    if (el) el.style.display = user ? '' : 'none';
  });
  const loginBtn = $('menuLogin');
  if (loginBtn) loginBtn.style.display = user ? 'none' : '';

  ensureThemeMenuButton();
  ensureBackupMenuButtons();
  updateSyncLine();
}

function toggleAccountMenu() {
  $('accountMenu')?.classList.toggle('show');
  ensureThemeMenuButton();
  ensureBackupMenuButtons();
}

function closeAccountMenu() {
  $('accountMenu')?.classList.remove('show');
}

function ensureAccountSyncLine() {
  const menu = $('accountMenu');
  if (!menu || $('accountSyncLine')) return;
  const who = menu.querySelector('.who');
  if (who) {
    const line = document.createElement('div');
    line.className = 'accountSyncLine';
    line.id = 'accountSyncLine';
    line.innerHTML = `<span class="dot"></span>尚未同步`;
    who.insertAdjacentElement('afterend', line);
  }
  updateSyncLine();
}

function ensureThemeMenuButton() {
  const menu = $('accountMenu');
  if (!menu || $('menuTheme')) return;
  const btn = document.createElement('button');
  btn.id        = 'menuTheme';
  btn.type      = 'button';
  btn.textContent = '外觀設定';
  btn.onclick   = () => { closeAccountMenu(); openThemePanel(); };
  const logout  = $('menuLogout');
  if (logout) menu.insertBefore(btn, logout);
  else menu.appendChild(btn);
}

function ensureBackupMenuButtons() {
  const menu = $('accountMenu');
  if (!menu || $('menuExport')) return;
  const logout = $('menuLogout');
  const before = el => { if (logout) menu.insertBefore(el, logout); else menu.appendChild(el); };

  const btnExport = document.createElement('button');
  btnExport.id          = 'menuExport';
  btnExport.type        = 'button';
  btnExport.textContent = '匯出備份';
  btnExport.onclick     = () => { closeAccountMenu(); exportTripBackup(); };
  before(btnExport);

  const btnImport = document.createElement('button');
  btnImport.id          = 'menuImport';
  btnImport.type        = 'button';
  btnImport.textContent = '匯入備份';
  btnImport.onclick     = () => { closeAccountMenu(); $('backupFileInput')?.click(); };
  before(btnImport);

  const btnUpdate = document.createElement('button');
  btnUpdate.id          = 'menuUpdate';
  btnUpdate.type        = 'button';
  btnUpdate.textContent = '檢查更新';
  btnUpdate.onclick     = () => { closeAccountMenu(); checkForUpdate({ manual: true }); };
  before(btnUpdate);

  // 清除全部資料：危險操作，放在選單最下方
  const btnReset = document.createElement('button');
  btnReset.id          = 'menuReset';
  btnReset.type        = 'button';
  btnReset.className    = 'acctMenuDanger';
  btnReset.textContent = '清除全部資料';
  btnReset.onclick     = () => { closeAccountMenu(); resetAllData(); };
  menu.appendChild(btnReset);
}

// 點外面關閉帳號選單
document.addEventListener('click', e => {
  const widget = $('accountWidget');
  if (widget && !widget.contains(e.target)) closeAccountMenu();
});

/* ══════════════════════════════════════════
   主題系統
   ══════════════════════════════════════════ */

function getThemePrefs() {
  try { return JSON.parse(localStorage.getItem(THEME_KEY) || '{}'); }
  catch (e) { return {}; }
}

function saveThemePrefs(prefs) {
  localStorage.setItem(THEME_KEY, JSON.stringify(prefs));
}

function applyThemePrefs(prefs = getThemePrefs()) {
  const safe = {
    mode:      THEME_CONFIG.modes[prefs.mode]       ? prefs.mode      : 'light',
    palette:   THEME_CONFIG.palettes[prefs.palette] ? prefs.palette   : 'seoul',
    cardStyle: THEME_CONFIG.cardStyles[prefs.cardStyle] ? prefs.cardStyle : 'soft'
  };
  document.body.setAttribute('data-theme-mode',    safe.mode);
  document.body.setAttribute('data-theme-palette', safe.palette);
  document.body.setAttribute('data-card-style',    safe.cardStyle);
  return safe;
}

function setThemePref(partial) {
  const current = applyThemePrefs(getThemePrefs());
  const next    = { ...current, ...partial };
  saveThemePrefs(next);
  applyThemePrefs(next);
  renderThemeWidgetState();
  toast('主題已套用');
}

function themeOpts(obj, selected) {
  return Object.entries(obj)
    .map(([k, v]) => `<option value="${k}" ${k === selected ? 'selected' : ''}>${v.label}</option>`)
    .join('');
}

function renderThemeWidgetState() {
  const prefs = applyThemePrefs(getThemePrefs());
  if ($('themeModeSelect'))      $('themeModeSelect').value      = prefs.mode;
  if ($('themePaletteSelect'))   $('themePaletteSelect').value   = prefs.palette;
  if ($('themeCardStyleSelect')) $('themeCardStyleSelect').value = prefs.cardStyle;
  const label = `${THEME_CONFIG.palettes[prefs.palette]?.label || ''}・${THEME_CONFIG.modes[prefs.mode]?.label || ''}`;
  if ($('themeCurrentText')) $('themeCurrentText').textContent = label;
}

function openThemePanel() {
  ensureThemePanel();
  renderThemeWidgetState();
  $('themePanelBackdrop')?.classList.add('show');
}

function closeThemePanel() {
  $('themePanelBackdrop')?.classList.remove('show');
}

function ensureThemePanel() {
  if ($('themePanelBackdrop')) return;
  const prefs = applyThemePrefs(getThemePrefs());
  document.body.insertAdjacentHTML('beforeend', `
    <div class="themePanelBackdrop noPrint" id="themePanelBackdrop"
         onclick="if(event.target===this)closeThemePanel()">
      <div class="themePanel">
        <div class="themePanelHead">
          <div>
            <h3>🎨 外觀設定</h3>
            <p>調整色系、明暗與卡片風格，只影響外觀，不影響旅程資料。</p>
          </div>
          <button class="themeCloseBtn" onclick="closeThemePanel()">×</button>
        </div>
        <div class="themePanelControls">
          <div class="themeField">
            <label>明暗模式</label>
            <select id="themeModeSelect" onchange="setThemePref({mode:this.value})">
              ${themeOpts(THEME_CONFIG.modes, prefs.mode)}
            </select>
          </div>
          <div class="themeField">
            <label>色系風格</label>
            <select id="themePaletteSelect" onchange="setThemePref({palette:this.value})">
              ${themeOpts(THEME_CONFIG.palettes, prefs.palette)}
            </select>
          </div>
          <div class="themeField">
            <label>卡片樣式</label>
            <select id="themeCardStyleSelect" onchange="setThemePref({cardStyle:this.value})">
              ${themeOpts(THEME_CONFIG.cardStyles, prefs.cardStyle)}
            </select>
          </div>
        </div>
        <div class="themePanelNote">外觀設定只存在此裝置，不影響雲端同步。</div>
      </div>
    </div>`);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeThemePanel();
});

/* ══════════════════════════════════════════
   資料備份
   ══════════════════════════════════════════ */

function exportTripBackup() {
  if (!data) return toast('目前沒有旅程資料');
  const dest    = data.trip?.dest || '未命名旅程';
  const today   = new Date().toISOString().slice(0, 10);
  const payload = {
    _backupVersion: 1,
    _appVersion:    APP_VERSION,
    _exportedAt:    new Date().toISOString(),
    _tripName:      dest,
    data
  };
  const blob     = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url      = URL.createObjectURL(blob);
  const a        = document.createElement('a');
  a.href         = url;
  a.download     = `旅管家備份_${dest}_${today}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('備份已下載');
}

function handleBackupFile(input) {
  const file = input.files?.[0];
  if (!file) return;
  input.value = '';
  const reader = new FileReader();
  reader.onload = e => {
    let payload;
    try { payload = JSON.parse(e.target.result); }
    catch { return toast('檔案格式錯誤，請選擇正確的備份 JSON'); }
    if (!payload?.data?.trip) return toast('備份內容無效，找不到旅程資料');
    confirmBackupImport(payload.data);
  };
  reader.readAsText(file);
}

async function confirmBackupImport(tripData) {
  if (!tripData) return;

  toast('匯入中…');

  const newId      = `trip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const tripName   = tripData.trip?.dest || '匯入的旅程';
  const importedAt = new Date().toISOString();

  currentTripId = newId;
  localStorage.setItem(CURRENT_TRIP_KEY, newId);
  data = normalizeData(tripData);

  tripList.unshift({ ...currentTripMeta(), cardColor: 'cream', importedAt });
  localSaveTrip();

  try {
    await selectTrip(newId);
    showImportBanner(tripName);
  } catch (e) {
    console.error('backup import selectTrip failed', e);
    toast('匯入失敗，請重試');
    return;
  }

  saveTripListCloud().catch(e => console.warn('backup cloud list save failed', e));
  saveToCloudNow().catch(e => console.warn('backup cloud save failed', e));
}

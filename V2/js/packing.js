/* ================================================================
   packing.js — 行李清單
   ================================================================ */

function addPackItem() {
  const name = $('pkn')?.value.trim();
  if (!name) return;
  data.packing.push({
    id: uid(), type: data.packView || 'pre',
    name, note: $('pkm')?.value || '', checked: false
  });
  if ($('pkn')) $('pkn').value = '';
  if ($('pkm')) $('pkm').value = '';
  save();
}

function togglePackItem(id) {
  const item = data.packing.find(x => x.id === id);
  if (item) { item.checked = !item.checked; save(); }
}

function deletePackItem(id) {
  data.packing = data.packing.filter(x => x.id !== id);
  save();
}

function uncheckCurrentList() {
  data.packing.filter(x => x.type === (data.packView || 'pre'))
    .forEach(x => x.checked = false);
  save();
}

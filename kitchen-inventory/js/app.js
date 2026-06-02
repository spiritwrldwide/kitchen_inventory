// app.js - main application logic
// KitchenOS - Kitchen Inventory & Expiry Tracker

// ---- state ----
let inventory = [];
let activity  = [];
let nextId    = 1;
let isManager = false;
let isDark    = true;

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

// product name autocomplete suggestions
const SUGGESTIONS = [
  "Heavy Cream","Whole Milk","Butter","Cheddar Cheese","Mozzarella",
  "Chicken Breast","Beef Tenderloin","Pork Ribs","Salmon Fillet","Shrimp",
  "Lettuce","Tomatoes","Carrots","Broccoli","Bell Peppers","Onions",
  "Olive Oil","Soy Sauce","Tomato Paste","Hot Sauce","Worcestershire",
  "Flour","Rice","Pasta","Bread Crumbs","Cornstarch","Sugar","Salt"
];

// ---- date helpers ----
function daysFromToday(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - TODAY) / 86400000);
}

function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

function todayStr() {
  return TODAY.toISOString().split("T")[0];
}

function addDays(n) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

// ---- item status ----
function getStatus(expiry) {
  const d = daysFromToday(expiry);
  if (d < 0)  return "expired";
  if (d <= 2) return "warning";
  return "fresh";
}

// ---- navigation ----
function navigate(page) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.getElementById("sec-" + page).classList.add("active");
  document.getElementById("nav-" + page).classList.add("active");

  if (page === "inventory") renderTable();
  if (page === "alerts")    renderAlerts();
  if (page === "dashboard") renderDashboard();
}

// ---- dashboard ----
function renderDashboard() {
  const total   = inventory.length;
  const expired = inventory.filter(i => getStatus(i.expiry) === "expired").length;
  const warning = inventory.filter(i => getStatus(i.expiry) === "warning").length;
  const fresh   = total - expired - warning;

  document.getElementById("statsCards").innerHTML = `
    <div class="card info">
      <div class="card-label">Total Items</div>
      <div class="card-value">${total}</div>
      <div class="card-sub">in inventory</div>
    </div>
    <div class="card fresh">
      <div class="card-label">Fresh</div>
      <div class="card-value">${fresh}</div>
      <div class="card-sub">good to use</div>
    </div>
    <div class="card warning">
      <div class="card-label">⚠ Warning</div>
      <div class="card-value">${warning}</div>
      <div class="card-sub">expiring &lt;48h</div>
    </div>
    <div class="card expired">
      <div class="card-label">✗ Expired</div>
      <div class="card-value">${expired}</div>
      <div class="card-sub">need removal</div>
    </div>
  `;

  const badgeCount = expired + warning;
  const badge = document.getElementById("alertBadge");
  badge.textContent = badgeCount;
  badge.style.display = badgeCount > 0 ? "flex" : "none";

  document.getElementById("activityList").innerHTML = activity.map(a => `
    <div class="activity-item">
      <div class="activity-dot" style="background:${a.color};"></div>
      <div class="activity-text">${a.text}</div>
      <div class="activity-time">${a.time}</div>
    </div>
  `).join("");
}

// ---- inventory table ----
function renderTable() {
  const q      = document.getElementById("searchInput").value.toLowerCase();
  const cat    = document.getElementById("filterCat").value;
  const loc    = document.getElementById("filterLoc").value;
  const status = document.getElementById("filterStatus").value;

  const filtered = inventory.filter(item => {
    const s = getStatus(item.expiry);
    if (q && !item.name.toLowerCase().includes(q) && !item.cat.toLowerCase().includes(q)) return false;
    if (cat    && item.cat !== cat) return false;
    if (loc    && item.loc !== loc) return false;
    if (status && s.toLowerCase() !== status.toLowerCase()) return false;
    return true;
  });

  document.getElementById("inventoryCount").textContent =
    `${filtered.length} of ${inventory.length} items`;

  const tbody = document.getElementById("inventoryBody");
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty">
      <div class="empty-icon">📦</div>
      <div class="empty-title">No items found</div>
      <div class="empty-sub">Adjust filters or add new inventory</div>
    </div></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(item => {
    const s        = getStatus(item.expiry);
    const days     = daysFromToday(item.expiry);
    const badgeCls = s === "fresh" ? "badge-fresh" : s === "warning" ? "badge-warning" : "badge-expired";
    const dayLabel = days < 0 ? `${Math.abs(days)}d ago` : days === 0 ? "Today" : `${days}d left`;

    const actions = isManager
      ? `<button class="action-btn" title="Edit"   onclick="editItem(${item.id})">✏️</button>
         <button class="action-btn" title="Delete" onclick="deleteItem(${item.id})">🗑️</button>`
      : `<button class="action-btn" title="Mark used" onclick="markUsed(${item.id})">✅</button>`;

    return `<tr class="row-${s}">
      <td><strong>${item.name}</strong></td>
      <td><span class="badge badge-cat">${item.cat}</span></td>
      <td style="font-family:var(--mono);font-size:.76rem;color:var(--text2);">${fmtDate(item.received)}</td>
      <td style="font-family:var(--mono);font-size:.76rem;">${fmtDate(item.expiry)}<br>
          <span style="font-size:.68rem;color:var(--text3);">${dayLabel}</span></td>
      <td>${item.qty} ${item.unit}</td>
      <td style="color:var(--text2);">${item.loc}</td>
      <td><span class="badge ${badgeCls}">${s.charAt(0).toUpperCase() + s.slice(1)}</span></td>
      <td style="white-space:nowrap;">${actions}</td>
    </tr>`;
  }).join("");
}

function markUsed(id) {
  const item = inventory.find(i => i.id === id);
  if (!item) return;
  logActivity(`${item.name} marked as Used`, "var(--sky)");
  inventory = inventory.filter(i => i.id !== id);
  saveInventory(inventory);
  renderTable();
  renderDashboard();
  showToast("✅", "Marked as Used", `${item.name} removed from inventory.`, "fresh");
}

function deleteItem(id) {
  const item = inventory.find(i => i.id === id);
  if (!item || !confirm(`Delete "${item.name}"?`)) return;
  logActivity(`${item.name} deleted by manager`, "var(--rose)");
  inventory = inventory.filter(i => i.id !== id);
  saveInventory(inventory);
  renderTable();
  renderDashboard();
  showToast("🗑️", "Item Deleted", `${item.name} removed from inventory.`, "warning");
}

function editItem(id) {
  const item = inventory.find(i => i.id === id);
  if (!item) return;
  document.getElementById("itemName").value     = item.name;
  document.getElementById("itemCat").value      = item.cat;
  document.getElementById("itemLoc").value      = item.loc;
  document.getElementById("itemReceived").value = item.received;
  document.getElementById("itemExpiry").value   = item.expiry;
  document.getElementById("itemQty").value      = item.qty;
  document.getElementById("itemUnit").value     = item.unit;
  inventory = inventory.filter(i => i.id !== id);
  openModal("add");
}

function clearExpired() {
  const count = inventory.filter(i => getStatus(i.expiry) === "expired").length;
  inventory = inventory.filter(i => getStatus(i.expiry) !== "expired");
  saveInventory(inventory);
  renderDashboard();
  renderAlerts();
  showToast("🧹", "Cleared", `${count} expired item(s) removed.`, "warning");
}

// ---- alerts ----
function renderAlerts() {
  const issues = inventory
    .filter(i => getStatus(i.expiry) !== "fresh")
    .sort((a, b) => new Date(a.expiry) - new Date(b.expiry));

  const list = document.getElementById("alertList");
  if (issues.length === 0) {
    list.innerHTML = `<div class="empty">
      <div class="empty-icon">✅</div>
      <div class="empty-title">All clear!</div>
      <div class="empty-sub">No items need attention right now.</div>
    </div>`;
    return;
  }

  list.innerHTML = issues.map(item => {
    const s    = getStatus(item.expiry);
    const days = daysFromToday(item.expiry);
    const msg  = days < 0
      ? `Expired ${Math.abs(days)} day(s) ago`
      : days === 0 ? "Expires today!"
      : days === 1 ? "Expires tomorrow"
      : "Expiring soon";
    return `<div class="alert-item ${s === "expired" ? "critical" : "warning"}">
      <div class="alert-icon">${s === "expired" ? "🚨" : "⚠️"}</div>
      <div class="alert-body">
        <div class="alert-title">${item.name}</div>
        <div class="alert-meta">${item.cat} · ${item.loc} · ${item.qty} ${item.unit}</div>
      </div>
      <div class="alert-time">${msg}</div>
    </div>`;
  }).join("");
}

// ---- add item form ----
function addItem() {
  const name     = document.getElementById("itemName").value.trim();
  const cat      = document.getElementById("itemCat").value;
  const loc      = document.getElementById("itemLoc").value;
  const received = document.getElementById("itemReceived").value;
  const expiry   = document.getElementById("itemExpiry").value;
  const qty      = parseFloat(document.getElementById("itemQty").value);
  const unit     = document.getElementById("itemUnit").value;

  if (!name || !cat || !loc || !received || !expiry || isNaN(qty)) {
    showToast("❌", "Missing Fields", "Please fill all required fields.", "expired");
    return;
  }

  inventory.push({ id: nextId++, name, cat, received, expiry, qty, unit, loc });
  saveInventory(inventory);
  logActivity(`${name} added to ${loc}`, "var(--emerald)");
  closeModal("add");
  renderDashboard();
  showToast("✅", "Item Added", `${name} added to ${loc}.`, "fresh");
}

function applyPreset(el, days) {
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
  el.classList.add("active");
  document.getElementById("itemExpiry").value = addDays(days);
  if (!document.getElementById("itemReceived").value)
    document.getElementById("itemReceived").value = todayStr();
}

// ---- autocomplete ----
function handleAutocomplete(input) {
  const val  = input.value.toLowerCase();
  const list = document.getElementById("autocompleteList");
  if (!val) { list.classList.remove("open"); return; }

  const matches = SUGGESTIONS.filter(s => s.toLowerCase().includes(val)).slice(0, 5);
  if (matches.length === 0) { list.classList.remove("open"); return; }

  list.innerHTML = matches.map(m =>
    `<div class="autocomplete-item" onclick="selectSuggestion('${m}')">${m}</div>`
  ).join("");
  list.classList.add("open");
}

function selectSuggestion(name) {
  document.getElementById("itemName").value = name;
  document.getElementById("autocompleteList").classList.remove("open");
}

document.addEventListener("click", e => {
  if (!e.target.closest(".autocomplete-wrap"))
    document.getElementById("autocompleteList").classList.remove("open");
});

// ---- waste report modal ----
function openWasteReport() {
  const expired = inventory.filter(i => getStatus(i.expiry) === "expired");
  document.getElementById("wasteBody").innerHTML = expired.length === 0
    ? `<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px;">No expired items</td></tr>`
    : expired.map(i =>
        `<tr>
          <td>${i.name}</td><td>${i.cat}</td>
          <td style="font-family:var(--mono);font-size:.76rem;">${fmtDate(i.expiry)}</td>
          <td>${i.qty} ${i.unit}</td><td>${i.loc}</td>
        </tr>`
      ).join("");
}

// ---- modals ----
function openModal(type) {
  if (type === "add") {
    document.getElementById("addModal").classList.add("open");
    document.getElementById("itemReceived").value = todayStr();
  }
  if (type === "waste") {
    openWasteReport();
    document.getElementById("wasteModal").classList.add("open");
  }
}

function closeModal(type) {
  if (type === "add") {
    document.getElementById("addModal").classList.remove("open");
    ["itemName","itemCat","itemLoc","itemExpiry","itemQty"].forEach(id => {
      document.getElementById(id).value = "";
    });
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
  }
  if (type === "waste") {
    document.getElementById("wasteModal").classList.remove("open");
  }
}

// ---- toast notifications ----
function showToast(icon, title, msg, type) {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = "toast";
  const colors = { fresh:"var(--emerald)", expired:"var(--rose)", warning:"var(--amber)", info:"var(--sky)" };
  toast.style.borderLeft = `3px solid ${colors[type] || "var(--border2)"}`;
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${msg}</div>
    </div>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("out");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ---- role & theme ----
function toggleRole() {
  isManager = !isManager;
  document.getElementById("roleBadge").textContent = isManager ? "🔑 Manager" : "👨‍🍳 Staff";
  document.getElementById("settingsRoleDesc").textContent = isManager
    ? "Manager — full access + exports" : "Staff — view & mark items";
  document.getElementById("wasteReportRow").style.display    = isManager ? "flex"        : "none";
  document.getElementById("clearExpiredBtn").style.display   = isManager ? "inline-flex" : "none";
  document.getElementById("clearExpiredLocked").style.display= isManager ? "none"        : "inline";
  if (document.getElementById("sec-inventory").classList.contains("active")) renderTable();
  showToast(isManager ? "🔑" : "👨‍🍳", "Role Changed",
    isManager ? "Switched to Manager view" : "Switched to Staff view", "info");
}

function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle("light", !isDark);
  document.getElementById("themeBtn").textContent = isDark ? "🌙" : "☀️";
  const toggle = document.getElementById("darkToggle");
  isDark ? toggle.classList.add("on") : toggle.classList.remove("on");
}

// ---- activity log helper ----
function logActivity(text, color) {
  activity.unshift({ text, time: "Just now", color });
  saveActivity(activity);
}

// ---- init ----
(function init() {
  inventory = loadInventory();
  activity  = loadActivity();
  nextId    = inventory.reduce((max, i) => Math.max(max, i.id), 0) + 1;
  renderDashboard();
})();

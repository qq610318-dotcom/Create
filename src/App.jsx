import { useState, useRef, useEffect } from "react";

const SUPABASE_URL = "https://gwxazunhurdxpocamcig.supabase.co";
const SUPABASE_KEY = "sb_publishable_1j5POtZU8pt2y3JO_SGDpg_hdm-AVoD
";

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "",
      ...options.headers,
    },
  });
  if (!res.ok) { const err = await res.text(); throw new Error(err); }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function loadPromosCloud() {
  try {
    const data = await sbFetch("/promos?order=created_at.asc");
    return (data || []).map(r => ({ id: r.id, name: r.name, month: r.month, customerPrice: r.customer_price, costs: r.costs || {} }));
  } catch { return []; }
}

async function savePromoCloud(item) {
  const body = { id: item.id, name: item.name, month: item.month || null, customer_price: Number(item.customerPrice) || null, costs: item.costs || {} };
  await sbFetch("/promos", { method: "POST", prefer: "resolution=merge-duplicates", body: JSON.stringify(body) });
}

async function deletePromoCloud(id) {
  await sbFetch(`/promos?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
}
const PW = { 一級輔導: "1111", 皇家輔導: "royal" };
const ADMIN_PW = "FDR2024";
const STORAGE_PREFIX = "profit_v3_";
const lvIdx = { 零售: 0, 任兩盒: 1, 混品VIP: 2, 實習加盟: 3, 三級零售: 4, 三級輔導: 5, 二級輔導: 6, 一級輔導: 7, 皇家輔導: 8 };
const PROMO_COST_LEVELS = ["實習加盟", "三級零售", "三級輔導", "二級輔導", "一級輔導", "皇家輔導"];
const CUSTOMER_TARGETS = ["零售", "任兩盒", "混品VIP"];
const targetsMap = {
  實習加盟: ["零售", "任兩盒", "混品VIP"], 三級零售: ["零售", "任兩盒", "混品VIP"],
  三級輔導: ["零售", "任兩盒", "混品VIP", "三級零售"], 二級輔導: ["零售", "任兩盒", "混品VIP", "三級零售", "三級輔導"],
  一級輔導: ["零售", "任兩盒", "混品VIP", "三級零售", "三級輔導", "二級輔導"],
  皇家輔導: ["零售", "任兩盒", "混品VIP", "三級零售", "三級輔導", "二級輔導", "一級輔導"],
};
const tIcon = { 零售: "🛍", 任兩盒: "📦", 混品VIP: "💎", 實習加盟: "🌱", 三級零售: "📋", 三級輔導: "📊", 二級輔導: "⭐", 一級輔導: "🔥", 皇家輔導: "👑" };

const memStore = {};
function storageGet(key) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : memStore[key] || null; } catch { return memStore[key] || null; } }
function storageSet(key, val) { memStore[key] = val; try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
function storageRemove(key) { delete memStore[key]; try { localStorage.removeItem(key); } catch {} }
function storageKeys() { const keys = new Set(Object.keys(memStore)); try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k) keys.add(k); } } catch {} return [...keys]; }
function sk(lv, m) { return STORAGE_PREFIX + lv + "*" + m; }
function loadEntries(lv, m) { return storageGet(sk(lv, m)) || { entries: [], seq: 0 }; }
function saveEntries(lv, m, entries, seq) { storageSet(sk(lv, m), { entries, seq }); }
function getSavedMonths(lv) { const pfx = STORAGE_PREFIX + lv + "*", months = []; storageKeys().forEach(k => { if (k?.startsWith(pfx)) { const mo = k.slice(pfx.length); if (/^\d{4}-\d{2}$/.test(mo)) months.push(mo); } }); return [...new Set(months)].sort().reverse(); }
function getDays(m) { if (!m) return 30; const [y, mm] = m.split("-").map(Number); return new Date(y, mm, 0).getDate(); }
function nowMonth() { const n = new Date(); return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0"); }
function isCustomer(target) { return CUSTOMER_TARGETS.includes(target); }
function getPromoProfit(promo, myLevel, target) {
  const myCost = Number(promo.costs?.[myLevel]); if (!myCost) return null;
  if (isCustomer(target)) { const sp = Number(promo.customerPrice); if (!sp) return null; return { sellPrice: sp, myCost, profit: sp - myCost }; }
  else { const tc = Number(promo.costs?.[target]); if (!tc) return null; return { sellPrice: tc, myCost, profit: tc - myCost }; }
}
const priceTable = {
  beauty: [
    { id: "b01", name: "水光錠(60顆/盒)", prices: [1680,1580,1480,1260,1080,1040,920,830,740] },
    { id: "b02", name: "水光纖帶面膜精裝盒(5片/盒)", prices: [700,650,600,550,500,485,450,400,360] },
    { id: "b03", name: "水光纖帶面膜環保箱(20片/箱)", prices: [null,null,2200,null,1800,1740,1600,1440,1300] },
    { id: "b04", name: "水光纖帶面膜體驗包(30ml/片)", prices: [150,null,null,null,null,null,null,null,null] },
    { id: "b05", name: "雪聚露(120ml/瓶)", prices: [1280,1180,1100,990,860,830,770,690,620] },
    { id: "b06", name: "婕肌零(200ml/瓶)", prices: [990,900,830,780,660,635,580,510,440] },
    { id: "b07", name: "婕肌零體驗包(7ml/包)", prices: [40,null,null,30,25,24,20,17,15] },
    { id: "b08", name: "精純玻尿酸保濕原液(30ml/瓶)", prices: [990,900,830,780,660,635,580,510,440] },
    { id: "b09", name: "小白瓶(100ml/瓶)", prices: [1280,1180,1100,990,860,830,770,690,620] },
    { id: "b10", name: "護手霜(50ml/支)", prices: [680,630,600,530,455,440,410,365,320] },
    { id: "b11", name: "法樂蓬洗髮露(500ml/瓶)", prices: [1280,1180,1100,990,860,830,770,690,620] },
    { id: "b12", name: "法樂蓬體驗包(8ml/包)", prices: [30,null,null,24,21,20,17,14,12] },
    { id: "b13", name: "法樂蓬養髮原液(30ml/瓶)", prices: [1080,990,900,840,720,695,640,570,500] },
  ],
  fiber: [
    { id: "f01", name: "纖纖飲X(14入/盒)", prices: [1480,1380,1280,1160,990,955,880,790,700] },
    { id: "f02", name: "纖飄錠(60錠/盒)", prices: [1480,1380,1280,1160,990,955,880,790,700] },
    { id: "f03", name: "雪花紫纖飲(14包/盒)", prices: [990,null,null,780,660,635,580,510,440] },
    { id: "f04", name: "爆纖錠(120錠/盒)", prices: [880,800,740,660,580,560,520,470,430] },
    { id: "f05", name: "爆纖錠體驗包(30錠/包)", prices: [240,null,null,190,164,158,146,133,120] },
    { id: "f06", name: "纖酵宿(60錠/盒)", prices: [990,900,830,780,660,635,580,510,440] },
    { id: "f07", name: "纖酵宿體驗包(10包/包)", prices: [190,null,null,145,117,113,103,89,75] },
    { id: "f08", name: "肽纖飲-可可/奶茶(10入/盒)", prices: [990,900,830,780,660,635,580,510,440] },
    { id: "f09", name: "金盞花高鈣葉黃素晶亮凍(10入/盒)", prices: [1080,990,900,840,720,695,640,570,500] },
    { id: "f10", name: "複方金盞花葉黃素EX飲(12入/盒)", prices: [680,630,600,530,455,440,410,365,320] },
    { id: "f11", name: "高機能益生菌(30入/盒)", prices: [1280,1180,1100,990,860,830,770,690,620] },
    { id: "f12", name: "九國英雄(20錠/包)", prices: [680,630,600,530,455,440,410,365,320] },
    { id: "f13", name: "癒肺草正冠茶(20入/盒)", prices: [990,900,830,780,660,635,580,510,440] },
    { id: "f14", name: "固樂纖(60粒/盒)", prices: [1680,1580,1480,1260,1080,1040,920,830,740] },
  ],
};
const C = { bg: "#fdf6f3", card: "#fff8f6", border: "rgba(201,160,144,.22)", accent: "#c9a090", accentLight: "#e8c4b8", gold: "#c8a96e", text: "#4a3530", muted: "#b09490", green: "#7dab8f", red: "#d4756a" };

const css = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=Noto+Serif+TC:wght@400;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:rgba(201,160,144,.3);border-radius:3px}
input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}
input[type=month]::-webkit-calendar-picker-indicator{opacity:.5;cursor:pointer}
@keyframes fadeInUp{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
@keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
.screen-enter{animation:slideUp .28s ease} .fade-in{animation:fadeIn .22s ease}
.btn-level{background:#fff8f6;border:1px solid rgba(201,160,144,.22);border-radius:14px;box-shadow:0 2px 14px rgba(201,160,144,.08);padding:16px 18px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;text-align:left;width:100%;transition:all .18s ease}
.btn-level:hover{border-color:#c9a090;box-shadow:0 4px 20px rgba(201,160,144,.18);transform:translateY(-1px)}
.tag-btn{padding:7px 14px;border-radius:20px;font-size:12px;cursor:pointer;transition:all .15s ease;border:1px solid rgba(201,160,144,.22);background:#fff8f6;color:#b09490}
.tag-btn.active{background:#c9a090;border-color:#c9a090;color:#fff;font-weight:700}
.tag-btn:hover:not(.active){border-color:#c9a090;color:#c9a090}
.series-tab{padding:7px 16px;border-radius:20px;font-size:12px;cursor:pointer;transition:all .15s ease;border:1px solid rgba(201,160,144,.22);background:#fff8f6;color:#b09490}
.series-tab.active{background:#f2e6e1;border-color:#c9a090;color:#4a3530}
.month-tab{padding:6px 13px;border-radius:16px;font-size:12px;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .15s ease;border:1px solid rgba(201,160,144,.22);background:#fff8f6;color:#b09490}
.month-tab.active{background:#e8d5ce;border-color:#c9a090;color:#c8a96e;font-weight:700}
.entry-row{background:#fff8f6;border:1px solid rgba(201,160,144,.22);border-radius:12px;padding:13px 14px;margin-bottom:8px;display:flex;align-items:flex-start;gap:12px;transition:all .15s ease;animation:slideUp .2s ease}
.entry-row:hover{border-color:rgba(201,160,144,.4);box-shadow:0 2px 12px rgba(201,160,144,.1)}
.product-row{background:#fff8f6;border:1px solid rgba(201,160,144,.22);border-radius:12px;padding:11px 13px;margin-bottom:7px;display:flex;align-items:center;gap:10px;transition:border-color .15s}
.product-row:hover{border-color:rgba(201,160,144,.4)}
.qty-ctrl{display:flex;align-items:center;background:#f2e6e1;border:1px solid rgba(201,160,144,.22);border-radius:8px;overflow:hidden}
.qty-btn{width:30px;height:30px;background:none;border:none;color:#c9a090;font-size:17px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .12s}
.qty-btn:hover{background:rgba(201,160,144,.15)}
.stat-card{background:#fff8f6;border:1px solid rgba(201,160,144,.22);border-radius:12px;padding:13px 15px}
.progress-bar{background:#e8d5ce;border-radius:4px;height:3px;overflow:hidden;margin-bottom:8px}
.progress-fill{height:100%;background:linear-gradient(90deg,#7dab8f,#c9a090);border-radius:4px;transition:width .4s ease}
.btn-primary{width:100%;padding:15px;background:linear-gradient(135deg,#c9a090,#e8c4b8);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;letter-spacing:2px;cursor:pointer;font-family:'Noto Serif TC',serif;box-shadow:0 4px 18px rgba(201,160,144,.3);transition:all .18s ease}
.btn-primary:hover{box-shadow:0 6px 24px rgba(201,160,144,.4);transform:translateY(-1px)}
.btn-primary:disabled{opacity:.6;cursor:not-allowed;transform:none}
.btn-secondary{width:100%;padding:13px;background:none;border:1px solid #c9a090;border-radius:12px;color:#c9a090;font-size:13px;cursor:pointer;margin-top:8px;transition:all .15s}
.btn-secondary:hover{background:rgba(201,160,144,.06)}
.btn-danger{width:100%;padding:13px;background:none;border:1px solid rgba(212,117,106,.35);border-radius:12px;color:#d4756a;font-size:13px;cursor:pointer;margin-top:8px;transition:all .15s}
.btn-ghost{width:100%;padding:13px;background:none;border:1px solid rgba(201,160,144,.22);border-radius:12px;color:#b09490;font-size:13px;cursor:pointer;margin-top:10px;transition:all .15s}
.btn-ghost:hover{border-color:#c9a090;color:#c9a090}
.input-base{width:100%;background:#f2e6e1;border:1px solid rgba(201,160,144,.22);border-radius:8px;padding:10px 14px;color:#4a3530;font-size:14px;outline:none;font-family:inherit;transition:border-color .15s}
.input-base:focus{border-color:#c9a090}
.sec-label{font-size:11px;color:#b09490;letter-spacing:3px;margin:18px 0 10px}
.ornament-line{width:1px;height:40px;background:linear-gradient(180deg,transparent,#c9a090,transparent);margin:0 auto}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:999;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(6px);animation:fadeIn .2s ease}
.modal-box{background:#fff8f6;border:1px solid rgba(201,160,144,.35);border-radius:18px;padding:30px 26px;width:100%;max-width:330px;text-align:center;animation:slideUp .25s ease}
.toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#fff8f6;border:1px solid rgba(201,160,144,.35);box-shadow:0 4px 20px rgba(201,160,144,.25);border-radius:20px;padding:10px 22px;font-size:13px;color:#4a3530;z-index:9999;white-space:nowrap;animation:fadeInUp .25s ease}
.page-header{padding:18px 18px 0;display:flex;align-items:center;gap:10px;background:#fdf6f3;flex-shrink:0}
.back-btn{width:34px;height:34px;background:none;border:1px solid rgba(201,160,144,.35);border-radius:50%;color:#c9a090;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s}
.back-btn:hover{background:rgba(201,160,144,.1)}
.sticky-bottom{position:sticky;bottom:0;padding:12px 18px 24px;background:linear-gradient(rgba(253,246,243,0),#fdf6f3 55%)}
.summary-card{margin:0 18px 10px;background:#fff8f6;border:1px solid rgba(201,160,144,.22);border-radius:14px;box-shadow:0 2px 14px rgba(201,160,144,.12);padding:16px 18px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.spinner{width:16px;height:16px;border:2px solid rgba(201,160,144,.3);border-top-color:#c9a090;border-radius:50%;animation:spin .7s linear infinite;display:inline-block;vertical-align:middle;margin-right:6px}
.cloud-badge{display:inline-flex;align-items:center;gap:4px;font-size:10px;color:#7dab8f;background:rgba(125,171,143,.1);border:1px solid rgba(125,171,143,.25);border-radius:10px;padding:2px 8px;margin-left:8px}
`;

function PageHeader({ onBack, title }) {
  return (
    <div className="page-header">
      <button className="back-btn" onClick={onBack}>←</button>
      <div style={{ fontFamily: "'Noto Serif TC',serif", fontSize: 16, color: C.accent, letterSpacing: 2 }}>{title}</div>
    </div>
  );
}
function Toast({ msg }) { return msg ? <div className="toast">{msg}</div> : null; }
function QtyCtrl({ value, onChange }) {
  return (
    <div className="qty-ctrl">
      <button className="qty-btn" onClick={() => onChange(Math.max(0, value - 1))}>−</button>
      <input type="number" value={value} min={0} onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        style={{ width: 36, textAlign: "center", fontSize: 14, fontWeight: 500, color: C.text, border: "none", background: "none", outline: "none" }} />
      <button className="qty-btn" onClick={() => onChange(value + 1)}>＋</button>
    </div>
  );
}
function S1({ onSelect, onAdmin }) {
  const levels = [
    { name: "實習加盟", hint: "可賣：零售客・任兩盒・VIP", icon: "🌱" },
    { name: "三級零售", hint: "可賣：零售客・任兩盒・VIP", icon: "📦" },
    { name: "三級輔導", hint: "可賣：零售客・任兩盒・VIP・三級零售", icon: "📊" },
    { name: "二級輔導", hint: "可賣：零售至三級輔導", icon: "⭐" },
    { name: "一級輔導", hint: "需要密碼解鎖", icon: "🔒", locked: true },
    { name: "皇家輔導", hint: "需要密碼解鎖", icon: "👑", locked: true },
  ];
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }} className="screen-enter">
        <div style={{ fontSize: 10, letterSpacing: 6, color: C.accent, opacity: .6, marginBottom: 8 }}>MONTHLY PROFIT</div>
        <div style={{ fontFamily: "'Noto Serif TC',serif", fontSize: 28, letterSpacing: 5, color: C.text }}>月淨利計算</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 6, letterSpacing: 3 }}>選擇您的夥伴階級</div>
      </div>
      <div className="ornament-line" style={{ marginBottom: 28 }} />
      <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 9 }} className="screen-enter">
        {levels.map(lv => (
          <button key={lv.name} className="btn-level" onClick={() => onSelect(lv.name, lv.locked)}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: 1, color: C.text }}>{lv.name}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3, letterSpacing: 1 }}>{lv.hint}</div>
            </div>
            <div style={{ fontSize: 22 }}>{lv.icon}</div>
          </button>
        ))}
        <button className="btn-level" onClick={onAdmin} style={{ marginTop: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: 1, color: C.muted }}>後台管理</div>
            <div style={{ fontSize: 11, color: C.muted, opacity: .7, marginTop: 3 }}>管理活動組合商品</div>
          </div>
          <div style={{ fontSize: 20 }}>⚙️</div>
        </button>
      </div>
    </div>
  );
}

function AdminScreen({ onBack, toast }) {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  useEffect(() => { loadPromosCloud().then(data => { setPromos(data); setLoading(false); }); }, []);

  async function handleSave(item) {
    try { await savePromoCloud(item); const updated = await loadPromosCloud(); setPromos(updated); setEditing(null); toast(item.id ? "已更新組合 ✓" : "已新增組合 ✓"); }
    catch(e) { toast("錯誤：" + (e?.message || String(e)).slice(0,60)); }
  }
  async function handleDelete(id) {
    try { await deletePromoCloud(id); setPromos(p => p.filter(x => x.id !== id)); toast("已刪除"); }
    catch(e) { toast("錯誤：" + (e?.message || String(e)).slice(0,60)); }
  }

  if (editing !== null) return <AdminForm item={editing === "new" ? null : editing} onSave={handleSave} onBack={() => setEditing(null)} />;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <PageHeader onBack={onBack} title="後台管理" />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 140px" }} className="screen-enter">
        <div style={{ display: "flex", alignItems: "center", margin: "18px 0 10px" }}>
          <span style={{ fontSize: 11, color: C.muted, letterSpacing: 3 }}>活動組合商品</span>
          <span className="cloud-badge">☁ 雲端同步</span>
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.8 }}>你在後台新增的活動，所有夥伴都能即時看到 ✓</div>
        {loading && <div style={{ textAlign: "center", padding: "40px 0", color: C.muted, fontSize: 13 }}><span className="spinner" />載入中...</div>}
        {!loading && !promos.length && <div style={{ textAlign: "center", padding: "48px 0", color: C.muted, fontSize: 13 }}><div style={{ fontSize: 36, marginBottom: 12 }}>🎁</div>尚無活動組合</div>}
        {promos.map(p => (
          <div key={p.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 10 }} className="fade-in">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>🎁 {p.name}</div>
                {p.month && <div style={{ fontSize: 11, color: C.accent, marginTop: 3 }}>📅 {p.month}</div>}
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>客人售價：<span style={{ color: C.text, fontWeight: 600 }}>{p.customerPrice ? p.customerPrice + " 元" : "未設定"}</span></div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setEditing(p)} style={{ background: "none", border: `1px solid rgba(201,160,144,.35)`, borderRadius: 8, padding: "5px 12px", fontSize: 12, color: C.accent, cursor: "pointer" }}>編輯</button>
                <button onClick={() => handleDelete(p.id)} style={{ background: "none", border: `1px solid rgba(212,117,106,.3)`, borderRadius: 8, padding: "5px 12px", fontSize: 12, color: C.red, cursor: "pointer" }}>刪除</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {PROMO_COST_LEVELS.map(lv => { const cost = p.costs?.[lv]; if (!cost) return null; return <div key={lv} style={{ background: "#f2e6e1", borderRadius: 8, padding: "6px 10px" }}><div style={{ fontSize: 10, color: C.muted, letterSpacing: 1 }}>{lv} 成本</div><div style={{ fontSize: 12, color: C.text, marginTop: 2 }}>{cost} 元</div></div>; })}
            </div>
          </div>
        ))}
      </div>
      <div className="sticky-bottom">
        <button className="btn-primary" onClick={() => setEditing("new")}>＋ 新增活動組合</button>
        <button className="btn-secondary" onClick={onBack}>← 返回主頁</button>
      </div>
    </div>
  );
}
function AdminForm({ item, onSave, onBack }) {
  const [name, setName] = useState(item?.name || "");
  const [month, setMonth] = useState(item?.month || nowMonth());
  const [customerPrice, setCustomerPrice] = useState(item?.customerPrice || "");
  const [costs, setCosts] = useState(item?.costs || {});
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) { alert("請輸入組合名稱"); return; }
    if (!customerPrice) { alert("請填入客人售價"); return; }
    if (!PROMO_COST_LEVELS.some(lv => costs[lv])) { alert("請至少填入一個階級的進貨成本"); return; }
    setSaving(true);
    await onSave({ id: item?.id || "promo_" + Date.now(), name: name.trim(), month, customerPrice: Number(customerPrice), costs });
    setSaving(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <PageHeader onBack={onBack} title={item ? "編輯活動組合" : "新增活動組合"} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 140px" }} className="screen-enter">
        <div className="sec-label">組合名稱</div>
        <input className="input-base" value={name} onChange={e => setName(e.target.value)} placeholder="例：母親節水光美肌組" />
        <div className="sec-label">活動月份</div>
        <input type="month" className="input-base" value={month} onChange={e => setMonth(e.target.value)} />
        <div className="sec-label">客人售價（零售 / 任兩盒 / 混品VIP 統一）</div>
        <input type="number" className="input-base" value={customerPrice} onChange={e => setCustomerPrice(e.target.value)} placeholder="例：2800" />
        <div className="sec-label">各階級進貨成本</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.8, background: "#f2e6e1", borderRadius: 10, padding: "10px 14px" }}>
          💡 填每個階級從上線拿貨的價格<br />賣給客人利潤 = 客人售價 − 自己的成本<br />賣給下家利潤 = 下家的成本 − 自己的成本
        </div>
        {PROMO_COST_LEVELS.map(lv => {
          const mc = costs[lv] || "";
          const profitToCustomer = customerPrice && mc ? Number(customerPrice) - Number(mc) : null;
          return (
            <div key={lv} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>{tIcon[lv] || ""} {lv} 的進貨成本</div>
              <input type="number" value={mc} onChange={e => setCosts(prev => ({ ...prev, [lv]: e.target.value }))} placeholder="輸入進貨成本"
                style={{ width: "100%", background: "#f2e6e1", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
              {profitToCustomer !== null && <div style={{ marginTop: 8, fontSize: 12, color: profitToCustomer >= 0 ? C.green : C.red, fontWeight: 600 }}>賣客人利潤：{profitToCustomer >= 0 ? "+" : ""}{profitToCustomer} 元</div>}
            </div>
          );
        })}
      </div>
      <div className="sticky-bottom">
        <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? <><span className="spinner" />儲存中...</> : `✦ ${item ? "儲存變更" : "新增組合"}`}</button>
        <button className="btn-secondary" onClick={onBack}>取消</button>
      </div>
    </div>
  );
}

function S2({ myLevel, myIdx, onBack, onAdd, toast }) {
  const [curTarget, setCurTarget] = useState("");
  const [curSeries, setCurSeries] = useState("beauty");
  const [qty, setQty] = useState({});
  const [promos, setPromos] = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const avail = targetsMap[myLevel] || [];

  useEffect(() => { setLoadingPromos(true); loadPromosCloud().then(data => { setPromos(data); setLoadingPromos(false); }); }, []);

  const availPromos = promos.filter(p => p.costs?.[myLevel]);
  function setQ(id, v) { setQty(q => ({ ...q, [id]: v })); }

  function handleAdd() {
    if (!curTarget) { toast("請先選擇賣給誰"); return; }
    const ti = lvIdx[curTarget], added = [];
    if (curSeries === "beauty" || curSeries === "fiber") {
      priceTable[curSeries].forEach(p => { const q = qty[p.id] || 0; if (!q) return; const sp = p.prices[ti], mc = p.prices[myIdx]; if (sp == null || mc == null) return; added.push({ product: p.name, series: curSeries, target: curTarget, qty: q, sellPrice: sp, myCost: mc, profit: (sp - mc) * q, revenue: sp * q }); });
    }
    if (curSeries === "promo") {
      promos.forEach(p => { const q = qty[p.id] || 0; if (!q) return; const info = getPromoProfit(p, myLevel, curTarget); if (!info) return; added.push({ product: "🎁 " + p.name, series: "promo", target: curTarget, qty: q, sellPrice: info.sellPrice, myCost: info.myCost, profit: info.profit * q, revenue: info.sellPrice * q }); });
    }
    if (!added.length) { toast("請填入至少一個商品數量"); return; }
    onAdd(added); toast(`已新增 ${added.length} 筆紀錄 ✓`);
  }

  const seriesTabs = [{ key: "beauty", label: "美肌系列" }, { key: "fiber", label: "纖體・保健" }, { key: "promo", label: "🎁 活動組合" }];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <PageHeader onBack={onBack} title={`${myLevel} · 新增銷售`} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 140px" }} className="screen-enter">
        <div className="sec-label">STEP 1 · 賣給誰</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 18 }}>
          {avail.map(t => <button key={t} className={`tag-btn ${curTarget === t ? "active" : ""}`} onClick={() => setCurTarget(t)}>{(tIcon[t] || "") + " " + t}</button>)}
        </div>
        <div className="sec-label">STEP 2 · 選商品系列</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {seriesTabs.map(s => <button key={s.key} className={`series-tab ${curSeries === s.key ? "active" : ""}`} onClick={() => setCurSeries(s.key)}>{s.label}</button>)}
        </div>
        {!curTarget && <div style={{ textAlign: "center", padding: "40px 0", color: C.muted, fontSize: 13, letterSpacing: 2 }}>請先選擇賣給誰 ↑</div>}
        {curTarget && (curSeries === "beauty" || curSeries === "fiber") && priceTable[curSeries].filter(p => { const ti = lvIdx[curTarget]; return p.prices[ti] != null && p.prices[myIdx] != null; }).map(p => {
          const ti = lvIdx[curTarget], sp = p.prices[ti], mc = p.prices[myIdx], mg = sp - mc, q = qty[p.id] || 0;
          return (
            <div key={p.id} className="product-row">
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, color: C.text, lineHeight: 1.4 }}>{p.name}</div><div style={{ fontSize: 11, marginTop: 2, color: mg > 0 ? C.green : mg < 0 ? C.red : C.muted }}>售 {sp} ｜利潤 {mg >= 0 ? "+" : ""}{mg}</div></div>
              <QtyCtrl value={q} onChange={v => setQ(p.id, v)} />
              <div style={{ fontSize: 12, color: C.green, minWidth: 52, textAlign: "right" }}>{q > 0 ? "+" + (mg * q).toLocaleString() : "—"}</div>
            </div>
          );
        })}
        {curTarget && curSeries === "promo" && (loadingPromos ? <div style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: 13 }}><span className="spinner" />載入活動組合...</div> : availPromos.length === 0 ? <div style={{ textAlign: "center", padding: "40px 0", color: C.muted, fontSize: 13 }}>{promos.length === 0 ? "後台尚未新增活動組合" : "你的階級尚未設定此活動成本"}</div> : availPromos.map(p => {
          const info = getPromoProfit(p, myLevel, curTarget);
          if (!info) return <div key={p.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: "11px 13px", marginBottom: 7, opacity: 0.5 }}><div style={{ fontSize: 13, color: C.muted }}>🎁 {p.name}</div><div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>此客戶類型無法計算利潤</div></div>;
          const { sellPrice, myCost, profit } = info, q = qty[p.id] || 0;
          return (
            <div key={p.id} className="product-row" style={{ border: `1px solid rgba(201,160,144,.4)` }}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, color: C.text, lineHeight: 1.4 }}>🎁 {p.name}</div>{p.month && <div style={{ fontSize: 10, color: C.accent, marginTop: 2 }}>📅 {p.month}</div>}<div style={{ fontSize: 11, marginTop: 2, color: profit > 0 ? C.green : C.red }}>{isCustomer(curTarget) ? `售 ${sellPrice}` : `下家成本 ${sellPrice}`} ｜利潤 {profit >= 0 ? "+" : ""}{profit}</div></div>
              <QtyCtrl value={q} onChange={v => setQ(p.id, v)} />
              <div style={{ fontSize: 12, color: C.green, minWidth: 52, textAlign: "right" }}>{q > 0 ? "+" + (profit * q).toLocaleString() : "—"}</div>
            </div>
          );
        }))}
      </div>
      <div className="sticky-bottom">
        <button className="btn-primary" onClick={handleAdd}>✦ 加入銷售清單</button>
        <button className="btn-secondary" onClick={onBack}>← 返回清單</button>
      </div>
    </div>
  );
}
function S3({ myLevel, entries, curMonth, onMonthChange, onBack, onOpenAdd, onDelete, onResult, onStats, onClear }) {
  const months = getSavedMonths(myLevel); if (!months.includes(curMonth)) months.unshift(curMonth);
  const tabs = [...new Set(months)].sort().reverse();
  const total = entries.reduce((s, e) => s + e.profit, 0);
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <PageHeader onBack={onBack} title={`${myLevel} · 銷售清單`} />
      <div style={{ margin: "10px 18px 0", display: "flex", alignItems: "center", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
        <label style={{ fontSize: 12, color: C.muted, padding: "10px 14px", borderRight: `1px solid ${C.border}`, whiteSpace: "nowrap", letterSpacing: 1 }}>計算月份</label>
        <input type="month" value={curMonth} onChange={e => onMonthChange(e.target.value)} style={{ flex: 1, background: "none", border: "none", color: C.text, fontSize: 14, padding: "10px 14px", outline: "none" }} />
      </div>
      <div style={{ padding: "7px 18px 0", fontSize: 12, color: C.muted, flexShrink: 0, marginBottom: 8 }}>本月 <span style={{ color: C.accent, fontWeight: 700 }}>{getDays(curMonth)}</span> 天</div>
      <div style={{ padding: "0 18px", flexShrink: 0, marginBottom: 2 }}>
        <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 10 }}>
          {tabs.map(m => { const s = loadEntries(myLevel, m), has = s.entries.length > 0, [ty, tm] = m.split("-"); return <button key={m} className={`month-tab ${m === curMonth ? "active" : ""}`} onClick={() => onMonthChange(m)}>{ty}/{parseInt(tm)}月{has && <span style={{ display: "inline-block", width: 5, height: 5, background: C.green, borderRadius: "50%", marginLeft: 4, verticalAlign: "middle" }} />}</button>; })}
        </div>
      </div>
      <div className="summary-card">
        <div><div style={{ fontSize: 11, color: C.muted, letterSpacing: 2, marginBottom: 4 }}>本月淨利預估</div><div style={{ fontFamily: "'Noto Serif TC',serif", fontSize: 24, color: C.accentLight, fontWeight: 600 }}>+ {total.toLocaleString()} 元</div></div>
        <div style={{ fontSize: 12, color: C.muted }}>已記錄 <span style={{ color: C.text, fontWeight: 700 }}>{entries.length}</span> 筆</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 18px 10px" }}>
        {!entries.length ? <div style={{ textAlign: "center", padding: "56px 0", color: C.muted, fontSize: 13, letterSpacing: 2 }}><div style={{ fontSize: 36, marginBottom: 14 }}>📋</div>尚無銷售紀錄<br />點下方按鈕新增</div> : entries.map(e => (
          <div key={e.id} className="entry-row">
            <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{tIcon[e.target] || "📋"}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{e.product}</div><div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>賣給 {e.target} ／{e.qty} 件 ／單利 {e.sellPrice - e.myCost >= 0 ? "+" : ""}{e.sellPrice - e.myCost}</div></div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.green, flexShrink: 0 }}>+{e.profit.toLocaleString()}</div>
            <button onClick={() => onDelete(e.id)} style={{ background: "none", border: "none", color: C.muted, fontSize: 18, cursor: "pointer", padding: "0 0 0 8px", flexShrink: 0 }}>✕</button>
          </div>
        ))}
      </div>
      <div className="sticky-bottom">
        <button className="btn-primary" onClick={onOpenAdd}>＋ 新增銷售紀錄</button>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn-secondary" style={{ flex: 1, marginTop: 0 }} onClick={onResult}>✦ 淨利報表</button>
          <button className="btn-secondary" style={{ flex: 1, marginTop: 0 }} onClick={onStats}>📊 產品統計</button>
        </div>
        <button className="btn-danger" onClick={onClear}>✕ 清空本月紀錄</button>
      </div>
    </div>
  );
}

function S4({ entries, curMonth, onBack, onGoS1 }) {
  const days = getDays(curMonth), [y, mo] = curMonth.split("-");
  let tp = 0, tr = 0, tu = 0; entries.forEach(e => { tp += e.profit; tr += e.revenue; tu += e.qty; });
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <PageHeader onBack={onBack} title="月淨利報表" />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 40px" }} className="screen-enter">
        <div style={{ background: "linear-gradient(135deg,#ffffff,#f7ece8)", border: `1px solid rgba(201,160,144,.45)`, borderRadius: 18, padding: "32px 22px", textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: 3, marginBottom: 6 }}>本月總淨利</div>
          <div style={{ fontSize: 13, color: C.accent, letterSpacing: 2, marginBottom: 16 }}>{y}年 {parseInt(mo)}月</div>
          <div><span style={{ fontFamily: "'Noto Serif TC',serif", fontSize: 56, fontWeight: 600, color: C.accentLight, lineHeight: 1 }}>{tp.toLocaleString()}</span><span style={{ fontSize: 20, color: C.accent }}> 元</span></div>
          <div style={{ marginTop: 14, fontSize: 13, color: C.muted }}>日均淨利  <span style={{ color: C.green, fontWeight: 600 }}>{days > 0 ? Math.round(tp / days).toLocaleString() : 0}</span> 元／天</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 20 }}>
          {[["銷售筆數", entries.length, C.accent], ["本月天數", days, C.text], ["總銷售件數", tu.toLocaleString(), C.text], ["估算總收入", tr.toLocaleString(), C.green]].map(([l, v, c]) => <div key={l} className="stat-card"><div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 5 }}>{l}</div><div style={{ fontSize: 22, fontWeight: 700, color: c }}>{v}</div></div>)}
        </div>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: 3, marginBottom: 12, paddingTop: 16, borderTop: `1px solid rgba(201,160,144,.2)` }}>銷售明細</div>
        {entries.map(e => <div key={e.id} style={{ display: "flex", alignItems: "center", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 13px", marginBottom: 7 }}><div style={{ flex: 1, fontSize: 13, color: C.text, lineHeight: 1.5 }}>{e.product}<br /><span style={{ fontSize: 11, color: C.muted }}>賣給 {e.target}</span></div><div style={{ fontSize: 12, color: C.muted, minWidth: 48, textAlign: "center" }}>{e.qty} 件</div><div style={{ fontSize: 13, color: C.green, fontWeight: 500, minWidth: 68, textAlign: "right" }}>+{e.profit.toLocaleString()}</div></div>)}
        <button className="btn-ghost" onClick={onBack}>← 修改銷售記錄</button>
        <button className="btn-ghost" onClick={onGoS1}>重新選擇階級</button>
      </div>
    </div>
  );
}

function S5({ entries, curMonth, onBack }) {
  const [y, mo] = curMonth.split("-");
  const map = {}; entries.forEach(e => { if (!map[e.product]) map[e.product] = { name: e.product, qty: 0, profit: 0, revenue: 0 }; map[e.product].qty += e.qty; map[e.product].profit += e.profit; map[e.product].revenue += e.revenue; });
  const arr = Object.values(map).sort((a, b) => b.profit - a.profit);
  const total = arr.reduce((s, x) => s + x.qty, 0), maxP = arr.length ? arr[0].profit : 1;
  const podiumOrder = arr.length >= 3 ? [arr[1], arr[0], arr[2]] : arr.length === 2 ? [arr[1], arr[0]] : arr.slice(0, 1);
  const podiumMedals = arr.length >= 3 ? ["🥈", "🥇", "🥉"] : arr.length === 2 ? ["🥈", "🥇"] : ["🥇"];
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <PageHeader onBack={onBack} title={`${y}年${parseInt(mo)}月 · 產品統計`} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 40px" }} className="screen-enter">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}><div style={{ fontSize: 13, color: C.accent, letterSpacing: 2 }}>{y}年 {parseInt(mo)}月</div><div style={{ fontSize: 12, color: C.muted }}>共 <span style={{ color: C.text, fontWeight: 700 }}>{total}</span> 件</div></div>
        {!arr.length ? <div style={{ textAlign: "center", padding: 24, color: C.muted, fontSize: 13 }}>尚無資料</div> : (
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 10, marginBottom: 20 }}>
            {podiumOrder.map((item, i) => { const isFirst = podiumMedals[i] === "🥇", sn = item.name.replace(/\(.*?\)/g, "").trim(); return <div key={item.name} style={{ flex: 1, maxWidth: 110, background: isFirst ? "linear-gradient(180deg,rgba(201,160,144,.18),#fff)" : C.card, border: isFirst ? `1px solid ${C.accent}` : `1px solid rgba(180,180,180,.28)`, borderRadius: "12px 12px 8px 8px", padding: "12px 10px 10px", textAlign: "center" }}><div style={{ fontSize: 22, marginBottom: 4 }}>{podiumMedals[i]}</div><div style={{ fontSize: 11, color: C.text, lineHeight: 1.3, marginBottom: 6 }}>{sn}</div><div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>+{item.profit.toLocaleString()}</div><div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{item.qty} 件</div></div>; })}
          </div>
        )}
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: 3, marginBottom: 12, paddingTop: 16, borderTop: `1px solid rgba(201,160,144,.2)` }}>全部產品明細</div>
        {arr.map((item, i) => { const pct = maxP > 0 ? Math.round(item.profit / maxP * 100) : 0; return <div key={item.name} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 14px", marginBottom: 8 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><div style={{ fontSize: 13, fontWeight: 500, color: C.text, flex: 1, lineHeight: 1.4 }}>{item.name}</div><div style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>#{i + 1}</div></div><div className="progress-bar"><div className="progress-fill" style={{ width: pct + "%" }} /></div><div style={{ display: "flex" }}>{[["件數", item.qty, C.accent], ["淨利", "+" + item.profit.toLocaleString(), C.green], ["收入", item.revenue.toLocaleString(), C.text]].map(([l, v, c], idx) => <div key={l} style={{ flex: 1, textAlign: "center", borderLeft: idx > 0 ? `1px solid ${C.border}` : "none" }}><div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 2 }}>{l}</div><div style={{ fontSize: 14, fontWeight: 700, color: c }}>{v}</div></div>)}</div></div>; })}
        <button className="btn-ghost" onClick={onBack}>← 返回清單</button>
      </div>
    </div>
  );
}
function PwModal({ title, hint, correctPw, onClose, onSuccess }) {
  const [val, setVal] = useState(""), [err, setErr] = useState(""), [shake, setShake] = useState(false);
  const inp = useRef(); useEffect(() => { setTimeout(() => inp.current?.focus(), 120); }, []);
  function submit() { if (val === correctPw) { onSuccess(); } else { setErr("密碼錯誤，請再試一次"); setShake(true); setVal(""); setTimeout(() => setShake(false), 600); } }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ fontFamily: "'Noto Serif TC',serif", fontSize: 18, color: C.accent, letterSpacing: 2, marginBottom: 6 }}>{title}</div>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 22 }}>{hint}</p>
        <input ref={inp} type="password" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="· · · · · ·" maxLength={20}
          style={{ width: "100%", background: "#f2e6e1", border: shake ? `1px solid ${C.red}` : `1px solid ${C.border}`, borderRadius: 8, padding: "12px 16px", color: C.text, fontSize: 18, textAlign: "center", letterSpacing: 6, outline: "none", animation: shake ? "shake .3s" : "none" }} />
        {err && <div style={{ fontSize: 12, color: C.red, marginTop: 7 }}>{err}</div>}
        <div style={{ display: "flex", gap: 9, marginTop: 18 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 14, cursor: "pointer" }}>取消</button>
          <button onClick={submit} style={{ flex: 1, padding: 12, background: C.accent, border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>確認</button>
        </div>
      </div>
    </div>
  );
}

function ClearModal({ curMonth, onClose, onConfirm }) {
  const [y, m] = curMonth.split("-");
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ fontFamily: "'Noto Serif TC',serif", fontSize: 18, color: C.accent, letterSpacing: 2, marginBottom: 6 }}>清空本月紀錄</div>
        <p style={{ fontSize: 13, color: C.red, marginBottom: 22 }}>確定要刪除 {y}年{parseInt(m)}月 的所有紀錄？<br />此操作無法復原。</p>
        <div style={{ display: "flex", gap: 9, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 14, cursor: "pointer" }}>取消</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: 12, background: C.red, border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>確定清空</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("s1");
  const [myLevel, setMyLevel] = useState(""); const [myIdx, setMyIdx] = useState(0);
  const [curMonth, setCurMonth] = useState(nowMonth());
  const [entries, setEntries] = useState([]); const [seq, setSeq] = useState(0);
  const [pwModal, setPwModal] = useState(null); const [adminPw, setAdminPw] = useState(false);
  const [clearModal, setClearModal] = useState(false); const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef();

  function showToast(msg) { setToastMsg(msg); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToastMsg(""), 2200); }
  function selectLevel(lv) { setMyLevel(lv); setMyIdx(lvIdx[lv]); const m = nowMonth(); setCurMonth(m); const s = loadEntries(lv, m); setEntries(s.entries); setSeq(s.seq); setScreen("s3"); }
  function onMonthChange(m) { setCurMonth(m); const s = loadEntries(myLevel, m); setEntries(s.entries); setSeq(s.seq); }
  function handleAdd(newEntries) { const withIds = newEntries.map((e, i) => ({ ...e, id: seq + i + 1 })); const updated = [...entries, ...withIds]; const nextSeq = seq + newEntries.length; setEntries(updated); setSeq(nextSeq); saveEntries(myLevel, curMonth, updated, nextSeq); setScreen("s3"); }
  function handleDelete(id) { const updated = entries.filter(e => e.id !== id); setEntries(updated); saveEntries(myLevel, curMonth, updated, seq); }
  function handleClear() { if (!entries.length) { showToast("本月沒有紀錄可清空"); return; } setClearModal(true); }
  function doClear() { setClearModal(false); storageRemove(sk(myLevel, curMonth)); setEntries([]); setSeq(0); showToast("已清空本月紀錄"); }

  return (
    <div style={{ fontFamily: "'Noto Sans TC',sans-serif", WebkitTapHighlightColor: "transparent", maxWidth: 480, margin: "0 auto", minHeight: "100vh" }}>
      <style>{css}</style>
      {screen === "s1" && <S1 onSelect={(name, locked) => locked ? setPwModal(name) : selectLevel(name)} onAdmin={() => setAdminPw(true)} />}
      {screen === "s2" && <S2 myLevel={myLevel} myIdx={myIdx} onBack={() => setScreen("s3")} onAdd={handleAdd} toast={showToast} />}
      {screen === "s3" && <S3 myLevel={myLevel} entries={entries} curMonth={curMonth} onMonthChange={onMonthChange} onBack={() => setScreen("s1")} onOpenAdd={() => setScreen("s2")} onDelete={handleDelete} onResult={() => setScreen("s4")} onStats={() => setScreen("s5")} onClear={handleClear} />}
      {screen === "s4" && <S4 entries={entries} curMonth={curMonth} onBack={() => setScreen("s3")} onGoS1={() => setScreen("s1")} />}
      {screen === "s5" && <S5 entries={entries} curMonth={curMonth} onBack={() => setScreen("s3")} />}
      {screen === "admin" && <AdminScreen onBack={() => setScreen("s1")} toast={showToast} />}
      {pwModal && <PwModal title={pwModal} hint="此階級需要授權密碼" correctPw={PW[pwModal]} onClose={() => setPwModal(null)} onSuccess={() => { setPwModal(null); selectLevel(pwModal); }} />}
      {adminPw && <PwModal title="後台管理" hint="請輸入管理員密碼" correctPw={ADMIN_PW} onClose={() => setAdminPw(false)} onSuccess={() => { setAdminPw(false); setScreen("admin"); }} />}
      {clearModal && <ClearModal curMonth={curMonth} onClose={() => setClearModal(false)} onConfirm={doClear} />}
      <Toast msg={toastMsg} />
    </div>
  );
}

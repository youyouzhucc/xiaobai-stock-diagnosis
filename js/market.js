/* 全市场 A 股：一次性载入整张表（分 56 页请求），之后筛选 / 排序 / 翻页全在本地算 */
const PAGE_SIZE = 50;       // 每屏显示多少只
const FETCH_SIZE = 100;     // 接口单次最多给 100 条
const CLIST = 'https://push2.eastmoney.com/api/qt/clist/get';
const FS = 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23';
/* f24 = 近 60 个交易日涨跌幅，f25 = 年初至今涨跌幅，都是接口自带的真实统计，不用额外拉 K 线 */
const FIELDS = 'f2,f3,f8,f9,f10,f12,f13,f14,f20,f23,f24,f25,f100';

const $ = id => document.getElementById(id);
const num = v => (typeof v === 'number' && !Number.isNaN(v)) ? v : null;
const f2 = v => num(v) === null ? '—' : Number(v).toFixed(2);
const f1 = v => num(v) === null ? '—' : Number(v).toFixed(1);
const fpct = v => num(v) === null ? '—' : (Number(v) > 0 ? '+' : '') + Number(v).toFixed(2) + '%';
const fcap = v => {
  const n = num(v);
  if (n === null) return '—';
  return n >= 1e12 ? (n / 1e12).toFixed(2) + '万亿' : (n / 1e8).toFixed(0) + '亿';
};
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cls = v => { const n = num(v); return n === null ? 'flat' : (n > 0 ? 'up' : n < 0 ? 'down' : 'flat'); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* 页脚版本号自动跟随资源 URL 上的 ?v= */
const VERSION = (() => {
  try {
    const s = document.querySelector('script[src*="market.js"]');
    return 'v' + (new URL(s.src).searchParams.get('v') || '?');
  } catch (e) { return 'v?'; }
})();
document.querySelectorAll('.ver').forEach(el => { el.textContent = VERSION; });

/* ---------- 行业 -> 类型（和精选池同一套规则） ---------- */
const TYPE_GROUPS = [
  ['finance', ['银行', '保险', '证券', '多元金融', '信托', '期货']],
  ['tech', ['半导体', '消费电子', '光学光电子', '元件', '软件', '计算机', 'IT服务', '通信', '互联网', '人工智能']],
  ['media', ['广告', '传媒', '游戏', '影视', '出版', '教育']],
  ['medical', ['医疗', '医药', '生物制品', '化学制药', '中药', '疫苗']],
  ['newenergy', ['光伏', '风电', '电池', '能源金属', '电源设备']],
  ['consumer', ['白酒', '食品', '饮料', '乳品', '啤酒', '零售', '家电', '纺织', '服装', '旅游', '酒店', '餐饮', '农牧', '养殖', '农产品', '珠宝', '家居']],
  ['realestate', ['房地产', '建筑', '装修', '工程建设', '园林']],
  ['utility', ['电力', '水务', '燃气', '环保', '交通运输', '港口', '铁路', '航空', '机场', '物流']],
  ['cycle', ['煤炭', '钢铁', '有色', '小金属', '贵金属', '稀有金属', '化工', '化学', '建材', '水泥', '石油', '化纤', '玻璃']],
  ['industrial', ['汽车', '机械', '设备', '工程机械', '电气', '军工', '航天', '船舶', '仪器', '轨交']]
];

function typeOf(industry) {
  const s = String(industry || '').replace(/[ⅠⅡⅢ]+$/g, '');
  if (s.includes('电力设备') || s.includes('电网')) return 'industrial';
  for (let i = 0; i < TYPE_GROUPS.length; i++) {
    const words = TYPE_GROUPS[i][1];
    for (let j = 0; j < words.length; j++) if (s.includes(words[j])) return TYPE_GROUPS[i][0];
  }
  return 'other';
}

/* ---------- 筛选条件定义 ---------- */
const FILTERS = [
  {
    key: 'type', all: '全部类型', opts: [
      { v: 'consumer', t: '消费 · 吃喝穿用' },
      { v: 'finance', t: '金融 · 银行保险券商' },
      { v: 'tech', t: '科技 · 芯片软件通信' },
      { v: 'medical', t: '医药 · 药和器械' },
      { v: 'newenergy', t: '新能源 · 光伏电池风电' },
      { v: 'cycle', t: '周期 · 煤钢化工有色' },
      { v: 'industrial', t: '制造 · 汽车机械军工' },
      { v: 'realestate', t: '地产建筑 · 房子和工程' },
      { v: 'utility', t: '公用事业 · 电力燃气交通' },
      { v: 'media', t: '传媒 · 广告游戏影视' }
    ]
  },
  {
    key: 'cap', all: '全部市值', opts: [
      { v: 'big', t: '1000 亿以上（大盘）' },
      { v: 'mid', t: '200-1000 亿（中盘）' },
      { v: 'small', t: '200 亿以内（小盘）' }
    ]
  },
  {
    key: 'pe', all: '全部市盈率', opts: [
      { v: 'low', t: '10 倍以内（便宜）' },
      { v: 'mid', t: '10-20 倍之间' },
      { v: 'high', t: '20 倍以上（偏贵）' },
      { v: 'loss', t: '亏损中' }
    ]
  },
  {
    key: 'heat', all: '全部活跃度', opts: [
      { v: 'quiet', t: '冷清 · 换手不到 1%' },
      { v: 'normal', t: '正常 · 换手 1-3%' },
      { v: 'active', t: '活跃 · 换手 3-10%' },
      { v: 'hot', t: '过热 · 换手 10% 以上' }
    ]
  },
  {
    /* 涨跌幅、换手率都是「最近一个交易日」的值，休市日显示的仍是上一个交易日，
       所以不能叫「今日」，否则节假日打开会被误读 */
    key: 'chg', all: '最近交易日涨跌', opts: [
      { v: 'up', t: '上涨' },
      { v: 'down', t: '下跌' }
    ]
  }
];

/* ---------- 主题（给小白用的入口，一次点一下就是一组条件 + 排序） ----------
 * 每个主题：一句话说明「看的是什么」，外加一句「别误读成什么」。
 * 数字全部来自接口真实字段，没有估算。
 */
/* 榜单里不放退市整理、ST（风险警示）和停牌股：
 * 这些票的极端涨跌是制度性原因造成的，放在「跌最狠」里对新手是误导 */
const tradable = d => {
  const name = String(d.f14 || '');
  if (/退|ST/i.test(name)) return false;
  if (num(d.f2) === null || num(d.f2) <= 0) return false;
  if (num(d.f8) !== null && num(d.f8) === 0 && num(d.f3) !== null && num(d.f3) === 0) return false; // 停牌
  return true;
};

const THEMES = [
  {
    id: 'cheap',
    label: '估值最便宜',
    sort: 'pe_asc',
    hint: '按市盈率从低到高排，只列真正赚钱的（PE 为正）。便宜不等于好，也可能是行业走下坡。',
    test: d => tradable(d) && num(d.f9) >= 1
  },
  {
    id: 'bluechip',
    label: '便宜的大块头',
    sort: 'pe_asc',
    hint: '市值 1000 亿以上、市盈率 20 倍以内。大盘股波动小，适合当底仓看，但涨得也慢。',
    test: d => tradable(d) && num(d.f20) >= 1e11 && num(d.f9) >= 1 && num(d.f9) <= 20
  },
  {
    id: 'drop60',
    label: '近两月跌最狠',
    sort: 'd60_asc',
    hint: '近 60 个交易日跌得最多的。跌得多不代表会反弹，先看是行业整体下滑还是自己出问题。',
    test: d => tradable(d) && num(d.f24) !== null && num(d.f24) <= -20
  },
  {
    id: 'rise60',
    label: '近两月涨最猛',
    sort: 'd60_desc',
    hint: '近 60 个交易日涨得最多的。涨得猛也可能是情绪推的，追高前先看估值贵不贵。',
    test: d => tradable(d) && num(d.f24) !== null && num(d.f24) >= 20
  },
  {
    id: 'volume',
    label: '突然放量',
    sort: 'vr_desc',
    hint: '量比 2 以上，最近一个交易日每分钟成交是过去 5 天均量的两倍以上。放量常见于消息或资金异动，方向可能是涨也可能是跌。',
    test: d => tradable(d) && num(d.f10) >= 2
  },
  {
    id: 'cold',
    label: '没人搭理',
    sort: 'turn_asc',
    hint: '换手率不到 1%，买卖都清淡。想买容易、想卖可能卖不掉，适合能长期拿着的人。',
    test: d => tradable(d) && num(d.f8) !== null && num(d.f8) < 1 && num(d.f9) >= 1
  }
];

const state = {
  rows: [],
  total: 0,
  pages: 0,
  loaded: 0,
  failed: [],
  firstPaint: false,
  page: 1,
  f: { type: '', cap: '', pe: '', heat: '', chg: '', theme: '', ind: '' },
  sort: 'code',
  scores: new Map(),
  loading: false
};

/* ---------- 已评测过的分数（localStorage，来自精选池/详情页） ---------- */
function loadScores() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || k.indexOf('xs:') !== 0) continue;
      const v = JSON.parse(localStorage.getItem(k) || 'null');
      if (v && typeof v.t === 'number') state.scores.set(k.slice(3), v.t);
    }
  } catch (e) { }
}

/* 把当天 12:05 生成的分数快照并进来，精选池的 30 只在这里也有分 */
async function mergeSnapshot() {
  try {
    /* 一天一版，按日期取，同一天内直接命中浏览器缓存 */
    const d = new Date();
    const tag = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const res = await fetch(`data/scores.json?d=${tag}`);
    if (!res.ok) return;
    const j = await res.json();
    Object.keys(j.items || {}).forEach(code => {
      const s = j.items[code];
      if (s && typeof s.total === 'number') state.scores.set(code, s.total);
    });
    if (j.date) state.snapshotDate = j.date;
  } catch (e) { }
}
const scoreOf = code => state.scores.has(code) ? state.scores.get(code) : null;

/* ---------- 拉数据 ---------- */
async function fetchPage(pn) {
  const url = `${CLIST}?pn=${pn}&pz=${FETCH_SIZE}&po=0&np=1&ut=bd1d9ddb040897cfd9463debb285354` +
    `&fltt=2&invt=2&fid=f12&fs=${encodeURIComponent(FS)}&fields=${FIELDS}&_=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const json = await res.json();
  const data = json && json.data;
  if (!data || !data.diff) throw new Error('接口没有返回数据');
  const rows = Array.isArray(data.diff) ? data.diff : Object.values(data.diff);
  return { rows, total: data.total || rows.length };
}

function updateProgress() {
  const box = $('mk-count');
  if (state.loading) {
    const pct = state.pages ? Math.round(state.loaded / state.pages * 100) : 0;
    box.innerHTML = `正在载入全市场 <b>${state.loaded}/${state.pages}</b> 页` +
      `<span class="bar"><i style="width:${pct}%"></i></span> ${state.rows.length} 只`;
    return;
  }
  const hit = currentList().length;
  box.innerHTML = `全市场 <b>${state.total || state.rows.length}</b> 只 · 当前筛出 <b>${hit}</b> 只` +
    (state.loaded < state.pages ? ` · 已载入 ${state.loaded}/${state.pages} 页` : '') +
    (state.failed.length ? ` · ${state.failed.length} 页失败` : '');
}

async function loadAll() {
  state.loading = true;
  updateProgress();

  let first;
  try {
    first = await fetchPage(1);
  } catch (e) {
    $('list').innerHTML = `<div class="empty">加载失败：${esc(e.message)}<br><button class="retry" onclick="loadAll()">重试</button></div>`;
    $('mk-count').textContent = '加载失败';
    state.loading = false;
    return;
  }

  state.total = first.total;
  state.pages = Math.max(1, Math.ceil(state.total / FETCH_SIZE));
  state.rows = first.rows;
  state.loaded = 1;
  state.firstPaint = true;
  render();

  const queue = [];
  for (let p = 2; p <= state.pages; p++) queue.push(p);

  const worker = async () => {
    while (queue.length) {
      const pn = queue.shift();
      try {
        const r = await fetchPage(pn);
        state.rows = state.rows.concat(r.rows);
        state.loaded++;
      } catch (e) {
        state.failed.push(pn);
      }
      // 载入过程中每 8 页刷新一次，让用户看到数字在涨
      if (state.loaded % 8 === 0) { updateProgress(); render(); }
      await sleep(120);
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);

  state.loading = false;
  if (state.failed.length) {
    // 失败的页重试一次
    const retry = state.failed.slice();
    state.failed = [];
    for (let i = 0; i < retry.length; i++) {
      try {
        const r = await fetchPage(retry[i]);
        state.rows = state.rows.concat(r.rows);
        state.loaded++;
      } catch (e) { state.failed.push(retry[i]); }
      await sleep(120);
    }
  }
  render();
}

/* ---------- 筛选 ---------- */
function match(d) {
  const f = state.f;
  if (f.type && typeOf(d.f100) !== f.type) return false;

  if (f.ind && String(d.f100 || '').replace(/[ⅠⅡⅢ]+$/g, '') !== f.ind) return false;

  if (f.theme) {
    const th = THEMES.find(t => t.id === f.theme);
    if (!th || !th.test(d)) return false;
  }

  if (f.cap) {
    const c = num(d.f20);
    if (c === null) return false;
    if (f.cap === 'big' && c < 1e11) return false;
    if (f.cap === 'mid' && (c < 2e10 || c >= 1e11)) return false;
    if (f.cap === 'small' && c >= 2e10) return false;
  }

  if (f.pe) {
    const pe = num(d.f9);
    if (pe === null) return false;
    if (f.pe === 'loss' && pe > 0) return false;
    if (f.pe === 'low' && !(pe > 0 && pe <= 10)) return false;
    if (f.pe === 'mid' && !(pe > 10 && pe <= 20)) return false;
    if (f.pe === 'high' && !(pe > 20)) return false;
  }

  if (f.heat) {
    const t = num(d.f8);
    if (t === null) return false;
    if (f.heat === 'quiet' && t >= 1) return false;
    if (f.heat === 'normal' && (t < 1 || t >= 3)) return false;
    if (f.heat === 'active' && (t < 3 || t >= 10)) return false;
    if (f.heat === 'hot' && t < 10) return false;
  }

  if (f.chg) {
    const p = num(d.f3);
    if (p === null) return false;
    if (f.chg === 'up' && p <= 0) return false;
    if (f.chg === 'down' && p >= 0) return false;
  }
  return true;
}

/* 排序：空值 / 无分数统一排最后 */
function sortList(list) {
  const mode = state.sort;
  const by = {
    code: (a, b) => String(a.f12).localeCompare(String(b.f12)),
    pct_desc: (a, b) => (num(b.f3) || -999) - (num(a.f3) || -999),
    pct_asc: (a, b) => (num(a.f3) || 999) - (num(b.f3) || 999),
    cap_desc: (a, b) => (num(b.f20) || -1) - (num(a.f20) || -1),
    turn_desc: (a, b) => (num(b.f8) || -1) - (num(a.f8) || -1),
    turn_asc: (a, b) => {
      const ta = num(a.f8), tb = num(b.f8);
      const ka = ta === null ? Infinity : ta;
      const kb = tb === null ? Infinity : tb;
      return ka - kb;
    },
    vr_desc: (a, b) => (num(b.f10) || -1) - (num(a.f10) || -1),
    d60_desc: (a, b) => {
      const pa = num(a.f24), pb = num(b.f24);
      const ka = pa === null ? -Infinity : pa;
      const kb = pb === null ? -Infinity : pb;
      return kb - ka;
    },
    d60_asc: (a, b) => {
      const pa = num(a.f24), pb = num(b.f24);
      const ka = pa === null ? Infinity : pa;
      const kb = pb === null ? Infinity : pb;
      return ka - kb;
    },
    pe_asc: (a, b) => {
      const pa = num(a.f9), pb = num(b.f9);
      const ka = (pa === null || pa <= 0) ? Infinity : pa;
      const kb = (pb === null || pb <= 0) ? Infinity : pb;
      return ka - kb;
    },
    pb_asc: (a, b) => {
      const pa = num(a.f23), pb = num(b.f23);
      const ka = (pa === null || pa <= 0) ? Infinity : pa;
      const kb = (pb === null || pb <= 0) ? Infinity : pb;
      return ka - kb;
    },
    score: (a, b) => {
      const sa = scoreOf(a.f12), sb = scoreOf(b.f12);
      const ka = sa === null ? -1 : sa;
      const kb = sb === null ? -1 : sb;
      if (kb !== ka) return kb - ka;
      return String(a.f12).localeCompare(String(b.f12));
    }
  }[mode];
  return by ? list.slice().sort(by) : list;
}

function currentList() {
  return sortList(state.rows.filter(match));
}

/* ---------- 渲染 ---------- */
function rowHTML(d) {
  const code = d.f12;
  const hasPrice = num(d.f2) > 0;
  const sc = scoreOf(code);
  const pe = num(d.f9);

  const top = `<div class="r-top">
      <div style="min-width:0">
        <span class="r-name">${esc(d.f14)}</span><span class="r-code">${code}</span><span class="r-ind">${esc((d.f100 || '未分类').replace(/[ⅠⅡⅢ]+$/, ''))}</span>
      </div>
      <div class="r-right">`;

  if (!hasPrice) {
    return `<div class="row dead">
      <div class="r-top">
        <div style="min-width:0"><span class="r-name">${esc(d.f14)}</span><span class="r-code">${code}</span></div>
        <div class="r-right"><span class="r-price" style="font-size:13px;color:var(--text-weak)">停牌 / 退市</span></div>
      </div>
      <div class="r-meta">没有行情，点不进去</div>
    </div>`;
  }

  return `<div class="row" onclick="location.href='./index.html?code=${code}'">
    <div class="r-top">
      <div style="min-width:0">
        <span class="r-name">${esc(d.f14)}</span><span class="r-code">${code}</span><span class="r-ind">${esc((d.f100 || '未分类').replace(/[ⅠⅡⅢ]+$/, ''))}</span>
      </div>
      <div class="r-right">
        <div class="r-price">${f2(d.f2)}</div>
        <div class="r-pct ${cls(d.f3)}">${fpct(d.f3)}</div>
      </div>
    </div>
    <div class="r-meta">
      <span>综合 <b class="sc">${sc === null ? '未评测' : sc + ' 分'}</b></span>
      <span>PE <b>${pe === null ? '—' : pe <= 0 ? '亏损' : f1(pe)}</b></span>
      <span>PB <b>${f1(d.f23)}</b></span>
      <span>市值 <b>${fcap(d.f20)}</b></span>
      <span>换手 <b>${f2(d.f8)}%</b></span>
      <span>近两月 <b class="${cls(d.f24)}">${fpct(d.f24)}</b></span>
    </div>
  </div>`;
}

function render() {
  if (!state.firstPaint) return;
  const all = currentList();
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  if (state.page > pages) state.page = pages;

  const slice = all.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);
  $('total').textContent = state.total || state.rows.length;
  $('list').innerHTML = slice.length
    ? slice.map(rowHTML).join('')
    : `<div class="empty">这个筛选条件下没有股票，换一组试试</div>`;

  $('pager-info').innerHTML = `第 <b>${state.page}</b> / ${pages} 页`;
  $('btn-prev').disabled = state.page <= 1;
  $('btn-next').disabled = state.page >= pages;
  $('btn-jump').value = state.page;
  $('jump-wrap').style.display = pages > 1 ? 'flex' : 'none';
  updateProgress();
  renderThemes();
  renderIndustry();
}

function goto(pn) {
  const all = currentList();
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const p = Math.min(Math.max(1, pn), pages);
  if (p === state.page) return;
  state.page = p;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- 主题入口 ----------
 * 点一下 = 清空其它下拉 + 套一组真实条件 + 换好排序。
 * 用 state.batch 抑制下拉联动时的多次重渲染。
 */
function syncAllSelects() {
  state.batch = true;
  document.querySelectorAll('#mk-filters select').forEach(s => {
    s.value = state.f[s.dataset.key] || '';
    s.classList.toggle('on', !!s.value);
    s.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const sortSel = $('mk-sort');
  if (sortSel) {
    sortSel.value = state.sort;
    sortSel.classList.toggle('on', state.sort !== 'code');
    sortSel.dispatchEvent(new Event('change', { bubbles: true }));
  }
  state.batch = false;
}

function applyTheme(id) {
  const th = THEMES.find(t => t.id === id);
  if (!th) return;
  const same = state.f.theme === id;
  state.f = { type: '', cap: '', pe: '', heat: '', chg: '', theme: same ? '' : id, ind: '' };
  state.sort = same ? 'code' : th.sort;
  state.page = 1;
  syncAllSelects();
  syncURL();
  render();
}

/* 主题不再做成 6 个芯片铺在这里 —— 榜单已经搬到首页。
 * 这里只处理「从首页榜单点进来」的情况：显示一行提示，告诉你在看什么、怎么退出。 */
function renderThemes() {
  const box = $('theme-bar');
  if (!box) return;
  const cur = THEMES.find(t => t.id === state.f.theme);
  if (!cur) { box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  box.innerHTML = `<div class="th-line"><b>${cur.label}</b><span>${cur.hint}</span>
    <button type="button" class="th-cancel" id="th-cancel">看全部 ×</button></div>`;
  const btn = $('th-cancel');
  if (btn) btn.addEventListener('click', () => applyTheme(state.f.theme));
}

/* ---------- 行业风向 ----------
 * 把全市场按行业聚合，算平均涨跌幅与上涨占比。样本少于 5 只的行业不参与，
 * 避免某个只有一只票的行业靠单只异动冲到榜首。
 */
function industryRank() {
  const map = new Map();
  state.rows.forEach(d => {
    const p = num(d.f3);
    if (p === null) return;
    const name = String(d.f100 || '').replace(/[ⅠⅡⅢ]+$/g, '') || '未分类';
    let o = map.get(name);
    if (!o) { o = { n: 0, sum: 0, up: 0 }; map.set(name, o); }
    o.n++; o.sum += p;
    if (p > 0) o.up++;
  });
  return Array.from(map.entries())
    .filter(([, o]) => o.n >= 5)
    .map(([name, o]) => ({ name, n: o.n, avg: o.sum / o.n, upRatio: o.up / o.n }))
    .sort((a, b) => b.avg - a.avg);
}

let indCacheKey = '';
/* 行业风向不再做成两组可点芯片（和筛选行叠在一起太复杂），
 * 改成筛选行下方一行灰字摘要：最强 3 个 / 最弱 3 个，扫一眼就知道今天哪个行业在涨。
 */
function renderIndustry() {
  const box = $('ind-line');
  if (!box) return;
  const key = `${state.loaded}/${state.pages}:${state.rows.length}`;
  if (key === indCacheKey) return;
  indCacheKey = key;

  if (state.loaded < state.pages) { box.innerHTML = ''; return; }

  const list = industryRank();
  if (!list.length) { box.innerHTML = ''; return; }

  const fmt = x => `${esc(x.name)} <b class="${cls(x.avg)}">${fpct(x.avg)}</b>`;
  box.innerHTML = `<span class="ind-l">行业风向</span>`
    + `最强 ${list.slice(0, 3).map(fmt).join(' · ')}`
    + `<span class="ind-sep">｜</span>`
    + `最弱 ${list.slice(-3).reverse().map(fmt).join(' · ')}`
    + `<span class="ind-note">最近交易日各行业平均涨跌，样本少于 5 只不算</span>`;
}

/* ---------- 筛选栏 ---------- */
function buildFilters() {  const box = $('mk-filters');
  box.innerHTML = FILTERS.map(def => `
    <select class="mk-sel" data-key="${def.key}">
      <option value="">${def.all}</option>
      ${def.opts.map(o => `<option value="${o.v}">${o.t}</option>`).join('')}
    </select>`).join('');

  box.querySelectorAll('select').forEach(sel => {
    sel.addEventListener('change', () => {
      state.f[sel.dataset.key] = sel.value;
      sel.classList.toggle('on', !!sel.value);
      if (state.batch) return;   // 主题/行业一次改多个条件时，统一渲染一次
      state.page = 1;
      syncURL();
      render();
    });
  });
}

/* ---------- 把原生 select 换成和首页一致的自定义下拉 ----------
 * 原生 select 的收起态、展开菜单由操作系统绘制，跟首页的莫兰迪风格对不上。
 * 这里保留原生 select 作为数据源（值、change 事件照旧），上面盖一层同款 .dw 组件。
 */
function closeAllDwMenus(except) {
  document.querySelectorAll('.dw-menu').forEach(m => {
    if (m !== except) m.classList.remove('show');
  });
}

function skinSelect(sel) {
  if (!sel || sel.dataset.skinned === '1') return;
  sel.dataset.skinned = '1';

  const isSort = sel.id === 'mk-sort';
  const wrap = document.createElement('div');
  wrap.className = 'dw';

  const trig = document.createElement('button');
  trig.type = 'button';
  trig.className = 'dw-trigger';

  const arrow = document.createElement('span');
  arrow.className = 'dw-arrow';

  const menu = document.createElement('div');
  menu.className = 'dw-menu';

  const sync = () => {
    const cur = sel.options[sel.selectedIndex];
    trig.textContent = cur ? cur.textContent.trim() : '全部';
    trig.title = trig.textContent;
    const active = isSort ? sel.value !== 'code' : !!sel.value;
    trig.classList.toggle('on', active);
    menu.innerHTML = Array.from(sel.options).map((op, i) =>
      `<div class="dw-item${i === sel.selectedIndex ? ' on' : ''}" data-i="${i}">${op.textContent.trim()}</div>`
    ).join('');
  };

  trig.addEventListener('click', e => {
    e.stopPropagation();
    const open = menu.classList.contains('show');
    closeAllDwMenus(menu);
    menu.classList.toggle('show', !open);
  });

  menu.addEventListener('click', e => {
    e.stopPropagation();
    const item = e.target.closest('.dw-item');
    if (!item) return;
    const i = +item.dataset.i;
    if (sel.selectedIndex !== i) {
      sel.selectedIndex = i;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    sync();
    menu.classList.remove('show');
  });

  sel.addEventListener('change', sync);

  sel.style.display = 'none';
  wrap.appendChild(trig);
  wrap.appendChild(arrow);
  wrap.appendChild(menu);
  sel.parentNode.insertBefore(wrap, sel);
  sync();
}

function skinAllSelects() {
  document.querySelectorAll('#mk-filters select, #mk-sort').forEach(skinSelect);
  document.addEventListener('click', () => closeAllDwMenus(null));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllDwMenus(null); });
}

/* 把当前筛选/排序同步到地址栏，刷新或分享都能保留状态 */
function syncURL() {
  const qs = new URLSearchParams();
  Object.keys(state.f).forEach(k => { if (state.f[k]) qs.set(k, state.f[k]); });
  if (state.sort !== 'code') qs.set('sort', state.sort);
  const s = qs.toString();
  history.replaceState(null, '', s ? '?' + s : location.pathname);
}

document.addEventListener('DOMContentLoaded', () => {
  loadScores();
  mergeSnapshot().then(() => { if (state.rows && state.rows.length) render(); });
  buildFilters();

  // 从地址栏恢复筛选/排序
  const qs = new URLSearchParams(location.search);
  Object.keys(state.f).forEach(k => {
    const v = qs.get(k);
    if (v) {
      state.f[k] = v;
      const sel = document.querySelector(`#mk-filters select[data-key="${k}"]`);
      if (sel) { sel.value = v; sel.classList.add('on'); }
    }
  });
  const sortParam = qs.get('sort');
  if (sortParam) {
    state.sort = sortParam;
    $('mk-sort').value = sortParam;
    $('mk-sort').classList.add('on');
  } else if (state.f.theme) {
    // 从首页榜单点进来只带了 topic，排序要跟着主题走，否则会按代码乱序，看着像没生效
    const th = THEMES.find(t => t.id === state.f.theme);
    if (th) {
      state.sort = th.sort;
      $('mk-sort').value = th.sort;
      $('mk-sort').classList.add('on');
      syncURL();
    }
  }

  $('mk-sort').addEventListener('change', e => {
    state.sort = e.target.value;
    e.target.classList.toggle('on', state.sort !== 'code');
    if (state.batch) return;
    state.page = 1;
    syncURL();
    render();
  });

  /* 等地址栏参数恢复完、change 监听都挂好，再套上首页同款下拉皮 */
  skinAllSelects();

  /* 主题与行业风向不依赖行情载入，先把入口摆出来 */
  renderThemes();
  renderIndustry();

  $('btn-prev').addEventListener('click', () => goto(state.page - 1));
  $('btn-next').addEventListener('click', () => goto(state.page + 1));
  $('btn-jump').addEventListener('keydown', e => {
    if (e.key === 'Enter') goto(parseInt(e.target.value, 10) || 1);
  });
  $('search-input').addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const kw = e.target.value.trim();
    if (/^\d{6}$/.test(kw)) location.href = `./index.html?code=${kw}`;
    else if (kw) alert('请直接输入 6 位股票代码，例如 600519');
  });

  loadAll();
});

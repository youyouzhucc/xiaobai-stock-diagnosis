/* 全市场 A 股：一次性载入整张表（分 56 页请求），之后筛选 / 排序 / 翻页全在本地算 */
const PAGE_SIZE = 50;       // 每屏显示多少只
const FETCH_SIZE = 100;     // 接口单次最多给 100 条
const CLIST = 'https://push2.eastmoney.com/api/qt/clist/get';
const FS = 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23';
const FIELDS = 'f2,f3,f8,f9,f10,f12,f13,f14,f20,f23,f100';

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
    key: 'chg', all: '今日涨跌', opts: [
      { v: 'up', t: '上涨' },
      { v: 'down', t: '下跌' }
    ]
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
  f: { type: '', cap: '', pe: '', heat: '', chg: '' },
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
    vr_desc: (a, b) => (num(b.f10) || -1) - (num(a.f10) || -1),
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
      <span>量比 <b>${f2(d.f10)}</b></span>
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

/* ---------- 筛选栏 ---------- */
function buildFilters() {
  const box = $('mk-filters');
  box.innerHTML = FILTERS.map(def => `
    <select class="mk-sel" data-key="${def.key}">
      <option value="">${def.all}</option>
      ${def.opts.map(o => `<option value="${o.v}">${o.t}</option>`).join('')}
    </select>`).join('');

  box.querySelectorAll('select').forEach(sel => {
    sel.addEventListener('change', () => {
      state.f[sel.dataset.key] = sel.value;
      sel.classList.toggle('on', !!sel.value);
      state.page = 1;
      syncURL();
      render();
    });
  });
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
  }

  $('mk-sort').addEventListener('change', e => {
    state.sort = e.target.value;
    e.target.classList.toggle('on', state.sort !== 'code');
    state.page = 1;
    syncURL();
    render();
  });

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

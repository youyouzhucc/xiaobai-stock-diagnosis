/* 小白诊股 · 页面逻辑 */

const POOL = [
  { secid: '1.600519', name: '贵州茅台', py: 'gzmt' },
  { secid: '1.600036', name: '招商银行', py: 'zsyh' },
  { secid: '1.601318', name: '中国平安', py: 'zgpa' },
  { secid: '1.601899', name: '紫金矿业', py: 'zjky' },
  { secid: '1.600900', name: '长江电力', py: 'cjdl' },
  { secid: '1.601088', name: '中国神华', py: 'zgsh' },
  { secid: '1.688981', name: '中芯国际', py: 'zxgj' },
  { secid: '1.600276', name: '恒瑞医药', py: 'hryy' },
  { secid: '1.601012', name: '隆基绿能', py: 'ljln' },
  { secid: '1.600030', name: '中信证券', py: 'zxzq' },
  { secid: '1.600887', name: '伊利股份', py: 'ylgf' },
  { secid: '1.600690', name: '海尔智家', py: 'hezj' },
  { secid: '1.600809', name: '山西汾酒', py: 'sxfj' },
  { secid: '1.601166', name: '兴业银行', py: 'yhyh' },
  { secid: '1.603259', name: '药明康德', py: 'ymkd' },
  { secid: '0.000001', name: '平安银行', py: 'payh' },
  { secid: '0.000333', name: '美的集团', py: 'mdjt' },
  { secid: '0.000858', name: '五粮液', py: 'wly' },
  { secid: '0.000651', name: '格力电器', py: 'gldq' },
  { secid: '0.002594', name: '比亚迪', py: 'byd' },
  { secid: '0.300750', name: '宁德时代', py: 'ndsd' },
  { secid: '0.002415', name: '海康威视', py: 'hkws' },
  { secid: '0.300059', name: '东方财富', py: 'dfcf' },
  { secid: '0.002475', name: '立讯精密', py: 'lxxm' },
  { secid: '0.000725', name: '京东方A', py: 'jdfa' },
  { secid: '0.300760', name: '迈瑞医疗', py: 'mryl' },
  { secid: '0.002304', name: '洋河股份', py: 'yhgf' },
  { secid: '0.300124', name: '汇川技术', py: 'hcjs' },
  { secid: '0.002027', name: '分众传媒', py: 'fzcm' },
  { secid: '0.300015', name: '爱尔眼科', py: 'aeyk' }
];

const FILTER_DEFS = [
  {
    key: 'board', label: '板块', opts: [
      { v: '', t: '不限' },
      { v: 'main', t: '沪深主板（都能买）' },
      { v: 'gem', t: '创业板（要开通）' },
      { v: 'star', t: '科创板（要开通）' }
    ]
  },
  {
    key: 'type', label: '股票类型', opts: [
      { v: '', t: '不限' },
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
    key: 'cap', label: '市值', opts: [
      { v: '', t: '不限' },
      { v: 'big', t: '1000 亿以上（大盘）' },
      { v: 'mid', t: '200-1000 亿（中盘）' },
      { v: 'small', t: '200 亿以内（小盘）' }
    ]
  },
  {
    key: 'pe', label: '市盈率', opts: [
      { v: '', t: '不限' },
      { v: 'low', t: '10 倍以内（便宜）' },
      { v: 'mid', t: '10-20 倍之间' },
      { v: 'high', t: '20 倍以上（偏贵）' },
      { v: 'loss', t: '亏损中' }
    ]
  },
  {
    key: 'heat', label: '换手活跃度', opts: [
      { v: '', t: '不限' },
      { v: 'quiet', t: '冷清 · 换手不到 1%' },
      { v: 'normal', t: '正常 · 换手 1-3%' },
      { v: 'active', t: '活跃 · 换手 3-10%' },
      { v: 'hot', t: '过热 · 换手 10% 以上' }
    ]
  },
  {
    key: 'div', label: '股息率', opts: [
      { v: '', t: '不限' },
      { v: 'any', t: '近一年有分红' },
      { v: 'g1', t: '1% 以上' },
      { v: 'g2', t: '2% 以上' },
      { v: 'g3', t: '3% 以上' },
      { v: 'none', t: '近一年没分红' }
    ]
  },
  { key: 'strategy', label: '资金期限', opts: [{ v: '', t: '不限' }, { v: 'long', t: '长期闲钱' }, { v: 'short', t: '短期波段' }] },
  { key: 'risk', label: '风险承受', opts: [{ v: '', t: '不限' }, { v: 'low', t: '稳健保守' }, { v: 'high', t: '追求弹性' }] },
  { key: 'focus', label: '更看重', opts: [{ v: '', t: '不限' }, { v: 'base_good', t: '底子扎实' }, { v: 'val_low', t: '估值便宜' }, { v: 'trend_up', t: '趋势向上' }] },
  { key: 'chg', label: '最近交易日涨跌', opts: [{ v: '', t: '不限' }, { v: 'up', t: '上涨' }, { v: 'down', t: '下跌' }] }
];

/* 行业 -> 股票类型（东财行业名末尾常带 Ⅱ/Ⅲ 序号，先去掉再匹配）
 * 顺序即优先级：越具体、越容易误判的词放前面
 */
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

/* 页脚版本号自动跟随资源 URL 上的 ?v=，不用再手写 */
const VERSION = (() => {
  try {
    const s = document.querySelector('script[src*="app.js"]');
    return 'v' + (new URL(s.src).searchParams.get('v') || '?');
  } catch (e) { return 'v?'; }
})();

function syncVersion() {
  const t = VERSION + ' · ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  document.querySelectorAll('.ver').forEach(el => { el.textContent = t; });
}

const state = {
  items: [],
  filters: { board: '', kw: '', type: '', cap: '', pe: '', heat: '', div: '', strategy: '', risk: '', focus: '', chg: '' },
  done: 0,
  total: 0,
  bootError: null,
  current: null,
  chart: null,
  range: '1m',
  indexKl: null,
  order: null,
  fullRebuild: true,
  rankIndex: null,
  rankLoading: false,
  onlyMine: false
};

/* ---------- 工具 ---------- */
const $ = id => document.getElementById(id);
const f2 = v => (v === null || v === undefined) ? '—' : v.toFixed(2);
const fpct = v => (v === null || v === undefined) ? '—' : (v > 0 ? '+' : '') + v.toFixed(2) + '%';
const fcap = v => v === null || v === undefined ? '—' : v >= 1e12 ? (v / 1e12).toFixed(2) + '万亿' : (v / 1e8).toFixed(0) + '亿';
const fmoney = v => v === null || v === undefined ? '—' : Math.abs(v) >= 1e8 ? (v / 1e8).toFixed(1) + '亿' : (v / 1e4).toFixed(0) + '万';
const f1 = v => (v === null || v === undefined) ? '—' : v.toFixed(1);
const cls = v => v === null ? 'flat' : v > 0 ? 'up' : v < 0 ? 'down' : 'flat';
/* 分数配色只表示体检档位：好的一档加深、差的一档也给颜色，不再让 60 以下变成看不见的灰 */
const scoreColor = s => s === null ? 'var(--text-weak)'
  : s >= 80 ? 'var(--green)'
    : s >= 65 ? '#7C9186'
      : s >= 50 ? 'var(--orange)'
        : 'var(--red)';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- 每日综合分快照（每天 12:05 由 Actions 算好，全天复用） ---------- */
/* 快照一天只有一版，所以用日期做版本号：同一天内浏览器直接吃缓存，跨天自动换新 */
function dayTag() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

async function loadPreScores() {
  try {
    const res = await fetch(`data/scores.json?d=${dayTag()}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) { return null; }
}

/* ---------- 首页主题榜单 ----------
 * 数据由 scripts/build-scores.mjs 每天 12:05 生成一次（data/boards.json），
 * 页面只读不现算 —— 否则要在浏览器里拉 56 页全市场，打开就慢。
 */
const BOARD_METRIC = {
  cheap: { key: 'pe', label: 'PE' },
  bluechip: { key: 'pe', label: 'PE' },
  drop60: { key: 'd60', label: '近两月' },
  rise60: { key: 'd60', label: '近两月' },
  volume: { key: 'vr', label: '量比' },
  cold: { key: 'turn', label: '换手' }
};

async function loadBoards() {
  try {
    const res = await fetch(`data/boards.json?d=${dayTag()}`);
    if (!res.ok) return;
    renderBoards(await res.json());
  } catch (e) { /* 榜单拿不到就整块不显示，不影响主流程 */ }
}

/* ---------- 新股与上市排期 ----------
 * 数据来自交易所公布的新股申购排期（脚本每日生成 data/ipo.json），不含任何传闻。
 */
function ipoItem(x, kind) {
  const b = UI.BOARDS[x.board];
  const bd = b ? `<i class="bd ${b.key}" title="${esc(b.name + '需单独开通：' + b.need)}">${b.name}</i>` : '';
  const price = x.price === null ? '待定' : f2(x.price) + ' 元';
  const pe = x.pe === null ? '' : ` · 发行 PE ${f1(x.pe)}`;
  const when = kind === 'wait'
    ? `申购 ${String(x.applyDate || '').slice(5)}${x.listDate ? ' · 上市 ' + String(x.listDate).slice(5) : ' · 上市待定'}`
    : `上市 ${String(x.listDate || '').slice(5)}`;
  return `<a class="ipo-item" href="./index.html?code=${esc(x.code)}" data-code="${esc(x.code)}" data-wait="${kind === 'wait' ? '1' : ''}" data-note="${esc(when)}" title="看 ${esc(x.name)} 的详情">
    <div class="ipo-top"><span class="ipo-name">${esc(x.name)}</span><span class="ipo-code">${esc(x.code)}</span>${bd}</div>
    <div class="ipo-mid">发行价 <b>${price}</b>${pe}</div>
    <div class="ipo-when">${when}${x.ballotDate && kind === 'wait' ? ' · 中签公布 ' + String(x.ballotDate).slice(5) : ''}</div>
  </a>`;
}

/* ---------- 标题后面的问号：点开讲这块数据怎么读 ---------- */
const KNOW = {
  market: {
    t: '大盘数据怎么读',
    body: `<p><b>涨跌家数</b>：全市场（沪深两市合并）当天有多少只在涨、多少只在跌。指数只看权重股，涨跌家数更能反映「多数人的票是好是坏」。</p>
<p><b>两市成交额</b>：一天买卖了多少钱。放大说明分歧大、参与的人多；缩量说明大家都不想动手。</p>
<p><b>为什么还写着 11-06</b>：休市日数据不动，显示的是最近一个交易日的收盘数据——「最近交易日」四个字就是这个意思。</p>
<div class="know-warn">大盘只是背景板：指数涨，你手里的票照样可能跌。要不要买，回到它自己的体检报告上判断。</div>`
  },
  ipo: {
    t: '打新与上市排期怎么用',
    body: `<p><b>打新</b>是拿新股发行价去申购，中签了才付钱，上市第一天之后才能卖。</p>
<p><b>门槛</b>：主板（60 / 00 开头）没门槛；创业板要 20 个交易日日均资产 ≥10 万、且交易满 2 年；科创板、北交所是 ≥50 万、满 2 年。</p>
<p><b>风险</b>：新股不是稳赚。上市首日跌破发行价（叫「破发」）很常见，发行市盈率越高越要当心。</p>
<div class="know-warn">这里只列交易所公布的申购日 / 上市日，不含「听说要上市」的传闻——传闻没法核实，也不该拿来当依据。</div>`
  }
};

function openKnow(key) {
  closeKnow();
  const k = KNOW[key];
  if (!k) return;
  const mask = document.createElement('div');
  mask.className = 'know-mask';
  mask.innerHTML = `<div class="know-card">
    <div class="know-h"><span class="know-t">${k.t}</span><button class="know-x" type="button" aria-label="关闭">×</button></div>
    <div class="know-body">${k.body}</div>
  </div>`;
  mask.addEventListener('click', e => {
    if (e.target === mask || e.target.classList.contains('know-x')) closeKnow();
  });
  document.body.appendChild(mask);
}

function closeKnow() {
  const m = document.querySelector('.know-mask');
  if (m) m.remove();
}

function renderIpo(j) {
  const up = j.upcoming || [];
  const rc = j.recent || [];
  const box = $('ipo');
  if (!box) return;
  if (!up.length && !rc.length) { box.hidden = true; return; }
  box.hidden = false;
  $('ipo-note').textContent = `交易所公布的新股排期，不含传闻 · 数据 ${j.date || ''}`;
  $('ipo-body').innerHTML = `
    ${up.length ? `<div class="ipo-grp-t">等着上市 / 还能申购</div><div class="ipo-grid">${up.map(x => ipoItem(x, 'wait')).join('')}</div>` : ''}
    ${rc.length ? `<div class="ipo-grp-t">最近上市的</div><div class="ipo-grid">${rc.slice(0, 4).map(x => ipoItem(x, 'done')).join('')}</div>` : ''}`;

  /* 已上市的走链接直接进详情；还没上市的拦下来，说清排期，别点进详情报「没查到」 */
  $('ipo-body').querySelectorAll('.ipo-item').forEach(el => {
    el.style.cursor = 'pointer';
    if (el.dataset.wait === '1') {
      el.addEventListener('click', e => {
        e.preventDefault();
        toast(`${el.querySelector('.ipo-name').textContent} 还没上市：${el.dataset.note}`);
      });
    }
  });
}

async function loadIpo() {
  try {
    const res = await fetch(`data/ipo.json?d=${dayTag()}`);
    if (!res.ok) return;
    renderIpo(await res.json());
  } catch (e) { /* 拿不到就整块不显示 */ }
}

function metricText(id, s) {
  const m = BOARD_METRIC[id];
  if (!m) return '';
  const v = s[m.key];
  if (v === null || v === undefined) return `${m.label} —`;
  if (m.key === 'pe') return Number(v) <= 0 ? 'PE 亏损' : `PE ${Number(v).toFixed(1)}`;
  if (m.key === 'd60') return `${m.label} ${v > 0 ? '+' : ''}${Number(v).toFixed(1)}%`;
  if (m.key === 'vr') return `量比 ${Number(v).toFixed(2)}`;
  if (m.key === 'turn') return `换手 ${Number(v).toFixed(2)}%`;
  return `${m.label} ${v}`;
}

/* 主题说明：原来分「看的是什么」和「别误读成什么」两行，太占地方，
 * 合并成一句 —— 说清筛什么，顺带把最容易误解的地方说掉。
 */
const BOARD_SUB = {
  cheap: '市盈率最低的一批，便宜也可能是这门生意在走下坡',
  bluechip: '市值过千亿、市盈率 20 倍以内，稳，但涨得也慢',
  drop60: '两个月跌超两成，跌得多不代表会反弹',
  rise60: '两个月涨超两成，涨得猛可能是情绪推的',
  volume: '量比 2 以上，放量方向不一定，可能是消息也可能是资金',
  cold: '换手不到 1%，想买容易，想卖可能没人接'
};

/* 主题色调：六个方向统一白底，不再按好/坏上色 */
const BOARD_TONE = {};

function boardHTML(b) {
  const sub = BOARD_SUB[b.id] || b.note || '';
  /* 榜单这一行不放板块徽章：这里一列窄，塞进去名字会被挤断。
     能不能买只在大卡片和详情页标。 */
  const rows = (b.stocks || []).map(s => `
    <button class="bc-row" onclick="App.openByCode('${s.code}')">
      <span class="bc-name">${esc(s.name)}</span>
      <span class="bc-code">${s.code}</span>
      <span class="bc-metric">${metricText(b.id, s)}</span>
    </button>`).join('');
  return `<div class="bcard">
    <div class="bc-head">
      <span class="bc-title">${esc(b.title)}</span>
      <a class="bc-all" href="market.html?theme=${encodeURIComponent(b.id)}">共 ${b.count} 只 ›</a>
    </div>
    <div class="bc-sub">${esc(sub)}</div>
    <div class="bc-list">${rows}</div>
  </div>`;
}

function renderBoards(payload) {
  const box = $('boards'), grid = $('boards-grid');
  if (!box || !grid) return;
  const list = (payload && payload.boards) || [];
  if (!list.length) return;
  grid.innerHTML = list.map(boardHTML).join('');
  box.hidden = false;
  syncEntryVisibility();
}

/* 搜索时把「浏览全市场」「主题榜单」让位：用户已经有明确目标，不需要再被引导 */
function syncEntryVisibility() {
  const searching = !!(state.filters && state.filters.kw);
  const entry = document.querySelector('.market-entry');
  if (entry) entry.style.display = searching ? 'none' : '';
  const boards = $('boards');
  if (boards && !boards.hidden) boards.style.display = searching ? 'none' : '';
}

function applyPreScores(pre) {
  if (!pre || !pre.items) return 0;
  let hit = 0;
  state.items.forEach(it => {
    const s = pre.items[it.quote.code];
    if (!s || typeof s.total !== 'number') return;
    it.diag = {
      total: s.total, base: s.base, val: s.val, trend: s.trend, risk: s.risk,
      stats: s.stats || null,
      keys: s.keys || {},
      financial: !!s.financial,
      weights: s.weights || 4
    };
    it.dividend = s.dividendYield === null || s.dividendYield === undefined
      ? null
      : { dps: null, yieldPct: s.dividendYield, pre: true };
    it.pre = true;
    it.status = 'done';
    hit++;
  });
  state.preMeta = pre;
  state.preHit = hit;
  return hit;
}

/* ---------- 新手浮层 ---------- */
function openGuide() {
  const m = $('guide-mask');
  if (!m) return;
  m.classList.add('on');
  m.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeGuide() {
  const m = $('guide-mask');
  if (!m) return;
  m.classList.remove('on');
  m.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* ---------- 启动 ---------- */
async function init() {
  renderFilters();
  syncVersion();
  syncPermEntry();

  /* 标题后面的问号统一在这里收点击，比写在内联 onclick 上稳 */
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-know]');
    if (!b) return;
    e.preventDefault();
    openKnow(b.dataset.know);
  });

  loadMarket();
  loadBoards();   // 榜单跟大盘并行拉，谁先回来谁先显示
  loadIpo();      // 新股排期同理，拿不到就整块不显示

  const toTop = $('to-top');
  window.addEventListener('scroll', () => {
    toTop.classList.toggle('show', window.scrollY > 350);
  }, { passive: true });
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  $('search-input').addEventListener('input', e => {
    state.filters.kw = e.target.value.trim().toLowerCase();
    state.fullRebuild = true;
    syncEntryVisibility();
    scheduleRender();
  });

  const gb = $('guide-btn'), gm = $('guide-mask'), gx = $('guide-close');
  if (gb) gb.addEventListener('click', openGuide);
  if (gx) gx.addEventListener('click', closeGuide);
  if (gm) gm.addEventListener('click', e => { if (e.target === gm) closeGuide(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeGuide(); closePerm(); } });

  $('list').innerHTML = '<div class="empty">正在获取实时行情…</div>';

  try {
    /* 行情和当日分数快照同时发，谁也不用等谁：总耗时从「两次往返之和」降到「较长的那一次」 */
    const [quotes, pre] = await Promise.all([
      API.quotes(POOL.map(p => p.secid)),
      loadPreScores()
    ]);

    const bySecid = {};
    quotes.forEach(q => { bySecid[q.secid] = q; });

    state.items = POOL.map(p => {
      const q = bySecid[p.secid];
      return q ? { quote: q, py: p.py, diag: null, kline: null, fin: null, status: 'pending', pending: null, err: null } : null;
    }).filter(Boolean);

    state.total = state.items.length;

    /* 有快照就直接满血显示，不再逐只现算 */
    const hit = applyPreScores(pre);

    renderList();
    if (hit < 3) diagnoseQueue();
  } catch (e) {
    state.bootError = e.message || '行情获取失败';
    $('list').innerHTML = `<div class="error-state">行情获取失败：${esc(state.bootError)}<br>可能是网络或数据接口临时不可用。<br><button onclick="location.reload()">重新加载</button></div>`;
  }

  API.kline('INDEX', 250)
    .then(k => { state.indexKl = k; if (state.current) renderChart(state.range); })
    .catch(() => { });

  /* 空闲时把图表库下好，用户点进详情时基本已经就绪，又不占首屏带宽 */
  const idle = window.requestIdleCallback || (fn => setTimeout(fn, 1200));
  idle(() => ensureECharts().catch(() => { }));

  handleQuery();
}

/* ---------- 筛选器 ---------- */
function fmtAmt(v) {
  if (v == null || !v) return '—';
  if (v >= 1e12) return (v / 1e12).toFixed(2) + ' 万亿';
  return (v / 1e8).toFixed(0) + ' 亿';
}

async function loadMarket() {
  const box = $('mk-idx');
  if (!box) return;
  try {
    const idx = await API.market();
    const sh = idx.find(x => x.code === '000001');
    const sz = idx.find(x => x.code === '399001');
    const hs = idx.find(x => x.code === '000300');

    box.innerHTML = idx.map(x => {
      const cls = x.pct > 0 ? 'up' : (x.pct < 0 ? 'down' : 'flat');
      const sg = x.pct > 0 ? '+' : '';
      const pct = x.pct == null ? '—' : sg + x.pct.toFixed(2) + '%';
      return `<div class="mk-idx-item">
        <div class="mk-idx-name">${esc(x.name)}</div>
        <div class="mk-idx-val ${cls}">${x.price == null ? '—' : x.price.toFixed(2)}<span class="mk-idx-pct">${pct}</span></div>
      </div>`;
    }).join('');

    const rise = (sh && sh.rise || 0) + (sz && sz.rise || 0);
    const fall = (sh && sh.fall || 0) + (sz && sz.fall || 0);
    const flatN = (sh && sh.flat || 0) + (sz && sz.flat || 0);
    const all = rise + fall + flatN;

    $('mk-rise').style.width = all ? (rise / all * 100).toFixed(1) + '%' : '0%';
    $('mk-flat').style.width = all ? (flatN / all * 100).toFixed(1) + '%' : '0%';
    $('mk-fall').style.width = all ? (fall / all * 100).toFixed(1) + '%' : '0%';

    $('mk-nums').innerHTML = all
      ? `上涨 <b class="up">${rise}</b> 家　平盘 <b>${flatN}</b> 家　下跌 <b class="down">${fall}</b> 家　共 ${all} 只`
      : '涨跌家数暂未取到';

    const amt = (sh && sh.amount || 0) + (sz && sz.amount || 0);
    $('mk-amount').innerHTML = `两市成交<b>${fmtAmt(amt)}</b>元`;

    const ratio = all ? rise / all : 0.5;
    const hsPct = hs && hs.pct != null ? hs.pct : null;
    let txt = '涨跌参半，分化行情', tone = '';
    if (ratio >= 0.7) { txt = '普涨，多数股票在赚钱'; tone = 'warm'; }
    else if (ratio >= 0.55) { txt = '偏暖，上涨的多一些'; tone = 'warm'; }
    else if (ratio >= 0.45) { txt = '涨跌参半，分化行情'; tone = ''; }
    else if (ratio >= 0.3) { txt = '偏冷，多数股票在跌'; tone = 'cold'; }
    else { txt = '普跌，情绪明显偏冷'; tone = 'cold'; }

    let extra = '';
    if (hsPct != null) extra = `，沪深300 ${hsPct > 0 ? '+' : ''}${hsPct.toFixed(2)}%`;
    const sent = $('mk-sent');
    sent.textContent = txt + extra;
    sent.className = 'mk-sent ' + tone;

    /* 用行情自带的时间戳标注「数据时点」：非交易日一眼能看出这是上一个交易日的数据，
       不会被「今日」两个字误导 */
    const stamps = idx.map(x => x.at).filter(v => typeof v === 'number' && v > 0);
    const at = stamps.length ? Math.max.apply(null, stamps) : null;
    const titleEl = $('mk-title');

    if (at) {
      const d = new Date(at * 1000);
      const p = n => String(n).padStart(2, '0');
      const now = new Date();
      const sameDay = d.getFullYear() === now.getFullYear()
        && d.getMonth() === now.getMonth()
        && d.getDate() === now.getDate();
      if (titleEl) titleEl.textContent = sameDay ? '今日大盘' : '大盘概况 · 最近交易日';
      /* 同一天才显示到分钟，跨天只到日期，避免拿盘后入库时间当成交时间误读 */
      $('mk-time').textContent = sameDay
        ? `数据时点 ${p(d.getHours())}:${p(d.getMinutes())}`
        : `数据时点 ${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    } else {
      if (titleEl) titleEl.textContent = '大盘概况';
      $('mk-time').textContent = '更新 ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
  } catch (e) {
    box.innerHTML = '';
    $('mk-nums').textContent = '大盘数据暂时取不到，稍后刷新试试';
    $('mk-amount').textContent = '两市成交 —';
    $('mk-sent').textContent = '';
    $('mk-time').textContent = '加载失败';
  }
}

function filterTextOf(def) {
  const cur = state.filters[def.key] || '';
  const o = def.opts.find(x => x.v === cur) || def.opts[0];
  return `${def.label}：${o.t}`;
}

/* 一次套用整套条件时，把每个下拉的文案和「已选」标记都同步过来 */
function syncFilterTexts() {
  FILTER_DEFS.forEach(def => {
    const trg = $('trg-' + def.key);
    if (!trg) return;
    trg.textContent = filterTextOf(def);
    trg.classList.toggle('on', !!state.filters[def.key]);
  });
}

function renderFilters() {
  $('filters').innerHTML = FILTER_DEFS.map(def => {
    const items = def.opts.map((o, i) =>
      `<div class="dw-item${o.v === (state.filters[def.key] || '') ? ' on' : ''}" onclick="App.pick('${def.key}','${o.v}',this)">${o.t}</div>`
    ).join('');
    return `<div class="dw">
      <div class="dw-trigger${state.filters[def.key] ? ' on' : ''}" id="trg-${def.key}" onclick="App.toggleDw(event,this)">${filterTextOf(def)}</div>
      <div class="dw-arrow"></div>
      <div class="dw-menu">${items}</div>
    </div>`;
  }).join('') + permControls();
  renderPresets();
}

/* 筛选栏末尾两个控件：只看我能买的 / 存为常用 */
function permControls() {
  return `<button class="only-mine${state.onlyMine ? ' on' : ''}" onclick="App.toggleOnlyMine()">只看我能买的</button>
    <button class="preset-save" onclick="App.savePreset()">＋ 存为常用</button>`;
}

/* ---------- 常用筛选组合 ---------- */
const PRESET_KEY = 'xb.presets';

function getPresets() {
  try {
    const a = JSON.parse(localStorage.getItem(PRESET_KEY) || '[]');
    return Array.isArray(a) ? a : [];
  } catch (e) { return []; }
}
function setPresets(arr) {
  try { localStorage.setItem(PRESET_KEY, JSON.stringify(arr)); } catch (e) { /* 隐私模式忽略 */ }
}

/* 用条件本身当名字，比「组合 1」好认：取前三个短语 */
function presetLabel(f) {
  const parts = [];
  if (f.kw) parts.push('搜「' + f.kw + '」');
  FILTER_DEFS.forEach(def => {
    const v = f[def.key];
    if (!v) return;
    const o = def.opts.find(x => x.v === v);
    if (!o) return;
    parts.push(o.t.split('（')[0].split(' · ')[0]);
  });
  const head = parts.slice(0, 3).join(' · ');
  return parts.length > 3 ? head + ' …' : head;
}

function renderPresets() {
  const box = $('presets');
  if (!box) return;
  const list = getPresets();
  if (!list.length) { box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  box.innerHTML = `<span class="p-lbl">常用</span>` + list.map((p, i) =>
    `<span class="p-chip" onclick="App.usePreset(${i})" title="点一下套用这组条件">${esc(presetLabel(p))}<b class="p-x" onclick="App.delPreset(event,${i})" title="删掉">×</b></span>`
  ).join('');
}

function savePreset() {
  const cur = {};
  FILTER_DEFS.forEach(d => { if (state.filters[d.key]) cur[d.key] = state.filters[d.key]; });
  if (state.filters.kw) cur.kw = state.filters.kw;
  if (!Object.keys(cur).length) { toast('先在筛选栏选一组条件，再存'); return; }
  const list = getPresets();
  if (list.some(p => JSON.stringify(p) === JSON.stringify(cur))) { toast('这组条件已经存过了'); return; }
  if (list.length >= 4) { toast('最多存 4 组，先删掉一个'); return; }
  list.push(cur);
  setPresets(list);
  renderPresets();
  toast('已存下，下次点一下就能套用');
}

function usePreset(i) {
  const p = getPresets()[i];
  if (!p) return;
  FILTER_DEFS.forEach(d => { state.filters[d.key] = p[d.key] || ''; });
  state.filters.kw = p.kw || '';
  const si = $('search-input');
  if (si) si.value = state.filters.kw;
  syncFilterTexts();
  syncEntryVisibility();
  state.fullRebuild = true;
  scheduleRender();
  toast('已套用「' + presetLabel(p) + '」');
}

function delPreset(e, i) {
  e.stopPropagation();
  const list = getPresets();
  list.splice(i, 1);
  setPresets(list);
  renderPresets();
}

let toastTimer = null;
function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/* 顶部那颗「设置我能买的」按钮的状态：设过就点亮绿点 */
function syncPermEntry() {
  const n = Object.keys(UI.perms()).length;
  const b = $('perm-entry');
  if (b) {
    b.classList.toggle('on', !!n);
    b.title = n ? '已开通 ' + n + ' 个板块，点这里修改' : '设置自己已经开通了哪些板块';
  }
}

let permAutoMine = false;

function openPerm(auto) {
  closePerm();
  permAutoMine = !!auto;
  const p = UI.perms();
  const mask = document.createElement('div');
  mask.className = 'perm-mask';
  mask.innerHTML = `<div class="perm-card">
    <div class="perm-h">设置我能买的</div>
    <div class="perm-d">勾上你券商里已经开通的板块。设好之后，筛选里的「只看我能买的」会把买不了的票滤掉。这些只存在你自己的浏览器里，不会上传。</div>
    <label class="perm-row"><input type="checkbox" data-k="gem"${p.gem ? ' checked' : ''}> 已开通创业板（10 万 / 2 年）</label>
    <label class="perm-row"><input type="checkbox" data-k="star"${p.star ? ' checked' : ''}> 已开通科创板（50 万 / 2 年）</label>
    <div class="perm-tip">不确定开没开？打开券商 App →「我的」→ 业务办理里搜「创业板」「科创板」，搜得到就是还没开。</div>
    <button class="perm-ok" onclick="App.applyPerm()">保存</button>
  </div>`;
  mask.addEventListener('click', e => { if (e.target === mask) closePerm(); });
  document.body.appendChild(mask);
}

function closePerm() {
  const m = document.querySelector('.perm-mask');
  if (m) m.remove();
}

function applyPerm() {
  document.querySelectorAll('.perm-mask input[data-k]').forEach(i => UI.setPerm(i.dataset.k, i.checked));
  closePerm();
  if (permAutoMine) { state.onlyMine = true; permAutoMine = false; }
  syncPermEntry();
  renderFilters();
  state.fullRebuild = true;
  renderList();
  // 详情页开着就只换那条提示，不动图表和滚动位置
  if (state.current) {
    const old = document.querySelector('#detail-body .d-gate');
    if (old) {
      const box = document.createElement('div');
      box.innerHTML = gateHTML(state.current.quote.code);
      if (box.firstElementChild) old.replaceWith(box.firstElementChild);
    }
  }
}

function toggleOnlyMine() {
  // 还没设置过任何权限就打开筛选，会把一半股票无缘无故藏掉，先让他设
  if (!state.onlyMine && !Object.keys(UI.perms()).length) { openPerm(true); return; }
  state.onlyMine = !state.onlyMine;
  renderFilters();
  state.fullRebuild = true;
  renderList();
}

function toggleDw(e, el) {
  e.stopPropagation();
  const menu = el.parentNode.querySelector('.dw-menu');
  const showing = menu.classList.contains('show');
  document.querySelectorAll('.dw-menu').forEach(m => m.classList.remove('show'));
  document.querySelectorAll('.dw-trigger').forEach(t => t.classList.remove('open'));
  if (!showing) { menu.classList.add('show'); el.classList.add('open'); }
}

function pick(key, value, el) {
  state.filters[key] = value;
  const def = FILTER_DEFS.find(d => d.key === key);
  const txt = def.opts.find(o => o.v === value).t;
  const trg = $('trg-' + key);
  trg.textContent = `${def.label}：${txt}`;
  trg.classList.toggle('on', value !== '');
  el.parentNode.querySelectorAll('.dw-item').forEach(i => i.classList.remove('on'));
  el.classList.add('on');
  document.querySelectorAll('.dw-menu').forEach(m => m.classList.remove('show'));
  state.fullRebuild = true;
  scheduleRender();
}

document.addEventListener('click', () => {
  document.querySelectorAll('.dw-menu').forEach(m => m.classList.remove('show'));
  document.querySelectorAll('.dw-trigger').forEach(t => t.classList.remove('open'));
});

/* ---------- 诊断（后台逐只体检） ---------- */
function ensureDiag(item) {
  /* 分数已有当日快照、只差财报和 K 线（详情页要用）时，补齐数据但不重算分数 */
  const fillOnly = !!item.pre && !item.fin;
  if (!fillOnly && (item.status === 'done' || item.status === 'partial')) return Promise.resolve(item);
  if (item.pending) return item.pending;
  const wasDone = item.status === 'done';
  item.status = 'loading';
  item.pending = (async () => {
    const [kl, fin, dv] = await Promise.allSettled([
      API.kline(item.quote.secid, 250),
      API.financials(item.quote.secid),
      API.dividend(item.quote.secid, item.quote.price)
    ]);
    item.kline = kl.status === 'fulfilled' ? kl.value : null;
    item.fin = fin.status === 'fulfilled' ? fin.value : null;
    item.dividend = dv.status === 'fulfilled' ? dv.value : null;

    if (!item.kline && !item.fin) {
      item.status = 'error';
      item.err = (kl.reason && kl.reason.message) || (fin.reason && fin.reason.message) || '数据获取失败';
      return item;
    }

    /* 有当日快照的股票沿用快照分数，只补数据不重算 */
    if (!item.diag) {
      item.diag = Score.score({ quote: item.quote, fin: item.fin, stats: Score.statsOf(item.kline) });
    }
    if (item.diag && item.diag.total !== null) {
      // 记下分数，全市场页可以按分数排序（只对评测过的股票有效）
      try { localStorage.setItem('xs:' + item.quote.code, JSON.stringify({ t: item.diag.total, at: Date.now() })); } catch (e) { }
    }
    item.status = wasDone ? 'done' : (item.kline ? 'done' : 'partial');
    item.err = item.kline ? null : '历史 K 线获取失败，趋势与风险评分未计入';
    return item;
  })().then(r => {
    item.pending = null;
    onDiagDone();
    return r;
  }).catch(e => {
    item.status = 'error';
    item.err = e.message || '数据获取失败';
    item.pending = null;
    onDiagDone();
    return item;
  });
  return item.pending;
}

/* 体检结果先攒着，全部算完再一次性填入，整个过程中卡片内容不变、不闪 */
let diagDoneCount = 0;
function onDiagDone() { diagDoneCount++; }

async function diagnoseQueue() {
  const queue = state.items.slice();
  const worker = async () => {
    while (queue.length) {
      const it = queue.shift();
      await ensureDiag(it);
      await API.sleep(160); // 给数据接口留点喘息，避免被限流
    }
  };
  await Promise.all([worker(), worker()]);

  scheduleRender(); // 一次性填入所有分数

  // 兜底：45 秒还没算完（接口卡住时）先把手上的结果填进去
  setTimeout(() => {
    if (diagDoneCount < state.total) scheduleRender();
  }, 45000);
}

/* ---------- 列表 ---------- */
/* 顺序只在首屏定一次（按当日涨跌幅），之后体检分数陆续算出来也不重排，
   避免卡片反复换位 */
function fixedVisible() {
  if (!state.items.length) return [];   // 数据还没回来就别锁顺序，否则锁成空的
  if (!state.order) {
    state.order = state.items
      .slice()
      .sort((a, b) => (a.quote.pct == null ? -9999 : a.quote.pct) - (b.quote.pct == null ? -9999 : b.quote.pct))
      .map(i => i.quote.code);
  }
  const byCode = {};
  state.items.forEach(i => { byCode[i.quote.code] = i; });
  return state.order.map(c => byCode[c]).filter(Boolean).filter(matchFilters);
}

function matchFilters(it) {
  const q = it.quote;
  if (state.filters.kw) {
    const kw = state.filters.kw;
    const hit = q.name.toLowerCase().includes(kw) || q.code.includes(kw) || (it.py || '').includes(kw);
    if (!hit) return false;
  }
  const f = state.filters;
  const s = it.diag && it.diag.stats;

  // 只看我能买的：主板永远可买，创业板/科创板看用户自己勾了没有
  if (state.onlyMine && !UI.canBuy(q.code)) return false;

  // 板块：主板 / 创业板 / 科创板
  if (f.board) {
    const bd = UI.boardOf(q.code);
    if (f.board === 'main' && bd) return false;
    if (f.board === 'gem' && (!bd || bd.key !== 'gem')) return false;
    if (f.board === 'star' && (!bd || bd.key !== 'star')) return false;
  }

  // 股票类型：按行业归类，不依赖财报，体检中也能筛
  if (f.type && typeOf(q.industry) !== f.type) return false;

  // 市值分档
  if (f.cap) {
    const c = q.mktcap;
    if (c === null) return false;
    if (f.cap === 'big' && c < 1e11) return false;
    if (f.cap === 'mid' && (c < 2e10 || c >= 1e11)) return false;
    if (f.cap === 'small' && c >= 2e10) return false;
  }

  // 市盈率分档
  if (f.pe) {
    const pe = q.pe;
    if (pe === null) return false;
    if (f.pe === 'loss' && pe > 0) return false;
    if (f.pe === 'low' && !(pe > 0 && pe <= 10)) return false;
    if (f.pe === 'mid' && !(pe > 10 && pe <= 20)) return false;
    if (f.pe === 'high' && !(pe > 20)) return false;
  }

  // 今日活跃度（换手率）
  if (f.heat) {
    const t = q.turnover;
    if (t === null) return false;
    if (f.heat === 'quiet' && t >= 1) return false;
    if (f.heat === 'normal' && (t < 1 || t >= 3)) return false;
    if (f.heat === 'active' && (t < 3 || t >= 10)) return false;
    if (f.heat === 'hot' && t < 10) return false;
  }

  // 股息率（近 12 个月实际实施的现金分红 / 现价）
  if (f.div) {
    if (!it.dividend) return false;
    const y = it.dividend.yieldPct;
    const has = y !== null && y > 0;
    if (f.div === 'none') return !has;
    if (!has) return false;
    if (f.div === 'g1' && y < 1) return false;
    if (f.div === 'g2' && y < 2) return false;
    if (f.div === 'g3' && y < 3) return false;
  }

  // 今日涨跌
  if (f.chg) {
    const p = q.pct;
    if (p === null) return false;
    if (f.chg === 'up' && p <= 0) return false;
    if (f.chg === 'down' && p >= 0) return false;
  }

  if (f.strategy === 'long') {
    if (!s || s.vol > 32 || (it.diag.base !== null && it.diag.base < 65)) return false;
  }
  if (f.strategy === 'short') {
    if (!s || s.vol < 26 || it.diag.trend < 55) return false;
  }
  if (f.risk === 'low' && (!s || s.vol > 30)) return false;
  if (f.risk === 'high' && (!s || s.vol < 30)) return false;
  if (f.focus === 'base_good' && (!it.diag || it.diag.base === null || it.diag.base < 78)) return false;
  if (f.focus === 'val_low' && (!it.diag || it.diag.val === null || it.diag.val < 72)) return false;
  if (f.focus === 'trend_up' && (!it.diag || it.diag.trend === null || it.diag.trend < 60)) return false;
  return true;
}

function sortItems(items) {
  return items.sort((a, b) => {
    const sa = a.diag && a.diag.total, sb = b.diag && b.diag.total;
    if (sa !== null && sb !== null) return sb - sa;
    if (sa !== null) return -1;
    if (sb !== null) return 1;
    return (b.quote.pct || 0) - (a.quote.pct || 0);
  });
}

let renderTimer = null;
function scheduleRender() {
  if (renderTimer) return;
  renderTimer = setTimeout(() => { renderTimer = null; renderList(); }, 220);
}

function renderList() {
  const list = $('list');
  if (state.bootError) return;
  syncEntryVisibility();

  const visible = fixedVisible();
  const f = state.filters;
  const hasFilter = !!(f.kw || f.board || f.type || f.cap || f.pe || f.heat || f.div || f.strategy || f.risk || f.focus || f.chg) || state.onlyMine;
  const doneCount = state.items.filter(i => i.status === 'done' || i.status === 'partial' || i.status === 'error').length;
  const strain = state.total - doneCount;

  const direct = directCardHTML();
  if (!visible.length && !direct) {
    list.innerHTML = `<div class="empty">${hasFilter ? '当前条件下没有匹配的股票' : '暂无数据'}${strain > 0 ? '<br>体检还没做完，等几秒再试' : ''}</div>`;
    state.fullRebuild = true;
    return;
  }

  let grid = list.querySelector('.stock-grid');
  // 首屏、筛选/搜索变化时整块重建；体检结果回来时只就地换内容，卡片位置不动
  if (!grid || state.fullRebuild) {
    list.innerHTML = `<div class="stock-grid">${direct}${visible.map(cardHTML).join('')}</div>`;
    state.fullRebuild = false;
    return;
  }

  grid.querySelectorAll('.stock-item[data-code]').forEach(node => {
    const it = state.items.find(x => x.quote.code === node.dataset.code);
    if (!it) { node.remove(); return; }
    node.outerHTML = cardHTML(it);
  });
}

/* 搜索框里输入 6 位代码、且不在精选池时，给一张「直接诊断」卡片 */
function directCardHTML() {
  const kw = state.filters.kw;
  if (!/^\d{6}$/.test(kw)) return '';
  if (state.items.some(i => i.quote.code === kw)) return '';
  return `<div class="stock-item direct" onclick="App.openByCode('${kw}')">
    <div class="si-top">
      <div class="si-left">
        <span class="si-name">直接诊断 ${kw}</span>
      </div>
      <div class="si-right"><span class="si-go">出报告 ›</span></div>
    </div>
    <div class="si-meta">这只不在精选池里，点一下现拉它的行情、财报和历史 K 线。</div>
  </div>`;
}

function tagOf(kind, text) {
  return `<span class="tag ${kind}">${text}</span>`;
}

function cardHTML(it) {
  const q = it.quote;
  const d = it.diag;
  const s = d && d.stats;
  const tags = [];

  if (d) {
    if (s && q.pe !== null && q.pe <= 0) tags.push(tagOf('bad', '亏损中'));
    else if (d.val !== null && s) tags.push(d.val >= 72 ? tagOf('good', '估值便宜') : d.val <= 55 ? tagOf('bad', '估值偏贵') : tagOf('mid', '估值中性'));
    if (d.trend !== null) tags.push(d.trend >= 60 ? tagOf('good', '趋势向上') : d.trend <= 45 ? tagOf('warn', '趋势偏弱') : '');
    if (d.base !== null) tags.push(d.base >= 78 ? tagOf('good', '底子扎实') : d.base <= 55 ? tagOf('warn', '底子偏弱') : '');
    if (s && s.vol >= 45) tags.push(tagOf('warn', '波动偏大'));
    if (it.status === 'partial') tags.push(tagOf('mid', '缺历史K线'));
  } else if (it.status === 'error') {
    tags.push(tagOf('mid', '数据不全'));
  } else {
    tags.push(tagOf('mid', '待体检'));
  }

  const hp = healthOf(d && d.total);
  const score = d && d.total !== null
    ? `<span class="si-score" style="color:${scoreColor(d.total)}" title="体检分：只看基本面有没有硬伤，不代表会涨">${d.total}<small>分</small></span><i class="hp ${hp.cls}">${hp.short}</i>`
    : `<span class="si-score pending">—</span>`;

  /* 三项固定占位：体检没跑完先显示「—」，数字补上来时行高不变，卡片不会被撑动 */
  const extra = [
    `换手 <b>${q.turnover === null || q.turnover === undefined ? '—' : f1(q.turnover) + '%'}</b>`,
    `量比 <b>${q.volratio === null || q.volratio === undefined ? '—' : f1(q.volratio)}</b>`,
    `股息 <b>${it.dividend && it.dividend.yieldPct !== null ? f2(it.dividend.yieldPct) + '%' : '—'}</b>`
  ];

  return `<div class="stock-item" data-code="${q.code}" onclick="App.openDetail('${q.secid}')">
    <div class="si-top">
      <div class="si-left">
        <span class="si-name">${esc(q.name)}</span>
        <span class="si-code">${q.code}</span>
        <span class="si-ind">${esc(q.industry)}</span>
        ${UI.badge(q.code)}
      </div>
      <div class="si-right">
        <div class="si-price">${f2(q.price)}</div>
        <div class="si-pct ${cls(q.pct)}">${fpct(q.pct)}</div>
      </div>
    </div>
    <div class="si-meta">
      <span>体检 ${score}</span>
      <span>PE <b>${q.pe === null ? '—' : q.pe <= 0 ? '亏损' : f1(q.pe)}</b></span>
      <span>PB <b>${f1(q.pb)}</b></span>
      <span>市值 <b>${fcap(q.mktcap)}</b></span>
    </div>
    ${extra.length ? `<div class="si-extra">${extra.join('<span class="dot-sep">·</span>')}</div>` : ''}
    <div class="tags">${tags.filter(Boolean).join('')}</div>
  </div>`;
}

/* ---------- 详情 ---------- */
async function openDetail(secid) {
  const item = state.items.find(i => i.quote.secid === secid);
  if (!item) return;
  state.current = item;
  state.range = '1m';
  switchView('detail');
  $('detail-body').innerHTML = '<div class="card"><div class="empty">正在做体检，拉取行情、财报和历史 K 线…</div></div>';

  await ensureDiag(item);
  if (state.current !== item) return;
  try {
    renderDetail(item);
  } catch (e) {
    $('detail-body').innerHTML = `<div class="card"><div class="empty">渲染出错：${esc(e.message)}<br><small>${esc(String(e.stack || '').split('\n').slice(0, 3).join(' | '))}</small></div></div>`;
  }
}

function goHome() {
  state.current = null;
  if (state.chart) { state.chart.dispose(); state.chart = null; }
  switchView('home');
  renderList();
  try { history.replaceState(null, '', location.pathname); } catch (e) { }
}

/* ---------- 任意 6 位代码直查 ---------- */
/* 沪深主板/创业板/科创板：6 开头走沪市，其余走深市；北交所（43/83/87/92）东财挂在 0 段下，92 不能被当成沪市 9 字头 */
const secidOf = code => (/^6/.test(code) || (/^9/.test(code) && !/^9[2-9]/.test(code))) ? '1.' + code : '0.' + code;

async function openByCode(raw) {
  const code = String(raw || '').trim();
  if (!/^\d{6}$/.test(code)) return;
  const secid = secidOf(code);

  const exists = state.items.find(i => i.quote.secid === secid);
  if (exists) { openDetail(secid); return; }

  switchView('detail');
  $('detail-body').innerHTML = `<div class="card"><div class="empty">正在拉取 ${esc(code)} 的行情、财报和历史 K 线…</div></div>`;

  try {
    const quotes = await API.quotes([secid]);
    if (!quotes.length) throw new Error('接口没有返回这只股票，代码可能不存在或已退市');
    const item = { quote: quotes[0], py: '', diag: null, kline: null, fin: null, status: 'pending', pending: null, err: null };
    state.items.unshift(item);
    state.total = state.items.length;
    renderList();
    try { history.replaceState(null, '', '?code=' + code); } catch (e) { }
    state.current = null;
    openDetail(secid);
  } catch (e) {
    $('detail-body').innerHTML = `<div class="card"><div class="empty">
      没查到 ${esc(code)}：${esc(e.message || '接口请求失败')}<br><br>
      请确认是 6 位沪深 A 股代码（60 / 68 / 00 / 30 开头），也可能是接口临时限流，稍等再试。<br><br>
      <button class="retry" onclick="App.goHome()">回到列表</button>
    </div></div>`;
  }
}

function handleQuery() {
  const params = new URLSearchParams(location.search);
  const code = params.get('code') || params.get('c');
  if (code && /^\d{6}$/.test(code)) openByCode(code);
}

function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $(name + '-view').classList.add('active');
  window.scrollTo(0, 0);
}

/* ---------- 全市场估值排名（每日由脚本生成 data/ranks.json） ---------- */
function paintRank() {
  const box = document.getElementById('d-rank');
  const it = state.current;
  if (!box || !it) return;
  const q = it.quote;
  if (q.pe !== null && q.pe <= 0) {
    box.textContent = '亏损中，不参与估值排名';
    box.removeAttribute('title');
    return;
  }
  const r = state.rankIndex && state.rankIndex.get(q.code);
  if (!r) {
    box.textContent = '这只不在估值排名口径内';
    return;
  }
  box.textContent = `全市场估值第 ${r.r} / ${r.n} 名`;
  box.title = '按市盈率、市净率在全市场 5000 多只里综合排序；不含财报与 K 线，亏损股不参与';
}

async function kickMarketRank() {
  if (state.rankIndex) { paintRank(); return; }
  if (state.rankLoading) return;
  state.rankLoading = true;
  try {
    /* 排名表每天一版，用日期做版本号，同一天内不重复下载这 50KB */
    const res = await fetch(`data/ranks.json?d=${dayTag()}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    const n = j.n || 0, maps = j.ranks || {};
    const idx = new Map();
    Object.keys(maps).forEach(k => idx.set(k, { r: maps[k], n }));
    state.rankIndex = idx;
    paintRank();
  } catch (e) {
    const box = document.getElementById('d-rank');
    if (box) box.textContent = '全市场排名暂不可用';
  } finally {
    state.rankLoading = false;
  }
}

/* ---------- 体检结论：把「分数」翻译成「身体状况」，避免把高分当买入信号 ----------
 * 分数只表示体检项有没有硬伤（像体检报告），不预测涨跌。所以展示时先给结论标签、再给最大短板。
 */
function healthOf(total) {
  if (total === null || total === undefined) return { cls: 'mid', long: '数据不足，先别下结论', short: '待体检' };
  if (total >= 80) return { cls: 'good', long: '体检良好 · 适合关注', short: '良好' };
  if (total >= 65) return { cls: 'good', long: '体检尚可 · 放观察池', short: '尚可' };
  if (total >= 50) return { cls: 'warn', long: '有疑点 · 先看短板', short: '存疑' };
  return { cls: 'bad', long: '多项异常 · 慎碰', short: '慎碰' };
}

function scoreLine(d) {
  if (!d || d.total === null) return '行情或财报还没拉全，综合分先空着——没有数据就不编分数。';
  const p = [];
  if (d.base !== null) p.push(`底子 ${d.base}`);
  if (d.val !== null) p.push(`估值 ${d.val}`);
  if (d.trend !== null) p.push(`趋势 ${d.trend}`);
  if (d.risk !== null) p.push(`风险 ${d.risk}`);
  return `${d.total} 分是这几项的加权结果：${p.join(' · ')}。分数只说明体检项有没有硬伤（像体检报告），不代表会涨，更不是买入信号。`;
}

/* 最大的那个短板：不管总分多少，先把最扎人的一条摆到最上面 */
function weakestOf(it) {
  const d = it.diag, q = it.quote, s = d && d.stats, f = it.fin || {};
  if (!d || d.total === null) return null;
  const dims = [
    { k: 'base', v: d.base, name: '底子' },
    { k: 'val', v: d.val, name: '估值' },
    { k: 'trend', v: d.trend, name: '趋势' },
    { k: 'risk', v: d.risk, name: '风险' }
  ].filter(x => x.v !== null && x.v !== undefined);
  if (!dims.length) return null;

  const w = dims.reduce((a, b) => (a.v <= b.v ? a : b));
  /* 四项都在 60 以上就不硬造短板，如实说「四项都过线」 */
  if (w.v >= 60) return { cls: 'good', title: `最低的${w.name}也有 ${w.v} 分`, why: '看着健康，但健康不等于会涨，价格什么时候动还得看市场。' };

  let why = '';
  if (w.k === 'base') {
    if (f.roe !== null && f.roe !== undefined && f.roe < 8) why = `ROE 只有 ${f1(f.roe)}%，股东投的钱赚回来很慢`;
    else if (f.debtRatio !== null && f.debtRatio !== undefined && f.debtRatio >= 70) why = `资产负债率 ${f1(f.debtRatio)}%，靠借钱撑规模，利息一涨就难受`;
    else if (f.cashPerShare !== null && f.cashPerShare !== undefined && f.cashPerShare <= 0) why = '每股经营现金流为负，账上利润没变成现金';
    else why = '赚钱能力和财务结构都偏弱，景气一差就容易亏';
  } else if (w.k === 'val') {
    if (q.pe !== null && q.pe <= 0) why = '公司还在亏钱，PE 用不上，估值没有参照物';
    else if (s && s.pos >= 75) why = `PE ${f1(q.pe)} 倍，价格已经处在近一年 ${s.pos.toFixed(0)}% 的高位，追高风险大`;
    else why = `PE ${f1(q.pe)} 倍、PB ${f1(q.pb)}，比同行业明显贵，预期先透支了`;
  } else if (w.k === 'trend') {
    if (s && s.ret20 !== null) why = `近 20 个交易日 ${s.ret20 >= 0 ? '涨' : '跌'}了 ${Math.abs(s.ret20).toFixed(1)}%，还在 20 日均线下方，短期往下走`;
    else why = '价格在 20 日均线下方，短期走势偏弱';
  } else {
    why = s ? `年化波动 ${s.vol.toFixed(0)}%、最深回撤 ${Math.abs(s.mdd).toFixed(0)}%，拿不住的人容易割在低点` : '波动偏大，不适合重仓';
  }
  return { cls: w.v <= 45 ? 'bad' : 'warn', title: w.name + ' ' + w.v + ' 分', why };
}

function verdictOf(it) {
  const d = it.diag, q = it.quote, s = d && d.stats;
  if (!d || d.total === null) return '数据不足，暂时给不出综合评价。先把行情和财报拉全再看。';
  const parts = [];
  if (d.base !== null) parts.push(`底子 ${d.base} 分`);
  if (d.val !== null) parts.push(`估值 ${d.val} 分`);
  if (d.trend !== null) parts.push(`趋势 ${d.trend} 分`);
  if (d.risk !== null) parts.push(`风险 ${d.risk} 分`);
  const facts = [];
  if (it.fin && it.fin.roe !== null) facts.push(`ROE ${f1(it.fin.roe)}%`);
  if (q.pe !== null) facts.push(q.pe > 0 ? `PE ${f1(q.pe)} 倍` : 'PE 为负（亏损）');
  if (s) facts.push(`近一年价格分位 ${s.pos.toFixed(0)}%`);
  const lead = d.total >= 80 ? '综合分排在样本池前列'
    : d.total >= 65 ? '整体偏正面，但有一两项明显短板'
      : d.total >= 50 ? '指标中规中矩，适合先放进观察池'
        : '多项指标偏弱，不建议现在重仓';
  return `${lead}：${parts.join('、')}。${facts.length ? '关键数据：' + facts.join('、') + '。' : ''}`;
}

function heatOf(q) {
  const t = q.turnover;
  if (t === null) return { text: '换手率数据缺失。' };
  if (t >= 8) return { text: `当前热度：非常拥挤。换手率 ${f2(t)}%，最近交易日换手极快，短线资金进进出出，追高风险大。` };
  if (t >= 4) return { text: `当前热度：偏热。换手率 ${f2(t)}%，交易活跃度在中上水平。` };
  if (t >= 1.5) return { text: `当前热度：正常。换手率 ${f2(t)}%，没有明显的抢筹或抛售。` };
  return { text: `当前热度：冷门。换手率只有 ${f2(t)}%，买卖清淡，没什么人挤在这里。` };
}

function adviceOf(it) {
  const d = it.diag;
  const s = d && d.stats;
  const q = it.quote;
  let main;
  const cheap = d.val !== null && d.val >= 72;
  const pricey = d.val !== null && d.val <= 55;
  const strong = d.trend !== null && d.trend >= 60;
  const weak = d.trend !== null && d.trend <= 45;

  if (d.val === null || d.trend === null) {
    main = '数据不全，先看行情和财报，别急着下结论。';
  } else if (q.pe !== null && q.pe <= 0) {
    main = '这家公司目前是亏损的，市盈率没有参考意义。亏损股的估值只能看 PB 和行业周期，风险比盈利公司大得多，别用「便宜」来说服自己。';
  } else if (cheap && strong) {
    main = '价格相对便宜，走势也已经转强，属于「又便宜又在涨」的组合。可以正常参与，但仍建议分批，不要一次打满。';
  } else if (cheap && weak) {
    main = '便宜是真便宜，但还在往下走。便宜不等于马上涨，别急着把准备买它的钱一次花光。';
  } else if (pricey && strong) {
    main = '公司不差、走势也强，但价格已经把好消息反映得差不多了，现在追高性价比一般。';
  } else if (pricey && weak) {
    main = '又贵又弱，是最不划算的组合：估值没打折，趋势还在往下。';
  } else if (strong) {
    main = '走势偏强、估值中性。顺着趋势做，但要给自己留好回撤空间。';
  } else if (weak) {
    main = '走势偏弱，估值也没明显便宜。等它自己先止跌，会比现在出手更稳妥。';
  } else {
    main = '不多不少的中性状态：既能拿，也没到必须抢的时候。';
  }

  const vol = s ? s.vol : null;
  const parts = vol === null ? 3 : vol >= 45 ? 5 : vol >= 30 ? 4 : 3;
  const batch = vol === null
    ? `把计划投入的钱分成 ${parts} 份，跌一段买一份，不要一次买完。`
    : `近一年年化波动约 ${vol.toFixed(0)}%，把计划投入的钱分成 ${parts} 份，每跌 3%-5% 买一份，${vol >= 45 ? '这种波动下最忌一把梭' : '慢慢摊成本更舒服'}。`;

  const who = (q.pe !== null && q.pe <= 0)
    ? '能接受公司还在亏钱、业绩随时可能反复的人；新手不建议碰亏损股。'
    : vol === null ? '想长期持有的人。'
      : vol >= 45 ? '能扛住单日 5% 以上波动、看得懂回撤的人。'
        : vol >= 30 ? '能接受 20%-30% 回撤的中线投资者。'
          : '不喜欢天天盯盘、更看重稳定的人。';

  return { main, batch, who: who + (q.turnover !== null && q.turnover >= 6 ? '当前换手偏快，短线情绪浓，别被当天涨跌带着走。' : '') };
}

function defenseOf(it) {
  const s = it.diag && it.diag.stats;
  const fin = it.fin;
  const out = [];
  if (s) {
    out.push(`跌破 20 日均线（${f2(s.ma20)} 元）并且连着 3 天收不回来，说明短期趋势走坏。`);
    out.push(`近一年最低 ${f2(s.low)} 元 是这轮的地板，跌破意味着支撑失守，要重新评估。`);
  }
  if (fin && fin.netProfitYoY !== null) {
    out.push(`上期净利润同比 ${fin.netProfitYoY > 0 ? '+' : ''}${f1(fin.netProfitYoY)}%，下一份财报如果继续下滑甚至转负，说明生意在变差。`);
  }
  if (q_isPEGuard(it)) out.push('金融股看净利润和不良率，不要只看负债率——银行的负债结构和其他行业不一样。');
  if (!out.length) out.push('行情数据暂不可用，等数据恢复再看。');
  return out;
}
const q_isPEGuard = it => Score.isFinancial(it.quote.industry);

function oddsOf(it) {
  const s = it.diag && it.diag.stats;
  if (!s) return null;
  const price = it.quote.price;
  const down = (s.low / price - 1) * 100;
  const up = (s.high / price - 1) * 100;
  const odds = down < -0.5 ? Math.abs(up / down) : null;
  let note;
  if (down > -0.5) {
    note = '当前价格已经贴在近一年最低点附近，下跌空间几乎为零，但也说明它一直没起来——先确认基本面没恶化。';
  } else if (odds >= 2) {
    note = `向下约 ${Math.abs(down).toFixed(0)}%，向上约 ${up.toFixed(0)}%，涨的空间明显大于跌的空间。赔率好不等于马上涨，撑得住才关键。`;
  } else if (odds >= 1.2) {
    note = '上下空间大致对称，不属于「跌下去有人接」的位置，赚不赚钱主要看公司本身。';
  } else {
    note = '向上空间已经不多，价格更接近一年高位，等回调再买会更划算。';
  }
  return { low: s.low, high: s.high, down, up, odds, note, lowDate: s.lowDate, highDate: s.highDate, price };
}

function baseConcl(d) {
  if (d.base === null) return '财报数据没拿到，这块先空着';
  if (d.base >= 85) return '赚钱能力很强，财务结构也稳健';
  if (d.base >= 70) return '生意不错，只有个别指标有瑕疵';
  if (d.base >= 55) return '中规中矩，要看行业景气度';
  return '赚钱能力或财务结构偏弱，要小心';
}

function valConcl(d) {
  if (d.val === null) return '行情估值字段缺失';
  if (d.val >= 80) return '在样本池里算便宜的';
  if (d.val >= 65) return '估值中性偏低';
  if (d.val >= 50) return '估值中性，谈不上便宜';
  return '估值偏贵，价格已透支一部分预期';
}

function trendConcl(it) {
  const s = it.diag && it.diag.stats;
  if (!s) return '缺少历史 K 线';
  if (s.last > s.ma20 && s.ma20 > s.ma60) return '多头排列，中期趋势向上';
  if (s.last > s.ma20 && s.ma20 <= s.ma60) return '短期刚转强，中期还在修复';
  if (s.last <= s.ma20 && s.ma20 > s.ma60) return '中期向上，短期在回调';
  return '均线空头排列，趋势偏弱';
}

function translationOf(it) {
  const s = it.diag && it.diag.stats;
  if (!s) return '历史 K 线暂不可用，没法翻译走势。';
  const idx = state.indexKl;
  let idxRet = null;
  if (idx && idx.length > 21) idxRet = (idx[idx.length - 1].close / idx[idx.length - 21].close - 1) * 100;
  const r20 = s.ret20;
  let t = r20 === null ? '最近 20 个交易日的涨跌数据不足' : `最近 20 个交易日${r20 >= 0 ? '涨' : '跌'}了 ${Math.abs(r20).toFixed(1)}%`;
  if (idxRet !== null && r20 !== null) {
    const gap = r20 - idxRet;
    t += `，同期沪深300${idxRet >= 0 ? '涨' : '跌'}了 ${Math.abs(idxRet).toFixed(1)}%，${gap >= 0 ? '跑赢' : '跑输'}大盘 ${Math.abs(gap).toFixed(1)} 个百分点`;
  }
  t += `。现在价格处在近一年区间的 ${s.pos.toFixed(0)}% 位置（0% 是全年最低、100% 是全年最高），`;
  t += s.pos >= 82 ? '已经贴近高位，追高的性价比在下降。' : s.pos <= 30 ? '在低位区域，但低位也说明市场暂时不看好它。' : '处在中间地带，往上往下都还有空间。';
  return t;
}

function divNote(divv, q) {
  if (!divv) return '分红数据暂不可用。';
  if (!divv.count) return '最近 12 个月没有实施现金分红，股息率按 0 算。一般多见于把钱留着扩产的成长型公司。';
  const y = divv.yieldPct;
  /* 水平判断已经在上面每格说过了，这里只留算法，不重复结论 */
  let t = `${f2(y)}% = 近 12 个月每股派现 ${f2(divv.dps)} 元 ÷ 现价 ${f2(q.price)} 元（税前口径）。`;
  if (y >= 4) t += '这种高股息要留意是不是一次性大额派现撑起来的。';
  return t;
}

function heatConcl(q) {
  const t = q.turnover;
  if (t === null) return '';
  if (t >= 10) return '换手 ' + f1(t) + '% · 成交过热';
  if (t >= 3) return '换手 ' + f1(t) + '% · 成交活跃';
  if (t >= 1) return '换手 ' + f1(t) + '% · 成交正常';
  return '换手 ' + f1(t) + '% · 成交清淡';
}

/* 详情页「能不能买」：只有创业板 / 科创板 / 北交所需要单独开通权限，主板不写 */
function gateHTML(code) {
  const b = UI.boardOf(code);
  if (!b) return '';
  if (UI.perms()[b.key]) {
    return `<div class="d-gate on"><b>${b.name}股票</b>　你已标记为已开通，可以直接买。</div>`;
  }
  return `<div class="d-gate"><b>${b.name}股票，买入前要先开通权限</b>　${b.need}。<br>
    不确定开没开？打开券商 App，在「我的 → 业务办理」里搜「${b.name}」。</div>`;
}

/* ---------- 指标读解 ----------
 * 每个数字直接说「这个水平算高还是低」，不再把指标定义翻译一遍。
 * 阈值按 A 股常见口径划，只做相对位置的判断。
 */
function lvRoe(v) {
  if (v === null) return '';
  if (v >= 20) return '很高，属于 A 股里最赚钱的那一档';
  if (v >= 15) return '偏高，赚钱能力扎实';
  if (v >= 10) return '中等，及格线上';
  if (v >= 5) return '偏低，赚钱效率一般';
  if (v >= 0) return '很低，几乎没给股东赚钱';
  return '负的，公司正在亏钱';
}
function lvEps(v) {
  if (v === null) return '';
  if (v >= 2) return '每股一年赚 2 元以上，利润很厚';
  if (v >= 1) return '每股 1 元以上，扎实';
  if (v >= 0.3) return '一般水平';
  if (v >= 0) return '很薄';
  return '每股在亏';
}
function lvMargin(v) {
  if (v === null) return '';
  if (v >= 50) return '很高，产品有明显定价权';
  if (v >= 35) return '偏高，护城河还在';
  if (v >= 20) return '中等，制造业多是这个水平';
  if (v >= 10) return '偏低，主要靠走量';
  return '很薄，成本一涨就吃利润';
}
function lvNetMargin(v) {
  if (v === null) return '';
  if (v >= 20) return '很高，每 100 元收入能落下 20 元以上';
  if (v >= 10) return '不错';
  if (v >= 5) return '一般，算是薄利';
  if (v >= 0) return '很薄，几乎不剩下什么';
  return '负的，在亏';
}
function lvDebt(v) {
  if (v === null) return '';
  if (v < 30) return '很低，基本靠自己扛，风险小';
  if (v < 50) return '适中';
  if (v < 65) return '偏高，借的钱不算少';
  if (v < 80) return '很高，杠杆重，行业下行时更吃力';
  return '极高，财务压力大';
}
function lvCash(v) {
  if (v === null) return '';
  if (v >= 1.5) return '每股一年收回 1.5 元以上现金，很实在';
  if (v >= 0.5) return '还行，赚到的是真钱';
  if (v >= 0) return '偏薄，利润没完全变成现金';
  return '现金流是负的，钱在往外流，要警惕';
}
function lvPE(v, loss) {
  if (loss) return '公司在亏钱，这个数用不上';
  if (v === null) return '';
  if (v < 10) return '不到 10 倍，比 A 股大多数股票便宜';
  if (v < 20) return '10–20 倍，A 股的中位区间';
  if (v < 30) return '20–30 倍，偏贵';
  if (v < 50) return '30–50 倍，市场给的预期很高';
  return '50 倍以上，非常贵，跌起来也快';
}
function lvPB(v) {
  if (v === null) return '';
  if (v < 1) return '低于净资产，属于破净';
  if (v < 2) return '1–2 倍，常见水平';
  if (v < 4) return '2–4 倍，偏高';
  if (v < 8) return '4–8 倍，明显高于账面';
  return '8 倍以上，估值里装了很多预期';
}
function lvPos(v) {
  if (v === null) return '';
  if (v < 20) return '接近一年最低，位置很低';
  if (v < 40) return '偏低位';
  if (v < 60) return '一年里的中间位置';
  if (v < 80) return '偏高位';
  return '接近一年最高，位置很高';
}
function lvCap(v) {
  if (v === null) return '';
  if (v >= 1e11) return '千亿以上，大盘股，波动相对小';
  if (v >= 2e10) return '两百亿到千亿，中盘';
  return '两百亿以内，小盘，波动大';
}
function lvTurn(v) {
  if (v === null) return '';
  if (v < 1) return '不到 1%，成交清淡，买卖都不热';
  if (v < 3) return '1–3%，正常水平';
  if (v < 10) return '3–10%，比较活跃';
  return '超过 10%，换手过热，多半是短线资金';
}
function lvVR(v) {
  if (v === null) return '';
  if (v < 0.8) return '不到 1，今天比平时缩量';
  if (v < 1.5) return '1 附近，跟平时差不多';
  if (v < 2.5) return '比平时放量';
  return '明显放量，有资金在动';
}
function lvDiv(v) {
  if (v === null) return '';
  if (v <= 0) return '这一年没派过现金';
  if (v < 1) return '不到 1%，分红很少';
  if (v < 3) return '1–3%，中等';
  if (v < 5) return '3–5%，现金回报不错';
  return '5% 以上，很高，留神是不是一次性大额派现';
}

function renderDetail(it) {
  const q = it.quote, d = it.diag, s = d && d.stats, fin = it.fin;
  const divv = it.dividend;
  const heat = heatOf(q);
  const adv = adviceOf(it);
  const odds = oddsOf(it);
  const def = defenseOf(it);
  const hp = healthOf(d && d.total);
  const w = weakestOf(it);

  const finNote = fin
    ? `财报口径：${esc(fin.report)}${fin.notice ? ' · 披露于 ' + esc(fin.notice) : ''}`
    : '财报数据暂不可用（接口超时或该股暂无数据）';

  const baseItems = fin ? UI.kvGrid([
    { label: ['ROE', 'roe'], value: fin.roe === null ? '—' : f1(fin.roe) + '%', desc: lvRoe(fin.roe) },
    d.financial
      ? { label: ['每股收益', 'eps'], value: fin.eps === null ? '—' : f2(fin.eps) + ' 元', desc: lvEps(fin.eps) }
      : { label: ['毛利率', 'margin'], value: fin.grossMargin === null ? '—' : f1(fin.grossMargin) + '%', desc: lvMargin(fin.grossMargin) },
    {
      label: [d.financial ? '净利率' : '资产负债率', d.financial ? 'netmargin' : 'debt'],
      value: d.financial
        ? (fin.netMargin === null ? '—' : f1(fin.netMargin) + '%')
        : (fin.debtRatio === null ? '—' : f1(fin.debtRatio) + '%'),
      desc: d.financial ? lvNetMargin(fin.netMargin) : lvDebt(fin.debtRatio)
    },
    { label: ['每股经营现金流', 'cash'], value: fin.cashPerShare === null ? '—' : f2(fin.cashPerShare) + ' 元', desc: lvCash(fin.cashPerShare) }
  ]) : `<div class="kv" style="grid-column:1/-1"><div class="kv-label">财务数据</div><div class="kv-val" style="font-size:15px">暂不可用</div><div class="kv-desc">接口没有返回这只股票的财报，底子分不参与综合评分</div></div>`;

  const valItems = UI.kvGrid([
    { label: ['市盈率 PE', 'pe'], value: q.pe === null ? '—' : q.pe <= 0 ? '亏损' : f1(q.pe) + ' 倍', desc: lvPE(q.pe, q.pe !== null && q.pe <= 0) },
    { label: ['市净率 PB', 'pb'], value: f1(q.pb), desc: lvPB(q.pb) },
    { label: ['价格分位', 'pos'], value: s ? s.pos.toFixed(0) + '%' : '—', desc: s ? lvPos(s.pos) : '' },
    { label: ['总市值', 'cap'], value: fcap(q.mktcap), desc: lvCap(q.mktcap) }
  ]);

  const reportRows = fin ? [
    ['营业收入', fmoney(fin.revenue) + ' 元', fin.revenueYoY],
    ['归母净利润', fmoney(fin.netProfit) + ' 元', fin.netProfitYoY],
    ['每股收益', fin.eps === null ? '—' : f2(fin.eps) + ' 元', null],
    ['每股净资产', fin.bps === null ? '—' : f2(fin.bps) + ' 元', null]
  ].map(([label, val, yoy]) => `
    <div class="report-row">
      <span>${label}</span>
      <span><b>${val}</b>${yoy === null ? '' : `<span class="report-tag ${yoy > 0 ? 'good' : yoy < 0 ? 'bad' : 'mid'}">同比 ${yoy > 0 ? '+' : ''}${f1(yoy)}%</span>`}</span>
    </div>`).join('') : '<div class="report-row"><span>财报数据暂不可用</span><span>—</span></div>';

  $('detail-body').innerHTML = `
  <div class="card">
    <div class="d-head">
      <div>
        <div class="d-title">${esc(q.name)}</div>
        <div class="d-sub">${q.code} · ${esc(q.industry)}${UI.badge(q.code)}</div>
      </div>
      <div class="d-score-wrap">
        <div class="d-score" style="background:${scoreColor(d.total)}">${d.total === null ? '—' : d.total}<small>分</small></div>
        <div class="d-health ${hp.cls}">${hp.long}</div>
        <div class="d-rank" id="d-rank">全市场排名加载中…</div>
      </div>
    </div>

    ${w ? `<div class="weak ${w.cls}">
      <span class="weak-t">${w.cls === 'bad' ? '❌ 核心风险' : w.cls === 'good' ? '✅ 四项都过线' : '⚠ 最大短板'}：${w.title}</span>
      <span class="weak-w">${w.why}</span>
    </div>` : ''}
    <div class="score-note">${scoreLine(d)}</div>

    <div class="d-pricebar">
      <span>现价 <span class="big">${f2(q.price)}</span></span>
      <span class="pct ${cls(q.pct)}">${fpct(q.pct)}</span>
      <span>PE ${q.pe === null ? '—' : q.pe <= 0 ? '亏损' : f1(q.pe)}</span>
      <span>PB ${f1(q.pb)}</span>
      <span>市值 ${fcap(q.mktcap)}</span>
    </div>

    ${gateHTML(q.code)}
  </div>

  <div class="d-cols">
  <div class="d-col">

  <div class="card">
    ${UI.title('操作建议')}
    <div class="heat"><span>${heat.text}</span></div>
    <div class="advice-body" style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:16px">${adv.main}</div>
    <div class="advice-block">
      <div class="advice-sub">分批节奏</div>
      <div class="advice-body">${adv.batch}</div>
    </div>
    <div class="advice-block">
      <div class="advice-sub">适合人群</div>
      <div class="advice-body">${adv.who}</div>
    </div>
    <div class="advice-block">
      <div class="advice-sub">跟踪防线</div>
      ${def.map((t, i) => `<div class="bullet"><span class="dot ${i === 0 ? 'g' : i === 1 ? 'r' : 'b'}"></span><span>${t}</span></div>`).join('')}
    </div>
  </div>

  <div class="card">
    <div class="section-title">
      <span class="st-name">盈亏空间测算</span>
      ${odds && odds.odds !== null ? `<span class="st-odds">赔率 ${odds.odds.toFixed(1)}</span>` : ''}
      <span class="st-inline-note">${odds ? esc(odds.note) : '缺少历史 K 线，算不出空间。'}</span>
    </div>
    <div class="odds">
      <div class="odds-down">
        <div class="odds-label">最多亏</div>
        <div class="odds-val">${odds ? odds.down.toFixed(0) + '%' : '—'}</div>
        <div class="odds-sub">地板 ${odds ? f2(odds.low) + ' 元 · ' + String(odds.lowDate || '').slice(5) : '—'}</div>
      </div>
      <div class="odds-up">
        <div class="odds-label">最多赚</div>
        <div class="odds-val">${odds ? '+' + odds.up.toFixed(0) + '%' : '—'}</div>
        <div class="odds-sub">天花板 ${odds ? f2(odds.high) + ' 元 · ' + String(odds.highDate || '').slice(5) : '—'}</div>
      </div>
    </div>
  </div>

  <div class="card">
    ${UI.title('交易活跃与分红', heatConcl(q))}
    ${UI.kvGrid([
      { label: ['换手率', 'turnover'], value: q.turnover === null ? '—' : f1(q.turnover) + '%', desc: lvTurn(q.turnover) },
      { label: ['量比', 'volratio'], value: q.volratio === null ? '—' : f2(q.volratio), desc: lvVR(q.volratio) },
      { label: ['股息率', 'dividend'], value: divv && divv.yieldPct !== null ? f2(divv.yieldPct) + '%' : '—', desc: divv ? lvDiv(divv.yieldPct) : '' },
      { label: '近一年派现', small: true, value: divv && divv.count ? `${divv.count} 次 · 每股 ${f2(divv.dps)} 元` : '没有分红', desc: divv && divv.lastDate ? '最近一次除息日 ' + divv.lastDate : '这一年没有派现记录' }
    ])}
    <div class="st-note">${divNote(divv, q)}</div>
  </div>

  </div>
  <div class="d-col">

  <div class="card">
    ${UI.title('公司底子', baseConcl(d), d.base === null ? '—' : d.base + '/100')}
    ${UI.bar(d.base, 'green')}
    ${baseItems}
    <div class="st-note">${finNote}${d.financial ? ' · 金融业不评资产负债率' : ''}</div>
  </div>

  <div class="card">
    ${UI.title('估值水平', valConcl(d), d.val === null ? '—' : d.val + '/100')}
    ${UI.bar(d.val, 'orange')}
    ${valItems}
    <div class="st-note">PE 取的是滚动市盈率（TTM），亏损公司按「亏损」显示、不参与打高分。</div>
  </div>

  <div class="card">
    ${UI.title('近期趋势', trendConcl(it), d.trend === null ? '—' : d.trend + '/100')}
    ${UI.bar(d.trend, 'blue')}
    <div class="tags" style="margin-bottom:12px">
      <span class="tag ${s && s.last > s.ma20 ? 'good' : 'warn'}">${s && s.last > s.ma20 ? '站上 20 日均线' : '压在 20 日均线下方'}</span>
      ${s ? `<span class="tag ${s.ma20 > s.ma60 ? 'good' : 'warn'}">${s.ma20 > s.ma60 ? '20 日线在 60 日线上方' : '20 日线在 60 日线下方'}</span>` : ''}
      ${s ? `<span class="tag mid">年化波动 ${s.vol.toFixed(0)}%</span>` : ''}
      ${s ? `<span class="tag mid">最大回撤 ${Math.abs(s.mdd).toFixed(0)}%</span>` : ''}
    </div>
    <div class="chart-head">
      <div class="legend">
        <span><i class="l-stock"></i>本股</span>
        <span><i class="l-ma"></i>20 日均线</span>
        <span><i class="l-index"></i>沪深300（同起点）</span>
      </div>
      <div class="range">
        <button class="${state.range === '1m' ? 'on' : ''}" onclick="App.setRange('1m')">近1月</button>
        <button class="${state.range === '6m' ? 'on' : ''}" onclick="App.setRange('6m')">近半年</button>
        <button class="${state.range === '1y' ? 'on' : ''}" onclick="App.setRange('1y')">近1年</button>
      </div>
    </div>
    <div id="trendChart"></div>
    <div class="chart-note">${translationOf(it)}</div>
  </div>

  <div class="card">
    ${UI.title('最新财报', fin ? esc(fin.report) : '暂无')}
    <div class="report-list">${reportRows}</div>
    <div class="st-note">数据来自上市公司定期报告，按最近已披露的报告期展示。</div>
  </div>

  </div>
  </div>

  <div class="disclaimer">
    行情、历史 K 线来自东方财富公开接口，财务数据来自上市公司定期报告。<br>
    <b>以上全部是客观数据整理，不构成任何投资建议。</b><br>
    历史数据不代表未来，股市有风险，投资需谨慎。
    <div class="ver">${VERSION}</div>
  </div>`;

  renderChart(state.range);
  kickMarketRank();
  syncVersion();
}

/* ---------- 图表库（按需加载，不占首屏） ---------- */
let echartsJob = null;
function ensureECharts() {
  if (window.echarts) return Promise.resolve(window.echarts);
  if (echartsJob) return echartsJob;
  echartsJob = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js';
    s.async = true;
    s.onload = () => window.echarts ? resolve(window.echarts) : reject(new Error('图表库为空'));
    s.onerror = () => { echartsJob = null; reject(new Error('图表库加载失败')); };
    document.head.appendChild(s);
  });
  return echartsJob;
}

/* ---------- 图表 ---------- */
function setRange(range) {
  state.range = range;
  document.querySelectorAll('.range button').forEach(b => b.classList.remove('on'));
  const btns = document.querySelectorAll('.range button');
  const idx = range === '1m' ? 0 : range === '6m' ? 1 : 2;
  if (btns[idx]) btns[idx].classList.add('on');
  renderChart(range);
}

function renderChart(range) {
  const box = $('trendChart');
  if (!box) return;
  const it = state.current;
  if (!it || !it.kline) {
    box.className = 'chart-empty';
    box.textContent = '历史 K 线暂不可用';
    return;
  }
  if (it.kline.length < 30) {
    box.className = 'chart-empty';
    box.textContent = '上市时间较短，K 线不足 30 个交易日';
    return;
  }
  if (typeof echarts === 'undefined') {
    box.className = 'chart-empty';
    box.textContent = '图表加载中…';
    ensureECharts()
      .then(() => { if (state.current === it) renderChart(state.range); })
      .catch(() => {
        const b = $('trendChart');
        if (b) { b.className = 'chart-empty'; b.textContent = '图表库加载失败，请检查网络后刷新'; }
      });
    return;
  }

  box.className = '';
  if (state.chart) { state.chart.dispose(); state.chart = null; }
  state.chart = echarts.init(box);

  const kl = it.kline;
  const n = range === '1m' ? 22 : range === '6m' ? 125 : 250;
  const part = kl.slice(-n);

  if (!part.length) { box.className = 'chart-empty'; box.textContent = '暂无数据'; return; }

  const dates = part.map(k => k.date.slice(5));
  const closes = part.map(k => k.close);

  // 20 日均线：用完整序列计算后截取
  const maFull = [];
  for (let i = 0; i < kl.length; i++) {
    if (i < 19) { maFull.push(null); continue; }
    let sum = 0;
    for (let j = i - 19; j <= i; j++) sum += kl[j].close;
    maFull.push(+(sum / 20).toFixed(2));
  }
  const maPart = maFull.slice(-n);

  // 沪深300 归一化到同一起点
  let idxPart = null;
  if (state.indexKl && state.indexKl.length >= part.length) {
    const ip = state.indexKl.slice(-part.length);
    const base = closes[0] / ip[0].close;
    idxPart = ip.map(k => +(k.close * base).toFixed(2));
  }

  const all = closes.concat(idxPart || [], maPart.filter(v => v !== null));
  const min = Math.min.apply(null, all);
  const max = Math.max.apply(null, all);
  const pad = (max - min) * 0.12 || max * 0.05;

  state.chart.setOption({
    animationDuration: 600,
    grid: { left: 46, right: 12, top: 22, bottom: 24 },
    tooltip: {
      trigger: 'axis',
      confine: true,
      backgroundColor: '#fff',
      borderColor: '#EFECE6',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: '#2C2B29', fontSize: 12 },
      extraCssText: 'box-shadow:0 4px 16px rgba(60,55,50,.12);border-radius:8px;',
      formatter: params => {
        const d0 = params[0];
        let html = `<div style="font-size:12px;color:#8A8581;margin-bottom:6px">${d0.axisValue}</div>`;
        let stock = null, ma = null, idx = null;
        params.forEach(p => {
          if (p.value === null || p.value === undefined) return;
          const v = Number(p.value);
          if (p.seriesName === '本股') stock = v;
          else if (p.seriesName === '20日均线') ma = v;
          else if (p.seriesName === '沪深300') idx = v;
          html += `<div style="display:flex;justify-content:space-between;gap:14px;line-height:1.7">
            <span>${p.marker}${p.seriesName}</span><b>${v.toFixed(2)}</b></div>`;
        });

        /* 把三条线的相对关系翻译成人话 */
        const notes = [];
        if (stock !== null && ma !== null && ma > 0) {
          const gap = (stock - ma) / ma * 100;
          notes.push(gap >= 0
            ? `比自己的 20 日均线高 ${gap.toFixed(1)}%，短期处于均线之上`
            : `比自己的 20 日均线低 ${Math.abs(gap).toFixed(1)}%，短期处于均线之下`);
        }
        if (stock !== null && idx !== null && idx > 0) {
          const gap = (stock - idx) / idx * 100;
          notes.push(gap >= 0
            ? `比沪深300 同期高 ${gap.toFixed(1)}%，跑赢大盘`
            : `比沪深300 同期低 ${Math.abs(gap).toFixed(1)}%，跑输大盘`);
        }
        if (notes.length) {
          html += `<div style="margin-top:6px;padding-top:6px;border-top:1px dashed #EFECE6;
            width:196px;white-space:normal;word-break:break-word;
            font-size:11px;color:#5A5652;line-height:1.6">${notes.map(n => `<div>${n}</div>`).join('')}</div>`;
        }
        return html;
      }
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#8A8581', fontSize: 10, margin: 12,
        interval: Math.max(1, Math.floor(part.length / 4)),
        formatter: v => v
      }
    },
    yAxis: {
      type: 'value',
      scale: true,
      min: Math.floor((min - pad) * 100) / 100,
      max: Math.ceil((max + pad) * 100) / 100,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#8A8581', fontSize: 10, margin: 8,
        formatter: v => Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2)
      },
      splitLine: { lineStyle: { color: '#F3F0EA' } }
    },
    series: [
      {
        name: '本股', type: 'line', data: closes, smooth: true, symbol: 'circle', symbolSize: 5,
        showSymbol: false, color: '#7B8F9D',
        lineStyle: { color: '#7B8F9D', width: 2.5 },
        itemStyle: { color: '#7B8F9D' },
        areaStyle: { color: 'rgba(123,143,157,0.10)' },
        z: 3
      },
      {
        name: '20日均线', type: 'line', data: maPart, smooth: true, symbol: 'none', color: '#B89A7D',
        lineStyle: { color: '#B89A7D', width: 1.4, type: 'solid' },
        itemStyle: { color: '#B89A7D' }, z: 2
      },
      {
        name: '沪深300', type: 'line', data: idxPart, smooth: true, symbol: 'none', color: '#A6A29D',
        lineStyle: { color: '#A6A29D', width: 1.3, type: 'dashed' },
        itemStyle: { color: '#A6A29D' }, z: 1
      }
    ]
  }, true);
}

/* ---------- 名词解释 ---------- */
const DICT = {
  roe: ['ROE（净资产收益率）', '衡量公司用股东的钱赚钱的能力。数值越高，说明每一块钱本金产生的利润越多。', '你花 100 万开一家店，一年纯赚 20 万，ROE 就是 20%。长期高于 15% 通常算好生意。'],
  margin: ['毛利率', '卖 100 元的货，扣掉直接的生产或进货成本后还剩多少。毛利率高，说明产品有定价权。', '一杯卖 30 元的奶茶，原料成本 9 元，毛利率就是 70%。原料涨价它却不敢提价，毛利率就会往下掉。'],
  debt: ['资产负债率', '公司总负债占总资产的比例。越低说明还债压力越小，越高说明杠杆用得越猛。', '你名下 500 万资产里有 350 万是房贷，资产负债率就是 70%。房价一跌，压力立刻变大。'],
  netmargin: ['净利率', '每 100 元收入，扣掉所有成本和费用后真正剩下多少。金融股更常看这个指标。', '银行收进来 100 元利息和手续费，扣掉存款利息、人工和坏账准备，最后剩十几块，就是净利率。'],
  eps: ['每股收益 EPS', '净利润平摊到每一股上是多少钱，是最常被用来衡量赚不赚钱的指标。', '公司一年净赚 10 亿元、一共 5 亿股，每股收益就是 2 元。'],
  cash: ['每股经营现金流', '公司做买卖实际收到的现金，按每股摊开算。它比账面利润更能说明钱有没有真收回来。', '卖出 100 万的货只收回 20 万现金、其余是欠条，这种利润就不算高质量。'],
  pe: ['市盈率 PE（TTM）', '你愿意为公司一年的利润付多少倍的价钱。数值越高，回本越慢，也意味着市场预期越高。', '花 50 万盘下一家奶茶店，每年纯赚 5 万，PE 就是 10 倍——要 10 年才回本。'],
  pb: ['市净率 PB', '股价相对于每股净资产（公司账面上的家底）的倍数。低于 1 倍意味着市值比账面净资产还便宜。', '一套账面值 500 万的房子，你花 400 万买下，PB 就是 0.8 倍。'],
  pos: ['价格分位', '当前价格在过去一年最低价到最高价之间的位置。0% 是全年最低，100% 是全年最高。', '就像衡量今天气温在过去一年里的位置：处在 90% 分位，说明最近很少有这么热。'],
  cap: ['总市值', '市场给这家公司的总报价，等于股价乘以总股本。', '一家公司 10 亿股、每股 20 元，总市值就是 200 亿元。'],
  vol: ['年化波动率', '把最近 60 个交易日的日涨跌幅度折算成一整年的波动幅度。数值越大，股价越颠簸。', '年化波动 50% 意味着一年里上下三成的起伏很正常，心脏不够强就别重仓。'],
  mdd: ['最大回撤', '过去一年里，从阶段最高点跌到最低点的最大跌幅。它衡量的是「最难受的时候有多难受」。', '一只股票从 100 元涨到 120 元又跌到 80 元，最大回撤就是 33%。'],
  odds: ['赔率', '向上空间和向下空间的比例。赔率 3 倍意味着潜在涨幅是潜在跌幅的 3 倍。', '向下最多亏 10%、向上可能赚 30%，赔率就是 3。'],
  turnover: ['换手率', '最近一个交易日成交的股数占流通股的百分比。换手率高说明这只股票买卖的人多、分歧大；换手率长期低于 1% 说明没人搭理，想卖可能卖不掉。', '一家公司流通 100 亿股，某一天成交 3 亿股，换手率就是 3%。'],
  volratio: ['量比', '最近一个交易日平均每分钟的成交量，除以过去 5 个交易日同一时刻的平均成交量。大于 1 说明比平时更活跃，突然放到 3 倍以上往往是有消息。', '量比 2.0 = 最近交易日每分钟的成交是平时的 2 倍，说明有人在集中买卖。'],
  dividend: ['股息率', '最近 12 个月公司真金白银派给你的现金，除以现在的股价。它是「光靠分红几年能回本」的粗略尺度，不含卖出收益，也不考虑分红税。', '股价 100 元、一年每股派 3 元，股息率就是 3%。注意这是税前的现金分红。']
};

function showPopover(el, key) {
  const data = DICT[key];
  if (!data) return;
  const pop = $('popover'), overlay = $('overlay'), arrow = $('popover-arrow');
  $('pop-title').textContent = data[0];
  $('pop-body').innerHTML = `<p style="margin:0">${data[1]}</p><div class="pop-case">${data[2]}</div>`;
  pop.style.display = 'block';
  void pop.offsetWidth;
  pop.classList.add('show');
  overlay.style.display = 'block';

  const r = el.getBoundingClientRect();
  const pw = pop.offsetWidth, ph = pop.offsetHeight;
  let left = r.left + r.width / 2 - pw / 2;
  const m = 10;
  if (left < m) left = m;
  else if (left + pw > window.innerWidth - m) left = window.innerWidth - pw - m;
  pop.style.left = left + 'px';

  let top = r.bottom + 8, isTop = false;
  if (top + ph > window.innerHeight - m) { top = r.top - ph - 8; isTop = true; }
  if (top < m) top = m;
  pop.style.top = top + 'px';

  let al = r.left + r.width / 2 - left - 5;
  al = Math.max(12, Math.min(al, pw - 24));
  arrow.style.left = al + 'px';
  if (isTop) {
    arrow.style.top = 'auto'; arrow.style.bottom = '-5px';
    arrow.style.borderLeft = 'none'; arrow.style.borderTop = 'none';
    arrow.style.borderRight = '1px solid #EFECE6'; arrow.style.borderBottom = '1px solid #EFECE6';
  } else {
    arrow.style.bottom = 'auto'; arrow.style.top = '-5px';
    arrow.style.borderRight = 'none'; arrow.style.borderBottom = 'none';
    arrow.style.borderTop = '1px solid #EFECE6'; arrow.style.borderLeft = '1px solid #EFECE6';
  }
}

function closePopover() {
  const pop = $('popover');
  if (!pop || pop.style.display === 'none') return;
  pop.classList.remove('show');
  $('overlay').style.display = 'none';
  setTimeout(() => { pop.style.display = 'none'; }, 150);
}

document.addEventListener('click', e => {
  const term = e.target.closest('.term');
  if (term) { showPopover(term, term.getAttribute('data-term')); }
  else if (!e.target.closest('.popover')) closePopover();
});

window.addEventListener('resize', () => { if (state.chart) state.chart.resize(); });

window.App = { openDetail, openByCode, goHome, setRange, toggleDw, pick, openPerm, closePerm, applyPerm, toggleOnlyMine, savePreset, usePreset, delPreset, openKnow, closeKnow };

init();

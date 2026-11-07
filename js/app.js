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
  { key: 'strategy', label: '资金期限', opts: [{ v: '', t: '不限' }, { v: 'long', t: '长期闲钱' }, { v: 'short', t: '短期波段' }] },
  { key: 'risk', label: '风险承受', opts: [{ v: '', t: '不限' }, { v: 'low', t: '稳健保守' }, { v: 'high', t: '追求弹性' }] },
  { key: 'focus', label: '更看重', opts: [{ v: '', t: '不限' }, { v: 'base_good', t: '底子扎实' }, { v: 'val_low', t: '估值便宜' }, { v: 'trend_up', t: '趋势向上' }] }
];

const state = {
  items: [],
  filters: { kw: '', strategy: '', risk: '', focus: '' },
  done: 0,
  total: 0,
  bootError: null,
  current: null,
  chart: null,
  range: '1m',
  indexKl: null
};

/* ---------- 工具 ---------- */
const $ = id => document.getElementById(id);
const f2 = v => (v === null || v === undefined) ? '—' : v.toFixed(2);
const fpct = v => (v === null || v === undefined) ? '—' : (v > 0 ? '+' : '') + v.toFixed(2) + '%';
const fcap = v => v === null || v === undefined ? '—' : v >= 1e12 ? (v / 1e12).toFixed(2) + '万亿' : (v / 1e8).toFixed(0) + '亿';
const fmoney = v => v === null || v === undefined ? '—' : Math.abs(v) >= 1e8 ? (v / 1e8).toFixed(1) + '亿' : (v / 1e4).toFixed(0) + '万';
const f1 = v => (v === null || v === undefined) ? '—' : v.toFixed(1);
const cls = v => v === null ? 'flat' : v > 0 ? 'up' : v < 0 ? 'down' : 'flat';
const scoreColor = s => s === null ? 'var(--text-weak)' : s >= 80 ? 'var(--green)' : s >= 60 ? 'var(--orange)' : 'var(--text-weak)';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- 启动 ---------- */
async function init() {
  renderFilters();
  $('search-input').addEventListener('input', e => {
    state.filters.kw = e.target.value.trim().toLowerCase();
    scheduleRender();
  });
  $('list').innerHTML = '<div class="empty">正在获取实时行情…</div>';

  try {
    const quotes = await API.quotes(POOL.map(p => p.secid));
    const bySecid = {};
    quotes.forEach(q => { bySecid[q.secid] = q; });

    state.items = POOL.map(p => {
      const q = bySecid[p.secid];
      return q ? { quote: q, py: p.py, diag: null, kline: null, fin: null, status: 'pending', pending: null, err: null } : null;
    }).filter(Boolean);

    state.total = state.items.length;
    renderList();
    diagnoseQueue();
  } catch (e) {
    state.bootError = e.message || '行情获取失败';
    $('list').innerHTML = `<div class="error-state">行情获取失败：${esc(state.bootError)}<br>可能是网络或数据接口临时不可用。<br><button onclick="location.reload()">重新加载</button></div>`;
    $('status-text').textContent = '行情不可用';
  }

  API.kline('INDEX', 250)
    .then(k => { state.indexKl = k; if (state.current) renderChart(state.range); })
    .catch(() => { });
}

/* ---------- 筛选器 ---------- */
function renderFilters() {
  $('filters').innerHTML = FILTER_DEFS.map(def => {
    const items = def.opts.map((o, i) =>
      `<div class="dw-item${i === 0 ? ' on' : ''}" onclick="App.pick('${def.key}','${o.v}',this)">${o.t}</div>`
    ).join('');
    return `<div class="dw">
      <div class="dw-trigger" id="trg-${def.key}" onclick="App.toggleDw(event,this)">${def.label}：不限</div>
      <div class="dw-arrow"></div>
      <div class="dw-menu">${items}</div>
    </div>`;
  }).join('');
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
  scheduleRender();
}

document.addEventListener('click', () => {
  document.querySelectorAll('.dw-menu').forEach(m => m.classList.remove('show'));
  document.querySelectorAll('.dw-trigger').forEach(t => t.classList.remove('open'));
});

/* ---------- 诊断（后台逐只体检） ---------- */
function ensureDiag(item) {
  if (item.status === 'done' || item.status === 'partial') return Promise.resolve(item);
  if (item.pending) return item.pending;
  item.status = 'loading';
  item.pending = (async () => {
    const [kl, fin] = await Promise.allSettled([
      API.kline(item.quote.secid, 250),
      API.financials(item.quote.secid)
    ]);
    item.kline = kl.status === 'fulfilled' ? kl.value : null;
    item.fin = fin.status === 'fulfilled' ? fin.value : null;

    if (!item.kline && !item.fin) {
      item.status = 'error';
      item.err = (kl.reason && kl.reason.message) || (fin.reason && fin.reason.message) || '数据获取失败';
      return item;
    }
    item.diag = Score.score({ quote: item.quote, fin: item.fin, stats: Score.statsOf(item.kline) });
    item.status = item.kline ? 'done' : 'partial';
    item.err = item.kline ? null : '历史 K 线获取失败，趋势与风险评分未计入';
    return item;
  })().then(r => {
    item.pending = null;
    scheduleRender();
    return r;
  }).catch(e => {
    item.status = 'error';
    item.err = e.message || '数据获取失败';
    item.pending = null;
    scheduleRender();
    return item;
  });
  return item.pending;
}

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
}

/* ---------- 列表 ---------- */
function matchFilters(it) {
  const q = it.quote;
  if (state.filters.kw) {
    const kw = state.filters.kw;
    const hit = q.name.toLowerCase().includes(kw) || q.code.includes(kw) || (it.py || '').includes(kw);
    if (!hit) return false;
  }
  const f = state.filters;
  const s = it.diag && it.diag.stats;

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

  const visible = sortItems(state.items.filter(matchFilters));
  const hasFilter = !!(state.filters.kw || state.filters.strategy || state.filters.risk || state.filters.focus);
  const doneCount = state.items.filter(i => i.status === 'done' || i.status === 'partial' || i.status === 'error').length;
  const strain = state.total - doneCount;
  const partialCount = state.items.filter(i => i.status === 'partial').length;

  $('status-text').innerHTML = `实时行情 · 已体检 <b>${doneCount}/${state.total}</b>${strain > 0 ? ' · 后台还在算' : ''}${partialCount ? ` · <b>${partialCount}</b> 只缺历史K线` : ''}`;
  $('status-right').textContent = state.filters.kw ? `命中 ${visible.length} 只` : '';

  if (!visible.length) {
    list.innerHTML = `<div class="empty">${hasFilter ? '当前条件下没有匹配的股票' : '暂无数据'}${strain > 0 ? '<br>体检还没做完，等几秒再试' : ''}</div>`;
    return;
  }
  list.innerHTML = visible.map(cardHTML).join('');
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
    tags.push(tagOf('mid', '体检中…'));
  }

  const score = d && d.total !== null
    ? `<span class="si-score" style="color:${scoreColor(d.total)}">${d.total}<small>分</small></span>`
    : `<span class="si-score pending">${it.status === 'error' ? '暂无' : '计算中'}</span>`;

  return `<div class="stock-item" onclick="App.openDetail('${q.secid}')">
    <div class="si-top">
      <div class="si-left">
        <span class="si-name">${esc(q.name)}</span>
        <span class="si-code">${q.code}</span>
        <span class="si-ind">${esc(q.industry)}</span>
      </div>
      <div class="si-right">
        <div class="si-price">${f2(q.price)}</div>
        <div class="si-pct ${cls(q.pct)}">${fpct(q.pct)}</div>
      </div>
    </div>
    <div class="si-meta">
      <span>综合 ${score}</span>
      <span>PE <b>${q.pe === null ? '—' : q.pe <= 0 ? '亏损' : f1(q.pe)}</b></span>
      <span>PB <b>${f1(q.pb)}</b></span>
      <span>市值 <b>${fcap(q.mktcap)}</b></span>
    </div>
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
  renderDetail(item);
}

function goHome() {
  state.current = null;
  if (state.chart) { state.chart.dispose(); state.chart = null; }
  switchView('home');
  renderList();
}

function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $(name + '-view').classList.add('active');
  window.scrollTo(0, 0);
}

function rankOf(it) {
  const scored = state.items.filter(i => i.diag && i.diag.total !== null).sort((a, b) => b.diag.total - a.diag.total);
  const idx = scored.indexOf(it);
  if (idx < 0) return '';
  return `样本池第 ${idx + 1}/${scored.length} 名`;
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
  if (t === null) return { icon: '🌤', text: '换手率数据缺失。' };
  if (t >= 8) return { icon: '🔥', text: `当前热度：非常拥挤。换手率 ${f2(t)}%，今天换手极快，短线资金进进出出，追高风险大。` };
  if (t >= 4) return { icon: '☀️', text: `当前热度：偏热。换手率 ${f2(t)}%，交易活跃度在中上水平。` };
  if (t >= 1.5) return { icon: '🌤', text: `当前热度：正常。换手率 ${f2(t)}%，没有明显的抢筹或抛售。` };
  return { icon: '❄️', text: `当前热度：冷门。换手率只有 ${f2(t)}%，买卖清淡，没什么人挤在这里。` };
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
    note = `赔率 ${odds.toFixed(1)}：向下约 ${Math.abs(down).toFixed(0)}%，向上约 ${up.toFixed(0)}%，上涨空间明显大于下跌空间。但赔率好不等于马上涨，支撑位是否有效才是关键。`;
  } else if (odds >= 1.2) {
    note = `赔率 ${odds.toFixed(1)}：方向大致对称，属于「赔率一般、靠选中好公司赚钱」的类型。`;
  } else {
    note = `赔率 ${odds.toFixed(1)}：向上空间已经不多，价格更接近一年高位，等回调再买会更划算。`;
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

function renderDetail(it) {
  const q = it.quote, d = it.diag, s = d && d.stats, fin = it.fin;
  const heat = heatOf(q);
  const adv = adviceOf(it);
  const odds = oddsOf(it);
  const def = defenseOf(it);

  const finNote = fin
    ? `财报口径：${esc(fin.report)}${fin.notice ? ' · 披露于 ' + esc(fin.notice) : ''}`
    : '财报数据暂不可用（接口超时或该股暂无数据）';

  const baseItems = fin ? `
    <div class="kv"><div class="kv-label"><span class="term" data-term="roe">ROE</span></div><div class="kv-val">${fin.roe === null ? '—' : f1(fin.roe) + '%'}</div><div class="kv-desc">股东每投 100 元，一年赚回多少</div></div>
    ${d.financial
      ? `<div class="kv"><div class="kv-label"><span class="term" data-term="eps">每股收益</span></div><div class="kv-val">${fin.eps === null ? '—' : f2(fin.eps) + ' 元'}</div><div class="kv-desc">每一股背后摊到的净利润</div></div>`
      : `<div class="kv"><div class="kv-label"><span class="term" data-term="margin">毛利率</span></div><div class="kv-val">${fin.grossMargin === null ? '—' : f1(fin.grossMargin) + '%'}</div><div class="kv-desc">卖 100 元的货，扣掉直接成本还剩多少</div></div>`}
    <div class="kv"><div class="kv-label"><span class="term" data-term="${d.financial ? 'netmargin' : 'debt'}">${d.financial ? '净利率' : '资产负债率'}</span></div><div class="kv-val">${d.financial ? (fin.netMargin === null ? '—' : f1(fin.netMargin) + '%') : (fin.debtRatio === null ? '—' : f1(fin.debtRatio) + '%')}</div><div class="kv-desc">${d.financial ? '每 100 元收入最后净剩下多少' : '负债占全部资产的比例，越低越安全'}</div></div>
    <div class="kv"><div class="kv-label"><span class="term" data-term="cash">每股经营现金流</span></div><div class="kv-val">${fin.cashPerShare === null ? '—' : f2(fin.cashPerShare) + ' 元'}</div><div class="kv-desc">每股背后真实收到的现金，不是账面利润</div></div>
  ` : `<div class="kv" style="grid-column:1/-1"><div class="kv-label">财务数据</div><div class="kv-val" style="font-size:15px">暂不可用</div><div class="kv-desc">接口没有返回这只股票的财报，底子分不参与综合评分</div></div>`;

  const valItems = `
    <div class="kv"><div class="kv-label"><span class="term" data-term="pe">市盈率 PE</span></div><div class="kv-val">${q.pe === null ? '—' : q.pe <= 0 ? '亏损' : f1(q.pe) + ' 倍'}</div><div class="kv-desc">按现在的利润，多少年能赚回买入成本</div></div>
    <div class="kv"><div class="kv-label"><span class="term" data-term="pb">市净率 PB</span></div><div class="kv-val">${f1(q.pb)}</div><div class="kv-desc">股价相对于每股净资产的倍数</div></div>
    <div class="kv"><div class="kv-label"><span class="term" data-term="pos">价格分位</span></div><div class="kv-val">${s ? s.pos.toFixed(0) + '%' : '—'}</div><div class="kv-desc">在近一年最低到最高之间的位置</div></div>
    <div class="kv"><div class="kv-label"><span class="term" data-term="cap">总市值</span></div><div class="kv-val">${fcap(q.mktcap)}</div><div class="kv-desc">市场给这家公司的总报价</div></div>
  `;

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
        <div class="d-sub">${q.code} · ${esc(q.industry)}</div>
      </div>
      <div class="d-score" style="background:${scoreColor(d.total)}">${d.total === null ? '—' : d.total}<small>分</small></div>
    </div>

    <div class="d-pricebar">
      <span>现价 <span class="big">${f2(q.price)}</span></span>
      <span class="pct ${cls(q.pct)}">${fpct(q.pct)}</span>
      <span>PE ${q.pe === null ? '—' : q.pe <= 0 ? '亏损' : f1(q.pe)}</span>
      <span>PB ${f1(q.pb)}</span>
      <span>市值 ${fcap(q.mktcap)}</span>
      <span class="anchor">${rankOf(it) || '样本池内排名'}</span>
    </div>

    <div class="verdict">${verdictOf(it)}</div>
  </div>

  <div class="card">
    <div class="section-title"><span class="st-name">💡 操作建议</span></div>
    <div class="heat"><span>${heat.icon}</span><span>${heat.text}</span></div>
    <div class="advice-body" style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:16px">${adv.main}</div>
    <div class="advice-block">
      <div class="advice-sub">⏳ 分批节奏</div>
      <div class="advice-body">${adv.batch}</div>
    </div>
    <div class="advice-block">
      <div class="advice-sub">👤 适合人群</div>
      <div class="advice-body">${adv.who}</div>
    </div>
    <div class="advice-block">
      <div class="advice-sub">🛡️ 跟踪防线</div>
      ${def.map((t, i) => `<div class="bullet"><span class="dot ${i === 0 ? 'g' : i === 1 ? 'r' : 'b'}"></span><span>${t}</span></div>`).join('')}
    </div>
  </div>

  <div class="card">
    <div class="section-title">
      <span class="st-name">⚖️ 盈亏空间测算</span>
      <span class="st-concl">${odds ? (odds.odds === null ? '贴着地板' : `赔率 ${odds.odds.toFixed(1)}`) : '—'}</span>
    </div>
    <div class="odds-head">
      <span class="lo">向下的地板：${odds ? f2(odds.low) + ' 元（' + odds.lowDate.slice(5) + '）' : '—'}</span>
      <span class="hi">向上的天花板：${odds ? f2(odds.high) + ' 元（' + odds.highDate.slice(5) + '）' : '—'}</span>
    </div>
    <div class="odds">
      <div class="odds-down"><div class="odds-label">如果跌到地板，还要亏</div><div class="odds-val">${odds ? odds.down.toFixed(0) + '%' : '—'}</div></div>
      <div class="odds-up"><div class="odds-label">如果涨到天花板，能赚</div><div class="odds-val">${odds ? '+' + odds.up.toFixed(0) + '%' : '—'}</div></div>
    </div>
    <div class="odds-note">${odds ? odds.note : '缺少历史 K 线，算不出空间。'}</div>
  </div>

  <div class="card">
    <div class="section-title">
      <span class="st-name">公司底子</span>
      <span class="st-concl">${baseConcl(d)}</span>
      <span class="st-score">${d.base === null ? '—' : d.base + '/100'}</span>
    </div>
    <div class="bar green"><i style="width:${d.base === null ? 0 : d.base}%"></i></div>
    <div class="kv-grid">${baseItems}</div>
    <div class="st-note">${finNote}${d.financial ? ' · 金融业不评资产负债率' : ''}</div>
  </div>

  <div class="card">
    <div class="section-title">
      <span class="st-name">估值水平</span>
      <span class="st-concl">${valConcl(d)}</span>
      <span class="st-score">${d.val === null ? '—' : d.val + '/100'}</span>
    </div>
    <div class="bar orange"><i style="width:${d.val === null ? 0 : d.val}%"></i></div>
    <div class="kv-grid">${valItems}</div>
    <div class="st-note">PE 取的是滚动市盈率（TTM），亏损公司按「亏损」显示、不参与打高分。</div>
  </div>

  <div class="card">
    <div class="section-title">
      <span class="st-name">近期趋势</span>
      <span class="st-concl">${trendConcl(it)}</span>
      <span class="st-score">${d.trend === null ? '—' : d.trend + '/100'}</span>
    </div>
    <div class="bar blue"><i style="width:${d.trend === null ? 0 : d.trend}%"></i></div>
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
    <div class="section-title">
      <span class="st-name">最新财报</span>
      <span class="st-concl">${fin ? esc(fin.report) : '暂无'}</span>
    </div>
    <div class="report-list">${reportRows}</div>
    <div class="st-note">数据来自上市公司定期报告，按最近已披露的报告期展示。</div>
  </div>

  <div class="disclaimer">
    行情、历史 K 线来自东方财富公开接口，财务数据来自上市公司定期报告。<br>
    <b>以上全部是客观数据整理，不构成任何投资建议。</b><br>
    历史数据不代表未来，股市有风险，投资需谨慎。
  </div>`;

  renderChart(state.range);
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
    box.textContent = '图表库加载失败，请刷新页面';
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
      backgroundColor: '#fff',
      borderColor: '#EFECE6',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: '#2C2B29', fontSize: 12 },
      extraCssText: 'box-shadow:0 4px 16px rgba(60,55,50,.12);border-radius:8px;',
      formatter: params => {
        const d0 = params[0];
        let html = `<div style="font-size:12px;color:#8A8581;margin-bottom:6px">${d0.axisValue}</div>`;
        params.forEach(p => {
          if (p.value === null || p.value === undefined) return;
          html += `<div style="display:flex;justify-content:space-between;gap:14px;line-height:1.7">
            <span>${p.marker}${p.seriesName}</span><b>${Number(p.value).toFixed(2)}</b></div>`;
        });
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
        showSymbol: false, lineStyle: { color: '#7B8F9D', width: 2.5 },
        itemStyle: { color: '#7B8F9D' },
        areaStyle: { color: 'rgba(123,143,157,0.10)' },
        z: 3
      },
      {
        name: '20日均线', type: 'line', data: maPart, smooth: true, symbol: 'none',
        lineStyle: { color: '#B89A7D', width: 1.4, type: 'solid' }, z: 2
      },
      {
        name: '沪深300', type: 'line', data: idxPart, smooth: true, symbol: 'none',
        lineStyle: { color: '#A6A29D', width: 1.3, type: 'dashed' }, z: 1
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
  odds: ['赔率', '向上空间和向下空间的比例。赔率 3 倍意味着潜在涨幅是潜在跌幅的 3 倍。', '向下最多亏 10%、向上可能赚 30%，赔率就是 3。']
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

window.App = { openDetail, goHome, setRange, toggleDw, pick };

init();

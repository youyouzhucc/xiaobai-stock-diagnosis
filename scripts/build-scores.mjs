/* 每日综合分快照
 * 由 GitHub Actions 定时触发（北京时间每天 12:05），抓真实行情 / K 线 / 财报后
 * 用页面同一套评分模型（js/score.js）算一遍，输出 data/scores.json。
 * 页面直接读这份快照，全天不再逐只现算。
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const QUOTE = 'https://push2.eastmoney.com/api/qt/ulist.np/get';
const KLINE = 'https://push2his.eastmoney.com/api/qt/stock/kline/get';
const FIN = 'https://datacenter-web.eastmoney.com/api/data/v1/get';
const BONUS = 'https://datacenter-web.eastmoney.com/api/data/v1/get';

const num = v => (typeof v === 'number' && !Number.isNaN(v)) ? v : null;
const d2 = v => { const n = num(v); return n === null ? null : n / 100; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getJSON(url, timeout = 16000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/* 评分模型与精选池都从页面代码里读，避免两套逻辑漂移 */
const Score = new Function(read('js/score.js') + '\nreturn Score;')();
const appSrc = read('js/app.js');
const m = appSrc.match(/const POOL = (\[[\s\S]*?\n\]);/);
if (!m) throw new Error('js/app.js 里没找到 POOL 定义');
const POOL = new Function('return ' + m[1])();
if (!POOL.length) throw new Error('POOL 为空');

async function quotes(secids) {
  const fields = 'f2,f3,f4,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f23,f100';
  const url = `${QUOTE}?secids=${secids.join(',')}&fields=${fields}`;
  const json = await getJSON(url, 20000);
  const diff = (json && json.data && json.data.diff) || [];
  return diff.map(d => ({
    secid: `${d.f13}.${d.f12}`,
    code: String(d.f12),
    name: d.f14,
    price: d2(d.f2),
    pct: d2(d.f3),
    turnover: d2(d.f8),
    volratio: d2(d.f10),
    pe: d2(d.f9),
    pb: d2(d.f23),
    mktcap: num(d.f20),
    industry: d.f100 || '—'
  })).filter(x => x.price !== null);
}

async function kline(secid) {
  const url = `${KLINE}?secid=${secid}&klt=101&fqt=1&lmt=250&end=20500101` +
    '&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58';
  for (let i = 0; i < 3; i++) {
    try {
      const json = await getJSON(url, 15000);
      const rows = json && json.data && json.data.klines;
      if (!rows || !rows.length) throw new Error('K 线空');
      return rows.map(s => {
        const p = s.split(',');
        return { date: p[0], open: +p[1], close: +p[2], high: +p[3], low: +p[4], volume: +p[5] };
      }).filter(k => Number.isFinite(k.close) && k.close > 0);
    } catch (e) {
      if (i === 2) throw e;
      await sleep(600 * (i + 1));
    }
  }
}

async function financials(secid) {
  const [mk, code] = secid.split('.');
  const suffix = mk === '1' ? 'SH' : 'SZ';
  const filter = encodeURIComponent(`(SECUCODE="${code}.${suffix}")`);
  const url = `${FIN}?reportName=RPT_F10_FINANCE_MAINFINADATA&columns=ALL` +
    `&filter=${filter}&pageNumber=1&pageSize=1&sortTypes=-1&sortColumns=REPORT_DATE` +
    '&source=HSF10&client=PC';
  const json = await getJSON(url, 16000);
  const row = json && json.result && json.result.data && json.result.data[0];
  if (!row) throw new Error('暂无财务数据');
  return {
    report: row.REPORT_DATE_NAME || '',
    notice: (row.NOTICE_DATE || '').slice(0, 10),
    roe: num(row.ROEJQ),
    debtRatio: num(row.ZCFZL),
    grossMargin: num(row.XSMLL),
    netMargin: num(row.XSJLL),
    cashPerShare: num(row.MGJYXJJE),
    eps: num(row.EPSJB),
    bps: num(row.BPS),
    revenue: num(row.TOTALOPERATEREVE),
    revenueYoY: num(row.TOTALOPERATEREVETZ),
    netProfit: num(row.PARENTNETPROFIT),
    netProfitYoY: num(row.PARENTNETPROFITTZ)
  };
}

async function dividend(secid, price) {
  const [mk, code] = secid.split('.');
  const suffix = mk === '1' ? 'SH' : 'SZ';
  const filter = encodeURIComponent(`(SECUCODE="${code}.${suffix}")`);
  const url = `${BONUS}?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=${filter}` +
    '&pageNumber=1&pageSize=8&sortTypes=-1&sortColumns=EX_DIVIDEND_DATE&source=HSF10&client=PC';
  try {
    const json = await getJSON(url, 14000);
    const rows = (json && json.result && json.result.data) || [];
    const from = Date.now() - 380 * 864e5;
    let perShare = 0;
    rows.forEach(r => {
      const t = Date.parse(String(r.EX_DIVIDEND_DATE || '').replace(/-/g, '/'));
      if (!Number.isFinite(t) || t < from) return;
      const per10 = num(r.PRETAX_BONUS_RMB);
      if (!per10 || per10 <= 0) return;
      perShare += per10 / 10;
    });
    return {
      dps: +perShare.toFixed(3),
      yieldPct: (price && price > 0 && perShare > 0) ? +(perShare / price * 100).toFixed(2) : null
    };
  } catch (e) {
    return { dps: 0, yieldPct: null, err: true };
  }
}

const quoteList = await quotes(POOL.map(p => p.secid));
console.log(`行情到手 ${quoteList.length} 只`);
const bySecid = Object.create(null);
quoteList.forEach(q => { bySecid[q.secid] = q; });

const items = {};
const jobs = [];
for (const p of POOL) {
  jobs.push(async () => {
    const q = bySecid[p.secid];
    if (!q) { console.warn(`跳过 ${p.secid}：没有行情`); return; }
    const [kl, fin, dv] = await Promise.allSettled([
      kline(p.secid),
      financials(p.secid),
      dividend(p.secid, q.price)
    ]);
    const klines = kl.status === 'fulfilled' ? kl.value : null;
    const finv = fin.status === 'fulfilled' ? fin.value : null;
    const divv = dv.status === 'fulfilled' ? dv.value : null;
    if (!klines && !finv) { console.warn(`跳过 ${q.code}：K 线与财报都拿不到`); return; }

    const stats = Score.statsOf(klines);
    const diag = Score.score({ quote: q, fin: finv, stats });
    items[q.code] = {
      name: q.name,
      total: diag.total,
      base: diag.base,
      val: diag.val,
      trend: diag.trend,
      risk: diag.risk,
      weights: diag.weights,
      financial: diag.financial,
      keys: diag.keys,
      stats: stats ? {
        pos: +stats.pos.toFixed(1),
        last: stats.last,
        ma20: +stats.ma20.toFixed(2),
        ma60: +stats.ma60.toFixed(2),
        high: stats.high,
        low: stats.low,
        highDate: stats.highDate,
        lowDate: stats.lowDate,
        count: stats.count,
        ret20: stats.ret20 === null ? null : +stats.ret20.toFixed(1),
        ret60: stats.ret60 === null ? null : +stats.ret60.toFixed(1),
        vol: +stats.vol.toFixed(1),
        mdd: +stats.mdd.toFixed(1)
      } : null,
      dividendYield: divv && divv.yieldPct !== null ? divv.yieldPct : null
    };
    console.log(`  ${q.code} ${q.name} → ${diag.total} 分`);
  });
}

const CONCURRENCY = 4;
const queue = jobs.slice();
const worker = async () => {
  while (queue.length) {
    const job = queue.shift();
    await job();
    await sleep(180);
  }
};
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const now = new Date();
const beijing = new Date(now.getTime() + 8 * 3600e3);
const dateStr = beijing.toISOString().slice(0, 10);
const timeStr = beijing.toISOString().slice(11, 16);
const payload = {
  date: dateStr,
  generatedAt: `${dateStr} ${timeStr}`,
  count: Object.keys(items).length,
  items
};

const dir = path.join(ROOT, 'data');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'scores.json'), JSON.stringify(payload, null, 2), 'utf8');
console.log(`写入 data/scores.json：${payload.count} 只，${payload.generatedAt}`);

/* ---------- 全市场估值排名（PE + PB 综合） ---------- */
const CLIST = 'https://push2.eastmoney.com/api/qt/clist/get';
const FS_ALL = 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23';

async function listPage(pn) {
  const url = `${CLIST}?pn=${pn}&pz=100&po=0&np=1&ut=bd1d9ddb040897cfd9463debb285354` +
    `&fltt=2&invt=2&fid=f12&fs=${encodeURIComponent(FS_ALL)}&fields=f2,f3,f8,f9,f10,f12,f14,f20,f23,f24,f100`;
  const j = await getJSON(url, 16000);
  const d = (j && j.data) || {};
  return { rows: Array.isArray(d.diff) ? d.diff : Object.values(d.diff || {}), total: d.total || 0 };
}

const firstPage = await listPage(1);
const pageCount = Math.max(1, Math.ceil(firstPage.total / 100));
console.log(`全市场 ${firstPage.total} 只 / ${pageCount} 页`);

const allRows = firstPage.rows.slice();
const pageQueue = [];
for (let pn = 2; pn <= pageCount; pn++) pageQueue.push(pn);
const pageWorker = async () => {
  while (pageQueue.length) {
    const pn = pageQueue.shift();
    try {
      const r = await listPage(pn);
      allRows.push(...r.rows);
    } catch (e) { console.warn(`第 ${pn} 页失败：${e.message}`); }
    await sleep(60);
  }
};
await Promise.all([pageWorker(), pageWorker(), pageWorker(), pageWorker()]);

const valid = allRows.filter(r =>
  typeof r.f9 === 'number' && r.f9 > 0 &&
  typeof r.f23 === 'number' && r.f23 > 0
);
valid.sort((a, b) => a.f9 - b.f9);
const pePos = new Map();
valid.forEach((r, i) => pePos.set(String(r.f12), i));

const byPb = valid.slice().sort((a, b) => a.f23 - b.f23);
const pbPos = new Map();
byPb.forEach((r, i) => pbPos.set(String(r.f12), i));

const mix = r => pePos.get(String(r.f12)) + pbPos.get(String(r.f12));
const ordered = valid.slice().sort((a, b) => mix(a) - mix(b));

const rankMap = {};
ordered.forEach((r, i) => { rankMap[String(r.f12)] = i + 1; });

const rankPayload = { date: dateStr, generatedAt: `${dateStr} ${timeStr}`, n: ordered.length, ranks: rankMap };
fs.writeFileSync(path.join(dir, 'ranks.json'), JSON.stringify(rankPayload), 'utf8');
console.log(`写入 data/ranks.json：${ordered.length} 只有效估值排名（共抓 ${allRows.length} 条）`);

/* ---------- 首页主题榜单：每天算一次，每个主题取前 3 只 ----------
 * 口径与全市场页的 THEMES 一致，数据同源，不会出现两边数字打架。
 * 只做「能一句话讲明白、且接口原生字段就够用」的主题。
 */
const isNum = v => typeof v === 'number' && Number.isFinite(v);
// 净筛：退市股、ST、停牌、价格无效的一律不进榜 —— 它们的极端涨跌是制度原因，对新手是误导
const tradable = r => {
  const name = String(r.f14 || '');
  if (/退|ST/i.test(name)) return false;
  if (!isNum(r.f2) || r.f2 <= 0) return false;
  if ((r.f8 === 0 || r.f8 === null) && (r.f3 === 0 || r.f3 === null)) return false;
  return true;
};

const pick = r => ({
  code: String(r.f12),
  name: String(r.f14 || ''),
  ind: String(r.f100 || '—').replace(/[ⅠⅡⅢ]+/g, ''),
  price: isNum(r.f2) ? r.f2 : null,
  pct: isNum(r.f3) ? r.f3 : null,
  pe: isNum(r.f9) ? r.f9 : null,
  pb: isNum(r.f23) ? r.f23 : null,
  cap: isNum(r.f20) ? Math.round(r.f20 / 1e8) : null,   // 单位：亿
  d60: isNum(r.f24) ? r.f24 : null,
  vr: isNum(r.f10) ? r.f10 : null,
  turn: isNum(r.f8) ? r.f8 : null
});

const pool = allRows.filter(tradable);
const byPe = (a, b) => a.f9 - b.f9;   // 注意：clist 行对象里市盈率字段叫 f9，不是 pe
const themes = [
  { id: 'cheap', title: '估值最便宜', note: '市盈率最低的一批', warn: '便宜不等于好，也可能这门生意在走下坡',
    rows: pool.filter(r => isNum(r.f9) && r.f9 >= 1).sort(byPe) },
  { id: 'bluechip', title: '便宜的大块头', note: '市值过千亿、市盈率 20 倍以内', warn: '大公司波动小适合当底仓，但涨起来也慢',
    rows: pool.filter(r => isNum(r.f20) && r.f20 >= 1e11 && isNum(r.f9) && r.f9 >= 1 && r.f9 <= 20).sort(byPe) },
  { id: 'drop60', title: '近两月跌最狠', note: '两个月跌超两成，排在最前', warn: '跌得多不等于会反弹，先看清是行业问题还是自身问题',
    rows: pool.filter(r => isNum(r.f24) && r.f24 <= -20).sort((a, b) => a.f24 - b.f24) },
  { id: 'rise60', title: '近两月涨最猛', note: '两个月涨超两成，排在最前', warn: '涨得猛可能是情绪推的，追之前先看估值',
    rows: pool.filter(r => isNum(r.f24) && r.f24 >= 20).sort((a, b) => b.f24 - a.f24) },
  { id: 'volume', title: '突然放量', note: '量比 2 以上，今天比平时活跃', warn: '放量可能是消息，也可能是资金异动，方向不一定',
    rows: pool.filter(r => isNum(r.f10) && r.f10 >= 2).sort((a, b) => b.f10 - a.f10) },
  { id: 'cold', title: '没什么人搭理', note: '换手率不到 1%，买卖很清淡', warn: '想买容易、想卖可能没人接，短线尤其要当心',
    rows: pool.filter(r => isNum(r.f8) && r.f8 < 1 && isNum(r.f9) && r.f9 >= 1).sort((a, b) => a.f8 - b.f8) }
];

const boards = themes.map(t => ({
  id: t.id, title: t.title, note: t.note, warn: t.warn,
  count: t.rows.length,
  stocks: t.rows.slice(0, 3).map(pick)
}));

const boardPayload = {
  date: dateStr,
  generatedAt: `${dateStr} ${timeStr}`,
  total: allRows.length,
  tradable: pool.length,
  boards
};
fs.writeFileSync(path.join(dir, 'boards.json'), JSON.stringify(boardPayload, null, 2), 'utf8');
console.log('写入 data/boards.json：' + boards.map(b => `${b.title}(${b.count})`).join(' / '));

/* ---------- 新股排期 data/ipo.json ----------
 * 来源：东方财富「新股申购」报表 RPTA_APP_IPOAPPLY（交易所公布的排期，不是传闻）。
 * 页面为小白解释：哪只还能打新、哪只快上市、最近上市的首日表现。
 */
const LISTING_DAYS = 20;   // 最近上市看 20 天
const FUTURE_DAYS = 30;    // 待申购 / 待上市看 30 天

function ymd(v) {
  return v ? String(v).slice(0, 10) : '';
}
function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

/* 板块口径：接口里的 MARKET_TYPE_NEW / TRADE_MARKET */
function ipoBoard(row) {
  const mk = String(row.MARKET_TYPE_NEW || row.TRADE_MARKET || '');
  if (/科创/.test(mk)) return 'star';
  if (/创业板/.test(mk)) return 'gem';
  if (/北交/.test(mk)) return 'bse';
  if (/沪|上海/.test(mk)) return 'sh';
  if (/深|深圳/.test(mk)) return 'sz';
  return 'other';
}

async function buildIpo() {
  const url = 'https://datacenter-web.eastmoney.com/api/data/v1/get'
    + '?reportName=RPTA_APP_IPOAPPLY&columns=ALL&pageSize=120&pageNumber=1'
    + '&sortColumns=APPLY_DATE&sortTypes=-1&source=WEB&client=WEB';
  const j = await getJSON(url);
  const rows = (j && j.result && j.result.data) || [];
  if (!rows.length) throw new Error('新股接口没有返回数据');

  const today = dateStr;
  const upcoming = [];   // 申购日还没到，或已申购等上市
  const recent = [];     // 最近上市

  for (const r of rows) {
    const name = String(r.SECURITY_NAME_ABBR || r.SECURITY_NAME || '').trim();
    if (!name) continue;
    const applyDate = ymd(r.APPLY_DATE);
    const listDate = ymd(r.LISTING_DATE);
    const item = {
      code: String(r.SECURITY_CODE || ''),
      name,
      board: ipoBoard(r),
      market: String(r.MARKET_TYPE_NEW || r.TRADE_MARKET || ''),
      price: num(r.ISSUE_PRICE),
      pe: num(r.AFTER_ISSUE_PE),
      applyDate,
      listDate,
      ballotDate: ymd(r.BALLOT_NUM_DATE),
      lots: num(r.ONLINE_ISSUE_NUM)
    };

    // 还没上市，且申购日在未来 30 天或刚过去（等上市）
    if (!listDate && applyDate && daysBetween(today, applyDate) <= FUTURE_DAYS && daysBetween(today, applyDate) >= -45) {
      upcoming.push(item);
    } else if (listDate && daysBetween(listDate, today) >= 0 && daysBetween(listDate, today) <= LISTING_DAYS) {
      recent.push(item);
    }
  }

  const sortByDate = (a, b) => (b.applyDate > a.applyDate ? 1 : -1);
  upcoming.sort(sortByDate);
  recent.sort((a, b) => (b.listDate > a.listDate ? 1 : -1));

  const payload = {
    date: dateStr,
    generatedAt: `${dateStr} ${timeStr}`,
    source: '东方财富新股申购报表（交易所公布排期）',
    upcoming: upcoming.slice(0, 8),
    recent: recent.slice(0, 8)
  };
  fs.writeFileSync(path.join(dir, 'ipo.json'), JSON.stringify(payload, null, 2), 'utf8');
  console.log('写入 data/ipo.json：待申购/待上市 ' + payload.upcoming.length + ' 只，最近上市 ' + payload.recent.length + ' 只');
}

try {
  await buildIpo();
} catch (e) {
  console.log('新股排期生成失败（不影响其他文件）：' + e.message);
}

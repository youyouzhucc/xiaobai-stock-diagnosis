/* 数据获取层
 * 行情 / 财务 / 历史 K 线：东方财富公开接口（均支持跨域）
 */
const API = (() => {
  const QUOTE = 'https://push2.eastmoney.com/api/qt/ulist.np/get';
  const KLINE = 'https://push2his.eastmoney.com/api/qt/stock/kline/get';
  const FIN = 'https://datacenter-web.eastmoney.com/api/data/v1/get';
  const BONUS = 'https://datacenter-web.eastmoney.com/api/data/v1/get';

  const cache = new Map();

  async function getJSON(url, timeout = 11000) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout);
    try {
      const res = await fetch(url, { signal: ctl.signal, cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  const num = v => (typeof v === 'number' && !Number.isNaN(v)) ? v : null;
  const d2 = v => { const n = num(v); return n === null ? null : n / 100; };

  /* 1. 批量行情 */
  async function quotes(secids) {
    const key = 'q:' + secids.join(',');
    if (cache.has(key)) return cache.get(key);
    const fields = 'f2,f3,f4,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f23,f100';
    const url = `${QUOTE}?secids=${secids.join(',')}&fields=${fields}&_=${Date.now()}`;
    const json = await getJSON(url);
    const diff = json && json.data && json.data.diff;
    if (!diff) throw new Error('行情数据为空');
    const list = diff.map(d => ({
      secid: `${d.f13}.${d.f12}`,
      code: String(d.f12),
      name: d.f14,
      market: d.f13,
      price: d2(d.f2),
      pct: d2(d.f3),
      change: d2(d.f4),
      high: d2(d.f15),
      low: d2(d.f16),
      open: d2(d.f17),
      prevClose: d2(d.f18),
      turnover: d2(d.f8),
      volratio: d2(d.f10),
      pe: d2(d.f9),
      pb: d2(d.f23),
      mktcap: num(d.f20),
      floatcap: num(d.f21),
      industry: d.f100 || '—'
    })).filter(x => x.price !== null);
    cache.set(key, list);
    return list;
  }

  /* 2. 历史 K 线（日线，前复权） */
  const resolveSecid = secid => secid === 'INDEX' ? '1.000300' : secid;

  async function kline(secid, days = 250) {
    const key = `k:${secid}`;
    if (cache.has(key)) return cache.get(key);
    const id = resolveSecid(secid);
    const url = `${KLINE}?secid=${id}&klt=101&fqt=1&lmt=${days}&end=20500101` +
      `&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58&_=${Date.now()}`;

    let lastErr = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const json = await getJSON(url, 12000);
        const rows = json && json.data && json.data.klines;
        if (!rows || !rows.length) throw new Error('K 线数据为空');
        const list = rows.map(s => {
          const p = s.split(',');
          return {
            date: p[0],
            open: +p[1],
            close: +p[2],
            high: +p[3],
            low: +p[4],
            volume: +p[5]
          };
        }).filter(k => Number.isFinite(k.close) && k.close > 0);
        cache.set(key, list);
        return list;
      } catch (e) {
        lastErr = e;
        await sleep(500 * (attempt + 1));
      }
    }
    throw lastErr || new Error('K 线获取失败');
  }

  /* 3. 最新财报主要指标 */
  async function financials(secid) {
    const key = `f:${secid}`;
    if (cache.has(key)) return cache.get(key);
    const [m, code] = secid.split('.');
    const suffix = m === '1' ? 'SH' : 'SZ';
    const filter = encodeURIComponent(`(SECUCODE="${code}.${suffix}")`);
    const url = `${FIN}?reportName=RPT_F10_FINANCE_MAINFINADATA&columns=ALL` +
      `&filter=${filter}&pageNumber=1&pageSize=1&sortTypes=-1&sortColumns=REPORT_DATE` +
      `&source=HSF10&client=PC&_=${Date.now()}`;
    const json = await getJSON(url, 14000);
    const row = json && json.result && json.result.data && json.result.data[0];
    if (!row) throw new Error('暂无财务数据');
    const out = {
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
    cache.set(key, out);
    return out;
  }

  /* 4. 近 12 个月现金分红 → 股息率 */
  async function dividend(secid, price) {
    const key = `dv:${secid}`;
    if (cache.has(key)) return cache.get(key);
    const [m, code] = secid.split('.');
    const suffix = m === '1' ? 'SH' : 'SZ';
    const filter = encodeURIComponent(`(SECUCODE="${code}.${suffix}")`);
    const url = `${BONUS}?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=${filter}` +
      `&pageNumber=1&pageSize=8&sortTypes=-1&sortColumns=EX_DIVIDEND_DATE` +
      `&source=HSF10&client=PC&_=${Date.now()}`;
    try {
      const json = await getJSON(url, 12000);
      const rows = (json && json.result && json.result.data) || [];
      const from = Date.now() - 380 * 864e5;
      let perShare = 0, count = 0, lastDate = '';
      rows.forEach(r => {
        const t = Date.parse(String(r.EX_DIVIDEND_DATE || '').replace(/-/g, '/'));
        if (!Number.isFinite(t) || t < from) return;
        const per10 = num(r.PRETAX_BONUS_RMB);
        if (!per10 || per10 <= 0) return;
        perShare += per10 / 10;
        count++;
        if (!lastDate) lastDate = String(r.EX_DIVIDEND_DATE).slice(0, 10);
      });
      const out = {
        dps: +perShare.toFixed(3),
        count,
        lastDate,
        yieldPct: (price && price > 0 && perShare > 0) ? +(perShare / price * 100).toFixed(2) : null
      };
      cache.set(key, out);
      return out;
    } catch (e) {
      const out = { dps: 0, count: 0, lastDate: '', yieldPct: null, err: true };
      cache.set(key, out);
      return out;
    }
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  return { quotes, kline, financials, dividend, sleep };
})();

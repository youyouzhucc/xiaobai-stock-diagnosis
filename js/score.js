/* 评分模型：全部基于真实行情 / 真实财报 / 真实历史 K 线
 * 权重：底子 40% · 估值 30% · 趋势 20% · 风险 10%
 * 某项数据缺失时自动剔除该模块并重新归一化权重，不做估算填补。
 */
const Score = (() => {
  const clamp = (v, a = 0, b = 100) => Math.min(b, Math.max(a, v));

  /* 分段线性映射：把指标值翻译成 0-100 分 */
  function lerp(v, pts) {
    if (v === null || v === undefined || Number.isNaN(v)) return null;
    if (v <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (v <= pts[i][0]) {
        const [x0, y0] = pts[i - 1];
        const [x1, y1] = pts[i];
        return y0 + (y1 - y0) * (v - x0) / (x1 - x0);
      }
    }
    return pts[pts.length - 1][1];
  }

  const isFinancial = ind => /银行|保险|证券|多元金融|信托|期货/.test(ind || '');

  /* 从 K 线里算出所有可用的真实统计量 */
  function statsOf(kl) {
    if (!kl || kl.length < 40) return null;
    const closes = kl.map(k => k.close);
    const last = closes[closes.length - 1];
    const avg = n => {
      const s = closes.slice(-n);
      return s.reduce((a, b) => a + b, 0) / s.length;
    };

    const win = kl.slice(-250);
    let hi = -Infinity, lo = Infinity, hiDate = '', loDate = '';
    win.forEach(k => {
      if (k.high > hi) { hi = k.high; hiDate = k.date; }
      if (k.low < lo) { lo = k.low; loDate = k.date; }
    });

    const ret20 = closes.length > 21 ? (last / closes[closes.length - 21] - 1) * 100 : null;
    const ret60 = closes.length > 61 ? (last / closes[closes.length - 61] - 1) * 100 : null;

    const winRets = [];
    for (let i = Math.max(1, closes.length - 60); i < closes.length; i++) {
      winRets.push(closes[i] / closes[i - 1] - 1);
    }
    const mean = winRets.reduce((a, b) => a + b, 0) / winRets.length;
    const sd = Math.sqrt(winRets.reduce((a, b) => a + (b - mean) * (b - mean), 0) / winRets.length);
    const vol = sd * Math.sqrt(250) * 100;

    let peak = -Infinity, mdd = 0, mddDate = '';
    win.forEach(k => {
      peak = Math.max(peak, k.close);
      const dd = (k.close / peak - 1) * 100;
      if (dd < mdd) { mdd = dd; mddDate = k.date; }
    });

    const pos = hi > lo ? (last - lo) / (hi - lo) * 100 : 50;

    return {
      last,
      ma5: avg(5),
      ma20: avg(20),
      ma60: avg(Math.min(60, closes.length)),
      high: hi, low: lo, highDate: hiDate, lowDate: loDate,
      ret20, ret60,
      vol, mdd, mddDate,
      pos, count: kl.length
    };
  }

  function score({ quote, fin, stats }) {
    const parts = {};
    const keys = {};
    const financial = isFinancial(quote.industry);

    /* ---- 底子：财报真实指标 ---- */
    if (fin) {
      const items = [];
      if (fin.roe !== null) {
        items.push({ k: 'roe', w: .42, v: lerp(fin.roe, [[0, 12], [5, 40], [8, 52], [12, 66], [15, 76], [20, 86], [25, 94], [35, 99]]) });
      }
      if (fin.grossMargin !== null) {
        items.push({ k: 'margin', w: .22, v: lerp(fin.grossMargin, [[5, 22], [12, 38], [20, 52], [30, 64], [45, 78], [60, 88], [80, 96]]) });
      }
      if (fin.debtRatio !== null && !financial) {
        items.push({ k: 'debt', w: .2, v: lerp(fin.debtRatio, [[10, 98], [20, 95], [30, 88], [40, 78], [50, 66], [60, 52], [70, 38], [85, 20]]) });
      }
      if (fin.eps !== null && fin.eps > 0 && fin.cashPerShare !== null) {
        items.push({ k: 'cash', w: .16, v: lerp(fin.cashPerShare / fin.eps, [[0, 15], [0.3, 30], [0.5, 48], [0.8, 66], [1.0, 78], [1.3, 88], [1.8, 96], [2.5, 99]]) });
      }
      if (items.length) {
        const wsum = items.reduce((a, b) => a + b.w, 0);
        parts.base = items.reduce((a, b) => a + b.v * b.w, 0) / wsum;
        keys.base = items.map(i => i.k);
      }
    }

    /* ---- 估值：PE / PB / 近一年价格分位 ---- */
    const valItems = [];
    if (quote.pe !== null) {
      valItems.push({
        k: 'pe', w: .5,
        v: quote.pe <= 0 ? 16 : lerp(quote.pe, [[8, 97], [12, 93], [16, 88], [20, 82], [25, 74], [30, 66], [38, 56], [48, 44], [60, 32], [80, 20], [120, 10]])
      });
    }
    if (quote.pb !== null) {
      valItems.push({ k: 'pb', w: .2, v: quote.pb <= 0 ? 20 : lerp(quote.pb, [[0.6, 98], [1.2, 94], [2, 86], [3, 78], [4.5, 66], [6, 54], [9, 40], [13, 26], [18, 16]]) });
    }
    if (stats) valItems.push({ k: 'pos', w: .3, v: 100 - stats.pos * .72 });
    if (valItems.length) {
      const wsum = valItems.reduce((a, b) => a + b.w, 0);
      parts.val = valItems.reduce((a, b) => a + b.v * b.w, 0) / wsum;
      keys.val = valItems.map(i => i.k);
    }

    /* ---- 趋势：均线关系 + 20/60 日涨跌 + 位置 ---- */
    if (stats) {
      const t1 = stats.last > stats.ma20 ? 82 : 38;
      const t2 = stats.ma20 > stats.ma60 ? 84 : 40;
      const t3 = stats.ret20 === null ? 55 : lerp(stats.ret20, [[-20, 8], [-10, 24], [-4, 42], [0, 56], [4, 68], [10, 80], [20, 90], [35, 96]]);
      const t4 = stats.ret60 === null ? 55 : lerp(stats.ret60, [[-30, 8], [-15, 26], [-6, 44], [0, 56], [12, 72], [25, 86], [45, 95]]);
      const t5 = lerp(stats.pos, [[0, 38], [25, 50], [50, 62], [70, 72], [85, 80], [100, 86]]);
      parts.trend = .28 * t1 + .22 * t2 + .2 * t3 + .16 * t4 + .14 * t5;
      keys.trend = ['ma', 'ret'];
    }

    /* ---- 风险：年化波动率 + 最大回撤 ---- */
    if (stats) {
      const volScore = lerp(stats.vol, [[12, 98], [18, 93], [24, 86], [30, 76], [36, 64], [45, 48], [60, 28], [85, 12]]);
      const ddScore = lerp(Math.abs(stats.mdd), [[5, 98], [12, 92], [20, 82], [30, 68], [45, 48], [60, 30], [80, 14]]);
      parts.risk = .45 * volScore + .55 * ddScore;
      keys.risk = ['vol', 'mdd'];
    }

    const W = { base: .4, val: .3, trend: .2, risk: .1 };
    let sum = 0, wsum = 0;
    Object.keys(W).forEach(k => {
      if (typeof parts[k] === 'number') { sum += parts[k] * W[k]; wsum += W[k]; }
    });
    /* 四项里能用的不到三项就不出总分：缺项重分权重会把某一项的权重摊到别的项上，
       分数会虚高，宁可显示「数据不足」也不给一个看起来精确的数字 */
    const avail = Object.keys(W).filter(k => typeof parts[k] === 'number').length;

    const r = v => (typeof v === 'number' ? Math.round(clamp(v)) : null);
    return {
      total: (avail >= 3 && wsum) ? Math.round(clamp(sum / wsum)) : null,
      base: r(parts.base),
      val: r(parts.val),
      trend: r(parts.trend),
      risk: r(parts.risk),
      stats,
      keys,
      financial,
      weights: wsum ? Object.keys(W).filter(k => typeof parts[k] === 'number').length : 0
    };
  }

  const band = s => {
    if (s === null || s === undefined) return 'none';
    if (s >= 80) return 'good';
    if (s >= 60) return 'ok';
    if (s >= 45) return 'warn';
    return 'bad';
  };

  return { statsOf, score, isFinancial, band, lerp, clamp };
})();

/* ============================================================
   K 线解读：全部是「能被读者拿数据核对」的客观口径，不做涨跌预测。
   build(kl)  -> { days, ma20, ma60, hi60, lo60, last }
   summary(b) -> 顶部一句话
   dayCard(d) -> 点击某根 K 线后的卡片内容
   quick(b)   -> 底部「形态速查」条目
   ============================================================ */
(function () {
  function mean(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : null; }
  function pctv(a, b) { return (!b) ? null : (a - b) / b * 100; }
  function f2(v) { return (v === null || v === undefined || !isFinite(v)) ? '—' : Number(v).toFixed(2); }
  function sgn(v, unit) { return (v >= 0 ? '+' : '') + v.toFixed(2) + (unit || ''); }

  function hand(v) {
    if (v === null || v === undefined || !isFinite(v)) return '—';
    if (v >= 1e8) return (v / 1e8).toFixed(2) + ' 亿手';
    if (v >= 1e4) return (v / 1e4).toFixed(1) + ' 万手';
    return Math.round(v) + ' 手';
  }

  var SHAPES = {
    lshadow: { t: '长下影', tone: 'good' },
    ushadow: { t: '长上影', tone: 'bad' },
    bigup: { t: '放量大阳', tone: 'good' },
    bigdown: { t: '放量大阴', tone: 'bad' },
    doji: { t: '十字星', tone: 'mid' },
    spike: { t: '冲高回落', tone: 'bad' }
  };

  function build(kl) {
    if (!kl || kl.length < 30) return null;
    var n = kl.length, ma20 = [], ma60 = [], i, j, sum;
    for (i = 0; i < n; i++) {
      if (i >= 19) {
        sum = 0; for (j = i - 19; j <= i; j++) sum += kl[j].close;
        ma20.push(+(sum / 20).toFixed(2));
      } else ma20.push(null);
      if (i >= 59) {
        sum = 0; for (j = i - 59; j <= i; j++) sum += kl[j].close;
        ma60.push(+(sum / 60).toFixed(2));
      } else ma60.push(null);
    }

    var win = kl.slice(-Math.min(60, n));
    var hi60 = Math.max.apply(null, win.map(function (k) { return k.high; }));
    var lo60 = Math.min.apply(null, win.map(function (k) { return k.low; }));

    var days = kl.map(function (k, idx) {
      var prev = idx ? kl[idx - 1] : null;
      var range = k.high - k.low;
      var body = Math.abs(k.close - k.open);
      var chg = prev ? pctv(k.close, prev.close) : null;
      var lower = Math.min(k.open, k.close) - k.low;
      var upper = k.high - Math.max(k.open, k.close);
      var v5 = idx >= 5 ? mean(kl.slice(idx - 5, idx).map(function (x) { return x.volume; })) : null;
      var vr = (v5 && v5 > 0) ? k.volume / v5 : null;
      var mg = ma20[idx] ? pctv(k.close, ma20[idx]) : null;
      var seg = function (a) { return range > 0 ? a / range : 0; };

      var shape = null;
      if (range > 0 && body / range <= 0.12) shape = 'doji';
      else if (range > 0 && seg(lower) >= 0.5 && seg(body) <= 0.4) shape = 'lshadow';
      else if (range > 0 && seg(upper) >= 0.5 && seg(body) <= 0.4) shape = 'ushadow';
      if (chg !== null && chg >= 3 && vr !== null && vr >= 1.5) shape = 'bigup';
      if (chg !== null && chg <= -3 && vr !== null && vr >= 1.5) shape = 'bigdown';
      if (chg !== null && chg < 0 && (k.high - k.close) / k.close >= 0.03) shape = 'spike';

      return {
        k: k, i: idx, range: range, body: body,
        chg: chg, lower: lower, upper: upper, vr: vr, mg: mg,
        ma20: ma20[idx], ma60: ma60[idx], shape: shape, seg: seg
      };
    });

    return { days: days, ma20: ma20, ma60: ma60, hi60: hi60, lo60: lo60, last: days[n - 1], n: n };
  }

  /* 单根 K 的客观描述：先数字，再机制，最后一句边界 */
  function readOf(d) {
    var k = d.k, r = d.range || 1;
    var pos = ((k.close - k.low) / r * 100).toFixed(0);
    switch (d.shape) {
      case 'lshadow':
        return '下影线占当日振幅 ' + (d.lower / r * 100).toFixed(0) + '%，最低 ' + f2(k.low) + ' 元被买回到 ' + f2(k.close)
          + ' 元，收盘落在当日区间的 ' + pos + '% 位置。当日盘中下探后回抽，收盘价高于当日成交中枢。单根 K 线只描述这一天。';
      case 'ushadow':
        return '上影线占当日振幅 ' + (d.upper / r * 100).toFixed(0) + '%，最高 ' + f2(k.high) + ' 元回落到 ' + f2(k.close)
          + ' 元，收盘落在当日区间的 ' + pos + '% 位置。当日冲高后回落，收盘价低于当日成交中枢。单根 K 线只描述这一天。';
      case 'bigup':
        return '当日涨 ' + Math.abs(d.chg).toFixed(2) + '%，成交 ' + hand(k.volume) + '，是近 5 日均量的 ' + d.vr.toFixed(2)
          + ' 倍。价格和成交量同时放大，收盘落在当日区间的 ' + pos + '% 位置。';
      case 'bigdown':
        return '当日跌 ' + Math.abs(d.chg).toFixed(2) + '%，成交 ' + hand(k.volume) + '，是近 5 日均量的 ' + d.vr.toFixed(2)
          + ' 倍。价格和成交量同时放大，收盘落在当日区间的 ' + pos + '% 位置。';
      case 'doji':
        return '实体只占当日振幅 ' + ((d.body / r) * 100).toFixed(0) + '%，开盘 ' + f2(k.open) + ' 元、收盘 ' + f2(k.close)
          + ' 元，相差 ' + f2(Math.abs(k.close - k.open)) + ' 元，当日价格在这段区间里来回。';
      case 'spike':
        return '最高 ' + f2(k.high) + ' 元、收 ' + f2(k.close) + ' 元，从当日高点回落 ' + (((k.high - k.close) / k.close) * 100).toFixed(2)
          + '%，收盘低于开盘 ' + f2(k.open) + ' 元。当日上冲的部分没有守住。';
      default:
        return '当日' + (d.chg === null ? '涨跌数据不足' : (d.chg >= 0 ? '涨 ' : '跌 ') + Math.abs(d.chg).toFixed(2) + '%')
          + '，最高 ' + f2(k.high) + ' 元、最低 ' + f2(k.low) + ' 元，收盘落在当日区间的 ' + pos + '% 位置。'
          + '没有命中长上下影、放量、十字星这几类形态。';
    }
  }

  function dayCard(d) {
    var k = d.k;
    return {
      shape: d.shape ? SHAPES[d.shape] : null,
      read: readOf(d),
      rows: [
        ['开 / 收', f2(k.open) + ' / ' + f2(k.close) + ' 元'],
        ['最高 / 最低', f2(k.high) + ' / ' + f2(k.low) + ' 元'],
        ['涨跌幅', d.chg === null ? '—' : sgn(d.chg, '%')],
        ['成交量', hand(k.volume) + (d.vr ? ' · 近 5 日均量 ' + d.vr.toFixed(2) + ' 倍' : '')],
        ['距 20 日均线', d.mg === null ? '—' : sgn(d.mg, '%')]
      ]
    };
  }

  /* 顶部一句话：优先讲最近 3 天的量价关系，其次讲当天，最后退回均线位置 */
  function summary(b) {
    var d = b.days, last = b.last, i;
    var d3 = d.slice(-3);
    var up3 = true, shrink3 = true, chgs = [], vols = [];
    for (i = 0; i < d3.length; i++) {
      chgs.push(d3[i].chg);
      vols.push(d3[i].k.volume);
      if (i > 0) {
        if (!(d3[i].k.close > d3[i - 1].k.close)) up3 = false;
        if (!(d3[i].k.volume < d3[i - 1].k.volume)) shrink3 = false;
      }
    }
    if (d3.length === 3 && up3 && shrink3) {
      return '最近 3 个交易日连着收涨（' + chgs.map(function (c) { return c === null ? '—' : sgn(c, '%'); }).join('、')
        + '），成交量逐日下降（' + vols.map(hand).join(' → ') + '）：价格在往上，成交的钱在变少。';
    }
    if (last.shape) {
      return '最新一个交易日出现「' + SHAPES[last.shape].t + '」：' + readOf(last);
    }
    if (last.mg === null) return '历史数据不足，均线还不好算。';
    return '最新一个交易日收 ' + f2(last.k.close) + ' 元，' + (last.mg >= 0 ? '高于' : '低于') + ' 20 日均线（' + f2(last.ma20)
      + ' 元）' + Math.abs(last.mg).toFixed(2) + '%，近 60 个交易日区间 ' + f2(b.lo60) + '–' + f2(b.hi60)
      + ' 元，收盘在区间 ' + (((last.k.close - b.lo60) / (b.hi60 - b.lo60 || 1)) * 100).toFixed(0) + '% 位置。';
  }

  /* 底部速查：当前状态最契合的两三条 */
  function quick(b) {
    var last = b.last, out = [];
    var pos = ((last.k.close - b.lo60) / (b.hi60 - b.lo60 || 1)) * 100;

    if (last.ma20 !== null) {
      out.push({
        t: last.mg >= 0 ? '站在 20 日均线上方' : '压在 20 日均线下方',
        body: '收盘 ' + f2(last.k.close) + ' 元，20 日均线 ' + f2(last.ma20) + ' 元，' + (last.mg >= 0 ? '高' : '低')
          + ' ' + Math.abs(last.mg).toFixed(2) + '%。20 日均线是最近 20 个交易日收盘价的算术平均，常被当作近一个月的平均成本参考。'
      });
    }

    out.push({
      t: '近 60 个交易日区间位置',
      body: '最低 ' + f2(b.lo60) + ' 元、最高 ' + f2(b.hi60) + ' 元，收盘在区间 ' + pos.toFixed(0) + '% 位置（0% 是区间最低，100% 是区间最高）。'
    });

    if (last.shape) {
      out.push({
        t: SHAPES[last.shape].t,
        body: readOf(last)
      });
    }

    out.push({
      t: '均线方向',
      body: last.ma60 === null
        ? '历史不足 60 个交易日，60 日均线还算不出来。'
        : '20 日均线 ' + f2(last.ma20) + ' 元，60 日均线 ' + f2(last.ma60) + ' 元，20 日线在 60 日线'
          + (last.ma20 > last.ma60 ? '上方' : '下方') + '。'
    });

    return out;
  }

  window.KL = { build: build, summary: summary, dayCard: dayCard, quick: quick, SHAPES: SHAPES, hand: hand };
})();

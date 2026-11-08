/* ============================================================
   K 线解读：全部是「能被读者拿数据核对」的客观口径，不做涨跌预测。
   文案原则：一句只讲一件事；术语先给生活解释再给数字；不写该不该买。
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
    lshadow: { t: '探底拉回', tone: 'good' },
    ushadow: { t: '冲高没守住', tone: 'bad' },
    bigup: { t: '放量大涨', tone: 'good' },
    bigdown: { t: '放量大跌', tone: 'bad' },
    doji: { t: '原地打转', tone: 'mid' },
    spike: { t: '上冲没接住', tone: 'bad' }
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

  /* 单根 K 的白话：一句一个事实，最后一句说明「这一天只说明这一天」 */
  function readOf(d) {
    var k = d.k, r = d.range || 1;
    var pos = ((k.close - k.low) / r * 100).toFixed(0);
    switch (d.shape) {
      case 'lshadow':
        return '今天最低到 ' + f2(k.low) + ' 元，收盘拉回 ' + f2(k.close) + ' 元。下面那根「针」占全天高低差的 '
          + (d.lower / r * 100).toFixed(0) + '%，说明盘中砸下去之后又被人买回来了。收盘停在当天波动区间的 ' + pos
          + '% 位置，越靠上表示收得越稳。这只说明当天，不代表后面怎么走。';
      case 'ushadow':
        return '今天最高冲到 ' + f2(k.high) + ' 元，收盘只回到 ' + f2(k.close) + ' 元。上面那根「针」占全天高低差的 '
          + (d.upper / r * 100).toFixed(0) + '%，说明冲上去之后又卖回来了。收盘停在当天波动区间的 ' + pos
          + '% 位置，越靠下表示收得越弱。这只说明当天，不代表后面怎么走。';
      case 'bigup':
        return '今天涨 ' + Math.abs(d.chg).toFixed(2) + '%，成交 ' + hand(k.volume) + '，是近 5 天平均的 '
          + d.vr.toFixed(2) + ' 倍。价格和成交量一起放大，属于「很热闹的一天」。收盘在当天波动区间的 ' + pos + '% 位置。';
      case 'bigdown':
        return '今天跌 ' + Math.abs(d.chg).toFixed(2) + '%，成交 ' + hand(k.volume) + '，是近 5 天平均的 '
          + d.vr.toFixed(2) + ' 倍。价格和成交量一起放大，属于「很热闹的一天」。收盘在当天波动区间的 ' + pos + '% 位置。';
      case 'doji':
        return '今天开盘 ' + f2(k.open) + ' 元、收盘 ' + f2(k.close) + ' 元，只差 ' + f2(Math.abs(k.close - k.open))
          + ' 元，几乎原地不动；但盘中最高最低差了 ' + f2(r) + ' 元。开盘和收盘挨在一起，说明这一天多空没分出胜负。';
      case 'spike':
        return '今天最高摸到 ' + f2(k.high) + ' 元，收盘 ' + f2(k.close) + ' 元，从当天高点回落 '
          + (((k.high - k.close) / k.close) * 100).toFixed(2) + '%，收盘还低于开盘价 ' + f2(k.open) + ' 元。冲上去的那一段没守住。';
      default:
        return '今天' + (d.chg === null ? '涨跌数据不足' : (d.chg >= 0 ? '涨 ' : '跌 ') + Math.abs(d.chg).toFixed(2) + '%')
          + '，全天在 ' + f2(k.low) + '–' + f2(k.high) + ' 元之间，收盘落在当天波动区间的 ' + pos
          + '% 位置。没有明显的长影线、放量或原地打转。';
    }
  }

  function dayCard(d) {
    var k = d.k;
    return {
      shape: d.shape ? SHAPES[d.shape] : null,
      read: readOf(d),
      rows: [
        ['今天开盘 / 收盘', f2(k.open) + ' / ' + f2(k.close) + ' 元'],
        ['今天最高 / 最低', f2(k.high) + ' / ' + f2(k.low) + ' 元'],
        ['比昨天', d.chg === null ? '—' : sgn(d.chg, '%')],
        ['成交量', hand(k.volume) + (d.vr ? '，是近 5 天平均的 ' + d.vr.toFixed(2) + ' 倍' : '')],
        ['离平均成本', d.mg === null ? '—' : sgn(d.mg, '%') + '（' + f2(d.ma20) + ' 元）']
      ]
    };
  }

  /* 顶部一句话：优先讲最近 3 天的量价关系，其次讲当天形态，最后退回位置 */
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
      return '最近 3 天连着涨（' + chgs.map(function (c) { return c === null ? '—' : sgn(c, '%'); }).join('、')
        + '），但成交量一天比一天少（' + vols.map(hand).join(' → ') + '）——价格在往上，参与的钱在变少。';
    }
    if (last.shape) {
      return '今天出现了「' + SHAPES[last.shape].t + '」。' + readOf(last);
    }
    if (last.mg === null) return '历史数据不足 20 天，平均成本线还画不出来。';
    var gapLo = last.k.close - b.lo60, gapHi = b.hi60 - last.k.close;
    return '今天收 ' + f2(last.k.close) + ' 元，比最近一个月的平均成本（' + f2(last.ma20) + ' 元）'
      + (last.mg >= 0 ? '高 ' : '低 ') + Math.abs(last.mg).toFixed(2) + '%。往回看三个月，最高到过 ' + f2(b.hi60)
      + ' 元、最低到过 ' + f2(b.lo60) + ' 元：现在离最低差 ' + f2(gapLo) + ' 元，离最高差 ' + f2(gapHi) + ' 元。';
  }

  /* 底部速查：当前状态最契合的几条，全部给定义与数字，不下结论 */
  function quick(b) {
    var last = b.last, out = [];
    var gapLo = last.k.close - b.lo60, gapHi = b.hi60 - last.k.close;

    if (last.ma20 !== null) {
      out.push({
        t: last.mg >= 0 ? '价格在平均成本线之上' : '价格在平均成本线之下',
        body: '今天收 ' + f2(last.k.close) + ' 元，最近一个月的平均成本是 ' + f2(last.ma20) + ' 元（20 日均线＝最近 20 个交易日收盘价的平均值）。'
          + '高于它，说明最近一个月买入的人平均是赚的；低于它，平均是亏的。现在' + (last.mg >= 0 ? '高 ' : '低 ')
          + Math.abs(last.mg).toFixed(2) + '%。'
      });
    }

    out.push({
      t: '离三个月的高点、低点有多远',
      body: '近三个月最低 ' + f2(b.lo60) + ' 元、最高 ' + f2(b.hi60) + ' 元。现在是 ' + f2(last.k.close) + ' 元：'
        + '比最低高 ' + f2(gapLo) + ' 元，比最高低 ' + f2(gapHi) + ' 元。'
    });

    if (last.shape) {
      out.push({ t: SHAPES[last.shape].t, body: readOf(last) });
    }

    out.push({
      t: '两条平均成本线的位置',
      body: last.ma60 === null
        ? '历史不足 60 个交易日，三个月的平均成本还算不出来。'
        : '一个月的平均成本 ' + f2(last.ma20) + ' 元，三个月的平均成本 ' + f2(last.ma60) + ' 元。一个月的在三个月的'
          + (last.ma20 > last.ma60 ? '上方' : '下方') + '，意思是最近一个月买入的人，成本比三个月前那一批'
          + (last.ma20 > last.ma60 ? '更高' : '更低') + '。'
    });

    return out;
  }

  window.KL = { build: build, summary: summary, dayCard: dayCard, quick: quick, SHAPES: SHAPES, hand: hand };
})();

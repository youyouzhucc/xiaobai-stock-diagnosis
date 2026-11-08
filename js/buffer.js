/* 韭菜缓冲器：不判断，只把你的理由和这只票的事实并排放一次，然后放冰箱三天。 */
(function () {
  'use strict';

  var KEY = 'jcbox_v1';
  var SKIPKEY = 'jcbox_skip';
  var WAIT = 3 * 24 * 60 * 60 * 1000;   /* 三天 */

  function $(id) { return document.getElementById(id); }
  function f2(v) { return (v === null || v === undefined || !isFinite(v)) ? '—' : Number(v).toFixed(2); }
  function f0(v) { return (v === null || v === undefined || !isFinite(v)) ? '—' : Number(v).toFixed(0); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function pct(v) { return (v >= 0 ? '+' : '') + Number(v).toFixed(1) + '%'; }

  function secidOf(code) {
    code = String(code || '').trim();
    if (!/^\d{6}$/.test(code)) return null;
    if (/^6/.test(code)) return '1.' + code;
    if (/^9/.test(code) && !/^9[2-9]/.test(code)) return '1.' + code;
    return '0.' + code;
  }

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function persist(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* 存不进就算了 */ } }
  function skips() { return Number(localStorage.getItem(SKIPKEY) || 0); }
  function addSkip() { try { localStorage.setItem(SKIPKEY, String(skips() + 1)); } catch (e) { } }
  function nowStr(d) {
    d = d || new Date();
    var m = d.getMonth() + 1, dd = d.getDate();
    return (m < 10 ? '0' + m : m) + '-' + (dd < 10 ? '0' + dd : dd);
  }

  var cur = null;        /* { q, name, price, hi, lo, r20, up, dn } */
  var kind = '';

  /* ---------- 第一步：查价 + 基础事实 ---------- */
  async function find() {
    var code = $('jc-code').value.trim();
    var secid = secidOf(code);
    if (!secid) { $('jc-quote').innerHTML = '<div class="jc-err">要 6 位数字代码，比如 601899。</div>'; return; }

    $('jc-quote').innerHTML = '<div class="jc-loading">正在问行情…</div>';
    $('jc-find').disabled = true;
    try {
      var list = await API.quotes([secid]);
      var q = list && list[0];
      if (!q) throw new Error('没拿到这只票的行情');
      var kl = await API.kline(secid, 130);

      var win = kl.slice(-60);
      var hi = Math.max.apply(null, win.map(function (k) { return k.high; }));
      var lo = Math.min.apply(null, win.map(function (k) { return k.low; }));
      var r20 = kl.length > 21 ? (kl[kl.length - 1].close / kl[kl.length - 21].close - 1) * 100 : null;
      var up = 0, dn = 0;
      for (var i = 1; i < win.length; i++) {
        if (win[i].close > win[i - 1].close) up++;
        else if (win[i].close < win[i - 1].close) dn++;
      }

      cur = {
        code: code, secid: secid, name: q.name, price: q.price, situ: q.pct,
        hi: hi, lo: lo, r20: r20, up: up, dn: dn
      };

      $('jc-quote').innerHTML =
        '<div class="jc-q-h"><b>' + esc(q.name) + '</b><span>' + esc(code) + '</span>' +
        '<span class="jc-q-p">' + f2(q.price) + ' 元</span>' +
        '<span class="jc-q-pct ' + (q.pct >= 0 ? 'up' : 'down') + '">' + pct(q.pct) + '</span></div>' +
        '<div class="jc-q-rows">' +
        '<span>近三个月最高 <b>' + f2(hi) + '</b> 元</span>' +
        '<span>最低 <b>' + f2(lo) + '</b> 元</span>' +
        '<span>离最高还差 <b>' + f2(hi - q.price) + '</b> 元</span>' +
        '<span>离最低还有 <b>' + f2(q.price - lo) + '</b> 元</span>' +
        '<span>近 20 个交易日 <b>' + (r20 === null ? '—' : pct(r20)) + '</b></span>' +
        '</div>';

      $('jc-step2').hidden = false;
      $('jc-reason').value = '';
      kind = '';
      Array.prototype.forEach.call($('jc-tags').children, function (b) { b.classList.remove('on'); });
    } catch (e) {
      $('jc-quote').innerHTML = '<div class="jc-err">没拿到数据：' + esc(e.message) + '。可能是接口暂时不通，过一会儿再试。</div>';
    } finally {
      $('jc-find').disabled = false;
    }
  }

  /* ---------- 第二步：理由翻译 ---------- */
  function guessKind(txt) {
    if (/群|消息|听说|朋友|朋友圈|小红书|抖音|推荐|老师|大V|内幕|别人说/.test(txt)) return 'msg';
    if (/涨|怕错过|来不及|追|新高|猛|错过|起飞|要涨/.test(txt)) return 'fomo';
    if (/跌|抄底|反弹|便宜|低了|回本|到底/.test(txt)) return 'dip';
    if (/都|身边人|同事|赚钱|赚钱了/.test(txt)) return 'crowd';
    return 'other';
  }

  function translate() {
    var facts = '现价 ' + f2(cur.price) + ' 元，比近三个月最高（' + f2(cur.hi) + ' 元）低 ' + f2(cur.hi - cur.price)
      + ' 元，比最低（' + f2(cur.lo) + ' 元）高 ' + f2(cur.price - cur.lo) + ' 元；近 20 个交易日 '
      + (cur.r20 === null ? '数据不足' : pct(cur.r20)) + '；近 60 个交易日里上涨 ' + cur.up + ' 天、下跌 ' + cur.dn + ' 天。';

    switch (cur.kind) {
      case 'msg':
        return '你的依据来自别人的话。这句话里没有这只票自己的数字，下面这几项是它的：' + facts;
      case 'fomo':
        return '你的依据是它最近很猛。已经涨完的那一段不属于你，你买到的是它之后的部分。它现在的数字：' + facts;
      case 'dip':
        return '你的依据是它跌得够多了。「跌得多」和「会不会回去」是两件事，中间没有必然关系。它现在的数字：' + facts;
      case 'crowd':
        return '你的依据是身边人在赚。同一只票，有人在前面赚，也有人在后面接。它现在的数字：' + facts;
      default:
        return '你的理由我原样放着，不评价。它现在的数字是：' + facts;
    }
  }

  /* 生活换算：只列能整除的生活单位，不给建议 */
  function wallet(price) {
    var amt = Math.round(price * 100);           /* 一手 */
    var goods = [
      { n: '顿火锅（人均 150）', p: 150 },
      { n: '台 Switch', p: 2000 },
      { n: '个月猫粮', p: 200 }
    ];
    var parts = [];
    goods.forEach(function (g) {
      var c = Math.floor(amt / g.p);
      if (c >= 1) parts.push(c + ' ' + g.n);
    });
    var line = parts.length
      ? '一手（100 股）大约 ' + amt + ' 元，差不多是 ' + parts.join(' / ') + '。'
      : '一手（100 股）大约 ' + amt + ' 元，比一顿火锅还少。';

    var drop = Math.round(amt * 0.85);
    return line + '如果买完第二天开始跌 15%：' + amt + ' 元变成 ' + drop + ' 元，少 ' + (amt - drop) + ' 元。';
  }

  /* ---------- 第三步：放进冰箱 ---------- */
  function push() {
    if (!cur) return;
    var txt = $('jc-reason').value.trim();
    if (!txt) { $('jc-reason').focus(); $('jc-reason').placeholder = '先写一句，哪怕是「我就是想买」也行'; return; }

    kind = kind || guessKind(txt);
    cur.kind = kind;

    var list = load();
    var item = {
      id: 'b' + Date.now(),
      code: cur.code, name: cur.name, price: cur.price,
      at: Date.now(),
      reason: txt, kind: kind
    };
    list.unshift(item);
    if (list.length > 20) list = list.slice(0, 20);
    persist(list);

    $('jc-result').hidden = false;
    $('jc-result').innerHTML =
      '<div class="jc-r-h">你说的</div>' +
      '<div class="jc-r-say">「' + esc(txt) + '」</div>' +
      '<div class="jc-r-h">它现在的数字</div>' +
      '<div class="jc-r-body">' + esc(translate()) + '</div>' +
      '<div class="jc-r-h">换成钱</div>' +
      '<div class="jc-r-body">' + esc(wallet(cur.price)) + '</div>' +
      '<div class="jc-r-foot">放进冰箱了：' + esc(cur.name) + '，' + f2(cur.price) + ' 元，' + nowStr() + '。'
      + '三天后回来，这里会显示它当时多少钱、现在多少钱，中间发生了什么由你自己看。</div>';

    $('jc-step2').hidden = true;
    renderFridge();
  }

  /* ---------- 冰箱 ---------- */
  async function thaw(id, forced) {
    var list = load();
    var it = list.filter(function (x) { return x.id === id; })[0];
    if (!it) return;
    var row = $('th-' + id);
    if (!row) return;
    row.innerHTML = '<div class="jc-loading">正在问行情…</div>';
    if (forced) addSkip();
    try {
      var q = (await API.quotes([secidOf(it.code)]))[0];
      var now = q.price;
      var chg = (now / it.price - 1) * 100;
      row.innerHTML =
        '<div class="jc-thaw-line">' + nowStr(new Date(it.at)) + ' 你看到它 <b>' + f2(it.price) + '</b> 元，今天 <b>'
        + f2(now) + '</b> 元，' + (chg >= 0 ? '涨 ' : '跌 ') + Math.abs(chg).toFixed(1) + '%。'
        + '（当时理由：' + esc(it.reason) + '）</div>';
      it.checked = Date.now();
      it.thenPrice = now;
      persist(list);
    } catch (e) {
      row.innerHTML = '<div class="jc-err">没拿到行情：' + esc(e.message) + '</div>';
    }
  }

  function renderFridge() {
    var list = load();
    var box = $('jc-list');
    var n = $('jc-fridge-n');
    if (!list.length) {
      box.innerHTML = '<div class="jc-empty">还空着。想买的东西先放进来，三天后再看。</div>';
      n.textContent = '空的';
      return;
    }
    var waiting = list.filter(function (x) { return Date.now() - x.at < WAIT; }).length;
    n.textContent = waiting ? '里面 ' + list.length + ' 只，' + waiting + ' 只还没到时间' : '里面 ' + list.length + ' 只，都到时间了';

    box.innerHTML = list.map(function (x) {
      var passed = Date.now() - x.at;
      var p = Math.min(1, passed / WAIT);
      var left = WAIT - passed;
      var ready = left <= 0;
      var leftTxt = ready ? '可以看了'
        : (left > 86400000 ? '还要等 ' + Math.ceil(left / 86400000) + ' 天' : '还要等 ' + Math.ceil(left / 3600000) + ' 小时');
      return '<div class="jc-item">' +
        '<div class="jc-item-h"><b>' + esc(x.name) + '</b><span>' + esc(x.code) + '</span>'
        + '<span class="jc-item-p">' + f2(x.price) + ' 元</span>'
        + '<button class="jc-del" type="button" onclick="JC.del(\'' + x.id + '\')" aria-label="删掉">×</button></div>' +
        '<div class="jc-item-r">「' + esc(x.reason) + '」 · ' + nowStr(new Date(x.at)) + ' 存入 · ' + leftTxt + '</div>' +
        '<div class="jc-bar"><i style="width:' + (p * 100).toFixed(0) + '%"></i></div>' +
        (ready
          ? '<button class="jc-btn jc-btn-sm" type="button" onclick="JC.thaw(\'' + x.id + '\',false)">解冻，看看现在什么价</button>'
          : '<button class="jc-btn jc-btn-sm jc-btn-ghost" type="button" onclick="JC.thaw(\'' + x.id + '\',true)">等不住了，现在就看</button>') +
        '<div class="jc-thaw" id="th-' + x.id + '">' +
        (x.thenPrice ? '<div class="jc-thaw-line">当时 ' + f2(x.price) + ' 元，' + nowStr() + ' 看到 ' + f2(x.thenPrice) + ' 元。</div>' : '') +
        '</div>' +
        '</div>';
    }).join('');
  }

  /* ---------- 事件 ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t.id === 'jc-find') { find(); return; }
    if (t.id === 'jc-push') { push(); return; }
    if (t.getAttribute && t.getAttribute('data-thaw')) {
      thaw(t.getAttribute('data-thaw'), t.getAttribute('data-forced') === '1');
      return;
    }    if (t.getAttribute && t.getAttribute('data-del')) {
      var id = t.getAttribute('data-del');
      persist(load().filter(function (x) { return x.id !== id; }));
      renderFridge();
      return;
    }
    if (t.parentNode && t.parentNode.id === 'jc-tags') {
      Array.prototype.forEach.call($('jc-tags').children, function (b) { b.classList.remove('on'); });
      t.classList.add('on');
      kind = t.getAttribute('data-k');
      if (!$('jc-reason').value.trim()) $('jc-reason').value = t.textContent.trim();
    }
  });

  $('jc-code').addEventListener('keydown', function (e) { if (e.key === 'Enter') find(); });
  $('jc-reason').addEventListener('input', function () { kind = ''; });

  function del(id) {
    persist(load().filter(function (x) { return x.id !== id; }));
    renderFridge();
  }

  window.JC = { thaw: thaw, del: del, find: find, push: push };

  renderFridge();
})();

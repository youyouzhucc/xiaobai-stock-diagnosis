/* 组件库：详情页、首页、榜单共用的小积木
 * 目的只有一个 —— 同样的东西只写一遍。改一处，全站跟着变。
 * 所有函数返回 HTML 字符串，调用方拼装即可。
 */
const UI = (() => {
  const esc = s => String(s == null ? '' : s)
    .replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = v => (typeof v === 'number' && !Number.isNaN(v)) ? v : null;

  /* 数字格式化：统一保留位数，空值一律「—」，不补 0 不估算 */
  const f2 = v => num(v) === null ? '—' : Number(v).toFixed(2);
  const f1 = v => num(v) === null ? '—' : Number(v).toFixed(1);
  const pct = v => num(v) === null ? '—' : (Number(v) > 0 ? '+' : '') + Number(v).toFixed(2) + '%';
  const cap = v => {
    const n = num(v);
    if (n === null) return '—';
    if (n >= 1e12) return (n / 1e12).toFixed(2) + '万亿';
    if (n >= 1e8) return (n / 1e8).toFixed(0) + '亿';
    return (n / 1e4).toFixed(0) + '万';
  };
  const dirCls = v => {
    const n = num(v);
    return n === null ? 'flat' : n > 0 ? 'up' : n < 0 ? 'down' : 'flat';
  };

  /* ---------- 卡片 ---------- */
  function card(inner, cls) {
    return `<div class="card${cls ? ' ' + cls : ''}">${inner}</div>`;
  }

  /* ---------- 标题 ----------
   * name：标题；note：紧跟在标题后面的一句结论（不是甩到最右边）；
   * score：可选的分项分数，靠右与进度条对齐。
   */
  function title(name, note, score) {
    return `<div class="section-title">
      <span class="st-name">${esc(name)}</span>
      ${note ? `<span class="st-concl">${note}</span>` : ''}
      ${score ? `<span class="st-score">${esc(score)}</span>` : ''}
    </div>`;
  }

  /* ---------- 指标块 ----------
   * label 可以是数组 [显示名, 术语key]，带 ? 的术语点开有白话解释
   */
  function kv(o) {
    const lab = Array.isArray(o.label)
      ? `<span class="term" data-term="${esc(o.label[1])}">${esc(o.label[0])}</span>`
      : esc(o.label);
    return `<div class="kv">
      <div class="kv-label">${lab}</div>
      <div class="kv-val"${o.small ? ' style="font-size:15px"' : ''}>${o.value}</div>
      ${o.desc ? `<div class="kv-desc">${o.desc}</div>` : ''}
    </div>`;
  }
  function kvGrid(items) {
    return `<div class="kv-grid">${items.map(kv).join('')}</div>`;
  }

  /* ---------- 进度条 ---------- */
  function bar(score, color) {
    const w = num(score) === null ? 0 : Math.max(0, Math.min(100, score));
    return `<div class="bar ${color}"><i style="width:${w}%"></i></div>`;
  }

  /* ---------- 标签 ---------- */
  function tag(text, cls) {
    return `<span class="tag${cls ? ' ' + cls : ''}">${text}</span>`;
  }

  /* ---------- 空态 ---------- */
  function empty(text) {
    return `<div class="empty">${text}</div>`;
  }

  /* ---------- 交易门槛 ----------
   * A 股只有创业板、科创板（和北交所）需要单独开通权限，沪深主板开户即可买。
   * 门槛按交易所现行规则（2026 年核对）：创业板 10 万 / 2 年；科创板、北交所 50 万 / 2 年。
   * 这里只做提示，实际审核以券商为准。
   */
  const BOARDS = {
    gem: { key: 'gem', name: '创业板', need: '20 个交易日日均资产 ≥ 10 万，且股票交易满 2 年' },
    star: { key: 'star', name: '科创板', need: '20 个交易日日均资产 ≥ 50 万，且股票交易满 2 年' },
    bse: { key: 'bse', name: '北交所', need: '20 个交易日日均资产 ≥ 50 万，且股票交易满 2 年' }
  };

  function boardOf(code) {
    const c = String(code == null ? '' : code);
    if (/^(688|689)/.test(c)) return BOARDS.star;
    if (/^(300|301)/.test(c)) return BOARDS.gem;
    if (/^[48]/.test(c)) return BOARDS.bse;
    return null;   // 主板：无门槛
  }

  /* 用户自己勾的权限，只存浏览器本地，不上传任何地方。
     内存里留一份，避免列表每张卡片都去读一次 localStorage。 */
  let permCache = null;
  function perms() {
    if (permCache) return permCache;
    try { permCache = JSON.parse(localStorage.getItem('xb.perms') || '{}') || {}; }
    catch (e) { permCache = {}; }
    return permCache;
  }
  function setPerm(key, on) {
    const p = perms();
    if (on) p[key] = 1; else delete p[key];
    try { localStorage.setItem('xb.perms', JSON.stringify(p)); } catch (e) { /* 隐私模式下写不进去，忽略 */ }
  }
  function canBuy(code) {
    const b = boardOf(code);
    return !b || !!perms()[b.key];
  }

  /* 卡片上的板块徽章：没开通时显眼，开通后淡下去 */
  function badge(code) {
    const b = boardOf(code);
    if (!b) return '';
    const on = !!perms()[b.key];
    return `<i class="bd ${b.key}${on ? ' on' : ''}">${b.name}${on ? '' : '·需开通'}</i>`;
  }

  return { esc, f1, f2, pct, cap, dirCls, card, title, kv, kvGrid, bar, tag, empty, BOARDS, boardOf, perms, setPerm, canBuy, badge };
})();

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

  return { esc, f1, f2, pct, cap, dirCls, card, title, kv, kvGrid, bar, tag, empty };
})();

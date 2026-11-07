/* 全市场 A 股分页列表：独立页面，纯前端直连东财分页接口 */
const PAGE_SIZE = 50;
const CLIST = 'https://push2.eastmoney.com/api/qt/clist/get';
const FS = 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23';

const $ = id => document.getElementById(id);
const f2 = v => (v === null || v === undefined || v === '-' || v === '') ? '—' : Number(v).toFixed(2);
const fpct = v => (v === null || v === undefined || v === '-' || v === '') ? '—' : (Number(v) > 0 ? '+' : '') + Number(v).toFixed(2) + '%';
const fcap = v => {
  if (v === null || v === undefined || v === '-' || v === '') return '—';
  const n = Number(v);
  return n >= 1e12 ? (n / 1e12).toFixed(2) + '万亿' : (n / 1e8).toFixed(0) + '亿';
};
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cls = v => { const n = Number(v); return Number.isFinite(n) ? (n > 0 ? 'up' : n < 0 ? 'down' : 'flat') : 'flat'; };

const state = { page: 1, total: 0, pages: 1, loading: false, cache: new Map() };

function rowHTML(d) {
  const code = d.f12;
  const pe = d.f9;
  const peText = (pe === '-' || pe === null || pe === undefined) ? '—' : Number(pe) <= 0 ? '亏损' : Number(pe).toFixed(1);
  const hasPrice = Number(d.f2) > 0;
  if (!hasPrice) {
    return `<div class="row dead">
      <div class="r-main">
        <div class="r-name">${esc(d.f14)}<span class="r-code">${code}</span></div>
        <div class="r-ind">${esc(d.f100 || '未分类')}</div>
      </div>
      <div class="r-right dead-tag">停牌 / 退市<br>无行情</div>
    </div>`;
  }
  return `<div class="row" onclick="location.href='./index.html?code=${code}'">
    <div class="r-main">
      <div class="r-name">${esc(d.f14)}<span class="r-code">${code}</span></div>
      <div class="r-ind">${esc(d.f100 || '未分类')}</div>
    </div>
    <div class="r-mid">
      <div class="r-price">${f2(d.f2)}</div>
      <div class="r-pct ${cls(d.f3)}">${fpct(d.f3)}</div>
    </div>
    <div class="r-right">
      <div class="r-pe">PE <b>${peText}</b></div>
      <div class="r-cap">市值 <b>${fcap(d.f20)}</b></div>
    </div>
  </div>`;
}

async function loadPage(pn) {
  if (state.loading) return;
  state.loading = true;
  $('list').innerHTML = '<div class="empty">正在拉取第 ' + pn + ' 页…</div>';
  $('pager-info').textContent = '加载中…';

  if (state.cache.has(pn)) {
    const cached = state.cache.get(pn);
    renderRows(cached);
    state.loading = false;
    return;
  }

  const url = `${CLIST}?pn=${pn}&pz=${PAGE_SIZE}&po=0&np=1&ut=bd1d9ddb0408977cfd9463debb285354` +
    `&fltt=2&invt=2&fid=f12&fs=${encodeURIComponent(FS)}&fields=f2,f3,f9,f12,f13,f14,f20,f23,f100&_=${Date.now()}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    const data = json && json.data;
    if (!data || !data.diff) throw new Error('接口没有返回数据');

    const rows = Array.isArray(data.diff) ? data.diff : Object.values(data.diff);
    state.total = data.total || rows.length;
    state.pages = Math.max(1, Math.ceil(state.total / PAGE_SIZE));
    state.cache.set(pn, { rows, total: state.total, pages: state.pages });
    renderRows({ rows, total: state.total, pages: state.pages });
  } catch (e) {
    $('list').innerHTML = `<div class="empty">第 ${pn} 页加载失败：${esc(e.message)}<br>
      <button class="retry" onclick="loadPage(${pn})">重试</button></div>`;
    $('pager-info').textContent = '加载失败';
  } finally {
    state.loading = false;
  }
}

function renderRows(payload) {
  const { rows, total, pages } = payload;
  state.page = state.page;
  $('total').textContent = total;
  $('list').innerHTML = rows.map(rowHTML).join('');
  $('pager-info').innerHTML = `第 <b>${state.page}</b> / ${pages} 页`;
  $('btn-prev').disabled = state.page <= 1;
  $('btn-next').disabled = state.page >= pages;
  $('btn-jump').value = state.page;
  $('jump-wrap').style.display = pages > 1 ? 'flex' : 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goto(pn) {
  const p = Math.min(Math.max(1, pn), state.pages || 1);
  if (p === state.page) return;
  state.page = p;
  loadPage(p);
}

document.addEventListener('DOMContentLoaded', () => {
  $('btn-prev').addEventListener('click', () => goto(state.page - 1));
  $('btn-next').addEventListener('click', () => goto(state.page + 1));
  $('btn-jump').addEventListener('keydown', e => {
    if (e.key === 'Enter') goto(parseInt(e.target.value, 10) || 1);
  });
  $('search-input').addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const kw = e.target.value.trim();
    if (/^\d{6}$/.test(kw)) { location.href = `./index.html?code=${kw}`; }
    else if (kw) { alert('请直接输入 6 位股票代码，例如 600519'); }
  });
  loadPage(1);
});

document.addEventListener('click', () => { });

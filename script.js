// === Вкладки ===
document.querySelectorAll('.tabBtn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tabBtn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.target;
    document.querySelectorAll('section[id^="section-"]').forEach(s=>s.style.display = (s.id===target)?'block':'none');
  });
});

// === Подсветка ===
function highlight(text, query){
  if(!query) return text;
  let q = query.toLowerCase();
  return text.replace(new RegExp(`(${q})`, 'gi'), '<span class="hl">$1</span>');
}

// === Поиск ===
function search(inputId, resultId, emptyId, selectId){
  const q = document.getElementById(inputId).value.toLowerCase();
  const lawSel = document.getElementById(selectId).value;
  let results = DB.filter(x => (lawSel==='Все'||x.lawCode===lawSel) && (x._hay.includes(q)||!q));
  const box = document.getElementById(resultId);
  const empty = document.getElementById(emptyId);
  box.innerHTML='';
  if(!results.length){ empty.style.display='block'; return; }
  empty.style.display='none';
  results.forEach(r=>{
    const el = document.createElement('div');
    el.className='card';
    el.innerHTML = `<div class="row" style="justify-content:space-between;align-items:flex-start;margin-bottom:6px">
      <div class="pill">${r.lawCode} · Глава ${r.gl} · Статья ${r.art}</div>
      <div class="pill">${r.lawCode==='УК'?'Наказание':'Штраф'}: <span class="fine">${r.fine}</span></div>
      </div>
      <div style="font-weight:700;margin-bottom:6px">${highlight(r.title,q)}</div>
      <div class="muted">${highlight(r.law,q)}</div>`;
    if(resultId==='results2'){
      const btn = document.createElement('div'); btn.className='pill btn plus'; btn.textContent='+';
      btn.onclick=()=>addViolation(r);
      el.querySelector('.row').appendChild(btn);
    }
    box.appendChild(el);
  });
}

// Инициализация поиска
document.getElementById('q').addEventListener('input', ()=>search('q','results','empty','lawSelect'));
document.getElementById('lawSelect').addEventListener('change', ()=>search('q','results','empty','lawSelect'));
document.getElementById('q2').addEventListener('input', ()=>search('q2','results2','empty2','lawSelect2'));
document.getElementById('lawSelect2').addEventListener('change', ()=>search('q2','results2','empty2','lawSelect2'));
search('q','results','empty','lawSelect');
search('q2','results2','empty2','lawSelect2');

// === Калькулятор ===
let calcCount=0, totalFine=0, maxBanMonths=0;

function toInt(s){ return parseInt((s||'').replace(/[^\d]/g,''),10) || 0; }
function formatRub(n){ return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ') + ' ₽'; }

function months(v, unit){
  if(/год|года|лет/i.test(unit)) return v*12;
  if(/месяц|месяца|месяцев/i.test(unit)) return v;
  return 0;
}

const moneyRe = /(\d[\d\s]*)\s*₽/gim;
const banRe = /(лишен[^\d]{0,20}|лишение[^\d]{0,20}|до\s+)?(\d{1,3})(?:\s*[–—-]\s*(\d{1,3}))?\s*(год|года|лет|месяц|месяца|месяцев)/gim;

function extractPenalty(fineStr){
  if(!fineStr) return {fine:0, banMonths:0};

  let m, maxFine=0;
  while((m = moneyRe.exec(fineStr))!==null){
    const a = toInt(m[1]);
    const b = toInt(m[2]);
    maxFine = Math.max(maxFine, a, b);
  }

  let maxMonths=0;
  while((m = banRe.exec(fineStr))!==null){
    const a = toInt(m[2]);
    const b = toInt(m[3]);
    const unit = m[4]||'';
    const candidate = months(Math.max(a,b||0), unit);
    maxMonths = Math.max(maxMonths, candidate);
  }

  return {fine:maxFine, banMonths:maxMonths};
}

function addViolation(item){
  const {fine, banMonths} = extractPenalty(item.fine||'');
  calcCount++;
  totalFine += fine;
  maxBanMonths = Math.max(maxBanMonths, banMonths);
  updateCalcUI();
}

function resetCalc(){
  calcCount=0; totalFine=0; maxBanMonths=0;
  document.getElementById('violations-list').innerHTML='';
  updateCalcUI();
}

function prettyBan(monthsTotal){
  if(monthsTotal===0) return 'нет';
  if(monthsTotal%12===0) return (monthsTotal/12)+' год(а)';
  return monthsTotal+' мес.';
}

function updateCalcUI(){
  document.getElementById('calc-count').textContent = calcCount;
  document.getElementById('calc-fine').textContent = formatRub(totalFine);
  const banEl = document.getElementById('calc-ban');
  if(banEl) banEl.textContent = prettyBan(maxBanMonths);
}

document.getElementById('calc-clear').addEventListener('click', resetCalc);

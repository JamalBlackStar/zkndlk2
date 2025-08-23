// === Логика подсчёта ===
let calcCount = 0;
let totalFine = 0;      // в ₽
let maxBanMonths = 0;   // лишение в месяцах

const moneyRe = /(\d[\d\s\u202F\u00A0]*)(?:[–—-](\d[\d\s\u202F\u00A0]*))?\s*₽/gim;
const banRe = /(лишен[^\d]{0,20}|лишение[^\d]{0,20}|до\s+)?(\d{1,3})(?:\s*[–—-]\s*(\d{1,3}))?\s*(год|года|лет|месяц|месяца|месяцев)/gim;

function toInt(s){ return parseInt((s||'').replace(/[^\d]/g,''),10) || 0; }
function formatRub(n){ return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ') + ' ₽'; }
function months(v, unit){
  if(/год|года|лет/i.test(unit)) return v*12;
  if(/месяц|месяца|месяцев/i.test(unit)) return v;
  return 0;
}

function extractPenalty(fineStr){
  if(!fineStr) return {fine:0, banMonths:0};

  // 1) Штраф: берём максимум из найденных сумм
  let m, maxFine = 0;
  const normStr = fineStr.replace(/руб(лей|\.|\b)/gi,'₽'); // подстрахуемся
  while((m = moneyRe.exec(normStr))!==null){
    const a = toInt(m[1]);
    const b = toInt(m[2]);
    maxFine = Math.max(maxFine, a, b);
  }

  // 2) Лишение: берём максимум верхней границы/единственного значения
  let maxMonths = 0;
  while((m = banRe.exec(normStr))!==null){
    const a = toInt(m[2]);
    const b = toInt(m[3]);
    const unit = m[4]||'';
    const candidate = months(Math.max(a, b||0), unit);
    maxMonths = Math.max(maxMonths, candidate);
  }

  return {fine:maxFine, banMonths:maxMonths};
}

function addViolation(item){
  const {fine, banMonths} = extractPenalty(item.fine || '');
  calcCount += 1;
  totalFine += fine;
  maxBanMonths = Math.max(maxBanMonths, banMonths);

  const violationElement = document.createElement('div');
  violationElement.classList.add('violation');
  violationElement.innerHTML = `
    <span class="violationTitle">${item.title}</span>
    <span class="violationFine">${fine} ₽</span>
    <span class="violationBan">${prettyBan(banMonths)}</span>
    <button class="btn minus" title="Удалить">−</button>
  `;
  
  // Обработчик кнопки для удаления
  violationElement.querySelector('.minus').addEventListener('click', () => removeViolation(violationElement, fine, banMonths));

  document.getElementById('violations-list').appendChild(violationElement);
  updateCalcUI();
}

function removeViolation(element, fine, banMonths){
  element.remove(); // Убираем элемент из DOM
  calcCount -= 1;   // Уменьшаем количество нарушений
  totalFine -= fine; // Уменьшаем штраф
  maxBanMonths = Math.max(maxBanMonths - banMonths, 0); // Уменьшаем лишение (не ниже 0)

  updateCalcUI(); // Обновляем UI
}

function resetCalc(){
  calcCount = 0;
  totalFine = 0;
  maxBanMonths = 0;
  document.getElementById('violations-list').innerHTML = ''; // Очищаем список нарушений
  updateCalcUI(); // Обновляем UI
}

function prettyBan(monthsTotal){
  if(monthsTotal === 0) return 'нет';
  if(monthsTotal % 12 === 0) return (monthsTotal / 12) + ' год(а)';
  return monthsTotal + ' мес.';
}

function updateCalcUI(){
  document.getElementById('calc-count').textContent = calcCount;
  document.getElementById('calc-fine').textContent = formatRub(totalFine);

  // Обновляем лишение
  const calcBanElement = document.getElementById('calc-ban');
  if (maxBanMonths === 0) {
    calcBanElement.textContent = 'нет';
  } else {
    calcBanElement.textContent = prettyBan(maxBanMonths);
  }
}

// Очистка калькулятора
document.getElementById('calc-clear').addEventListener('click', resetCalc);

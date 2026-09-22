import './styles.css';
import { MIN_ZOOM, MAX_ZOOM, clamp, damp, formatDistance, formatLightTravelTime, projectMeters, scaleBar, stageAt, number, fitZoom } from './core/scale.js';
import { bodies, byId, stages, sources } from './data/universe.js';
import { createSpace } from './rendering/space.js';
import { initSky } from './sky.js';
import { initGalaxyView } from './galaxy-view.js';

const $ = id => document.getElementById(id);
const spaceElement = $('space');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let zoom = fitZoom(byId.earth.diameter, spaceElement.clientWidth, spaceElement.clientHeight, .72);
let targetZoom = zoom, activeStage = null, frame = 0, lastTime = 0, space = null;
let touring = false, tourTimer = 0, lastUiZoom = -1, lowQuality = innerWidth < 700;
let trueScale = false;
$('low-quality').checked = lowQuality;

// A deterministic decorative background: not a star catalogue or a physical scale.
let seed = 47;
for (let i = 0; i < 150; i++) {
  const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const star = document.createElement('i');
  star.style.cssText = `left:${rand() * 100}%;top:${rand() * 100}%;width:${rand() > .9 ? 2 : 1}px;height:1px;opacity:${.15 + rand() * .65}`;
  $('star-backdrop').append(star);
}

$('stage-nav').innerHTML = stages.map((stage, index) => `<button class="stage-button" data-stage="${index}">${stage.name}</button>`).join('');
$('stage-nav').addEventListener('click', event => {
  const button = event.target.closest('[data-stage]');
  if (button) goToStage(Number(button.dataset.stage));
});

function icon(body) {
  const kind = body.kind === 'distance' ? 'distance-icon' : body.kind === 'galaxy' ? 'galaxy-icon' : body.kind === 'structure' ? 'structure-icon' : `mini-planet ${body.id}-icon`;
  return `<span class="card-icon" aria-hidden="true"><span class="${kind}" style="--body-color:${body.color}"></span></span>`;
}

function updateStage(stage) {
  if (stage === activeStage) return;
  activeStage = stage;
  const index = stages.indexOf(stage);
  $('stage-count').textContent = `${String(index + 1).padStart(2, '0')} / 08`;
  $('stage-english').textContent = stage.english;
  $('stage-title').textContent = stage.name;
  $('stage-description').textContent = stage.description;
  $('representation-note').textContent = stage.note;
  $('location-path').textContent = index === 0 ? '지구 · 우리의 출발점' : `지구  /  ${stage.context}`;
  $('scene-caption').textContent = index < 2
    ? '지구 기준 · 실제 축척'
    : index === 2
      ? '지구 기준 · 궤도와 위치는 예시'
      : stage.id === 'web'
        ? '은하 흐름 개념도 · 실제 관측 지도 아님'
        : stage.id === 'universe'
          ? '관측자 중심 · 구형 경계는 관측 한계'
          : '지구 기준 · 우주 구조 개념도';
  document.querySelectorAll('.stage-button').forEach((button, i) => {
    if (i === index) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
  });
  const nav = $('stage-nav'), button = nav.children[index];
  if (button.offsetLeft < nav.scrollLeft || button.offsetLeft + button.offsetWidth > nav.scrollLeft + nav.clientWidth) nav.scrollTo({ left: button.offsetLeft - nav.clientWidth / 2 + button.offsetWidth / 2, behavior: 'instant' });
  $('size-cards').innerHTML = stage.cards.map(id => {
    const body = byId[id];
    return `<button class="size-card" data-body="${id}" aria-label="${body.name}, ${body.measure} ${body.value} ${body.unit}, 자세히 보기">${icon(body)}<span class="card-copy"><span class="card-name">${body.name}<span class="card-english">${body.english}</span></span><span class="card-value" style="display:block">${body.value}<small>${body.unit}</small></span><span class="card-measure" style="display:block">${body.measure}</span></span><span class="card-arrow" aria-hidden="true">↗</span></button>`;
  }).join('');
}

function renderLabels(labels) {
  const width = spaceElement.clientWidth, height = spaceElement.clientHeight;
  const occupied = [{ x: width / 2 - 48, y: height / 2 - 16, width: 96, height: 52 }];
  const fragments = [];
  for (const label of labels) {
    if (fragments.length >= 10 || label.x < 35 || label.x > width - 95 || label.y < 25 || label.y > height - 35) continue;
    if (width > 700 && label.x < 320 && label.y < 200) continue;
    const offsetX = width > 700 ? label.offsetX || 0 : label.offsetXMobile || 0;
    const offsetY = width > 700 ? label.offsetY || 0 : label.offsetYMobile || 0;
    const anchorX = label.x + (label.pixels > 10 ? label.pixels / 2 + 6 : 0), anchorY = label.y;
    const x = anchorX + offsetX, y = anchorY + offsetY;
    const box = { x, y: y - 13, width: label.name.length * 11 + 25, height: 27 };
    if (occupied.some(other => box.x < other.x + other.width && box.x + box.width > other.x && box.y < other.y + other.height && box.y + box.height > other.y)) continue;
    if (x + box.width > width - 30) continue;
    occupied.push(box);
    if (offsetX || offsetY) {
      const length = Math.hypot(offsetX, offsetY), angle = Math.atan2(offsetY, offsetX) * 180 / Math.PI;
      fragments.push(`<span class="object-leader" style="left:${anchorX}px;top:${anchorY}px;width:${length}px;transform:rotate(${angle}deg)"></span>`);
    }
    fragments.push(`<span class="object-label" style="left:${x}px;top:${y}px;--dot:${label.color}">${label.pixels < 3 ? '<i></i>' : ''}${label.name}</span>`);
  }
  $('object-labels').innerHTML = fragments.join('');
}

function renderUi() {
  updateStage(stageAt(zoom, stages));
  $('zoom-range').value = targetZoom;
  $('zoom-range').setAttribute('aria-valuetext', `화면 가로 폭 ${formatDistance(10 ** targetZoom)}`);
  $('scale-value').textContent = formatDistance(10 ** zoom);
  $('light-time').textContent = `빛으로 ${formatLightTravelTime(10 ** zoom)}`;
  $('power-value').innerHTML = `10<sup>${zoom.toFixed(2)}</sup> m`;
  $('zoom-in').disabled = targetZoom <= MIN_ZOOM;
  $('zoom-out').disabled = targetZoom >= MAX_ZOOM;
  const bar = scaleBar(zoom, spaceElement.clientWidth, 90);
  $('scale-rule').style.width = `${bar.pixels}px`;
  $('scale-rule-label').textContent = formatDistance(bar.meters);
  const diameter = projectMeters(byId.earth.diameter, zoom, spaceElement.clientWidth);
  const ruler = $('diameter-line');
  const showRuler = diameter > 45 && diameter < spaceElement.clientHeight * .82;
  ruler.hidden = !showRuler;
  if (showRuler) {
    ruler.style.width = `${diameter}px`;
    ruler.style.top = `${spaceElement.clientHeight / 2 + diameter / 2 + 15}px`;
    $('diameter-label').textContent = '지구의 지름 · 12,756 km';
  }
  $('origin').classList.toggle('on-earth', diameter > 70);
  $('star-backdrop').style.opacity = zoom > 21 ? '.15' : '.65';
}

function tick(time) {
  frame = 0;
  const dt = lastTime ? Math.min((time - lastTime) / 1000, .05) : 1 / 60;
  lastTime = time;
  zoom = reducedMotion.matches ? targetZoom : damp(zoom, targetZoom, dt);
  if (Math.abs(targetZoom - zoom) < .0002) zoom = targetZoom;
  renderLabels(space?.render(zoom, reducedMotion.matches ? 0 : time) || []);
  if (Math.abs(zoom - lastUiZoom) > .003 || zoom === targetZoom) { renderUi(); lastUiZoom = zoom; }
  if (zoom !== targetZoom) invalidate();
  else if (!reducedMotion.matches && zoom > 10.3 && zoom < 14.9) invalidate();
}

function invalidate() { if (!frame && !document.hidden && !document.body.classList.contains('sky-active')) frame = requestAnimationFrame(tick); }
function setZoom(value, manual = true) {
  if (manual) stopTour();
  targetZoom = clamp(value, MIN_ZOOM, MAX_ZOOM);
  invalidate();
}
function stageZoom(stage) {
  const fit = fitZoom(byId[stage.focus].diameter, spaceElement.clientWidth, spaceElement.clientHeight, .64);
  if (stage.id === 'earth' || stage.id === 'galaxy' || stage.id === 'universe' || stage.id === 'web') return Math.max(stage.start, fit);
  return Math.min(MAX_ZOOM, stage.zoom + Math.max(0, Math.log10(spaceElement.clientWidth / spaceElement.clientHeight) - .42));
}
function goToStage(index, manual = true) { setZoom(stageZoom(stages[clamp(index, 0, stages.length - 1)]), manual); }
function stopTour() {
  touring = false; clearTimeout(tourTimer); tourTimer = 0;
  $('tour-label').textContent = '자동 여행';
  $('tour-button').setAttribute('aria-pressed', 'false');
  $('tour-button').querySelector('.play-icon').textContent = '▷';
}
function nextTourStage() {
  const index = stages.indexOf(stageAt(targetZoom, stages));
  if (index >= stages.length - 1) { stopTour(); return; }
  goToStage(index + 1, false);
  tourTimer = setTimeout(nextTourStage, 6500);
}
$('tour-button').addEventListener('click', () => {
  if (touring) { stopTour(); return; }
  touring = true; $('tour-label').textContent = '여행 멈춤';
  $('tour-button').setAttribute('aria-pressed', 'true');
  $('tour-button').querySelector('.play-icon').textContent = 'Ⅱ';
  if (stageAt(targetZoom, stages) === stages.at(-1)) goToStage(0, false);
  else nextTourStage();
  if (!tourTimer) tourTimer = setTimeout(nextTourStage, 6500);
});
$('home-button').addEventListener('click', () => goToStage(0));
$('zoom-in').addEventListener('click', () => setZoom(targetZoom - .35));
$('zoom-out').addEventListener('click', () => setZoom(targetZoom + .35));
$('zoom-range').addEventListener('input', event => setZoom(Number(event.target.value)));
spaceElement.addEventListener('wheel', event => {
  event.preventDefault();
  const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? spaceElement.clientHeight : 1;
  setZoom(targetZoom + clamp(event.deltaY * multiplier, -200, 200) * .0016);
}, { passive: false });
document.addEventListener('keydown', event => {
  if (document.body.classList.contains('sky-active')) return;
  if (document.querySelector('dialog[open]') || event.target.matches('input,textarea,select,button,a')) return;
  const index = stages.indexOf(stageAt(targetZoom, stages));
  const actions = { ArrowUp: () => setZoom(targetZoom - .2), ArrowDown: () => setZoom(targetZoom + .2), '+': () => setZoom(targetZoom - .2), '-': () => setZoom(targetZoom + .2), ArrowLeft: () => goToStage(index - 1), ArrowRight: () => goToStage(index + 1), Home: () => goToStage(0), End: () => goToStage(7) };
  if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
});

const pointers = new Map();
let pinchDistance = 0, pinchZoom = 0, dragY = 0, dragZoom = 0;
const distance = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
spaceElement.addEventListener('pointerdown', event => {
  if (event.pointerType === 'mouse') return;
  spaceElement.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  stopTour(); dragY = event.clientY; dragZoom = targetZoom;
  if (pointers.size === 2) { pinchDistance = distance(); pinchZoom = targetZoom; }
});
spaceElement.addEventListener('pointermove', event => {
  if (!pointers.has(event.pointerId)) return;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pointers.size === 2 && pinchDistance > 0) setZoom(pinchZoom + Math.log10(pinchDistance / Math.max(1, distance())));
  else if (pointers.size === 1) setZoom(dragZoom + (dragY - event.clientY) * .006);
});
const releasePointer = event => {
  pointers.delete(event.pointerId);
  pinchDistance = 0;
  if (pointers.size === 1) { dragY = [...pointers.values()][0].y; dragZoom = targetZoom; }
};
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => spaceElement.addEventListener(name, releasePointer));

function showDialog(id) { stopTour(); $(id).showModal(); }
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
});
$('info-button').addEventListener('click', () => showDialog('info-dialog'));
$('source-links').innerHTML = Object.values(sources).map(source => `<a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.title} ↗</a>`).join('');
$('low-quality').addEventListener('change', event => { lowQuality = event.target.checked; space?.setQuality(lowQuality); invalidate(); });
$('true-scale').addEventListener('change', event => { trueScale = event.target.checked; space?.setTrueScale(trueScale); invalidate(); });

function openBody(id) {
  const body = byId[id];
  $('body-dialog-title').textContent = body.name;
  $('body-dialog-english').textContent = body.english;
  $('body-dialog-measure').textContent = body.measure;
  $('body-dialog-value').innerHTML = `${body.value}<small>${body.unit}</small>`;
  const ratio = body.diameter / byId.earth.diameter;
  $('body-dialog-comparison').textContent = body.id === 'earth' ? '우리의 기준점입니다. 아래 비교는 모두 지구의 적도 지름을 기준으로 합니다.' : ratio >= 1 ? `지구 지름의 약 ${ratio > 1e9 ? ratio.toExponential(2).replace('e+', ' × 10^') : number(ratio, ratio < 10 ? 2 : 0)}배에 해당하는 길이입니다.` : `지구 지름의 약 ${number(ratio * 100, 1)}%입니다.`;
  $('body-dialog-note').textContent = body.kind === 'distance' ? '이 값은 천체 자체의 지름이 아닌 거리입니다. 1광년은 시간 단위가 아니라 빛이 1년 동안 이동하는 거리입니다.' : body.kind === 'structure' || body.kind === 'galaxy' ? '뚜렷한 표면이 없는 구조는 대표 범위를 표시합니다. 경계의 정의와 관측 방법에 따라 값이 달라질 수 있습니다.' : '천체를 구로 단순화했습니다. 적도 지름과 평균 지름은 서로 다를 수 있으며 수치는 반올림되어 있습니다.';
  $('body-source').href = sources[body.source].url;
  $('body-source').textContent = `출처 확인 · ${sources[body.source].title} ↗`;
  showDialog('body-dialog');
}
$('size-cards').addEventListener('click', event => { const card = event.target.closest('[data-body]'); if (card) openBody(card.dataset.body); });
$('catalog-list').innerHTML = bodies.map(body => `<button class="catalog-row" data-body="${body.id}"><span>${body.name}<small>${body.measure}</small></span><strong>${body.value} ${body.unit} ↗</strong></button>`).join('');
$('catalog-list').addEventListener('click', event => { const card = event.target.closest('[data-body]'); if (card) openBody(card.dataset.body); });
$('more-bodies').addEventListener('click', () => showDialog('catalog-dialog'));

function reportError(message) { $('render-status').hidden = !message; $('render-status').textContent = message; }
try {
  space = createSpace(spaceElement, { onInvalidate: invalidate, onError: reportError, lowQuality });
  space.resize();
} catch (error) {
  console.warn('3D initialization failed:', error.message);
  reportError('이 환경에서는 3D 화면을 표시할 수 없습니다. 단계 버튼으로 이동하며 아래에서 천체의 크기와 설명을 확인할 수 있습니다.');
}
const resizeObserver = new ResizeObserver(() => { if (spaceElement.clientWidth) space?.resize(); lastUiZoom = -1; invalidate(); });
resizeObserver.observe(spaceElement);
reducedMotion.addEventListener('change', invalidate);
document.addEventListener('visibilitychange', () => { lastTime = 0; if (document.hidden) stopTour(); else invalidate(); });
window.addEventListener('pagehide', event => { stopTour(); if (!event.persisted) { resizeObserver.disconnect(); cancelAnimationFrame(frame); space?.dispose(); } });

// Read-only diagnostics for repeatable browser verification.
window.galaxyDiagnostics = () => ({ zoom, targetZoom, stage: activeStage?.id, renderer: Boolean(space), touring, trueScale, stats: space?.getStats() });
document.addEventListener('galaxy-view-change', event => {
  stopTour(); cancelAnimationFrame(frame); frame = 0; lastTime = 0;
  if (!event.detail.sky) { space?.resize(); lastUiZoom = -1; invalidate(); }
});
renderUi(); initSky(); initGalaxyView(); invalidate();

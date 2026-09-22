import './sky.css';

// Galactic longitude/latitude, independent of terrestrial location or date.
const rad = Math.PI / 180;
const presets = {
  center: { l: 0, title: '은하 중심을 향하여', sub: '궁수자리 방향 · 은경 0°', text: '두껍게 겹친 별빛 사이로 검은 먼지 띠가 갈라집니다. 중심 방향의 넓은 빛무리는 보이지만, 중심핵 자체는 성간 먼지에 가려 가시광선으로 볼 수 없습니다.' },
  arm: { l: 80, title: '나선팔을 따라 바라보다', sub: '백조자리 방향 · 은경 약 80°', text: '태양계가 속한 국부팔을 따라 바라보는 방향입니다. 별들이 띠처럼 이어지고 먼지가 은하수를 둘로 가릅니다. 하늘에서는 나선 모양 전체가 아니라, 원반 안쪽에서 겹쳐 보이는 별빛을 만납니다.' },
  outer: { l: 180, title: '은하 바깥쪽을 향하여', sub: '반중심 방향 · 은경 180°', text: '은하 중심의 반대쪽입니다. 원반의 별빛은 계속 이어지지만 중심 방향의 넓고 밝은 빛무리는 사라집니다. 같은 태양계 위치에서도 시선에 따라 다른 은하수가 펼쳐집니다.' },
};
const wrap = value => ((value + 180) % 360 + 360) % 360 - 180;
function noise(l, b, cells) {
  const x = (l / 360 + 2) * cells, y = (b + 90) / 360 * cells;
  const ix = Math.floor(x), iy = Math.floor(y);
  const smooth = v => v * v * (3 - 2 * v);
  const hash = (a, c) => { const n = Math.sin(((a % cells + cells) % cells) * 127.1 + c * 311.7) * 43758.5453; return n - Math.floor(n); };
  const u = smooth(x - ix), v = smooth(y - iy);
  return (hash(ix, iy) * (1-u) + hash(ix+1, iy)*u)*(1-v) + (hash(ix, iy+1)*(1-u)+hash(ix+1, iy+1)*u)*v;
}
function haze(l, b) {
  const center = Math.exp(-((wrap(l) / 27) ** 2 + (b / 13) ** 2) / 2);
  const band = Math.exp(-((b / 7) ** 2) / 2);
  const cloud = .25 + .45 * noise(l,b,48) + .3 * noise(l,b,144) + .18 * noise(l,b,432);
  const lane = 1.3 * Math.sin(l * rad * 4) + .7 * Math.sin(l * rad * 18);
  const dust = Math.exp(-(((b - lane) / (1.1 + .7 * (1 + Math.sin(l * rad * 6)))) ** 2) / 2) * (.65 + .25 * Math.sin(l * rad * 7) ** 2);
  return Math.max(0, (band * (.26 + .13 * Math.cos(l * rad)) + center * .65) * cloud * (1 - dust * .94));
}
export function initSky() {
  const header = document.querySelector('.header-center');
  header.outerHTML = '<nav class="view-tabs" aria-label="탐색 화면"><button id="scale-tab" aria-pressed="true">우주의 크기</button><button id="sky-tab" aria-pressed="false">태양계의 밤하늘</button></nav>';
  const panel = document.createElement('section');
  panel.id = 'sky-panel'; panel.hidden = true;
  panel.innerHTML = `
    <div class="sky-heading"><div><span class="sky-eyebrow">THE MILKY WAY · FROM WITHIN</span><h1>태양계의 밤하늘</h1><p>우리은하 안에서, 고개를 돌려보세요.</p></div><span class="sky-observer">관측 위치 고정<br><strong>태양계 · 국부팔</strong></span></div>
    <div class="sky-presets" role="group" aria-label="바라보는 방향"><button data-sky="center" aria-pressed="true">01 <strong>은하 중심</strong><span>궁수자리 방향</span></button><button data-sky="arm" aria-pressed="false">02 <strong>나선팔</strong><span>백조자리 방향</span></button><button data-sky="outer" aria-pressed="false">03 <strong>은하 바깥쪽</strong><span>반중심 방향</span></button></div>
    <div class="sky-viewport"><canvas id="sky-canvas" tabindex="0" aria-label="태양계에서 바라보는 은하수. 좌우 방향키 또는 드래그로 방향 변경"></canvas><div class="sky-view-label"><span id="sky-direction"></span><span>가시광선 · 은하면을 수평으로 정렬</span></div><div class="sky-reticle" aria-hidden="true">＋</div><div class="sky-view-bottom"><span id="sky-bearing"></span><span>드래그 또는 ← → 로 둘러보기</span></div></div>
    <div class="sky-controls"><label>바라보는 방향 <input id="sky-longitude" type="range" min="0" max="360" step="1" value="0"><output id="sky-angle">0°</output></label><label>시야각 <input id="sky-fov" type="range" min="45" max="110" value="90"><output id="sky-fov-value">90°</output></label><label class="sky-enhance"><input id="sky-enhance" type="checkbox" checked> 희미한 은하수 강조</label></div>
    <div class="sky-details"><article><span class="sky-eyebrow">WHAT YOU ARE SEEING</span><h2 id="sky-title"></h2><p id="sky-description"></p><p class="sky-model-note">별과 먼지의 분포를 단순화한 교육용 시뮬레이션입니다. 별 위치는 관측 목록이 아니며, 밝기는 상대 비교용입니다. 대기·달빛·광공해와 지평선은 생략했습니다. 실제 맨눈의 은하수는 더 희미하고 색이 옅습니다.</p></article><aside><canvas id="sky-map" width="300" height="210" aria-label="우리은하 위에서 본 태양계 위치와 시선 방향 개념도"></canvas><span>위에서 본 은하 · 시선 방향 개념도</span></aside></div>
    <div class="sky-sources">더 알아보기 <a href="https://www.nasa.gov/image-article/milky-way-our-location/" target="_blank" rel="noopener noreferrer">NASA · 태양계의 위치 ↗</a><a href="https://science.nasa.gov/photojournal/the-milky-way-center-aglow-with-dust/" target="_blank" rel="noopener noreferrer">NASA · 중심을 가리는 먼지 ↗</a></div>`;
  document.querySelector('#app').append(panel);
  const $ = id => document.getElementById(id);
  const canvas = $('sky-canvas'), ctx = canvas.getContext('2d');
  let longitude = 0, fov = 90, selected = 'center', active = false, pending = 0;
  let seed = 7391;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const stars = Array.from({ length: 15000 }, (_, i) => {
    const l = random() * 360, b = i < 4500 ? Math.asin(random() * 2 - 1) / rad : (random() + random() + random() - 1.5) * 15;
    return { l, b, brightness: random() ** 5, tint: random() };
  });
  const background = document.createElement('canvas'), bg = background.getContext('2d');
  function drawMap() {
    const c = $('sky-map').getContext('2d'); c.clearRect(0, 0, 300, 210);
    c.strokeStyle = '#89aeb440'; c.lineWidth = 8;
    for (let arm = 0; arm < 4; arm++) {
      c.beginPath();
      for (let t = 0; t < 170; t++) { const r = 8 + t * .49, a = t * .022 + arm * Math.PI / 2; const x = 140 + r * Math.cos(a), y = 102 + r * Math.sin(a); if (!t) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke();
    }
    c.fillStyle = '#e8c598'; c.beginPath(); c.arc(140, 102, 5, 0, Math.PI * 2); c.fill();
    const angle = Math.PI - longitude * rad, x = 194, y = 102;
    c.fillStyle = '#a5d9c21a'; c.beginPath(); c.moveTo(x, y); c.arc(x, y, 90, angle - fov * rad / 2, angle + fov * rad / 2); c.closePath(); c.fill();
    c.strokeStyle = '#a5d9c2'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x,y); c.lineTo(x + Math.cos(angle)*85, y + Math.sin(angle)*85); c.stroke();
    c.fillStyle = '#c4f4dd'; c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill(); c.font = '11px sans-serif'; c.fillText('태양계', x + 9, y + 19); c.fillStyle = '#cbb797'; c.fillText('중심', 115, 124);
  }
  function draw() {
    pending = 0; if (!active) return;
    const w = canvas.clientWidth, h = canvas.clientHeight, dpr = Math.min(devicePixelRatio, 1.5);
    if (!w || !h) return;
    canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0);
    const focal = w / (2 * Math.tan(fov * rad / 2));
    background.width = Math.min(720, Math.round(w)); background.height = Math.round(background.width*h/w);
    const pixels = bg.createImageData(background.width, background.height), boost = $('sky-enhance').checked ? 1 : .36;
    for (let y=0;y<background.height;y++) for(let x=0;x<background.width;x++) {
      const sx = (x/background.width-.5)*w/focal, sy = (.5-y/background.height)*h/focal;
      const l = longitude + Math.atan(sx)/rad, b = Math.atan(sy/Math.sqrt(1+sx*sx))/rad;
      const light = haze(l,b)*boost, i=(y*background.width+x)*4;
      const grain = 1;
      pixels.data[i]=5+light*112*grain; pixels.data[i+1]=9+light*116*grain; pixels.data[i+2]=15+light*125*grain; pixels.data[i+3]=255;
    }
    bg.putImageData(pixels,0,0); ctx.drawImage(background,0,0,w,h);
    for (const star of stars) {
      const dl = wrap(star.l-longitude)*rad, b=star.b*rad, z=Math.cos(b)*Math.cos(dl);
      if(z<=0) continue;
      const x=w/2+focal*Math.cos(b)*Math.sin(dl)/z, y=h/2-focal*Math.sin(b)/z;
      if(x<0||x>w||y<0||y>h) continue;
      const brightness = (.13+star.brightness*.83) * (star.brightness>.65 ? 1 : boost);
      ctx.fillStyle=`rgba(${star.tint>.8?'216,230,255':star.tint<.18?'255,232,201':'231,238,241'},${brightness})`;
      ctx.beginPath(); ctx.arc(x,y,.35+star.brightness*1.15,0,Math.PI*2); ctx.fill();
    }
    $('sky-bearing').textContent=`은경 ${Math.round(longitude)%360}° · 은위 0°`;
    $('sky-angle').textContent=`${Math.round(longitude)%360}°`; $('sky-longitude').value=longitude;
    $('sky-fov-value').textContent=`${fov}°`; drawMap();
  }
  const requestDraw = () => { if(!pending && active) pending=requestAnimationFrame(draw); };
  function choose(key) {
    selected=key; longitude=presets[key].l;
    $('sky-title').textContent=presets[key].title; $('sky-description').textContent=presets[key].text; $('sky-direction').textContent=presets[key].sub;
    panel.querySelectorAll('[data-sky]').forEach(button=>button.setAttribute('aria-pressed', String(button.dataset.sky===key))); requestDraw();
  }
  function point(l) {
    longitude=(l%360+360)%360; selected=null;
    panel.querySelectorAll('[data-sky]').forEach(button=>button.setAttribute('aria-pressed','false'));
    $('sky-direction').textContent='자유 탐색 · 태양계 시점'; $('sky-title').textContent='은하면을 따라 둘러보기';
    $('sky-description').textContent='은경 0°는 은하 중심, 약 80°는 백조자리 쪽 국부팔 방향, 180°는 중심 반대쪽입니다. 아래 은하 지도에서 현재 시선이 어디를 향하는지 확인해 보세요.'; requestDraw();
  }
  panel.querySelectorAll('[data-sky]').forEach(button=>button.addEventListener('click',()=>choose(button.dataset.sky)));
  $('sky-longitude').addEventListener('input',e=>point(Number(e.target.value)));
  $('sky-fov').addEventListener('input',e=>{ fov=Number(e.target.value); requestDraw(); });
  $('sky-enhance').addEventListener('change',requestDraw);
  let drag=null;
  canvas.addEventListener('pointerdown',e=>{ drag={ x:e.clientX, l:longitude }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove',e=>{ if(drag) point(drag.l-(e.clientX-drag.x)/canvas.clientWidth*fov); });
  for(const event of ['pointerup','pointercancel','lostpointercapture']) canvas.addEventListener(event,()=>{drag=null;});
  canvas.addEventListener('keydown',e=>{ if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();e.stopPropagation();point(longitude+(e.key==='ArrowRight'?5:-5));} });
  function setTab(sky) {
    active=sky; panel.hidden=!sky; document.body.classList.toggle('sky-active',sky);
    $('sky-tab').setAttribute('aria-pressed',String(sky)); $('scale-tab').setAttribute('aria-pressed',String(!sky));
    document.dispatchEvent(new CustomEvent('galaxy-view-change',{detail:{sky}})); requestDraw();
  }
  $('sky-tab').addEventListener('click',()=>{location.hash='sky';});
  $('scale-tab').addEventListener('click',()=>{location.hash='scale';});
  window.addEventListener('hashchange',()=>setTab(location.hash==='#sky'));
  new ResizeObserver(requestDraw).observe(canvas);
  choose('center'); setTab(location.hash==='#sky');
  window.skyDiagnostics=()=>({active, longitude, fov, selected, width:canvas.width, height:canvas.height});
}

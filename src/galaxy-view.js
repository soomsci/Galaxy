import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './galaxy-view.css';

export function initGalaxyView() {
  const panel = document.createElement('section');
  panel.id = 'galaxy-panel'; panel.hidden = true;
  panel.innerHTML = `
    <div class="sky-heading"><div><span class="sky-eyebrow">THE MILKY WAY · IN THREE DIMENSIONS</span><h1>우리은하를 사방에서</h1><p>납작한 별의 원반, 부풀어 오른 중심. 시선을 돌리면 구조가 보입니다.</p></div><span class="sky-observer">은하 중심 기준<br><strong>360° 자유 관찰</strong></span></div>
    <div class="galaxy-toolbar" role="group" aria-label="은하 관찰 시점"><button data-galaxy-view="oblique" aria-pressed="true">비스듬히</button><button data-galaxy-view="top" aria-pressed="false">위에서</button><button data-galaxy-view="side" aria-pressed="false">옆에서</button><button data-galaxy-view="bottom" aria-pressed="false">아래에서</button><button id="galaxy-reset">시점 초기화 ↺</button></div>
    <div id="galaxy-viewport"><div class="galaxy-canvas-label">우리은하 · 구조 개념도<span>드래그로 회전 · 휠 / 두 손가락으로 확대</span></div><div id="galaxy-sun-label" class="galaxy-label">태양계 <small>중심에서 약 2.6만 광년</small></div><div id="galaxy-center-label" class="galaxy-label galaxy-core-label">은하 중심</div><div id="galaxy-error" role="status" hidden></div><div class="galaxy-view-caption" id="galaxy-view-caption" aria-live="polite">비스듬히 · 원반과 중심부를 함께 관찰</div></div>
    <div class="galaxy-options"><label>확대 <input id="galaxy-zoom" type="range" min="0" max="100" value="40" aria-label="우리은하 확대 정도"></label><label><input type="checkbox" id="galaxy-labels" checked> 위치 표시</label><label><input type="checkbox" id="galaxy-auto"> 천천히 자동 회전</label></div>
    <div class="galaxy-facts"><article><span>01 · SPIRAL DISC</span><h2>나선팔과 원반</h2><p>위에서 보면 나선팔이, 옆에서 보면 얇은 원반이 드러납니다. 별 원반의 대표 지름은 약 10만 광년입니다.</p></article><article><span>02 · CENTRAL BULGE</span><h2>중심부와 막대</h2><p>우리은하는 막대나선은하입니다. 중심에는 별들이 밀집한 팽대부와 길쭉한 막대 구조가 있습니다.</p></article><article><span>03 · YOU ARE HERE</span><h2>태양계의 자리</h2><p>민트색 표시는 태양계입니다. 은하 중심에서 약 2.6만 광년 떨어진 국부팔 부근에 있습니다.</p></article></div>
    <p class="galaxy-note">실제 외부 촬영 사진이 아닌 교육용 3D 모형입니다. 나선팔의 모양·별의 색과 밀도·태양계 방향은 단순화했으며, 점과 위치 표시는 가독성을 위해 확대했습니다. 태양계는 원반의 중간 반지름 부근에 표시됩니다.</p>
    <div class="sky-sources"><a href="https://www.nasa.gov/image-article/milky-way-our-location/" target="_blank" rel="noopener noreferrer">NASA · 우리은하와 태양계의 위치 ↗</a><span>키보드: 화면에 초점을 두고 ← → ↑ ↓ 회전 · + − 확대 · Home 초기화</span></div>`;
  document.querySelector('#app').append(panel);
  const $ = id => document.getElementById(id), host = $('galaxy-viewport');
  let renderer, scene, camera, controls, frame = 0, active = false, lost = false, lastTime = 0;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const sunPosition = new THREE.Vector3(2.6, .015, 0), center = new THREE.Vector3();
  const views = { oblique: [9, 7, 10], top: [0, 15, .001], side: [0, .18, 15], bottom: [0, -15, .001] };
  const captions = { oblique:'비스듬히 · 원반과 중심부를 함께 관찰', top:'위에서 · 나선팔과 막대 구조', side:'옆에서 · 얇은 원반과 부푼 중심', bottom:'아래에서 · 반대편의 나선팔' };
  function invalidate() { if(active && renderer && !lost && !frame && !document.hidden) frame=requestAnimationFrame(draw); }
  function label(id, position) {
    const projected = position.clone().project(camera), el = $(id);
    el.hidden = !$('galaxy-labels').checked || projected.z < -1 || projected.z > 1 || Math.abs(projected.x) > .92 || Math.abs(projected.y) > .87;
    el.style.left = `${(projected.x*.5+.5)*host.clientWidth}px`;
    el.style.top = `${(-projected.y*.5+.5)*host.clientHeight}px`;
  }
  function draw(time) {
    frame=0; if(!active || lost) return;
    controls.autoRotate=$('galaxy-auto').checked && !reducedMotion.matches;
    const dt = lastTime ? Math.min((time-lastTime)/1000,.05) : 0;
    lastTime=time;
    controls.update(dt); renderer.render(scene,camera);
    label('galaxy-sun-label',sunPosition); label('galaxy-center-label',center);
    const distance=camera.position.length(); $('galaxy-zoom').value=100*(24-distance)/18;
    if(controls.autoRotate) invalidate();
  }
  function resize() {
    if(!renderer || !host.clientWidth || !active) return;
    renderer.setSize(host.clientWidth,host.clientHeight); camera.aspect=host.clientWidth/host.clientHeight; camera.updateProjectionMatrix(); invalidate();
  }
  function choose(view) {
    if(!camera) return;
    camera.position.set(...views[view]);
    if(host.clientWidth<600) camera.position.multiplyScalar(1.35);
    controls.target.set(0,0,0); controls.update();
    panel.querySelectorAll('[data-galaxy-view]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.galaxyView===view)));
    $('galaxy-view-caption').textContent=captions[view]; invalidate();
  }
  function freeView() {
    panel.querySelectorAll('[data-galaxy-view]').forEach(el=>el.setAttribute('aria-pressed','false'));
    $('galaxy-view-caption').textContent='자유 관찰 · 태양계 표시는 은하와 함께 회전합니다.';
  }
  function build() {
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
    renderer.setClearColor(0x060b12,1); host.prepend(renderer.domElement);
    renderer.domElement.tabIndex=0; renderer.domElement.setAttribute('aria-label','회전 가능한 우리은하 3D 모형');
    scene=new THREE.Scene(); camera=new THREE.PerspectiveCamera(48,1,.1,100);
    controls=new OrbitControls(camera,renderer.domElement); controls.enablePan=false; controls.enableDamping=false; controls.minDistance=6; controls.maxDistance=24; controls.autoRotateSpeed=.45;
    controls.addEventListener('change',invalidate); controls.addEventListener('start',()=>{ $('galaxy-auto').checked=false; freeView(); });
    let seed=5519; const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const positions=[],colors=[],sizes=[];
    const count=innerWidth<700?24000:45000;
    for(let i=0;i<count;i++) {
      const type=random(); let x,y,z;
      if(type<.2) {
        const r=Math.pow(random(),1.3)*1.1, az=random()*Math.PI*2, v=random()*2-1;
        x=Math.cos(az)*Math.sqrt(1-v*v)*r; z=Math.sin(az)*Math.sqrt(1-v*v)*r; y=v*r*.6;
      } else if(type<.3) {
        x=(random()+random()-1)*1.9; z=(random()+random()-1)*.3; y=(random()+random()-1)*.2;
      } else {
        const r=.65+Math.pow(random(),.7)*4.35;
        const arm=Math.floor(random()*4)*Math.PI/2;
        const a=arm+Math.log(r/.65)*1.65+(random()+random()-1)*(.16+r*.05);
        x=Math.cos(a)*r; z=Math.sin(a)*r; y=(random()+random()+random()-1.5)*(.075+.025*r);
        if(type>.92){const a=random()*Math.PI*2;x=Math.cos(a)*r;z=Math.sin(a)*r;}
      }
      positions.push(x,y,z);
      const warm=type<.3, tint=random();
      colors.push(warm?1:.48+tint*.35,warm?.66+tint*.18:.66+tint*.22,warm?.4+tint*.2:1);
      sizes.push(.7+random()**3*1.9);
    }
    const geometry=new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3)); geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3)); geometry.setAttribute('size',new THREE.Float32BufferAttribute(sizes,1));
    const material=new THREE.ShaderMaterial({vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:`attribute float size; varying vec3 tint; void main(){tint=color; vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(size*16./max(1.,-p.z),.65,5.);}`,fragmentShader:`varying vec3 tint; void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(tint,pow(1.-r,1.8)*.62);}`});
    scene.add(new THREE.Points(geometry,material));
    const sun=new THREE.Mesh(new THREE.SphereGeometry(.045,16,12),new THREE.MeshBasicMaterial({color:0xb9ffda}));sun.position.copy(sunPosition);scene.add(sun);
    const orbitPoints=Array.from({length:193},(_,i)=>{const a=i/192*Math.PI*2;return new THREE.Vector3(Math.cos(a)*2.6,0,Math.sin(a)*2.6);});
    const orbit=new THREE.Line(new THREE.BufferGeometry().setFromPoints(orbitPoints),new THREE.LineDashedMaterial({color:0x87cbb0,transparent:true,opacity:.23,dashSize:.08,gapSize:.07}));orbit.computeLineDistances();scene.add(orbit);
    renderer.domElement.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key))return;
      e.preventDefault(); e.stopPropagation(); $('galaxy-auto').checked=false;
      if(e.key==='Home'){choose('oblique');return;}
      const s=new THREE.Spherical().setFromVector3(camera.position);
      if(e.key==='ArrowLeft')s.theta-=.12;if(e.key==='ArrowRight')s.theta+=.12;if(e.key==='ArrowUp')s.phi-=.12;if(e.key==='ArrowDown')s.phi+=.12;
      if(e.key==='+'||e.key==='=')s.radius*=.9;if(e.key==='-')s.radius*=1.1;
      s.radius=THREE.MathUtils.clamp(s.radius,6,24);s.makeSafe();camera.position.setFromSpherical(s);controls.update();freeView();invalidate();
    });
    renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;$('galaxy-error').hidden=false;$('galaxy-error').textContent='3D 연결이 중단되었습니다. 복구를 기다리거나 새로고침해 주세요.';});
    renderer.domElement.addEventListener('webglcontextrestored',()=>{lost=false;$('galaxy-error').hidden=true;invalidate();});
    resize(); choose('oblique');
  }
  panel.querySelectorAll('[data-galaxy-view]').forEach(el=>el.addEventListener('click',()=>{$('galaxy-auto').checked=false;choose(el.dataset.galaxyView);}));
  $('galaxy-reset').addEventListener('click',()=>{$('galaxy-auto').checked=false;choose('oblique');});
  $('galaxy-zoom').addEventListener('input',e=>{if(camera){camera.position.setLength(24-Number(e.target.value)*.18);controls.update();invalidate();}});
  $('galaxy-labels').addEventListener('change',invalidate); $('galaxy-auto').addEventListener('change',invalidate);
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)$('galaxy-auto').checked=false;invalidate();});
  function route(){active=location.hash==='#galaxy';panel.hidden=!active;if(active&&!renderer){try{build();}catch(error){$('galaxy-error').hidden=false;$('galaxy-error').textContent='이 환경에서 3D 화면을 시작할 수 없습니다. WebGL 지원 브라우저에서 다시 열어 주세요.';console.warn(error);}}if(active)resize();else{cancelAnimationFrame(frame);frame=0;$('galaxy-auto').checked=false;}}
  window.addEventListener('hashchange',route); new ResizeObserver(resize).observe(host);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else invalidate();});
  window.addEventListener('pagehide',e=>{if(e.persisted)return;cancelAnimationFrame(frame);controls?.dispose();scene?.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});renderer?.dispose();});
  window.galaxyViewDiagnostics=()=>({active,renderer:Boolean(renderer),camera:camera?.position.toArray(),auto:$('galaxy-auto').checked,points:renderer?.info.render.points});
  route();
}

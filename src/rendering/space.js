import * as THREE from 'three';
import { AU, LY, projectMeters, visibility, smoothstep } from '../core/scale.js';
import { bodies, byId, planetPosition } from '../data/universe.js';

function randomGenerator(seed = 7919) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; };
}

function pointCloud(positions, colors, size = 2, opacity = 1) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.ShaderMaterial({
    uniforms: { pointSize: { value: size }, alpha: { value: opacity } },
    vertexShader: `varying vec3 vColor; uniform float pointSize;
      void main(){ vColor=color; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); gl_PointSize=pointSize; }`,
    fragmentShader: `varying vec3 vColor; uniform float alpha;
      void main(){ float r=length(gl_PointCoord-.5)*2.; if(r>1.) discard;
      gl_FragColor=vec4(vColor, pow(1.-r,1.4)*alpha); }`,
    transparent: true, depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending,
  });
  material.userData.baseAlpha = opacity;
  return new THREE.Points(geometry, material);
}

function makeOortCloud(seed, count) {
  const random = randomGenerator(seed), positions = [], colors = [];
  for (let i = 0; i < count; i++) {
    const z = random() * 2 - 1;
    const angle = random() * Math.PI * 2;
    const radius = .34 + Math.pow(random(), .38) * .16;
    const spread = Math.sqrt(1 - z * z);
    positions.push(Math.cos(angle) * spread * radius, Math.sin(angle) * spread * radius, z * radius);
    const tint = .72 + random() * .25;
    colors.push(.53 * tint, .72 * tint, .78 * tint);
  }
  const group = new THREE.Group();
  group.add(pointCloud(positions, colors, 2.05, .6));
  const circlePoints = Array.from({ length: 193 }, (_, index) => {
    const angle = index / 192 * Math.PI * 2;
    return new THREE.Vector3(Math.cos(angle) * .5, Math.sin(angle) * .5, 0);
  });
  for (const [rotationX, rotationY] of [[0, 0], [1.04, 0], [0, 1.04]]) {
    const material = new THREE.LineBasicMaterial({ color: '#86aeb5', opacity: .12, transparent: true, depthWrite: false });
    material.userData.baseOpacity = .12;
    const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(circlePoints), material);
    ring.rotation.set(rotationX, rotationY, 0);
    group.add(ring);
  }
  return group;
}

function makeGalaxy(seed, count) {
  const random = randomGenerator(seed), positions = [], colors = [];
  for (let i = 0; i < count; i++) {
    const bulge = random() < .23;
    const radius = bulge ? random() ** 1.5 * .19 : Math.sqrt(random()) * .5;
    const arm = Math.floor(random() * 4) * Math.PI / 2;
    const angle = bulge ? random() * Math.PI * 2 : arm + radius * 11 + (random() - .5) * (.3 + radius * .6);
    const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
    const thickness = (random() - .5) * (bulge ? .12 : .018) * (1 - radius);
    positions.push(x, y * .48 + thickness * .88, y * .88 - thickness * .48);
    const color = new THREE.Color().setRGB(bulge ? .95 : .5 + random() * .35, bulge ? .78 : .57 + random() * .24, bulge ? .6 : .95);
    colors.push(color.r, color.g, color.b);
  }
  return pointCloud(positions, colors, 2.4, .9);
}

function makeWeb(seed, count) {
  const random = randomGenerator(seed), nodes = [], positions = [], colors = [];
  for (let i = 0; i < 90; i++) {
    const v = new THREE.Vector3(random() - .5, random() - .5, random() - .5);
    if (v.length() > .49) { i--; continue; }
    nodes.push(v);
  }
  const edges = [];
  nodes.forEach((node, i) => {
    const nearest = nodes.map((other, j) => ({ j, d: node.distanceTo(other) })).filter(n => n.j !== i).sort((a, b) => a.d - b.d).slice(0, 3);
    nearest.forEach(n => { if (n.j > i) edges.push([node, nodes[n.j]]); });
  });
  for (let i = 0; i < count; i++) {
    const [a, b] = edges[Math.floor(random() * edges.length)];
    const t = random(), spread = .003 + Math.sin(t * Math.PI) * .006;
    const v = a.clone().lerp(b, t);
    v.x += (random() - .5) * spread * 3;
    v.y += (random() - .5) * spread * 3;
    v.z += (random() - .5) * spread * 3;
    positions.push(v.x, v.y, v.z);
    const warm = random() > .5;
    colors.push(warm ? .91 : .55, warm ? .68 : .7, warm ? .48 : .97);
  }
  return pointCloud(positions, colors, 2.1, .85);
}

export function createSpace(container, { onInvalidate, onError, lowQuality = false }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'default' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowQuality ? 1 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute('aria-label', '지구를 중심으로 확대·축소하는 3D 우주');
  renderer.domElement.setAttribute('role', 'img');
  container.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-5, 5, 3, -3, .1, 400);
  camera.position.z = 100;
  scene.add(new THREE.AmbientLight(0xbed5ec, .8));
  const light = new THREE.DirectionalLight(0xfff4de, 3);
  light.position.set(-4, 3, 7);
  scene.add(light);

  const sphereGeometry = new THREE.SphereGeometry(1, 64, 40);
  const planets = bodies.filter(b => b.kind === 'planet' || b.id === 'sun').map(body => {
    const material = body.id === 'sun'
      ? new THREE.MeshBasicMaterial({ color: '#ffd599' })
      : new THREE.MeshStandardMaterial({ color: body.id === 'earth' ? '#ffffff' : body.color, roughness: .92, metalness: .02 });
    const mesh = new THREE.Mesh(sphereGeometry, material);
    mesh.rotation.y = body.id === 'earth' ? 2.7 : .3;
    mesh.rotation.z = body.id === 'earth' ? .12 : 0;
    if (body.id === 'saturn') {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.28, 2.05, 64),
        new THREE.MeshBasicMaterial({ color: '#d8c9a4', transparent: true, opacity: .72, side: THREE.DoubleSide, depthWrite: false }),
      );
      ring.rotation.x = .42;
      ring.rotation.y = -.2;
      mesh.add(ring);
    }
    scene.add(mesh);
    return { body, mesh, position: planetPosition(body) };
  });
  const earth = planets[0].mesh;
  let texture;
  new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}assets/earth-blue-marble.png`, loaded => {
    texture = loaded;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    earth.material.map = texture;
    earth.material.needsUpdate = true;
    onInvalidate();
  }, undefined, () => { earth.material.color.set('#438a9d'); onError('지구 표면 이미지를 불러오지 못해 기본 재질로 표시합니다.'); onInvalidate(); });

  const atmosphere = new THREE.Mesh(sphereGeometry, new THREE.ShaderMaterial({
    vertexShader: `varying vec3 vNormal; void main(){vNormal=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec3 vNormal; uniform float alpha; void main(){ float rim=pow(1.-abs(vNormal.z),3.8); gl_FragColor=vec4(.23,.64,1.,rim*.65*alpha); }`,
    uniforms: { alpha: { value: 1 } }, transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(atmosphere);

  const orbitLines = bodies.filter(b => b.orbitAU > 0).map(body => {
    const points = Array.from({ length: 193 }, (_, i) => {
      const angle = i / 192 * Math.PI * 2;
      return new THREE.Vector3(Math.cos(angle), Math.sin(angle) * .65, Math.sin(angle) * Math.sqrt(1 - .65 ** 2));
    });
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: '#788588', transparent: true, opacity: .16, depthWrite: false }));
    scene.add(line);
    return { body, line };
  });

  const random = randomGenerator(23), starsPositions = [], starsColors = [];
  const starCount = lowQuality ? 1800 : 4500;
  for (let i = 0; i < starCount; i++) {
    const nearby = i < starCount * .38;
    const radius = nearby ? .8 + Math.pow(random(), .72) * 42 : 10 ** (1.35 + random() * 3.25);
    const a = random() * Math.PI * 2, z = random() * 2 - 1;
    starsPositions.push(radius * Math.sqrt(1 - z * z) * Math.cos(a), radius * Math.sqrt(1 - z * z) * Math.sin(a), radius * z);
    starsColors.push(.65 + random() * .35, .7 + random() * .3, .85 + random() * .15);
  }
  const stars = pointCloud(starsPositions, starsColors, 2.6, .8);
  scene.add(stars);
  const nearbyStarData = [
    { name: '프록시마 센타우리', distance: 4.25, position: [3.55, -1.8, .4], color: [1, .5, .34] },
    { name: '시리우스', distance: 8.6, position: [-6.3, 4.65, 1.2], color: [.72, .84, 1] },
    { name: '엡실론 에리다니', distance: 10.5, position: [7.5, 5.7, -2.4], color: [1, .78, .46] },
    { name: '프로키온', distance: 11.5, position: [-8.2, -6.1, 1.8], color: [.92, .96, 1] },
  ];
  const nearbyStars = pointCloud(nearbyStarData.flatMap(star => star.position), nearbyStarData.flatMap(star => star.color), 7, 1);
  scene.add(nearbyStars);
  const milkyway = makeGalaxy(41, lowQuality ? 9000 : 21000);
  scene.add(milkyway);
  const andromeda = makeGalaxy(91, lowQuality ? 3500 : 7500);
  andromeda.rotation.z = .6;
  scene.add(andromeda);
  const satelliteGalaxies = Array.from({ length: 14 }, (_, i) => {
    const galaxy = makeGalaxy(300 + i, 200);
    const angle = random() * Math.PI * 2;
    const distance = (.15 + random() * 4.2) * 1e6 * LY;
    const position = [Math.cos(angle) * distance, Math.sin(angle) * distance * .65, Math.sin(angle) * distance * .4];
    galaxy.rotation.z = random() * 6;
    scene.add(galaxy);
    return { galaxy, position, diameter: (12000 + random() * 30000) * LY };
  });
  const oort = makeOortCloud(177, lowQuality ? 850 : 1900);
  scene.add(oort);
  const web = makeWeb(711, lowQuality ? 9000 : 22000);
  const cosmic = makeWeb(914, lowQuality ? 13000 : 28000);
  scene.add(web, cosmic);
  const boundary = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const points = Array.from({ length: 193 }, (_, j) => {
      const a = j / 192 * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * .5, Math.sin(a) * .5, 0);
    });
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: '#799db0', transparent: true, opacity: .22, depthWrite: false }));
    if (i === 1) line.rotation.x = 1.1;
    if (i === 2) line.rotation.y = 1.1;
    boundary.add(line);
  }
  scene.add(boundary);
  let width = 1, height = 1, lost = false;
  const lostHandler = event => { event.preventDefault(); lost = true; onError('3D 화면 연결이 잠시 중단되었습니다. 크기 정보는 계속 볼 수 있습니다. 복구되지 않으면 새로고침해주세요.'); };
  const restoreHandler = () => { lost = false; onError(''); onInvalidate(); };
  renderer.domElement.addEventListener('webglcontextlost', lostHandler);
  renderer.domElement.addEventListener('webglcontextrestored', restoreHandler);

  function setObject(object, diameter, position, zoom, alpha) {
    const scale = projectMeters(diameter, zoom, 10);
    object.visible = alpha > .002 && scale > .00005 && scale < 5000;
    if (!object.visible) return;
    object.scale.setScalar(scale);
    object.position.set(...position.map(value => projectMeters(value, zoom, 10)));
    object.traverse(child => {
      const material = child.material;
      if (!material) return;
      if (material.uniforms?.alpha) material.uniforms.alpha.value = (material.userData.baseAlpha ?? 1) * alpha;
      else if (material.transparent) {
        if (material.userData.baseOpacity === undefined) material.userData.baseOpacity = material.opacity;
        material.opacity = material.userData.baseOpacity * alpha;
      }
    });
  }

  return {
    resize() {
      width = container.clientWidth; height = container.clientHeight;
      renderer.setSize(width, height);
      camera.top = 5 * height / width; camera.bottom = -camera.top;
      camera.updateProjectionMatrix();
    },
    render(zoom) {
      if (lost) return [];
      const labels = [];
      for (const { body, mesh, position } of planets) {
        const radius = projectMeters(body.diameter / 2, zoom, 10);
        const screenDiameter = projectMeters(body.diameter, zoom, width);
        const markerRadiusPixels = body.id === 'sun' ? 7 : body.id === 'saturn' ? 5.5 : 4;
        const markerRadius = markerRadiusPixels * 10 / width;
        const visualRadius = Math.max(radius, markerRadius);
        const visible = zoom < 15.2 && visualRadius < 30;
        mesh.visible = visible;
        if (visible) {
          mesh.scale.setScalar(visualRadius);
          mesh.position.set(...position.map(m => projectMeters(m, zoom, 10)));
        }
        if (body.id === 'earth') {
          atmosphere.visible = visible;
          atmosphere.scale.setScalar(visualRadius * 1.026);
        }
        if (zoom < 14.9 && (body.id !== 'earth' || zoom > 8)) {
          labels.push({ id: body.id, name: body.name, position, pixels: Math.max(screenDiameter, markerRadiusPixels * 2), color: body.color });
        }
      }
      for (const { body, line } of orbitLines) {
        const radius = projectMeters(body.orbitAU * AU, zoom, 10);
        line.visible = zoom > 10.3 && zoom < 14.9 && radius < 18 && radius > .04;
        if (line.visible) {
          line.scale.setScalar(radius);
          line.position.x = projectMeters(-AU, zoom, 10);
          line.material.opacity = .19 * visibility(zoom, 10.8, 14.2);
        }
      }
      setObject(oort, byId.oort.diameter, [-AU, 0, 0], zoom, visibility(zoom, 14.8, 17.2));
      setObject(stars, LY, [0, 0, 0], zoom, visibility(zoom, 16, 19.9));
      setObject(nearbyStars, LY, [0, 0, 0], zoom, visibility(zoom, 16.35, 18.35));
      setObject(milkyway, byId.milkyway.diameter, [-26000 * LY, 0, 0], zoom, visibility(zoom, 19.15, 23.3));
      setObject(andromeda, byId.andromeda.diameter, [2.15e6 * LY, .85e6 * LY, .95e6 * LY], zoom, visibility(zoom, 21.7, 23.7));
      satelliteGalaxies.forEach(({ galaxy, position, diameter }) => setObject(galaxy, diameter, position, zoom, visibility(zoom, 22.15, 23.8)));
      setObject(web, byId.laniakea.diameter, [-.08 * byId.laniakea.diameter, 0, 0], zoom, visibility(zoom, 23.9, 25.9));
      setObject(cosmic, byId.universe.diameter, [0, 0, 0], zoom, smoothstep(25.6, 26.6, zoom));
      setObject(boundary, byId.universe.diameter, [0, 0, 0], zoom, smoothstep(26.3, 26.8, zoom));
      if (zoom > 15.5 && zoom < 18.2) labels.push({ id: 'oort', name: '오르트 구름', position: [byId.oort.diameter * .48, 0, 0], color: '#aac2cf', pixels: 0 });
      if (zoom > 16.75 && zoom < 18.45) {
        nearbyStarData.forEach(star => labels.push({ id: star.name, name: `${star.name} · ${star.distance}광년`, position: star.position.map(value => value * LY), color: '#c9dbe2', pixels: 0 }));
      }
      if (zoom > 20 && zoom < 22.5) labels.push({ id: 'galactic-center', name: '은하 중심', position: [-26000 * LY, 0, 0], color: '#d6c7ab', pixels: 0 });
      if (zoom > 22 && zoom < 23.7) labels.push({ id: 'andromeda', name: '안드로메다', position: [2.15e6 * LY, .85e6 * LY, .95e6 * LY], color: '#cbbced', pixels: 0 });
      renderer.render(scene, camera);
      return labels.map(label => ({ ...label, x: width / 2 + projectMeters(label.position[0], zoom, width), y: height / 2 - projectMeters(label.position[1], zoom, width) }));
    },
    setQuality(low) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, low ? 1 : 1.75));
      renderer.setSize(width, height);
      [stars, nearbyStars, milkyway, andromeda, web, cosmic].forEach(points => points.geometry.setDrawRange(0, Math.floor(points.geometry.attributes.position.count * (low ? .5 : 1))));
    },
    getStats() { return { ...renderer.info.memory, calls: renderer.info.render.calls, points: renderer.info.render.points }; },
    dispose() {
      renderer.domElement.removeEventListener('webglcontextlost', lostHandler);
      renderer.domElement.removeEventListener('webglcontextrestored', restoreHandler);
      const geometries = new Set(), materials = new Set();
      scene.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) materials.add(object.material); });
      geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose());
      texture?.dispose(); renderer.dispose(); renderer.domElement.remove();
    },
  };
}

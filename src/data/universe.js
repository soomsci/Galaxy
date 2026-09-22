import { AU, LY } from '../core/scale.js';

export const sources = {
  planets: { title: 'NASA · Planetary Fact Sheet', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/' },
  sun: { title: 'NASA · Sun Facts', url: 'https://science.nasa.gov/sun/facts/' },
  oort: { title: 'NASA · Oort Cloud Facts', url: 'https://science.nasa.gov/solar-system/oort-cloud/facts/' },
  milkyway: { title: 'NASA · How Big is Space?', url: 'https://science.nasa.gov/universe/exoplanets/our-milky-way-galaxy-how-big-is-space/' },
  group: { title: 'NASA · The Local Group', url: 'https://imagine.gsfc.nasa.gov/features/cosmic/local_group_info.html' },
  andromeda: { title: 'ESA · Spiral galaxies', url: 'https://cesar.esa.int/upload/202011/esasky_teacher_guide_onlinesse22.pdf' },
  magellanic: { title: 'ESA · The Magellanic Clouds', url: 'https://www.esa.int/ESA_Multimedia/Images/2015/09/The_Magellanic_Clouds_and_an_interstellar_filament' },
  triangulum: { title: 'NASA · Triangulum Galaxy', url: 'https://science.nasa.gov/missions/webb/peering-into-the-tendrils-of-ngc-604-with-nasas-webb/' },
  sagittarius: { title: 'NASA · Messier 54', url: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-54/' },
  laniakea: { title: 'University of Hawaiʻi · Laniakea', url: 'https://manoa.hawaii.edu/news/article.php?aId=6711' },
  universe: { title: 'NASA · How Big is Space? (2025)', url: 'https://www.nasa.gov/science-research/astrophysics/how-big-is-space-we-asked-a-nasa-expert-episode-61/' },
};

const planet = (id, name, english, diameterKm, color, orbitAU, phase) => ({
  id, name, english, diameter: diameterKm * 1000, value: diameterKm.toLocaleString('ko-KR'), unit: 'km',
  measure: id === 'moon' ? '평균 지름' : '적도 지름', color, orbitAU, phase, source: 'planets', kind: 'planet',
});

export const bodies = [
  planet('earth', '지구', 'EARTH', 12756, '#83cfc6', 1, 0),
  planet('moon', '달', 'MOON', 3475, '#b3b6bf', 0, 0),
  { id: 'sun', name: '태양', english: 'SUN', diameter: 1.4e9, value: '140만', unit: 'km', measure: '지름 · 약', color: '#edbe75', source: 'sun', kind: 'star' },
  planet('mercury', '수성', 'MERCURY', 4879, '#aea299', 0.387, 2.2),
  planet('venus', '금성', 'VENUS', 12104, '#d5b892', 0.723, 4.5),
  planet('mars', '화성', 'MARS', 6792, '#d18d76', 1.524, 1),
  planet('jupiter', '목성', 'JUPITER', 142984, '#d4b69a', 5.203, 5.5),
  planet('saturn', '토성', 'SATURN', 120536, '#d1c09b', 9.537, 2.5),
  planet('uranus', '천왕성', 'URANUS', 51118, '#9bd5d9', 19.191, 4),
  planet('neptune', '해왕성', 'NEPTUNE', 49528, '#7896df', 30.07, 0.7),
  planet('pluto', '명왕성', 'PLUTO', 2376, '#c0aaa0', 39.48, 3.5),
  { id: 'earthmoon', name: '지구에서 달까지', english: 'EARTH → MOON', diameter: 384400000, value: '384,400', unit: 'km', measure: '평균 중심 간 거리', color: '#a6bcbf', source: 'planets', kind: 'distance' },
  { id: 'au', name: '지구에서 태양까지', english: 'ONE ASTRONOMICAL UNIT', diameter: AU, value: '1억 4,960만', unit: 'km', measure: '평균 거리 · 약 1 AU', color: '#edbe75', source: 'planets', kind: 'distance' },
  { id: 'solar', name: '해왕성 궤도', english: 'NEPTUNE ORBIT', diameter: 60.14 * AU, value: '60.14', unit: 'AU', measure: '궤도 지름 · 약', color: '#c7b393', source: 'planets', kind: 'structure' },
  { id: 'oort', name: '오르트 구름', english: 'OORT CLOUD', diameter: 200000 * AU, value: '3.16', unit: '광년', measure: '외곽 지름 추정 상한 · 약', color: '#b6cbd1', source: 'oort', kind: 'structure' },
  { id: 'lightyear', name: '빛이 1년 동안 가는 거리', english: 'ONE LIGHT-YEAR', diameter: LY, value: '9조 4,607억', unit: 'km', measure: '1광년 · 약', color: '#87cfc0', source: 'milkyway', kind: 'distance' },
  { id: 'milkyway', name: '우리은하', english: 'MILKY WAY', diameter: 100000 * LY, value: '10만', unit: '광년', measure: '별 원반 지름 · 약', color: '#bdb7ec', source: 'milkyway', kind: 'galaxy' },
  { id: 'andromeda', name: '안드로메다은하', english: 'ANDROMEDA', diameter: 220000 * LY, value: '22만', unit: '광년', measure: '대표 지름 · 약', color: '#d4bbdf', source: 'andromeda', kind: 'galaxy' },
  { id: 'group', name: '국부은하군', english: 'LOCAL GROUP', diameter: 1e7 * LY, value: '1,000만', unit: '광년', measure: '분포 범위 · 약', color: '#b8c7e8', source: 'group', kind: 'structure' },
  { id: 'laniakea', name: '라니아케아', english: 'LANIAKEA', diameter: 5e8 * LY, value: '5억', unit: '광년', measure: '대표 범위 · 약', color: '#d9b894', source: 'laniakea', kind: 'structure' },
  { id: 'universe', name: '관측 가능한 우주', english: 'OBSERVABLE UNIVERSE', diameter: 92e9 * LY, value: '920억', unit: '광년', measure: '현재 거리 기준 지름 · 약', color: '#b5ccdf', source: 'universe', kind: 'structure' },
];
export const byId = Object.fromEntries(bodies.map(body => [body.id, body]));

export const stages = [
  { id: 'earth', name: '지구', english: 'OUR PALE BLUE DOT', start: 7.4, zoom: 7.65, focus: 'earth', cards: ['earth', 'moon', 'sun'], description: '우리의 모든 이야기가 시작되는 곳.\n이 작은 푸른 행성에서 우주로 떠나보세요.', context: '지구', note: '천체의 크기는 실제 축척입니다. 배경 별은 장식입니다.' },
  { id: 'moon', name: '지구와 달', english: 'OUR CLOSEST NEIGHBOR', start: 8.25, zoom: 9.12, focus: 'earthmoon', cards: ['moon', 'earth', 'earthmoon'], description: '가장 가까운 이웃도 꽤 멀리 있습니다.\n지구와 달 사이에는 지구 약 30개가 들어갑니다.', context: '지구 근방', note: '달의 거리는 평균값, 방향은 예시입니다. 너무 작아진 천체는 형태를 볼 수 있도록 확대 표시합니다.' },
  { id: 'solar', name: '태양계', english: 'A FAMILY AROUND A STAR', start: 10.3, zoom: 13.35, focus: 'solar', cards: ['sun', 'jupiter', 'solar'], description: '하나의 별, 여덟 개의 행성.\n익숙한 이웃 사이에도 거대한 빈 공간이 있습니다.', context: '태양계', note: '행성은 평균 궤도 반지름에 배치한 예시입니다. 작은 천체의 3D 마커는 실제 크기보다 확대되어 있습니다.' },
  { id: 'stars', name: '별과 별 사이', english: 'INTO INTERSTELLAR SPACE', start: 14.35, zoom: 17.25, focus: 'oort', cards: ['oort', 'lightyear', 'sun'], description: '이제 거리를 빛의 시간으로 읽습니다.\n태양계는 광활한 별의 바다 속 작은 점이 됩니다.', context: '태양 주변', note: '오르트 구름은 추정 구조입니다. 별의 위치와 색은 개념도이며 크기는 확대 마커입니다.' },
  { id: 'galaxy', name: '우리은하', english: 'ONE HUNDRED BILLION SUNS', start: 18.65, zoom: 21.45, focus: 'milkyway', cards: ['milkyway', 'oort', 'lightyear'], description: '우리는 은하의 중심에 있지 않습니다.\n나선팔 한쪽에서 이 거대한 별의 도시를 바라봅니다.', context: '우리은하', note: '나선팔과 별 분포는 개념도입니다. 태양계는 은하 중심에서 약 2.6만 광년 떨어져 있습니다.' },
  { id: 'group', name: '국부은하군', english: 'GALAXIES HAVE NEIGHBORS, TOO', start: 22.05, zoom: 23.05, focus: 'group', cards: ['group', 'andromeda', 'milkyway'], description: '우리 곁에는 작은 위성은하들이 먼저 있습니다.\n지금 보는 안드로메다의 빛은 250만 년 전에 출발했습니다.', context: '국부은하군', note: '주요 은하의 거리와 은하 좌표는 실제 비율입니다. 작은 은하의 표시 크기는 알아보기 쉽게 조정했습니다.' },
  { id: 'web', name: '라니아케아', english: 'THE COSMIC WEB', start: 24.05, zoom: 25.2, focus: 'laniakea', cards: ['laniakea', 'group', 'milkyway'], description: '은하들은 중력의 강을 따라 한 방향으로 모입니다.\n라니아케아는 그 흐름으로 정의한 우리의 초은하단입니다.', context: '라니아케아', note: '수렴하는 필라멘트는 은하 흐름을 설명하는 개념도이며 실제 관측 지도가 아닙니다.' },
  { id: 'universe', name: '관측 가능한 우주', english: 'THE EDGE OF WHAT WE CAN SEE', start: 26.05, zoom: 27.4, focus: 'universe', cards: ['universe', 'laniakea', 'milkyway'], description: '수많은 초은하단이 모든 방향에 펼쳐집니다.\n구형 경계는 우주의 끝이 아니라 우리의 관측 한계입니다.', context: '관측 가능한 우주', note: '푸른 입자는 균일한 대규모 분포를 나타낸 개념도입니다. 현재 거리 기준 범위이며 우주의 나이와는 다른 값입니다.' },
];

export function planetPosition(body, orbitTime = 0) {
  if (body.id === 'earth') return [0, 0, 0];
  if (body.id === 'moon') return [384400000 * 0.92, 384400000 * 0.3, 384400000 * Math.sqrt(1 - .92 ** 2 - .3 ** 2)];
  if (body.id === 'sun') return [-AU, 0, 0];
  const angle = body.phase + orbitTime / body.orbitAU ** 1.5;
  return [(body.orbitAU * Math.cos(angle) - 1) * AU, Math.sin(angle) * body.orbitAU * AU * .65, Math.sin(angle) * body.orbitAU * AU * Math.sqrt(1 - .65 ** 2)];
}

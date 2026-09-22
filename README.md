# Galaxy

지구에서 관측 가능한 우주까지 탐색하는 Three.js 기반 웹앱입니다. 각 단계의 천체 지름과 구조의 범위를 화면 아래 카드에서 확인할 수 있습니다.

## 실행

```sh
npm ci
npm run dev
```

## 빌드

```sh
npm run build
npm run preview
```

## 조작

- 휠, 우측 슬라이더, `↑` / `↓`: 확대·축소
- 상단 단계 버튼, `←` / `→`: 단계 이동
- `Home` / `End`: 지구 / 관측 가능한 우주
- 모바일: 핀치 또는 한 손가락으로 위아래 드래그
- 하단 축척: 현재 화면 폭과 빛이 건너는 데 걸리는 시간
- 하단 카드: 크기 설명과 데이터 출처
- 탐색 안내: ‘실제 크기로 보기’로 확대 마커 해제

행성은 실제 크기 축척을 사용합니다. 위치 마커와 카드 그림은 실제 크기가 아니며, 은하와 거대구조 분포는 학습용 개념도입니다. 천체 데이터 출처는 앱의 탐색 안내와 각 카드에 표시됩니다.

지구 이미지: NASA / Reto Stöckli, [Blue Marble](https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/).

## 검증 명령

상단의 **태양계의 밤하늘** 탭에서는 은하 중심(0°), 백조자리 쪽 국부팔(약 80°), 반중심(180°) 방향을 비교할 수 있습니다. 드래그·좌우 방향키·슬라이더로 은경을 바꾸고, 시야각과 은하수 강조를 조절합니다. `/#sky`로 바로 열 수 있습니다.

밤하늘은 관측 별 목록이나 특정 장소·날짜를 재현하지 않는 가시광선 교육용 모델입니다. 태양계 시점을 고정한 채 별빛과 먼지 띠의 상대적인 모습을 비교하며, 대기·달빛·광공해는 생략합니다. 화면 안에 NASA의 태양계 위치 및 성간 먼지 설명 출처를 제공합니다.

```sh
npm test
npm run check:browser
node scripts/check-sky.mjs
```

브라우저 검증은 개발 서버가 실행 중이어야 하며 기본적으로 macOS의 Google Chrome을 사용합니다. 다른 환경에서는 `CHROME_PATH`와 `BASE_URL`을 지정하세요.

`master` 브랜치에 푸시하면 GitHub Actions가 테스트와 Vite 빌드를 실행하고 `dist`를 GitHub Pages에 배포합니다.

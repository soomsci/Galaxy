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
- 하단 카드: 크기 설명과 데이터 출처

행성은 실제 크기 축척을 사용합니다. 위치 마커와 카드 그림은 실제 크기가 아니며, 은하와 거대구조 분포는 학습용 개념도입니다. 천체 데이터 출처는 앱의 탐색 안내와 각 카드에 표시됩니다.

지구 이미지: NASA / Reto Stöckli, [Blue Marble](https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/).

## 검증 명령

```sh
npm test
npm run check:browser
```

브라우저 검증은 개발 서버가 실행 중이어야 하며 기본적으로 macOS의 Google Chrome을 사용합니다. 다른 환경에서는 `CHROME_PATH`와 `BASE_URL`을 지정하세요.

현재 상태: 핵심 로직 테스트 7개 통과. 브라우저 검증 및 수정된 빌드 설정의 재실행은 수행하지 않았습니다. 사용자 직접 검토 예정입니다.

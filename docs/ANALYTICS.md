# Google Analytics 4

모든 책은 GA4 웹 스트림 하나와 공개 측정 ID `G-LST8C5WL08`을 공유한다. 태그와 기존 Cloudflare 비콘 제거는 `src/analytics.js`에서 관리한다. `build`는 원본 HTML을 유지하고 배포물에만 GA4 태그 한 개를 넣는다. 별도 Node 빌드에서는 `@euiyun/book/analytics`의 `analyticsTag`와 `stripAnalytics`를 사용한다.

책별 통계는 GA4의 hostname과 페이지 경로로 구분한다. 같은 도메인 아래 여러 책이 있는 서가는 경로도 함께 사용한다. ## 실험 이벤트

`runtime/experiments.js`(v0.5.0)를 켠 책은 페이지뷰 외에 실험(`.sim[id]`)별 이벤트 세 가지를 보낸다. 책마다 `<script defer src=".../experiments.js" data-book="<책 id>"></script>`로 켠다. `data-book`은 허브 `books.json`의 책 ID(`memorybook` 등)다.

| 이벤트 | 조건 | 읽는 법 |
|---|---|---|
| `experiment_view` | 실험의 절반(또는 화면 절반) 이상이 1초 이상 보임 | 분모. 지나쳐 스크롤한 실험은 세지 않는다 |
| `experiment_start` | 처음 슬라이더·버튼·캔버스를 조작함 | 시작률 = start / view |
| `experiment_explore` | 서로 다른 조작 요소를 세 개 이상 씀 | 실제로 비교·탐색한 비율 = explore / view |

각 이벤트는 페이지를 열 때마다 실험별로 한 번만 보낸다. 시작·탐색은 독자의 실제 조작(`isTrusted`)만 세며, 설정 링크처럼 스크립트가 넣은 값은 세지 않는다. 매개변수는 `experiment_id`(`<책 id>/<장>/<실험 id>`, 허브 `data/experiment-catalog.json`의 ID와 같다)와 `book_id`다. 입력값·체류 시간·개인 식별 정보는 보내지 않는다. GA4 보고서에서 보려면 관리 → 맞춤 정의에서 이벤트 범위 맞춤 측정기준 `experiment_id`, `book_id`를 등록해야 한다(등록 이전 데이터는 보고서에 소급되지 않는다). `runtime/sim-state.js`를 켠 책은 설정 링크를 복사할 때 `experiment_share`, 그 링크로 들어왔을 때 `experiment_shared_open`을 같은 매개변수로 보낸다. gtag가 없는 로컬 미리보기에서는 보내지 않고 `window`의 `euiyun:experiment` 이벤트로만 알린다.

공통 패키지를 새 태그로 출시한 뒤 각 책의 의존성과 lockfile을 갱신해야 배포에 반영된다. `scripts/manage-books.py verify`는 공개 홈페이지와 첫 챕터의 GA4 태그 및 Cloudflare 비콘 제거를 확인한다.

Cloudflare DNS는 각 책에서 `DNS only`를 유지한다. GA4 측정 ID는 공개 식별자이며 API 비밀 키가 아니다.

# Google Analytics 4

모든 책은 GA4 웹 스트림 하나와 공개 측정 ID `G-LST8C5WL08`을 공유한다. 태그와 기존 Cloudflare 비콘 제거는 `src/analytics.js`에서 관리한다. `build`는 원본 HTML을 유지하고 배포물에만 GA4 태그 한 개를 넣는다. 별도 Node 빌드에서는 `@euiyun/book/analytics`의 `analyticsTag`와 `stripAnalytics`를 사용한다.

책별 통계는 GA4의 hostname과 페이지 경로로 구분한다. 같은 도메인 아래 여러 책이 있는 서가는 경로도 함께 사용한다. 현재 `book_id` 등 사용자 정의 매개변수는 보내지 않는다.

공통 패키지를 새 태그로 출시한 뒤 각 책의 의존성과 lockfile을 갱신해야 배포에 반영된다. `scripts/manage-books.py verify`는 공개 홈페이지와 첫 챕터의 GA4 태그 및 Cloudflare 비콘 제거를 확인한다.

Cloudflare DNS는 각 책에서 `DNS only`를 유지한다. GA4 측정 ID는 공개 식별자이며 API 비밀 키가 아니다.

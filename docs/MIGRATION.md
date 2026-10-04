# Migration

1. 현재 HTML 페이지·자산·시뮬레이터·canonical URL을 기록한다.
2. 책 루트에 `book.json`, `package.json`, `package-lock.json`을 추가한다. 엔진 의존성은 릴리스 tag에 고정한다.
3. `npm ci && npm run build`로 `.book-dist/`를 만든다. 기존 root Pages 배포는 이 시점까지 유지한다.
4. 원본과 배포물의 파일 수, CSS/JS, 이미지, 챕터 URL, SEO, Analytics, 시뮬레이터 동작을 비교한다.
5. Pages workflow를 추가하고 저장소 Pages source를 GitHub Actions로 전환한다. 기존 custom domain과 HTTPS를 확인한다.
6. 공개 URL과 주요 시뮬레이터를 다시 확인한다. 문제가 있으면 Pages source를 `main` 루트로 되돌릴 수 있다.

`packagingbook`이 파일럿이며 나머지 책은 검증 결과를 바탕으로 순차 적용한다. 기존 HTML 형식을 유지한다.

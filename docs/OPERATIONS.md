# Operations

`book-series/` 부모 디렉터리에 `books/`, `book/`, 각 `*book/` 저장소를 나란히 둔다. 독립 Git 이력과 도메인은 유지한다. 2026-10-04 현재 포털의 출간 22권 모두 `@euiyun/book` v0.1.2를 고정해 Actions가 `.book-dist/`를 배포한다.

## 매일 확인할 명령

```sh
python3 book/scripts/manage-books.py list
python3 book/scripts/manage-books.py status
python3 book/scripts/manage-books.py outdated
python3 book/scripts/manage-books.py catalog
python3 book/scripts/manage-books.py verify
python3 book/scripts/manage-books.py build --repo processbook
```

`catalog`는 포털 출간 항목과 로컬 `book.json`의 ID·제목·설명·도메인·분야·상태가 일치하는지 확인한다. `verify`는 실제 공개 홈페이지와 첫 챕터의 Analytics beacon을 확인한다.

## 공개 사이트 브라우저 검사

```sh
cd book
npm ci
npx playwright install chromium
npm run test:browser
```

Playwright는 포털의 공개 catalog와 실험 목록을 읽어 출간된 모든 책의 모바일 홈, 시뮬레이터 진입점, 브라우저 오류를 확인한다. ProcessBook 클린룸, AIBook 어텐션, ColorBook 등색 실험은 실제 조작 후 값 변화를 검사한다. 나머지 책의 실험 검사도 대표 진입점과 컨트롤 렌더링까지 확인한다. `book` 저장소의 GitHub Actions는 매일 한 번, 관련 코드가 `main`에 푸시될 때, 수동 실행 시 같은 검사를 한다. 실패 시 `browser-smoke-failure` artifact에 스크린샷과 trace가 남는다. 포털 목록에 새 책을 출간하면 실험 URL도 `discovery.json`에 등록하거나 브라우저 검사에서 해당 책의 진입점을 지정한다.

## 엔진 릴리스

1. `book`에서 테스트하고 `main`에 푸시한다.
2. 새 버전 tag를 만든다. 기존 tag는 이동하지 않는다.
3. 1~2권에서 새 버전을 설치·빌드·공개 확인한다.
4. 나머지 책을 명시적으로 갱신한다.

```sh
python3 book/scripts/manage-books.py update --ref v0.2.0 --repo processbook --execute
python3 book/scripts/manage-books.py update --ref v0.2.0 --execute
```

각 책의 `package.json`과 `package-lock.json`을 함께 커밋·푸시하면 그 책의 workflow가 독립적으로 배포된다. 태그 tarball은 공개 GitHub HTTPS 주소로 받아 CI의 SSH 키에 의존하지 않는다.

## 새 책 배포

`book/template/`을 복사하고 `book.json`, `CNAME`, `package.json`을 바꾼다. `npm install` 후 lockfile을 커밋한다. GitHub Pages에서 custom domain과 HTTPS를 설정하고 배포 소스를 **GitHub Actions로 먼저** 지정한다. 그다음 `main`에 workflow와 콘텐츠를 푸시한다. Cloudflare DNS는 `DNS only`다. 포털 catalog에 항목을 추가하고 `catalog` 검사를 통과시킨다.

## 복구

빌드가 실패하면 해당 책의 workflow 로그를 보고 lockfile·metadata·canonical 오류를 고친다. 배포 후 문제가 생기면 해당 책에서 엔진 의존성과 lockfile을 이전 tag로 되돌려 다시 푸시한다. 긴급 시 GitHub Pages source를 `main` 루트의 branch 배포로 되돌릴 수 있다. source를 전환하는 커밋에서는 기존 branch 배포가 늦게 끝나 새 Actions 배포를 덮을 수 있으므로, 모든 작업이 끝난 뒤 Actions workflow를 다시 실행하고 공개 URL을 확인한다.

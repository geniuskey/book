# @euiyun/book

`@euiyun/book`은 기존 HTML/CSS/JS 책을 보존하며 독립 GitHub Pages 배포물을 만드는 작은 빌드 도구다. `books`는 전체 책을 찾는 포털, `book`은 공통 도구, `*book`은 실제 책이다. 각 책의 Git 이력과 배포는 독립적이다.

## 현재 제공하는 기능

- `book.json`과 `CNAME`의 도메인 일치 검사
- 원본을 건드리지 않고 `.book-dist/` 생성
- 모든 HTML에 공통 Cloudflare Web Analytics beacon 한 개만 포함
- 누락된 canonical, OpenGraph, Twitter card, 기본 JSON-LD, favicon 메타 채움
- 없을 때 sitemap과 robots.txt 생성
- 기존 CSS, JavaScript, 시뮬레이터, 고유 SEO 메타, 자산, URL 유지

## 새 책

`template/`을 새 독립 저장소에 복사한다. `book.json`, `CNAME`, `package.json`의 이름·도메인을 맞추고 HTML을 작성한다. `npm install` 후 생성된 `package-lock.json`을 커밋한다. `npm run build`로 `.book-dist/`를 만들고 Pages를 **GitHub Actions** 소스로 설정한다. DNS는 `DNS only`를 유지한다.

## 기존 책

`book.json`과 `package.json`을 추가하고 `@euiyun/book`의 고정 버전을 설치한다. `npm run build` 후 기존 루트 사이트와 `.book-dist/`의 페이지·자산·시뮬레이터를 비교한다. `packagingbook`이 첫 파일럿이다. 배포 방식 변경 전까지 기존 `main` 루트 Pages가 그대로 작동한다.

```sh
npm ci
npm run build
```

현재 패키지는 npm에 게시하지 않았다. 별도 저장소에서도 재현 가능한 Git tag `v0.1.2`으로 설치한다. 태그 갱신은 하지 않고 새 버전을 출시해 각 책의 의존성과 lockfile을 갱신한다.

[아키텍처](docs/ARCHITECTURE.md) · [집필](docs/BOOK_AUTHORING.md) · [이전](docs/MIGRATION.md) · [Analytics](docs/ANALYTICS.md) · [감사 결과](docs/ECOSYSTEM_AUDIT.md)

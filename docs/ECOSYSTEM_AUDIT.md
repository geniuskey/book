# Book ecosystem audit

조사일: 2026-10-04. 범위: 이 부모 디렉터리의 독립 Git 저장소. 아래 표는 변경 전 구조다.

## 핵심 발견

- 23개 Git 저장소: 포털 `books`, 조사 당시 README만 있던 엔진 `book`, 실제 책 21개. `book`은 이미 `geniuskey/book` 원격을 가진다.
- 조사 당시 기존 책은 전부 정적 HTML/CSS/JS였다. VitePress 버전, `package.json`, package manager, `.vitepress/config.*`, theme, GitHub Pages workflow, build command는 모두 없었다. 따라서 기존 VitePress 설정 중복은 없다.
- 책 21개 모두 `js/common.js`, `css/style.css`, `favicon.svg`, 루트 `CNAME`을 가진다. 각 파일의 해시는 서로 다르나 공통 JS의 챕터 목록·헤더·TOC·이전/다음·footer·테마와 canvas 유틸리티에 반복이 많다.
- 전체 HTML 408개 페이지가 같은 Cloudflare Web Analytics Site Token을 사용한다. DNS의 `DNS only` 여부는 로컬 파일만으로 검증할 수 없다.
- 포털 `books/data/books.json`에는 현재 67개 항목(출간 21, 예정 46)이 있다. 출간 표시된 `chipindustrybook`은 로컬 저장소가 없고, 로컬 `colorbook`은 catalog에 없다.

## 저장소별 현황

| 저장소 | 역할 | HTML | 전용 JS (`common.js` 제외) | SEO 생성기 | sitemap | 도메인 |
|---|---|---:|---|---|---|---|
| aibook | book | 14 | - | - | no | aibook.euiyun.com |
| book | engine | 0 | - | - | no | - |
| books | portal | 6 | wafer.js, core.js, field.js, discovery.js, roadmap.js, library.js, home.js, field-maps.js, covers.js | - | no | books.euiyun.com |
| camerabook | book | 18 | - | seo.py | yes | camerabook.euiyun.com |
| carbook | book | 23 | - | seo.py | yes | carbook.euiyun.com |
| colorbook | book | 21 | - | seo.py | yes | colorbook.euiyun.com |
| computerbook | book | 24 | terms.js | seo.py | yes | computerbook.euiyun.com |
| designbook | book | 17 | cell.js, flow.js, optics.js | head.py | yes | designbook.euiyun.com |
| devicebook | book | 15 | semi.js | head.py | yes | devicebook.euiyun.com |
| displaybook | book | 21 | - | seo.py | yes | displaybook.euiyun.com |
| etchbook | book | 19 | etch.js | head.py | yes | etchbook.euiyun.com |
| failurebook | book | 17 | fa.js | head.py | yes | failurebook.euiyun.com |
| lithobook | book | 20 | litho.js | head.py | yes | lithobook.euiyun.com |
| memorybook | book | 18 | - | - | yes | memorybook.euiyun.com |
| moneybook | book | 24 | money.js | head.py | yes | moneybook.euiyun.com |
| packagingbook | book | 18 | pkg.js | head.py | yes | packagingbook.euiyun.com |
| phonebook | book | 15 | phone3d.js | seo.py | yes | phonebook.euiyun.com |
| processbook | book | 17 | xsec.js, optics.js | head.py | yes | processbook.euiyun.com |
| sensorbook | book | 20 | - | seo.py | yes | sensorbook.euiyun.com |
| socbook | book | 20 | soc.js | head.py | yes | socbook.euiyun.com |
| stockbook | book | 27 | stock.js | head.py | yes | stockbook.euiyun.com |
| testbook | book | 17 | wafer.js | head.py | yes | testbook.euiyun.com |
| yieldbook | book | 17 | wafer.js | head.py | yes | yieldbook.euiyun.com |

## 공통점과 차이

- **공통화 후보:** Analytics beacon, 기본 SEO/meta/OG/canonical/Twitter/구조화 데이터, sitemap, 정적 HTML 빌드와 검사 도구.
- **책에 유지:** `CHAPTERS` 데이터와 실제 nav/sidebar 순서, 고유 accent·표지·favicon, 모든 본문, 페이지별 CSS, KaTeX/Three.js 선택, simulator JS와 canvas 동작. `common.js` 전체를 그대로 합치면 책별 수학·물리 헬퍼 차이를 잃는다.
- **검색:** 기존 책의 `common.js`에서 본문 검색 엔진은 확인되지 않았다. 포털은 `data/discovery.json`을 사용한다. 책별 검색은 콘텐츠 규모와 사용 패턴을 보고 별도 설계한다.
- **배포:** 기존 책은 루트 HTML과 CNAME을 GitHub Pages가 직접 서빙한다. workflow 파일은 없다. 엔진 빌드 결과를 게시하려면 Actions artifact 배포로 전환해야 한다.
- **수식:** 책 본문은 HTML이고 일부 책은 KaTeX를 CDN으로 사용한다.
- **favicon/SEO:** 책별 favicon은 모두 고유하다. `aibook`은 sitemap/robots/OG가 없고, 다른 책은 대체로 있다. 포털도 sitemap은 없다.

## 통합 결정과 단계

1. `@euiyun/book`은 기존 HTML 책을 보존하는 빌드·검사 도구가 된다.
2. 기존 HTML 형식을 유지한다. 파일럿에서는 `packagingbook`의 전용 시뮬레이터를 유지하고 공통 Analytics 주입 및 정적 빌드를 검증한다.
3. 현재 portal catalog는 `books/data/books.json`이다. 다음 단계에서는 각 repo의 `book.json`을 canonical metadata로 삼고 포털 catalog를 수집·검증으로 생성한다. 편집 정보(learning path, featured 등)는 portal에 남긴다.
4. 단일 Analytics Site Token은 엔진의 한 파일에 둔다. 이것은 공개 Site Token이며 Cloudflare API Token이 아니다.
5. Phase 1 조사 완료. Phase 2 정적 엔진 구현. Phase 3–4 `packagingbook` 파일럿. Phase 5 다수 책 이전 및 Phase 6 portal 자동 연동은 파일럿 검증 뒤 진행한다.

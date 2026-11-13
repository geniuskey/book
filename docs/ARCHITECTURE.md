# Book architecture

- `geniuskey/books`: 책 catalog, 분야, 학습 경로, 실험 탐색을 소유하는 포털.
- `geniuskey/book`: 기존 정적 HTML을 빌드·검사하고 공통 SEO/Analytics 기본값과 공통 UI runtime(상단 바·서랍·이전/다음·푸터)을 제공하는 엔진.
- `geniuskey/*book`: 독립 콘텐츠, 디자인, 챕터 목록, CSS, 시뮬레이터, 도메인, Pages 배포.

현재 책들은 정적 HTML이다. 각 책의 `js/common.js`도 nav 데이터와 책별 수학/시뮬레이션 helper가 섞여 있어 통째로 합치지 않는다. 먼저 새 책과 기존 책의 빌드/검사/배포를 일관되게 하고, 반복되는 UI는 분리되는 대로 작은 공통 runtime으로 옮긴다.

## 공통 UI runtime

`runtime/ui.js`, `runtime/ui.css`(v0.4.0)는 모든 책이 같은 순서와 반응형 규칙으로 쓰는 상단 바·챕터 서랍·이전/다음·푸터다. v0.2.0의 `runtime/topbar.*`를 대신한다. `runtime/experiments.js`(v0.5.0)는 책마다 선택해 켜는 실험 조작 이벤트다([Analytics](ANALYTICS.md#실험-이벤트)). `runtime/sim-state.js`(v0.6.0, 스타일은 `ui.css`)는 실험 머리에 ‘설정 링크’를 붙인다. 링크는 `<페이지>#<실험 id>?<조작 id>=<값>`이고 처음 값과 다른 조작만 담는다. 대상은 id가 있는 range·number·checkbox·radio·select와 `.seg[id]` 버튼이다. 받은 링크는 같은 이벤트로 값을 적용하고 ‘처음 값으로’를 제공한다. 실험에 `data-model` 버전을 두면 링크에 `_v`로 남고, 버전이 다르면 열되 모델이 바뀌었다고 알린다. 난수를 쓰는 실험은 같은 설정이어도 결과가 달라지므로 실험 쪽에서 시드를 고정해야 그대로 재현된다.

```
상단 바   [☰] [로고 · 책 이름 · 부제]   [검색]   [책 고유 버튼 0~2개] [서가] [의견] [테마]
          태블릿(≤760px): 로고는 마크만, 버튼은 아이콘만
          모바일(≤600px): [☰] [검색] [mobile: true인 고유 버튼 1개] [의견] [테마] (서가는 440px 이하에서 서랍으로)
서랍      CHAPTERS · 00 홈 · (고유 항목) · 챕터(part가 있으면 파트별) · ← 서가
이전/다음 ← 이전 · 번호 / 다음 · 번호 →   (첫 장의 이전은 홈)
푸터      책 이름 — 소개 · 고지
          관련 책: …            (있을 때만)
          © 연도 geniuskey 및 기여자 · CC BY 4.0 · MIT · 라이선스 안내 · 독자 의견
```

- 서가 링크는 상단 바와 서랍에 하나씩이다. 단독 책은 books.euiyun.com(전체 책), 시리즈 책은 시리즈가 `EuiyunBook.shelf = { href, label, title, back }`으로 바꾼다(예: semi-books `shared/js/book-shell.js`).
- 검색은 필수다. 챕터 메타데이터를 바로 찾고, 챕터 페이지의 `main.chapter` 섹션(`section > h2`)·시뮬레이터(`.sim .sim-head h3`)·그림(`figure figcaption`)은 처음 검색할 때 읽는다.
- 시리즈는 `EuiyunBook.search = { placeholder, label, load, run, idle }`로 검색을 통째로 바꿀 수 있다(예: semi-books는 빌드 때 만든 책별 본문·용어 색인으로 찾는다). `run(query)`는 `{ items: [{ href, type, title, meta, text }], note, footer }`를 돌려주고, `load()`가 끝나면 다시 불린다. `/`·Cmd/Ctrl+K는 어느 쪽이든 검색창으로 간다.
- 시리즈 공통 서랍 항목은 `EuiyunBook.drawerExtra = [{ href, num, label, active }]`로 넣는다. 책의 `extra` 뒤에 붙는다(예: semi-books의 찾아보기).
- 책 고유 버튼은 상단 바 `actions`, 서랍 `extra`로만 넣는다. 다른 책 소개는 서랍이 아니라 푸터 `related`에 둔다.
- 라이선스 링크는 책 폴더의 `LICENSE-MIT`, `LICENSE.md`다(`root`). 독자 의견 링크는 누른 순간의 페이지 주소를 넘긴다.
- 클래스는 `bk-` 하나로 통일한다. 색과 크기는 책의 `--bg`, `--bg-elev`, `--surface`, `--text*`, `--border`, `--accent*`, `--shadow`, `--mono`, `--radius`, `--maxw`, `--nav-h` 변수를 따른다.

책은 `js/common.js`의 layout 코드에서 호출한다. 챕터 목록 데이터, 홈 항목 이름, 목차(ON THIS PAGE), 테마 적용 방식, 시뮬레이터는 책에 남는다.

```js
const { bar } = EuiyunBook.topbar({
  name: "DeviceBook", subtitle: "반도체 소자 물리 교과서", logo: LOGO_SVG, home: href(""),
  chapters: CHAPTERS, chapterHref: href, feedback: "devicebook",
  actions: [{ id: "x-gallery", href: "sims.html", icon: ICON, label: "시뮬레이터", title: "시뮬레이터 갤러리", mobile: false }],
  theme: { isDark: () => isDark(), set: (next) => { localStorage.setItem("theme", next); applyTheme(next); } },
});
const nav = { home: href(""), homeLabel: "홈 · 로드맵", chapters: CHAPTERS, chapterHref: href, current: curSlug };
EuiyunBook.drawer({ ...nav, extra: [{ href: "sims.html", num: "▦", label: "시뮬레이터 갤러리" }] });
EuiyunBook.pager({ ...nav, after: chapterLayout });          // 챕터 페이지에서만
EuiyunBook.footer({ name: "DeviceBook", note: "공학도를 위한 … 교과서 · 수치는 교육용 근사 모델입니다.",
  related: [{ href: "/process/", label: "ProcessBook" }], root, feedback: "devicebook" });
```

페이지는 runtime을 책의 `common.js`보다 늦지 않게 불러온다(`defer`면 DOMContentLoaded 전에 실행된다). 정적 사이트는 패키지 파일을 저장소에 복사해 두고, 복사본이 설치된 버전과 같은지 테스트로 확인한다.

## Metadata와 registry

현재 포털의 `data/books.json`은 67개 항목을 가진 원본이다. 장기적으로 각 책의 `book.json`을 책 자체의 ID·제목·설명·도메인·분야·상태에 대한 원본으로 삼는다. 포털은 등록 대상 repo와 ref만 관리하고 metadata를 수집한다. 학습 경로·추천 실험 설명 등 포털 편집 정보는 별도 파일에 둔다. 2026-10-04 현재 출간된 22권은 모두 로컬 저장소·포털 항목·`book.json`이 대응한다. 포털 데이터 생성 자동화는 별도 단계로 남긴다.

## 릴리스와 운영

`book`은 변경마다 새 tag를 만든다. 책은 tag를 의존성으로 기록하고 lockfile을 커밋한다. 몇 권에서 먼저 설치·빌드·배포 검증한 다음 나머지 책을 갱신한다. 책마다 독립 Git 이력과 배포를 유지하며, 공통 코드 변경을 배포에 반영하려면 각 책의 의존성 업데이트와 재배포가 필요하다. 부모 폴더의 `scripts/manage-books.py`는 읽기 전용 상태/빌드 확인과 명시적 일괄 업데이트를 지원한다.

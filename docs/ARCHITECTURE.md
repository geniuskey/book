# Book architecture

- `geniuskey/books`: 책 catalog, 분야, 학습 경로, 실험 탐색을 소유하는 포털.
- `geniuskey/book`: 기존 정적 HTML을 빌드·검사하고 공통 SEO/Analytics 기본값을 제공하는 엔진.
- `geniuskey/*book`: 독립 콘텐츠, 디자인, nav, CSS, 시뮬레이터, 도메인, Pages 배포.

현재 책들은 정적 HTML이다. 각 책의 `js/common.js`도 nav 데이터와 책별 수학/시뮬레이션 helper가 섞여 있어 통째로 합치지 않는다. 먼저 새 책과 기존 책의 빌드/검사/배포만 일관되게 한다. 반복되는 UI가 명확히 분리될 때 작은 공통 runtime을 추가한다.

## Metadata와 registry

현재 포털의 `data/books.json`은 67개 항목을 가진 원본이다. 장기적으로 각 책의 `book.json`을 책 자체의 ID·제목·설명·도메인·분야·상태에 대한 원본으로 삼는다. 포털은 등록 대상 repo와 ref만 관리하고 metadata를 수집한다. 학습 경로·추천 실험 설명 등 포털 편집 정보는 별도 파일에 둔다. `chipindustrybook`과 `colorbook`의 현재 불일치를 정리하기 전에는 포털 데이터 생성을 전환하지 않는다.

## 릴리스와 운영

`book`은 변경마다 새 tag를 만든다. 책은 tag를 의존성으로 기록하고 lockfile을 커밋한다. 몇 권에서 먼저 설치·빌드·배포 검증한 다음 나머지 책을 갱신한다. 책마다 독립 Git 이력과 배포를 유지하며, 공통 코드 변경을 배포에 반영하려면 각 책의 의존성 업데이트와 재배포가 필요하다. 부모 폴더의 `scripts/manage-books.py`는 읽기 전용 상태/빌드 확인과 명시적 일괄 업데이트를 지원한다.

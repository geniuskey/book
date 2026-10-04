# Book authoring

`template/`은 HTML/CSS/JS 책의 시작점이다. 새 저장소에 복사한 뒤 `book.json`, `CNAME`, `package.json`의 책 ID와 도메인을 바꾼다. `chapters/`는 본문, `css/`는 스타일, `js/`는 책 전용 인터랙션과 시뮬레이터, 루트 정적 파일은 favicon/이미지에 쓴다.

각 페이지에 고유 `<title>`과 `<meta name="description">`을 적는다. 엔진은 나머지 SEO 메타와 Analytics를 빌드 결과에 채운다. 특별한 OpenGraph 이미지나 구조화 데이터가 있으면 HTML에 직접 명시하면 보존된다.

```sh
npm install
npm run build
```

`package-lock.json`을 커밋한다. Pages의 배포 소스를 GitHub Actions로 설정하고, 사용자 지정 도메인을 저장소 Pages 설정에 등록한다. Cloudflare DNS는 `DNS only`다. template workflow는 `.book-dist/`를 게시한다.

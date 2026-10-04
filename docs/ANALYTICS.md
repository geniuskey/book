# Cloudflare Web Analytics

`euiyun.com`의 한 Web Analytics Site를 모든 책에서 공유한다. 공개 Site Token은 `src/site-token.js` 한 곳에 둔다. `build`는 기존 beacon을 배포물에서 제거한 뒤 같은 Site Token의 beacon을 한 개 넣는다. 원본 HTML은 변경하지 않는다. 이것은 Cloudflare API Token이 아니다.

Cloudflare DNS는 각 책에서 `DNS only`를 유지한다. hostname으로 책별 통계를 구분한다. 실제 DNS/Pages 설정은 배포 점검 때 확인한다.

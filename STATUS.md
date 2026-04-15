# STATUS.md

## 현재 상태

* 단계: Phase 15 진행 중 / Phase 16 완료 / Phase 17 부분 완료
* 진행률: MVP 100%, Launch Prep 75%
* 마지막 업데이트: 2026-04-15

---

## 최근 작업

* production 배포를 위한 preflight 작업을 코드와 문서 기준으로 정리
* `api/health`, `robots.txt`, `sitemap.xml`, favicon, OG 이미지 추가
* `_app.tsx`, `_document.tsx`를 추가해 메타 태그와 기본 SEO 설정 반영
* Prisma deprecation 경고 대응을 위해 `prisma.config.ts` 도입
* 홈 화면에 confidence 해석 가이드와 모바일/PC 대응 개선 반영
* production runbook과 운영 쿼리 문서를 추가

### 수정 파일

* [src/pages/_app.tsx](/Users/badal/dev/projects/colono-food-check/src/pages/_app.tsx)
* [src/pages/_document.tsx](/Users/badal/dev/projects/colono-food-check/src/pages/_document.tsx)
* [src/pages/api/health.ts](/Users/badal/dev/projects/colono-food-check/src/pages/api/health.ts)
* [src/pages/robots.txt.ts](/Users/badal/dev/projects/colono-food-check/src/pages/robots.txt.ts)
* [src/pages/sitemap.xml.ts](/Users/badal/dev/projects/colono-food-check/src/pages/sitemap.xml.ts)
* [src/pages/index.tsx](/Users/badal/dev/projects/colono-food-check/src/pages/index.tsx)
* [public/favicon.svg](/Users/badal/dev/projects/colono-food-check/public/favicon.svg)
* [public/og-image.svg](/Users/badal/dev/projects/colono-food-check/public/og-image.svg)
* [prisma.config.ts](/Users/badal/dev/projects/colono-food-check/prisma.config.ts)
* [.env.example](/Users/badal/dev/projects/colono-food-check/.env.example)
* [docs/production-runbook.md](/Users/badal/dev/projects/colono-food-check/docs/production-runbook.md)
* [docs/deployment-ops.md](/Users/badal/dev/projects/colono-food-check/docs/deployment-ops.md)
* [README.md](/Users/badal/dev/projects/colono-food-check/README.md)
* [TASK.md](/Users/badal/dev/projects/colono-food-check/TASK.md)
* [STATUS.md](/Users/badal/dev/projects/colono-food-check/STATUS.md)

### 결과

* production에서 필요한 환경변수, DB 반영 절차, 검증 절차, 운영 쿼리가 문서화됨
* SearchLog를 production에서 확인할 최소 SQL 세트가 준비됨
* UI는 매칭 유형, 신뢰도, fallback 의미를 더 빨리 이해할 수 있게 정리됨
* robots, sitemap, favicon, OG 이미지가 적용되어 최소 SEO/공유 준비가 됨
* health endpoint가 추가되어 production 배포 후 앱/DB 연결 상태를 바로 확인할 수 있음

---

## 검증 결과

* typecheck: 통과 (`npx tsc --noEmit`)
* test: 통과 (`npm test`)
* build: 통과 (`npm run build`)
* 로컬 런타임 확인:
  * `GET /api/health -> status ok, database connected`
  * `GET /robots.txt -> 정상 응답`
  * `GET /sitemap.xml -> 정상 응답`
  * `GET /favicon.svg -> 200`
  * `GET /og-image.svg -> 200`
  * 홈 HTML에 canonical, description, og:image, twitter:image 메타 반영 확인

---

## Planner 리뷰 요약

* 실배포 전에는 기능 추가보다 production runbook과 운영 쿼리가 우선이라는 판단이 맞았고, 이번에 문서로 정리함
* SearchLog 기반 개선 루프를 production 관점에서 다시 읽을 수 있게 health check와 운영 SQL을 추가한 점이 필요했음
* seed 재실행 금지와 점진 반영 원칙을 production 문서에 명시한 것이 중요함

## Designer 리뷰 요약

* 결과를 읽는 방법을 첫 화면에서 알려줘야 신규 사용자가 덜 헤맨다는 판단으로 confidence guide strip을 추가함
* 모바일에서 단계 선택과 결과 해석이 더 빠르게 되도록 정보 구조를 유지한 채 가이드만 보강함
* OG 이미지와 favicon까지 넣어 공유/브랜딩 완성도를 높임

---

## 현재 문제 / 리스크

* 실제 production PostgreSQL 생성과 Vercel 연결은 계정/권한이 없어 아직 수행하지 못함
* production `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SITE_URL` 실제 값은 아직 미입력 상태다
* Search Console 연결은 실제 도메인 확보 후 진행해야 한다
* production 첫 배포 이후에는 health endpoint, `/api/check`, `SearchLog` 적재를 실제 URL에서 다시 검증해야 한다

---

## 다음 작업

* production PostgreSQL 생성
* Vercel 프로젝트 생성 및 환경변수 입력
* production `db:push`, 최초 `db:seed` 실행
* production URL에서 `/api/health`, `/api/check` 검증
* 첫 production SearchLog 수집 후 fallback 비율 확인

---

## 메모

* 현재 상태는 `실배포 직전 준비 완료`에 가깝고, 남은 것은 계정 기반 실제 연결 작업이다.
* production에서는 `db:seed` 재실행 금지 원칙을 반드시 지켜야 한다.

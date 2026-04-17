# 건강신호등 - 대장내시경 음식체크

대장내시경을 준비하는 사용자가 음식 이름만 입력하면, 시기별로 먹어도 되는지 빠르게 확인할 수 있는 검색형 웹 서비스입니다.

- 브랜드: `건강신호등`
- 서비스명: `대장내시경 음식체크`
- 운영 주소: [https://colono-food-check.vercel.app](https://colono-food-check.vercel.app)
- GitHub: [https://github.com/positanoarancia/colono-food-check](https://github.com/positanoarancia/colono-food-check)

---

## 1. 서비스 개요

대장내시경 전에는 날짜에 따라 먹을 수 있는 음식 기준이 달라집니다. 하지만 병원 안내문은 길고, 블로그 정보는 제각각이라 사용자는 결국 `"이 음식 지금 먹어도 되나?"`를 반복해서 검색하게 됩니다.

이 프로젝트는 그 문제를 해결하기 위해 만들었습니다.

- 음식명을 입력하면 즉시 판정
- `초기 준비 4-5일 전 / 준비 식단 2-3일 전 / 전날 1일 전` 기준 제공
- `허용 / 주의 / 피하기`를 짧은 이유와 함께 안내
- 유사 음식과 대체 방향까지 함께 제공

핵심 목표는 “정보 나열”이 아니라 **상황별 음식 허용 여부를 빠르게 판단해주는 도구**를 만드는 것입니다.

---

## 2. 현재 구현 상태

현재 서비스에는 아래 내용이 반영되어 있습니다.

- 모바일 중심의 검색형 UI
- 날짜 단계 탭 전환
- 음식명 직접 입력 + 예시 음식 버튼
- 결과 상태 요약과 짧은 이유
- 유사 음식 추천
- FAQ / 가이드 섹션
- 공유 버튼과 모바일 공유 흐름
- `robots.txt`, `sitemap.xml`, canonical/OG 등 기본 SEO 설정
- 홈 진입 시 `prewarm` 실행으로 첫 검색 체감 속도 보정
- `SearchLog` 저장 기반 운영 보강 루프

운영 배포 기준 주요 보정 사항:

- `흰죽`, `미음`, `흰쌀밥`, `카스테라`, `식빵`, `크래커`는 전날 대표 허용식으로 보정
- 재검색 시 결과 카드가 아니라 날짜 피커 기준으로 다시 스크롤
- 브랜드 라벨, 공유 버튼, FAQ, 결과 영역의 모바일 위계 조정

---

## 3. 사용자 흐름

1. 사용자가 날짜 단계를 고릅니다.
2. 음식명을 입력하거나 예시 칩을 누릅니다.
3. `/api/check`가 음식, alias, food group, tag rule을 기준으로 판정합니다.
4. 가장 보수적인 결과(`avoid > caution > allowed`)를 반환합니다.
5. 결과 상태, 이유, 유사 음식, 대체 방향을 보여줍니다.
6. 검색 로그는 운영 보강용으로 저장됩니다.

---

## 4. 판정 방식

이 서비스는 단순 음식 사전이 아니라 태그 기반 판정 엔진으로 동작합니다.

핵심 구조:

- `condition`: 상황 (`colonoscopy`)
- `day_stage`: 날짜 단계 (`d5`, `d3`, `d1`)
- `food`
- `food_group`
- `tag`
- `judgement_rule`

판정 순서:

1. exact food match
2. alias match
3. food group match
4. fallback

최종 결과 우선순위:

- `avoid`
- `caution`
- `allowed`

즉, 여러 규칙이 동시에 걸리면 더 보수적인 결과를 채택합니다.

---

## 5. API

### `GET /api/check`

음식 판정용 메인 API입니다.

필수 query:

- `condition`
- `dayStage`
- `query`

예시:

```bash
curl -sG "http://127.0.0.1:3000/api/check" \
  --data-urlencode "condition=colonoscopy" \
  --data-urlencode "dayStage=d1" \
  --data-urlencode "query=바나나"
```

응답 주요 필드:

- `query`
- `normalizedQuery`
- `matchedType`
- `matchedEntity`
- `status`
- `confidenceGrade`
- `primaryReason`
- `secondaryReason`
- `similarFoods`
- `recommendedMenus`
- `topAppliedRules`

### `GET /api/prewarm`

홈 진입 시 자주 쓰는 조건/단계/추천 메뉴 데이터를 미리 데워 첫 검색 체감 속도를 낮추는 API입니다.

예시:

```bash
curl "http://127.0.0.1:3000/api/prewarm?condition=colonoscopy"
```

### `GET /api/health`

DB 연결 상태를 확인하는 간단한 헬스체크 API입니다.

---

## 6. 기술 스택

- Frontend: Next.js Pages Router
- Runtime: React 19
- Backend: Next.js API Routes
- Database: PostgreSQL
- ORM: Prisma
- Test: Node test runner + `tsx`
- Deploy: Vercel

---

## 7. 프로젝트 구조

주요 경로:

- [src/pages/index.tsx](/Users/badal/dev/projects/colono-food-check/src/pages/index.tsx): 메인 UI
- [src/pages/api/check.ts](/Users/badal/dev/projects/colono-food-check/src/pages/api/check.ts): 음식 판정 API
- [src/pages/api/prewarm.ts](/Users/badal/dev/projects/colono-food-check/src/pages/api/prewarm.ts): prewarm API
- [src/pages/api/health.ts](/Users/badal/dev/projects/colono-food-check/src/pages/api/health.ts): 헬스체크 API
- [src/lib/check-food.ts](/Users/badal/dev/projects/colono-food-check/src/lib/check-food.ts): 판정 엔진
- [src/lib/judgement-engine.ts](/Users/badal/dev/projects/colono-food-check/src/lib/judgement-engine.ts): 규칙 기반 판정 로직
- [prisma/schema.prisma](/Users/badal/dev/projects/colono-food-check/prisma/schema.prisma): DB 스키마
- [prisma/seed.ts](/Users/badal/dev/projects/colono-food-check/prisma/seed.ts): 초기 데이터
- [tests](/Users/badal/dev/projects/colono-food-check/tests): 테스트
- [docs](/Users/badal/dev/projects/colono-food-check/docs): 운영/배포 문서

---

## 8. 로컬 실행

### 1) 의존성 설치

```bash
npm install
```

### 2) 환경변수 설정

```bash
cp .env.example .env
```

예시:

```bash
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54329/health_signal_dev?schema=public"
DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:54329/health_signal_dev?schema=public"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 3) PostgreSQL 준비

로컬 PostgreSQL이 없다면 Docker로 바로 띄울 수 있습니다.

```bash
docker run --name health-signal-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=health_signal_dev \
  -p 54329:5432 \
  -d postgres:16
```

### 4) Prisma 반영

```bash
npm run prisma:generate
npm run db:push
```

### 5) Seed 실행

```bash
npm run db:seed
```

### 6) 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 확인할 수 있습니다.

---

## 9. 자주 쓰는 명령어

```bash
npm run dev
npm run build
npm run start
npm test
npx tsc --noEmit
npm run prisma:generate
npm run db:push
npm run db:seed
npm run db:sync-static
```

---

## 10. 배포 및 운영

현재 운영 배포 기준:

- App: Vercel
- DB: PostgreSQL
- 사이트맵: `/sitemap.xml`
- robots: `/robots.txt`

production 필수 환경변수:

```bash
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SITE_URL="https://colono-food-check.vercel.app"
```

권장 추가 변수:

```bash
DIRECT_URL="postgresql://..."
```

배포 전 최소 순서:

```bash
npm install
npm run prisma:generate
npm run db:push
npm run db:seed
npm run build
```

운영 중 정적 데이터만 보강할 때:

```bash
npm run db:sync-static
```

설명:

- `db:seed`: 초기화 성격. production 최초 1회만 사용
- `db:sync-static`: `SearchLog`, `Condition`, `DayStage`는 유지하고 `food / alias / rule / source` 같은 정적 데이터만 다시 맞춤

운영 문서:

- [docs/deployment-ops.md](/Users/badal/dev/projects/colono-food-check/docs/deployment-ops.md)
- [docs/production-runbook.md](/Users/badal/dev/projects/colono-food-check/docs/production-runbook.md)
- [docs/operations-loop.md](/Users/badal/dev/projects/colono-food-check/docs/operations-loop.md)
- [docs/fallback-triage.md](/Users/badal/dev/projects/colono-food-check/docs/fallback-triage.md)

---

## 11. 테스트

현재 테스트는 아래를 포함합니다.

- `/api/check` 기본 에러 응답
- `/api/prewarm` 메서드 검증
- 대표 음식 케이스 판정 기대값
- fallback / alias / food group 동작

실행:

```bash
npm test
```

---

## 12. 다음 운영 포인트

- Search Console 사이트맵 상태 반영 확인
- 카카오 공유 실기기 확인
- fallback 상위 검색어 지속 보강
- production cold/warm 응답 체감 점검

---

## 13. 한 줄 요약

`건강신호등 - 대장내시경 음식체크`는 대장내시경 전 음식 섭취 가능 여부를 날짜별로 빠르게 판정해주는 실사용형 검색 도구입니다.

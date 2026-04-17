# production runbook

## 목적

이 문서는 실제 production 배포 직전과 직후에 따라야 할 최소 절차를 정리한다. 현재 프로젝트는 `Vercel + hosted PostgreSQL` 기준으로 운영한다.

## 1. 필요한 환경변수

### 필수

```bash
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SITE_URL="https://your-production-domain.com"
```

### 권장

```bash
DIRECT_URL="postgresql://..."
```

## 2. Vercel 환경변수 설정 기준

아래 기준으로 분리한다.

- `Preview`
  - preview 전용 DB 또는 읽기/테스트용 DB 연결
  - `NEXT_PUBLIC_SITE_URL` 은 preview deployment URL 또는 preview 도메인 사용
- `Production`
  - production DB만 연결
  - `NEXT_PUBLIC_SITE_URL` 은 실제 서비스 도메인 사용

입력 기준:

1. Vercel Project Settings
2. Environment Variables
3. `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SITE_URL` 등록
4. Preview / Production 대상 환경을 분리해서 저장
5. 환경변수 수정 후 재배포

## 3. production DB 반영 절차

최초 배포 기준:

```bash
npm install
npm run prisma:generate
npm run db:push
npm run db:seed
npm run build
```

주의:

- 현재 seed는 초기화 성격이 있으므로 production에서는 최초 1회만 사용한다.
- 운영 중에는 `db:seed` 재실행 금지다.
- 운영 중 데이터 보강은 필요한 `alias`, `food`, `rule`만 선택적으로 반영한다.

운영 중 정적 데이터 보강 기준:

```bash
npm run db:sync-static
```

`db:sync-static`는 아래를 유지한 채 정적 데이터만 다시 맞춘다.

- 유지: `SearchLog`, `Condition`, `DayStage`
- 재동기화: `foodGroup`, `foodTag`, `food`, `foodAlias`, `foodTagMap`, `judgementRule`, `recommendedMenu`, `source`, 각 source link

## 4. production 검증 절차

배포 후 아래 순서로 확인한다.

### 1) 홈 화면 확인

- production URL 접속
- 모바일 / 데스크톱에서 첫 화면 레이아웃 확인
- favicon, 제목, 설명, OG 메타 확인

### 2) health endpoint 확인

```bash
curl -s https://your-production-domain.com/api/health
```

기대 결과:

- `status = ok`
- `database = connected`

### 3) 실제 검색 API 확인

```bash
curl -sG "https://your-production-domain.com/api/check" \
  --data-urlencode "condition=colonoscopy" \
  --data-urlencode "dayStage=d3" \
  --data-urlencode "query=바나나"
```

최소 확인 항목:

- `status`
- `confidenceGrade`
- `matchedType`
- `primaryReason`
- `recommendedMenus`

### 4) alias / fallback 샘플 확인

```bash
curl -sG "https://your-production-domain.com/api/check" \
  --data-urlencode "condition=colonoscopy" \
  --data-urlencode "dayStage=d3" \
  --data-urlencode "query=컵우동"

curl -sG "https://your-production-domain.com/api/check" \
  --data-urlencode "condition=colonoscopy" \
  --data-urlencode "dayStage=d3" \
  --data-urlencode "query=볶음우동"
```

기대 결과:

- `컵우동 -> alias / B`
- `볶음우동 -> fallback / C`

### 5) SearchLog 적재 확인

```sql
select query, "matchedType", "resultStatus", "confidenceGrade", "createdAt"
from "SearchLog"
order by "createdAt" desc
limit 20;
```

## 5. 운영 중 확인할 최소 지표

### 검색량

```sql
select date_trunc('day', "createdAt") as day, count(*) as total
from "SearchLog"
group by 1
order by 1 desc;
```

### fallback 비율

```sql
select
  count(*) filter (where "matchedType" = 'fallback') as fallback_count,
  count(*) as total_count,
  round(
    100.0 * count(*) filter (where "matchedType" = 'fallback') / nullif(count(*), 0),
    2
  ) as fallback_ratio_percent
from "SearchLog";
```

### confidence 분포

```sql
select "confidenceGrade", count(*) as total
from "SearchLog"
group by "confidenceGrade"
order by total desc;
```

### top queries

```sql
select "normalizedQuery", count(*) as total
from "SearchLog"
group by "normalizedQuery"
order by total desc, "normalizedQuery" asc
limit 20;
```

### top fallback queries

```sql
select "normalizedQuery", count(*) as total
from "SearchLog"
where "matchedType" = 'fallback'
group by "normalizedQuery"
order by total desc, "normalizedQuery" asc
limit 20;
```

### alias / exact / food_group / fallback 분포

```sql
select "matchedType", count(*) as total
from "SearchLog"
group by "matchedType"
order by total desc, "matchedType" asc;
```

## 6. 운영 반영 방식

현재 기준은 아래 순서다.

1. alias로 해결 가능한지 먼저 확인
2. food group으로 묶는 것이 안전한지 확인
3. 그래도 설명 품질이 부족하면 신규 food 추가
4. 필요 시 rationale, source, similarFoods, recommendedMenus까지 함께 보강

## 7. 아직 수동으로 남는 작업

- production PostgreSQL 실제 생성
- Vercel 프로젝트 생성 및 도메인 연결
- Vercel dashboard 환경변수 입력
- Search Console 실제 연결
- 첫 production SearchLog 수집 후 운영 backlog 재정렬

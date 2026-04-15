# 배포 및 운영 기준

## 기본 배포안

현재 MVP 기준 기본 배포안은 아래와 같다.

- Frontend + API: Vercel
- Database: hosted PostgreSQL
- 권장 시작안: Neon PostgreSQL

이 조합을 기본안으로 둔 이유는 다음과 같다.

- 현재 프로젝트가 Next.js Pages Router + API Routes 구조라 Vercel 배포와 잘 맞는다.
- 별도 서버 운영 없이 프론트와 API를 함께 배포할 수 있다.
- PostgreSQL만 안정적으로 연결되면 Prisma 구조를 그대로 유지할 수 있다.
- 운영 초기에 필요한 것은 복잡한 인프라보다 빠른 배포와 로그 확인이다.

## Production 환경변수

현재 코드 기준 필수 환경변수:

```bash
DATABASE_URL="postgresql://..."
```

권장 관리 기준:

- Preview / Production 환경을 분리한다.
- local `.env` 와 production 값을 섞지 않는다.
- production에는 로컬 Docker 주소를 절대 넣지 않는다.

추가 권장 변수:

```bash
DIRECT_URL="postgresql://..."
```

`DIRECT_URL`은 추후 Prisma CLI나 마이그레이션 경로를 더 안정적으로 분리할 때 사용한다. 현재 앱 실행에는 필수는 아니지만 production 운영에서는 같이 보관하는 편이 안전하다.

## 배포 전 체크리스트

1. production DB 생성
2. production `DATABASE_URL` 설정
3. `npm install`
4. `npm run prisma:generate`
5. `npm run db:push`
6. `npm run db:seed`
7. `npm run build`
8. `/api/check` 실제 호출 검증

## DB 초기화 및 seed 기준

최초 production 배포 시:

```bash
npm run db:push
npm run db:seed
```

주의:

- 현재 seed는 `deleteMany()` 기반 초기화가 포함되어 있어 운영 DB 재실행용으로는 그대로 쓰면 위험하다.
- production에서는 최초 1회 초기화용으로만 사용한다.
- 운영 중에는 seed 전체 재실행 대신 필요한 `alias`, `food`, `rule`만 점진적으로 반영한다.

## 운영 반영 순서

1. fallback 검색어 확인
2. triage 문서에서 `alias / food_group / new_food` 분류
3. seed 또는 관리 스크립트에 데이터 반영
4. staging 또는 preview 환경에서 `/api/check` 재검증
5. production 반영

## 최소 모니터링 포인트

운영 초기에 최소한 아래는 주기적으로 본다.

### 1) API 오류율

- `/api/check` 500 에러 발생 여부
- Prisma 연결 오류 여부

### 2) fallback 비율

- `matchedType = fallback`
- `confidenceGrade = C`

fallback 비율이 높아지면 데이터 커버리지가 부족하다는 신호다.

### 3) 대표 검색어 결과 품질

- 많이 검색되는 음식이 여전히 fallback인지
- alias로 처리 가능한데 미등록 상태인지
- 설명 문구가 사용자 기대와 어긋나지 않는지

### 4) SearchLog 적재 상태

- 로그가 비정상적으로 안 쌓이지 않는지
- `matchedType`, `matchedId`, `resultStatus`가 null 또는 잘못된 값으로 들어가지 않는지

### 5) 응답 속도

- 검색 응답이 체감상 느려지지 않는지
- DB 쿼리 수가 과도하게 늘지 않는지

## 운영상 현재 결정

- fallback group 자동 분류는 보류한다.
- alias로 닫을 수 있는 검색어를 가장 먼저 처리한다.
- 그 다음은 `food_group` 흡수, 마지막이 `new_food` 추가다.
- production seed 재실행은 금지하고, 점진 보강 방식으로 운영한다.

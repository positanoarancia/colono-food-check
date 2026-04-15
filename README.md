# 건강신호등 - 대장내시경 음식체크

## 1. 프로젝트 개요

대장내시경 전 먹어도 되는 음식을 검색으로 빠르게 확인할 수 있는 서비스.

브랜드:

- 건강신호등

현재 서비스:

- 대장내시경 음식체크

한 줄 설명:

- 음식명을 검색하면 대장내시경 준비 단계별로 **허용 / 주의 / 금지 여부를 신호등 형태로 판별**해주는 서비스

---

## 2. 문제 정의

대장내시경을 준비하는 사용자들은 다음과 같은 문제를 겪는다.

- “이 음식 먹어도 되나?”를 계속 검색해야 한다
- 병원 안내문은 길고, 음식별로 찾기 어렵다
- 블로그 정보는 신뢰도가 낮다
- 음식 단위로 빠르게 판단하기 어렵다

즉, 사용자는 “음식 단위의 즉시 판단 도구”를 원한다.

---

## 3. 핵심 기능

### 1) 음식 검색

- 음식명 입력
- 예: 바나나, 라면, 김치찌개

### 2) 날짜 선택

- 5일 전
- 3일 전
- 1일 전

### 3) 신호등 결과 제공

- 🟢 허용 (`allowed`)
- 🟡 주의 (`caution`)
- 🔴 금지 (`avoid`)
- 간단한 이유 설명

### 4) 유사 음식 추천

- 검색 음식과 유사한 음식 제안

### 5) 대체 메뉴 추천

- 해당 시점에서 먹을 수 있는 음식 제안

### 6) 출처 표시

- 병원/기관 기반 가이드 연결 (추후 확장)

### 7) 검색 로그 수집

- 사용자 검색 데이터를 기반으로 DB 확장

---

## 4. 도메인 설계 원칙

### 1) 대장내시경 전용 구조로 만들지 않는다

- 대장내시경은 하나의 `condition`일 뿐이다

### 2) 음식 사전이 아니라 “판별 엔진”으로 설계한다

구조:

- `condition` (상황)
- `day_stage` (날짜)
- `food`
- `food_group`
- `tag`
- `rule`

### 3) 판정은 태그 기반으로 수행한다

- 음식 -> 음식군 -> 태그 -> 규칙 -> 결과

### 4) 가장 보수적인 결과를 최종 결과로 사용한다

우선순위:

- `avoid > caution > allowed`

### 5) 결과 없음 대신 단계적 추론 구조를 사용한다

- exact match
- alias match
- food group match
- fallback

---

## 5. 기술 스택

- Frontend: Next.js
- Backend: Next.js API Routes
- Database: PostgreSQL
- ORM: Prisma
- Data: Seed 기반 초기 데이터

---

## 6. DB 설계 방향

핵심 테이블:

- `conditions`
- `day_stages`
- `foods`
- `food_groups`
- `food_tags`
- `food_group_tags`
- `judgement_rules`
- `food_aliases`
- `food_similarities`
- `recommended_menus`
- `sources`
- `search_logs`

---

## 7. MVP 범위

초기 구현 범위는 다음과 같다.

### 포함

- 대장내시경 condition
- 5일 전 / 3일 전 / 1일 전
- 대표 음식 50개 이상
- alias 20개 이상
- 음식군 및 태그 기반 판정
- 신호등 결과 표시

### 제외 (후순위)

- AI fallback
- 위염/장염 condition
- 자동 크롤링
- 사용자 제보 기능
- 개인 맞춤형 식단

---

## 8. 향후 확장

이 프로젝트는 다음 방향으로 확장한다.

### condition 확장

- 위염
- 장염
- 기타 건강 상태

### 기능 확장

- AI 기반 음식 판별
- 검색 기반 자동 DB 확장
- 상황별 식단 추천
- 병원별 기준 비교

---

## 9. 프로젝트 목표

단순 정보 제공 서비스가 아니라:

**상황별 음식 허용 여부를 판단해주는 엔진 구축**

---

## 10. 개발 메모

- 구조는 단순하게 시작하되, condition 기반 확장 가능하도록 설계
- 초기에는 정확도보다 “결과 없음 최소화”에 집중
- 검색 로그를 기반으로 지속적으로 데이터 확장
- UI는 신호등 구조 (🟢🟡🔴)를 중심으로 설계

---

## 11. 브랜드 구조

```md
서비스: 대장내시경 음식체크
브랜드: 건강신호등
```

표기:

- 대장내시경 음식체크 by 건강신호등

---

## 12. 실행 방향

1. DB schema 설계
2. Prisma schema 생성
3. seed 데이터 구축
4. 검색 API 구현
5. 판정 엔진 구현
6. UI 연결

---

## 13. 로컬 실행 방법

### 1) 의존성 설치

```bash
npm install
```

### 2) 환경변수 설정

```bash
cp .env.example .env
```

`DATABASE_URL` 에 사용할 PostgreSQL 주소를 넣습니다.

### 3) Prisma Client 생성 및 스키마 반영

```bash
npm run prisma:generate
npm run db:push
```

### 4) seed 실행

```bash
npm run db:seed
```

초기 seed 범위:

- condition: `colonoscopy`
- day stages: `d5`, `d3`, `d1`
- foods: 50개 이상
- aliases: 20개 이상
- rules: day stage + tag 기반 판정 규칙

### 5) 개발 서버 실행

```bash
npm run dev
```

### 6) API 테스트 예시

```bash
curl "http://localhost:3000/api/check?condition=colonoscopy&dayStage=d1&query=바나나"
```

```bash
curl "http://localhost:3000/api/check?condition=colonoscopy&dayStage=d3&query=라면"
```

```bash
curl "http://localhost:3000/api/check?condition=colonoscopy&dayStage=d5&query=국수"
```

응답에는 아래 필드가 포함됩니다.

- `query`
- `normalizedQuery`
- `condition`
- `dayStage`
- `matchedType`
- `matchedEntity`
- `status`
- `confidenceGrade`
- `rationale`
- `similarFoods`
- `recommendedMenus`

API 호출 시 `SearchLog` 도 함께 저장됩니다.

---

## 14. 한 줄 요약

“이 음식 먹어도 되나?”를 가장 빠르게 답해주는 서비스

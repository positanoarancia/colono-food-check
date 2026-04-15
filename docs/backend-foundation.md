# 건강신호등 MVP 백엔드 설계

## 1. 수정된 설계 개요

- 핵심 축은 `condition -> day_stage -> judgement_rule` 이다.
- `Condition` 은 순수한 판정 상황만 표현한다.
- `DayStage` 는 condition 별 단계 모델이며, `daysBefore` 는 날짜 기반 condition 에서만 쓰는 optional 필드다.
- 음식 판정은 `food`, `food_group`, `food_tag`, `judgement_rule` 조합으로 수행한다.
- 검색 해상도는 `exact_food -> alias -> food_group -> fallback` 순서로 본다.
- 신뢰도는 DB 컬럼 계산이 아니라 응답 산출 규칙으로 `A/B/C` 를 결정한다.

이번 수정에서는 `JudgementRule.conditionId` 를 제거하는 안을 선택했다. `DayStage` 가 이미 `conditionId` 를 가지므로, rule 에 condition 을 중복 저장하면 불일치 데이터가 들어갈 수 있다. MVP 기준에서는 rule 을 stage 단위로 관리해도 충분하고, 이 편이 더 단순하고 안전하다.

## 2. 수정된 Prisma schema

실제 스키마는 [prisma/schema.prisma](/Users/badal/dev/projects/colono-food-check/prisma/schema.prisma) 에 있다.

핵심 변경점:

- `Condition` 에서 `serviceName`, `brandName` 제거
- `JudgementRule` 에서 `conditionId` 제거
- `JudgementRule` 유니크 키를 `dayStageId + foodTagId` 로 단순화
- `RecommendedMenu.mealType` 추가
- `Source` 계층은 유지하되 MVP seed 는 단순 운용 가능하게 정리

ERD 수준 관계:

- `Condition` 1:N `DayStage`
- `DayStage` 1:N `JudgementRule`
- `FoodTag` 1:N `JudgementRule`
- `FoodGroup` 1:N `Food`
- `FoodGroup` N:M `FoodTag` via `FoodGroupTag`
- `Food` N:M `FoodTag` via `FoodTagMap`
- `Food` 1:N `FoodAlias`
- `Condition` 1:N `RecommendedMenu`
- `RecommendedMenu` N:M `Food` via `RecommendedMenuFood`
- `Source` N:M `JudgementRule`, `Food`, `FoodGroup`

SearchLog 해석 규칙:

- `matchedType = exact_food` -> `matchedId = Food.id`
- `matchedType = alias` -> `matchedId = FoodAlias.id`
- `matchedType = food_group` -> `matchedId = FoodGroup.id`
- `matchedType = fallback` -> `matchedId` 는 nullable, 필요하면 후보 정보는 `metadata` 사용
- `matchedType = none` -> `matchedId = null`

## 3. 수정된 seed 구조 설명

실제 시드는 [prisma/seed.ts](/Users/badal/dev/projects/colono-food-check/prisma/seed.ts) 에 있다.

현재 범위:

- condition: 1개 (`대장내시경`)
- day stages: 3개 (`5일 전`, `3일 전`, `1일 전`)
- food groups: 24개
- food tags: 17개
- foods: 58개
- aliases: 26개
- rules: 51개
- recommended menus: 6개
- sources: 4개

초기 seed 운영 원칙:

- `FoodGroupTag` 로 기본 분류를 넣는다.
- `FoodTagMap` 은 개별 음식 예외나 보정만 넣는다.
- 출처는 MVP 초기에 `RuleSource` 위주로만 연결한다.
- `FoodSource`, `FoodGroupSource` 는 비워 둬도 된다.

이 방향을 택한 이유는 MVP 에서 중요한 건 “왜 이 결과가 나왔는지” 설명하는 rule 근거이기 때문이다. food/group 별 출처는 나중에 상세 화면이 필요해질 때 점진적으로 채워도 된다.

## 4. 판정 로직 설명

기본 엔진은 [src/lib/judgement-engine.ts](/Users/badal/dev/projects/colono-food-check/src/lib/judgement-engine.ts) 에 있다.

판정 순서:

1. 검색어 normalize
2. `Food.normalizedName` exact match
3. `FoodAlias.normalizedAlias` match
4. food group fallback match
5. `FoodGroupTag` 를 기본 태그 집합으로 가져온다
6. `FoodTagMap` 를 개별 음식 보정 태그로 추가한다
7. 두 태그 집합을 합쳐 현재 `dayStage` 의 rule 과 비교한다
8. 가장 보수적인 상태를 선택한다

상태 우선순위:

- `avoid > caution > allowed`

병합 정책:

- 기본적으로 `FoodGroupTag` 를 적용한다
- 개별 음식의 예외/보정용으로 `FoodTagMap` 를 추가 적용한다
- 동일 태그가 둘 다 있으면 food 단 태그를 우선한다
- 최종 상태는 전체 태그 평가 결과 중 가장 보수적인 값을 사용한다

신뢰도 제안:

- `A`: exact food
- `B`: alias / food group
- `C`: fallback / 추정

## 5. 왜 이렇게 수정했는지 핵심 이유

- `Condition` 을 순수 도메인 모델로 정리해 확장 시 의미가 흔들리지 않게 했다.
- `JudgementRule.conditionId` 를 제거해 중복 관계와 데이터 불일치 위험을 없앴다.
- `FoodGroupTag + FoodTagMap` 이 각각 기본 분류와 예외 보정이라는 역할을 갖도록 더 명확히 했다.
- `RecommendedMenu.mealType` 로 식사 시간대 추천 UX 확장 여지를 남겼다.
- 출처 구조는 유지하되 seed 운용은 `RuleSource` 중심으로 단순화해 MVP 진입 비용을 낮췄다.
- `DayStage.daysBefore` 를 optional 로 유지해 날짜 기반 condition 과 상태 기반 condition 을 모두 수용하게 했다.

이 수정안의 목적은 구조를 무겁게 만들지 않으면서도, 대장내시경 MVP 이후 위염/장염 같은 condition 확장 시 DB 를 갈아엎지 않게 만드는 것이다.

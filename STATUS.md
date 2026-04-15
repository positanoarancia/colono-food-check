# STATUS.md

## 현재 상태

* 단계: Phase 19~21 완료
* 진행률: MVP 100%, Launch Prep 82%
* 마지막 업데이트: 2026-04-16

---

## 최근 작업

* `/api/check` 단계별 timing 로그를 추가해 병목 위치를 직접 볼 수 있게 정리
* exact food / alias 조회를 병렬화하고, static 성격 데이터 캐시를 적용
* food group 전체 조회 비용을 줄이고 similar foods를 후행 조회로 분리
* 홈 화면과 결과 화면을 `상단 상태 요약 -> 중단 이유 -> 하단 행동 카드` 구조로 재배치
* fallback 보강 문서와 운영 루프 문서를 현재 구조에서 계속 쓸 수 있는지 재확인

### 수정 파일

* [src/lib/check-food.ts](/Users/badal/dev/projects/colono-food-check/src/lib/check-food.ts)
* [src/pages/api/check.ts](/Users/badal/dev/projects/colono-food-check/src/pages/api/check.ts)
* [src/pages/index.tsx](/Users/badal/dev/projects/colono-food-check/src/pages/index.tsx)
* [TASK.md](/Users/badal/dev/projects/colono-food-check/TASK.md)
* [STATUS.md](/Users/badal/dev/projects/colono-food-check/STATUS.md)

### 결과

* cold request 기준 로컬에서 `/api/check` 총 응답이 약 `3.1s` 수준으로 측정됨
* 같은 인스턴스 warm request 기준 약 `670ms` 수준까지 내려감
* 가장 큰 병목은 초기 `condition_query`, `recommended_menus_query`, `exact_food_query` 쪽으로 확인됨
* UI는 결과 해석 우선순위가 더 명확해지고, 세부 근거는 접어서 볼 수 있게 정리됨

---

## 검증 결과

* typecheck: 통과 (`npx tsc --noEmit`)
* test: 통과 (`npm test`)
* build: 통과 (`npm run build`)
* 로컬 로그 샘플:
  * cold request
    * `condition_query: 738ms`
    * `recommended_menus_query: 969ms`
    * `exact_food_query: 807ms`
    * `total.duration: 3143ms`
  * warm request
    * `cache.hit: condition`
    * `cache.hit: stageBundle`
    * `exact_food_query: 437ms`
    * `similar_foods_query: 149ms`
    * `search_log_insert: 83ms`
    * `total.duration: 670ms`

---

## Planner 리뷰 요약

* production 체감 속도는 검색 결과의 신뢰감과 직결되므로 성능 로그를 먼저 넣고 병목을 보게 한 방향이 맞음
* 데이터 보강 문서는 새 구조 없이도 현재 triage 문서로 운영 가능해서 재사용하는 쪽이 효율적임
* warm / cold 차이를 명확히 본 덕분에 production에서는 cache hit 비율과 instance 재사용이 중요하다는 점이 드러남

## Designer 리뷰 요약

* 결과 화면은 “상태 이해 -> 이유 읽기 -> 다음 행동” 순서가 명확해야 하므로 3단 구조로 재배치한 것이 적절함
* 태그와 세부 규칙은 처음부터 모두 보여주지 않고 접는 방식이 훨씬 덜 복잡함
* 상태색은 유지하되 정보량이 많은 패널을 아래로 내린 덕분에 첫 인상이 더 안정적임

---

## 현재 문제 / 리스크

* 캐시는 인스턴스 메모리 기준이라 serverless cold start가 나면 첫 요청은 여전히 느릴 수 있다.
* production DB가 원격이라 로컬보다 네트워크 왕복 비용이 더 크면 cold request는 여전히 느릴 수 있다.
* 현재 `SearchLog` 저장은 응답 경로에 포함되어 있어 극단적으로 느린 DB 환경에서는 추가 지연이 남을 수 있다.
* fallback 음식 자체는 여전히 일부가 `caution / C`에 남아 있어 데이터 보강은 계속 필요하다.

---

## 다음 작업

* production에서 새 timing 로그를 보고 실제 병목이 로컬과 같은지 확인
* 필요하면 `recommendedMenus`와 `condition/dayStage`를 더 강하게 캐시하거나 정적 로딩 방식 검토
* warm / cold request 샘플을 production 기준으로 각각 수집
* fallback 상위 검색어를 다시 보강

---

## 메모

* 이번 라운드의 핵심은 “빠른 기능 추가”가 아니라 “병목을 보이게 하고, 체감 성능을 낮추고, 화면을 더 빨리 이해하게 만드는 것”이었다.

# STATUS.md

## 현재 상태

* 단계: Phase 19~21 완료, prewarm 적용 완료
* 진행률: MVP 100%, Launch Prep 84%
* 마지막 업데이트: 2026-04-16

---

## 최근 작업

* `/api/prewarm` endpoint를 추가해 `condition`, 전체 `dayStage + rules`, 전체 `recommendedMenus`, DB 연결을 검색 전에 미리 준비
* 홈 첫 진입 시 `/api/prewarm?condition=colonoscopy`를 백그라운드로 1회 호출하도록 연결
* prewarm은 `checkFoodByQuery`를 타지 않도록 분리해 `SearchLog`를 남기지 않게 유지
* 홈 콘솔에 `first-search-before-prewarm`, `first-search-after-prewarm`, `warm-search` timing 로그를 남기도록 추가
* `/api/check` 단계별 timing 로그를 더 읽기 쉽게 정리하고 `profile.summary` 로그를 추가
* exact food / alias 조회를 병렬화하고, `condition`, `dayStage + rules`, `recommendedMenus` 캐시를 강화
* `SearchLog` 저장을 응답 경로에서 분리해 메인 응답이 먼저 나가도록 조정
* 홈 화면과 결과 화면을 `상단 검색 -> 상태/이유 -> 유사 음식/추천 메뉴` 구조로 재배치
* 상태 카피, fallback 문구, confidence 문구를 더 자연스럽고 신뢰감 있게 정리

### 수정 파일

* [src/lib/check-food.ts](/Users/badal/dev/projects/colono-food-check/src/lib/check-food.ts)
* [src/pages/api/prewarm.ts](/Users/badal/dev/projects/colono-food-check/src/pages/api/prewarm.ts)
* [src/pages/index.tsx](/Users/badal/dev/projects/colono-food-check/src/pages/index.tsx)
* [TASK.md](/Users/badal/dev/projects/colono-food-check/TASK.md)
* [STATUS.md](/Users/badal/dev/projects/colono-food-check/STATUS.md)

### 결과

* fresh instance에서 prewarm 없이 첫 `/api/check` 요청은 약 `2.4s` (`profile.summary` 기준 `2301ms`) 수준으로 측정됨
* fresh instance에서 `/api/prewarm` 호출은 약 `2.6s` (`prewarm.summary` 기준 `2331ms`) 이고, 이후 첫 `/api/check`는 약 `1.7s` (`profile.summary` 기준 `1611ms`) 로 내려감
* 같은 인스턴스 warm request 기준 약 `670ms` (`profile.summary` 기준 `660ms`) 수준으로 유지됨
* prewarm 로그에는 `search_log_insert`가 없고, 실제 검색에서만 `searchLog.created`가 발생해 SearchLog 오염이 없음
* 메인 응답 이후 `SearchLog`가 비동기로 저장되어 체감 응답 지연이 줄어듦
* prewarm 이후에는 `condition`, `stageBundle`, `recommendedMenus` cache hit가 잡히고, 가장 큰 병목은 여전히 `exact_food_query` 쪽으로 남음
* UI는 상태와 이유를 먼저 보여주고, confidence/태그/세부 규칙은 아래로 내려가도록 정리됨

---

## 검증 결과

* typecheck: 통과 (`npx tsc --noEmit`)
* test: 통과 (`npm test`)
* build: 통과 (`npm run build`)
* 로컬 로그 샘플:
  * cold request without prewarm
    * `exact_food_query: 1319ms`
    * `alias_query: 669ms`
    * `recommended_menus_query: 445ms`
    * `totalDurationMs: 2301ms`
  * prewarm
    * `db_connect: 544ms`
    * `condition_query: 151ms`
    * `rule_query: 898ms`
    * `recommended_menus_query: 445ms`
    * `totalDurationMs: 2331ms`
  * first request after prewarm
    * `exact_food_query: 794ms`
    * `rule_query: 225ms`
    * `recommended_menus_query: 224ms`
    * `totalDurationMs: 1611ms`
  * warm request
    * `cache.hit: condition`
    * `cache.hit: stageBundle`
    * `cache.hit: recommendedMenus`
    * `exact_food_query: 518ms`
    * `similar_foods_query: 148ms`
    * `totalDurationMs: 660ms`

---

## Planner 리뷰 요약

* 첫 검색 체감 속도는 검색 이탈에 직접 연결되므로, 실제 검색을 미리 때리지 않고 static 데이터만 데우는 현재 접근이 적절함
* 기본 condition 기준으로 홈 진입 시 자동 prewarm하는 흐름은 추가 입력 없이 바로 가치가 발생하므로 MVP 범위에 맞음
* prewarm 전/후 timing 라벨을 남겨 운영에서 체감 개선을 확인할 수 있게 한 점이 유용함
* production 체감 속도는 검색 결과의 신뢰감과 직결되므로 성능 로그를 먼저 넣고 병목을 보게 한 방향이 맞음
* 데이터 보강 문서는 새 구조 없이도 현재 triage 문서로 운영 가능해서 재사용하는 쪽이 효율적임
* warm / cold 차이를 명확히 본 덕분에 production에서는 cache hit 비율과 instance 재사용이 중요하다는 점이 드러남
* `SearchLog`를 메인 응답에서 분리해도 운영 데이터는 유지되므로 현재 단계에서는 이 선택이 타당함

## Designer 리뷰 요약

* 홈 진입 즉시 조용히 실행되고 추가 버튼이나 로딩 UI를 만들지 않은 점이 현재 UX에 가장 잘 맞음
* 사용자가 눌러야 하는 요소를 늘리지 않아 검색 흐름이 그대로 유지됨
* timing 로그는 개발자용 콘솔에만 남기고 화면에는 노출하지 않아 시각 구조를 해치지 않음
* 결과 화면은 “상태 이해 -> 이유 읽기 -> 다음 행동” 순서가 명확해야 하므로 3단 구조로 재배치한 것이 적절함
* 태그와 세부 규칙은 처음부터 모두 보여주지 않고 접는 방식이 훨씬 덜 복잡함
* 상태색은 유지하되 정보량이 많은 패널을 아래로 내린 덕분에 첫 인상이 더 안정적임
* fallback 카피를 더 솔직하게 바꾸면서도 불안감을 과하게 키우지 않는 쪽으로 정리한 점이 좋음

---

## 현재 문제 / 리스크

* 캐시는 인스턴스 메모리 기준이라 serverless cold start가 나면 첫 요청은 여전히 느릴 수 있다.
* prewarm이 먼저 끝나기 전에 사용자가 바로 검색하면 `first-search-before-prewarm` 케이스로 남아 개선 폭이 제한될 수 있다.
* production DB가 원격이라 로컬보다 네트워크 왕복 비용이 더 크면 cold request는 여전히 느릴 수 있다.
* `SearchLog`를 비동기로 돌렸기 때문에 극단적 상황에서는 로그 저장 누락 가능성을 운영에서 확인해야 한다.
* `exact_food_query` 자체는 여전히 가장 큰 병목이라, prewarm 이후에는 이 구간 최적화가 다음 후보가 된다.
* fallback 음식 자체는 여전히 일부가 `caution / C`에 남아 있어 데이터 보강은 계속 필요하다.

---

## 다음 작업

* production에서 `prewarm.summary`와 `first-search-after-prewarm` 로그를 같이 보고 실제 개선 폭을 확인
* 필요하면 `exact_food_query` 경로를 더 줄이기 위한 select 경량화 또는 결과 캐시 검토
* warm / cold / prewarm-after-first 샘플을 production 기준으로 각각 수집
* fallback 상위 검색어를 다시 보강

---

## 메모

* 이번 라운드의 핵심은 “실제 검색을 미리 날리지 않으면서도, 첫 검색 전에 필요한 것만 조용히 준비해 체감 지연을 줄이는 것”이었다.

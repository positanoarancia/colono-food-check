# STATUS.md

## 현재 상태

* 단계: Phase 19~21 완료, prewarm 적용 완료, UI polish 반영 완료
* 진행률: MVP 100%, Launch Prep 86%
* 마지막 업데이트: 2026-04-16

---

## 최근 작업

* 색상 토큰을 `#2F6FED`, `#F7F8FA`, `#1F2937` 중심으로 재정의해 검색형 서비스 톤으로 정리
* 카드 스타일을 `흰 배경 + 1px #E5E7EB 테두리 + 16px radius + 16px padding` 기준으로 통일
* 상태 카드를 전체 채색 대신 왼쪽 강조선 방식으로 바꿔 더 단정하고 신뢰감 있게 조정
* 세부 정보와 보조 요소의 박스 느낌을 줄여 네이버 검색 결과처럼 평평한 정보 구조로 정리
* 결과 화면을 `상태 -> 기준 시점 -> 짧은 이유 -> 유사 음식 -> 추천 메뉴 -> 상세 정보` 순서로 전면 재구성
* 신뢰도, 직접 매칭/alias, 태그, 긴 설명은 첫 화면에서 내리고 `상세 정보 보기` 안으로 이동
* 이유 문구를 1~2줄의 짧은 생활 문장으로 다시 써서 첫 스캔 속도를 높임
* 검색 타이틀을 `먹어도 될까?`, CTA를 `먹어도 되는지 확인`으로 바꿔 행동 유도를 직접적으로 정리
* 홈과 결과 화면을 “데모 느낌”보다 실제 서비스 톤에 가깝게 보이도록 모노톤 중심 UI로 정리
* 배경, 카드, 버튼, 칩 스타일을 단순화하고 여백 중심 레이아웃으로 재조정
* 모바일에서 입력 영역, 단계 선택, 빠른 예시 터치 영역을 더 안정적으로 보이게 보정
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

* [src/pages/index.tsx](/Users/badal/dev/projects/colono-food-check/src/pages/index.tsx)
* [src/lib/check-food.ts](/Users/badal/dev/projects/colono-food-check/src/lib/check-food.ts)
* [src/pages/api/prewarm.ts](/Users/badal/dev/projects/colono-food-check/src/pages/api/prewarm.ts)
* [TASK.md](/Users/badal/dev/projects/colono-food-check/TASK.md)
* [STATUS.md](/Users/badal/dev/projects/colono-food-check/STATUS.md)

### 결과

* 전체 인상이 “설명형 카드 UI”보다 “바로 쓰는 검색형 서비스”에 더 가까워짐
* 파란 포인트 컬러와 흰 카드 위주의 구조로 신뢰감 있는 병원 안내 톤이 강화됨
* 상태 카드는 왼쪽 강조선만으로 구분되어 과한 경고 느낌 없이 결과를 빠르게 읽을 수 있게 됨
* 사용자가 결과를 열었을 때 3초 안에 `먹어도 되는지`, `왜 그런지`, `대신 뭘 먹을지` 순서로 바로 읽을 수 있게 정리됨
* 결과 화면의 기본 흐름이 `정보 읽기`보다 `바로 결정하기` 중심으로 바뀜
* 유사 음식은 카드형 목록에서 즉시 누를 수 있는 버튼형 선택지로 바뀌고 더 위로 올라옴
* 추천 메뉴도 행동 카드 성격이 강해져 대체 선택으로 바로 이어지게 정리됨
* 홈 첫 화면이 그라디언트/그림자 중심 톤에서 벗어나 더 절제된 서비스형 화면으로 정리됨
* 색상 사용을 상태 표현 위주로만 남기고, 기본 UI는 모노톤 + 1개 포인트 톤으로 축소됨
* 모바일 기준으로 단계 선택, 입력, CTA, 예시 칩의 간격과 터치 영역이 더 안정적으로 정리됨
* 큰 제목과 핵심 이유 문구의 위계가 선명해져 첫 스캔 속도가 좋아짐
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
* 디자인/사용성 반복 검수:
  * 1차: 결과를 읽는 순서가 길고 행동 요소가 아래에 있다는 점을 문제로 확인
  * 2차: `상태 -> 이유 -> 대체 선택` 흐름이 자연스럽고, 모바일에서 결정 속도가 충분하다고 판단해 종료
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

* 사용자의 실제 목적은 정보 수집이 아니라 “지금 먹을지 말지 결정”이므로 현재 구조가 더 맞다
* 긴 근거보다 짧은 이유와 대체 선택을 먼저 주는 것이 검색 이탈을 줄이는 데 유리하다
* CTA 문구를 더 직접적으로 바꾼 것은 첫 행동 유도에 도움이 됨
* 첫 화면은 검색 행동이 바로 보여야 하므로 랜딩성 장식보다 입력 흐름이 먼저 보이는 현재 톤이 더 적절함
* 심플한 서비스형 UI는 신뢰감을 높이고 검색 도구 성격과도 더 잘 맞음
* 첫 검색 체감 속도는 검색 이탈에 직접 연결되므로, 실제 검색을 미리 때리지 않고 static 데이터만 데우는 현재 접근이 적절함
* 기본 condition 기준으로 홈 진입 시 자동 prewarm하는 흐름은 추가 입력 없이 바로 가치가 발생하므로 MVP 범위에 맞음
* prewarm 전/후 timing 라벨을 남겨 운영에서 체감 개선을 확인할 수 있게 한 점이 유용함
* production 체감 속도는 검색 결과의 신뢰감과 직결되므로 성능 로그를 먼저 넣고 병목을 보게 한 방향이 맞음
* 데이터 보강 문서는 새 구조 없이도 현재 triage 문서로 운영 가능해서 재사용하는 쪽이 효율적임
* warm / cold 차이를 명확히 본 덕분에 production에서는 cache hit 비율과 instance 재사용이 중요하다는 점이 드러남
* `SearchLog`를 메인 응답에서 분리해도 운영 데이터는 유지되므로 현재 단계에서는 이 선택이 타당함

## Designer 리뷰 요약

* 검색형 서비스처럼 카드 톤이 평평해지고 불필요한 장식이 줄어 신뢰감이 더 강해짐
* 상태 카드의 왼쪽 보더 강조 방식이 병원 안내 톤과 잘 맞고 과한 색면보다 훨씬 안정적임
* 결과 첫 화면에서 상태와 이유만 크게 보이고 나머지는 접히면서 위계가 훨씬 선명해짐
* 유사 음식이 버튼형 선택지로 바뀌어 시선과 손가락이 바로 이동할 수 있게 됨
* 카드 수를 줄이고 상세 정보를 접으면서 모바일에서 정보 밀도가 적절해짐
* 색상을 줄이고 카드 장식을 억제해 “AI 생성 화면” 같은 인상을 상당히 줄임
* 여백과 타이포 위계를 키워서 실제 서비스 랜딩처럼 차분한 인상이 생김
* 모바일에서 검색 입력과 CTA가 한 흐름으로 읽히도록 정리된 점이 좋음
* 빠른 예시 칩과 주요 버튼의 터치 영역이 이전보다 안정적임
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
* 현재는 단일 페이지 내 `styled-jsx`로 관리하고 있어, 이후 화면 수가 늘어나면 스타일 토큰 분리가 필요할 수 있다.
* fallback 음식 자체는 여전히 일부가 `caution / C`에 남아 있어 데이터 보강은 계속 필요하다.

---

## 다음 작업

* production에서 실제 검색 결과를 몇 개 열어 보고 결정 속도가 충분한지 간단한 사용자 관점 체크
* production에서 모바일 실기기 기준으로 홈 첫 화면 인상과 입력 흐름을 한 번 더 확인
* production에서 `prewarm.summary`와 `first-search-after-prewarm` 로그를 같이 보고 실제 개선 폭을 확인
* 필요하면 `exact_food_query` 경로를 더 줄이기 위한 select 경량화 또는 결과 캐시 검토
* warm / cold / prewarm-after-first 샘플을 production 기준으로 각각 수집
* fallback 상위 검색어를 다시 보강

---

## 메모

* 이번 라운드의 핵심은 “실제 검색을 미리 날리지 않으면서도, 첫 검색 전에 필요한 것만 조용히 준비해 체감 지연을 줄이는 것”이었다.

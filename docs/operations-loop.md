# 개선 루프

## 운영 목표

현재 단계의 핵심은 구조를 더 복잡하게 만드는 것이 아니라, `SearchLog -> 분류 -> seed 보강 -> 재검증` 루프를 운영 가능한 형태로 굳히는 것이다.

## 운영 루프

1. 최근 검색 로그에서 `matchedType = fallback` 또는 `confidenceGrade = C` 비율을 확인한다.
2. fallback 검색어를 `alias / food_group / 신규 food` 중 어디로 흡수할지 분류한다.
3. 같은 검색어가 반복되면 검색량, 사용자 혼동도, 보강 난이도를 함께 보고 우선순위를 정한다.
4. 보강 방식은 아래 순서로 진행한다.
   - alias 추가
   - food_group 흡수
   - 대표 food 추가
   - judgement rule 설명 또는 source 보강
5. 보강 후에는 실제 `/api/check` 호출과 `SearchLog` 재확인을 다시 수행한다.

## 분류 기준

### 1) alias로 처리

아래 조건을 만족하면 alias가 우선이다.

- 이미 있는 대표 food와 사실상 같은 음식이다.
- 사용자 표현만 다르고 판정 근거는 기존 대표 food와 동일하다.
- 추가 rule 없이도 같은 결과를 내는 것이 안전하다.

예시:

- `컵우동 -> 우동`
- `멸치국수 -> 잔치국수`
- `치즈라면 -> 라면`
- `요플레 -> 요거트`
- `마라떡볶이 -> 떡볶이`
- `마라로제떡볶이 -> 로제떡볶이`

### 2) food_group으로 처리

아래 조건을 만족하면 food group 흡수가 우선이다.

- 세부 재료는 다르지만, 사용자 입장에서는 같은 카테고리로 묶어도 안내 품질이 크게 떨어지지 않는다.
- 신규 food를 바로 만들기에는 종류가 너무 많거나 변형이 많다.
- 우선 보수적인 카테고리 안내만 해도 서비스 품질이 올라간다.

예시:

- `볶음우동 -> 볶음면류`
- `쌀국수 -> 국물면류`
- `초코도넛 -> 미등록가공식품` 또는 `빵류`
- `시리얼 -> 미등록가공식품`
- `샌드위치도시락 -> 편의점식사류`

### 3) 신규 food로 처리

아래 조건을 만족하면 신규 food 추가가 우선이다.

- 실제 검색량이 높을 가능성이 크다.
- 사용자 혼동이 크고, 대표 food 한 개로 두면 설명 품질이 떨어진다.
- 유사 음식 추천과 추천 메뉴까지 연결하려면 독립 food가 유리하다.

예시:

- `닭죽`
- `소고기죽`
- `떡국`
- `순두부찌개`
- `오므라이스`
- `초밥`
- `돈까스`
- `감자탕`
- `닭갈비`
- `두유`

## 우선순위 기준

1. 반복 로그가 많은 검색어
2. 사용자가 자주 먹는 일상식 또는 프랜차이즈 변형 음식
3. 기존 대표 food와 가까워 빠르게 흡수 가능한 검색어
4. fallback 결과가 계속 `caution / C`로 남아 사용자 불신을 만들 수 있는 검색어
5. 추천 메뉴와 유사 음식 품질까지 함께 높일 수 있는 검색어

## 현재 운영 결정

- fallback group 자동 분류는 아직 보류한다.
- 현재는 사람이 `SearchLog`를 보고 alias, food group, 신규 food 중 하나로 수동 분류한다.
- 자동 분류는 실제 로그가 더 쌓여 패턴이 안정된 뒤에 도입한다.

## 추천 확인 쿼리 예시

```sql
select "normalizedQuery", count(*) as total
from "SearchLog"
where "matchedType" in ('fallback', 'none')
group by "normalizedQuery"
order by total desc, "normalizedQuery" asc
limit 30;
```

```sql
select "matchedType", "confidenceGrade", count(*) as total
from "SearchLog"
group by "matchedType", "confidenceGrade"
order by total desc;
```

CLI로 바로 확인할 때:

```bash
npm run ops:fallback-report
```

필요하면 개수도 줄일 수 있다.

```bash
npm run ops:fallback-report -- 20
```

이 스크립트는 아래 정보를 한 번에 보여준다.

- 검색어별 총 검색 수
- fallback 수
- confidence `C` 수
- 최근 검색 시점
- 어느 단계(`d5`, `d3`, `d1`)에서 나왔는지

## 현재 임시 기준

- unknown noodle / spicy / processed fallback group은 아직 자동 분류에 쓰지 않는다.
- 운영 중 검색 로그를 보고 실제 빈도를 확인한 다음 연결한다.
- pre-launch 단계에서는 실제 운영 로그가 적기 때문에, 검증용 수동 검색 로그를 함께 보고 초기 보강 우선순위를 잡는다.

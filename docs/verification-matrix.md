# 검증 매트릭스

출시 전 QA에서 확인해야 할 대표 음식, alias, fallback 사례를 정리한 문서다. 실제 운영 전에는 DB 연결 상태에서 `/api/check` 실호출로 다시 확인한다.

## 1) 대표 음식 검증 36선

| 음식 | d5 | d3 | d1 | 메모 |
| --- | --- | --- | --- | --- |
| 흰죽 | allowed | allowed | caution | 부드럽고 저섬유 |
| 흰쌀밥 | allowed | allowed | caution | 저섬유 주식 |
| 계란찜 | allowed | allowed | caution | 부드러운 단백질 |
| 삶은계란 | allowed | allowed | caution | 부드러운 단백질 |
| 두부 | allowed | allowed | caution | 담백한 단백질 |
| 연두부 | allowed | allowed | caution | 더 부드러운 단백질 |
| 감자 | allowed | allowed | caution | 부드러운 전분류 |
| 닭가슴살 | allowed | allowed | caution | 비교적 담백한 단백질 |
| 바나나 | allowed | allowed | caution | 비교적 무난한 과일 |
| 사과 | caution | avoid | avoid | 껍질과 섬유 주의 |
| 배 | caution | avoid | avoid | 껍질과 섬유 주의 |
| 카스테라 | caution | caution | avoid | 저섬유 간식이지만 가공식품 |
| 푸딩 | caution | caution | avoid | 부드럽지만 가공식품 |
| 우유 | caution | caution | avoid | 유제품 개인차 |
| 요거트 | caution | caution | avoid | 유제품 개인차 |
| 크래커 | caution | caution | avoid | 저섬유지만 가공식품 |
| 우동 | allowed | allowed | caution | 비교적 담백한 면 |
| 잔치국수 | allowed | allowed | caution | 국물면 기준 |
| 라면 | caution | avoid | avoid | 매운 양념, 건더기, 가공식품 |
| 컵라면 | caution | avoid | avoid | 튀김면, 조미, 가공식품 |
| 로제떡볶이 | caution | avoid | avoid | 매운 양념 + 유제품 |
| 불닭볶음면 | caution | avoid | avoid | 자극적인 양념과 가공식품 |
| 김치찌개 | avoid | avoid | avoid | 매운 양념과 건더기 |
| 된장찌개 | caution | avoid | avoid | 건더기 많은 국물 |
| 만둣국 | caution | avoid | avoid | 속재료와 가공식품 |
| 미역국 | avoid | avoid | avoid | 해조류 + 건더기 |
| 마라탕 | avoid | avoid | avoid | 채소, 건더기, 자극 양념 |
| 잡곡밥 | avoid | avoid | avoid | 잡곡 + 고섬유 |
| 현미밥 | avoid | avoid | avoid | 잡곡 + 고섬유 |
| 김밥 | avoid | avoid | avoid | 채소, 김, 복합 재료 |
| 삼각김밥 | avoid | avoid | avoid | 가공식품 + 김 |
| 편의점도시락 | caution | avoid | avoid | 복합 재료, 건더기 |
| 비빔밥 | avoid | avoid | avoid | 나물류와 양념 |
| 떡볶이 | caution | avoid | avoid | 분식류, 매운 양념 |
| 튀김 | caution | avoid | avoid | 튀김과 가공식품 |
| 샐러드 | avoid | avoid | avoid | 생채소, 고섬유 |
| 나물반찬 | avoid | avoid | avoid | 나물류 섬유 |
| 고구마 | avoid | avoid | avoid | 섬유질, 껍질 |
| 견과류 | avoid | avoid | avoid | 견과 잔사 |
| 맑은육수 | allowed | allowed | allowed | 맑은 유동식 |

## 2) alias 검증

| 입력어 | 기대 매칭 | 기대 confidence | 메모 |
| --- | --- | --- | --- |
| 국수 | 잔치국수 | B | 일반 표현 alias |
| 가락국수 | 우동 | B | 동일 계열 표현 |
| 컵우동 | 우동 | B | 새로 추가한 alias |
| 멸치국수 | 잔치국수 | B | 새로 추가한 alias |
| 치즈라면 | 라면 | B | 토핑형 alias |
| 요플레 | 요거트 | B | 브랜드/관용 표현 |
| 엽떡 | 떡볶이 | B | 브랜드명 alias |
| 마라떡볶이 | 떡볶이 | B | 변형 표현 alias |
| 마라로제떡볶이 | 로제떡볶이 | B | 변형 표현 alias |
| 샌드위치도시락 | 편의점도시락 | B | 도시락류 alias |

## 3) fallback 검증

아래 항목은 아직 대표 food가 없어 `caution / C`로 남는 케이스다.

| 입력어 | 현재 처리 | 다음 액션 |
| --- | --- | --- |
| 볶음우동 | fallback | 볶음면류 흡수 검토 |
| 쌀국수 | fallback | 국물면류 흡수 검토 |
| 초코도넛 | fallback | 미등록가공식품 또는 빵류 흡수 검토 |
| 시리얼 | fallback | 미등록가공식품 흡수 검토 |
| 돈까스 | fallback | 신규 food 검토 |
| 닭죽 | fallback | 신규 food 검토 |
| 소고기죽 | fallback | 신규 food 검토 |
| 떡국 | fallback | 신규 food 검토 |
| 순두부찌개 | fallback | 신규 food 검토 |
| 오므라이스 | fallback | 신규 food 검토 |
| 초밥 | fallback | 신규 food 검토 |
| 두유 | fallback | 신규 food 검토 |

## 4) 최종 QA 체크포인트

- 결과 카드에 `직접 매칭 / 별칭 매칭 / 보수적 추정`이 바로 보이는지
- `confidence A/B/C`가 사용자에게 해석 가능한 문구와 함께 노출되는지
- fallback 결과에서 미등록 음식 안내가 명확한지
- 유사 음식 버튼으로 바로 재검색이 가능한지
- 추천 메뉴가 현재 day stage와 맞는지

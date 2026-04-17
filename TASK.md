# TASK.md

## 현재 목표

대장내시경 음식체크 MVP를 실제로 사용할 수 있는 수준까지 완성한다.

---

## Phase 1 - 데이터 및 판정 안정화

* [x] 판정 엔진 고도화 적용
* [x] fallback 처리 개선 (confidence C + 명확한 메시지)
* [x] appliedRules → top 1~2개만 노출 구조 적용
* [x] API 응답 구조 UI 친화적으로 정리

---

## Phase 2 - seed 데이터 품질 개선

* [x] 핵심 tag rule 설명 문구 개선 (이유 중심으로 수정)
* [x] 병원/기관 기반 source 일부 rule에 연결
* [x] 대표 음식 리스트 검증 및 보완
* [x] alias 데이터 품질 개선
* [x] 유사 음식 데이터 검증

---

## Phase 3 - API 안정화

* [x] /api/check 응답 구조 확정
* [x] 에러 메시지 사용자 친화적으로 개선
* [x] SearchLog 저장 검증
* [x] edge case 테스트 (없는 음식 / 애매한 음식)

---

## Phase 4 - 기본 UI 연결 (최소)

* [x] 간단한 입력 UI (음식 검색)
* [x] 결과 카드 (신호등 + 설명)
* [x] 유사 음식 표시
* [x] 추천 메뉴 표시

---

## Phase 5 - 품질 검증

* [x] 주요 음식 20개 테스트
* [x] 오판 사례 체크
* [x] fallback 동작 확인
* [x] 결과 신뢰도 점검

---

## Phase 6 - 개선 루프

* [x] SearchLog 기반 미등록 음식 목록 확인
* [x] alias 추가
* [x] food group 보완
* [x] rule 보정

---

## 현재 우선순위

1. 판정 엔진 결과 품질
2. seed 데이터 신뢰도
3. API 응답 구조
4. UI 연결

---

## 완료 정의 (Definition of Done)

* 음식 검색 시 결과가 항상 나온다
* 결과에 이유가 포함된다
* 신호등 상태가 일관된다
* fallback이 안전하게 동작한다
* 최소 20개 음식에서 납득 가능한 결과를 제공한다



# TASK.md

## 현재 목표

대장내시경 음식체크 MVP를 로컬 DB 기준으로 실제 동작 검증하고, 운영 전 품질 보정을 완료한다.

---

## Phase 7 - DB 연결 및 실동작 검증

* [x] 로컬 PostgreSQL 실행 및 DATABASE_URL 설정
* [x] Prisma schema를 실제 DB에 반영
* [x] seed 데이터 실제 주입
* [x] Prisma Studio 또는 SQL로 주요 테이블 데이터 확인
* [x] `/api/check` 실제 호출 테스트
* [x] representative food 20개를 실제 API로 검증
* [x] 없는 음식 / alias 음식 / 브랜드 음식 실제 응답 확인

---

## Phase 8 - SearchLog 검증 및 개선 루프

* [x] `/api/check` 호출 시 SearchLog 적재 확인
* [x] matchedType / matchedId / resultStatus 값 검증
* [x] fallback / none 검색어가 정상적으로 기록되는지 확인
* [x] SearchLog 기준 미등록 음식 목록 추출
* [ ] alias 추가가 필요한 검색어 정리
* [ ] food group 보완이 필요한 검색어 정리

---

## Phase 9 - 오판 및 UX 보정

* [x] representative food 20개 실제 결과 검토
* [x] 사용자 입장에서 설명 문구가 납득 가능한지 점검
* [x] 과하게 보수적이거나 느슨한 rule 수정
* [x] similarFoods 추천 품질 점검
* [x] recommendedMenus 품질 점검
* [x] fallback 메시지 UX 개선

---

## Phase 10 - 출시 직전 최소 점검

* [x] 홈 화면에서 검색 → 결과까지 기본 흐름 재확인
* [x] 에러 없는지 확인
* [x] DB 연결 상태에서 빌드 및 실행 재확인
* [x] README 실행 방법 최신 상태로 정리
* [x] STATUS.md 최종 업데이트

---

## 현재 우선순위

1. 실제 DB 연결
2. `/api/check` 실호출 검증
3. SearchLog 확인
4. 오판 보정
5. 운영 전 최소 점검

---

## 완료 정의 (Definition of Done)

* DB 연결 상태에서 `/api/check`가 실제 동작한다
* representative food 기준 실제 응답이 납득 가능하다
* SearchLog가 정상 저장된다
* fallback 검색도 안전하게 처리된다
* 미등록 음식 보강 루프를 시작할 수 있다



# TASK.md

## 현재 목표

대장내시경 음식체크 MVP를 운영 가능한 상태로 정리하고, SearchLog 기반 데이터 확장 루프를 시작한다.

---

## Phase 11 - SearchLog 기반 데이터 확장

* [x] SearchLog fallback 검색어 전체 목록 추출
* [x] fallback 검색어를 alias / food group / 신규 food 후보로 분류
* [x] 우선 보강할 검색어 TOP 20 선정
* [x] alias 추가 대상 반영
* [x] food group 보완 대상 반영
* [x] 신규 food 추가 대상 정리

---

## Phase 12 - 운영 보강 원칙 정리

* [x] 미등록 음식 처리 기준 문서화
* [x] alias 추가 기준 문서화
* [x] food group 보완 기준 문서화
* [x] 신규 food 추가 기준 문서화
* [x] fallback group 자동 분류는 보류할지 여부 결정
* [x] 운영 루프 문서(로그 확인 → 데이터 보강 → 재검증) 정리

---

## Phase 13 - 배포 준비

* [x] 배포 환경 결정 (예: Vercel + hosted PostgreSQL)
* [x] production 환경변수 정리
* [x] DB 초기화 / seed 실행 절차 정리
* [x] README에 배포 및 운영 절차 반영
* [x] 최소 모니터링 포인트 정리

---

## Phase 14 - 출시 전 QA 확장

* [x] representative food 테스트를 30~50개 수준으로 확대
* [x] 브랜드/별칭 음식 테스트 확대
* [x] fallback 사례 테스트 확대
* [x] 설명 문구/신호등 결과 UX 최종 점검
* [x] 출시 전 리스크 목록 최종 정리

---

## 현재 우선순위

1. SearchLog 기반 fallback 정리
2. 데이터 보강 기준 문서화
3. 배포 준비
4. QA 확대

## 최근 완료 메모

* [x] 한 글자 부분 검색어(`흰`)가 `흰죽류` 같은 food group에 부분 매칭되던 문제를 막고 fallback으로 안전하게 유도
* [x] 공식 병원 source 10곳 이상과 ruleSource 다중 연결로 병원 근거 링크 풀 확장
* [x] fallback 상세를 중복이 적은 2단 구조로 단순화해 실기기에서 겹쳐 보이는 문제 완화
* [x] 현재 상태를 Vercel production에 재배포하고 live 응답 확인
* [x] FAQ 소개 블록을 기본 접힘으로 전환해 첫 항목만 펼쳐진 것처럼 보이던 혼선을 줄임
* [x] `먹어도 괜찮아요` 결과에서는 `대신 이렇게 고르세요`를 숨겨 허용 판정의 중복 안내를 제거
* [x] `감자`, `으깬감자`를 전날 대표 허용식으로 보정하고 production live 응답까지 확인
* [x] FAQ 질문을 공통 원칙 중심으로 다시 정리하고, 상세/대체 음식 섹션 라벨이 서로 겹치지 않게 보정
* [x] fallback 문구를 `등록된 음식 기준이 없다`는 표현으로 정리하고, fallback 상세를 한 섹션 기준 안내로 단순화
* [x] FAQ 답변을 한 문장 중심으로 더 짧게 축약해 공통 원칙만 빠르게 읽히도록 정리
* [x] SearchLog 3차 보강으로 `foodSource`/`foodGroupSource` direct 근거를 실제 seed와 결과 응답에 연결
* [x] 결과 응답에서 direct reference + rule reference를 전역 dedupe해 같은 병원 링크 반복을 축소
* [x] bulk exact food에서도 배지와 `비슷한 음식`이 비지 않도록 태그 라벨과 same-group fallback 추천 로직 보강
* [x] bulk catalog 표기 변형 alias 자동 생성 규칙을 보강하고 관련 smoke test 추가
* [x] 공식 병원 direct food에 대한 날짜별 representative QA 케이스 추가
* [x] fallback 박스 제목을 판단 방법 중심 문구로 바꾸고 어려운 표현(`잔사`) 제거
* [x] fallback 상세 토글을 날짜별 자가판단 가이드로 맞추고 문구 가독성을 위한 폰트/줄길이 보정
* [x] fallback 결과 문구를 날짜별 자가판단형 안내로 나눠 기준이 없을 때도 다음 판단 기준을 바로 볼 수 있게 보정
* [x] 결과 카드 문구를 `대장내시경 {기간}에는` 구조로 통일
* [x] 단계 탭을 `초기 준비 / 준비 식단 / 전날 식단` + `5–4일 전 / 3–2일 전 / 1일 전` 표기로 정리
* [x] 하단 로딩 문구와 progress bar 제거, 버튼 spinner만 유지
* [x] 추천 메뉴와 검색 인터랙션 분리
* [x] fallback 안내를 fallback 결과에서만 노출하도록 정리
* [x] 줄바꿈과 텍스트 폭을 480px 기준으로 재조정
* [x] 결과 카드를 상태 중심 구조로 재배치
* [x] `건강신호등` 브랜드 라벨에 작은 3색 점 포인트 적용
* [x] 대체 음식 섹션을 조건부 렌더링 + 최대 3개 노출로 정리
* [x] `왜 이렇게 안내하나요?` 영역을 사용자 언어 중심 구조로 재작성
* [x] 날짜 범위를 `4–5일 전 / 2–3일 전 / 1일 전` 표기로 통일
* [x] 검색 라벨 제거 및 결과 카드 폰트 계층을 명세값으로 정렬
* [x] 예시 음식 버튼을 가로 스크롤 구조로 전환
* [x] `왜 이렇게 안내하나요?`를 결과 카드 내부 하단으로 이동
* [x] 추천 메뉴를 기본 접힘 구조로 전환
* [x] 헤더를 질문형 카피로 교체
* [x] 추천 메뉴를 결과 화면에서 제거하고 FAQ/가이드 섹션으로 이동
* [x] 상세 이유의 기준 badge를 음식 특성 badge로 교체
* [x] 상세 이유에 외부 근거 링크 구조(`references`) 추가
* [x] 결과 카드 구분선을 제거하고 여백 중심 구조로 정리
* [x] FAQ를 기본 펼침 텍스트형으로 전환
* [x] 상세 이유 문장을 사용자 언어 기준 최종형으로 정리
* [x] README를 현재 운영 기준 문서로 재정리
* [x] Notion `서비스 목록` DB에 서비스 메타 정보 등록

---

## 완료 정의 (Definition of Done)

* fallback 검색어 보강 루프가 시작 가능하다
* 미등록 음식 처리 기준이 문서화되어 있다
* 배포에 필요한 절차가 정리되어 있다
* 대표 검색어와 fallback 사례에 대한 QA가 충분히 수행되었다


# TASK.md

## 현재 목표

대장내시경 음식체크 MVP를 실제 배포하고, 운영 로그를 기반으로 개선 루프를 시작한다.

---

## Phase 15 - Production 배포

* [ ] production PostgreSQL 생성
* [ ] production DATABASE_URL 설정
* [ ] preview / production 환경변수 분리 적용
* [ ] production DB schema 반영
* [ ] production seed 반영
* [ ] Vercel 배포 연결
* [ ] 실제 배포 URL에서 홈 화면 동작 확인
* [ ] 실제 `/api/check` production 호출 확인

---

## Phase 16 - 운영 준비

* [x] SearchLog 조회용 운영 쿼리 또는 간단 문서 정리
* [x] fallback 비율 확인 방법 정리
* [x] top queries 확인 방법 정리
* [x] 신규 food / alias / food group 반영 프로세스 정리
* [x] production seed 재실행 금지 원칙 재확인
* [x] 운영 중 데이터 반영 방식 결정 (수동 patch / migration / admin seed)

---

## Phase 17 - 초기 성장 준비

* [x] 대표 검색어 랜딩 문구 최종 점검
* [x] 메타 타이틀 / 설명 점검
* [x] favicon / OG 이미지 적용
* [ ] Search Console 연결
* [x] sitemap / robots 확인
* [x] 주요 키워드 랜딩 문구 점검

---

## Phase 18 - 운영 첫 루프

* [ ] 첫 실제 SearchLog 수집
* [ ] fallback 검색어 상위 목록 확인
* [x] alias 보강 1차 반영
* [x] 신규 food 후보 보강 1차 반영
* [x] representative QA 재실행
* [x] STATUS.md 운영 상태 업데이트

---

## 현재 우선순위

1. production 배포
2. production DB 연결 검증
3. 운영 로그 확인 체계 정리
4. fallback 검색어 기반 보강
5. 검색 유입 준비

---

## 완료 정의 (Definition of Done)

* production URL에서 서비스가 실제 동작한다
* production DB에 SearchLog가 정상 적재된다
* fallback 검색어를 운영 중 보강할 수 있는 절차가 있다
* 검색 유입을 받을 최소 SEO 세팅이 완료된다


# TASK.md

## 현재 목표

운영 직전 성능과 사용성을 다듬고, SearchLog 기반 데이터 보강 루프를 더 빠르게 돌릴 수 있게 만든다.

---

## Phase 19 - 성능 최적화

* [x] `/api/check` 단계별 소요 시간 로그 추가
* [x] condition / dayStage / rules / recommendedMenus 조회 병목 분석
* [x] exact food / alias 조회 병렬화
* [x] static 성격 데이터 캐시 적용
* [x] food group 전체 조회 비용 축소
* [x] similar foods 후행 조회로 분리
* [x] Prisma singleton 확인 및 유지
* [x] `/api/prewarm` 추가로 첫 검색 전 static 데이터와 DB 연결 prewarm 적용
* [x] 홈 진입 시 백그라운드 prewarm 1회 호출
* [x] prewarm 전/후 첫 검색 timing 비교 로그 추가

---

## Phase 20 - UI 구조 개선

* [x] 검색 영역 정보 구조 정리
* [x] 결과 화면을 상단 / 중단 / 하단 구조로 재배치
* [x] 세부 근거는 접어서 보이게 정리
* [x] 모바일 / 데스크톱 모두에서 위계가 덜 복잡하게 보이도록 조정
* [x] 상태색 중심 구조를 유지하되 과한 장식은 줄이기
* [x] 홈/결과 화면을 실제 서비스 톤의 심플한 스타일로 재정리
* [x] 여백·타이포 중심으로 모바일 UI 재정렬
* [x] 결과 화면을 빠른 결정 중심 순서로 전면 재구성
* [x] 이유 문구를 짧고 일상적인 문장으로 재작성
* [x] 검색형 판단 서비스에 맞게 헤더/단계 선택/결과 카피 전면 재설계
* [x] 단계 선택을 의미 중심 segmented control 형태로 재구성
* [x] 카드 기반 구조를 라인/섹션 기반 레이아웃으로 전환
* [x] 검색창/버튼/로딩 UX를 세로 흐름 중심으로 재정리
* [x] 검색 결과가 있는 상태에서 단계 변경 시 자동 재검색되도록 연결
* [x] 헤더 브랜드 포인트와 공유 버튼을 최소 변경으로 추가
* [x] 메인 SEO 1단계 메타/FAQ/구조화 데이터 반영
* [x] Google Search Console 사이트 검증 메타 태그 추가
* [x] OG 공유 이미지를 전용 프로모션 카드형으로 교체하고 공유 메타 문구 정리

---

## Phase 21 - 데이터 보강 준비

* [x] fallback 후보 문서 재확인
* [x] alias / food group / 신규 food 후보 분류 기준 유지
* [x] 운영 로그 기반 보강 루프 문서 재사용 가능 상태 확인

## 최근 완료 메모

* [x] 공식 병원 안내문 공통 기준과 직접 언급 식품을 바탕으로 mass expansion catalog를 추가하고 `food 3006개 / alias 688개 / source 13개`까지 대량 확장
* [x] 서울성모병원, 세브란스, 삼성서울병원 등 공식 안내문에 직접 나온 `깨죽 / 들기름 / 미나리 / 버섯류 / 콩 / 김치류 / 고기류 / 해조류 / 고추씨 / 옥수수` 등을 exact food로 직접 등록
* [x] `김치류`, `버섯류`, `콩류`, `잎채소류`, `씨있는채소과일류`, `기름조미류` 그룹을 추가하고 병원 음식군을 실제 검색어 중심으로 대량 확장
* [x] `파스타`, `짜장면`, `짬뽕`, `제육볶음`, `돈까스`, `설렁탕`, `카레라이스` 등 실제 외식 검색어를 exact food로 직접 등록
* [x] `혼합면류`, `짜장면류`, `소스파스타류`, `크림파스타류`, `국물식사류`, `육류반찬류`, `매운볶음류`, `덮밥류`, `볶음밥류`, `까스류` 등 신규 food group과 tag 매핑 추가
* [x] `processed / chunky / spicy / fried` 규칙에 공식 병원 source를 추가 연결해 새 bulk food도 근거 링크를 함께 노출할 수 있게 보강
* [x] bulk seed smoke test 추가로 `2000개 이상 / 대표 음식 포함 / alias 중복 없음 / 병원 source 10곳 이상` 조건을 자동 검증
* [x] production DB에 최신 정적 데이터를 sync하고 live에서 `파스타 / 짜장면 / 짬뽕 / 돈까스 / 제육볶음` exact match 검증
* [x] `깨죽 / 들기름 / 미나리 / 버섯류`가 local exact food로 잡히는지 추가 검증
* [x] 결과 상세를 `왜 이렇게 봤나요? / 대신 이렇게 고르세요 / 참고 근거` 구조로 줄여 FAQ와 겹치던 일반 설명을 크게 정리
* [x] fallback 상단 안내 박스를 제거하고, 상세 안에서도 `등록된 기준이 없어요` 같은 반복 문장을 빼고 자가판단 포인트만 남기도록 정리
* [x] FAQ를 공통 원칙 3문항 중심의 접힘 구조로 바꿔 결과/상세/FAQ가 같은 말을 반복하는 문제 완화
* [x] 참고 근거 링크를 고를 때 병원 라벨 중복을 줄이고 검색어별로 노출 시작점을 조금씩 다르게 잡아 같은 링크만 반복되는 느낌 완화
* [x] `ops:fallback-report` 스크립트 추가로 `fallback / confidence C` 검색어를 개수, 단계, 최근 검색 시점 기준으로 바로 뽑을 수 있게 정리
* [x] production-safe `db:sync-static` 경로 추가로 운영 DB에서 `food / alias / rule / source`만 안전하게 재동기화할 수 있게 정리
* [x] Vercel production 환경변수 pull 후 live DB에 정적 데이터 sync 실제 반영
* [x] production 재배포 및 `포카리 / 도토리묵 / 모닝빵 / 흑미밥 / 맑은쥬스` live 검색 검증
* [x] 공식 병원 안내문에서 반복 등장하는 허용/피하기 예시를 기준으로 `food 75개 / alias 77개`까지 확장
* [x] `포카리`, `도토리묵`, `모닝빵`, `맑은쥬스`, `흑미밥` 같은 실제 검색어가 exact/alias로 잡히도록 seed 보강
* [x] `묵`, `이온음료`, `사과주스`, `김`, `흑미밥`, `토마토` 대표 케이스를 judgement test에 추가해 회귀 방지
* [x] fallback 상세를 중복이 적은 2단 구조로 단순화해 실기기에서 겹쳐 보이는 문제 완화
* [x] 현재 상태를 Vercel production에 재배포하고 live 응답 확인
* [x] fallback 박스 제목을 판단 방법 중심 문구로 바꾸고 어려운 표현(`잔사`) 제거
* [x] fallback 상세 토글을 날짜별 자가판단 가이드로 맞추고 문구 가독성을 위한 폰트/줄길이 보정
* [x] Search Console 제출 대기 상태를 확인하고 `sitemap.xml` / `robots.txt` 공개 응답 정상 여부 검증
* [x] 공유 버튼을 텍스트형 `공유하기` 버튼으로 바꾸고 성공/복사 피드백 문구를 결과형으로 정리
* [x] Web Share payload를 URL 중심으로 단순화해 카카오 공유 시 중복 텍스트 가능성 축소
* [x] 예시 음식 / 대체 음식 / 단계 변경 후 결과 상단으로 부드럽게 스크롤 정렬
* [x] FAQ / 가이드 영역을 카드 톤으로 통일
* [x] `흰죽`, `흰쌀밥`, `카스테라`, `식빵`, `크래커`를 전날 허용 대표식으로 보정하고 seed 반영
* [x] 헤더 상단의 `건강신호등` / `공유하기` 정렬을 다시 맞추고 모바일에서 버튼이 튀어나와 보이지 않게 보정
* [x] `건강신호등` 브랜드 라벨의 pill 스타일을 제거해 상단에서 버튼처럼 보이지 않게 위계 정리
* [x] 재검색 시 결과 카드가 아니라 날짜 피커가 다시 보이도록 스크롤 기준점 변경
* [x] `블루 + 세이지` 컨셉으로 헤더/검색/칩/FAQ 톤을 정리하고 타이틀 크기와 줄바꿈 위계 재조정
* [x] 첫 화면을 브랜드 카드 + 내부 검색 카드 구조로 재구성해 `블루 + 세이지` 컨셉을 실제 화면에 더 강하게 반영
* [x] 그라데이션을 걷어내고 `검색 카드 / 결과 카드 / FAQ 섹션` 기준의 플랫한 프리미엄 의료 UI로 다시 정리
* [x] 바깥 카드와 박스감을 더 줄여 `완전 미니멀형` 편집 레이아웃으로 재조정
* [x] 모바일 좌우 여백과 결과 왼쪽 여백을 소폭 늘려 기준선 답답함 완화
* [x] 브랜드 라벨의 불릿 제거, 크기 확대, 블루그레이 톤 정리

---

## 현재 우선순위

1. fallback 검색어 보강 4차
2. alias 대량 보강 4차
3. direct food source coverage 확대
4. representative QA 확대
5. SearchLog 운영 루프 재시작
6. production 실기기 확인

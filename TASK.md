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
* [ ] alias 보강 1차 반영
* [ ] 신규 food 후보 보강 1차 반영
* [ ] representative QA 재실행
* [ ] STATUS.md 운영 상태 업데이트

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

---

## Phase 21 - 데이터 보강 준비

* [x] fallback 후보 문서 재확인
* [x] alias / food group / 신규 food 후보 분류 기준 유지
* [x] 운영 로그 기반 보강 루프 문서 재사용 가능 상태 확인

---

## 현재 우선순위

1. production 성능 로그 확인
2. warm / cold 응답 차이 확인
3. fallback 검색어 보강
4. production 운영 루프 시작

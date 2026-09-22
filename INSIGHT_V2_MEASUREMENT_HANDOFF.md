# 메디힘 인사이트 콘텐츠 워싱 v2 측정 인계서

## 1. 기준선과 작업 범위

- 기준 저장소: `https://github.com/medihim/web`
- 기준 브랜치: `main`
- 기준 커밋·v1 기준 커밋: `372f81c505e187666ec2564d73391d1a42270236`
- 기준 커밋 시각: `2026-08-11T10:39:08+09:00`
- 측정 로직 버전: `2026-08-06`
- v2 콘텐츠 수정일: `2026-08-25`
- v2 라이브 배포 시각: 미정
- 참고본: `medihim_insights_washed_v2_20260805`와 사용자가 제공한 ChatGPT 공유 대화

이번 작업은 최신 운영 소스를 별도 작업 사본으로 복제한 뒤 인사이트 허브 1개, 카테고리 5개, 상세 콘텐츠 18개와 인사이트 측정 스크립트 2개만 부분 병합했다. 홈페이지, GNB, 공통 헤더·푸터, 문의폼, CNAME, 배포 설정, GA4·GTM·Meta 설치 구조와 인사이트 외 페이지는 변경하지 않았다. 라이브 배포, 운영 브랜치 병합, commit, push는 수행하지 않았다.

`INSIGHT_VERSION_REGISTRY.json`은 v1의 파일별 SHA-256, 제목, `content_id`, CTA, 카테고리, URL, 추적 조건과 권장 측정기간을 보존한다. v2의 `version_start_at`과 최상위 `v2_deployment_at`은 실제 배포 전까지 `null`이다.

## 2. 현재 측정 계약

### 2.1 콘텐츠 식별과 본문 대상

- `content_id`: 기존 `body[data-article-id]`가 있으면 그 값을 사용하고, 없던 6개 legacy 문서는 파일명에서 `.html`을 제거한 값을 사용했다.
- 18개 `content_id`는 모두 고유하며 v1과 v2에서 동일하다.
- v2의 대표 측정 요소는 각 상세 페이지에 이미 존재하던 최상위 `article.prose`다. 새 `article` 요소를 만들지 않았다.
- 기존 선택자 `main .article-layout article.prose, main article[data-article-detail]`를 그대로 유지했다.
- v2 대표 요소의 속성: `data-content-id`, `data-content-version="v2"`, `data-title-variant="t2"`, `data-cta-type`, `data-tracking-version="2026-08-06"`, `data-content-category`, `data-content-type="longform_diagnostic"`, `data-modified-date="2026-08-25"`, `data-content-title`.

기준선의 18개 문서에는 `application/ld+json` 구조화 데이터가 없었다. 기존에 없던 JSON-LD를 임의로 추가하지 않았고, article Open Graph 수정일 메타인 `article:modified_time`만 실제 콘텐츠 수정일로 기록했다.

### 2.2 진행률·완독 판정

- 진행률 계산식: `window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100`
- 50% 도달: `article_progress`, `progress_percent=50`, `article_completion_state=in_progress`
- 90% 도달: `article_progress`, `progress_percent=90`, `article_completion_state=completed`
- 현재 계약에서 완독은 90% 도달로 판정한다.
- `window.medihimGetArticleProgressContext()`는 현재 페이지에서 관찰된 최대 진행률을 반환한다.
- `article_progress` 중복 방지: 페이지 로드마다 생성되는 `reached` 객체에 50·90 전송 여부 저장
- `insight_scroll_50/90` 중복 방지: 페이지 로드마다 생성되는 `Set`에 임계값 저장
- 이벤트 순서, 임계값, 진행률 공식, 스크롤·리사이즈 리스너 수와 데이터레이어 전달 방식은 변경하지 않았다.

현재 로직은 article 선택자를 측정 활성화 조건으로 사용하지만 진행률 분모는 article 높이가 아니라 문서 전체 높이다. v1·v2 직접 비교 가능성을 지키기 위해 이번 작업에서 이 기준을 바꾸지 않았다.

### 2.3 실제 운영 이벤트

| 이벤트 | 기준선 동작 | v2 처리 |
|---|---|---|
| `select_content` | 인사이트 허브의 추적 카드 클릭 | 기존 이벤트 유지, 허브·카테고리·관련 인사이트 링크에 v2 메타데이터 전달 |
| `article_progress` | 상세 18편에서 50%·90% 도달 시 발생 | 이벤트명·조건·중복 방지 유지, v2 메타데이터 추가 |
| `cta_click` | `data-track="cta_click"` 요소 클릭 | 콘텐츠 CTA에 기존 이벤트 적용, v2 메타데이터 추가 |
| `consult_cta_click` | `insight-series.js`가 있는 12개 롱폼의 하단 상담 CTA | 기존 이벤트·하단 위치·진행 상태 유지, v2 메타데이터 추가 |
| `insight_view` | `insight-series.js`가 있는 12개 롱폼 진입 | 직접 `dataLayer.push` 유지, v2 메타데이터 추가 |
| `insight_engaged_30s` | 해당 롱폼에서 보이는 상태로 30초 경과 | 조건 유지, v2 메타데이터 추가 |
| `insight_scroll_50`, `insight_scroll_90` | 해당 롱폼에서 문서 진행률 임계값 도달 | 이벤트명·조건·Set 중복 방지 유지, v2 메타데이터 추가 |
| `readiness_start`, `readiness_complete` | 준비도 체크 상호작용 | 기존 동작 유지, v2 메타데이터 추가 |
| `lead_form_start`, `lead_submit_attempt`, `generate_lead` | 공통 문의 흐름 | 변경하지 않음 |

기준선에는 `scroll_50`, `scroll_90`, `meta_view_content`라는 이름의 이벤트가 없었다. 실제 운영명인 `insight_scroll_50`, `insight_scroll_90`과 Meta Pixel의 기존 `PageView` 설치를 그대로 보존했다. 유사 신규 이벤트나 Meta Pixel 설치를 추가하지 않았다.

### 2.4 v2 이벤트 매개변수

기존 매개변수와 자료형을 유지하면서 인사이트의 `select_content`, `article_progress`, `cta_click`, `consult_cta_click` 및 `insight-series.js` 직접 이벤트에 다음 값을 추가했다.

```javascript
{
  content_id: "기존 content_id",
  content_version: "v2",
  content_title: "현재 콘텐츠 제목",
  content_category: "기존 카테고리 식별값",
  content_type: "longform_diagnostic 또는 insight",
  title_variant: "t2",
  cta_type: "콘텐츠 역할별 CTA 유형",
  tracking_version: "2026-08-06"
}
```

기존 `article_id`, `progress_percent`, `article_completion_state`, `cta_position`, `cta_name`, `cta_location`, `audience`는 삭제하거나 형식을 바꾸지 않았다. 성과 집계의 기본 키는 제목이 아니라 `content_id`다.

## 3. CTA 운영 상태

v2 CTA 유형은 `self_diagnosis`, `checklist`, `template`, `data_diagnosis`, `model_diagnosis`, `consultation` 계약 안에서 콘텐츠 역할별로 구분했다. 현재 새 체크리스트·템플릿·계산기 URL은 구축되지 않았으므로 존재하지 않는 링크를 만들지 않았다. 모든 하단 CTA의 기존 `hospital-consultation.html` 링크는 유지하고 문구와 `cta_type`만 분리했다.

배포 전에는 실제 다운로드·자가진단 자산이 준비된 CTA만 링크를 교체해야 한다. 링크 교체 시에도 `content_id`, 이벤트명, `cta_type`은 유지한다.

## 4. v1·v2 비교 설계

### 4.1 비교 단위

`content_id + content_version + 유입 채널 + 기기 + 신규·재방문`

### 4.2 직접 비교 지표

- 유효 세션
- 일평균 유효 세션
- 유효 완독률 = 유효 완독 세션 ÷ 유효 콘텐츠 세션
- CTA 행동률 = CTA 클릭 세션 ÷ 유효 콘텐츠 세션
- 완독 후 CTA 행동률 = 완독 후 CTA 클릭 세션 ÷ 유효 완독 세션
- 문의 전환율 = 문의 완료 세션 ÷ 유효 콘텐츠 세션

v2에서 새로 추가되는 자가진단·마이크로 질문은 v1과 직접 비교하지 않고 v2 신규 기준선으로 관리한다.

### 4.3 기간

- 측정 변경 구간·직접 비교 제외: `2026-08-01`~`2026-08-06`
- v1 권장 비교기간: `2026-08-10`~`2026-08-30`
- 실제 배포일이 `2026-09-01`인 경우 배포·안정화: `2026-09-01`~`2026-09-06`
- 실제 배포일이 `2026-09-01`인 경우 v2 권장 비교기간: `2026-09-07`~`2026-09-27`

실제 배포일이 달라지면 배포일을 비교기간에서 제외하고 동일한 요일 구성과 동일한 일수로 다시 계산한다.

## 5. 검증 결과

<!-- TEST_RESULTS_START -->
- 정적 계약 검사: 통과. 변경 파일 28개, 삭제 0개, 고유 `content_id` 18개를 확인했다.
- JavaScript 구문 검사: `assets/analytics-events.js`, `assets/insight-series.js` 모두 통과했다.
- 로컬 Chromium 검사: 허브·카테고리·상세·문의 등 26개 경로가 모두 HTTP 200이었다.
- 이벤트 검사: `select_content`, 50%·90% `article_progress`, 하단 `cta_click`, `consult_cta_click`의 v2 매개변수와 완독 상태를 확인했다.
- 중복 검사: 50%·90% `article_progress`는 각각 1회만 발생했고, 콘솔 오류는 없었다.
- 공통 영역 회귀: 헤더·푸터·GTM·Meta 스니펫은 기준선과 동일하고, 모바일 메뉴 열기·닫기가 통과했다.
- 패치 외부 QA 증적: `insight-v2-browser-validation.json`, 허브 데스크톱·모바일 및 상세 데스크톱 스크린샷.

위 브라우저 검사는 로컬 작업 사본 기준이다. 실제 운영 GTM Preview, GA4 실시간·DebugView 및 배포 환경 시각 검수는 라이브 배포 권한이 필요한 별도 단계라 수행하지 않았다.
<!-- TEST_RESULTS_END -->

## 6. 실제 배포 전 필수 입력·확인

- [ ] `v2_deployment_at`
- [ ] v2 측정 시작일
- [ ] v2 측정 종료 예정일
- [ ] 배포 커밋
- [ ] 배포 담당자
- [ ] GTM Preview의 `select_content`, 50%·90% `article_progress`, `cta_click`, `consult_cta_click` 확인
- [ ] GA4 실시간·DebugView에서 `content_version=v2`와 기존 `content_id` 확인
- [ ] 동일 이벤트 중복 수신 여부 확인
- [ ] 실제 CTA 자산 구축 여부와 링크 교체 범위 확인
- [ ] 데스크톱·모바일에서 인사이트 허브, 카테고리 5개, 상세 18개 시각 검수
- [ ] 배포 커밋을 `INSIGHT_VERSION_REGISTRY.json`에 기록

이번 산출물 자체는 배포본이 아니라 부분 병합 작업 사본과 패치 ZIP이다.
## 7. 변경 파일 목록

- 인사이트 허브·카테고리: `insights.html`, `insight-acquisition.html`, `insight-data-ai.html`, `insight-market.html`, `insight-marketing.html`, `insight-operations.html`
- 상세 콘텐츠: 대상 18개 HTML
- 측정 스크립트: `assets/analytics-events.js`, `assets/insight-series.js`
- 버전·측정 문서: `INSIGHT_VERSION_REGISTRY.json`, `INSIGHT_V2_MEASUREMENT_HANDOFF.md`

합계는 수정 26개, 신규 2개, 삭제 0개다. 패치 ZIP에는 이 28개 파일만 포함한다.

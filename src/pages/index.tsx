import { FormEvent, useState } from "react";

type CheckResponse = {
  query: string;
  normalizedQuery: string;
  condition: { slug: string; name: string };
  dayStage: { slug: string; name: string };
  matchedType: "exact_food" | "alias" | "food_group" | "fallback" | "none";
  matchedEntity: {
    type: "food" | "food_alias" | "food_group";
    id: string;
    slug?: string;
    name?: string;
    alias?: string;
    canonicalFood?: { id: string; slug: string; name: string };
  } | null;
  status: "allowed" | "caution" | "avoid";
  confidenceGrade: "A" | "B" | "C";
  primaryReason: string;
  secondaryReason?: string;
  appliedTagSlugs: string[];
  topAppliedRules: Array<{
    tagSlug: string;
    status: "allowed" | "caution" | "avoid";
    rationale: string;
    source: "food" | "food_group";
  }>;
  similarFoods: Array<{
    id: string;
    slug: string;
    name: string;
    note: string | null;
  }>;
  recommendedMenus: Array<{
    id: string;
    slug: string;
    name: string;
    mealType: string | null;
    description: string | null;
    foods: Array<{
      id: string;
      name: string;
      roleLabel: string | null;
      quantityNote: string | null;
    }>;
  }>;
};

const stageOptions = [
  { value: "d5", label: "5일 전", hint: "비교적 여유 있는 단계" },
  { value: "d3", label: "3일 전", hint: "저잔사 식단 중심" },
  { value: "d1", label: "1일 전", hint: "가장 엄격한 단계" },
];

const quickExamples = ["바나나", "라면", "김치찌개", "흰죽", "샐러드", "카스테라"];

const statusConfig = {
  allowed: {
    label: "먹어도 괜찮아요",
    color: "#157347",
    bg: "linear-gradient(135deg, #effaf3 0%, #e1f4e7 100%)",
    chip: "#d4f2de",
  },
  caution: {
    label: "주의해서 드세요",
    color: "#9a5b00",
    bg: "linear-gradient(135deg, #fff7e5 0%, #fff0c9 100%)",
    chip: "#ffebb3",
  },
  avoid: {
    label: "피하는 게 좋아요",
    color: "#b42318",
    bg: "linear-gradient(135deg, #fff0ee 0%, #ffdeda 100%)",
    chip: "#ffd1ca",
  },
} as const;

const matchedTypeConfig: Record<
  CheckResponse["matchedType"],
  { label: string; description: string }
> = {
  exact_food: {
    label: "직접 매칭",
    description: "대표 음식이 직접 등록되어 있어 가장 정확한 편입니다.",
  },
  alias: {
    label: "별칭 매칭",
    description: "입력한 표현을 기존 대표 음식으로 인식해 판단했습니다.",
  },
  food_group: {
    label: "음식군 매칭",
    description: "정확한 음식 대신 같은 카테고리 기준으로 판단했습니다.",
  },
  fallback: {
    label: "보수적 추정",
    description: "직접 등록된 음식이 없어 안전한 방향으로 보수적으로 안내합니다.",
  },
  none: {
    label: "미확인",
    description: "검색어가 비어 있거나 판단할 수 없는 상태입니다.",
  },
};

const confidenceCopy: Record<CheckResponse["confidenceGrade"], string> = {
  A: "직접 확인된 음식",
  B: "비슷한 음식 기준",
  C: "보수적 추정",
};

const mealTypeLabel: Record<string, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};

const tagLabel: Record<string, string> = {
  "low-fiber": "저섬유",
  "soft-food": "부드러운 음식",
  "clear-broth": "맑은 국물",
  "high-fiber": "고섬유",
  seeded: "씨 있음",
  "with-peel": "껍질 있음",
  "whole-grain": "잡곡",
  nuts: "견과류",
  seaweed: "해조류",
  "vegetables-heavy": "채소 많음",
  namul: "나물류",
  "spicy-seasoning": "매운 양념",
  fried: "튀김",
  processed: "가공식품",
  chunky: "건더기 많음",
  dairy: "유제품",
  "red-purple": "적색·보라색",
};

function getMatchedSummary(result: CheckResponse) {
  if (result.matchedType === "alias" && result.matchedEntity?.type === "food_alias") {
    return `"${result.query}"를 "${result.matchedEntity.canonicalFood?.name}"로 인식해 판단했습니다.`;
  }

  if (result.matchedType === "food_group" && result.matchedEntity?.type === "food_group") {
    return `"${result.matchedEntity.name}" 음식군 기준으로 판단했습니다.`;
  }

  if (result.matchedType === "fallback") {
    return "대표 음식으로 아직 등록되지 않아 보수적 기준으로 안내했습니다.";
  }

  return "직접 등록된 대표 음식 기준으로 판단했습니다.";
}

function getStatusDescription(result: CheckResponse) {
  if (result.status === "allowed") {
    return `대장내시경 ${result.dayStage.name}엔 비교적 무난해요.`;
  }

  if (result.status === "caution") {
    return "양을 줄이거나 더 순한 음식이 좋아요.";
  }

  return "검사 준비에 방해가 될 수 있어요.";
}

function getFallbackCopy() {
  return {
    title: "등록되지 않은 음식이에요",
    body: "정확한 기준이 없어 조심해서 안내하고 있어요.",
  };
}

function getShortReasons(result: CheckResponse) {
  if (result.matchedType === "fallback") {
    return {
      primary: "기준이 없어 조심해서 봐요.",
      secondary: "비슷한 음식도 같이 확인해보세요.",
    };
  }

  const tagSet = new Set(result.appliedTagSlugs);

  if (result.status === "allowed") {
    if (tagSet.has("clear-broth")) {
      return {
        primary: "맑고 부담이 적은 편이에요.",
        secondary: "이 단계 식단에 비교적 잘 맞아요.",
      };
    }

    if (tagSet.has("low-fiber") || tagSet.has("soft-food")) {
      return {
        primary: "부담이 적고 무난한 편이에요.",
        secondary: "이 단계에서 비교적 안전해요.",
      };
    }

    return {
      primary: "지금은 비교적 괜찮아요.",
      secondary: "양만 과하지 않게 드세요.",
    };
  }

  if (result.status === "caution") {
    if (tagSet.has("processed")) {
      return {
        primary: "가공이 많아 조심하는 편이 좋아요.",
        secondary: "양을 줄이거나 다른 음식이 나아요.",
      };
    }

    if (tagSet.has("dairy")) {
      return {
        primary: "속이 불편할 수 있어요.",
        secondary: "적게 먹거나 다른 음식이 나아요.",
      };
    }

    return {
      primary: "상황에 따라 부담이 될 수 있어요.",
      secondary: "양을 줄이면 더 안전해요.",
    };
  }

  if (tagSet.has("high-fiber") || tagSet.has("vegetables-heavy") || tagSet.has("namul")) {
    return {
      primary: "섬유질이 많아 지금은 피해요.",
      secondary: "더 부드러운 음식이 좋아요.",
    };
  }

  if (tagSet.has("seeded") || tagSet.has("with-peel")) {
    return {
      primary: "씨나 껍질 때문에 피해요.",
      secondary: "잔사가 적은 음식이 더 나아요.",
    };
  }

  if (tagSet.has("spicy-seasoning") || tagSet.has("fried")) {
    return {
      primary: "자극이 있어 지금은 피해요.",
      secondary: "맑고 순한 음식이 더 좋아요.",
    };
  }

  return {
    primary: "검사 준비엔 맞지 않는 편이에요.",
    secondary: "더 안전한 음식으로 바꾸세요.",
  };
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [dayStage, setDayStage] = useState("d3");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResponse | null>(null);

  async function runSearch(nextQuery: string, nextDayStage = dayStage) {
    const trimmedQuery = nextQuery.trim();

    if (!trimmedQuery) {
      setError("음식명을 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        condition: "colonoscopy",
        dayStage: nextDayStage,
        query: trimmedQuery,
      });

      const response = await fetch(`/api/check?${params.toString()}`);
      const data = (await response.json()) as CheckResponse | { error: string };

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "검색 중 오류가 발생했습니다.");
      }

      setQuery(trimmedQuery);
      setDayStage(nextDayStage);
      setResult(data);
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runSearch(query, dayStage);
  }

  const status = result ? statusConfig[result.status] : null;
  const matchMeta = result ? matchedTypeConfig[result.matchedType] : null;
  const shortReasons = result ? getShortReasons(result) : null;
  const activeStage = stageOptions.find((option) => option.value === dayStage);

  return (
    <main className="page">
      <div className="page-shell">
        <section className="hero-card">
          <div className="eyebrow">대장내시경 음식체크 by 건강신호등</div>
          <div className="hero-copy-block">
            <h1 className="hero-title">대장내시경 전 음식, 바로 검색</h1>
            <p className="hero-copy">
              지금 단계에 맞는 음식인지 먼저 확인하고, 더 나은 선택까지 이어서 볼 수 있어요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="search-panel">
            <div className="stage-row">
              {stageOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDayStage(option.value)}
                  className={`stage-button${dayStage === option.value ? " is-active" : ""}`}
                >
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
            <p className="stage-hint">{activeStage?.hint}</p>

            <div className="search-row">
              <label className="search-input-wrap">
                <span className="search-label">음식 검색</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="예: 바나나, 라면, 김치찌개"
                  className="search-input"
                />
              </label>
              <button type="submit" disabled={loading} className="search-button">
                {loading ? "검색 중..." : "검색"}
              </button>
            </div>

            {loading ? (
              <div className="loading-card" aria-live="polite">
                <div className="loading-bar" />
                <p>음식 정보를 찾고 있어요.</p>
              </div>
            ) : null}

            <div className="quick-row">
              <p className="micro-copy">
                헷갈리는 음식도 먼저 안전한 쪽으로 안내해드려요.
              </p>
              <span className="quick-label">빠른 예시</span>
              <div className="quick-chips">
                {quickExamples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => runSearch(example)}
                    className="quick-chip"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {error ? <p className="error-text">{error}</p> : null}
        </section>

        {result && status && matchMeta ? (
          <section className="result-stack">
            <article className="result-hero" style={{ background: status.bg, color: status.color }}>
              <div className="result-topline compact">
                <div className="status-box" style={{ borderColor: `${status.color}30` }}>
                  <strong>{status.label}</strong>
                  <span>{getStatusDescription(result)}</span>
                </div>
                <span className="badge neutral">{result.dayStage.name} 기준</span>
              </div>

              <div className="result-main is-single">
                <div>
                  <h2 className="result-title">{result.query}</h2>
                  <p className="primary-reason">{shortReasons?.primary}</p>
                  <p className="secondary-reason">{shortReasons?.secondary}</p>
                </div>
              </div>
            </article>

            <section className="reason-grid">
              <article className="panel-card">
                <div className="panel-header">
                  <h3>판정 이유</h3>
                  <span>이유를 먼저 확인하세요</span>
                </div>
                <div className="reason-list">
                  <div className="reason-block is-primary">
                    <strong>핵심 이유</strong>
                    <p>{shortReasons?.primary}</p>
                  </div>
                  {shortReasons?.secondary ? (
                    <div className="reason-block">
                      <strong>추가 참고</strong>
                      <p>{shortReasons.secondary}</p>
                    </div>
                  ) : null}
                  {result.matchedType === "fallback" ? (
                    <div className="fallback-callout">
                      <strong>{getFallbackCopy().title}</strong>
                      <p>{getFallbackCopy().body}</p>
                    </div>
                  ) : null}
                  {(result.topAppliedRules.length > 0 || result.appliedTagSlugs.length > 0) ? (
                    <details className="details-box">
                      <summary>상세 정보 보기</summary>
                      <div className="support-row">
                        <span className="support-pill">{matchMeta.label}</span>
                        <span className="support-pill">
                          신뢰도 {result.confidenceGrade} · {confidenceCopy[result.confidenceGrade]}
                        </span>
                      </div>
                      <p className="details-copy">{getMatchedSummary(result)}</p>
                      {result.topAppliedRules.length > 0 ? (
                        <div className="rule-list">
                          {result.topAppliedRules.map((rule) => (
                            <div key={`${rule.tagSlug}-${rule.source}`} className="rule-item">
                              <div className="rule-topline">
                                <strong>{tagLabel[rule.tagSlug] ?? rule.tagSlug}</strong>
                                <span>{rule.source === "food" ? "개별 음식 보정" : "음식군 기본 규칙"}</span>
                              </div>
                              <p>{rule.rationale}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {result.appliedTagSlugs.length > 0 ? (
                        <div className="tag-row">
                          {result.appliedTagSlugs.map((tag) => (
                            <span key={tag} className="tag-pill" style={{ background: status.chip }}>
                              {tagLabel[tag] ?? tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </details>
                  ) : null}
                </div>
              </article>
            </section>

            <section className="insight-grid">
              <article className="panel-card">
                <div className="panel-header">
                  <h3>대체 음식</h3>
                  <span>바로 눌러서 다시 보기</span>
                </div>
                {result.similarFoods.length > 0 ? (
                  <div className="action-list">
                    {result.similarFoods.map((food) => (
                      <button
                        key={food.id}
                        type="button"
                        className="action-card is-strong"
                        onClick={() => runSearch(food.name)}
                      >
                        <strong>{food.name}</strong>
                        <span>{food.note ?? "이 음식으로 바로 다시 확인하기"}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="empty-copy">등록된 유사 음식이 아직 없습니다.</p>
                )}
              </article>

              <article className="panel-card">
                <div className="panel-header">
                  <h3>추천 메뉴</h3>
                  <span>지금 단계에 맞는 선택</span>
                </div>
                {result.recommendedMenus.length > 0 ? (
                  <div className="menu-list">
                    {result.recommendedMenus.map((menu) => (
                      <button
                        key={menu.id}
                        type="button"
                        className="menu-card is-strong"
                        onClick={() => {
                          const firstFood = menu.foods[0]?.name;
                          if (firstFood) {
                            void runSearch(firstFood, result.dayStage.slug);
                          }
                        }}
                      >
                        <div className="menu-topline">
                          <strong>{menu.name}</strong>
                          {menu.mealType ? (
                            <span>{mealTypeLabel[menu.mealType] ?? menu.mealType}</span>
                          ) : null}
                        </div>
                        {menu.description ? <p>{menu.description}</p> : null}
                        <div className="menu-foods">
                          {menu.foods
                            .map((food) =>
                              [food.name, food.roleLabel, food.quantityNote]
                                .filter(Boolean)
                                .join(" · "),
                            )
                            .join(" / ")}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="empty-copy">등록된 추천 메뉴가 아직 없습니다.</p>
                )}
              </article>
            </section>
          </section>
        ) : null}
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 32px 20px 80px;
          background:
            radial-gradient(circle at top left, rgba(232, 247, 239, 0.9) 0%, rgba(255, 248, 232, 0.85) 45%, #fff 100%);
          color: #17212f;
          font-family: "Pretendard Variable", "Pretendard", "Noto Sans KR", sans-serif;
        }

        .page-shell {
          max-width: 1080px;
          margin: 0 auto;
          display: grid;
          gap: 28px;
        }

        .hero-card,
        .panel-card,
        .result-hero {
          border-radius: 28px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 22px 54px rgba(15, 23, 42, 0.06);
        }

        .hero-card {
          background: rgba(255, 255, 255, 0.92);
          padding: 30px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: #ecf4ff;
          color: #175cd3;
          font-size: 13px;
          font-weight: 700;
        }

        .hero-grid {
          display: none;
        }

        .hero-copy-block {
          margin-top: 18px;
          max-width: 680px;
        }

        .hero-title {
          margin: 0;
          font-size: clamp(28px, 4vw, 42px);
          line-height: 1.08;
          letter-spacing: -0.04em;
        }

        .hero-copy {
          margin: 12px 0 0;
          color: #475467;
          font-size: 16px;
          line-height: 1.65;
        }

        .search-panel {
          display: grid;
          gap: 12px;
          margin-top: 22px;
        }

        .stage-row {
          display: inline-grid;
          grid-template-columns: repeat(3, auto);
          gap: 6px;
          align-self: start;
          padding: 4px;
          border-radius: 999px;
          background: #f5f7fb;
          border: 1px solid #e4e7ec;
        }

        .stage-button {
          border: none;
          background: transparent;
          border-radius: 999px;
          padding: 10px 14px;
          text-align: center;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .stage-button span {
          font-size: 14px;
          font-weight: 800;
          color: #667085;
        }

        .stage-button.is-active {
          background: #ffffff;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.08);
          transform: none;
        }

        .stage-button.is-active span {
          color: #101828;
        }

        .stage-hint {
          margin: -2px 0 2px;
          color: #667085;
          font-size: 13px;
          line-height: 1.5;
        }

        .search-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 120px;
          gap: 12px;
        }

        .search-input-wrap {
          display: grid;
          gap: 8px;
        }

        .search-label,
        .quick-label {
          font-size: 13px;
          font-weight: 800;
          color: #475467;
        }

        .search-input {
          height: 58px;
          border-radius: 20px;
          border: 1px solid #d0d5dd;
          padding: 0 18px;
          font-size: 17px;
          outline: none;
          background: #fff;
        }

        .search-input:focus {
          border-color: #175cd3;
          box-shadow: 0 0 0 4px rgba(23, 92, 211, 0.08);
        }

        .search-button {
          border: none;
          border-radius: 20px;
          background: linear-gradient(135deg, #111827 0%, #334155 100%);
          color: #fff;
          font-weight: 800;
          font-size: 16px;
          cursor: pointer;
        }

        .search-button:disabled {
          cursor: wait;
          opacity: 0.75;
        }

        .loading-card {
          display: grid;
          gap: 8px;
          padding: 12px 14px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid #e4e7ec;
        }

        .loading-card p {
          margin: 0;
          color: #475467;
          font-size: 14px;
          line-height: 1.5;
        }

        .loading-bar {
          position: relative;
          overflow: hidden;
          height: 6px;
          border-radius: 999px;
          background: #e7edf5;
        }

        .loading-bar::after {
          content: "";
          position: absolute;
          inset: 0;
          width: 36%;
          border-radius: 999px;
          background: linear-gradient(90deg, #9ec5ff 0%, #175cd3 100%);
          animation: loading-slide 1.2s ease-in-out infinite;
        }

        .quick-row {
          display: grid;
          gap: 8px;
        }

        .micro-copy {
          margin: 0;
          color: #667085;
          line-height: 1.6;
          font-size: 14px;
        }

        .quick-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .quick-chip {
          border-radius: 999px;
          border: 1px solid #d0d5dd;
          background: #fff;
          padding: 9px 12px;
          color: #344054;
          cursor: pointer;
          font-weight: 600;
        }

        .error-text {
          margin: 16px 0 0;
          color: #b42318;
          font-weight: 700;
        }

        .result-stack {
          display: grid;
          gap: 16px;
        }

        .result-hero {
          padding: 24px;
        }

        .result-topline {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
        }

        .result-topline.compact {
          align-items: center;
        }

        .badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 800;
        }

        .badge.neutral {
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(15, 23, 42, 0.08);
          color: #243041;
        }

        .status-box {
          min-width: 220px;
          display: grid;
          gap: 4px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid;
          padding: 16px;
        }

        .status-box strong {
          font-size: 28px;
          line-height: 1;
        }

        .status-box span {
          color: #475467;
          font-size: 14px;
        }

        .result-main {
          display: grid;
          gap: 18px;
          margin-top: 22px;
          margin-top: 16px;
        }

        .result-main.is-single {
          grid-template-columns: 1fr;
        }

        .result-title {
          margin: 0;
          font-size: clamp(32px, 4vw, 44px);
          line-height: 1.05;
          letter-spacing: -0.04em;
          color: #101828;
        }

        .result-summary,
        .primary-reason,
        .secondary-reason,
        .fallback-callout p,
        .rule-item p,
        .menu-card p,
        .empty-copy {
          color: #475467;
          line-height: 1.7;
        }

        .result-summary {
          margin: 12px 0 0;
          font-size: 15px;
          max-width: 640px;
        }

        .primary-reason {
          margin: 16px 0 0;
          font-size: 20px;
          color: #243041;
          font-weight: 700;
          line-height: 1.45;
        }

        .secondary-reason {
          margin: 10px 0 0;
          font-size: 16px;
          line-height: 1.7;
        }

        .reason-grid {
          display: grid;
          gap: 12px;
        }

        .reason-list {
          display: grid;
          gap: 14px;
        }

        .reason-block {
          padding: 18px;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
        }

        .reason-block.is-primary {
          background: #ffffff;
          border-color: #d0d5dd;
        }

        .reason-block strong,
        .fallback-callout strong {
          display: block;
          color: #101828;
          margin-bottom: 6px;
          font-size: 14px;
        }

        .reason-block p,
        .fallback-callout p {
          margin: 0;
          color: #475467;
          line-height: 1.7;
        }

        .fallback-callout {
          padding: 16px 18px;
          border-radius: 20px;
          background: rgba(255, 248, 232, 0.8);
          border: 1px dashed rgba(154, 91, 0, 0.24);
        }

        .support-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .support-pill {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 8px 12px;
          background: #f8fafc;
          border: 1px solid #e4e7ec;
          color: #475467;
          font-size: 13px;
          font-weight: 700;
        }

        .details-box {
          border-radius: 18px;
          border: 1px solid #e5e7eb;
          background: #fff;
          padding: 14px;
        }

        .details-box summary {
          cursor: pointer;
          font-weight: 800;
          color: #344054;
          list-style: none;
        }

        .details-copy {
          margin: 12px 0 0;
          color: #667085;
          line-height: 1.7;
        }

        .details-box summary::-webkit-details-marker {
          display: none;
        }

        .tag-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .tag-pill {
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 800;
          color: #223042;
        }

        .insight-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .panel-card {
          background: rgba(255, 255, 255, 0.96);
          padding: 20px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 20px;
          color: #101828;
        }

        .panel-header span {
          color: #667085;
          font-size: 13px;
          font-weight: 700;
        }

        .rule-list,
        .menu-list,
        .action-list {
          display: grid;
          gap: 10px;
        }

        .rule-item {
          padding: 14px;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
        }

        .rule-topline,
        .menu-topline {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: baseline;
        }

        .rule-topline span,
        .menu-topline span {
          color: #667085;
          font-size: 13px;
          font-weight: 700;
        }

        .rule-item p,
        .menu-card p {
          margin: 8px 0 0;
        }

        .action-card,
        .menu-card {
          width: 100%;
          text-align: left;
          padding: 16px 16px 15px;
          border-radius: 18px;
          border: 1px solid #e5e7eb;
          background: #fff;
        }

        .action-card {
          cursor: pointer;
          display: grid;
          gap: 6px;
        }

        .action-card.is-strong,
        .menu-card.is-strong {
          cursor: pointer;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }

        .action-card.is-strong:hover,
        .menu-card.is-strong:hover {
          transform: translateY(-1px);
          border-color: #cfd7e3;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
        }

        .action-card strong,
        .menu-card strong {
          color: #101828;
          font-size: 16px;
        }

        .action-card span,
        .menu-foods {
          color: #475467;
          line-height: 1.6;
        }

        .empty-copy {
          margin: 0;
        }

        @media (max-width: 920px) {
          .result-main,
          .insight-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .page {
            padding: 20px 14px 56px;
          }

          .hero-card,
          .result-hero,
          .panel-card {
            border-radius: 24px;
            padding: 22px;
          }

          .search-row {
            grid-template-columns: 1fr;
          }

          .hero-title {
            font-size: 32px;
          }

          .hero-copy {
            font-size: 15px;
          }

          .status-box {
            min-width: 0;
            width: 100%;
          }

          .page-shell {
            gap: 20px;
          }

          .result-stack {
            gap: 16px;
          }

          .stage-row {
            width: 100%;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .stage-button {
            padding: 10px 8px;
          }

          .stage-button span {
            font-size: 13px;
          }
        }

        @keyframes loading-slide {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(300%);
          }
        }
      `}</style>
    </main>
  );
}

import { FormEvent, useEffect, useRef, useState } from "react";

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
    color: "#16A34A",
    bg: "#F8FCF9",
    chip: "#EAF8EF",
  },
  caution: {
    label: "주의해서 드세요",
    color: "#F59E0B",
    bg: "#FFF9EF",
    chip: "#FEF3C7",
  },
  avoid: {
    label: "피하는 게 좋아요",
    color: "#DC2626",
    bg: "#FEF8F8",
    chip: "#FEE2E2",
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
    return `대장내시경 ${result.dayStage.name} 기준`;
  }

  if (result.status === "caution") {
    return `${result.dayStage.name}엔 조심하는 편이 좋아요`;
  }

  return `${result.dayStage.name}엔 피하는 게 안전해요`;
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
      primary: "기준이 없어 조심하는 편이 좋아요",
      secondary: "대신 먹을 수 있는 음식부터 보세요",
    };
  }

  const tagSet = new Set(result.appliedTagSlugs);

  if (result.status === "allowed") {
    if (tagSet.has("clear-broth")) {
      return {
        primary: "맑고 부담이 적어서 괜찮아요",
        secondary: "지금 단계 식단에 비교적 잘 맞아요",
      };
    }

    if (tagSet.has("low-fiber") || tagSet.has("soft-food")) {
      return {
        primary: "부담이 적어서 지금은 괜찮아요",
        secondary: "지금 단계에서 비교적 안전한 편이에요",
      };
    }

    return {
      primary: "지금은 비교적 괜찮은 편이에요",
      secondary: "양만 많지 않게 드시면 더 좋아요",
    };
  }

  if (result.status === "caution") {
    if (tagSet.has("processed")) {
      return {
        primary: "가공이 많아 조심하는 편이 좋아요",
        secondary: "양을 줄이거나 더 순한 음식이 나아요",
      };
    }

    if (tagSet.has("dairy")) {
      return {
        primary: "유제품이라 속이 불편할 수 있어요",
        secondary: "적게 먹거나 다른 음식이 더 나아요",
      };
    }

    return {
      primary: "지금은 부담이 될 수 있어요",
      secondary: "양을 줄이면 조금 더 안전해요",
    };
  }

  if (tagSet.has("high-fiber") || tagSet.has("vegetables-heavy") || tagSet.has("namul")) {
    return {
      primary: "섬유질이 많아서 지금은 피하세요",
      secondary: "더 부드러운 음식으로 바꾸는 게 좋아요",
    };
  }

  if (tagSet.has("seeded") || tagSet.has("with-peel")) {
    return {
      primary: "씨나 껍질이 있어 지금은 피하세요",
      secondary: "잔사가 적은 음식이 더 잘 맞아요",
    };
  }

  if (tagSet.has("spicy-seasoning") || tagSet.has("fried")) {
    return {
      primary: "매운 양념이나 기름이 부담이 돼요",
      secondary: "맑고 순한 음식으로 바꾸는 게 좋아요",
    };
  }

  if (tagSet.has("chunky")) {
    return {
      primary: "건더기가 많아서 장에 남을 수 있어요",
      secondary: "맑고 부드러운 음식이 더 안전해요",
    };
  }

  return {
    primary: "검사 준비에는 지금 맞지 않는 편이에요",
    secondary: "대신 먹을 수 있는 음식으로 바꾸세요",
  };
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [dayStage, setDayStage] = useState("d3");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResponse | null>(null);
  const hasAttemptedPrewarmRef = useRef(false);
  const prewarmFinishedRef = useRef(false);
  const firstSearchLoggedRef = useRef(false);

  useEffect(() => {
    if (hasAttemptedPrewarmRef.current) {
      return;
    }

    hasAttemptedPrewarmRef.current = true;

    const startedAt = performance.now();

    void fetch("/api/prewarm?condition=colonoscopy")
      .then(async (response) => {
        const data = (await response.json()) as
          | { ok: true; totalDurationMs: number; timings: Record<string, number> }
          | { error: string };

        if (!response.ok || "error" in data) {
          throw new Error("error" in data ? data.error : "prewarm failed");
        }

        prewarmFinishedRef.current = true;

        console.log("[home] prewarm.completed", {
          clientDurationMs: Math.round(performance.now() - startedAt),
          serverDurationMs: data.totalDurationMs,
          timings: data.timings,
        });
      })
      .catch((caught) => {
        console.warn("[home] prewarm.failed", {
          message: caught instanceof Error ? caught.message : String(caught),
        });
      });
  }, []);

  async function runSearch(nextQuery: string, nextDayStage = dayStage) {
    const trimmedQuery = nextQuery.trim();

    if (!trimmedQuery) {
      setError("음식명을 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    const startedAt = performance.now();
    const timingLabel = !firstSearchLoggedRef.current
      ? prewarmFinishedRef.current
        ? "first-search-after-prewarm"
        : "first-search-before-prewarm"
      : "warm-search";

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

      console.log("[home] search.completed", {
        label: timingLabel,
        query: trimmedQuery,
        dayStage: nextDayStage,
        durationMs: Math.round(performance.now() - startedAt),
        matchedType: data.matchedType,
        status: data.status,
      });
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "검색 중 오류가 발생했습니다.");
      console.warn("[home] search.failed", {
        label: timingLabel,
        query: trimmedQuery,
        dayStage: nextDayStage,
        durationMs: Math.round(performance.now() - startedAt),
        message: caught instanceof Error ? caught.message : String(caught),
      });
    } finally {
      firstSearchLoggedRef.current = true;
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
            <h1 className="hero-title">먹어도 될까?</h1>
            <p className="hero-copy">지금 단계에 맞는지 바로 확인하고, 대신 먹을 음식까지 바로 보세요.</p>
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
                {loading ? "확인 중..." : "먹어도 되는지 확인"}
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
              <p className="result-query-label">{result.query}</p>
              <div className="result-main is-single">
                <div className="decision-block">
                  <strong className="decision-status">{status.label}</strong>
                  <p className="decision-stage">{result.dayStage.name} 기준</p>
                  <p className="primary-reason">{shortReasons?.primary}</p>
                  <p className="secondary-reason">{shortReasons?.secondary}</p>
                </div>
              </div>
            </article>

            <section className="action-grid">
              <article className="panel-card">
                <div className="panel-header">
                  <h3>대신 먹을 수 있는 음식</h3>
                  <span>바로 눌러서 다시 보기</span>
                </div>
                {result.similarFoods.length > 0 ? (
                  <div className="action-chip-list">
                    {result.similarFoods.map((food) => (
                      <button
                        key={food.id}
                        type="button"
                        className="choice-button"
                        onClick={() => runSearch(food.name)}
                      >
                        {food.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="empty-copy">바로 제안할 유사 음식은 아직 없어요.</p>
                )}
              </article>

              <article className="panel-card">
                <div className="panel-header">
                  <h3>추천 메뉴</h3>
                  <span>지금 기준으로 더 무난한 선택</span>
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
                  <p className="empty-copy">지금 추천할 메뉴는 아직 없어요.</p>
                )}
              </article>

              <article className="panel-card">
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
              </article>
            </section>
          </section>
        ) : null}
      </div>

      <style jsx>{`
        .page {
          --primary: #2f6fed;
          --bg: #f7f8fa;
          --surface: #ffffff;
          --surface-soft: #f9fafb;
          --line: #e5e7eb;
          --line-strong: #d1d5db;
          --text: #1f2937;
          --muted: #6b7280;
          min-height: 100vh;
          padding: 28px 16px 72px;
          background: var(--bg);
          color: var(--text);
          font-family: "Pretendard Variable", "Pretendard", "Noto Sans KR", sans-serif;
        }

        .page-shell {
          max-width: 960px;
          margin: 0 auto;
          display: grid;
          gap: 20px;
        }

        .hero-card,
        .panel-card,
        .result-hero {
          border-radius: 16px;
          border: 1px solid var(--line);
          box-shadow: none;
        }

        .hero-card {
          background: var(--surface);
          padding: 16px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--muted);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .hero-grid {
          display: none;
        }

        .hero-copy-block {
          margin-top: 10px;
          max-width: 620px;
        }

        .hero-title {
          margin: 0;
          font-size: clamp(34px, 5vw, 48px);
          line-height: 1.08;
          letter-spacing: -0.04em;
          font-weight: 800;
        }

        .hero-copy {
          margin: 10px 0 0;
          color: var(--muted);
          font-size: 15px;
          line-height: 1.75;
        }

        .search-panel {
          display: grid;
          gap: 12px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid var(--line);
        }

        .stage-row {
          display: inline-grid;
          grid-template-columns: repeat(3, auto);
          gap: 4px;
          align-self: start;
          padding: 4px;
          border-radius: 999px;
          background: var(--surface-soft);
          border: 1px solid var(--line);
        }

        .stage-button {
          border: 1px solid transparent;
          background: transparent;
          border-radius: 999px;
          padding: 11px 16px;
          text-align: center;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.15s ease, background-color 0.15s ease;
        }

        .stage-button span {
          font-size: 14px;
          font-weight: 700;
          color: var(--muted);
        }

        .stage-button.is-active {
          background: var(--surface);
          border-color: var(--primary);
        }

        .stage-button.is-active span {
          color: var(--primary);
        }

        .stage-hint {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.5;
        }

        .search-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 132px;
          gap: 10px;
          align-items: end;
        }

        .search-input-wrap {
          display: grid;
          gap: 8px;
        }

        .search-label,
        .quick-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--muted);
        }

        .search-input {
          height: 56px;
          border-radius: 12px;
          border: 1px solid var(--line-strong);
          padding: 0 18px;
          font-size: 16px;
          font-weight: 500;
          outline: none;
          background: var(--surface);
          color: var(--text);
        }

        .search-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(47, 111, 237, 0.1);
        }

        .search-button {
          border: none;
          border-radius: 12px;
          background: var(--primary);
          color: #ffffff;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
        }

        .search-button:disabled {
          cursor: wait;
          opacity: 0.75;
        }

        .loading-card {
          display: grid;
          gap: 8px;
          padding: 14px 16px;
          border-radius: 16px;
          background: var(--surface-soft);
          border: 1px solid var(--line);
        }

        .loading-card p {
          margin: 0;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.5;
        }

        .loading-bar {
          position: relative;
          overflow: hidden;
          height: 5px;
          border-radius: 999px;
          background: #e5e7eb;
        }

        .loading-bar::after {
          content: "";
          position: absolute;
          inset: 0;
          width: 36%;
          border-radius: 999px;
          background: var(--primary);
          animation: loading-slide 1.2s ease-in-out infinite;
        }

        .quick-row {
          display: grid;
          gap: 10px;
          padding-top: 8px;
        }

        .micro-copy {
          margin: 0;
          color: var(--muted);
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
          border: 1px solid var(--line);
          background: var(--surface);
          padding: 10px 14px;
          color: var(--text);
          cursor: pointer;
          font-weight: 600;
        }

        .error-text {
          margin: 14px 0 0;
          color: #dc2626;
          font-weight: 700;
        }

        .result-stack {
          display: grid;
          gap: 14px;
        }

        .result-hero {
          padding: 16px;
          background: var(--surface) !important;
          border-left: 4px solid currentColor;
        }

        .result-main {
          display: grid;
          gap: 14px;
          margin-top: 8px;
        }

        .result-main.is-single {
          grid-template-columns: 1fr;
        }

        .result-query-label {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
          font-weight: 700;
        }

        .decision-block {
          display: grid;
          gap: 6px;
        }

        .decision-status {
          margin: 0;
          font-size: clamp(32px, 5vw, 44px);
          line-height: 1.1;
          letter-spacing: -0.04em;
          color: var(--text);
        }

        .primary-reason,
        .secondary-reason,
        .fallback-callout p,
        .rule-item p,
        .menu-card p,
        .empty-copy {
          color: var(--muted);
          line-height: 1.7;
        }

        .decision-stage {
          margin: 0;
          color: var(--muted);
          font-size: 14px;
          font-weight: 700;
        }

        .primary-reason {
          margin: 6px 0 0;
          font-size: 18px;
          color: var(--text);
          font-weight: 700;
          line-height: 1.65;
          max-width: 24ch;
        }

        .secondary-reason {
          margin: 0;
          font-size: 14px;
          line-height: 1.7;
          max-width: 28ch;
        }

        .action-grid {
          display: grid;
          gap: 12px;
        }

        .fallback-callout {
          padding: 12px 0 0;
          background: transparent;
          border: none;
          border-top: 1px solid var(--line);
        }

        .fallback-callout strong {
          display: block;
          color: var(--text);
          margin-bottom: 8px;
          font-size: 13px;
          letter-spacing: 0.02em;
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
          padding: 6px 10px;
          background: #f3f4f6;
          border: 1px solid var(--line);
          color: var(--muted);
          font-size: 12px;
          font-weight: 700;
        }

        .details-box {
          border-radius: 12px;
          border: 1px solid var(--line);
          background: var(--surface);
          padding: 12px;
        }

        .details-box summary {
          cursor: pointer;
          font-weight: 700;
          color: var(--text);
          list-style: none;
        }

        .details-copy {
          margin: 12px 0 0;
          color: var(--muted);
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
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 700;
          color: var(--text);
        }

        .panel-card {
          background: var(--surface);
          padding: 16px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 17px;
          color: var(--text);
          letter-spacing: -0.02em;
        }

        .panel-header span {
          color: var(--muted);
          font-size: 12px;
          font-weight: 700;
        }

        .rule-list,
        .menu-list,
        .action-chip-list {
          display: grid;
          gap: 10px;
        }

        .action-chip-list {
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        }

        .rule-item {
          padding: 12px;
          border-radius: 12px;
          background: #f9fafb;
          border: 1px solid var(--line);
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
          color: var(--muted);
          font-size: 12px;
          font-weight: 700;
        }

        .rule-item p,
        .menu-card p {
          margin: 8px 0 0;
        }

        .choice-button,
        .menu-card {
          width: 100%;
          text-align: left;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid var(--line);
          background: var(--surface);
        }

        .choice-button {
          cursor: pointer;
          text-align: center;
          font-size: 15px;
          font-weight: 700;
          color: var(--primary);
        }

        .menu-card.is-strong {
          cursor: pointer;
          box-shadow: none;
          transition: border-color 0.15s ease, background-color 0.15s ease;
        }

        .choice-button:hover,
        .menu-card.is-strong:hover {
          transform: none;
          border-color: #c7d2fe;
          background: #f8fbff;
        }

        .menu-card strong {
          color: var(--text);
          font-size: 16px;
        }

        .menu-foods {
          color: var(--muted);
          line-height: 1.6;
        }

        .empty-copy {
          margin: 0;
        }

        @media (max-width: 920px) {
          .result-main,
          .action-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .page {
            padding: 16px 12px 48px;
          }

          .hero-card,
          .result-hero,
          .panel-card {
            border-radius: 16px;
            padding: 16px;
          }

          .search-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .hero-title {
            font-size: 34px;
          }

          .hero-copy {
            font-size: 15px;
          }

          .page-shell {
            gap: 16px;
          }

          .result-stack {
            gap: 12px;
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

          .primary-reason,
          .secondary-reason {
            max-width: none;
          }

          .panel-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .search-button {
            height: 54px;
          }

          .quick-chip {
            min-height: 42px;
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

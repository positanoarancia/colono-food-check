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
    references: Array<{
      label: string;
      url: string;
    }>;
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
  {
    value: "d5",
    label: "초기 준비",
    shortLabel: "초기 준비",
    daysLabel: "4–5일 전",
    resultLabel: "4–5일 전",
  },
  {
    value: "d3",
    label: "준비 식단",
    shortLabel: "준비 식단",
    daysLabel: "2–3일 전",
    resultLabel: "2–3일 전",
  },
  {
    value: "d1",
    label: "전날",
    shortLabel: "전날",
    daysLabel: "1일 전",
    resultLabel: "1일 전",
  },
] as const;

const quickExamples = ["바나나", "라면", "김치찌개", "흰죽", "샐러드", "카스테라"];

const statusConfig = {
  allowed: {
    label: "먹어도 괜찮아요",
    color: "#16A34A",
    bg: "#F8FCF9",
    chip: "#EAF8EF",
  },
  caution: {
    label: "조금 주의가 필요해요",
    color: "#F59E0B",
    bg: "#FFF9EF",
    chip: "#FEF3C7",
  },
  avoid: {
    label: "지금은 피하는 게 좋아요",
    color: "#DC2626",
    bg: "#FEF8F8",
    chip: "#FEE2E2",
  },
} as const;

const detailBadgeLabel: Record<string, string> = {
  "vegetables-heavy": "채소 많음",
  "high-fiber": "섬유질 많음",
  chunky: "건더기 많음",
  "spicy-seasoning": "매운 양념",
  fried: "기름진 음식",
  seeded: "씨 있음",
  "with-peel": "껍질 있음",
  dairy: "유제품",
  "clear-broth": "맑은 국물",
  "soft-food": "부드러운 음식",
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

function getFallbackCopy() {
  return {
    title: "등록된 기준이 없어 보수적으로 안내하고 있어요",
    body: "비슷한 음식도 함께 확인해보세요",
  };
}

function getStageLabel(dayStageSlug: string) {
  return stageOptions.find((option) => option.value === dayStageSlug)?.resultLabel ?? dayStageSlug;
}

function getFoodTraits(result: CheckResponse) {
  const tagSet = new Set(result.appliedTagSlugs);
  const traits: string[] = [];

  if (result.matchedType === "fallback") {
    return ["등록된 음식 기준이 아직 없어요"];
  }

  if (tagSet.has("high-fiber") || tagSet.has("vegetables-heavy") || tagSet.has("namul")) {
    traits.push("채소와 섬유질이 많아요");
  }

  if (tagSet.has("chunky")) {
    traits.push("건더기가 많이 남을 수 있어요");
  }

  if (tagSet.has("seeded") || tagSet.has("with-peel")) {
    traits.push("씨나 껍질이 남을 수 있어요");
  }

  if (tagSet.has("spicy-seasoning") || tagSet.has("fried")) {
    traits.push("매운 양념이나 기름이 부담이 될 수 있어요");
  }

  if (tagSet.has("low-fiber") || tagSet.has("soft-food")) {
    traits.push("부드럽고 부담이 적은 편이에요");
  }

  if (tagSet.has("clear-broth")) {
    traits.push("맑고 가벼운 음식에 가까워요");
  }

  if (tagSet.has("dairy")) {
    traits.push("유제품이라 속이 불편할 수 있어요");
  }

  if (traits.length === 0) {
    traits.push(result.primaryReason);
  }

  return traits.slice(0, 2);
}

function getStageImportantPoint(dayStageSlug: string) {
  if (dayStageSlug === "d5") {
    return "대장내시경 4–5일 전에는 섬유질 많은 음식부터 줄이는 편이 좋아요";
  }

  if (dayStageSlug === "d1") {
    return "대장내시경 1일 전에는 가장 가볍고 부드러운 음식이 좋아요";
  }

  return "대장내시경 2–3일 전에는 장에 남는 음식이 부담이 될 수 있어요";
}

function getReferenceBadges(result: CheckResponse) {
  return result.appliedTagSlugs
    .map((tag) => detailBadgeLabel[tag])
    .filter((value): value is string => Boolean(value))
    .slice(0, 3);
}

function getReferencePoints(result: CheckResponse) {
  if (result.matchedType === "fallback") {
    return ["등록된 음식 정보를 먼저 확인했어요"];
  }

  const points: string[] = [];

  if (result.topAppliedRules.some((rule) => rule.source === "food")) {
    points.push("등록된 음식 정보를 먼저 확인했어요");
  }

  if (result.topAppliedRules.some((rule) => rule.source === "food_group")) {
    points.push("필요할 때는 비슷한 음식 정보도 함께 참고했어요");
  }

  if (points.length === 0) {
    points.push("등록된 음식 정보를 먼저 확인했어요");
  }

  return points.slice(0, 2);
}

function getShortReasons(result: CheckResponse) {
  if (result.matchedType === "fallback") {
    return {
      primary: "기준이 없어 조심하는 편이 좋아요",
      secondary: "비슷한 음식도 함께 확인해보세요",
    };
  }

  const tagSet = new Set(result.appliedTagSlugs);

  if (result.status === "allowed") {
    if (tagSet.has("clear-broth")) {
      return {
        primary: "맑고 부담이 적어서 괜찮아요",
      };
    }

    if (tagSet.has("low-fiber") || tagSet.has("soft-food")) {
      return {
        primary: "부담이 적어서 지금은 괜찮아요",
      };
    }

    return {
      primary: "지금은 비교적 괜찮은 편이에요",
    };
  }

  if (result.status === "caution") {
    if (tagSet.has("processed")) {
      return {
        primary: "가공이 많아 조심하는 편이 좋아요",
      };
    }

    if (tagSet.has("dairy")) {
      return {
        primary: "유제품이라 속이 불편할 수 있어요",
      };
    }

    return {
      primary: "지금은 부담이 될 수 있어요",
    };
  }

  if (tagSet.has("high-fiber") || tagSet.has("vegetables-heavy") || tagSet.has("namul")) {
      return {
        primary: "섬유질이 많아서 지금은 피하세요",
        secondary: "대신 더 부드러운 음식이 좋아요",
      };
    }

  if (tagSet.has("seeded") || tagSet.has("with-peel")) {
      return {
        primary: "씨나 껍질이 있어 지금은 피하세요",
        secondary: "대신 더 부드러운 음식이 좋아요",
      };
    }

  if (tagSet.has("spicy-seasoning") || tagSet.has("fried")) {
      return {
        primary: "매운 양념이나 기름이 부담이 돼요",
        secondary: "대신 더 부드러운 음식이 좋아요",
      };
    }

  if (tagSet.has("chunky")) {
    return {
      primary: "건더기가 많아서 장에 남을 수 있어요",
      secondary: "대신 더 부드러운 음식이 좋아요",
    };
  }

  return {
    primary: "검사 준비에는 지금 맞지 않는 편이에요",
    secondary: "대신 더 부드러운 음식이 좋아요",
  };
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [dayStage, setDayStage] = useState("d3");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const hasAttemptedPrewarmRef = useRef(false);
  const prewarmFinishedRef = useRef(false);
  const firstSearchLoggedRef = useRef(false);
  const shareFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setShareFeedbackWithTimeout(message: string) {
    setShareFeedback(message);

    if (shareFeedbackTimeoutRef.current) {
      clearTimeout(shareFeedbackTimeoutRef.current);
    }

    shareFeedbackTimeoutRef.current = setTimeout(() => {
      setShareFeedback(null);
      shareFeedbackTimeoutRef.current = null;
    }, 2200);
  }

  useEffect(() => {
    return () => {
      if (shareFeedbackTimeoutRef.current) {
        clearTimeout(shareFeedbackTimeoutRef.current);
      }
    };
  }, []);

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

  async function copyCurrentUrl() {
    const currentUrl = window.location.href;

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(currentUrl);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = currentUrl;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  async function handleShare() {
    const shareData = {
      title: "건강신호등",
      text: "대장내시경 전에 먹어도 되는 음식인지 바로 확인할 수 있어요",
      url: window.location.href,
    };

    try {
      if (typeof navigator.share === "function") {
        await navigator.share(shareData);
        setShareFeedbackWithTimeout("링크를 공유할 수 있어요");
        return;
      }

      await copyCurrentUrl();
      setShareFeedbackWithTimeout("링크가 복사됐어요");
    } catch (caught) {
      if (caught instanceof Error && caught.name === "AbortError") {
        return;
      }

      try {
        await copyCurrentUrl();
        setShareFeedbackWithTimeout("링크가 복사됐어요");
      } catch {
        setShareFeedbackWithTimeout("공유 링크를 준비하지 못했어요");
      }
    }
  }

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

  async function handleStageChange(nextDayStage: string) {
    if (nextDayStage === dayStage) {
      return;
    }

    setDayStage(nextDayStage);

    if (result?.query) {
      await runSearch(result.query, nextDayStage);
    }
  }

  const status = result ? statusConfig[result.status] : null;
  const shortReasons = result ? getShortReasons(result) : null;
  const detailTraits = result ? getFoodTraits(result) : [];
  const detailBadges = result ? getReferenceBadges(result) : [];
  const detailReferencePoints = result ? getReferencePoints(result) : [];
  const detailReferences = result
    ? result.topAppliedRules
        .flatMap((rule) => rule.references)
        .filter(
          (reference, index, array) =>
            array.findIndex((item) => item.url === reference.url) === index,
        )
        .slice(0, 2)
    : [];

  return (
    <main className="page">
      <div className="page-shell">
        <section className="hero-card">
          <div className="hero-top">
            <div className="eyebrow">건강신호등</div>
            <div className="share-box">
              <button
                type="button"
                className="share-button"
                onClick={handleShare}
                aria-label="현재 페이지 공유하기"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="share-icon">
                  <circle cx="18" cy="5" r="2.2" fill="currentColor" />
                  <circle cx="6" cy="12" r="2.2" fill="currentColor" />
                  <circle cx="18" cy="19" r="2.2" fill="currentColor" />
                  <path
                    d="M8 11l7.4-4.4M8 13l7.4 4.4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              {shareFeedback ? <p className="share-feedback">{shareFeedback}</p> : null}
            </div>
          </div>
          <div className="hero-copy-block">
            <h1 className="hero-title">대장내시경 전에 먹어도 될까?</h1>
            <p className="hero-copy">음식을 검색하면 바로 확인할 수 있어요</p>
          </div>

          <form onSubmit={handleSubmit} className="search-panel">
            <div className="stage-row">
              {stageOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    void handleStageChange(option.value);
                  }}
                  className={`stage-button${dayStage === option.value ? " is-active" : ""}`}
                >
                  <span className="stage-button-label stage-button-label-desktop">{option.label}</span>
                  <span className="stage-button-label stage-button-label-mobile">{option.shortLabel}</span>
                  <span className="stage-button-days">{option.daysLabel}</span>
                </button>
              ))}
            </div>

            <div className="search-row">
              <label className="search-input-wrap">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="예: 바나나, 라면, 김치찌개"
                  className="search-input"
                />
              </label>
              <button type="submit" disabled={loading} className="search-button">
                {loading ? (
                  <>
                    <span className="button-spinner" aria-hidden="true" />
                    확인 중...
                  </>
                ) : (
                  "확인하기"
                )}
              </button>
            </div>

            <div className="quick-row">
              <div className="quick-chips" role="list" aria-label="예시 음식">
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

        {result && status ? (
          <section className="result-stack">
            <article className="result-hero" style={{ background: status.bg, color: status.color }}>
              <div className="result-main is-single">
                <div className="decision-block">
                  <strong className="decision-status">{status.label}</strong>
                  <p className="decision-context">
                    {result.query} · 대장내시경 {getStageLabel(result.dayStage.slug)}
                  </p>
                  <p className="primary-reason">{shortReasons?.primary}</p>
                  {shortReasons?.secondary ? (
                    <p className="secondary-reason">{shortReasons.secondary}</p>
                  ) : null}
                  {result.matchedType === "fallback" ? (
                    <div className="fallback-callout">
                      <p className="fallback-text is-primary">{getFallbackCopy().title}</p>
                      <p>{getFallbackCopy().body}</p>
                    </div>
                  ) : null}
                  {detailBadges.length > 0 ? (
                    <div className="tag-row">
                      {detailBadges.map((badge) => (
                        <span key={badge} className="tag-pill" style={{ background: status.chip }}>
                          {badge}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {(detailTraits.length > 0 || detailReferencePoints.length > 0) ? (
                    <details className="details-box">
                      <summary>
                        <span>왜 이렇게 안내하나요?</span>
                        <span className="summary-chevron" aria-hidden="true">
                          ▾
                        </span>
                      </summary>
                      <div className="detail-group">
                        <strong>이 음식의 특징</strong>
                        <ul className="detail-list">
                          {detailTraits.map((trait) => (
                            <li key={trait}>{trait}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="detail-group">
                        <strong>지금 왜 주의해야 하나요?</strong>
                        <ul className="detail-list">
                          <li>{getStageImportantPoint(result.dayStage.slug)}</li>
                        </ul>
                      </div>
                      <div className="detail-group">
                        <strong>판단에 참고한 내용</strong>
                        <ul className="detail-list">
                          {detailReferencePoints.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      </div>
                      {detailReferences.length > 0 ? (
                        <div className="detail-group">
                          <strong>참고 근거</strong>
                          <ul className="detail-list">
                            {detailReferences.map((reference) => (
                              <li key={reference.url}>
                                <a
                                  href={reference.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="reference-link"
                                >
                                  {reference.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </details>
                  ) : null}
                </div>
              </div>
            </article>

            <section className="action-grid">
              {result.similarFoods.length >= 2 ? (
                <article className="panel-card">
                  <div className="panel-header">
                    <h3>대신 먹을 수 있어요</h3>
                  </div>
                  <div className="action-chip-list">
                    {result.similarFoods.slice(0, 3).map((food) => (
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
                </article>
              ) : null}
            </section>

            <section className="guide-section">
              <h3 className="guide-heading">FAQ / 가이드</h3>
              <div className="guide-list">
                <div className="guide-item">
                  <strong>검사 전 어떤 음식 피해야 하나요?</strong>
                  <p>채소, 잡곡, 견과류, 해조류처럼 장에 남기 쉬운 음식은 먼저 줄이는 편이 좋아요.</p>
                </div>
                <div className="guide-item">
                  <strong>언제부터 식단 조절하나요?</strong>
                  <p>보통 4–5일 전부터 섬유질 많은 음식을 줄이고, 2–3일 전부터는 더 가볍게 보는 편이 안전해요.</p>
                </div>
              </div>
            </section>
          </section>
        ) : null}
      </div>

      <style jsx>{`
        :global(body) {
          margin: 0;
          background: #f7f8fa;
        }

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
          word-break: keep-all;
        }

        .page-shell {
          max-width: 640px;
          margin: 0 auto;
          display: grid;
          gap: 0;
          width: 100%;
        }

        .hero-card,
        .panel-card,
        .result-hero {
          border-radius: 0;
          border: none;
          box-shadow: none;
        }

        .hero-card {
          position: relative;
          background: transparent;
          padding: 8px 0 20px;
        }

        .hero-top {
          position: relative;
          min-height: 24px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #4d7e74;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .share-box {
          position: absolute;
          top: -4px;
          right: 0;
          display: grid;
          justify-items: end;
          gap: 6px;
        }

        .share-button {
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          color: #94a3b8;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
          transition: color 0.15s ease, opacity 0.15s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .share-button:hover {
          color: var(--primary);
        }

        .share-button:active {
          opacity: 0.65;
        }

        .share-icon {
          width: 16px;
          height: 16px;
        }

        .share-feedback {
          margin: 0;
          font-size: 12px;
          line-height: 1.5;
          color: var(--muted);
          text-align: right;
          white-space: nowrap;
          background: rgba(255, 255, 255, 0.96);
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
        }

        .hero-grid {
          display: none;
        }

        .hero-copy-block {
          margin-top: 10px;
          max-width: 480px;
        }

        .hero-title {
          margin: 0;
          font-size: clamp(30px, 4.4vw, 38px);
          line-height: 1.08;
          letter-spacing: -0.04em;
          font-weight: 800;
          max-width: 480px;
        }

        .hero-copy {
          margin: 10px 0 0;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.6;
          max-width: 480px;
        }

        .search-panel {
          display: grid;
          gap: 12px;
          margin-top: 20px;
          padding-top: 8px;
        }

        .stage-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0;
          border-bottom: 1px solid var(--line);
        }

        .stage-button {
          border: none;
          border-bottom: 2px solid transparent;
          background: transparent;
          border-radius: 0;
          padding: 0 0 10px;
          text-align: center;
          cursor: pointer;
          display: grid;
          gap: 1px;
          justify-items: center;
          transition: border-color 0.15s ease, color 0.15s ease;
        }

        .stage-button-label {
          font-size: 14px;
          font-weight: 700;
          color: var(--muted);
        }

        .stage-button-label-mobile {
          display: none;
        }

        .stage-button-days {
          font-size: 11px;
          color: var(--muted);
          font-weight: 600;
        }

        .stage-button.is-active {
          border-color: var(--primary);
        }

        .stage-button.is-active span {
          color: var(--primary);
        }

        .stage-button.is-active .stage-button-days {
          color: var(--primary);
        }

        .search-row {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .search-input-wrap {
          display: grid;
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
          line-height: 1.6;
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
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          width: 100%;
          min-height: 52px;
        }

        .search-button:disabled {
          cursor: wait;
          opacity: 0.75;
        }

        .button-spinner {
          width: 16px;
          height: 16px;
          border-radius: 999px;
          border: 2px solid #dbe3f5;
          border-top-color: var(--primary);
          animation: spin 0.8s linear infinite;
        }

        .quick-row {
          display: grid;
          gap: 8px;
          padding-top: 8px;
        }

        .quick-chips {
          display: flex;
          flex-wrap: nowrap;
          gap: 8px;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 2px;
        }

        .quick-chips::-webkit-scrollbar {
          display: none;
        }

        .quick-chip {
          border-radius: 999px;
          border: 1px solid var(--line);
          background: var(--surface);
          padding: 10px 14px;
          color: var(--text);
          cursor: pointer;
          font-weight: 600;
          flex: 0 0 auto;
          white-space: nowrap;
        }

        .error-text {
          margin: 14px 0 0;
          color: #dc2626;
          font-weight: 700;
        }

        .result-stack {
          display: grid;
          gap: 0;
        }

        .result-hero {
          padding: 20px 0;
          background: transparent !important;
          border-left: 4px solid currentColor;
          padding-left: 20px;
        }

        .result-main {
          display: grid;
          gap: 0;
          margin-top: 0;
        }

        .result-main.is-single {
          grid-template-columns: 1fr;
        }

        .decision-block {
          display: grid;
          gap: 6px;
        }

        .decision-status {
          margin: 0;
          font-size: 36px;
          line-height: 1.12;
          letter-spacing: -0.04em;
          color: var(--text);
          max-width: 480px;
          font-weight: 800;
        }

        .decision-context,
        .primary-reason,
        .secondary-reason,
        .fallback-callout p,
        .empty-copy,
        .detail-list li {
          color: var(--muted);
          line-height: 1.6;
        }

        .decision-context {
          margin: 6px 0 0;
          color: #8b95a1;
          font-size: 14px;
          font-weight: 500;
          max-width: 480px;
          line-height: 1.6;
        }

        .primary-reason {
          margin: 10px 0 0;
          font-size: 20px;
          color: var(--text);
          font-weight: 600;
          line-height: 1.6;
          max-width: 480px;
        }

        .secondary-reason {
          margin: 6px 0 0;
          font-size: 16px;
          line-height: 1.6;
          max-width: 480px;
          color: #8b95a1;
        }

        .action-grid {
          display: grid;
          gap: 0;
        }

        .fallback-callout {
          padding: 8px 0 0;
          background: transparent;
          border: none;
        }

        .fallback-text {
          margin: 0;
          line-height: 1.6;
          max-width: 480px;
        }

        .fallback-text.is-primary {
          color: var(--text);
          font-weight: 700;
          margin-bottom: 2px;
        }

        .details-box {
          border: none;
          background: transparent;
          padding: 10px 0 0;
        }

        .details-box summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          width: 100%;
          cursor: pointer;
          font-weight: 700;
          color: var(--text);
          list-style: none;
          font-size: 14px;
          line-height: 1.6;
          padding: 8px 0;
          transition: color 0.15s ease, opacity 0.15s ease;
        }

        .details-box summary::-webkit-details-marker {
          display: none;
        }

        .details-box summary:hover {
          color: var(--primary);
          background: rgba(47, 111, 237, 0.04);
        }

        .details-box summary:active {
          opacity: 0.7;
        }

        .summary-chevron {
          font-size: 16px;
          color: var(--primary);
          font-weight: 700;
          transition: transform 0.15s ease, color 0.15s ease;
        }

        .details-box[open] .summary-chevron {
          transform: rotate(180deg);
        }

        .detail-group {
          display: grid;
          gap: 10px;
          margin-top: 16px;
          max-width: 480px;
        }

        .detail-group strong {
          font-size: 16px;
          line-height: 1.6;
          color: #374151;
          font-weight: 600;
        }

        .detail-list {
          margin: 0;
          padding-left: 18px;
          display: grid;
          gap: 8px;
        }

        .detail-list li {
          color: #6b7280;
          font-size: 15px;
          font-weight: 400;
        }

        .reference-link {
          color: var(--primary);
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
        }

        .reference-link:hover {
          text-decoration: underline;
        }

        .tag-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
          margin-bottom: 14px;
          max-width: 480px;
        }

        .tag-pill {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 700;
          color: #4b5563;
          border: 1px solid #d8dde6;
        }

        .panel-card {
          background: transparent;
          padding: 32px 0 0;
        }

        .guide-section {
          padding: 48px 0 0;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 17px;
          color: var(--text);
          letter-spacing: -0.02em;
        }

        .action-chip-list {
          display: grid;
          gap: 10px;
        }

        .action-chip-list {
          grid-template-columns: repeat(auto-fit, minmax(120px, max-content));
          gap: 8px;
        }

        .choice-button {
          width: 100%;
          text-align: left;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid var(--line);
          background: #ffffff;
        }

        .choice-button {
          cursor: pointer;
          text-align: center;
          font-size: 15px;
          font-weight: 700;
          color: var(--primary);
        }

        .choice-button:hover {
          transform: none;
          border-color: #c7d2fe;
          background: #f8fbff;
        }

        .guide-heading {
          margin: 0;
          font-size: 18px;
          line-height: 1.5;
          color: var(--text);
        }

        .guide-list {
          display: grid;
          gap: 10px;
          margin-top: 12px;
        }

        .guide-item {
          border: 1px solid var(--line);
          background: #ffffff;
          border-radius: 12px;
          padding: 14px 16px;
          color: var(--text);
        }

        .guide-item strong {
          display: block;
          font-size: 15px;
          line-height: 1.6;
        }

        .guide-item p {
          margin: 6px 0 0;
          color: var(--muted);
          line-height: 1.6;
        }

        .empty-copy {
          margin: 0;
          max-width: 32ch;
          line-height: 1.6;
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
          .panel-card {
            border-radius: 0;
            padding-left: 0;
            padding-right: 0;
          }

          .result-hero {
            border-radius: 0;
            padding-left: 20px;
            padding-right: 0;
          }

          .hero-title {
            font-size: 30px;
          }

          .share-box {
            top: -2px;
          }

          .share-button {
            width: 32px;
            height: 32px;
          }

          .hero-copy,
          .primary-reason {
            font-size: 16px;
          }

          .decision-status {
            font-size: 36px;
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

          .stage-button-label-desktop {
            display: none;
          }

          .stage-button-label-mobile {
            display: inline;
          }

          .stage-button-days {
            display: inline;
            font-size: 11px;
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

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}

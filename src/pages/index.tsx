import Head from "next/head";
import { FormEvent, useEffect, useRef, useState } from "react";
import { getSiteUrl } from "../lib/site-url";

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
const siteUrl = getSiteUrl();
const canonicalUrl = `${siteUrl}/`;
const faqItems = [
  {
    question: "언제부터 식단을 조절하나요?",
    answer:
      "보통 4–5일 전부터 장에 남기 쉬운 음식을 줄이고, 2–3일 전부터는 더 가볍게 드시는 편이 좋아요.",
  },
  {
    question: "병원 안내와 다르면 무엇을 따라야 하나요?",
    answer:
      "검사 일정과 장정결제 복용 방법은 병원 안내가 가장 우선이에요. 화면 결과와 다르면 병원 안내를 먼저 따라주세요.",
  },
  {
    question: "이 결과는 어디까지 참고하면 되나요?",
    answer:
      "이 결과는 지금 시점에 빠르게 판단할 때 참고하는 용도예요. 검사 일정과 장정결제 복용 방법은 병원 안내를 가장 먼저 따라주세요.",
  },
] as const;
const pageDescription =
  "대장내시경 전 음식, 먹어도 되는지 바로 확인하세요. 김치찌개, 라면, 샐러드 등 음식별 섭취 가능 여부와 이유를 한눈에 확인할 수 있습니다.";

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
  "d1-soft-allowed": "전날 허용식",
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

type RuleReference = CheckResponse["topAppliedRules"][number]["references"][number];

function getReferenceSeed(result: CheckResponse) {
  const key = `${result.query}:${result.dayStage.slug}:${result.status}:${result.topAppliedRules
    .map((rule) => rule.tagSlug)
    .join(",")}`;

  return Array.from(key).reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function pickDetailReferences(result: CheckResponse, maxItems = 3) {
  const uniqueReferences = result.topAppliedRules
    .flatMap((rule) => rule.references)
    .filter(
      (reference, index, array) =>
        array.findIndex((item) => item.url === reference.url) === index,
    );

  if (uniqueReferences.length <= maxItems) {
    return uniqueReferences;
  }

  const seed = getReferenceSeed(result);
  const rotated = uniqueReferences.map((reference, index) => ({
    ...reference,
    sortKey: (index + seed) % uniqueReferences.length,
  }));

  const preferred = rotated
    .slice()
    .sort((a, b) => a.sortKey - b.sortKey)
    .reduce<RuleReference[]>((selected, current) => {
      if (selected.some((item) => item.label === current.label)) {
        return selected;
      }

      if (selected.length >= maxItems) {
        return selected;
      }

      selected.push({ label: current.label, url: current.url });
      return selected;
    }, []);

  if (preferred.length >= maxItems) {
    return preferred;
  }

  const remaining = rotated
    .slice()
    .sort((a, b) => a.sortKey - b.sortKey)
    .map((reference) => ({ label: reference.label, url: reference.url }))
    .filter((reference) => !preferred.some((item) => item.url === reference.url));

  return [...preferred, ...remaining].slice(0, maxItems);
}

function getStageLabel(dayStageSlug: string) {
  return stageOptions.find((option) => option.value === dayStageSlug)?.resultLabel ?? dayStageSlug;
}

function getFallbackGuide(dayStageSlug: string) {
  if (dayStageSlug === "d5") {
    return {
      summary: "자세히 보기",
      title: "이럴 때는 이렇게 보세요",
      traits: [
        "씨, 껍질, 잡곡, 해조류가 많으면 피하는 쪽이 좋아요",
        "맑고 단순한 음식에 가까우면 상대적으로 더 안전해요",
      ],
      stagePoint: "4–5일 전에는 장에 남기 쉬운 재료부터 줄이기 시작한다고 보면 쉬워요",
    };
  }

  if (dayStageSlug === "d1") {
    return {
      summary: "자세히 보기",
      title: "이럴 때는 이렇게 보세요",
      traits: [
        "맵거나 건더기가 많으면 피하는 쪽이 좋아요",
        "흰죽이나 미음처럼 아주 가벼운 음식에 가까우면 더 안전해요",
      ],
      stagePoint: "1일 전에는 새로운 음식보다 이미 많이 안내되는 가벼운 음식에 더 가깝게 보는 편이 안전해요",
    };
  }

  return {
    summary: "자세히 보기",
    title: "이럴 때는 이렇게 보세요",
    traits: [
      "채소나 건더기가 많으면 피하는 쪽이 좋아요",
      "부드럽고 단순한 음식에 가까우면 상대적으로 더 안전해요",
    ],
    stagePoint: "2–3일 전에는 장에 남는 재료를 꽤 줄여야 하는 시기라고 보면 쉬워요",
  };
}

function getFoodTraits(result: CheckResponse) {
  const tagSet = new Set(result.appliedTagSlugs);
  const traits: string[] = [];

  if (result.matchedType === "fallback") {
    return getFallbackGuide(result.dayStage.slug).traits;
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

  if (tagSet.has("d1-soft-allowed")) {
    traits.push("전날에도 비교적 무난하게 안내하는 대표 음식이에요");
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

function getStageImportantPoint(dayStageSlug: string, matchedType?: CheckResponse["matchedType"]) {
  if (matchedType === "fallback") {
    return getFallbackGuide(dayStageSlug).stagePoint;
  }

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

function getChoiceTips(result: CheckResponse) {
  if (result.matchedType === "fallback") {
    return [];
  }

  if (result.status === "allowed") {
    return [];
  }

  if (result.status === "caution") {
    return [
      "건더기 적은 음식이나 더 부드러운 음식으로 바꿔보세요",
      "맑은 국물이나 흰죽처럼 단순한 음식이 더 잘 맞아요",
    ];
  }

  return [
    "맑은 국물이나 흰죽처럼 장에 덜 남는 음식으로 바꿔보세요",
    "이 시기에는 채소나 건더기, 강한 양념이 적은 쪽이 더 안전해요",
  ];
}

function getShortReasons(result: CheckResponse) {
  if (result.matchedType === "fallback") {
    if (result.dayStage.slug === "d5") {
      return {
        primary: "등록된 음식 기준이 없어 조심하는 편이 좋아요",
        secondary: "씨나 껍질, 건더기가 많아 보이면 피하는 쪽이 더 안전해요",
      };
    }

    if (result.dayStage.slug === "d1") {
      return {
        primary: "등록된 음식 기준이 없어 조심하는 편이 좋아요",
        secondary: "전날에는 맑고 부드러운 음식이 아니면 피하는 쪽이 더 안전해요",
      };
    }

    return {
      primary: "등록된 음식 기준이 없어 조심하는 편이 좋아요",
      secondary: "채소나 건더기가 많아 보이면 피하는 쪽이 더 안전해요",
    };
  }

  const tagSet = new Set(result.appliedTagSlugs);

  if (result.status === "allowed") {
    if (tagSet.has("d1-soft-allowed")) {
      return {
        primary: "전날에도 비교적 무난하게 먹는 편이에요",
        secondary: "양을 많이 늘리기보다는 가볍게 드세요",
      };
    }

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
  const stageRowRef = useRef<HTMLDivElement | null>(null);
  const pendingResultScrollRef = useRef(false);

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
    if (!result || !pendingResultScrollRef.current) {
      return;
    }

    pendingResultScrollRef.current = false;

    window.requestAnimationFrame(() => {
      if (!stageRowRef.current) {
        return;
      }

      const top = stageRowRef.current.getBoundingClientRect().top + window.scrollY - 14;
      window.scrollTo({
        top: Math.max(top, 0),
        behavior: "smooth",
      });
    });
  }, [result]);

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
      url: window.location.href,
    };

    try {
      if (typeof navigator.share === "function") {
        await navigator.share(shareData);
        setShareFeedbackWithTimeout("공유했어요");
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

  async function runSearch(
    nextQuery: string,
    nextDayStage = dayStage,
    options?: { scrollToResult?: boolean },
  ) {
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

      pendingResultScrollRef.current = Boolean(options?.scrollToResult);
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
    await runSearch(query, dayStage, { scrollToResult: true });
  }

  async function handleStageChange(nextDayStage: string) {
    if (nextDayStage === dayStage) {
      return;
    }

    setDayStage(nextDayStage);

    if (result?.query) {
      await runSearch(result.query, nextDayStage, { scrollToResult: true });
    }
  }

  const status = result ? statusConfig[result.status] : null;
  const shortReasons = result ? getShortReasons(result) : null;
  const detailTraits = result ? getFoodTraits(result) : [];
  const detailBadges = result ? getReferenceBadges(result) : [];
  const detailChoiceTips = result ? getChoiceTips(result) : [];
  const detailReferences = result ? pickDetailReferences(result) : [];
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
  const webApplicationStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "대장내시경 전에 먹어도 될까?",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    description: pageDescription,
    url: canonicalUrl,
  };

  return (
    <main className="page">
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationStructuredData) }}
        />
      </Head>
      <div className="page-shell">
        <section className="hero-card">
          <div className="hero-top">
            <div className="eyebrow">
              <span className="signal-dots" aria-hidden="true">
                <span className="signal-dot signal-dot-red" />
                <span className="signal-dot signal-dot-amber" />
                <span className="signal-dot signal-dot-blue" />
              </span>
              <span>건강신호등</span>
            </div>
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
                <span className="share-label share-label-mobile">공유</span>
                <span className="share-label share-label-desktop">공유하기</span>
              </button>
              {shareFeedback ? <p className="share-feedback">{shareFeedback}</p> : null}
            </div>
          </div>
          <div className="hero-copy-block">
            <h1 className="hero-title">대장내시경 전에 먹어도 될까?</h1>
            <p className="hero-copy">음식을 검색하면 바로 확인할 수 있어요</p>
          </div>

          <form onSubmit={handleSubmit} className="search-panel">
            <div className="stage-row" ref={stageRowRef}>
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
                    onClick={() => runSearch(example, dayStage, { scrollToResult: true })}
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
                  {detailBadges.length > 0 ? (
                    <div className="tag-row">
                      {detailBadges.map((badge) => (
                        <span key={badge} className="tag-pill" style={{ background: status.chip }}>
                          {badge}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {(detailTraits.length > 0 || detailChoiceTips.length > 0) ? (
                    <details className="details-box">
                      <summary>
                        <span>
                          {result.matchedType === "fallback"
                            ? getFallbackGuide(result.dayStage.slug).summary
                            : "이유 자세히 보기"}
                        </span>
                        <span className="summary-chevron" aria-hidden="true">
                          ▾
                        </span>
                      </summary>
                      <div className="detail-group">
                        <strong>
                          {result.matchedType === "fallback"
                            ? getFallbackGuide(result.dayStage.slug).title
                            : "이렇게 판단한 이유"}
                        </strong>
                        <ul className="detail-list">
                          {detailTraits.map((trait) => (
                            <li key={trait}>{trait}</li>
                          ))}
                          <li>{getStageImportantPoint(result.dayStage.slug, result.matchedType)}</li>
                        </ul>
                      </div>
                      {detailChoiceTips.length > 0 && result.matchedType !== "fallback" ? (
                        <div className="detail-group">
                          <strong>이럴 때는 이렇게 고르세요</strong>
                          <ul className="detail-list">
                            {detailChoiceTips.map((point) => (
                              <li key={point}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
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
                    <h3>비슷한 음식으로 바꿔보세요</h3>
                  </div>
                  <div className="action-chip-list">
                    {result.similarFoods.slice(0, 3).map((food) => (
                      <button
                        key={food.id}
                        type="button"
                        className="choice-button"
                        onClick={() => runSearch(food.name, dayStage, { scrollToResult: true })}
                      >
                        {food.name}
                      </button>
                    ))}
                  </div>
                </article>
              ) : null}
            </section>

          </section>
        ) : null}

        <section className="guide-section">
          <h2 className="guide-heading">FAQ / 가이드</h2>
          <p className="guide-caption">
            검사 일정과 장정결제 복용 방법은 병원 안내를 먼저 따라주세요.
          </p>
          <div className="guide-shell">
            {faqItems.map((item) => (
              <details key={item.question} className="guide-item">
                <summary className="guide-summary">
                  <span>{item.question}</span>
                  <span className="summary-chevron" aria-hidden="true">
                    ▾
                  </span>
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
        :global(body) {
          margin: 0;
          background: #f5f7fa;
        }

        .page {
          --primary: #3569e8;
          --primary-strong: #1d4ed8;
          --primary-soft: #eef4ff;
          --bg: #f5f7fa;
          --surface: #ffffff;
          --surface-soft: #f8fafc;
          --surface-sage: #f5f8f7;
          --line: #e5e7eb;
          --line-strong: #d1d5db;
          --text: #1f2937;
          --muted: #6b7280;
          --brand: #64748b;
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

        .hero-card {
          padding: 8px 0 20px;
          border: none;
          background: transparent;
          box-shadow: none;
        }

        .hero-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 44px;
          padding: 0;
          border-radius: 0;
          border: none;
          background:
            none;
        }

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--brand);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.02em;
          line-height: 1.2;
          flex: 0 0 auto;
          padding: 0;
        }

        .signal-dots {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex: 0 0 auto;
        }

        .signal-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          box-shadow: inset 0 0 0 0.5px rgba(255, 255, 255, 0.35);
        }

        .signal-dot-red {
          background: #ef6b6b;
        }

        .signal-dot-amber {
          background: #f2b84b;
        }

        .signal-dot-blue {
          background: #5b7cf6;
        }

        .share-box {
          display: grid;
          justify-items: end;
          gap: 6px;
          flex: 0 0 auto;
        }

        .share-button {
          min-height: 36px;
          border: 1px solid #dbe2f3;
          background: #ffffff;
          color: var(--primary-strong);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          padding: 0 12px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 13px;
          box-shadow: none;
          transition:
            color 0.15s ease,
            opacity 0.15s ease,
            transform 0.15s ease,
            box-shadow 0.15s ease,
            border-color 0.15s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .share-button:hover {
          color: #1e40af;
          border-color: #9bb6f3;
          box-shadow: none;
          transform: translateY(-1px);
        }

        .share-button:active {
          opacity: 0.65;
          transform: translateY(0);
        }

        .share-icon {
          width: 16px;
          height: 16px;
        }

        .share-label {
          line-height: 1;
        }

        .share-label-mobile {
          display: none;
        }

        .share-label-desktop {
          display: inline;
        }

        .share-feedback {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: #1f2937;
          text-align: right;
          white-space: nowrap;
          background: rgba(255, 255, 255, 0.98);
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid #d9e3ef;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
        }

        .hero-grid {
          display: none;
        }

        .hero-copy-block {
          margin-top: 18px;
          max-width: 100%;
        }

        .hero-title {
          margin: 0;
          font-size: clamp(34px, 5.4vw, 42px);
          line-height: 1.04;
          letter-spacing: -0.04em;
          font-weight: 800;
          max-width: 12em;
        }

        .hero-copy {
          margin: 10px 0 0;
          color: var(--muted);
          font-size: 15px;
          line-height: 1.6;
          max-width: 500px;
        }

        .search-panel {
          display: grid;
          gap: 14px;
          margin-top: 24px;
          padding: 20px 0 0;
          border-top: 1px solid var(--line);
          border-radius: 0;
          border-right: none;
          border-bottom: none;
          border-left: none;
          background: transparent;
          box-shadow: none;
        }

        .stage-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0;
          padding: 0;
          border: none;
          border-bottom: 1px solid var(--line);
          border-radius: 0;
          background: transparent;
        }

        .stage-button {
          border: none;
          border-bottom: 2px solid transparent;
          background: transparent;
          border-radius: 0;
          padding: 0 8px 12px;
          text-align: center;
          cursor: pointer;
          display: grid;
          gap: 1px;
          justify-items: center;
          transition:
            border-color 0.15s ease,
            color 0.15s ease,
            background 0.15s ease;
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
          background: transparent;
          box-shadow: none;
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
          gap: 12px;
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
          background: #ffffff;
          color: var(--text);
          line-height: 1.6;
          box-shadow: none;
        }

        .search-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(53, 105, 232, 0.12);
        }

        .search-button {
          border: none;
          border-radius: 14px;
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
          box-shadow: none;
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
          padding-top: 4px;
        }

        .quick-chips {
          display: flex;
          flex-wrap: nowrap;
          gap: 8px;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          padding: 2px 2px 4px;
        }

        .quick-chips::-webkit-scrollbar {
          display: none;
        }

        .quick-chip {
          border-radius: 999px;
          border: 1px solid var(--line);
          background: #ffffff;
          padding: 10px 14px;
          color: var(--text);
          cursor: pointer;
          font-weight: 600;
          flex: 0 0 auto;
          white-space: nowrap;
          box-shadow: none;
        }

        .error-text {
          margin: 14px 0 0;
          color: #dc2626;
          font-weight: 700;
        }

        .result-stack {
          display: grid;
          gap: 18px;
          margin-top: 24px;
        }

        .result-hero {
          padding: 0 0 0 20px;
          background: transparent !important;
          border: none;
          border-left: 4px solid currentColor;
          border-radius: 0;
          box-shadow: none;
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
          line-height: 1.68;
          max-width: 468px;
          color: #7b8794;
          letter-spacing: -0.01em;
        }

        .action-grid {
          display: grid;
          gap: 0;
        }

        .fallback-callout {
          padding: 10px 0 0;
          background: transparent;
          border: none;
          max-width: 468px;
        }

        .fallback-text {
          margin: 0;
          line-height: 1.72;
          max-width: 468px;
          letter-spacing: -0.01em;
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
          background: rgba(53, 105, 232, 0.04);
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
          font-size: 15px;
          line-height: 1.6;
          color: #374151;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .detail-list {
          margin: 0;
          padding-left: 18px;
          display: grid;
          gap: 8px;
        }

        .detail-list li {
          color: #667085;
          font-size: 15px;
          font-weight: 500;
          letter-spacing: -0.01em;
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
          border: 1px solid #d8e3df;
        }

        .panel-card {
          background: transparent;
          padding: 18px 0 0;
          border: none;
          border-top: 1px solid var(--line);
          border-radius: 0;
          box-shadow: none;
        }

        .guide-section {
          padding: 44px 0 0;
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
          border: 1px solid #d7e3df;
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
          border-color: #c0d4fb;
          background: #f8fbff;
        }

        .guide-heading {
          margin: 0;
          font-size: 18px;
          line-height: 1.5;
          color: var(--text);
          letter-spacing: -0.02em;
        }

        .guide-caption {
          margin: 8px 0 0;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.6;
        }

        .guide-shell {
          margin-top: 14px;
          border-top: 1px solid var(--line);
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          overflow: visible;
        }

        .guide-item {
          border-top: 1px solid var(--line);
          background: transparent;
          border-radius: 0;
          padding: 18px 0;
          color: var(--text);
          box-shadow: none;
        }

        .guide-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
          list-style: none;
          font-size: 15px;
          line-height: 1.6;
          font-weight: 700;
          color: var(--text);
        }

        .guide-summary::-webkit-details-marker {
          display: none;
        }

        .guide-item[open] .summary-chevron {
          transform: rotate(180deg);
        }

        .guide-item h3 {
          margin: 0;
          font-size: 15px;
          line-height: 1.6;
          font-weight: 700;
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
            padding: 16px 16px 48px;
          }

          .hero-card,
          .panel-card {
            border-radius: 0;
          }

          .result-hero {
            border-radius: 0;
            padding: 0 0 0 18px;
          }

          .hero-title {
            font-size: 34px;
            line-height: 1.04;
            max-width: 8.6em;
          }

          .hero-top {
            align-items: center;
            gap: 10px;
            min-height: 40px;
          }

          .share-button {
            min-height: 34px;
            padding: 0 11px;
            font-size: 12px;
          }

          .eyebrow {
            font-size: 13px;
            padding: 0;
          }

          .signal-dots {
            gap: 3px;
          }

          .signal-dot {
            width: 5px;
            height: 5px;
          }

          .share-label-mobile {
            display: inline;
          }

          .share-label-desktop {
            display: none;
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
            gap: 0;
            padding: 0;
          }

          .stage-button {
            padding: 0 6px 10px;
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

          .search-panel {
            padding: 18px 0 0;
            border-radius: 0;
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

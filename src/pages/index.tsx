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
    label: "허용",
    tone: "지금 단계에서 비교적 안전한 편",
    color: "#157347",
    bg: "linear-gradient(135deg, #effaf3 0%, #e1f4e7 100%)",
    chip: "#d4f2de",
  },
  caution: {
    label: "주의",
    tone: "양과 형태를 더 보수적으로 보는 편이 좋음",
    color: "#9a5b00",
    bg: "linear-gradient(135deg, #fff7e5 0%, #fff0c9 100%)",
    chip: "#ffebb3",
  },
  avoid: {
    label: "금지",
    tone: "이 단계에서는 피하는 쪽이 안전함",
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
  A: "대표 음식 직접 매칭",
  B: "별칭 또는 음식군 기반",
  C: "미등록 음식에 대한 보수적 안내",
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

  return (
    <main className="page">
      <div className="page-shell">
        <section className="hero-card">
          <div className="eyebrow">대장내시경 음식체크 by 건강신호등</div>
          <div className="hero-grid">
            <div>
              <h1 className="hero-title">이 음식, 지금 먹어도 되는지 바로 확인</h1>
              <p className="hero-copy">
                날짜 단계와 음식명을 입력하면 허용, 주의, 금지를 신호등 형태로 보여줍니다.
                직접 매칭인지, 별칭인지, 미등록 음식인지도 함께 안내합니다.
              </p>
            </div>
            <div className="hero-aside">
              <div className="aside-kicker">빠른 사용 흐름</div>
              <ol className="aside-list">
                <li>검사 단계 선택</li>
                <li>음식명 입력</li>
                <li>신호등 결과와 이유 확인</li>
              </ol>
            </div>
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
                  <small>{option.hint}</small>
                </button>
              ))}
            </div>

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
                {loading ? "확인 중" : "검색"}
              </button>
            </div>

            <div className="quick-row">
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

          <div className="guide-strip">
            <div className="guide-card">
              <strong>Confidence A</strong>
              <span>대표 음식 직접 매칭으로 가장 정확한 편입니다.</span>
            </div>
            <div className="guide-card">
              <strong>Confidence B</strong>
              <span>별칭이나 음식군 기준으로 판단한 결과입니다.</span>
            </div>
            <div className="guide-card">
              <strong>Confidence C</strong>
              <span>미등록 음식일 수 있어 보수적 안내를 우선합니다.</span>
            </div>
          </div>

          {error ? <p className="error-text">{error}</p> : null}
        </section>

        {result && status && matchMeta ? (
          <section className="result-stack">
            <article className="result-hero" style={{ background: status.bg, color: status.color }}>
              <div className="result-topline">
                <div className="badge-row">
                  <span className="badge neutral">{result.dayStage.name}</span>
                  <span className="badge neutral">{matchMeta.label}</span>
                  <span className="badge neutral">신뢰도 {result.confidenceGrade}</span>
                </div>
                <div className="status-box" style={{ borderColor: `${status.color}30` }}>
                  <strong>{status.label}</strong>
                  <span>{status.tone}</span>
                </div>
              </div>

              <div className="result-main">
                <div>
                  <h2 className="result-title">{result.query}</h2>
                  <p className="result-summary">{getMatchedSummary(result)}</p>
                </div>
                <div className="trust-panel">
                  <div className="trust-grade">Confidence {result.confidenceGrade}</div>
                  <div className="trust-copy">{confidenceCopy[result.confidenceGrade]}</div>
                  <div className="trust-note">{matchMeta.description}</div>
                </div>
              </div>

              <p className="primary-reason">{result.primaryReason}</p>
              {result.secondaryReason ? (
                <p className="secondary-reason">추가 참고: {result.secondaryReason}</p>
              ) : null}

              {result.matchedType === "fallback" ? (
                <div className="fallback-callout">
                  <strong>미등록 음식 안내</strong>
                  <p>
                    현재는 직접 등록된 규칙이 없어 보수적으로 안내합니다. 비슷한 음식으로 다시
                    검색하거나, 아래 추천 메뉴와 유사 음식을 함께 참고하는 편이 안전합니다.
                  </p>
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
            </article>

            <section className="insight-grid">
              <article className="panel-card">
                <div className="panel-header">
                  <h3>판정 근거</h3>
                  <span>핵심 1~2개만 표시</span>
                </div>
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
                ) : (
                  <p className="empty-copy">
                    직접 등록된 규칙이 없어 보수적 안내가 적용되었습니다.
                  </p>
                )}
              </article>

              <article className="panel-card">
                <div className="panel-header">
                  <h3>유사 음식</h3>
                  <span>바로 다시 검색 가능</span>
                </div>
                {result.similarFoods.length > 0 ? (
                  <div className="action-list">
                    {result.similarFoods.map((food) => (
                      <button
                        key={food.id}
                        type="button"
                        className="action-card"
                        onClick={() => runSearch(food.name)}
                      >
                        <strong>{food.name}</strong>
                        <span>{food.note ?? "비슷한 선택지로 다시 확인할 수 있습니다."}</span>
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
                  <span>{result.dayStage.name} 기준</span>
                </div>
                {result.recommendedMenus.length > 0 ? (
                  <div className="menu-list">
                    {result.recommendedMenus.map((menu) => (
                      <div key={menu.id} className="menu-card">
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
                      </div>
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
          padding: 28px 18px 72px;
          background:
            radial-gradient(circle at top left, rgba(232, 247, 239, 0.9) 0%, rgba(255, 248, 232, 0.85) 45%, #fff 100%);
          color: #17212f;
          font-family: "Pretendard Variable", "Pretendard", "Noto Sans KR", sans-serif;
        }

        .page-shell {
          max-width: 1080px;
          margin: 0 auto;
          display: grid;
          gap: 22px;
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
          padding: 28px;
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
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) minmax(260px, 0.8fr);
          gap: 24px;
          margin-top: 18px;
        }

        .hero-title {
          margin: 0;
          font-size: clamp(34px, 5vw, 58px);
          line-height: 0.98;
          letter-spacing: -0.05em;
        }

        .hero-copy {
          margin: 16px 0 0;
          color: #475467;
          font-size: 18px;
          line-height: 1.7;
          max-width: 720px;
        }

        .hero-aside {
          padding: 20px;
          border-radius: 22px;
          background: linear-gradient(180deg, #f9fbff 0%, #eef5ff 100%);
          border: 1px solid #dbe7ff;
        }

        .aside-kicker {
          font-size: 13px;
          font-weight: 800;
          color: #175cd3;
          margin-bottom: 10px;
        }

        .aside-list {
          margin: 0;
          padding-left: 18px;
          color: #344054;
          line-height: 1.8;
        }

        .search-panel {
          display: grid;
          gap: 14px;
          margin-top: 24px;
        }

        .stage-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .stage-button {
          border: 1px solid #d9dee7;
          background: #fff;
          border-radius: 20px;
          padding: 14px 16px;
          text-align: left;
          cursor: pointer;
          display: grid;
          gap: 4px;
          transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .stage-button span {
          font-size: 16px;
          font-weight: 800;
          color: #111827;
        }

        .stage-button small {
          color: #667085;
          font-size: 13px;
        }

        .stage-button.is-active {
          border-color: #111827;
          box-shadow: 0 10px 24px rgba(17, 24, 39, 0.08);
          transform: translateY(-1px);
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

        .quick-row {
          display: grid;
          gap: 10px;
        }

        .guide-strip {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 18px;
        }

        .guide-card {
          display: grid;
          gap: 6px;
          padding: 14px;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #e4e7ec;
        }

        .guide-card strong {
          color: #101828;
          font-size: 14px;
        }

        .guide-card span {
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
          gap: 18px;
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
          grid-template-columns: minmax(0, 1.4fr) minmax(220px, 0.8fr);
          gap: 18px;
          align-items: flex-start;
          margin-top: 18px;
        }

        .result-title {
          margin: 0;
          font-size: clamp(32px, 4vw, 44px);
          line-height: 1;
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

        .trust-panel {
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.84);
          border: 1px solid rgba(15, 23, 42, 0.08);
          padding: 18px;
        }

        .trust-grade {
          color: #101828;
          font-size: 16px;
          font-weight: 800;
        }

        .trust-copy {
          margin-top: 4px;
          color: #344054;
          font-weight: 700;
        }

        .trust-note {
          margin-top: 8px;
          color: #667085;
          line-height: 1.6;
          font-size: 14px;
        }

        .primary-reason {
          margin: 18px 0 0;
          font-size: 18px;
        }

        .secondary-reason {
          margin: 10px 0 0;
        }

        .fallback-callout {
          margin-top: 18px;
          padding: 16px 18px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.78);
          border: 1px dashed rgba(15, 23, 42, 0.16);
        }

        .fallback-callout strong {
          display: block;
          color: #101828;
          margin-bottom: 6px;
        }

        .fallback-callout p {
          margin: 0;
        }

        .tag-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 18px;
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
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .panel-card {
          background: rgba(255, 255, 255, 0.96);
          padding: 22px;
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
          gap: 12px;
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
          padding: 14px;
          border-radius: 18px;
          border: 1px solid #e5e7eb;
          background: #fff;
        }

        .action-card {
          cursor: pointer;
          display: grid;
          gap: 6px;
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
          .hero-grid,
          .result-main,
          .insight-grid,
          .guide-strip {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .page {
            padding: 18px 14px 48px;
          }

          .hero-card,
          .result-hero,
          .panel-card {
            border-radius: 24px;
            padding: 20px;
          }

          .stage-row,
          .search-row {
            grid-template-columns: 1fr;
          }

          .hero-title {
            font-size: 38px;
          }

          .hero-copy {
            font-size: 16px;
          }

          .status-box {
            min-width: 0;
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}

export type JudgementStatus = "allowed" | "caution" | "avoid";
export type ConfidenceGrade = "A" | "B" | "C";
export type SearchMatchedType = "exact_food" | "alias" | "food_group" | "fallback" | "none";

export interface CandidateTag {
  tagId: string;
  tagSlug: string;
  source: "food" | "food_group";
  weight?: number | null;
  note?: string | null;
}

export interface StageRule {
  tagId: string;
  tagSlug: string;
  status: JudgementStatus;
  rationale: string;
  priority: number;
}

export interface JudgementInput {
  matchedType: SearchMatchedType;
  foodId?: string;
  foodGroupId?: string;
  foodName?: string;
  tags: CandidateTag[];
  rules: StageRule[];
}

export interface AppliedRule extends StageRule {
  source: "food" | "food_group";
}

export interface JudgementResult {
  status: JudgementStatus;
  confidenceGrade: ConfidenceGrade;
  matchedType: SearchMatchedType;
  appliedRules: AppliedRule[];
  appliedTagSlugs: string[];
  primaryReason: string;
}

const statusRank: Record<JudgementStatus, number> = {
  avoid: 3,
  caution: 2,
  allowed: 1,
};

const confidenceByMatchedType: Record<SearchMatchedType, ConfidenceGrade> = {
  exact_food: "A",
  alias: "B",
  food_group: "B",
  fallback: "C",
  none: "C",
};

export function resolveJudgement(input: JudgementInput): JudgementResult {
  const ruleMap = new Map(input.rules.map((rule) => [rule.tagId, rule]));

  const appliedRules = input.tags
    .map((tag) => {
      const rule = ruleMap.get(tag.tagId);
      if (!rule) {
        return null;
      }

      return {
        ...rule,
        source: tag.source,
      } satisfies AppliedRule;
    })
    .filter((rule): rule is AppliedRule => Boolean(rule))
    .sort((left, right) => {
      const statusGap = statusRank[right.status] - statusRank[left.status];
      if (statusGap !== 0) {
        return statusGap;
      }

      return left.priority - right.priority;
    });

  const bestRule = appliedRules[0];
  const status = bestRule?.status ?? "caution";
  const primaryReason =
    bestRule?.rationale ??
    "직접 규칙이 없어서 보수적으로 caution 처리했다. 이후 검색 로그를 보고 데이터 보강이 필요하다.";

  return {
    status,
    confidenceGrade: confidenceByMatchedType[input.matchedType],
    matchedType: input.matchedType,
    appliedRules,
    appliedTagSlugs: [...new Set(appliedRules.map((rule) => rule.tagSlug))],
    primaryReason,
  };
}

export function mergeCandidateTags(foodTags: CandidateTag[], groupTags: CandidateTag[]): CandidateTag[] {
  const merged = new Map<string, CandidateTag>();

  // Group tags are the default classification.
  // Food-level tags are additive overrides for specific foods and win when duplicated.
  for (const tag of [...groupTags, ...foodTags]) {
    const existing = merged.get(tag.tagId);
    if (!existing) {
      merged.set(tag.tagId, tag);
      continue;
    }

    if (existing.source === "food_group" && tag.source === "food") {
      merged.set(tag.tagId, tag);
    }
  }

  return [...merged.values()];
}

export const SEARCH_MATCH_ORDER: SearchMatchedType[] = [
  "exact_food",
  "alias",
  "food_group",
  "fallback",
];

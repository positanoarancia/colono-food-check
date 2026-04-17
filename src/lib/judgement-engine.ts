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
  id: string;
  tagId: string;
  tagSlug: string;
  status: JudgementStatus;
  rationale: string;
  priority: number;
  references: Array<{
    label: string;
    url: string;
  }>;
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

export interface ExposedAppliedRule {
  tagSlug: string;
  status: JudgementStatus;
  rationale: string;
  source: "food" | "food_group";
  references: Array<{
    label: string;
    url: string;
  }>;
}

export interface JudgementResult {
  status: JudgementStatus;
  confidenceGrade: ConfidenceGrade;
  matchedType: SearchMatchedType;
  appliedRules: AppliedRule[];
  topAppliedRules: ExposedAppliedRule[];
  appliedTagSlugs: string[];
  primaryReason: string;
  secondaryReason?: string;
  usedFallbackReason: boolean;
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

function shouldSuppressGroupRuleForFoodOverride(tag: CandidateTag, rule: StageRule, tags: CandidateTag[]) {
  const hasD1SoftAllowedFoodTag = tags.some(
    (candidate) => candidate.source === "food" && candidate.tagSlug === "d1-soft-allowed",
  );

  if (!hasD1SoftAllowedFoodTag || tag.source !== "food_group") {
    return false;
  }

  return rule.status === "caution" && (rule.tagSlug === "low-fiber" || rule.tagSlug === "soft-food");
}

export function resolveJudgement(input: JudgementInput): JudgementResult {
  const ruleMap = new Map(input.rules.map((rule) => [rule.tagId, rule]));

  const appliedRules = input.tags
    .map((tag) => {
      const rule = ruleMap.get(tag.tagId);
      if (!rule) {
        return null;
      }

      if (shouldSuppressGroupRuleForFoodOverride(tag, rule, input.tags)) {
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
  const usedFallbackReason = appliedRules.length === 0;
  const status = bestRule?.status ?? "caution";
  const topAppliedRules = appliedRules.slice(0, 2).map((rule) => ({
    tagSlug: rule.tagSlug,
    status: rule.status,
    rationale: rule.rationale,
    source: rule.source,
    references: rule.references,
  }));
  const primaryReason =
    topAppliedRules[0]?.rationale ??
    "직접 등록된 규칙이 없어 보수적으로 주의 처리했습니다. 미등록 음식일 수 있어 정확 판정보다 안전한 안내를 우선합니다.";
  const secondaryReason = topAppliedRules[1]?.rationale;
  const confidenceGrade = usedFallbackReason ? "C" : confidenceByMatchedType[input.matchedType];

  return {
    status,
    confidenceGrade,
    matchedType: input.matchedType,
    appliedRules,
    topAppliedRules,
    appliedTagSlugs: [...new Set(appliedRules.map((rule) => rule.tagSlug))],
    primaryReason,
    secondaryReason,
    usedFallbackReason,
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

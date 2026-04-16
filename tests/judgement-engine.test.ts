import assert from "node:assert/strict";
import test from "node:test";

import { resolveJudgement } from "../src/lib/judgement-engine";

function withRuleDefaults<T extends { tagId: string }>(rules: T[]) {
  return rules.map((rule, index) => ({
    ...rule,
    id: `rule-${index}-${rule.tagId}`,
    references: [],
  }));
}

const d5Rules = withRuleDefaults([
  { tagId: "low", tagSlug: "low-fiber", status: "allowed", rationale: "섬유질이 적어 장에 잔여물이 남을 가능성이 상대적으로 낮습니다.", priority: 30 },
  { tagId: "soft", tagSlug: "soft-food", status: "allowed", rationale: "부드러운 질감이라 장에 부담이 비교적 적습니다.", priority: 40 },
  { tagId: "clear", tagSlug: "clear-broth", status: "allowed", rationale: "건더기 없는 맑은 국물은 검사 준비 식단에 비교적 무난합니다.", priority: 20 },
  { tagId: "processed", tagSlug: "processed", status: "caution", rationale: "가공식품은 조미와 첨가물이 많아 보수적으로 접근하는 편이 좋습니다.", priority: 80 },
  { tagId: "withPeel", tagSlug: "with-peel", status: "caution", rationale: "껍질이 남아 장내 잔사로 이어질 수 있어 줄이는 편이 좋습니다.", priority: 60 },
  { tagId: "chunky", tagSlug: "chunky", status: "caution", rationale: "건더기가 많으면 장에 남는 양이 늘 수 있어 양 조절이 필요합니다.", priority: 50 },
  { tagId: "spicy", tagSlug: "spicy-seasoning", status: "caution", rationale: "매운 양념은 장을 자극할 수 있어 준비식으로는 보수적으로 봅니다.", priority: 55 },
  { tagId: "fried", tagSlug: "fried", status: "caution", rationale: "튀김은 기름이 많아 소화 부담을 높일 수 있습니다.", priority: 56 },
  { tagId: "high", tagSlug: "high-fiber", status: "avoid", rationale: "섬유질이 많아 장에 잔여물이 남을 수 있습니다.", priority: 1 },
  { tagId: "seeded", tagSlug: "seeded", status: "avoid", rationale: "씨나 알갱이가 남아 검사 준비에 방해될 수 있습니다.", priority: 2 },
  { tagId: "whole", tagSlug: "whole-grain", status: "avoid", rationale: "잡곡은 껍질과 배아가 남아 장 정결을 어렵게 할 수 있습니다.", priority: 3 },
  { tagId: "nuts", tagSlug: "nuts", status: "avoid", rationale: "견과류는 잘게 남아 장에 잔사로 남기 쉽습니다.", priority: 4 },
  { tagId: "seaweed", tagSlug: "seaweed", status: "avoid", rationale: "해조류는 질긴 섬유가 많아 장 정결에 불리할 수 있습니다.", priority: 5 },
  { tagId: "vegetable", tagSlug: "vegetables-heavy", status: "avoid", rationale: "채소 비중이 높으면 섬유질과 잔사 부담이 커집니다.", priority: 6 },
  { tagId: "namul", tagSlug: "namul", status: "avoid", rationale: "나물류는 줄기와 잎 섬유가 남기 쉬워 피하는 편이 안전합니다.", priority: 7 },
]);

const d3Rules = withRuleDefaults([
  { tagId: "low", tagSlug: "low-fiber", status: "allowed", rationale: "저섬유 음식은 3일 전 준비식의 기본 축입니다.", priority: 30 },
  { tagId: "soft", tagSlug: "soft-food", status: "allowed", rationale: "부드러운 음식은 장 자극과 잔사 부담이 상대적으로 적습니다.", priority: 40 },
  { tagId: "clear", tagSlug: "clear-broth", status: "allowed", rationale: "건더기 없는 맑은 국물은 3일 전에도 비교적 안전합니다.", priority: 20 },
  { tagId: "processed", tagSlug: "processed", status: "caution", rationale: "가공식품은 조미가 강하고 재료 구성이 복잡해 보수적으로 판단합니다.", priority: 75 },
  { tagId: "high", tagSlug: "high-fiber", status: "avoid", rationale: "섬유질이 많아 장에 남는 잔사가 늘 수 있습니다.", priority: 1 },
  { tagId: "seeded", tagSlug: "seeded", status: "avoid", rationale: "씨나 작은 알갱이가 장내에 남아 검사 준비를 방해할 수 있습니다.", priority: 2 },
  { tagId: "withPeel", tagSlug: "with-peel", status: "avoid", rationale: "껍질이 남아 장 정결을 어렵게 할 수 있습니다.", priority: 3 },
  { tagId: "whole", tagSlug: "whole-grain", status: "avoid", rationale: "잡곡은 껍질과 배아가 남아 검사 준비 식단에 적합하지 않습니다.", priority: 4 },
  { tagId: "nuts", tagSlug: "nuts", status: "avoid", rationale: "견과류는 잘게 부서져도 장에 잔사로 남기 쉽습니다.", priority: 5 },
  { tagId: "seaweed", tagSlug: "seaweed", status: "avoid", rationale: "해조류는 질긴 섬유 때문에 장 정결에 불리합니다.", priority: 6 },
  { tagId: "vegetable", tagSlug: "vegetables-heavy", status: "avoid", rationale: "채소 비중이 높은 음식은 잔사와 섬유 부담이 큽니다.", priority: 7 },
  { tagId: "namul", tagSlug: "namul", status: "avoid", rationale: "나물류는 줄기와 잎 잔사가 남기 쉬워 3일 전부터 제한합니다.", priority: 8 },
  { tagId: "spicy", tagSlug: "spicy-seasoning", status: "avoid", rationale: "매운 양념은 장 자극과 식단 이탈 가능성을 높여 피하는 편이 좋습니다.", priority: 9 },
  { tagId: "fried", tagSlug: "fried", status: "avoid", rationale: "튀김은 기름이 많아 소화와 장 정결 모두에 불리합니다.", priority: 10 },
  { tagId: "chunky", tagSlug: "chunky", status: "avoid", rationale: "건더기가 많아 장에 남는 잔사가 많아질 수 있습니다.", priority: 11 },
]);

const d1Rules = withRuleDefaults([
  { tagId: "clear", tagSlug: "clear-broth", status: "allowed", rationale: "전날에는 건더기 없는 맑은 유동식이 가장 안전한 선택입니다.", priority: 1 },
  { tagId: "low", tagSlug: "low-fiber", status: "caution", rationale: "저섬유라도 고형식은 전날 기준으로는 제한적으로만 보는 편이 안전합니다.", priority: 40 },
  { tagId: "soft", tagSlug: "soft-food", status: "caution", rationale: "부드러운 음식이라도 전날에는 맑은 유동식보다 우선하지 않습니다.", priority: 50 },
  { tagId: "high", tagSlug: "high-fiber", status: "avoid", rationale: "섬유질이 많아 전날 식단으로는 장에 잔여물이 남을 수 있습니다.", priority: 2 },
  { tagId: "seeded", tagSlug: "seeded", status: "avoid", rationale: "씨와 알갱이가 검사 직전까지 남을 수 있어 전날에는 피해야 합니다.", priority: 3 },
  { tagId: "withPeel", tagSlug: "with-peel", status: "avoid", rationale: "껍질이 남아 장 정결을 방해할 수 있어 전날에는 금지에 가깝습니다.", priority: 4 },
  { tagId: "whole", tagSlug: "whole-grain", status: "avoid", rationale: "잡곡은 장내 잔사 가능성이 커 전날 식단에 적합하지 않습니다.", priority: 5 },
  { tagId: "nuts", tagSlug: "nuts", status: "avoid", rationale: "견과류는 작은 조각도 남기 쉬워 전날에는 피해야 합니다.", priority: 6 },
  { tagId: "seaweed", tagSlug: "seaweed", status: "avoid", rationale: "해조류는 질긴 섬유와 잔사 때문에 전날 식단에 맞지 않습니다.", priority: 7 },
  { tagId: "vegetable", tagSlug: "vegetables-heavy", status: "avoid", rationale: "채소가 많은 음식은 전날 기준으로 잔사가 너무 많습니다.", priority: 8 },
  { tagId: "namul", tagSlug: "namul", status: "avoid", rationale: "나물류는 섬유와 건더기가 많아 전날에는 피해야 합니다.", priority: 9 },
  { tagId: "spicy", tagSlug: "spicy-seasoning", status: "avoid", rationale: "매운 양념은 장을 자극하고 전날 식단 기준에도 맞지 않습니다.", priority: 10 },
  { tagId: "fried", tagSlug: "fried", status: "avoid", rationale: "튀김은 소화 부담이 커 전날 식단으로는 부적합합니다.", priority: 11 },
  { tagId: "processed", tagSlug: "processed", status: "avoid", rationale: "가공식품은 재료와 조미가 복합적이라 전날에는 보수적으로 금지합니다.", priority: 14 },
  { tagId: "chunky", tagSlug: "chunky", status: "avoid", rationale: "건더기가 많아 검사 직전 식단으로는 적합하지 않습니다.", priority: 13 },
]);

const representativeCases = [
  { food: "흰죽", tags: ["low", "soft"], d5: "allowed", d3: "allowed", d1: "caution" },
  { food: "흰쌀밥", tags: ["low"], d5: "allowed", d3: "allowed", d1: "caution" },
  { food: "계란찜", tags: ["low", "soft"], d5: "allowed", d3: "allowed", d1: "caution" },
  { food: "삶은계란", tags: ["low", "soft"], d5: "allowed", d3: "allowed", d1: "caution" },
  { food: "두부", tags: ["low", "soft"], d5: "allowed", d3: "allowed", d1: "caution" },
  { food: "연두부", tags: ["low", "soft"], d5: "allowed", d3: "allowed", d1: "caution" },
  { food: "감자", tags: ["low", "soft"], d5: "allowed", d3: "allowed", d1: "caution" },
  { food: "닭가슴살", tags: ["low", "soft"], d5: "allowed", d3: "allowed", d1: "caution" },
  { food: "바나나", tags: ["low", "soft"], d5: "allowed", d3: "allowed", d1: "caution" },
  { food: "사과", tags: ["withPeel"], d5: "caution", d3: "avoid", d1: "avoid" },
  { food: "배", tags: ["withPeel"], d5: "caution", d3: "avoid", d1: "avoid" },
  { food: "카스테라", tags: ["low", "soft", "processed"], d5: "caution", d3: "caution", d1: "avoid" },
  { food: "푸딩", tags: ["soft", "processed"], d5: "caution", d3: "caution", d1: "avoid" },
  { food: "우유", tags: ["dairy", "processed"], d5: "caution", d3: "caution", d1: "avoid" },
  { food: "요거트", tags: ["dairy", "processed"], d5: "caution", d3: "caution", d1: "avoid" },
  { food: "크래커", tags: ["low", "processed"], d5: "caution", d3: "caution", d1: "avoid" },
  { food: "우동", tags: ["low"], d5: "allowed", d3: "allowed", d1: "caution" },
  { food: "잔치국수", tags: ["low"], d5: "allowed", d3: "allowed", d1: "caution" },
  { food: "라면", tags: ["processed", "spicy", "chunky"], d5: "caution", d3: "avoid", d1: "avoid" },
  { food: "컵라면", tags: ["processed", "spicy", "fried"], d5: "caution", d3: "avoid", d1: "avoid" },
  { food: "로제떡볶이", tags: ["processed", "spicy", "dairy"], d5: "caution", d3: "avoid", d1: "avoid" },
  { food: "불닭볶음면", tags: ["processed", "spicy", "fried"], d5: "caution", d3: "avoid", d1: "avoid" },
  { food: "김치찌개", tags: ["vegetable", "spicy", "chunky"], d5: "avoid", d3: "avoid", d1: "avoid" },
  { food: "된장찌개", tags: ["chunky"], d5: "caution", d3: "avoid", d1: "avoid" },
  { food: "만둣국", tags: ["processed", "chunky"], d5: "caution", d3: "avoid", d1: "avoid" },
  { food: "미역국", tags: ["seaweed", "chunky"], d5: "avoid", d3: "avoid", d1: "avoid" },
  { food: "마라탕", tags: ["vegetable", "spicy", "chunky"], d5: "avoid", d3: "avoid", d1: "avoid" },
  { food: "잡곡밥", tags: ["whole", "high"], d5: "avoid", d3: "avoid", d1: "avoid" },
  { food: "현미밥", tags: ["whole", "high"], d5: "avoid", d3: "avoid", d1: "avoid" },
  { food: "김밥", tags: ["processed", "chunky", "vegetable", "seaweed"], d5: "avoid", d3: "avoid", d1: "avoid" },
  { food: "삼각김밥", tags: ["processed", "seaweed"], d5: "avoid", d3: "avoid", d1: "avoid" },
  { food: "편의점도시락", tags: ["processed", "chunky"], d5: "caution", d3: "avoid", d1: "avoid" },
  { food: "비빔밥", tags: ["namul", "spicy", "vegetable"], d5: "avoid", d3: "avoid", d1: "avoid" },
  { food: "떡볶이", tags: ["processed", "spicy", "chunky"], d5: "caution", d3: "avoid", d1: "avoid" },
  { food: "튀김", tags: ["fried", "processed"], d5: "caution", d3: "avoid", d1: "avoid" },
  { food: "샐러드", tags: ["high", "vegetable"], d5: "avoid", d3: "avoid", d1: "avoid" },
  { food: "나물반찬", tags: ["high", "namul"], d5: "avoid", d3: "avoid", d1: "avoid" },
  { food: "고구마", tags: ["high", "withPeel"], d5: "avoid", d3: "avoid", d1: "avoid" },
  { food: "견과류", tags: ["nuts", "high"], d5: "avoid", d3: "avoid", d1: "avoid" },
  { food: "맑은육수", tags: ["clear"], d5: "allowed", d3: "allowed", d1: "allowed" },
];

function tagsToCandidates(tags: string[]) {
  return tags.map((tagId) => ({
    tagId,
    tagSlug: tagId,
    source: "food_group" as const,
  }));
}

test("fallback without matched rules returns conservative caution and confidence C", () => {
  const result = resolveJudgement({
    matchedType: "fallback",
    tags: [],
    rules: [],
  });

  assert.equal(result.status, "caution");
  assert.equal(result.confidenceGrade, "C");
  assert.equal(result.usedFallbackReason, true);
  assert.match(result.primaryReason, /보수적으로 주의 처리/);
});

test("topAppliedRules are limited to two entries", () => {
  const result = resolveJudgement({
    matchedType: "exact_food",
    tags: tagsToCandidates(["spicy", "chunky", "processed"]),
    rules: d3Rules,
  });

  assert.equal(result.topAppliedRules.length, 2);
  assert.equal(result.topAppliedRules[0]?.status, "avoid");
});

test("alias match keeps confidence B when rules exist", () => {
  const result = resolveJudgement({
    matchedType: "alias",
    tags: tagsToCandidates(["low"]),
    rules: d3Rules,
  });

  assert.equal(result.status, "allowed");
  assert.equal(result.confidenceGrade, "B");
});

test("food_group match keeps confidence B when rules exist", () => {
  const result = resolveJudgement({
    matchedType: "food_group",
    tags: tagsToCandidates(["processed"]),
    rules: d5Rules,
  });

  assert.equal(result.status, "caution");
  assert.equal(result.confidenceGrade, "B");
});

for (const sample of representativeCases) {
  test(`representative case: ${sample.food}`, () => {
    const tags = tagsToCandidates(sample.tags);

    assert.equal(
      resolveJudgement({ matchedType: "exact_food", tags, rules: d5Rules }).status,
      sample.d5,
    );
    assert.equal(
      resolveJudgement({ matchedType: "exact_food", tags, rules: d3Rules }).status,
      sample.d3,
    );
    assert.equal(
      resolveJudgement({ matchedType: "exact_food", tags, rules: d1Rules }).status,
      sample.d1,
    );
  });
}

import assert from "node:assert/strict";
import test from "node:test";

import {
  checkFoodByQuery,
  getSafeAlternativeFoods,
  inferFallbackCategory,
} from "../src/lib/check-food";

test("raw fish queries get a decisive fallback category", () => {
  const category = inferFallbackCategory("회");

  assert.ok(category);
  assert.equal(category?.key, "raw-fish");
  assert.equal(category?.statusByStage.d3, "avoid");
});

test("safe alternatives stay available even when the query should be excluded", () => {
  const alternatives = getSafeAlternativeFoods("d1", ["흰죽"]);

  assert.ok(alternatives.length >= 1);
  assert.equal(alternatives.some((food) => food.name === "흰죽"), false);
  assert.equal(alternatives[0]?.name, "미음");
});

test("single-character queries ask for a more specific search term", async () => {
  const result = await checkFoodByQuery({
    conditionSlug: "colonoscopy",
    dayStageSlug: "d5",
    query: "바",
  });

  assert.equal(result.matchedType, "fallback");
  assert.equal(result.confidenceGrade, "C");
  assert.equal(result.status, "caution");
  assert.match(result.primaryReason, /검색어를 조금 더 구체적으로 입력해 주세요/);
  assert.match(result.secondaryReason ?? "", /한 글자만으로는 음식 종류를 정확히 구분하기 어려워요/);
  assert.equal(result.similarFoods.length, 0);
});

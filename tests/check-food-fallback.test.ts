import assert from "node:assert/strict";
import test from "node:test";

import { getSafeAlternativeFoods, inferFallbackCategory } from "../src/lib/check-food";

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

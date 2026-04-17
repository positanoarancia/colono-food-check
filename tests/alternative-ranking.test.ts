import assert from "node:assert/strict";
import test from "node:test";

import { scoreAlternativeFoodName } from "../src/lib/check-food";

test("alternative food scoring prefers simple representative names", () => {
  assert.ok(
    scoreAlternativeFoodName("검은깨죽") > scoreAlternativeFoodName("검은깨죽정식"),
    "plain dish should outrank set-menu variant",
  );

  assert.ok(
    scoreAlternativeFoodName("고사리") > scoreAlternativeFoodName("고사리샐러드"),
    "plain ingredient should outrank generated salad variant",
  );

  assert.ok(
    scoreAlternativeFoodName("짬뽕") > scoreAlternativeFoodName("짬뽕곱빼기"),
    "plain dish should outrank size variant",
  );
});

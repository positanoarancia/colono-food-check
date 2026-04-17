import assert from "node:assert/strict";
import test from "node:test";

import { foodAliases, foods, sources } from "../prisma/seed";

test("bulk seed keeps at least 2000 foods", () => {
  assert.ok(
    foods.length >= 2000,
    `expected at least 2000 foods but got ${foods.length}`,
  );
});

test("bulk seed includes high-priority real-world foods", () => {
  const names = new Set(foods.map((food) => food.name));

  for (const expected of [
    "파스타",
    "짜장면",
    "짬뽕",
    "제육볶음",
    "돈까스",
    "설렁탕",
    "카레라이스",
    "깨죽",
    "들기름",
    "미나리",
    "버섯류",
  ]) {
    assert.ok(names.has(expected), `missing representative food: ${expected}`);
  }
});

test("food aliases stay unique after bulk expansion", () => {
  const seen = new Set<string>();

  for (const alias of foodAliases) {
    assert.ok(
      !seen.has(alias.normalizedAlias),
      `duplicate normalized alias: ${alias.normalizedAlias}`,
    );
    seen.add(alias.normalizedAlias);
  }
});

test("official hospital sources stay broad after bulk expansion", () => {
  const hospitalSources = sources.filter(
    (source) => typeof source.url === "string" && source.url.startsWith("https://"),
  );

  assert.ok(
    hospitalSources.length >= 10,
    `expected at least 10 official hospital sources but got ${hospitalSources.length}`,
  );
});

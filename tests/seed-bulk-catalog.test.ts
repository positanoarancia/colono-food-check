import assert from "node:assert/strict";
import test from "node:test";

import { foodAliases, foodGroupSources, foodGroups, foodSources, foods, sources } from "../prisma/seed";

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

test("bulk expansion creates common variant aliases", () => {
  const aliasSet = new Set(foodAliases.map((alias) => alias.alias));

  for (const expected of [
    "김치 찌개",
    "갈릭까르보나라스파게티",
    "새우토마토스파게티",
    "돈가스",
    "자장면",
    "갈릭카르보나라파스타",
    "새우카르보나라스파게티",
    "리조토",
  ]) {
    assert.ok(aliasSet.has(expected), `missing variant alias: ${expected}`);
  }
});

test("direct hospital foods keep source coverage", () => {
  const foodIdByName = new Map(foods.map((food) => [food.name, food.id]));

  for (const [foodName, minimumSources] of [
    ["깨죽", 1],
    ["들기름", 1],
    ["김치류", 3],
    ["해조류", 3],
    ["버섯류", 3],
    ["미나리", 2],
    ["계란류", 3],
    ["두부류", 3],
    ["국물류", 2],
    ["맑은음료류", 2],
  ] as const) {
    const foodId = foodIdByName.get(foodName);
    assert.ok(foodId, `missing food for source coverage check: ${foodName}`);

    const linkedSources = foodSources.filter((link) => link.foodId === foodId);
    assert.ok(
      linkedSources.length >= minimumSources,
      `expected ${foodName} to have at least ${minimumSources} foodSources but got ${linkedSources.length}`,
    );
  }
});

test("core allowed representative foods keep direct hospital coverage", () => {
  const foodIdByName = new Map(foods.map((food) => [food.name, food.id]));

  for (const [foodName, minimumSources] of [
    ["흰쌀밥", 3],
    ["흰죽", 3],
    ["미음", 3],
    ["카스테라", 2],
    ["식빵", 3],
    ["계란찜", 3],
    ["두부", 3],
    ["바나나", 3],
    ["감자", 3],
    ["맑은육수", 3],
    ["이온음료", 2],
    ["사과주스", 2],
  ] as const) {
    const foodId = foodIdByName.get(foodName);
    assert.ok(foodId, `missing food for allowed direct coverage check: ${foodName}`);

    const linkedSources = foodSources.filter((link) => link.foodId === foodId);
    assert.ok(
      linkedSources.length >= minimumSources,
      `expected ${foodName} to have at least ${minimumSources} foodSources but got ${linkedSources.length}`,
    );
  }
});

test("core restricted food groups keep hospital source coverage", () => {
  const groupIdBySlug = new Map(foodGroups.map((group) => [group.slug, group.id]));

  for (const [groupSlug, minimumSources] of [
    ["seeded-fruit", 3],
    ["seaweed", 3],
    ["whole-grain", 3],
    ["namul", 3],
    ["nuts", 2],
  ] as const) {
    const foodGroupId = groupIdBySlug.get(groupSlug);
    assert.ok(foodGroupId, `missing food group for coverage check: ${groupSlug}`);

    const linkedSources = foodGroupSources.filter((link) => link.foodGroupId === foodGroupId);
    assert.ok(
      linkedSources.length >= minimumSources,
      `expected ${groupSlug} to have at least ${minimumSources} foodGroupSources but got ${linkedSources.length}`,
    );
  }
});

test("core allowed food groups keep hospital source coverage", () => {
  const groupIdBySlug = new Map(foodGroups.map((group) => [group.slug, group.id]));

  for (const [groupSlug, minimumSources] of [
    ["white-porridge", 3],
    ["bread", 3],
    ["soft-protein", 3],
    ["clear-liquid", 3],
  ] as const) {
    const foodGroupId = groupIdBySlug.get(groupSlug);
    assert.ok(foodGroupId, `missing allowed food group for coverage check: ${groupSlug}`);

    const linkedSources = foodGroupSources.filter((link) => link.foodGroupId === foodGroupId);
    assert.ok(
      linkedSources.length >= minimumSources,
      `expected ${groupSlug} to have at least ${minimumSources} foodGroupSources but got ${linkedSources.length}`,
    );
  }
});

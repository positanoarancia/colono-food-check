import assert from "node:assert/strict";
import test from "node:test";

import { matchFoodGroupIndex } from "../src/lib/check-food";

const foodGroups = [
  {
    id: "group_white_porridge",
    slug: "white-porridge",
    name: "흰죽류",
    normalizedName: "흰죽류",
    normalizedMatchNames: ["흰죽류", "흰죽"],
  },
  {
    id: "group_white_rice",
    slug: "white-rice",
    name: "흰밥류",
    normalizedName: "흰밥류",
    normalizedMatchNames: ["흰밥류", "흰밥"],
  },
  {
    id: "group_seeded_fruit",
    slug: "seeded-fruit",
    name: "씨있는과일류",
    normalizedName: "씨있는과일류",
    normalizedMatchNames: ["씨있는과일류", "씨있는과일"],
  },
] as const;

test("single-syllable partial query falls back instead of matching a food group", () => {
  assert.equal(matchFoodGroupIndex("흰", foodGroups as any), null);
});

test("group suffix can be omitted for natural group searches", () => {
  assert.equal(matchFoodGroupIndex("흰죽", foodGroups as any)?.id, "group_white_porridge");
  assert.equal(matchFoodGroupIndex("흰죽류", foodGroups as any)?.id, "group_white_porridge");
  assert.equal(matchFoodGroupIndex("씨있는과일", foodGroups as any)?.id, "group_seeded_fruit");
});

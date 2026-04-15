import { ConfidenceGrade, Prisma, SearchMatchedType } from "@prisma/client";

import {
  SEARCH_MATCH_ORDER,
  mergeCandidateTags,
  resolveJudgement,
  type CandidateTag,
  type ExposedAppliedRule,
  type SearchMatchedType as EngineSearchMatchedType,
  type StageRule,
} from "./judgement-engine";
import { normalizeKoreanText } from "./normalize";
import { prisma } from "./prisma";

export class CheckFoodError extends Error {
  constructor(
    message: string,
    public readonly code: "BAD_REQUEST" | "NOT_FOUND",
  ) {
    super(message);
    this.name = "CheckFoodError";
  }
}

type MatchedEntity =
  | {
      type: "food";
      id: string;
      slug: string;
      name: string;
    }
  | {
      type: "food_alias";
      id: string;
      alias: string;
      canonicalFood: {
        id: string;
        slug: string;
        name: string;
      };
    }
  | {
      type: "food_group";
      id: string;
      slug: string;
      name: string;
    }
  | null;

type FoodWithRelations = Prisma.FoodGetPayload<{
  include: {
    primaryFoodGroup: {
      include: {
        groupTags: {
          include: {
            foodTag: true;
          };
        };
      };
    };
    tagMaps: {
      include: {
        foodTag: true;
      };
    };
    similarFrom: {
      include: {
        similarFood: true;
      };
    };
  };
}>;

type FoodGroupWithRelations = Prisma.FoodGroupGetPayload<{
  include: {
    groupTags: {
      include: {
        foodTag: true;
      };
    };
    foods: true;
  };
}>;

function toCandidateTagsFromFood(food: FoodWithRelations): CandidateTag[] {
  const groupTags = food.primaryFoodGroup.groupTags.map((tag) => ({
    tagId: tag.foodTagId,
    tagSlug: tag.foodTag.slug,
    source: "food_group" as const,
    weight: tag.weight,
    note: tag.note,
  }));

  const foodTags = food.tagMaps.map((tag) => ({
    tagId: tag.foodTagId,
    tagSlug: tag.foodTag.slug,
    source: "food" as const,
    weight: tag.weight,
    note: tag.note,
  }));

  return mergeCandidateTags(foodTags, groupTags);
}

function toCandidateTagsFromFoodGroup(foodGroup: FoodGroupWithRelations): CandidateTag[] {
  return foodGroup.groupTags.map((tag) => ({
    tagId: tag.foodTagId,
    tagSlug: tag.foodTag.slug,
    source: "food_group" as const,
    weight: tag.weight,
    note: tag.note,
  }));
}

async function findExactFood(normalizedQuery: string) {
  return prisma.food.findUnique({
    where: { normalizedName: normalizedQuery },
    include: {
      primaryFoodGroup: {
        include: {
          groupTags: {
            include: {
              foodTag: true,
            },
          },
        },
      },
      tagMaps: {
        include: {
          foodTag: true,
        },
      },
      similarFrom: {
        include: {
          similarFood: true,
        },
      },
    },
  });
}

async function findAlias(normalizedQuery: string) {
  return prisma.foodAlias.findUnique({
    where: { normalizedAlias: normalizedQuery },
    include: {
      food: {
        include: {
          primaryFoodGroup: {
            include: {
              groupTags: {
                include: {
                  foodTag: true,
                },
              },
            },
          },
          tagMaps: {
            include: {
              foodTag: true,
            },
          },
          similarFrom: {
            include: {
              similarFood: true,
            },
          },
        },
      },
    },
  });
}

async function findFoodGroup(normalizedQuery: string) {
  const groups = await prisma.foodGroup.findMany({
    where: {
      isFallbackGroup: false,
    },
    include: {
      groupTags: {
        include: {
          foodTag: true,
        },
      },
      foods: {
        orderBy: [{ isRepresentative: "desc" }, { searchPriority: "desc" }, { name: "asc" }],
        take: 3,
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    groups.find((group: FoodGroupWithRelations) => normalizeKoreanText(group.name) === normalizedQuery) ??
    groups.find((group: FoodGroupWithRelations) => normalizeKoreanText(group.name).includes(normalizedQuery)) ??
    groups.find((group: FoodGroupWithRelations) => normalizedQuery.includes(normalizeKoreanText(group.name)))
  );
}

function buildStageRules(
  rules: Array<{
    foodTagId: string;
    status: "allowed" | "caution" | "avoid";
    rationale: string;
    priority: number;
    foodTag: { slug: string };
  }>,
): StageRule[] {
  return rules.map((rule) => ({
    tagId: rule.foodTagId,
    tagSlug: rule.foodTag.slug,
    status: rule.status,
    rationale: rule.rationale,
    priority: rule.priority,
  }));
}

function engineType(type: SearchMatchedType): EngineSearchMatchedType {
  return SEARCH_MATCH_ORDER.includes(type as EngineSearchMatchedType)
    ? (type as EngineSearchMatchedType)
    : "none";
}

function toUiRule(rule: ExposedAppliedRule) {
  return {
    tagSlug: rule.tagSlug,
    status: rule.status,
    rationale: rule.rationale,
    source: rule.source,
  };
}

export interface CheckFoodResult {
  query: string;
  normalizedQuery: string;
  condition: {
    id: string;
    slug: string;
    name: string;
  };
  dayStage: {
    id: string;
    slug: string;
    name: string;
  };
  matchedType: SearchMatchedType;
  matchedEntity: MatchedEntity;
  status: "allowed" | "caution" | "avoid";
  confidenceGrade: ConfidenceGrade;
  primaryReason: string;
  secondaryReason?: string;
  appliedTagSlugs: string[];
  topAppliedRules: Array<ReturnType<typeof toUiRule>>;
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
}

export async function checkFoodByQuery(input: {
  conditionSlug: string;
  dayStageSlug: string;
  query: string;
}): Promise<CheckFoodResult> {
  if (!input.query.trim()) {
    throw new CheckFoodError("검색어가 비어 있습니다", "BAD_REQUEST");
  }

  const normalizedQuery = normalizeKoreanText(input.query);

  const condition = await prisma.condition.findUnique({
    where: { slug: input.conditionSlug },
  });

  if (!condition || !condition.isActive) {
    throw new CheckFoodError("요청한 condition을 찾을 수 없습니다", "NOT_FOUND");
  }

  const dayStage = await prisma.dayStage.findUnique({
    where: {
      conditionId_slug: {
        conditionId: condition.id,
        slug: input.dayStageSlug,
      },
    },
  });

  if (!dayStage) {
    throw new CheckFoodError("요청한 dayStage를 찾을 수 없습니다", "NOT_FOUND");
  }

  const rules = await prisma.judgementRule.findMany({
    where: { dayStageId: dayStage.id },
    include: {
      foodTag: true,
    },
  });

  const stageRules = buildStageRules(rules);

  let matchedType: SearchMatchedType = "none";
  let matchedEntity: MatchedEntity = null;
  let candidateTags: CandidateTag[] = [];
  let similarFoods: CheckFoodResult["similarFoods"] = [];
  let matchedId: string | null = null;

  const exactFood = normalizedQuery ? await findExactFood(normalizedQuery) : null;

  if (exactFood) {
    matchedType = "exact_food";
    matchedId = exactFood.id;
    matchedEntity = {
      type: "food",
      id: exactFood.id,
      slug: exactFood.slug,
      name: exactFood.name,
    };
    candidateTags = toCandidateTagsFromFood(exactFood);
    similarFoods = exactFood.similarFrom.map((item: FoodWithRelations["similarFrom"][number]) => ({
      id: item.similarFood.id,
      slug: item.similarFood.slug,
      name: item.similarFood.name,
      note: item.note,
    }));
  } else {
    const aliasMatch = normalizedQuery ? await findAlias(normalizedQuery) : null;

    if (aliasMatch) {
      matchedType = "alias";
      matchedId = aliasMatch.id;
      matchedEntity = {
        type: "food_alias",
        id: aliasMatch.id,
        alias: aliasMatch.alias,
        canonicalFood: {
          id: aliasMatch.food.id,
          slug: aliasMatch.food.slug,
          name: aliasMatch.food.name,
        },
      };
      candidateTags = toCandidateTagsFromFood(aliasMatch.food);
      similarFoods = aliasMatch.food.similarFrom.map((item: FoodWithRelations["similarFrom"][number]) => ({
        id: item.similarFood.id,
        slug: item.similarFood.slug,
        name: item.similarFood.name,
        note: item.note,
      }));
    } else {
      const foodGroup = normalizedQuery ? await findFoodGroup(normalizedQuery) : null;

      if (foodGroup) {
        matchedType = "food_group";
        matchedId = foodGroup.id;
        matchedEntity = {
          type: "food_group",
          id: foodGroup.id,
          slug: foodGroup.slug,
          name: foodGroup.name,
        };
        candidateTags = toCandidateTagsFromFoodGroup(foodGroup);
        similarFoods = foodGroup.foods.map((food: FoodGroupWithRelations["foods"][number]) => ({
          id: food.id,
          slug: food.slug,
          name: food.name,
          note: "같은 음식군에서 자주 검색되는 대표 음식입니다.",
        }));
      } else {
        matchedType = normalizedQuery ? "fallback" : "none";
      }
    }
  }

  const judgement = resolveJudgement({
    matchedType: engineType(matchedType),
    tags: candidateTags,
    rules: stageRules,
  });

  const recommendedMenus = await prisma.recommendedMenu.findMany({
    where: {
      conditionId: condition.id,
      dayStageId: dayStage.id,
    },
    include: {
      menuFoods: {
        include: {
          food: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const logMetadata: Prisma.JsonObject = {
    appliedTagSlugs: judgement.appliedTagSlugs,
    topAppliedRules: judgement.topAppliedRules.map((rule) => ({
      tagSlug: rule.tagSlug,
      status: rule.status,
      rationale: rule.rationale,
      source: rule.source,
    })),
    matchedEntityType: matchedEntity?.type ?? null,
    fallbackReasonUsed: judgement.usedFallbackReason,
  };

  await prisma.searchLog.create({
    data: {
      query: input.query,
      normalizedQuery,
      conditionId: condition.id,
      dayStageId: dayStage.id,
      matchedType,
      matchedId,
      resultStatus: judgement.status,
      confidenceGrade: judgement.confidenceGrade,
      metadata: logMetadata,
    },
  });

  return {
    query: input.query,
    normalizedQuery,
    condition: {
      id: condition.id,
      slug: condition.slug,
      name: condition.name,
    },
    dayStage: {
      id: dayStage.id,
      slug: dayStage.slug,
      name: dayStage.name,
    },
    matchedType,
    matchedEntity,
    status: judgement.status,
    confidenceGrade: judgement.confidenceGrade,
    primaryReason: judgement.primaryReason,
    secondaryReason: judgement.secondaryReason,
    appliedTagSlugs: judgement.appliedTagSlugs,
    topAppliedRules: judgement.topAppliedRules.map(toUiRule),
    similarFoods,
    recommendedMenus: recommendedMenus.map((menu) => ({
      id: menu.id,
      slug: menu.slug,
      name: menu.name,
      mealType: menu.mealType,
      description: menu.description,
      foods: menu.menuFoods.map((menuFood) => ({
        id: menuFood.food.id,
        name: menuFood.food.name,
        roleLabel: menuFood.roleLabel,
        quantityNote: menuFood.quantityNote,
      })),
    })),
  };
}

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

function serializeError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta,
      clientVersion: error.clientVersion,
      stack: error.stack,
    };
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      name: error.name,
      message: error.message,
      errorCode: error.errorCode,
      clientVersion: error.clientVersion,
      stack: error.stack,
    };
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return {
      name: error.name,
      message: error.message,
      clientVersion: error.clientVersion,
      stack: error.stack,
    };
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return {
      name: error.name,
      message: error.message,
      clientVersion: error.clientVersion,
      stack: error.stack,
    };
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      name: error.name,
      message: error.message,
      clientVersion: error.clientVersion,
      stack: error.stack,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    value: String(error),
  };
}

function logCheckFood(step: string, payload: Record<string, unknown>) {
  console.log(`[checkFoodByQuery] ${step}`, payload);
}

async function measureStep<T>(
  step: string,
  requestContext: Record<string, unknown>,
  timings: Record<string, number>,
  fn: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();
  const result = await fn();
  const durationMs = Date.now() - startedAt;
  timings[step] = durationMs;
  logCheckFood("timing", {
    ...requestContext,
    step,
    durationMs,
  });
  return result;
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

type FoodForMatch = Prisma.FoodGetPayload<{
  include: {
    primaryFoodGroup: {
      include: {
        groupTags: {
          include: {
            foodTag: true;
          };
        };
        foodGroupSources: {
          include: {
            source: true;
          };
        };
      };
    };
    tagMaps: {
      include: {
        foodTag: true;
      };
    };
    sourceLinks: {
      include: {
        source: true;
      };
    };
  };
}>;

type AliasMatch = Prisma.FoodAliasGetPayload<{
  include: {
    food: {
      include: {
        primaryFoodGroup: {
          include: {
            groupTags: {
              include: {
                foodTag: true;
              };
            };
            foodGroupSources: {
              include: {
                source: true;
              };
            };
          };
        };
        tagMaps: {
          include: {
            foodTag: true;
          };
        };
        sourceLinks: {
          include: {
            source: true;
          };
        };
      };
    };
  };
}>;

type SimilarFoodRow = Prisma.FoodSimilarityGetPayload<{
  include: {
    similarFood: true;
  };
}>;

type FoodGroupDetail = Prisma.FoodGroupGetPayload<{
  include: {
    groupTags: {
      include: {
        foodTag: true;
      };
    };
    foodGroupSources: {
      include: {
        source: true;
      };
    };
  };
}>;

type FoodGroupRepresentative = Prisma.FoodGetPayload<{
  select: {
    id: true;
    slug: true;
    name: true;
  };
}>;

type RecommendedMenuWithFoods = Prisma.RecommendedMenuGetPayload<{
  include: {
    menuFoods: {
      include: {
        food: true;
      };
      orderBy: {
        sortOrder: "asc";
      };
    };
  };
}>;

type ConditionCacheValue = {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
};

type DayStageCacheValue = {
  dayStage: {
    id: string;
    slug: string;
    name: string;
    daysBefore: number | null;
  };
  stageRules: StageRule[];
};

type FoodGroupIndexEntry = {
  id: string;
  slug: string;
  name: string;
  normalizedName: string;
  normalizedMatchNames: string[];
};

const staticCache = {
  conditions: new Map<string, ConditionCacheValue>(),
  stageBundles: new Map<string, DayStageCacheValue>(),
  recommendedMenus: new Map<string, RecommendedMenuWithFoods[]>(),
  foodGroupIndex: null as FoodGroupIndexEntry[] | null,
};

function toCandidateTagsFromFood(food: FoodForMatch): CandidateTag[] {
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

function toCandidateTagsFromFoodGroup(foodGroup: FoodGroupDetail): CandidateTag[] {
  return foodGroup.groupTags.map((tag) => ({
    tagId: tag.foodTagId,
    tagSlug: tag.foodTag.slug,
    source: "food_group" as const,
    weight: tag.weight,
    note: tag.note,
  }));
}

function dedupeReferences<T extends { label: string; url: string }>(references: T[]) {
  return references.filter(
    (reference, index, array) =>
      array.findIndex(
        (candidate) =>
          candidate.url === reference.url || candidate.label === reference.label,
      ) === index,
  );
}

function distributeUniqueReferencesAcrossRules<
  T extends { references: Array<{ label: string; url: string }> },
>(rules: T[]) {
  const seenKeys = new Set<string>();

  return rules.map((rule) => ({
    ...rule,
    references: rule.references.filter((reference) => {
      const key = reference.url || reference.label;
      if (seenKeys.has(key)) {
        return false;
      }

      seenKeys.add(key);
      return true;
    }),
  }));
}

function getFoodDirectReferences(food: FoodForMatch | AliasMatch["food"]) {
  return dedupeReferences(
    [
      ...food.sourceLinks
        .map((link) => {
          if (!link.source.url) {
            return null;
          }

          return {
            label: link.source.name,
            url: link.source.url,
          };
        })
        .filter((value): value is { label: string; url: string } => Boolean(value)),
      ...food.primaryFoodGroup.foodGroupSources
        .map((link) => {
          if (!link.source.url) {
            return null;
          }

          return {
            label: link.source.name,
            url: link.source.url,
          };
        })
        .filter((value): value is { label: string; url: string } => Boolean(value)),
    ],
  );
}

function getFoodGroupDirectReferences(foodGroup: FoodGroupDetail) {
  return dedupeReferences(
    foodGroup.foodGroupSources
      .map((link) => {
        if (!link.source.url) {
          return null;
        }

        return {
          label: link.source.name,
          url: link.source.url,
        };
      })
      .filter((value): value is { label: string; url: string } => Boolean(value)),
  );
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
          foodGroupSources: {
            include: {
              source: true,
            },
          },
        },
      },
      tagMaps: {
        include: {
          foodTag: true,
        },
      },
      sourceLinks: {
        include: {
          source: true,
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
              foodGroupSources: {
                include: {
                  source: true,
                },
              },
            },
          },
          tagMaps: {
            include: {
              foodTag: true,
            },
          },
          sourceLinks: {
            include: {
              source: true,
            },
          },
        },
      },
    },
  });
}

async function getFoodGroupIndex(
  requestContext: Record<string, unknown>,
  timings: Record<string, number>,
): Promise<FoodGroupIndexEntry[]> {
  if (staticCache.foodGroupIndex) {
    logCheckFood("cache.hit", {
      ...requestContext,
      cacheKey: "foodGroupIndex",
      itemCount: staticCache.foodGroupIndex.length,
    });
    return staticCache.foodGroupIndex;
  }

  const groups = await measureStep("food_group_index_query", requestContext, timings, async () =>
    prisma.foodGroup.findMany({
      where: { isFallbackGroup: false },
      select: {
        id: true,
        slug: true,
        name: true,
      },
      orderBy: { sortOrder: "asc" },
    }),
  );

  staticCache.foodGroupIndex = groups.map((group) => ({
    ...group,
    normalizedName: normalizeKoreanText(group.name),
    normalizedMatchNames: getFoodGroupMatchNames(group.name),
  }));

  return staticCache.foodGroupIndex;
}

function getFoodGroupMatchNames(groupName: string): string[] {
  const normalizedName = normalizeKoreanText(groupName);
  const trimmedName = normalizedName.replace(/(류|군)$/u, "");

  return [...new Set([normalizedName, trimmedName].filter(Boolean))];
}

export function matchFoodGroupIndex(
  normalizedQuery: string,
  groups: FoodGroupIndexEntry[],
): FoodGroupIndexEntry | null {
  return groups.find((group) => group.normalizedMatchNames.includes(normalizedQuery)) ?? null;
}

async function findFoodGroupDetail(foodGroupId: string) {
  return prisma.foodGroup.findUnique({
    where: { id: foodGroupId },
    include: {
      groupTags: {
        include: {
          foodTag: true,
        },
      },
      foodGroupSources: {
        include: {
          source: true,
        },
      },
    },
  });
}

async function findFoodGroupRepresentatives(foodGroupId: string) {
  return prisma.food.findMany({
    where: { primaryFoodGroupId: foodGroupId },
    select: {
      id: true,
      slug: true,
      name: true,
    },
    orderBy: [{ isRepresentative: "desc" }, { searchPriority: "desc" }, { name: "asc" }],
    take: 3,
  });
}

async function findSimilarFoods(foodId: string) {
  return prisma.foodSimilarity.findMany({
    where: { baseFoodId: foodId },
    include: {
      similarFood: true,
    },
    orderBy: [{ score: "desc" }, { similarFood: { name: "asc" } }],
    take: 6,
  });
}

function buildStageRules(
  rules: Array<{
    id: string;
    foodTagId: string;
    status: "allowed" | "caution" | "avoid";
    rationale: string;
    priority: number;
    foodTag: { slug: string };
    sourceLinks: Array<{
      source: {
        name: string;
        publisher: string | null;
        url: string | null;
      };
    }>;
  }>,
): StageRule[] {
  return rules.map((rule) => ({
    id: rule.id,
    tagId: rule.foodTagId,
    tagSlug: rule.foodTag.slug,
    status: rule.status,
    rationale: rule.rationale,
    priority: rule.priority,
    references: dedupeReferences(
      rule.sourceLinks
        .map((link) => {
          if (!link.source.url) {
            return null;
          }

          return {
            label: link.source.name,
            url: link.source.url,
          };
        })
        .filter(
          (
            value,
          ): value is {
            label: string;
            url: string;
          } => Boolean(value),
        ),
    ),
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
    references: rule.references,
  };
}

async function getConditionBySlug(
  conditionSlug: string,
  requestContext: Record<string, unknown>,
  timings: Record<string, number>,
) {
  const cached = staticCache.conditions.get(conditionSlug);
  if (cached) {
    logCheckFood("cache.hit", {
      ...requestContext,
      cacheKey: "condition",
      conditionSlug,
    });
    return cached;
  }

  const condition = await measureStep("condition_query", requestContext, timings, async () =>
    prisma.condition.findUnique({
      where: { slug: conditionSlug },
      select: {
        id: true,
        slug: true,
        name: true,
        isActive: true,
      },
    }),
  );

  if (condition) {
    staticCache.conditions.set(conditionSlug, condition);
  }

  return condition;
}

async function getStageBundle(
  conditionId: string,
  dayStageSlug: string,
  requestContext: Record<string, unknown>,
  timings: Record<string, number>,
) {
  const cacheKey = `${conditionId}:${dayStageSlug}`;
  const cached = staticCache.stageBundles.get(cacheKey);

  if (cached) {
    logCheckFood("cache.hit", {
      ...requestContext,
      cacheKey: "stageBundle",
      stageBundleKey: cacheKey,
    });
    return cached;
  }

  const dayStage = await measureStep("day_stage_query", requestContext, timings, async () =>
    prisma.dayStage.findUnique({
      where: {
        conditionId_slug: {
          conditionId,
          slug: dayStageSlug,
        },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        daysBefore: true,
      },
    }),
  );

  if (!dayStage) {
    return null;
  }

  const rules = await measureStep("rule_query", requestContext, timings, async () =>
      prisma.judgementRule.findMany({
        where: { dayStageId: dayStage.id },
        include: {
          foodTag: true,
          sourceLinks: {
            include: {
              source: {
                select: {
                  name: true,
                  publisher: true,
                  url: true,
                },
              },
            },
          },
        },
      }),
  );

  const bundle = {
    dayStage,
    stageRules: buildStageRules(rules),
  };

  staticCache.stageBundles.set(cacheKey, bundle);
  return bundle;
}

async function getRecommendedMenus(
  conditionId: string,
  dayStageId: string,
  requestContext: Record<string, unknown>,
  timings: Record<string, number>,
) {
  const cacheKey = `${conditionId}:${dayStageId}`;
  const cached = staticCache.recommendedMenus.get(cacheKey);

  if (cached) {
    logCheckFood("cache.hit", {
      ...requestContext,
      cacheKey: "recommendedMenus",
      recommendedMenusKey: cacheKey,
      itemCount: cached.length,
    });
    return cached;
  }

  const recommendedMenus = await measureStep(
    "recommended_menus_query",
    requestContext,
    timings,
    async () =>
      prisma.recommendedMenu.findMany({
        where: {
          conditionId,
          dayStageId,
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
      }),
  );

  staticCache.recommendedMenus.set(cacheKey, recommendedMenus);
  return recommendedMenus;
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

export interface PrewarmResult {
  conditionSlug: string;
  conditionId: string;
  dayStages: Array<{
    id: string;
    slug: string;
    name: string;
    recommendedMenuCount: number;
    ruleCount: number;
  }>;
  timings: Record<string, number>;
  totalDurationMs: number;
}

export async function prewarmCheckFood(input: {
  conditionSlug: string;
}): Promise<PrewarmResult> {
  const startedAt = Date.now();
  const requestContext = {
    conditionSlug: input.conditionSlug,
    mode: "prewarm",
  };
  const timings: Record<string, number> = {};

  logCheckFood("prewarm.start", requestContext);

  try {
    await measureStep("db_connect", requestContext, timings, async () => prisma.$connect());

    const condition = await getConditionBySlug(input.conditionSlug, requestContext, timings);

    logCheckFood("prewarm.condition.result", {
      ...requestContext,
      conditionFound: Boolean(condition),
      condition,
    });

    if (!condition || !condition.isActive) {
      throw new CheckFoodError("요청한 condition을 찾을 수 없습니다", "NOT_FOUND");
    }

    const dayStages = await measureStep("prewarm_day_stages_query", requestContext, timings, async () =>
      prisma.dayStage.findMany({
        where: { conditionId: condition.id },
        select: {
          id: true,
          slug: true,
          name: true,
        },
        orderBy: { sequence: "asc" },
      }),
    );

    const warmedDayStages = await Promise.all(
      dayStages.map(async (dayStage) => {
        const stageRequestContext = {
          ...requestContext,
          dayStageSlug: dayStage.slug,
        };
        const stageBundle = await getStageBundle(
          condition.id,
          dayStage.slug,
          stageRequestContext,
          timings,
        );

        if (!stageBundle) {
          throw new CheckFoodError("요청한 dayStage를 찾을 수 없습니다", "NOT_FOUND");
        }

        const recommendedMenus = await getRecommendedMenus(
          condition.id,
          stageBundle.dayStage.id,
          stageRequestContext,
          timings,
        );

        return {
          id: stageBundle.dayStage.id,
          slug: stageBundle.dayStage.slug,
          name: stageBundle.dayStage.name,
          recommendedMenuCount: recommendedMenus.length,
          ruleCount: stageBundle.stageRules.length,
        };
      }),
    );

    const totalDurationMs = Date.now() - startedAt;
    const slowSteps = Object.entries(timings)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([step, durationMs]) => ({ step, durationMs }));

    logCheckFood("prewarm.summary", {
      ...requestContext,
      totalDurationMs,
      timings,
      slowSteps,
      dayStages: warmedDayStages,
    });

    return {
      conditionSlug: condition.slug,
      conditionId: condition.id,
      dayStages: warmedDayStages,
      timings,
      totalDurationMs,
    };
  } catch (error) {
    logCheckFood("prewarm.error", {
      ...requestContext,
      durationMs: Date.now() - startedAt,
      error: serializeError(error),
    });
    throw error;
  }
}

export async function checkFoodByQuery(input: {
  conditionSlug: string;
  dayStageSlug: string;
  query: string;
}): Promise<CheckFoodResult> {
  if (!input.query.trim()) {
    throw new CheckFoodError("검색어가 비어 있습니다", "BAD_REQUEST");
  }

  const startedAt = Date.now();
  const normalizedQuery = normalizeKoreanText(input.query);
  const requestContext = {
    conditionSlug: input.conditionSlug,
    dayStageSlug: input.dayStageSlug,
    query: input.query,
    normalizedQuery,
  };
  const timings: Record<string, number> = {};

  logCheckFood("start", requestContext);

  try {
    const condition = await getConditionBySlug(input.conditionSlug, requestContext, timings);

    logCheckFood("condition.result", {
      ...requestContext,
      conditionFound: Boolean(condition),
      condition,
    });

    if (!condition || !condition.isActive) {
      throw new CheckFoodError("요청한 condition을 찾을 수 없습니다", "NOT_FOUND");
    }

    const stageBundle = await getStageBundle(
      condition.id,
      input.dayStageSlug,
      requestContext,
      timings,
    );

    logCheckFood("dayStage.result", {
      ...requestContext,
      conditionId: condition.id,
      dayStageFound: Boolean(stageBundle?.dayStage),
      dayStage: stageBundle?.dayStage ?? null,
    });

    if (!stageBundle) {
      throw new CheckFoodError("요청한 dayStage를 찾을 수 없습니다", "NOT_FOUND");
    }

    logCheckFood("rules.result", {
      ...requestContext,
      dayStageId: stageBundle.dayStage.id,
      ruleCount: stageBundle.stageRules.length,
      sampleRuleSlugs: stageBundle.stageRules.slice(0, 5).map((rule) => rule.tagSlug),
    });

    const recommendedMenusPromise = getRecommendedMenus(
      condition.id,
      stageBundle.dayStage.id,
      requestContext,
      timings,
    );

    let matchedType: SearchMatchedType = "none";
    let matchedEntity: MatchedEntity = null;
    let candidateTags: CandidateTag[] = [];
    let similarFoods: CheckFoodResult["similarFoods"] = [];
    let matchedId: string | null = null;
    let matchedFoodId: string | null = null;
    let directReferences: Array<{ label: string; url: string }> = [];

    const [exactFood, aliasMatch] = normalizedQuery
      ? await Promise.all([
          measureStep("exact_food_query", requestContext, timings, async () =>
            findExactFood(normalizedQuery),
          ),
          measureStep("alias_query", requestContext, timings, async () => findAlias(normalizedQuery)),
        ])
      : [null, null];

    logCheckFood("exactFood.result", {
      ...requestContext,
      found: Boolean(exactFood),
      food: exactFood
        ? {
            id: exactFood.id,
            slug: exactFood.slug,
            name: exactFood.name,
            primaryFoodGroupId: exactFood.primaryFoodGroupId,
          }
        : null,
    });

    logCheckFood("alias.result", {
      ...requestContext,
      found: Boolean(aliasMatch),
      alias: aliasMatch
        ? {
            id: aliasMatch.id,
            alias: aliasMatch.alias,
            foodId: aliasMatch.food.id,
            canonicalFoodName: aliasMatch.food.name,
          }
        : null,
    });

    if (exactFood) {
      matchedType = "exact_food";
      matchedId = exactFood.id;
      matchedFoodId = exactFood.id;
      matchedEntity = {
        type: "food",
        id: exactFood.id,
        slug: exactFood.slug,
        name: exactFood.name,
      };
      directReferences = getFoodDirectReferences(exactFood);
      candidateTags = await measureStep("tag_lookup", requestContext, timings, async () =>
        Promise.resolve(toCandidateTagsFromFood(exactFood)),
      );
    } else if (aliasMatch) {
      matchedType = "alias";
      matchedId = aliasMatch.id;
      matchedFoodId = aliasMatch.food.id;
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
      directReferences = getFoodDirectReferences(aliasMatch.food);
      candidateTags = await measureStep("tag_lookup", requestContext, timings, async () =>
        Promise.resolve(toCandidateTagsFromFood(aliasMatch.food)),
      );
    } else {
      const foodGroupIndex = normalizedQuery ? await getFoodGroupIndex(requestContext, timings) : [];
      const foodGroupMatch = normalizedQuery ? matchFoodGroupIndex(normalizedQuery, foodGroupIndex) : null;

      if (foodGroupMatch) {
        const [foodGroup, representatives] = await Promise.all([
          measureStep("food_group_query", requestContext, timings, async () =>
            findFoodGroupDetail(foodGroupMatch.id),
          ),
          measureStep("food_group_representatives_query", requestContext, timings, async () =>
            findFoodGroupRepresentatives(foodGroupMatch.id),
          ),
        ]);

        logCheckFood("foodGroup.result", {
          ...requestContext,
          found: Boolean(foodGroup),
          foodGroup: foodGroup
            ? {
                id: foodGroup.id,
                slug: foodGroup.slug,
                name: foodGroup.name,
                isFallbackGroup: foodGroup.isFallbackGroup,
              }
            : null,
        });

        if (foodGroup) {
          matchedType = "food_group";
          matchedId = foodGroup.id;
          matchedEntity = {
            type: "food_group",
            id: foodGroup.id,
            slug: foodGroup.slug,
            name: foodGroup.name,
          };
          directReferences = getFoodGroupDirectReferences(foodGroup);
          candidateTags = await measureStep("tag_lookup", requestContext, timings, async () =>
            Promise.resolve(toCandidateTagsFromFoodGroup(foodGroup)),
          );
          similarFoods = representatives.map((food: FoodGroupRepresentative) => ({
            id: food.id,
            slug: food.slug,
            name: food.name,
            note: "같은 음식군에서 자주 검색되는 대표 음식입니다.",
          }));
        } else {
          matchedType = normalizedQuery ? "fallback" : "none";
        }
      } else {
        logCheckFood("foodGroup.result", {
          ...requestContext,
          found: false,
          foodGroup: null,
        });
        matchedType = normalizedQuery ? "fallback" : "none";
      }
    }

    if (matchedFoodId) {
      const similarRows = await measureStep("similar_foods_query", requestContext, timings, async () =>
        findSimilarFoods(matchedFoodId),
      );

      similarFoods = similarRows.map((item: SimilarFoodRow) => ({
        id: item.similarFood.id,
        slug: item.similarFood.slug,
        name: item.similarFood.name,
        note: item.note,
      }));
    } else if (!similarFoods.length) {
      await measureStep("similar_foods_query", requestContext, timings, async () =>
        Promise.resolve([]),
      );
    }

    logCheckFood("match.summary", {
      ...requestContext,
      matchedType,
      matchedId,
      matchedEntity,
      candidateTagSlugs: candidateTags.map((tag) => tag.tagSlug),
      similarFoodCount: similarFoods.length,
    });

    const judgement = resolveJudgement({
      matchedType: engineType(matchedType),
      tags: candidateTags,
      rules: stageBundle.stageRules,
    });
    const topAppliedRules = distributeUniqueReferencesAcrossRules(
      judgement.topAppliedRules.map((rule) => ({
        ...rule,
        references: dedupeReferences([...directReferences, ...rule.references]),
      })),
    );

    logCheckFood("judgement.result", {
      ...requestContext,
      matchedType,
      status: judgement.status,
      confidenceGrade: judgement.confidenceGrade,
      appliedTagSlugs: judgement.appliedTagSlugs,
      topAppliedRules,
      usedFallbackReason: judgement.usedFallbackReason,
    });

    const recommendedMenus = await recommendedMenusPromise;

    logCheckFood("recommendedMenus.result", {
      ...requestContext,
      menuCount: recommendedMenus.length,
      menuSlugs: recommendedMenus.map((menu) => menu.slug),
    });

    const logMetadata: Prisma.JsonObject = {
      appliedTagSlugs: judgement.appliedTagSlugs,
      topAppliedRules: topAppliedRules.map((rule) => ({
        tagSlug: rule.tagSlug,
        status: rule.status,
        rationale: rule.rationale,
        source: rule.source,
        references: rule.references,
      })),
      matchedEntityType: matchedEntity?.type ?? null,
      fallbackReasonUsed: judgement.usedFallbackReason,
    };

    void measureStep("search_log_insert", requestContext, timings, async () =>
      prisma.searchLog.create({
        data: {
          query: input.query,
          normalizedQuery,
          conditionId: condition.id,
          dayStageId: stageBundle.dayStage.id,
          matchedType,
          matchedId,
          resultStatus: judgement.status,
          confidenceGrade: judgement.confidenceGrade,
          metadata: logMetadata,
        },
      }),
    )
      .then(() => {
        logCheckFood("searchLog.created", {
          ...requestContext,
          matchedType,
          matchedId,
          resultStatus: judgement.status,
          confidenceGrade: judgement.confidenceGrade,
        });
      })
      .catch((error) => {
        logCheckFood("searchLog.error", {
          ...requestContext,
          error: serializeError(error),
        });
      });

    logCheckFood("total.duration", {
      ...requestContext,
      durationMs: Date.now() - startedAt,
    });

    const slowSteps = Object.entries(timings)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([step, durationMs]) => ({ step, durationMs }));

    logCheckFood("profile.summary", {
      ...requestContext,
      totalDurationMs: Date.now() - startedAt,
      timings,
      slowSteps,
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
        id: stageBundle.dayStage.id,
        slug: stageBundle.dayStage.slug,
        name: stageBundle.dayStage.name,
      },
      matchedType,
      matchedEntity,
      status: judgement.status,
      confidenceGrade: judgement.confidenceGrade,
      primaryReason: judgement.primaryReason,
      secondaryReason: judgement.secondaryReason,
      appliedTagSlugs: judgement.appliedTagSlugs,
      topAppliedRules: topAppliedRules.map(toUiRule),
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
  } catch (error) {
    logCheckFood("error", {
      ...requestContext,
      durationMs: Date.now() - startedAt,
      error: serializeError(error),
    });
    throw error;
  }
}

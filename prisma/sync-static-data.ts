import { PrismaClient } from "@prisma/client";

import {
  condition,
  dayStages,
  foodAliases,
  foodGroupSources,
  foodGroupTags,
  foodGroups,
  foods,
  foodSimilarities,
  foodSources,
  foodTagMaps,
  foodTags,
  judgementRules,
  recommendedMenuFoods,
  recommendedMenus,
  ruleSources,
  sources,
} from "./seed";

const prisma = new PrismaClient();

async function main() {
  await prisma.condition.upsert({
    where: { slug: condition.slug },
    update: {
      name: condition.name,
      description: condition.description,
      isActive: true,
    },
    create: condition,
  });

  for (const stage of dayStages) {
    await prisma.dayStage.upsert({
      where: {
        conditionId_slug: {
          conditionId: stage.conditionId,
          slug: stage.slug,
        },
      },
      update: {
        name: stage.name,
        sequence: stage.sequence,
        daysBefore: stage.daysBefore,
        description: stage.description,
      },
      create: stage,
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.ruleSource.deleteMany();
    await tx.foodGroupSource.deleteMany();
    await tx.foodSource.deleteMany();
    await tx.recommendedMenuFood.deleteMany();
    await tx.recommendedMenu.deleteMany();
    await tx.foodSimilarity.deleteMany();
    await tx.judgementRule.deleteMany();
    await tx.foodTagMap.deleteMany();
    await tx.foodAlias.deleteMany();
    await tx.food.deleteMany();
    await tx.foodGroupTag.deleteMany();
    await tx.source.deleteMany();
    await tx.foodTag.deleteMany();
    await tx.foodGroup.deleteMany();

    await tx.foodGroup.createMany({ data: foodGroups });
    await tx.foodTag.createMany({ data: foodTags });
    await tx.foodGroupTag.createMany({ data: foodGroupTags });
    await tx.food.createMany({ data: foods });
    await tx.foodAlias.createMany({ data: foodAliases });
    await tx.foodTagMap.createMany({ data: foodTagMaps });
    await tx.judgementRule.createMany({ data: judgementRules });
    await tx.foodSimilarity.createMany({ data: foodSimilarities });
    await tx.recommendedMenu.createMany({ data: recommendedMenus });
    await tx.recommendedMenuFood.createMany({ data: recommendedMenuFoods });
    await tx.source.createMany({ data: sources });
    await tx.foodSource.createMany({ data: foodSources });
    await tx.foodGroupSource.createMany({ data: foodGroupSources });
    await tx.ruleSource.createMany({ data: ruleSources });
  });

  console.log("Static sync completed");
  console.log(`dayStages: ${dayStages.length}`);
  console.log(`foodGroups: ${foodGroups.length}`);
  console.log(`foodTags: ${foodTags.length}`);
  console.log(`foods: ${foods.length}`);
  console.log(`aliases: ${foodAliases.length}`);
  console.log(`rules: ${judgementRules.length}`);
  console.log(`sources: ${sources.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ReportRow = {
  normalizedQuery: string;
  total: bigint;
  fallbackCount: bigint;
  confidenceCCount: bigint;
  lastSearchedAt: Date;
  stageSummary: string;
};

async function main() {
  const limit = Number(process.argv[2] ?? 50);

  const rows = (await prisma.$queryRawUnsafe(`
    select
      s."normalizedQuery",
      count(*)::bigint as total,
      count(*) filter (where s."matchedType" = 'fallback')::bigint as "fallbackCount",
      count(*) filter (where s."confidenceGrade" = 'C')::bigint as "confidenceCCount",
      max(s."createdAt") as "lastSearchedAt",
      string_agg(distinct ds.slug, ', ' order by ds.slug) as "stageSummary"
    from "SearchLog" s
    left join "DayStage" ds on ds.id = s."dayStageId"
    where s."matchedType" in ('fallback', 'none')
       or s."confidenceGrade" = 'C'
    group by s."normalizedQuery"
    order by total desc, "lastSearchedAt" desc
    limit ${Number.isFinite(limit) ? limit : 50}
  `)) as ReportRow[];

  if (!rows.length) {
    console.log("No fallback or confidence C search logs found.");
    return;
  }

  const report = rows.map((row, index) => ({
    rank: index + 1,
    query: row.normalizedQuery,
    total: Number(row.total),
    fallbackCount: Number(row.fallbackCount),
    confidenceCCount: Number(row.confidenceCCount),
    stages: row.stageSummary || "-",
    lastSearchedAt: row.lastSearchedAt.toISOString(),
  }));

  console.table(report);

  console.log("\nTop candidates:");
  for (const item of report.slice(0, 20)) {
    console.log(
      `- ${item.rank}. ${item.query} (total ${item.total}, fallback ${item.fallbackCount}, C ${item.confidenceCCount}, stages: ${item.stages})`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";

import { CheckFoodError, prewarmCheckFood } from "../../lib/check-food";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startedAt = Date.now();

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      error: "GET 메서드만 지원합니다",
      detail: "Method not allowed",
    });
  }

  const condition = typeof req.query.condition === "string" ? req.query.condition : "colonoscopy";

  console.log("[api/prewarm] request", {
    method: req.method,
    condition,
  });

  try {
    const result = await prewarmCheckFood({
      conditionSlug: condition,
    });

    console.log("[api/prewarm] success", {
      condition,
      durationMs: Date.now() - startedAt,
      dayStages: result.dayStages.map((dayStage) => ({
        slug: dayStage.slug,
        ruleCount: dayStage.ruleCount,
        recommendedMenuCount: dayStage.recommendedMenuCount,
      })),
      timings: result.timings,
    });

    return res.status(200).json({
      ok: true,
      ...result,
    });
  } catch (error) {
    if (error instanceof CheckFoodError) {
      const statusCode = error.code === "BAD_REQUEST" ? 400 : 404;
      console.error("[api/prewarm] known-error", {
        condition,
        code: error.code,
        message: error.message,
        durationMs: Date.now() - startedAt,
      });
      return res.status(statusCode).json({
        error: error.message,
        detail: error.code,
      });
    }

    console.error("[api/prewarm] unknown-error", {
      condition,
      durationMs: Date.now() - startedAt,
      error:
        error instanceof Prisma.PrismaClientKnownRequestError
          ? {
              name: error.name,
              message: error.message,
              code: error.code,
              meta: error.meta,
              clientVersion: error.clientVersion,
              stack: error.stack,
            }
          : error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : String(error),
    });
    return res.status(500).json({
      error: "서버 내부 오류가 발생했습니다",
      detail: "Internal server error",
    });
  }
}

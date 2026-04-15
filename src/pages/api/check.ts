import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";

import { CheckFoodError, checkFoodByQuery } from "../../lib/check-food";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      error: "GET 메서드만 지원합니다",
      detail: "Method not allowed",
    });
  }

  const condition = typeof req.query.condition === "string" ? req.query.condition : "";
  const dayStage = typeof req.query.dayStage === "string" ? req.query.dayStage : "";
  const query = typeof req.query.query === "string" ? req.query.query : "";

  console.log("[api/check] request", {
    method: req.method,
    condition,
    dayStage,
    query,
  });

  if (!condition || !dayStage || !query) {
    return res.status(400).json({
      error: "condition, dayStage, query 파라미터가 필요합니다",
      detail: "Missing required query parameters",
      required: ["condition", "dayStage", "query"],
    });
  }

  try {
    const result = await checkFoodByQuery({
      conditionSlug: condition,
      dayStageSlug: dayStage,
      query,
    });

    console.log("[api/check] success", {
      condition,
      dayStage,
      query,
      matchedType: result.matchedType,
      status: result.status,
      confidenceGrade: result.confidenceGrade,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof CheckFoodError) {
      const statusCode = error.code === "BAD_REQUEST" ? 400 : 404;
      console.error("[api/check] known-error", {
        condition,
        dayStage,
        query,
        code: error.code,
        message: error.message,
      });
      return res.status(statusCode).json({
        error: error.message,
        detail: error.code,
      });
    }

    console.error("[api/check] unknown-error", {
      condition,
      dayStage,
      query,
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
